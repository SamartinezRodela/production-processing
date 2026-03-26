export interface Facility {
  id: string;
  name: string;
  warehouse?: string;
}

export const DEFAULT_FACILITIES: Facility[] = [
  { id: '1', name: 'Reynosa', warehouse: '408' },
  { id: '2', name: 'Merida', warehouse: '409' },
  { id: '3', name: 'San Luis', warehouse: '410' },
];

export const DEFAULT_ORDERS: Facility[] = [
  { id: '1', name: 'Laser' },
  { id: '2', name: 'No Laser' },
];
