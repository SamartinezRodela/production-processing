import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
  forwardRef,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';
import { Database, DatabaseSettings } from './entities/database.entity';
import { Facility } from './entities/facility.entity';
import { Order } from './entities/order.entity';
import { DatabaseGateway } from './database.gateway';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private dbPath: string;
  private database: Database;
  private watcher: chokidar.FSWatcher | null = null;

  constructor(
    @Inject(forwardRef(() => DatabaseGateway))
    private databaseGateway: DatabaseGateway,
  ) {
    this.initializeDatabase();
  }

  /**
   * Se ejecuta cuando el módulo se inicializa
   */
  onModuleInit() {
    this.startFileWatcher();
  }

  /**
   * Se ejecuta cuando el módulo se destruye
   */
  onModuleDestroy() {
    this.stopFileWatcher();
  }

  /**
   * Inicia el file watcher para detectar cambios en database.json
   */
  private startFileWatcher(): void {
    this.logger.log(' Starting file watcher for database.json');

    this.watcher = chokidar.watch(this.dbPath, {
      persistent: true,
      ignoreInitial: true, // No disparar evento en la carga inicial
      awaitWriteFinish: {
        stabilityThreshold: 500, // Esperar 500ms después del último cambio
        pollInterval: 100,
      },
    });

    this.watcher.on('change', (path) => {
      this.logger.log(` Database file changed: ${path}`);
      this.reloadDatabase();
      // ✅ NUEVO: Notificar a todos los clientes conectados
      this.databaseGateway.notifyDatabaseChange();
    });

    this.watcher.on('error', (error) => {
      this.logger.error(' File watcher error:', error);
    });

    this.logger.log(' File watcher started successfully');
  }

  /**
   * Detiene el file watcher
   */
  private stopFileWatcher(): void {
    if (this.watcher) {
      this.watcher.close();
      this.logger.log('File watcher stopped');
    }
  }

  /**
   * Inicializa la base de datos
   */
  private initializeDatabase(): void {
    // Determinar la ruta del archivo database.json
    this.dbPath = this.getDatabasePath();

    this.logger.log('='.repeat(60));
    this.logger.log('📂 INICIALIZANDO BASE DE DATOS');
    this.logger.log('='.repeat(60));
    this.logger.log(`Ruta de base de datos: ${this.dbPath}`);
    this.logger.log(`Archivo existe: ${fs.existsSync(this.dbPath)}`);

    const isProduction =
      process.env.NODE_ENV === 'production' ||
      (process as any).resourcesPath !== undefined;

    this.logger.log(`Modo: ${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'}`);
    this.logger.log(`NODE_ENV: ${process.env.NODE_ENV || 'no definido'}`);
    this.logger.log(
      `resourcesPath: ${(process as any).resourcesPath || 'no definido'}`,
    );
    this.logger.log('='.repeat(60));

    // Cargar o crear la base de datos
    if (fs.existsSync(this.dbPath)) {
      this.loadDatabase();
    } else {
      this.logger.warn('⚠️  Base de datos no encontrada, creando nueva...');
      this.createDefaultDatabase();
    }
  }

  /**
   * Obtiene la ruta del archivo database.json
   */
  private getDatabasePath(): string {
    const isProduction =
      process.env.NODE_ENV === 'production' ||
      (process as any).resourcesPath !== undefined;

    if (isProduction) {
      // En producción, usar la carpeta de datos de usuario
      const userDataPath =
        process.env.APPDATA || path.join(process.env.HOME || '~', '.config');
      const appFolder = path.join(userDataPath, 'Production Processing');

      // Crear carpeta si no existe
      if (!fs.existsSync(appFolder)) {
        fs.mkdirSync(appFolder, { recursive: true });
      }

      const userDbPath = path.join(appFolder, 'database.json');

      // Si no existe la base de datos del usuario, copiar la plantilla
      if (!fs.existsSync(userDbPath)) {
        this.copyTemplateDatabase(userDbPath);
      }

      return userDbPath;
    } else {
      // En desarrollo, usar carpeta del proyecto
      const devPath = path.join(process.cwd(), 'data');

      if (!fs.existsSync(devPath)) {
        fs.mkdirSync(devPath, { recursive: true });
      }

      return path.join(devPath, 'database.json');
    }
  }

  /**
   * Copia la base de datos plantilla desde resources si existe
   */
  private copyTemplateDatabase(targetPath: string): void {
    try {
      const resourcesPath =
        process.env.RESOURCES_PATH || (process as any).resourcesPath;

      if (resourcesPath) {
        const templatePath = path.join(
          resourcesPath,
          'backend',
          'data',
          'database.json',
        );

        if (fs.existsSync(templatePath)) {
          fs.copyFileSync(templatePath, targetPath);
          this.logger.log(`✅ Template database copied from: ${templatePath}`);
          return;
        }
      }

      this.logger.log('ℹ️ No template database found, will create default');
    } catch (error) {
      this.logger.warn(`⚠️ Could not copy template database: ${error.message}`);
    }
  }

  /**
   * Carga la base de datos desde el archivo
   */
  private loadDatabase(): void {
    try {
      const data = fs.readFileSync(this.dbPath, 'utf8');
      this.database = JSON.parse(data);
      this.logger.log(' Database loaded successfully');
    } catch (error) {
      this.logger.error('Error loading database:', error);
      this.createDefaultDatabase();
    }
  }

  /**
   * Crea la base de datos con valores por defecto
   */
  private createDefaultDatabase(): void {
    const now = new Date().toISOString();

    const defaultSettingsValues: DatabaseSettings = {
      selectedFacilityId: '1',
      basePath: 'C:\\Production\\Files',
      outputPath: 'C:\\Production\\Output',
      os: 'windows',
      theme: 'light',
      autoSave: false,
      notifications: true,
    };

    this.database = {
      version: '1.0.0',
      lastModified: now,
      facilities: [
        {
          id: '1',
          name: 'Reynosa',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: '2',
          name: 'Merida',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: '3',
          name: 'San Luis',
          createdAt: now,
          updatedAt: now,
        },
      ],
      orders: [
        {
          id: '1',
          name: 'Order A',
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: '2',
          name: 'Order B',
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
      ],
      defaultSettings: defaultSettingsValues, // ✅ NUEVO
      settings: { ...defaultSettingsValues }, // ✅ Copia de defaults
    };

    this.saveDatabase();
    this.logger.log(' Default database created');
  }

  /**
   * Guarda la base de datos en el archivo
   */
  private saveDatabase(): void {
    try {
      this.database.lastModified = new Date().toISOString();

      this.logger.log(`💾 Guardando base de datos en: ${this.dbPath}`);

      fs.writeFileSync(
        this.dbPath,
        JSON.stringify(this.database, null, 2),
        'utf8',
      );

      this.logger.log('✅ Base de datos guardada exitosamente');
      this.logger.log(`   Ruta: ${this.dbPath}`);
      this.logger.log(`   Tamaño: ${fs.statSync(this.dbPath).size} bytes`);
    } catch (error) {
      this.logger.error(`❌ Error guardando base de datos: ${error.message}`);
      this.logger.error(`   Ruta intentada: ${this.dbPath}`);
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
    status: 'active' | 'inactive' | 'completed' = 'active',
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
    updates: Partial<Omit<Order, 'id' | 'createdAt'>>,
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
  getSettings(): DatabaseSettings {
    // Si no existen settings, crearlos desde defaults
    if (!this.database.settings) {
      this.database.settings = this.getDefaultSettings();
      this.saveDatabase();
    }
    return this.database.settings;
  }

  /**
   * Obtiene los default settings
   */
  getDefaultSettings(): DatabaseSettings {
    // Si no existen defaultSettings, crearlos
    if (!this.database.defaultSettings) {
      this.database.defaultSettings = {
        selectedFacilityId: '1',
        basePath: 'C:\\Production\\Files',
        outputPath: 'C:\\Production\\Output',
        os: 'windows',
        theme: 'light',
        autoSave: false,
        notifications: true,
      };
      this.saveDatabase();
    }
    return this.database.defaultSettings;
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
   * Resetea los settings a los valores por defecto
   */
  resetSettingsToDefault() {
    this.database.settings = { ...this.database.defaultSettings };
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
   * Recarga la base de datos desde el archivo
   * Útil cuando se edita manualmente el JSON
   */
  reloadDatabase(): Database {
    this.logger.log('🔄 Reloading database from file...');
    this.loadDatabase();
    return this.database;
  }

  /**
   * Crea un backup de la base de datos
   */
  createBackup(): string {
    const backupPath = this.dbPath.replace(
      '.json',
      `.backup.${Date.now()}.json`,
    );
    fs.copyFileSync(this.dbPath, backupPath);
    this.logger.log(`✅ Backup created: ${backupPath}`);
    return backupPath;
  }

  /**
   * Obtiene información de diagnóstico de la base de datos
   */
  getDatabaseInfo(): any {
    const isProduction =
      process.env.NODE_ENV === 'production' ||
      (process as any).resourcesPath !== undefined;

    return {
      dbPath: this.dbPath,
      exists: fs.existsSync(this.dbPath),
      size: fs.existsSync(this.dbPath) ? fs.statSync(this.dbPath).size : 0,
      lastModified: this.database.lastModified,
      isProduction: isProduction,
      nodeEnv: process.env.NODE_ENV || 'no definido',
      resourcesPath: (process as any).resourcesPath || 'no definido',
      appData: process.env.APPDATA || 'no definido',
      facilitiesCount: this.database.facilities.length,
      ordersCount: this.database.orders.length,
    };
  }
}
