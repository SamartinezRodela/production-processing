# 🔄 Guía de Migración: JSON → SQLite

## ✅ Pasos Completados

- [x] Fase 1: Preparación y Backup
- [x] Fase 2: Instalar Dependencias
- [x] Fase 3: Crear Entidades TypeORM
- [x] Fase 4: Configurar TypeORM en app.module.ts y database.module.ts

---

## 🚧 Pasos Pendientes

### FASE 5: Crear Nuevo DatabaseService (2 horas)

El nuevo servicio usará TypeORM en lugar de manipular JSON manualmente.

**Archivo:** `nest-ui-be/src/database/database-typeorm.service.ts`

```typescript
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Facility } from './entities/facility.entity';
import { Order } from './entities/order.entity';
import { Settings } from './entities/settings.entity';
import { DatabaseGateway } from './database.gateway';
import { DatabaseSettings } from './entities/database.entity';

@Injectable()
export class DatabaseTypeOrmService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseTypeOrmService.name);

  constructor(
    @InjectRepository(Facility)
    private facilityRepo: Repository<Facility>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(Settings)
    private settingsRepo: Repository<Settings>,
    @Inject(forwardRef(() => DatabaseGateway))
    private databaseGateway: DatabaseGateway,
  ) {}

  async onModuleInit() {
    this.logger.log('🔄 Initializing TypeORM Database Service');
    await this.ensureDefaultSettings();
  }

  onModuleDestroy() {
    this.logger.log('Shutting down TypeORM Database Service');
  }

  /**
   * Asegura que existan settings por defecto
   */
  private async ensureDefaultSettings(): Promise<void> {
    const count = await this.settingsRepo.count();

    if (count === 0) {
      this.logger.log('Creating default settings...');
      const defaultSettings = this.settingsRepo.create({
        selectedFacilityId: '1',
        basePath: 'C:\\Production\\Files',
        outputPath: 'C:\\Production\\Output',
        os: 'windows',
        theme: 'light',
        autoSave: false,
        notifications: true,
      });
      await this.settingsRepo.save(defaultSettings);
      this.logger.log('✅ Default settings created');
    }
  }

  // ==========================================
  // FACILITIES
  // ==========================================

  async getFacilities(): Promise<Facility[]> {
    return this.facilityRepo.find({
      order: { createdAt: 'ASC' },
    });
  }

  async getFacilityById(id: string): Promise<Facility | null> {
    return this.facilityRepo.findOne({ where: { id } });
  }

  async createFacility(name: string): Promise<Facility> {
    const facility = this.facilityRepo.create({ name });
    const saved = await this.facilityRepo.save(facility);

    // Notificar cambio via WebSocket
    this.databaseGateway.notifyDatabaseChange();

    return saved;
  }

  async updateFacility(id: string, name: string): Promise<Facility | null> {
    const facility = await this.getFacilityById(id);

    if (!facility) {
      return null;
    }

    facility.name = name;
    const updated = await this.facilityRepo.save(facility);

    // Notificar cambio
    this.databaseGateway.notifyDatabaseChange();

    return updated;
  }

  async deleteFacility(id: string): Promise<boolean> {
    const count = await this.facilityRepo.count();

    if (count <= 1) {
      return false; // No permitir eliminar la última facility
    }

    const result = await this.facilityRepo.delete(id);

    if (result.affected && result.affected > 0) {
      // Si la facility seleccionada fue eliminada, seleccionar la primera
      const settings = await this.getSettings();
      if (settings.selectedFacilityId === id) {
        const facilities = await this.getFacilities();
        if (facilities.length > 0) {
          await this.updateSettings({ selectedFacilityId: facilities[0].id });
        }
      }

      // Notificar cambio
      this.databaseGateway.notifyDatabaseChange();

      return true;
    }

    return false;
  }

  // ==========================================
  // ORDERS
  // ==========================================

  async getOrders(): Promise<Order[]> {
    return this.orderRepo.find({
      relations: ['facility'],
      order: { createdAt: 'ASC' },
    });
  }

  async getOrderById(id: string): Promise<Order | null> {
    return this.orderRepo.findOne({
      where: { id },
      relations: ['facility'],
    });
  }

  async getOrdersByFacility(facilityId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { facilityId },
      relations: ['facility'],
      order: { createdAt: 'ASC' },
    });
  }

  async createOrder(
    name: string,
    facilityId?: string,
    status: 'active' | 'inactive' | 'completed' = 'active',
  ): Promise<Order> {
    const order = this.orderRepo.create({
      name,
      facilityId,
      status,
    });

    const saved = await this.orderRepo.save(order);

    // Notificar cambio
    this.databaseGateway.notifyDatabaseChange();

    return saved;
  }

  async updateOrder(
    id: string,
    updates: Partial<Omit<Order, 'id' | 'createdAt'>>,
  ): Promise<Order | null> {
    const order = await this.getOrderById(id);

    if (!order) {
      return null;
    }

    Object.assign(order, updates);
    const updated = await this.orderRepo.save(order);

    // Notificar cambio
    this.databaseGateway.notifyDatabaseChange();

    return updated;
  }

  async deleteOrder(id: string): Promise<boolean> {
    const result = await this.orderRepo.delete(id);

    if (result.affected && result.affected > 0) {
      // Notificar cambio
      this.databaseGateway.notifyDatabaseChange();
      return true;
    }

    return false;
  }

  // ==========================================
  // SETTINGS
  // ==========================================

  async getSettings(): Promise<DatabaseSettings> {
    const settings = await this.settingsRepo.findOne({ where: { id: 1 } });

    if (!settings) {
      // Crear settings por defecto si no existen
      await this.ensureDefaultSettings();
      return this.getSettings();
    }

    return {
      selectedFacilityId: settings.selectedFacilityId,
      basePath: settings.basePath,
      outputPath: settings.outputPath,
      os: settings.os,
      theme: settings.theme,
      autoSave: settings.autoSave,
      notifications: settings.notifications,
    };
  }

  async getDefaultSettings(): Promise<DatabaseSettings> {
    // Retornar valores por defecto hardcodeados
    return {
      selectedFacilityId: '1',
      basePath: 'C:\\Production\\Files',
      outputPath: 'C:\\Production\\Output',
      os: 'windows',
      theme: 'light',
      autoSave: false,
      notifications: true,
    };
  }

  async updateSettings(
    updates: Partial<DatabaseSettings>,
  ): Promise<DatabaseSettings> {
    let settings = await this.settingsRepo.findOne({ where: { id: 1 } });

    if (!settings) {
      settings = this.settingsRepo.create({ id: 1, ...updates });
    } else {
      Object.assign(settings, updates);
    }

    await this.settingsRepo.save(settings);

    // Notificar cambio
    this.databaseGateway.notifyDatabaseChange();

    return this.getSettings();
  }

  async resetSettingsToDefault(): Promise<DatabaseSettings> {
    const defaultSettings = await this.getDefaultSettings();
    return this.updateSettings(defaultSettings);
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  async getDatabaseInfo(): Promise<any> {
    const facilitiesCount = await this.facilityRepo.count();
    const ordersCount = await this.orderRepo.count();
    const settings = await this.getSettings();

    return {
      type: 'SQLite (TypeORM)',
      facilitiesCount,
      ordersCount,
      settings,
      isProduction: process.env.NODE_ENV === 'production',
    };
  }

  async resetDatabase(): Promise<void> {
    this.logger.warn('🗑️  Resetting database...');

    // Eliminar todos los datos
    await this.orderRepo.clear();
    await this.facilityRepo.clear();
    await this.settingsRepo.clear();

    // Crear datos por defecto
    await this.ensureDefaultSettings();

    // Crear facilities por defecto
    await this.createFacility('Reynosa');
    await this.createFacility('Merida');
    await this.createFacility('San Luis');

    // Crear orders por defecto
    const facilities = await this.getFacilities();
    if (facilities.length > 0) {
      await this.createOrder('Laser', facilities[0].id, 'active');
      await this.createOrder('No Laser', facilities[0].id, 'active');
    }

    this.logger.log('✅ Database reset complete');

    // Notificar cambio
    this.databaseGateway.notifyDatabaseChange();
  }
}
```

