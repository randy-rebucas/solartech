import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class TrackSiteEventDto {
  @ApiProperty({ enum: ['visit', 'pageview', 'click'] })
  @IsIn(['visit', 'pageview', 'click'])
  type: 'visit' | 'pageview' | 'click';

  @ApiPropertyOptional({ example: 'Asia/Manila' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({ example: 'en-PH' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  locale?: string;

  @ApiPropertyOptional({ example: '/pricing' })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  path?: string;
}
