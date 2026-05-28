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

Preferred setup:
- **Frontend (`apps/web`)**: Vercel
- **Backend API (`apps/api`)**: Render (Web Service)

### Option A (Recommended): Vercel + Render

#### 1) Deploy the backend API to Render

1. Create a **Web Service** from this repo.
2. Configure:
   - **Root Directory**: repo root (`.`)
   - **Build Command**: `npm install && npm run build -w @solartech/api`
   - **Start Command**: `npm run start:prod -w @solartech/api`
3. Set required environment variables (from [`.env.example`](.env.example)), especially:
   - `NODE_ENV=production`
   - `PORT` (Render injects this automatically; app must listen on it)
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - database/redis/mqtt credentials used by your production services
   - any external keys (e.g., Stripe, OpenAI) used by enabled modules
4. Deploy and verify health:
   - `https://<your-render-service>/health`
5. If you expose Swagger in production, verify:
   - `https://<your-render-service>/api/docs`

#### 2) Deploy the frontend to Vercel

1. Import this repo in Vercel.
2. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
3. Set frontend environment variables:
   - `NEXT_PUBLIC_API_URL=https://<your-render-service>`
   - any public keys required by the web app
4. Deploy and open the Vercel domain.

#### 3) Configure CORS and trusted origins

Ensure the API allows requests from your Vercel production domain(s), for example:
- `https://<your-app>.vercel.app`
- your custom frontend domain (if configured)

Also ensure callback/redirect URLs (OAuth, payment flows, etc.) match production domains.

#### 4) Post-deploy checks

- Frontend loads successfully from Vercel.
- Login/register works end-to-end against Render API.
- API `/health` returns `{"status":"ok",...}`.
- Any webhooks (Stripe, etc.) point to your Render API URL.

### Option B: Docker Compose (Alternative)

```bash
cp .env.example .env        # set production secrets
docker compose up -d --build
# All services start behind NGINX on ports 80/443
```

### Environment Variables

See [`.env.example`](.env.example) for all required variables.
**Critical:** Set strong random values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

### OAuth Setup Guide (Google + GitHub)

Use these `.env` keys:

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:4000/api/v1/auth/oauth/google/callback

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:4000/api/v1/auth/oauth/github/callback
```

1. Create OAuth apps in provider consoles:
   - Google Cloud Console -> APIs & Services -> Credentials -> OAuth 2.0 Client ID
   - GitHub -> Developer settings -> OAuth Apps -> New OAuth App
2. Configure callback URLs exactly (scheme/domain/path must match):
   - Local Google callback: `http://localhost:4000/api/v1/auth/oauth/google/callback`
   - Local GitHub **Authorization callback URL**: `http://localhost:4000/api/v1/auth/oauth/github/callback`
   - Google **Authorized JavaScript origins**: `http://localhost:3000` (and your Vercel domain in prod)
   - GitHub **Homepage URL**: `http://localhost:3000` (frontend; not the API callback path)
3. Login flow endpoints (API):
   - Start Google: `GET /api/v1/auth/oauth/google`
   - Start GitHub: `GET /api/v1/auth/oauth/github`
   - After provider login, API redirects to frontend `/oauth/callback` with session payload
4. Copy client ID/secret into your local `.env`.
5. Restart the API after env changes (`npm run dev` from repo root).

For production (Render API), set provider callbacks to your real API domain:

- `https://<your-render-service>/api/v1/auth/oauth/google/callback`
- `https://<your-render-service>/api/v1/auth/oauth/github/callback`

Then set matching production values in Render environment variables:

- `GOOGLE_CALLBACK_URL=https://<your-render-service>/api/v1/auth/oauth/google/callback`
- `GITHUB_CALLBACK_URL=https://<your-render-service>/api/v1/auth/oauth/github/callback`

Common issues:
- `redirect_uri_mismatch`: callback URL in provider does not exactly match `.env` value.
- OAuth works locally but fails in prod: provider app still points to localhost callback.
- 401/invalid_client: wrong client secret or copied with extra spaces.

---

## Modules

Status legend: ✅ implemented and active, 🟡 available with ongoing enhancements

| Module | Description | Status |
|--------|-------------|--------|
| Auth | Register/login, JWT refresh, MFA setup/verify, Google OAuth entrypoint, profile retrieval | ✅ |
| Users & Organizations | User and organization management APIs with RBAC-protected access | ✅ |
| Solar Quotation | Quotation CRUD, solar sizing calculator, ROI/proposal-ready output | ✅ |
| Solar Systems | Installed system records, lifecycle status, system-level operations | ✅ |
| Devices & Telemetry | Device registry, live telemetry ingestion/query, realtime dashboard data | ✅ |
| IoT Platform | MQTT broker integration and IoT messaging endpoints | ✅ |
| Installer Marketplace | Installer profiles, marketplace leads, bids, booking flow, reviews | ✅ |
| Maintenance CRM | Ticket/work-order lifecycle, assignment, parts/work logs | ✅ |
| Billing & Financing | Invoices, subscriptions, installments, financing, Stripe checkout/webhooks | ✅ |
| Analytics Dashboard | Fleet KPIs, production/revenue analytics, reporting endpoints | ✅ |
| Smart City Analytics | City/LGU-focused energy and deployment analytics endpoints | ✅ |
| Notifications | In-app notifications, event feeds, alert surfaces | ✅ |
| AI Energy Monitoring | Device anomalies, forecasting, efficiency insights | ✅ |
| AI Assistant | AI chat/report endpoints for energy advisory workflows | 🟡 |
| Security & Audit | Security controls plus request audit logging across modules | ✅ |
| Client Portal & Admin UI | Web dashboards for clients, operators, and admins | ✅ |

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
