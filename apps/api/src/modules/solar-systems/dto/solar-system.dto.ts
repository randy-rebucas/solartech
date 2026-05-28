import { Type } from 'class-transformer';
import {
  IsNumber, IsString, IsOptional, Min, ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SolarSystemLocationDto {
  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  province: string;

  @ApiPropertyOptional({ default: 'PH' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty()
  @IsNumber()
  latitude: number;

  @ApiProperty()
  @IsNumber()
  longitude: number;
}

export class CreateSolarSystemDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.1)
  systemSizeKw: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quotationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({ type: SolarSystemLocationDto })
  @ValidateNested()
  @Type(() => SolarSystemLocationDto)
  location: SolarSystemLocationDto;
}
