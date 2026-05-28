# SolarTech — Smart Energy Ecosystem Platform

> AI-powered solar management, IoT monitoring, installer marketplace, and smart city analytics.

---

## Architecture

```
solartech/
├── apps/
│   ├── web/          # Next.js 15 — client portal, dashboards, marketing
│   └── api/          # NestJS — REST + WebSocket + MQTT backend
├── packages/
│   ├── shared/       # Shared TypeScript types, constants, utilities
│   └── ui/           # Shared UI components (shadcn-based)
├── infra/
│   ├── docker/       # Dockerfiles
│   ├── nginx/        # Reverse proxy config
│   ├── mqtt/         # Mosquitto broker config
│   └── k8s/          # Kubernetes manifests (WIP)
├── docker-compose.yml        # Full production stack
└── docker-compose.dev.yml    # Dev infrastructure only
```

---

## Quick Start (Development)

### Prerequisites
- Node.js ≥ 20
- npm ≥ 10
- Docker Desktop

### 1. Clone & install

```bash
git clone https://github.com/your-org/solartech.git
cd solartech
cp .env.example .env       # fill in your secrets
npm install
```

### 2. Start infrastructure

```bash
docker compose -f docker-compose.dev.yml up -d
# Starts: MongoDB (27017), Redis (6379), MQTT broker (1883)
# Dev credentials match docker-compose.dev.yml (user: solartech, password: solartech_dev)
```

### 3. Start apps

```bash
npm run dev
# api  → http://127.0.0.1:4000  (health: /health)
# web  → http://localhost:3000
# docs → http://127.0.0.1:4000/api/docs
```

Run **both** API and web from the repo root. Starting only the web app (`npm run dev -w @solartech/web`) leaves `/health` down and auth/register will fail.

Quick check: `curl http://127.0.0.1:4000/health` should return `{"status":"ok",...}`.

### 4. Load demo data (optional)

```bash
npm run db:seed
# Resets demo collections and seeds organizations, users, systems, devices,
# telemetry, quotations, marketplace, maintenance, billing, and notifications.
```

| Role | Email | Password |
|------|-------|----------|
| Solar company (main demo) | `maria@ecosolar.ph` | `Demo1234!` |
| Super admin | `admin@solartech.ph` | `Demo1234!` |
| LGU / Smart City | `lgu@manila.gov.ph` | `Demo1234!` |
| Client portal | `client@demo.ph` | `Demo1234!` |
| Technician | `tech@ecosolar.ph` | `Demo1234!` |
| Finance / billing | `finance@ecosolar.ph` | `Demo1234!` |
| Installer | `carlo@ecosolar.ph` | `Demo1234!` |

Use `npm run db:seed:keep -w @solartech/api` to seed without dropping existing collections first.

---

## Production Deployment

### Docker Compose

```bash
cp .env.example .env        # set production secrets
docker compose up -d --build
# All services start behind NGINX on ports 80/443
```

### Environment Variables

See [`.env.example`](.env.example) for all required variables.
**Critical:** Set strong random values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

---

## Modules

| Module | Description | Status |
|--------|-------------|--------|
| Auth | JWT, OAuth, MFA, RBAC | ✅ |
| Solar Quotation | AI sizing, ROI calculator, proposals | 🚧 |
| Installer Marketplace | Profiles, bidding, reviews | 🚧 |
| Maintenance CRM | Tickets, dispatch, work orders | 🚧 |
| AI Energy Monitoring | Anomaly detection, forecasting | 🚧 |
| Client Dashboard | Live production, billing, alerts | 🚧 |
| IoT Platform | MQTT, device registry, telemetry | 🚧 |
| Billing & Financing | Invoices, installments, Stripe | 🚧 |
| Smart City Analytics | GIS dashboards, city-wide data | 🚧 |
| AI Assistant | Conversational energy advisor | 🚧 |
| Admin Dashboard | Platform KPIs, user management | 🚧 |
| Notifications | Email, SMS, push, in-app | 🚧 |

---

## API Documentation

Swagger UI available at `http://localhost:4000/api/docs` in development.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | NestJS, MongoDB, Redis, Socket.io, MQTT |
| AI | OpenAI API, TensorFlow.js |
| IoT | MQTT (Mosquitto), WebSockets, ESP32/Raspberry Pi |
| Auth | JWT, Passport.js, OAuth2, TOTP MFA |
| Infra | Docker, NGINX, Turborepo, CI/CD |

---

## License

Proprietary — All rights reserved.
