import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const DEVICE_TYPES = [
  'inverter',
  'battery',
  'smart_meter',
  'weather_sensor',
  'ev_charger',
  'esp32',
  'raspberry_pi',
] as const;

export class CreateDeviceDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: DEVICE_TYPES })
  @IsIn([...DEVICE_TYPES])
  type: string;

  @ApiProperty()
  @IsString()
  serialNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  solarSystemId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firmware?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  macAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}

export class UpdateFirmwareDto {
  @ApiProperty({ description: 'Target firmware version (e.g. 2.1.0)' })
  @IsString()
  version: string;

  @ApiPropertyOptional({ description: 'Rollout immediately or stage only' })
  @IsOptional()
  @IsBoolean()
  immediate?: boolean;
}

export class RunDiagnosticsDto {
  @ApiPropertyOptional({ description: 'Deep diagnostics mode for edge devices' })
  @IsOptional()
  @IsBoolean()
  deep?: boolean;
}
