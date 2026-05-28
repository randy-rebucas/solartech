import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Telemetry, TelemetryDocument } from '../../database/schemas/telemetry.schema';
import { Device, DeviceDocument } from '../../database/schemas/device.schema';

export interface AnomalyResult {
  deviceId: string;
  type: 'power_drop' | 'overtemperature' | 'frequency_fault' | 'communication_loss' | 'underperformance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  value: number;
  threshold: number;
  message: string;
  timestamp: Date;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai?: OpenAI;

  constructor(
    @InjectModel(Telemetry.name) private telemetryModel: Model<TelemetryDocument>,
    @InjectModel(Device.name)    private deviceModel: Model<DeviceDocument>,
    private config: ConfigService,
  ) {
    const key = config.get<string>('app.openai.apiKey');
    if (key) this.openai = new OpenAI({ apiKey: key });
  }

  // ─── Anomaly Detection ────────────────────────────────────────────────────
  async detectAnomalies(deviceId: string): Promise<AnomalyResult[]> {
    const device = await this.deviceModel.findById(deviceId);
    if (!device) return [];

    const latest = await this.telemetryModel
      .findOne({ deviceId: new Types.ObjectId(deviceId) })
      .sort({ timestamp: -1 })
      .lean();

    if (!latest) return [];

    const anomalies: AnomalyResult[] = [];
    const m = latest.metrics;

    // Rule-based anomaly detection
    if (m.temperatureCelsius !== undefined && m.temperatureCelsius > 70) {
      anomalies.push({
        deviceId,
        type:      'overtemperature',
        severity:  m.temperatureCelsius > 80 ? 'critical' : 'high',
        value:     m.temperatureCelsius,
        threshold: 70,
        message:   `Device temperature ${m.temperatureCelsius}°C exceeds safe threshold of 70°C`,
        timestamp: latest.timestamp,
      });
    }

    if (m.frequencyHz !== undefined && (m.frequencyHz < 59.3 || m.frequencyHz > 60.7)) {
      anomalies.push({
        deviceId,
        type:      'frequency_fault',
        severity:  'high',
        value:     m.frequencyHz,
        threshold: 60,
        message:   `Grid frequency ${m.frequencyHz}Hz is outside acceptable range (59.3–60.7Hz)`,
        timestamp: latest.timestamp,
      });
    }

    if (m.powerOutputW !== undefined && device.metadata.expectedPowerW) {
      const expected = device.metadata.expectedPowerW as number;
      const ratio    = m.powerOutputW / expected;
      if (ratio < 0.7) {
        anomalies.push({
          deviceId,
          type:      'underperformance',
          severity:  ratio < 0.5 ? 'high' : 'medium',
          value:     m.powerOutputW,
          threshold: expected * 0.7,
          message:   `Power output ${m.powerOutputW}W is ${Math.round((1 - ratio) * 100)}% below expected ${expected}W`,
          timestamp: latest.timestamp,
        });
      }
    }

    return anomalies;
  }

  // ─── Consumption Forecasting ───────────────────────────────────────────────
  async forecastEnergy(deviceId: string, daysAhead = 7): Promise<{ date: string; predictedKwh: number }[]> {
    const from = new Date(Date.now() - 30 * 86400_000);
    const history = await this.telemetryModel
      .find({ deviceId: new Types.ObjectId(deviceId), timestamp: { $gte: from } })
      .sort({ timestamp: 1 })
      .lean();

    if (!history.length) return [];

    // Simple moving-average forecast
    const dailyKwh = new Map<string, number>();
    for (const t of history) {
      const day = t.timestamp.toISOString().split('T')[0];
      dailyKwh.set(day, Math.max(dailyKwh.get(day) ?? 0, t.metrics.energyTodayKwh ?? 0));
    }

    const values = [...dailyKwh.values()].slice(-14);
    const avg    = values.reduce((a, b) => a + b, 0) / values.length;
    const trend  = values.length > 1 ? (values[values.length - 1] - values[0]) / values.length : 0;

    const forecast: { date: string; predictedKwh: number }[] = [];
    for (let i = 1; i <= daysAhead; i++) {
      const date = new Date(Date.now() + i * 86400_000).toISOString().split('T')[0];
      forecast.push({
        date,
        predictedKwh: parseFloat(Math.max(0, avg + trend * i * 0.5).toFixed(2)),
      });
    }

    return forecast;
  }

