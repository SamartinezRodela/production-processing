import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
} from '../database/dto/create-order.dto';
import { Order } from '../database/entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(private readonly databaseService: DatabaseService) {}

  findAll(): Order[] {
    return this.databaseService.getOrders();
  }

  findOne(id: string): Order | undefined {
    return this.databaseService.getOrderById(id);
  }

  findByFacility(facilityId: string): Order[] {
    return this.databaseService.getOrdersByFacility(facilityId);
  }

  create(createOrderDto: CreateOrderDto): Order {
    return this.databaseService.createOrder(
      createOrderDto.name,
      createOrderDto.facilityId,
      createOrderDto.status || 'active',
    );
  }

  update(id: string, updateOrderDto: UpdateOrderDto): Order | null {
    return this.databaseService.updateOrder(id, updateOrderDto);
  }

  remove(id: string): boolean {
    return this.databaseService.deleteOrder(id);
  }
}
