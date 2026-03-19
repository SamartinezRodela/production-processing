import { Test, TestingModule } from '@nestjs/testing';
import { PythonService } from './python.service';
import { SettingsService } from '../settings/settings.service';
import { PythonGateway } from './python.gateway';

// Mockeamos child_process para no abrir Python real durante los tests
jest.mock('child_process', () => ({
  spawn: jest.fn().mockReturnValue({
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() },
    on: jest.fn((event, callback) => {
      if (event === 'close') callback(0); // Simular que el script terminó con éxito
    }),
  }),
}));

describe('PythonService', () => {
  let service: PythonService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PythonService,
        {
          provide: SettingsService,
          useValue: {
            getSettings: jest.fn().mockReturnValue({
              basePath: 'C:\\test',
              outputPath: 'C:\\test\\out',
            }),
          },
        },
        {
          provide: PythonGateway,
          useValue: {
            emitProgress: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PythonService>(PythonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get debug info properly', () => {
    const info = service.getDebugInfo();
    expect(info).toBeDefined();
    expect(info.platform).toBeDefined();
  });
});
