import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env:          process.env.NODE_ENV ?? 'development',
  port:         parseInt(process.env.PORT ?? '4000', 10),
  mongoUri:     process.env.MONGODB_URI ?? 'mongodb://localhost:27017/solartech',
  redisUrl:     process.env.REDIS_URL ?? 'redis://localhost:6379',
  frontendUrl:  process.env.FRONTEND_URL ?? 'http://localhost:3000',

  jwt: {
    accessSecret:  process.env.JWT_ACCESS_SECRET  ?? 'change-me-access',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh',
    accessExpiry:  process.env.JWT_ACCESS_EXPIRY  ?? '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? '7d',
  },

  oauth: {
    googleClientId:     process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleCallbackUrl:  process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:4000/api/v1/auth/oauth/google/callback',
    githubClientId:     process.env.GITHUB_CLIENT_ID,
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
    githubCallbackUrl:  process.env.GITHUB_CALLBACK_URL ?? 'http://localhost:4000/api/v1/auth/oauth/github/callback',
  },

  mail: {
    host:     process.env.MAIL_HOST ?? 'smtp.gmail.com',
    port:     parseInt(process.env.MAIL_PORT ?? '587', 10),
    user:     process.env.MAIL_USER,
    password: process.env.MAIL_PASSWORD,
    from:     process.env.MAIL_FROM ?? 'noreply@solartech.ph',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },

  stripe: {
    secretKey:     process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  mqtt: {
    enabled:   process.env.MQTT_ENABLED !== 'false',
    brokerUrl: process.env.MQTT_BROKER_URL ?? 'mqtt://127.0.0.1:1883',
    username:  process.env.MQTT_USERNAME,
    password:  process.env.MQTT_PASSWORD,
    secure: process.env.MQTT_SECURE === 'true' || (process.env.MQTT_BROKER_URL ?? '').startsWith('mqtts://'),
    rejectUnauthorized: process.env.MQTT_REJECT_UNAUTHORIZED !== 'false',
  },

  security: {
    encryptionKey: process.env.SECURITY_ENCRYPTION_KEY ?? 'dev-only-key-change-me',
    backupDir: process.env.BACKUP_DIR ?? 'backups',
  },
}));
