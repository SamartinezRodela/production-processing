export class CreateOrderDto {
  name: string;
  facilityId?: string;
  status?: 'active' | 'inactive' | 'completed';
}

export class UpdateOrderDto {
  name?: string;
  facilityId?: string;
  status?: 'active' | 'inactive' | 'completed';
}