---

### FASE 6: Script de Migración de Datos (1 hora)

Este script migrará los datos del JSON existente a SQLite.

**Archivo:** `nest-ui-be/src/database/migration.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Facility } from './entities/facility.entity';
import { Order } from './entities/order.entity';
import { Settings } from './entities/settings.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(
    @InjectRepository(Facility)
    private facilityRepo: Repository<Facility>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(Settings)
    private settingsRepo: Repository<Settings>,
  ) {}

  /**
   * Migra datos desde database.json a SQLite
   */
  async migrateFromJSON(): Promise<{
    success: boolean;
    facilitiesMigrated: number;
    ordersMigrated: number;
    error?: string;
  }> {
    const jsonPath = path.join(process.cwd(), 'data', 'database.json');

    if (!fs.existsSync(jsonPath)) {
      this.logger.warn('⚠️  No JSON database found, skipping migration');
      return {
        success: false,
        facilitiesMigrated: 0,
        ordersMigrated: 0,
        error: 'JSON file not found',
      };
    }

    this.logger.log('🔄 Starting migration from JSON to SQLite...');

    try {
      // Leer JSON
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

      // Verificar si ya hay datos en SQLite
      const existingFacilities = await this.facilityRepo.count();
      if (existingFacilities > 0) {
        this.logger.warn(
          '⚠️  SQLite database already has data, skipping migration',
        );
        return {
          success: false,
          facilitiesMigrated: 0,
          ordersMigrated: 0,
          error: 'Database already has data',
        };
      }

      let facilitiesCount = 0;
      let ordersCount = 0;

      // Migrar facilities
      this.logger.log('📦 Migrating facilities...');
      for (const facilityData of data.facilities) {
        const facility = this.facilityRepo.create({
          id: facilityData.id,
          name: facilityData.name,
          createdAt: new Date(facilityData.createdAt),
          updatedAt: new Date(facilityData.updatedAt),
        });
        await this.facilityRepo.save(facility);
        facilitiesCount++;
      }
      this.logger.log(`✅ Migrated ${facilitiesCount} facilities`);

      // Migrar orders
      this.logger.log('📦 Migrating orders...');
      for (const orderData of data.orders) {
        const order = this.orderRepo.create({
          id: orderData.id,
          name: orderData.name,
          status: orderData.status,
          facilityId: orderData.facilityId,
          createdAt: new Date(orderData.createdAt),
          updatedAt: new Date(orderData.updatedAt),
        });
        await this.orderRepo.save(order);
        ordersCount++;
      }
      this.logger.log(`✅ Migrated ${ordersCount} orders`);

      // Migrar settings
      this.logger.log('📦 Migrating settings...');
      const settings = this.settingsRepo.create({
        id: 1,
        selectedFacilityId: data.settings.selectedFacilityId,
        basePath: data.settings.basePath,
        outputPath: data.settings.outputPath,
        os: data.settings.os,
        theme: data.settings.theme,
        autoSave: data.settings.autoSave,
        notifications: data.settings.notifications,
      });
      await this.settingsRepo.save(settings);
      this.logger.log('✅ Settings migrated');

      // Hacer backup del JSON
      const backupPath = jsonPath.replace('.json', '.backup.json');
      fs.copyFileSync(jsonPath, backupPath);
      this.logger.log(`📦 JSON backup created: ${backupPath}`);

      this.logger.log('✅ Migration completed successfully!');

      return {
        success: true,
        facilitiesMigrated: facilitiesCount,
        ordersMigrated: ordersCount,
      };
    } catch (error) {
      this.logger.error('❌ Migration failed:', error);
      return {
        success: false,
        facilitiesMigrated: 0,
        ordersMigrated: 0,
        error: error.message,
      };
    }
  }

  /**
   * Verifica el estado de la migración
   */
  async checkMigrationStatus(): Promise<{
    jsonExists: boolean;
    sqliteHasData: boolean;
    facilitiesCount: number;
    ordersCount: number;
  }> {
    const jsonPath = path.join(process.cwd(), 'data', 'database.json');
    const jsonExists = fs.existsSync(jsonPath);

    const facilitiesCount = await this.facilityRepo.count();
    const ordersCount = await this.orderRepo.count();

    return {
      jsonExists,
      sqliteHasData: facilitiesCount > 0 || ordersCount > 0,
      facilitiesCount,
      ordersCount,
    };
  }
}
```

