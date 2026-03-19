# 🔍 Análisis Completo - Parte 1: Problemas CRÍTICOS

**Fecha:** 13 de Marzo, 2026  
**Prioridad:** 🔴 CRÍTICA - Acción Inmediata Requerida

---

## 📊 Resumen

| Problema                      | Impacto | Esfuerzo | Archivo                                 |
| ----------------------------- | ------- | -------- | --------------------------------------- |
| Python/PDF sin protección JWT | CRÍTICO | 5 min    | python.controller.ts, pdf.controller.ts |
| CORS abierto a todos          | CRÍTICO | 10 min   | main.ts                                 |
| Sin Rate Limiting             | CRÍTICO | 30 min   | app.module.ts                           |
| Sin sanitización de inputs    | CRÍTICO | 1h       | python.controller.ts                    |
| Sin validación en PDF         | CRÍTICO | 30 min   | pdf.controller.ts                       |

**Total:** 5 problemas críticos, ~2.5 horas para resolver

---

## 🔴 1. Python y PDF Controllers Sin Protección JWT

**Archivos:**

- `nest-ui-be/src/python/python.controller.ts`
- `nest-ui-be/src/pdf/pdf.controller.ts`

**Problema:**
Los controladores de Python y PDF NO tienen protección JWT. Cualquiera puede:

- Ejecutar scripts Python arbitrarios
- Ejecutar archivos .exe
- Generar PDFs sin límite
- Consumir recursos del servidor

**Código actual:**

```typescript
@Controller("python")
export class PythonController {
  // ❌ Sin @UseGuards(JwtAuthGuard)

  @Post("execute-file")
  async executeFile(@Body() body: { fileName: string; args?: string[] }) {
    // Ejecuta archivos sin autenticación
  }
}
```

**Solución:**

```typescript
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("python")
@UseGuards(JwtAuthGuard) // ✅ Proteger TODAS las rutas
export class PythonController {
  // Ahora todas las rutas requieren JWT
}

@Controller("pdf")
@UseGuards(JwtAuthGuard) // ✅ Proteger TODAS las rutas
export class PdfController {
  // Ahora todas las rutas requieren JWT
}
```

**Impacto:** CRÍTICO - Posible ejecución remota de código  
**Esfuerzo:** 5 minutos  
**Prioridad:** 🔴 INMEDIATA

---

## 🔴 2. CORS Abierto a Todos los Orígenes

**Archivo:** `nest-ui-be/src/main.ts`

**Problema:**

```typescript
app.enableCors({
  origin: "*", // ❌ Permite CUALQUIER origen
  credentials: true,
});
```

**Riesgos:**

- Cualquier sitio web puede hacer requests a tu API
- Ataques CSRF (Cross-Site Request Forgery)
- Robo de tokens JWT si están expuestos
- Acceso no autorizado desde sitios maliciosos

**Solución:**

```typescript
app.enableCors({
  origin:
    process.env.NODE_ENV === "production"
      ? ["app://electron", "file://"] // Solo Electron en producción
      : ["http://localhost:4200", "http://localhost:3000"], // Dev
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
});
```

**Impacto:** CRÍTICO - Vulnerabilidad de seguridad  
**Esfuerzo:** 10 minutos  
**Prioridad:** 🔴 INMEDIATA

---

## 🔴 3. Falta de Rate Limiting

**Archivo:** `nest-ui-be/src/app.module.ts`

**Problema:**

- No hay límite de requests por IP/usuario
- Vulnerable a ataques de fuerza bruta en `/auth/login`
- Vulnerable a DoS (Denial of Service)
- Cualquiera puede hacer miles de requests

**Solución:**

1. Instalar dependencia:

```bash
npm install @nestjs/throttler
```

2. Configurar en `app.module.ts`:

```typescript
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requests por minuto
      },
    ]),
    // ... otros imports
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

3. Configurar límites específicos para login:

```typescript
// auth.controller.ts
import { Throttle } from "@nestjs/throttler";

@Controller("auth")
export class AuthController {
  @Post("login")
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto
  async login(@Body() loginDto: LoginDto) {
    // ...
  }
}
```

**Impacto:** CRÍTICO - Previene ataques  
**Esfuerzo:** 30 minutos  
**Prioridad:** 🔴 ALTA

---

## 🔴 4. Falta de Sanitización de Inputs en Python Controller

**Archivo:** `nest-ui-be/src/python/python.controller.ts`

**Problema:**

```typescript
@Post('execute-file')
async executeFile(@Body() body: { fileName: string; args?: string[] }) {
  // ❌ No valida fileName
  // ❌ No valida args
  // Posible: "../../../etc/passwd"
  // Posible: "file.py; rm -rf /"
}
```

**Riesgos:**

- Path traversal attacks
- Command injection
- Ejecución de archivos fuera del directorio permitido
- Acceso a archivos del sistema

**Solución:**

1. Crear DTO con validación:

```typescript
// dto/execute-file.dto.ts
import { IsString, IsArray, IsOptional, Matches } from "class-validator";

