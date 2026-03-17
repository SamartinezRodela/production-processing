import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
} from '../database/dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard) // Proteger todas las rutas de orders
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@Query('facilityId') facilityId?: string) {
    let orders;

    if (facilityId) {
      orders = this.ordersService.findByFacility(facilityId);
    } else {
      orders = this.ordersService.findAll();
    }

    return {
      success: true,
      data: orders,
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const order = this.ordersService.findOne(id);

    if (!order) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      data: order,
    };
  }

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    const order = this.ordersService.create(createOrderDto);

    return {
      success: true,
      message: 'Order created successfully',
      data: order,
    };
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    const order = this.ordersService.update(id, updateOrderDto);

    if (!order) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      message: 'Order updated successfully',
      data: order,
    };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const deleted = this.ordersService.remove(id);

    if (!deleted) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      message: 'Order deleted successfully',
    };
  }
}
