# Guía: Base de Datos JSON en Backend NestJS

Esta guía te muestra cómo crear una base de datos JSON manejada completamente desde el backend NestJS con API REST.

---

## 🎯 Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│ ANGULAR FRONTEND                                        │
│ - Llama API REST (/api/facilities, /api/orders)        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ HTTP
┌─────────────────────────────────────────────────────────┐
│ NESTJS BACKEND                                          │
│ - DatabaseModule (maneja database.json)                │
│ - FacilitiesModule (CRUD facilities)                    │
│ - OrdersModule (CRUD orders)                            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ File System
┌─────────────────────────────────────────────────────────┐
│ database.json                                           │
│ %APPDATA%/Production Processing/database.json          │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura del Proyecto

```
nest-ui-be/src/
├── database/
│   ├── database.module.ts
│   ├── database.service.ts
│   ├── entities/
│   │   ├── database.entity.ts
│   │   ├── facility.entity.ts
│   │   └── order.entity.ts
│   └── dto/
│       ├── create-facility.dto.ts
│       └── create-order.dto.ts
├── facilities/
│   ├── facilities.module.ts
│   ├── facilities.controller.ts
│   └── facilities.service.ts
└── orders/
    ├── orders.module.ts
    ├── orders.controller.ts
    └── orders.service.ts
```

---

## 📝 PASO 1: Crear Entidades (Types)

### Archivo: `nest-ui-be/src/database/entities/facility.entity.ts`

```typescript
export class Facility {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
```

### Archivo: `nest-ui-be/src/database/entities/order.entity.ts`

```typescript
export class Order {
  id: string;
  name: string;
  facilityId?: string;
  status: "active" | "inactive" | "completed";
  createdAt: string;
  updatedAt: string;
}
```

### Archivo: `nest-ui-be/src/database/entities/database.entity.ts`

```typescript
import { Facility } from "./facility.entity";
import { Order } from "./order.entity";

export interface DatabaseSettings {
  selectedFacilityId: string;
  basePath: string;
  os: "windows" | "macos";
}

export class Database {
  version: string;
  lastModified: string;
  facilities: Facility[];
  orders: Order[];
  settings: DatabaseSettings;
}
```

---

## 🔧 PASO 2: Crear DTOs

### Archivo: `nest-ui-be/src/database/dto/create-facility.dto.ts`

```typescript
export class CreateFacilityDto {
  name: string;
}

export class UpdateFacilityDto {
  name: string;
}
```

### Archivo: `nest-ui-be/src/database/dto/create-order.dto.ts`

```typescript
export class CreateOrderDto {
  name: string;
  facilityId?: string;
  status?: "active" | "inactive" | "completed";
}

export class UpdateOrderDto {
  name?: string;
  facilityId?: string;
  status?: "active" | "inactive" | "completed";
}
```

---

## 💾 PASO 3: Crear Database Service

### Archivo: `nest-ui-be/src/database/database.service.ts`

Este es el servicio principal que maneja el archivo JSON.

