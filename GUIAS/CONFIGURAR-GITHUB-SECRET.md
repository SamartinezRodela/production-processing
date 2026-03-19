# 🔐 Configurar JWT_SECRET en GitHub

**Fecha:** 13 de Marzo, 2026  
**Requerido para:** Build automático con GitHub Actions

---

## 📋 Pasos para Configurar el Secret

### 1. Ir a la Configuración del Repositorio

1. Abre tu repositorio en GitHub
2. Click en **Settings** (Configuración)
3. En el menú lateral izquierdo, busca **Secrets and variables**
4. Click en **Actions**

### 2. Crear Nuevo Secret

1. Click en el botón **New repository secret**
2. En el campo **Name**, escribe exactamente:
   ```
   JWT_SECRET
   ```
3. En el campo **Secret**, pega tu clave secreta JWT

### 3. Generar una Clave Segura

**Opción A: Usar Node.js**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Opción B: Usar OpenSSL**

```bash
openssl rand -hex 32
```

**Opción C: Usar PowerShell (Windows)**

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**Opción D: Generador Online**

- Ir a: https://generate-secret.vercel.app/32
- Copiar la clave generada

**Ejemplo de clave válida:**

```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### 4. Guardar el Secret

1. Click en **Add secret**
2. Verificar que aparece en la lista de secrets
3. ✅ Listo!

---

## 🔍 Verificar la Configuración

### En GitHub Actions

1. Ve a la pestaña **Actions** de tu repositorio
2. Ejecuta manualmente el workflow **Build All Platforms**
3. Abre los logs del job
4. Busca la línea:
   ```
   Creating .env file for backend...
   [OK] .env file created at: ...
   JWT_SECRET: a1b2c3d4e5... (64 chars)
   ```

### En la App Empaquetada

1. Descarga el instalador generado
2. Instala la aplicación
3. Navega a la carpeta de instalación:
   - **Windows:** `C:\Program Files\Production Processing\resources\backend\`
   - **Mac:** `/Applications/Production Processing.app/Contents/Resources/backend/`
4. Verifica que existe el archivo `.env`
5. Abre el archivo y verifica que contiene:
   ```env
   JWT_SECRET=tu-clave-secreta-aqui
   JWT_EXPIRATION=12h
   NODE_ENV=production
   PORT=3000
   ```

---

## ⚠️ Importante

### Seguridad

1. **NUNCA** compartas tu JWT_SECRET públicamente
2. **NUNCA** lo subas a Git
3. **NUNCA** lo incluyas en código fuente
4. **CAMBIA** el secret si crees que fue comprometido

### Longitud Mínima

- **Mínimo:** 32 caracteres
- **Recomendado:** 64 caracteres
- **Formato:** Hexadecimal (0-9, a-f) o alfanumérico

### Rotación

- Cambia el secret cada 6-12 meses
- Cambia inmediatamente si hay una brecha de seguridad
- Usa diferentes secrets para desarrollo, staging y producción

---

## 🔄 Actualizar el Secret

Si necesitas cambiar el JWT_SECRET:

1. Ve a **Settings → Secrets and variables → Actions**
2. Click en **JWT_SECRET**
3. Click en **Update secret**
4. Pega la nueva clave
5. Click en **Update secret**
6. Ejecuta un nuevo build

**Nota:** Los tokens JWT existentes quedarán inválidos. Los usuarios deberán hacer login de nuevo.

---

## 🧪 Probar Localmente

### Desarrollo Local

Para desarrollo local, el secret se lee del archivo `.env`:

```bash
cd nest-ui-be
cat .env
```

Debería mostrar:

```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRATION=12h
NODE_ENV=development
PORT=3000
```

### Cambiar Secret Local

1. Edita `nest-ui-be/.env`
2. Cambia el valor de `JWT_SECRET`
3. Reinicia el servidor backend
4. Los tokens antiguos quedarán inválidos

---

## 📊 Valores por Defecto

### Si NO se configura el secret

El sistema usará un valor por defecto:

```
default-secret-change-in-production-min-32-chars
```

**⚠️ ADVERTENCIA:** Este valor NO es seguro para producción.

### Dónde se usa el valor por defecto

1. **Backend (auth.module.ts):**

   ```typescript
   secret: process.env.JWT_SECRET ||
     "default-secret-change-in-production-min-32-chars";
   ```

2. **Backend (jwt.strategy.ts):**

   ```typescript
   secretOrKey: process.env.JWT_SECRET ||
     "default-secret-change-in-production-min-32-chars";
   ```

3. **Electron (afterPack.js):**
   ```javascript
   const jwtSecret =
     process.env.JWT_SECRET ||
     "default-secret-change-in-production-min-32-chars";
   ```

---

## 🎯 Checklist

- [ ] Generar clave secreta (mínimo 32 caracteres)
- [ ] Ir a Settings → Secrets and variables → Actions
- [ ] Crear secret con nombre `JWT_SECRET`
- [ ] Pegar la clave generada
- [ ] Guardar el secret
- [ ] Ejecutar workflow manualmente para probar
- [ ] Verificar logs del build
- [ ] Descargar e instalar la app
- [ ] Verificar que el archivo .env existe
- [ ] Probar login en la app

---

## 🆘 Troubleshooting

### Error: "JWT_SECRET not found"

**Causa:** El secret no está configurado en GitHub

**Solución:**

1. Verifica que el secret existe en Settings → Secrets
2. Verifica que el nombre es exactamente `JWT_SECRET` (case-sensitive)
3. Re-ejecuta el workflow

### Error: "Invalid token"

**Causa:** El secret cambió después de generar el token

**Solución:**

1. Haz logout
2. Haz login de nuevo
3. El nuevo token usará el secret actualizado

### Error: ".env file not found"

**Causa:** El afterPack.js no se ejecutó correctamente

**Solución:**

1. Verifica los logs del build
2. Busca la línea "Creating .env file for backend..."
3. Si no aparece, verifica que afterPack.js está actualizado

---

## 📚 Referencias

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Crypto Random Bytes](https://nodejs.org/api/crypto.html#crypto_crypto_randombytes_size_callback)

---

## 🎉 Conclusión

Una vez configurado el `JWT_SECRET` en GitHub:

- ✅ Los builds automáticos funcionarán correctamente
- ✅ La app empaquetada tendrá el .env configurado
- ✅ La autenticación JWT funcionará en producción
- ✅ Los tokens serán seguros y válidos

**Próximo paso:** Ejecutar un build manual para verificar que todo funciona.
