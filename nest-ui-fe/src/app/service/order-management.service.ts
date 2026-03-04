import { Injectable, signal, computed } from '@angular/core';
import { Order } from '../models/database.types';
import { OrdersApiService } from '../service/orders-api.service';
import { WebSocketService } from './websocket.service';

@Injectable({
  providedIn: 'root',
})
export class OrderManagementService {
  orders = signal<Order[]>([]);
  selectedOrder = signal<string>('1');

  orderOptions = computed(() =>
    this.orders().map((order) => ({
      value: order.id,
      label: order.name,
    })),
  );

  constructor(
    private ordersApi: OrdersApiService,
    private websocketService: WebSocketService,
  ) {
    this.loadOrders();
    this.setupWebSocket();
  }

  /**
   * Configura WebSocket para escuchar cambios en la base de datos
   */
  private async setupWebSocket(): Promise<void> {
    await this.websocketService.connect();

    this.websocketService.onDatabaseChanged().subscribe(() => {
      console.log('🔄 Reloading orders due to database change');
      this.loadOrders();
    });
  }

  async loadOrders(facilityId?: string): Promise<void> {
    const orders = await this.ordersApi.getAll(facilityId);
    this.orders.set(orders);
  }

  async addOrder(
    name: string,
    facilityId?: string,
    status: 'active' | 'inactive' | 'completed' = 'active',
  ): Promise<boolean> {
    const newOrder = await this.ordersApi.create(name, facilityId, status);

    if (newOrder) {
      this.orders.set([...this.orders(), newOrder]);
      return true;
    }

    return false;
  }

  async updateOrder(
    id: string,
    updates: { name?: string; facilityId?: string; status?: string },
  ): Promise<boolean> {
    const updated = await this.ordersApi.update(id, updates);

    if (updated) {
      this.orders.set(this.orders().map((o) => (o.id === id ? updated : o)));
      return true;
    }

    return false;
  }

  async removeOrder(id: string): Promise<boolean> {
    const deleted = await this.ordersApi.delete(id);

    if (deleted) {
      this.orders.set(this.orders().filter((o) => o.id !== id));
      return true;
    }

    return false;
  }

  getOrderById(id: string): Order | undefined {
    return this.orders().find((o) => o.id === id);
  }

  setSelectedOrder(orderId: string): void {
    this.selectedOrder.set(orderId);
  }
}