```typescript
import { Injectable, Logger } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { Database } from "./entities/database.entity";
import { Facility } from "./entities/facility.entity";
import { Order } from "./entities/order.entity";

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);
  private dbPath: string;
  private database: Database;

  constructor() {
    this.initializeDatabase();
  }

  /**
   * Inicializa la base de datos
   */
  private initializeDatabase(): void {
    // Determinar la ruta del archivo database.json
    this.dbPath = this.getDatabasePath();
    this.logger.log(`Database path: ${this.dbPath}`);

    // Cargar o crear la base de datos
    if (fs.existsSync(this.dbPath)) {
      this.loadDatabase();
    } else {
      this.createDefaultDatabase();
    }
  }

  /**
   * Obtiene la ruta del archivo database.json
   */
  private getDatabasePath(): string {
    const isProduction =
      process.env.NODE_ENV === "production" ||
      process.resourcesPath !== undefined;

    if (isProduction) {
      // En producción, usar la carpeta de datos de usuario
      const userDataPath =
        process.env.APPDATA || path.join(process.env.HOME, ".config");
      const appFolder = path.join(userDataPath, "Production Processing");

      // Crear carpeta si no existe
      if (!fs.existsSync(appFolder)) {
        fs.mkdirSync(appFolder, { recursive: true });
      }

      return path.join(appFolder, "database.json");
    } else {
      // En desarrollo, usar carpeta del proyecto
      const devPath = path.join(process.cwd(), "data");

      if (!fs.existsSync(devPath)) {
        fs.mkdirSync(devPath, { recursive: true });
      }

      return path.join(devPath, "database.json");
    }
  }

  /**
   * Carga la base de datos desde el archivo
   */
  private loadDatabase(): void {
    try {
      const data = fs.readFileSync(this.dbPath, "utf8");
      this.database = JSON.parse(data);
      this.logger.log("✅ Database loaded successfully");
    } catch (error) {
      this.logger.error("Error loading database:", error);
      this.createDefaultDatabase();
    }
  }

  /**
   * Crea la base de datos con valores por defecto
   */
  private createDefaultDatabase(): void {
    const now = new Date().toISOString();

    this.database = {
      version: "1.0.0",
      lastModified: now,
      facilities: [
        {
          id: "1",
          name: "Reynosa",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "2",
          name: "Merida",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "3",
          name: "San Luis",
          createdAt: now,
          updatedAt: now,
        },
      ],
      orders: [
        {
          id: "1",
          name: "Order A",
          status: "active",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "2",
          name: "Order B",
          status: "active",
          createdAt: now,
          updatedAt: now,
        },
      ],
      settings: {
        selectedFacilityId: "1",
        basePath: "C:\\Production\\Files",
        os: "windows",
      },
    };

    this.saveDatabase();
    this.logger.log("✅ Default database created");
  }

  /**
   * Guarda la base de datos en el archivo
   */
  private saveDatabase(): void {
    try {
      this.database.lastModified = new Date().toISOString();
      fs.writeFileSync(
        this.dbPath,
        JSON.stringify(this.database, null, 2),
        "utf8",
      );
      this.logger.log("✅ Database saved");
    } catch (error) {
      this.logger.error("Error saving database:", error);
      throw error;
    }
  }

  // ==========================================
  // PUBLIC METHODS
  // ==========================================

  /**
   * Obtiene toda la base de datos
   */
  getDatabase(): Database {
    return this.database;
  }

  /**
   * Obtiene todas las facilities
   */
  getFacilities(): Facility[] {
    return this.database.facilities;
  }

  /**
   * Obtiene una facility por ID
   */
  getFacilityById(id: string): Facility | undefined {
    return this.database.facilities.find((f) => f.id === id);
  }

  /**
   * Crea una nueva facility
   */
  createFacility(name: string): Facility {
    const newId = (this.database.facilities.length + 1).toString();
    const now = new Date().toISOString();

    const newFacility: Facility = {
      id: newId,
      name,
      createdAt: now,
      updatedAt: now,
    };

    this.database.facilities.push(newFacility);
    this.saveDatabase();

    return newFacility;
  }

  /**
   * Actualiza una facility
   */
  updateFacility(id: string, name: string): Facility | null {
    const facility = this.getFacilityById(id);

    if (!facility) {
      return null;
    }

    facility.name = name;
    facility.updatedAt = new Date().toISOString();
    this.saveDatabase();

    return facility;
  }

  /**
   * Elimina una facility
   */
  deleteFacility(id: string): boolean {
    const initialLength = this.database.facilities.length;

    if (initialLength <= 1) {
      return false; // No permitir eliminar la última facility
    }

    this.database.facilities = this.database.facilities.filter(
      (f) => f.id !== id,
    );

    if (this.database.facilities.length < initialLength) {
      // Si la facility seleccionada fue eliminada, seleccionar la primera
      if (this.database.settings.selectedFacilityId === id) {
        this.database.settings.selectedFacilityId =
          this.database.facilities[0].id;
      }

      this.saveDatabase();
      return true;
    }

    return false;
  }

  /**
   * Obtiene todas las orders
   */
  getOrders(): Order[] {
    return this.database.orders;
  }

  /**
   * Obtiene una order por ID
   */
  getOrderById(id: string): Order | undefined {
    return this.database.orders.find((o) => o.id === id);
  }

  /**
   * Obtiene orders por facility
   */
  getOrdersByFacility(facilityId: string): Order[] {
    return this.database.orders.filter((o) => o.facilityId === facilityId);
  }

  /**
   * Crea una nueva order
   */
  createOrder(
    name: string,
    facilityId?: string,
    status: "active" | "inactive" | "completed" = "active",
  ): Order {
    const newId = (this.database.orders.length + 1).toString();
    const now = new Date().toISOString();

    const newOrder: Order = {
      id: newId,
      name,
      facilityId,
      status,
      createdAt: now,
      updatedAt: now,
    };

    this.database.orders.push(newOrder);
    this.saveDatabase();

    return newOrder;
  }

  /**
   * Actualiza una order
   */
  updateOrder(
    id: string,
    updates: Partial<Omit<Order, "id" | "createdAt">>,
  ): Order | null {
    const order = this.getOrderById(id);

    if (!order) {
      return null;
    }

    Object.assign(order, updates);
    order.updatedAt = new Date().toISOString();
    this.saveDatabase();

    return order;
  }

  /**
   * Elimina una order
   */
  deleteOrder(id: string): boolean {
    const initialLength = this.database.orders.length;

    this.database.orders = this.database.orders.filter((o) => o.id !== id);

    if (this.database.orders.length < initialLength) {
      this.saveDatabase();
      return true;
    }

    return false;
  }

  /**
   * Obtiene los settings
   */
  getSettings() {
    return this.database.settings;
  }

  /**
   * Actualiza los settings
   */
  updateSettings(updates: Partial<typeof this.database.settings>) {
    this.database.settings = { ...this.database.settings, ...updates };
    this.saveDatabase();
    return this.database.settings;
  }

  /**
   * Resetea la base de datos a valores por defecto
   */
  resetDatabase(): Database {
    this.createDefaultDatabase();
    return this.database;
  }

  /**
   * Crea un backup de la base de datos
   */
  createBackup(): string {
    const backupPath = this.dbPath.replace(
      ".json",
      `.backup.${Date.now()}.json`,
    );
    fs.copyFileSync(this.dbPath, backupPath);
    this.logger.log(`✅ Backup created: ${backupPath}`);
    return backupPath;
  }
}
```

