import { Controller, Get, Post, Body, UsePipes, ValidationPipe, BadRequestException } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('get-orders')
  async getOrdersWithRelated() {
    try {
      const result = await this.orderService.getAllOrdersWithRelatedData();
      return result.rows || result;
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      throw new BadRequestException(error.message || 'Failed to fetch orders');
    }
  }

  @Get('most-bought-meal')
  async getMostBoughtMeal() {
    try {
      const result = await this.orderService.getMostBoughtMeal();
      return result.rows[0] || result;
    } catch (error) {
      console.error('Failed to fetch most bought meal:', error);
      throw new BadRequestException(error.message || 'Failed to fetch most bought meal');
    }
  }

  @Post('create')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async createOrder(@Body() order: CreateOrderDto) {
    try {
      await this.orderService.createOrder(order);
      return { message: 'Order created and message published to RabbitMQ', order };
    } catch (error) {
      // Log error and return a user-friendly message
      console.error('Order creation failed:', error);
      throw new BadRequestException(error.message || 'Order creation failed');
    }
  }
} 