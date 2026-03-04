export class Order {
  id: string;
  name: string;
  facilityId?: string;
  status: 'active' | 'inactive' | 'completed';
  createdAt: string;
  updatedAt: string;
}
