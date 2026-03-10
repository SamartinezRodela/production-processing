import { Facility } from './facility.entity';
import { Order } from './order.entity';

export interface DatabaseSettings {
  selectedFacilityId: string;
  basePath: string;
  outputPath: string;
  os: 'windows' | 'macos';
  theme: 'light' | 'dark';
  autoSave: boolean;
  notifications: boolean;
}

export class Database {
  version: string;
  lastModified: string;
  facilities: Facility[];
  orders: Order[];
  defaultSettings: DatabaseSettings; // ✅ NUEVO
  settings: DatabaseSettings;
}
