import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from './database.service';
import { DatabaseGateway } from './database.gateway';
import * as fs from 'fs';
import * as chokidar from 'chokidar';

// 1. Mockeamos el File System y Chokidar para no escribir en el disco real durante los tests
jest.mock('fs');
jest.mock('chokidar', () => ({
  watch: jest.fn().mockReturnValue({
    on: jest.fn(),
    close: jest.fn(),
  }),
}));

describe('DatabaseService', () => {
  let service: DatabaseService;
  let gateway: DatabaseGateway;

  beforeEach(async () => {
    // Limpiar mocks antes de cada test
    jest.clearAllMocks();

    // Configurar fs para simular que no existe la BD y force la creación por defecto
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (fs.renameSync as jest.Mock).mockImplementation(() => {});
    (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
    (fs.statSync as jest.Mock).mockReturnValue({ size: 1024 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        {
          provide: DatabaseGateway,
          useValue: {
            notifyDatabaseChange: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
    gateway = module.get<DatabaseGateway>(DatabaseGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Facilities CRUD', () => {
    it('should create a new facility with UUID', () => {
      const initialCount = service.getFacilities().length;
      const newFacility = service.createFacility('Test Facility');

      expect(newFacility).toBeDefined();
      expect(newFacility.name).toBe('Test Facility');
      expect(newFacility.id).toBeDefined(); // Verifica que tenga un ID asignado
      expect(service.getFacilities().length).toBe(initialCount + 1);
      expect(fs.writeFileSync).toHaveBeenCalled(); // Verifica que se intentó guardar
    });

    it('should update an existing facility', () => {
      const facility = service.getFacilities()[0]; // Tomamos una por defecto
      const updated = service.updateFacility(facility.id, 'Updated Name');

      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('Updated Name');
    });
  });

  describe('Orders CRUD', () => {
    it('should create a new order', () => {
      const initialCount = service.getOrders().length;
      const newOrder = service.createOrder('Test Order', '1', 'active');

      expect(newOrder.name).toBe('Test Order');
      expect(newOrder.facilityId).toBe('1');
      expect(service.getOrders().length).toBe(initialCount + 1);
    });

    it('should delete an order', () => {
      const newOrder = service.createOrder('Order To Delete');
      const initialCount = service.getOrders().length;

      const result = service.deleteOrder(newOrder.id);

      expect(result).toBe(true);
      expect(service.getOrders().length).toBe(initialCount - 1);
    });
  });
});