---

## 🏗️ PASO 4: Crear Database Module

### Archivo: `nest-ui-be/src/database/database.module.ts`

```typescript
import { Module, Global } from "@nestjs/common";
import { DatabaseService } from "./database.service";

@Global() // Hace que el servicio esté disponible en toda la app
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
```

---

## 🏢 PASO 5: Crear Facilities Module

### Archivo: `nest-ui-be/src/facilities/facilities.service.ts`

```typescript
import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import {
  CreateFacilityDto,
  UpdateFacilityDto,
} from "../database/dto/create-facility.dto";
import { Facility } from "../database/entities/facility.entity";

@Injectable()
export class FacilitiesService {
  constructor(private readonly databaseService: DatabaseService) {}

  findAll(): Facility[] {
    return this.databaseService.getFacilities();
  }

  findOne(id: string): Facility | undefined {
    return this.databaseService.getFacilityById(id);
  }

  create(createFacilityDto: CreateFacilityDto): Facility {
    return this.databaseService.createFacility(createFacilityDto.name);
  }

  update(id: string, updateFacilityDto: UpdateFacilityDto): Facility | null {
    return this.databaseService.updateFacility(id, updateFacilityDto.name);
  }

  remove(id: string): boolean {
    return this.databaseService.deleteFacility(id);
  }
}
```

### Archivo: `nest-ui-be/src/facilities/facilities.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { FacilitiesService } from "./facilities.service";
import {
  CreateFacilityDto,
  UpdateFacilityDto,
} from "../database/dto/create-facility.dto";

