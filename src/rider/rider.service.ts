import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Knex } from 'knex';
import { DispatchGateway } from '../dispatch.gateway';

@Injectable()
export class RiderService {
  constructor(
    @Inject('KnexConnection') private readonly knex: Knex,
    @Inject(forwardRef(() => DispatchGateway)) private readonly dispatchGateway: DispatchGateway,
  ) {}

  async updateLocation(riderId: string, latitude: number, longitude: number) {
    try {
      const result = await this.knex('riders')
        .where({ id: riderId })
        .update({
          current_latitude: latitude,
          current_longitude: longitude,
          is_available: true,
        });
      // Broadcast to dispatch dashboard
      this.dispatchGateway.broadcastRiderLocation({ riderId, latitude, longitude });
      return result;
    } catch (error) {
      console.error('Error updating rider location:', error);
      throw new Error('Failed to update rider location: ' + (error.message || error));
    }
  }

  async getRiderById(riderId: string) {
    return this.knex('riders').where({ id: riderId }).first();
  }
} 