---

### FASE 7: Actualizar Módulos y Controladores

#### 7.1: Actualizar database.module.ts

```typescript
import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseTypeOrmService } from './database-typeorm.service';
import { MigrationService } from './migration.service';
import { DatabaseGateway } from './database.gateway';
import { Facility } from './entities/facility.entity';
import { Order } from './entities/order.entity';
import { Settings } from './entities/settings.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Facility, Order, Settings])],
  providers: [
    DatabaseTypeOrmService,
    MigrationService,
    DatabaseGateway,
    // Alias para mantener compatibilidad
    {
      provide: 'DatabaseService',
      useExisting: DatabaseTypeOrmService,
    },
  ],
  exports: [
    DatabaseTypeOrmService,
    MigrationService,
    DatabaseGateway,
    TypeOrmModule,
  ],
})
export class DatabaseModule {}
```

#### 7.2: Crear endpoint de migración

**Archivo:** `nest-ui-be/src/database/database.controller.ts`

```typescript
import { Controller, Post, Get } from '@nestjs/common';
import { MigrationService } from './migration.service';
import { DatabaseTypeOrmService } from './database-typeorm.service';

@Controller('database')
export class DatabaseController {
  constructor(
    private migrationService: MigrationService,
    private databaseService: DatabaseTypeOrmService,
  ) {}

  @Post('migrate')
  async migrate() {
    return this.migrationService.migrateFromJSON();
  }

  @Get('migration-status')
  async getMigrationStatus() {
    return this.migrationService.checkMigrationStatus();
  }

  @Get('info')
  async getInfo() {
    return this.databaseService.getDatabaseInfo();
  }

  @Post('reset')
  async reset() {
    await this.databaseService.resetDatabase();
    return { message: 'Database reset successfully' };
  }
}
```

