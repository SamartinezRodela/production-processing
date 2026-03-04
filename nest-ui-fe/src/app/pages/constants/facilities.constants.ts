export interface Facility {
  id: string;
  name: string;
}

export const DEFAULT_FACILITIES: Facility[] = [
  { id: '1', name: 'Reynosa' },
  { id: '2', name: 'Merida' },
  { id: '3', name: 'San Luis' },
];

export const DEFAULT_ORDERS: Facility[] = [
  { id: '1', name: 'Order A' },
  { id: '2', name: 'Order B' },
  { id: '3', name: 'Order C' },
];