@Controller("facilities")
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Get()
  findAll() {
    return {
      success: true,
      data: this.facilitiesService.findAll(),
    };
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    const facility = this.facilitiesService.findOne(id);

    if (!facility) {
      throw new HttpException("Facility not found", HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      data: facility,
    };
  }

  @Post()
  create(@Body() createFacilityDto: CreateFacilityDto) {
    const facility = this.facilitiesService.create(createFacilityDto);

    return {
      success: true,
      message: "Facility created successfully",
      data: facility,
    };
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() updateFacilityDto: UpdateFacilityDto,
  ) {
    const facility = this.facilitiesService.update(id, updateFacilityDto);

    if (!facility) {
      throw new HttpException("Facility not found", HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      message: "Facility updated successfully",
      data: facility,
    };
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    const deleted = this.facilitiesService.remove(id);

    if (!deleted) {
      throw new HttpException(
        "Cannot delete facility or facility not found",
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      success: true,
      message: "Facility deleted successfully",
    };
  }
}
```

### Archivo: `nest-ui-be/src/facilities/facilities.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { FacilitiesController } from "./facilities.controller";
import { FacilitiesService } from "./facilities.service";

@Module({
  controllers: [FacilitiesController],
  providers: [FacilitiesService],
})
export class FacilitiesModule {}
```

---

## 📦 PASO 6: Crear Orders Module

### Archivo: `nest-ui-be/src/orders/orders.service.ts`

```typescript
import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import {
  CreateOrderDto,
  UpdateOrderDto,
} from "../database/dto/create-order.dto";
import { Order } from "../database/entities/order.entity";

@Injectable()
export class OrdersService {
  constructor(private readonly databaseService: DatabaseService) {}

  findAll(): Order[] {
    return this.databaseService.getOrders();
  }

  findOne(id: string): Order | undefined {
    return this.databaseService.getOrderById(id);
  }

  findByFacility(facilityId: string): Order[] {
    return this.databaseService.getOrdersByFacility(facilityId);
  }

  create(createOrderDto: CreateOrderDto): Order {
    return this.databaseService.createOrder(
      createOrderDto.name,
      createOrderDto.facilityId,
      createOrderDto.status || "active",
    );
  }

  update(id: string, updateOrderDto: UpdateOrderDto): Order | null {
    return this.databaseService.updateOrder(id, updateOrderDto);
  }

  remove(id: string): boolean {
    return this.databaseService.deleteOrder(id);
  }
}
```

### Archivo: `nest-ui-be/src/orders/orders.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { OrdersService } from "./orders.service";
import {
  CreateOrderDto,
  UpdateOrderDto,
} from "../database/dto/create-order.dto";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@Query("facilityId") facilityId?: string) {
    let orders;

    if (facilityId) {
      orders = this.ordersService.findByFacility(facilityId);
    } else {
      orders = this.ordersService.findAll();
    }

    return {
      success: true,
      data: orders,
    };
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    const order = this.ordersService.findOne(id);

    if (!order) {
      throw new HttpException("Order not found", HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      data: order,
    };
  }

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    const order = this.ordersService.create(createOrderDto);

    return {
      success: true,
      message: "Order created successfully",
      data: order,
    };
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() updateOrderDto: UpdateOrderDto) {
    const order = this.ordersService.update(id, updateOrderDto);

    if (!order) {
      throw new HttpException("Order not found", HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      message: "Order updated successfully",
      data: order,
    };
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    const deleted = this.ordersService.remove(id);

    if (!deleted) {
      throw new HttpException("Order not found", HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      message: "Order deleted successfully",
    };
  }
}
```

### Archivo: `nest-ui-be/src/orders/orders.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
```

---

## 🔗 PASO 7: Registrar Módulos en App Module

### Archivo: `nest-ui-be/src/app.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { PdfModule } from "./pdf/pdf.module";
import { PythonModule } from "./python/python.module";
import { DatabaseModule } from "./database/database.module"; // ✅ NUEVO
import { FacilitiesModule } from "./facilities/facilities.module"; // ✅ NUEVO
import { OrdersModule } from "./orders/orders.module"; // ✅ NUEVO

@Module({
  imports: [
    AuthModule,
    PdfModule,
    PythonModule,
    DatabaseModule, // ✅ NUEVO
    FacilitiesModule, // ✅ NUEVO
    OrdersModule, // ✅ NUEVO
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

---

## 📡 PASO 8: API Endpoints Disponibles

### Facilities

| Método | Endpoint          | Descripción                  |
| ------ | ----------------- | ---------------------------- |
| GET    | `/facilities`     | Obtener todas las facilities |
| GET    | `/facilities/:id` | Obtener una facility por ID  |
| POST   | `/facilities`     | Crear nueva facility         |
| PUT    | `/facilities/:id` | Actualizar facility          |
| DELETE | `/facilities/:id` | Eliminar facility            |

### Orders

| Método | Endpoint               | Descripción                 |
| ------ | ---------------------- | --------------------------- |
| GET    | `/orders`              | Obtener todas las orders    |
| GET    | `/orders?facilityId=1` | Obtener orders por facility |
| GET    | `/orders/:id`          | Obtener una order por ID    |
| POST   | `/orders`              | Crear nueva order           |
| PUT    | `/orders/:id`          | Actualizar order            |
| DELETE | `/orders/:id`          | Eliminar order              |

---

## 🧪 PASO 9: Probar con Postman o cURL

### Obtener todas las facilities

```bash
curl http://localhost:3000/facilities
```

### Crear una facility

```bash
curl -X POST http://localhost:3000/facilities \
  -H "Content-Type: application/json" \
  -d '{"name": "Nueva Facility"}'
```

### Actualizar una facility

```bash
curl -X PUT http://localhost:3000/facilities/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Reynosa Actualizado"}'
```

### Eliminar una facility

```bash
curl -X DELETE http://localhost:3000/facilities/4
```

### Crear una order

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"name": "Order C", "facilityId": "1", "status": "active"}'
```

### Obtener orders por facility

```bash
curl http://localhost:3000/orders?facilityId=1
```

---

## 🎨 PASO 10: Actualizar Frontend Angular

### Archivo: `nest-ui-fe/src/app/models/database.types.ts`

```typescript
export interface Facility {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  name: string;
  facilityId?: string;
  status?: "active" | "inactive" | "completed";
  createdAt?: string;
  updatedAt?: string;
}
```

### Archivo: `nest-ui-fe/src/app/service/facilities-api.service.ts`

```typescript
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { ApiUrlService } from "./api-url.service";
import { Facility } from "../models/database.types";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: "root",
})
export class FacilitiesApiService {
  constructor(
    private http: HttpClient,
    private apiUrlService: ApiUrlService,
  ) {}

  async getAll(): Promise<Facility[]> {
    const apiUrl = await this.apiUrlService.getApiUrl();
    const response = await firstValueFrom(
      this.http.get<ApiResponse<Facility[]>>(`${apiUrl}/facilities`),
    );
    return response.data || [];
  }

  async getById(id: string): Promise<Facility | null> {
    const apiUrl = await this.apiUrlService.getApiUrl();
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<Facility>>(`${apiUrl}/facilities/${id}`),
      );
      return response.data || null;
    } catch (error) {
      console.error("Error getting facility:", error);
      return null;
    }
  }

  async create(name: string): Promise<Facility | null> {
    const apiUrl = await this.apiUrlService.getApiUrl();
    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponse<Facility>>(`${apiUrl}/facilities`, { name }),
      );
      return response.data || null;
    } catch (error) {
      console.error("Error creating facility:", error);
      return null;
    }
  }

  async update(id: string, name: string): Promise<Facility | null> {
    const apiUrl = await this.apiUrlService.getApiUrl();
    try {
      const response = await firstValueFrom(
        this.http.put<ApiResponse<Facility>>(`${apiUrl}/facilities/${id}`, {
          name,
        }),
      );
      return response.data || null;
    } catch (error) {
      console.error("Error updating facility:", error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    const apiUrl = await this.apiUrlService.getApiUrl();
    try {
      const response = await firstValueFrom(
        this.http.delete<ApiResponse<void>>(`${apiUrl}/facilities/${id}`),
      );
      return response.success;
    } catch (error) {
      console.error("Error deleting facility:", error);
      return false;
    }
  }
}
```

### Archivo: `nest-ui-fe/src/app/service/orders-api.service.ts`

```typescript
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { ApiUrlService } from "./api-url.service";
import { Order } from "../models/database.types";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: "root",
})
export class OrdersApiService {
  constructor(
    private http: HttpClient,
    private apiUrlService: ApiUrlService,
  ) {}

