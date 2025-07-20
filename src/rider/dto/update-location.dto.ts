import { IsString, IsNumber } from 'class-validator';

export class UpdateLocationDto {
  @IsString()
  riderId: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
} 