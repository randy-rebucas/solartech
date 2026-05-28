import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('IoT')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'iot', version: '1' })
export class IotController {
  constructor(private config: ConfigService) {}

  /** Broker URL and credentials hint for edge devices (password is not returned). */
  @Get('connection-info')
  getConnectionInfo() {
    const brokerUrl = this.config.get<string>('app.mqtt.brokerUrl') ?? 'mqtt://127.0.0.1:1883';
    const username = this.config.get<string>('app.mqtt.username');
    const enabled = this.config.get<boolean>('app.mqtt.enabled') ?? false;
    const secure = this.config.get<boolean>('app.mqtt.secure') ?? brokerUrl.startsWith('mqtts://');
    const rejectUnauthorized = this.config.get<boolean>('app.mqtt.rejectUnauthorized') ?? true;

    return {
      enabled,
      brokerUrl,
      secure,
      rejectUnauthorized,
      username: username ?? null,
      topicPrefix: 'solartech',
      qos: 1,
      note: enabled
        ? 'Use your organization MQTT username from deployment secrets. Password is not exposed via API.'
        : 'MQTT is disabled on the API. Set MQTT_ENABLED=true and run Mosquitto to accept device traffic.',
    };
  }
}
