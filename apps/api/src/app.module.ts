import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule }         from './modules/auth/auth.module';
import { UsersModule }        from './modules/users/users.module';
import { OrganizationsModule }from './modules/organizations/organizations.module';
import { QuotationsModule }   from './modules/quotations/quotations.module';
import { SolarSystemsModule } from './modules/solar-systems/solar-systems.module';
import { DevicesModule }      from './modules/devices/devices.module';
import { TelemetryModule }    from './modules/telemetry/telemetry.module';
import { InstallersModule }   from './modules/installers/installers.module';
import { MarketplaceModule }  from './modules/marketplace/marketplace.module';
import { MaintenanceModule }  from './modules/maintenance/maintenance.module';
import { BillingModule }      from './modules/billing/billing.module';
import { AnalyticsModule }    from './modules/analytics/analytics.module';
import { SmartCityModule }    from './modules/smart-city/smart-city.module';
import { NotificationsModule }from './modules/notifications/notifications.module';
import { AiModule }           from './modules/ai/ai.module';
import { IotModule }          from './modules/iot/iot.module';
import { ClientsModule }      from './modules/clients/clients.module';
import { SecurityModule }     from './modules/security/security.module';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Monorepo root .env (nest runs from apps/api; cwd-based paths are unreliable)
      envFilePath: [
        join(__dirname, '../../../.env'),
        join(__dirname, '../../../.env.local'),
      ],
      load: [appConfig],
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('app.mongoUri'),
        dbName: 'solartech',
      }),
    }),

    ThrottlerModule.forRoot([
      { name: 'short',  ttl: 1000,  limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long',   ttl: 60000, limit: 200 },
    ]),

    ScheduleModule.forRoot(),

    AuthModule,
    UsersModule,
    OrganizationsModule,
    QuotationsModule,
    SolarSystemsModule,
    DevicesModule,
    TelemetryModule,
    InstallersModule,
    MarketplaceModule,
    MaintenanceModule,
    BillingModule,
    AnalyticsModule,
    SmartCityModule,
    NotificationsModule,
    AiModule,
    IotModule,
    ClientsModule,
    SecurityModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
})
export class AppModule {}
