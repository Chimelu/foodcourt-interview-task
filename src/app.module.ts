import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import Knex from 'knex';
import knexConfig from '../knexfile';
import { RiderController } from './rider/rider.controller';
import { RiderService } from './rider/rider.service';
import { DispatchGateway } from './dispatch.gateway';
import { OrderController } from './order/order.controller';
import { OrderService } from './order/order.service';

const knexProvider = {
  provide: 'KnexConnection',
  useFactory: async (configService: ConfigService) => {
    const env = configService.get('NODE_ENV') || 'development';
    return Knex(knexConfig[env]);
  },
  inject: [ConfigService],
};

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController, RiderController, OrderController],
  providers: [AppService, RiderService, OrderService, DispatchGateway, knexProvider],
})
export class AppModule {}