export class ExecuteFileDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]+\.(py|exe)$/, {
    message:
      "Invalid file name format. Only alphanumeric, underscore, hyphen, and .py/.exe extensions allowed",
  })
  fileName: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  args?: string[];
}
```

2. Usar DTO y validar path:

```typescript
import { ExecuteFileDto } from './dto/execute-file.dto';
import * as path from 'path';

@Post('execute-file')
async executeFile(@Body() body: ExecuteFileDto) {
  // Validar que el archivo existe en el directorio permitido
  const allowedDir = this.pythonService.getScriptsPath();
  const fullPath = path.join(allowedDir, body.fileName);

  // Verificar que no hay path traversal
  const normalizedPath = path.normalize(fullPath);
  if (!normalizedPath.startsWith(allowedDir)) {
    throw new HttpException(
      'Invalid file path - path traversal detected',
      HttpStatus.BAD_REQUEST,
    );
  }

  // Verificar que el archivo existe
  if (!fs.existsSync(normalizedPath)) {
    throw new HttpException(
      'File not found',
      HttpStatus.NOT_FOUND,
    );
  }

  return this.pythonService.executeFile(body.fileName, body.args || []);
}
```

**Impacto:** CRÍTICO - Previene RCE  
**Esfuerzo:** 1 hora  
**Prioridad:** 🔴 ALTA

---

## 🔴 5. Falta de Validación en PDF Controller

**Archivo:** `nest-ui-be/src/pdf/pdf.controller.ts`

**Problema:**

```typescript
interface GeneratePdfDto {
  // ❌ Interface en lugar de class
  // ❌ No hay validación
  type: "single" | "multiple";
  names: string[];
  facility: string;
  processType: string;
}
```

**Solución:**

1. Crear DTOs con validación:

```typescript
// dto/generate-pdf.dto.ts
import {
  IsEnum,
  IsArray,
  IsString,
  Length,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class FileDto {
  @IsString()
  @Length(1, 255)
  name: string;

  @IsString()
  size: string;

  @IsString()
  type: string;
}

export class GeneratePdfDto {
  @IsEnum(["single", "multiple"])
  type: "single" | "multiple";

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: "At least one PDF name is required" })
  @ArrayMaxSize(100, { message: "Maximum 100 PDFs per request" })
  names: string[];

  @IsString()
  @Length(2, 50)
  facility: string;

  @IsString()
  @Length(2, 50)
  processType: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileDto)
  files: FileDto[];
}
```

2. Usar DTO en controlador:

```typescript
import { GeneratePdfDto } from './dto/generate-pdf.dto';

@Post('generate')
async generatePDFs(@Body() data: GeneratePdfDto) {
  // Ahora los datos están validados automáticamente
  const result = await this.pdfService.generatePDFs(data);
  return {
    success: true,
    message: 'PDFs generated successfully',
    ...result,
  };
}
```

**Impacto:** CRÍTICO - Previene errores y ataques  
**Esfuerzo:** 30 minutos  
**Prioridad:** 🔴 ALTA

---

## ✅ Checklist de Implementación

- [ ] Agregar `@UseGuards(JwtAuthGuard)` a PythonController
- [ ] Agregar `@UseGuards(JwtAuthGuard)` a PdfController
- [ ] Configurar CORS con orígenes específicos
- [ ] Instalar y configurar @nestjs/throttler
- [ ] Crear ExecuteFileDto con validación
- [ ] Implementar validación de path traversal
- [ ] Crear GeneratePdfDto con validación
- [ ] Probar que las rutas requieren JWT
- [ ] Probar que CORS bloquea orígenes no permitidos
- [ ] Probar rate limiting con múltiples requests
- [ ] Probar validación de inputs con datos inválidos

---

## 🎯 Resultado Esperado

Después de implementar estas mejoras:

- ✅ Todas las rutas de Python y PDF requieren autenticación
- ✅ CORS solo permite orígenes confiables
- ✅ Rate limiting previene ataques de fuerza bruta
- ✅ Inputs sanitizados previenen path traversal
- ✅ Validación de DTOs previene datos inválidos

**Calificación de Seguridad:** 7.0/10 → 9.0/10
