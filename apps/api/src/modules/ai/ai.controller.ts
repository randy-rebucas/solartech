import {
  Controller, Get, Post, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@solartech/shared';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'ai', version: '1' })
export class AiController {
  constructor(private service: AiService) {}

  @Get('anomalies/:deviceId')
  detectAnomalies(@Param('deviceId') deviceId: string) {
    return this.service.detectAnomalies(deviceId);
  }

  @Get('forecast/:deviceId')
  forecastEnergy(
    @Param('deviceId') deviceId: string,
    @Query('days') days?: number,
  ) {
    return this.service.forecastEnergy(deviceId, days);
  }

  @Get('efficiency/:deviceId')
  getEfficiencyScore(@Param('deviceId') deviceId: string) {
    return this.service.getEfficiencyScore(deviceId);
  }

  @Post('chat')
  chat(
    @Body() body: {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      context?: {
        systemSummary?: object;
        recentAlerts?: string[];
        language?: string;
        audience?: 'customer' | 'technician' | 'sales' | 'finance' | 'operator';
        capability?: 'proposal_explainer' | 'usage_analysis' | 'upgrade_recommendation' | 'issue_detection' | 'qa' | 'technician_assist';
        voice?: { enabled?: boolean; transcriptSource?: 'browser' | 'device' | 'manual' };
      };
    },
  ) {
    return this.service.chat(body.messages, body.context).then((reply) => ({ reply }));
  }

  @Post('report')
  generateReport(@Body() body: { type: string; data: object }) {
    return this.service.generateReport(body.type, body.data).then((report) => ({ report }));
  }
}
