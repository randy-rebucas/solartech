import {
  IsString, IsOptional, IsNumber, IsEnum, IsDateString, Min, Max, MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeadDto {
  @ApiProperty()
  @IsString() @MinLength(3)
  title: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  province?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  installerId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(0)
  systemSizeKw?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(0)
  budgetMin?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(0)
  budgetMax?: number;

  @ApiPropertyOptional({ enum: ['quotation', 'installation', 'maintenance', 'consultation'] })
  @IsOptional() @IsEnum(['quotation', 'installation', 'maintenance', 'consultation'])
  requestType?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  preferredStartDate?: string;
}

export class UpdateLeadStatusDto {
  @ApiProperty({ enum: ['open', 'bidding', 'awarded', 'closed', 'cancelled'] })
  @IsEnum(['open', 'bidding', 'awarded', 'closed', 'cancelled'])
  status: string;
}

export class CreateBidDto {
  @ApiProperty()
  @IsNumber() @Min(1)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  proposalText?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(1)
  estimatedDurationDays?: number;
}

export class SendMessageDto {
  @ApiProperty()
  @IsString() @MinLength(1)
  body: string;
}

export class CreateBookingDto {
  @ApiProperty()
  @IsString()
  leadId: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  bidId?: string;

  @ApiProperty()
  @IsDateString()
  scheduledDate: string;

  @ApiProperty()
  @IsNumber() @Min(1)
  totalAmount: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;
}

export class UpdateEscrowDto {
  @ApiProperty({
    enum: [
      'pending_deposit',
      'escrow_funded',
      'in_progress',
      'milestone_complete',
      'released',
      'disputed',
      'cancelled',
    ],
  })
  @IsEnum([
    'pending_deposit',
    'escrow_funded',
    'in_progress',
    'milestone_complete',
    'released',
    'disputed',
    'cancelled',
  ])
  escrowStatus: string;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(0)
  escrowHeldAmount?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(0)
  escrowReleasedAmount?: number;
}

export class UpdateCalendarDto {
  @ApiProperty({ type: [Object] })
  slots: Array<{ date: string; status: 'available' | 'busy' | 'booked' }>;
}
