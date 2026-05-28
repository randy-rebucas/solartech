import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/telemetry',
})
export class TelemetryGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TelemetryGateway.name);

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token ?? client.handshake.headers?.authorization?.replace('Bearer ', '');
    try {
      const payload = this.jwtService.verify(token, { secret: this.config.get('app.jwt.accessSecret') });
      client.data.user = payload;
      client.join(`org:${payload.organizationId ?? payload.sub}`);
      this.logger.log(`Client connected: ${client.id}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:system')
  handleSubscribeSystem(@ConnectedSocket() client: Socket, @MessageBody() data: { systemId: string }) {
    client.join(`system:${data.systemId}`);
    return { subscribed: data.systemId };
  }

  @SubscribeMessage('subscribe:device')
  handleSubscribeDevice(@ConnectedSocket() client: Socket, @MessageBody() data: { deviceId: string }) {
    client.join(`device:${data.deviceId}`);
    return { subscribed: data.deviceId };
  }

  broadcastTelemetry(orgId: string, systemId: string, deviceId: string, metrics: Record<string, number>) {
    const payload = { deviceId, systemId, metrics, timestamp: new Date().toISOString() };
    this.server.to(`org:${orgId}`).emit('telemetry', payload);
    this.server.to(`system:${systemId}`).emit('telemetry', payload);
    this.server.to(`device:${deviceId}`).emit('telemetry', payload);
  }

  broadcastAlert(orgId: string, alert: object) {
    this.server.to(`org:${orgId}`).emit('alert', alert);
  }
}
