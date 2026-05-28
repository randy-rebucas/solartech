import {
  IsNumber, IsString, IsBoolean, IsOptional, IsEnum,
  Min, Max, IsLatitude, IsLongitude,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuotationDto {
  @ApiProperty({ description: 'Monthly electricity bill in PHP' })
  @IsNumber() @Min(0)
  monthlyBill: number;

  @ApiProperty({ description: 'Monthly kWh consumption' })
  @IsNumber() @Min(0)
  monthlyKwh: number;

  @ApiProperty({ description: 'Available roof area in sqm' })
  @IsNumber() @Min(1)
  roofArea: number;

  @ApiPropertyOptional({ description: 'Roof length in meters (optional; used with width)' })
  @IsOptional() @IsNumber() @Min(1)
  roofLength?: number;

  @ApiPropertyOptional({ description: 'Roof width in meters (optional; used with length)' })
  @IsOptional() @IsNumber() @Min(1)
  roofWidth?: number;

  @ApiProperty({ enum: ['flat','pitched','metal','concrete'] })
  @IsEnum(['flat','pitched','metal','concrete'])
  roofType: string;

  @ApiPropertyOptional({ description: 'Roof azimuth in degrees (0=North, 180=South)' })
  @IsOptional() @IsNumber() @Min(0) @Max(360)
  roofAzimuth?: number;

  @ApiProperty()
  @IsLatitude()
  latitude: number;

  @ApiProperty()
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(0) @Max(12)
  peakSunHours?: number;

  @ApiProperty({ enum: ['on_grid','off_grid','hybrid'] })
  @IsEnum(['on_grid','off_grid','hybrid'])
  gridType: string;

  @ApiProperty()
  @IsBoolean()
  includesBattery: boolean;

  @ApiPropertyOptional({ default: 'PHP' })
  @IsOptional() @IsString()
  currency?: string;

  @ApiProperty({ description: 'Utility rate per kWh' })
  @IsNumber() @Min(0)
  utilityRate: number;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  province?: string;

  @ApiPropertyOptional({ description: 'Province key for PSH lookup (e.g. metro_manila, cebu)' })
  @IsOptional() @IsString()
  provinceKey?: string;

  @ApiPropertyOptional({ description: 'Client user ID if creating for a client' })
  @IsOptional() @IsString()
  clientId?: string;
}

export class UpdateQuotationInputDto extends CreateQuotationDto {}

export class UpdateQuotationStatusDto {
  @ApiProperty({ enum: ['approved','rejected','expired'] })
  @IsEnum(['approved','rejected','expired'])
  status: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;
}