  // ─── AI Chat Assistant ─────────────────────────────────────────────────────
  async chat(messages: Array<{ role: 'user' | 'assistant'; content: string }>, context?: {
    systemSummary?: object;
    recentAlerts?: string[];
    language?: string;
    audience?: 'customer' | 'technician' | 'sales' | 'finance' | 'operator';
    capability?: 'proposal_explainer' | 'usage_analysis' | 'upgrade_recommendation' | 'issue_detection' | 'qa' | 'technician_assist';
    voice?: { enabled?: boolean; transcriptSource?: 'browser' | 'device' | 'manual' };
  }): Promise<string> {
    const language = context?.language ?? 'English';
    const audience = context?.audience ?? 'customer';
    const capability = context?.capability ?? 'qa';

    const capabilityGuide = {
      proposal_explainer: 'Explain solar proposals clearly: system size, cost, ROI, payback, assumptions, and next steps.',
      usage_analysis: 'Analyze energy usage patterns and identify peak-demand windows, savings opportunities, and load-shifting tips.',
      upgrade_recommendation: 'Recommend practical upgrades (panels, inverter, battery, smart meter, EV charger) with rationale and rough impact.',
      issue_detection: 'Identify likely faults from telemetry/anomalies and provide immediate checks, escalation criteria, and safety notes.',
      qa: 'Answer customer questions simply and accurately, clarifying uncertainty and listing action items.',
      technician_assist: 'Assist field technicians with diagnostics runbook, tools, probable causes, and step-by-step remediation.',
    } as const;

    const systemPrompt = `You are SolarBot, an expert AI assistant for the SolarTech platform — a smart solar energy management system used in the Philippines.

You help:
- Solar system owners monitor and understand their energy production
- Installers troubleshoot technical issues
- Finance officers understand billing and ROI
- LGU officers understand city-wide energy data

Active assistant mode:
- Audience: ${audience}
- Capability focus: ${capability}
- Capability objective: ${capabilityGuide[capability]}
- Preferred output language: ${language}
- Voice-ready interaction: ${context?.voice?.enabled ? 'enabled' : 'disabled'} (source: ${context?.voice?.transcriptSource ?? 'manual'})

Context about the current system:
${context?.systemSummary ? JSON.stringify(context.systemSummary, null, 2) : 'No system data available.'}

${context?.recentAlerts?.length ? `Recent alerts: ${context.recentAlerts.join(', ')}` : ''}

Guidelines:
- Be concise, professional, and helpful
- Use Philippine context (PHP currency, local utility rates ~₱9.50/kWh, MERALCO, etc.)
- If you don't know something, say so clearly
- For technical issues, always recommend professional inspection first
- Keep responses under 200 words unless detailed explanation is needed
- When useful, structure as: Summary, Findings, Recommendations, Next actions
- If language is not English, answer fully in ${language}`;

    if (!this.openai) {
      return 'AI assistant is not configured. Please add your OpenAI API key in settings.';
    }

    try {
      const res = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return res.choices[0].message.content ?? 'Unable to generate response.';
    } catch (err) {
      this.logger.error('OpenAI error', err);
      return 'AI assistant is temporarily unavailable. Please try again later.';
    }
  }

  // ─── AI Report Generation ─────────────────────────────────────────────────
  async generateReport(type: string, data: object): Promise<string> {
    if (!this.openai) return JSON.stringify(data, null, 2);

    const res = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Generate a professional ${type} report based on this data. Format as structured text with sections. Data: ${JSON.stringify(data)}`,
      }],
      max_tokens: 1000,
    });

    return res.choices[0].message.content ?? '';
  }

  // ─── Efficiency Score ─────────────────────────────────────────────────────
  async getEfficiencyScore(deviceId: string): Promise<{ score: number; grade: string; insights: string[] }> {
    const history = await this.telemetryModel
      .find({ deviceId: new Types.ObjectId(deviceId), timestamp: { $gte: new Date(Date.now() - 7 * 86400_000) } })
      .sort({ timestamp: -1 })
      .limit(168)
      .lean();

    if (!history.length) return { score: 0, grade: 'N/A', insights: ['Insufficient data'] };

    const avgPower = history.reduce((s, t) => s + (t.metrics.powerOutputW ?? 0), 0) / history.length;
    const maxPower = Math.max(...history.map((t) => t.metrics.powerOutputW ?? 0));
    const score    = Math.min(100, Math.round((avgPower / (maxPower || 1)) * 100));

    let grade = 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';

    const insights: string[] = [];
    if (score < 70) insights.push('Consider panel cleaning to restore efficiency');
    if (score < 60) insights.push('Schedule a professional inspection');
    if (score >= 85) insights.push('System performing excellently');

    return { score, grade, insights };
  }
}