  async getAll(facilityId?: string): Promise<Order[]> {
    const apiUrl = await this.apiUrlService.getApiUrl();
    const url = facilityId
      ? `${apiUrl}/orders?facilityId=${facilityId}`
      : `${apiUrl}/orders`;

    const response = await firstValueFrom(
      this.http.get<ApiResponse<Order[]>>(url),
    );
    return response.data || [];
  }

  async getById(id: string): Promise<Order | null> {
    const apiUrl = await this.apiUrlService.getApiUrl();
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<Order>>(`${apiUrl}/orders/${id}`),
      );
      return response.data || null;
    } catch (error) {
      console.error("Error getting order:", error);
      return null;
    }
  }

  async create(
    name: string,
    facilityId?: string,
    status: "active" | "inactive" | "completed" = "active",
  ): Promise<Order | null> {
    const apiUrl = await this.apiUrlService.getApiUrl();
    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponse<Order>>(`${apiUrl}/orders`, {
          name,
          facilityId,
          status,
        }),
      );
      return response.data || null;
    } catch (error) {
      console.error("Error creating order:", error);
      return null;
    }
  }

  async update(
    id: string,
    updates: { name?: string; facilityId?: string; status?: string },
  ): Promise<Order | null> {
    const apiUrl = await this.apiUrlService.getApiUrl();
    try {
      const response = await firstValueFrom(
        this.http.put<ApiResponse<Order>>(`${apiUrl}/orders/${id}`, updates),
      );
      return response.data || null;
    } catch (error) {
      console.error("Error updating order:", error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    const apiUrl = await this.apiUrlService.getApiUrl();
    try {
      const response = await firstValueFrom(
        this.http.delete<ApiResponse<void>>(`${apiUrl}/orders/${id}`),
      );
      return response.success;
    } catch (error) {
      console.error("Error deleting order:", error);
      return false;
    }
  }
}
```

### Archivo: `nest-ui-fe/src/app/service/set-up/facility-management.service.ts`

Actualiza para usar el API:

```typescript
import { Injectable, signal, computed } from "@angular/core";
import { Facility } from "../../models/database.types";
import { FacilitiesApiService } from "../facilities-api.service";

@Injectable({
  providedIn: "root",
})
export class FacilityManagementService {
  facilities = signal<Facility[]>([]);
  selectedFacility = signal<string>("1");

  facilityOptions = computed(() =>
    this.facilities().map((facility) => ({
      value: facility.id,
      label: facility.name,
    })),
  );

  constructor(private facilitiesApi: FacilitiesApiService) {
    this.loadFacilities();
  }

  async loadFacilities(): Promise<void> {
    const facilities = await this.facilitiesApi.getAll();
    this.facilities.set(facilities);
  }

  async addFacility(name: string): Promise<boolean> {
    const newFacility = await this.facilitiesApi.create(name);

    if (newFacility) {
      this.facilities.set([...this.facilities(), newFacility]);
      return true;
    }

    return false;
  }

  async updateFacility(id: string, name: string): Promise<boolean> {
    const updated = await this.facilitiesApi.update(id, name);

    if (updated) {
      this.facilities.set(
        this.facilities().map((f) => (f.id === id ? updated : f)),
      );
      return true;
    }

    return false;
  }

  async removeFacility(id: string): Promise<boolean> {
    const deleted = await this.facilitiesApi.delete(id);

    if (deleted) {
      this.facilities.set(this.facilities().filter((f) => f.id !== id));

      // Si el facility seleccionado fue eliminado, seleccionar el primero
      if (this.selectedFacility() === id && this.facilities().length > 0) {
        this.selectedFacility.set(this.facilities()[0].id);
      }

      return true;
    }

    return false;
  }

  getFacilityById(id: string): Facility | undefined {
    return this.facilities().find((f) => f.id === id);
  }

  setSelectedFacility(facilityId: string): void {
    this.selectedFacility.set(facilityId);
  }
}
```

---

## ✅ Checklist de Implementación

### Backend (NestJS)

- [ ] Crear carpeta `database/` con entities, DTOs
- [ ] Crear `database.service.ts` con lógica de JSON
- [ ] Crear `database.module.ts` y marcarlo como @Global
- [ ] Crear `facilities/` module, service, controller
- [ ] Crear `orders/` module, service, controller
- [ ] Registrar módulos en `app.module.ts`
- [ ] Compilar backend: `npm run build`
- [ ] Probar endpoints con Postman/cURL

### Frontend (Angular)

- [ ] Crear `database.types.ts` con interfaces
- [ ] Crear `facilities-api.service.ts`
- [ ] Crear `orders-api.service.ts`
- [ ] Actualizar `facility-management.service.ts`
- [ ] Actualizar componentes para usar async/await
- [ ] Compilar frontend: `npm run build`

### Testing

- [ ] Verificar que `database.json` se crea
- [ ] Probar CRUD de facilities
- [ ] Probar CRUD de orders
- [ ] Verificar persistencia de datos
- [ ] Probar en producción (app empaquetada)

---

## 📊 Ubicación del Archivo database.json

### Desarrollo:

```
nest-ui-be/data/database.json
```

### Producción (Windows):

```
C:\Users\[Usuario]\AppData\Roaming\Production Processing\database.json
```

### Producción (macOS):

```
~/Library/Application Support/Production Processing/database.json
```

---

## 🎯 Ventajas de Esta Arquitectura

✅ **Backend maneja la lógica** - Frontend solo consume API
✅ **API REST estándar** - Fácil de testear y documentar
✅ **Separación de responsabilidades** - Backend = datos, Frontend = UI
✅ **Escalable** - Fácil cambiar a base de datos real (PostgreSQL, MongoDB)
✅ **Testeable** - Puedes probar el backend independientemente
✅ **Reutilizable** - Otros clientes pueden usar la misma API

---

## 🚀 Próximos Pasos

1. Crear todos los archivos del backend
2. Compilar y probar el backend
3. Crear servicios en el frontend
4. Actualizar componentes
5. Probar la integración completa

¿Listo para empezar? 🎉