---

### FASE 8: Testing (1 hora)

#### 8.1: Probar la migración

```bash
# 1. Iniciar el backend
cd nest-ui-be
npm run start:dev

# 2. Verificar estado de migración
curl http://localhost:3000/database/migration-status

# 3. Ejecutar migración
curl -X POST http://localhost:3000/database/migrate

# 4. Verificar datos migrados
curl http://localhost:3000/database/info
curl http://localhost:3000/facilities
curl http://localhost:3000/orders
curl http://localhost:3000/settings
```

#### 8.2: Verificar en el frontend

1. Abrir la aplicación
2. Ir a Settings
3. Verificar que los datos se muestran correctamente
4. Crear una nueva facility
5. Editar una facility
6. Eliminar una facility
7. Verificar que todo funciona

---

### FASE 9: Actualizar GitHub Actions

**Archivo:** `.github/workflows/build-windows.yml`

Agregar después del paso "Install Backend Dependencies":

```yaml
- name: Rebuild better-sqlite3 for Windows
  run: |
    cd nest-ui-be
    npm rebuild better-sqlite3

# ... más adelante, antes de "Build Electron"

- name: Rebuild better-sqlite3 for Electron
  run: |
    cd nest-electron
    npm install better-sqlite3
    npm rebuild better-sqlite3 --runtime=electron --target=28.0.0 --dist-url=https://electronjs.org/headers
```

---

### FASE 10: Actualizar Electron Builder

**Archivo:** `nest-electron/package.json`

Agregar en la sección `build`:

```json
{
  "build": {
    "extraResources": [
      // ... recursos existentes ...
      {
        "from": "node_modules/better-sqlite3/build/Release",
        "to": "app.asar.unpacked/node_modules/better-sqlite3/build/Release"
      }
    ],
    "asarUnpack": ["**/node_modules/better-sqlite3/**/*"]
  }
}
```

---

## ✅ Checklist Final

- [ ] Instalar dependencias (`npm install`)
- [ ] Crear entidades TypeORM
- [ ] Configurar TypeORM en app.module.ts
- [ ] Crear DatabaseTypeOrmService
- [ ] Crear MigrationService
- [ ] Crear DatabaseController
- [ ] Actualizar database.module.ts
- [ ] Probar migración en desarrollo
- [ ] Verificar que el frontend funciona
- [ ] Actualizar GitHub Actions
- [ ] Actualizar Electron Builder
- [ ] Hacer commit y push
- [ ] Probar build en GitHub Actions
- [ ] Probar instalador generado

---

## 🚨 Rollback (Si algo sale mal)

```bash
# 1. Restaurar backup
cd nest-ui-be/data
cp database.backup.json database.json

# 2. Volver a la rama anterior
git checkout main

# 3. Eliminar rama de migración
git branch -D feature/migrate-to-sqlite
```

---

## 📚 Recursos

- [TypeORM Documentation](https://typeorm.io/)
- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)
- [NestJS TypeORM Integration](https://docs.nestjs.com/techniques/database)

---

**Tiempo estimado total:** 4-6 horas
**Dificultad:** Media
**Riesgo:** Bajo (tenemos backup)
