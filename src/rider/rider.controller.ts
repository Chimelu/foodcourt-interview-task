import { Controller, Put, Body, UsePipes, ValidationPipe, BadRequestException } from '@nestjs/common';
import { RiderService } from './rider.service';
import { UpdateLocationDto } from './dto/update-location.dto';

@Controller('riders')
export class RiderController {
  constructor(private readonly riderService: RiderService) {}

  @Put('me/location')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateLocation(@Body() body: UpdateLocationDto) {
    try {
      const { riderId, latitude, longitude } = body;
      await this.riderService.updateLocation(riderId, latitude, longitude);
      return { message: 'Location updated' };
    } catch (error) {
      console.error('Failed to update location:', error);
      throw new BadRequestException(error.message || 'Failed to update location');
    }
  }
} 