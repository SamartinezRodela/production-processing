export interface Facility {
  id: string;
  name: string;
  warehouse?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  name: string;
  facilityId?: string;
  status?: 'active' | 'inactive' | 'completed';
  createdAt?: string;
  updatedAt?: string;
}
