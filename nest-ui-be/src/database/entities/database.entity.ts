import { Facility } from './facility.entity';
import { Order } from './order.entity';

export interface DatabaseSettings {
  selectedFacilityId: string;
  basePath: string;
  os: 'windows' | 'macos';
}

export class Database {
  version: string;
  lastModified: string;
  facilities: Facility[];
  orders: Order[];
  settings: DatabaseSettings;
}
