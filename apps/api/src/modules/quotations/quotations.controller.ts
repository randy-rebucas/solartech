import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { QuotationsService } from './quotations.service';
import {
  CreateQuotationDto,
  UpdateQuotationInputDto,
  UpdateQuotationStatusDto,
} from './dto/quotation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '@solartech/shared';

@ApiTags('Quotations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'quotations', version: '1' })
export class QuotationsController {
  constructor(private service: QuotationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new AI-powered solar quotation' })
  create(@Body() dto: CreateQuotationDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }

  @Post('estimate')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quick estimate without saving (public)' })
  estimate(@Body() dto: CreateQuotationDto) {
    return this.service.estimate(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List quotations (filtered by role)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.findAll(user, page ?? 1, limit ?? 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quotation by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Approve / reject / expire a quotation' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateQuotationStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.updateStatus(id, dto, user);
  }

  @Post(':id/recalculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recalculate outputs with latest pricing' })
  recalculate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.recalculate(id, user);
  }

  @Patch(':id/input')
  @ApiOperation({ summary: 'Update quotation inputs and recalculate' })
  updateInput(
    @Param('id') id: string,
    @Body() dto: UpdateQuotationInputDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.updateInput(id, dto, user);
  }

  @Post(':id/proposal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate AI proposal narrative and analytics' })
  generateProposal(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.generateProposal(id, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a quotation' })
  delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.delete(id, user);
  }
}
