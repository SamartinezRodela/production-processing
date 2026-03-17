// nest-ui-be/src/database/entities/database.entity.ts

export interface Facility {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  name: string;
  facilityId?: string;
  status: 'active' | 'inactive' | 'completed';
  createdAt: string;
  updatedAt: string;
}

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
  defaultSettings: DatabaseSettings;
  settings: DatabaseSettings;
}
