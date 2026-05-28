Login (password for all: `Demo1234!`)



| Use case | Email |

|----------|--------|

| **Client portal** | `client@demo.ph` |

| Main dashboard demo | `maria@ecosolar.ph` |

| Smart City / LGU | `lgu@manila.gov.ph` |

| Platform admin | `admin@solartech.ph` |

| Investor portfolio | `investor@ecosolar.ph` |

| Billing | `finance@ecosolar.ph` |

| Maintenance / tech | `tech@ecosolar.ph` |

| Installer marketplace | `carlo@ecosolar.ph` |



**Client portal** (`/dashboard` as `client@demo.ph`): live solar production, battery monitoring, billing overview, savings tracker, carbon reduction metrics & charts, maintenance requests (create ticket), notifications, floating chat support (SolarBot). Mobile-first layout with bottom quick-nav. API: `GET /api/v1/clients/me/dashboard`.



**Solar quotations** (`/quotations`): consumption calculator, province PSH, roof sizing, PDF export.



**Installer marketplace** (`/marketplace`): profiles, leads, bidding, chat, bookings.



**Maintenance CRM** (`/maintenance`): tickets, dispatch, SLA, AI fault predictions.



**AI energy monitoring** (`/analytics`): org-level analytics for `maria@ecosolar.ph`.

**IoT monitoring app** (`/devices`): device registration, MQTT telemetry ingest, inverter/battery/grid/weather metrics, GPS tracking, real-time alerts, device health dashboard, firmware rollout actions, and remote diagnostics. API endpoints: `GET /api/v1/devices/iot/overview`, `POST /api/v1/devices/:id/firmware`, `POST /api/v1/devices/:id/diagnostics`.

**Billing & financing system** (`/billing`): invoice generation, subscription billing, installment plans, financing applications + approvals, commission tracking, due-date tracking, auto reminders, and financial reporting. Gateway-ready checkout supports Stripe, PayPal, local PH rails (PayMongo/Xendit/Maya/GCash), and bank financing API stubs. APIs: `GET /api/v1/billing/financial-report`, `POST /api/v1/billing/reminders/run`, `POST /api/v1/billing/subscriptions`, `POST /api/v1/billing/installments`, `POST /api/v1/billing/financing`.

**Smart city energy analytics** (`/smart-city` as `lgu@manila.gov.ph`): city-wide monitoring, barangay analytics, public facility monitoring, renewable + carbon statistics, grid utilization, smart infra KPIs, GIS map with heatmaps, solar adoption metrics, outage tracking, and EV charging analytics. API: `GET /api/v1/smart-city/advanced-analytics`.

**AI assistant** (`/ai-assistant`): built-in conversational SolarBot for proposal explanations, energy usage analysis, upgrade recommendations, issue detection, report generation, customer Q&A, and technician assistance. Includes language selector (English/Filipino/Cebuano), audience/capability modes, and voice-ready browser speech input architecture. APIs: `POST /api/v1/ai/chat`, `POST /api/v1/ai/report`.

**Admin dashboard** (`/admin` as `admin@solartech.ph`): platform KPIs, advanced charts, real-time metrics (telemetry/org activity), marketplace management funnel, user management, device monitoring status charts, AI insights signal tracking, audit logs, and platform settings overview (gateways/locale/MQTT/maintenance mode).

**Notifications system** (`/notifications`): multi-channel notifications (email, SMS mock, push mock, in-app), user channel/event preferences, read/unread management, and event templates for fault alerts, maintenance reminders, billing notifications, proposal approvals, and energy anomalies. APIs: `GET/PATCH /api/v1/notifications/preferences/me`, `POST /api/v1/notifications/events/:eventKey`.

**Reports & analytics** (`/reports`): generate energy, financial, maintenance, carbon reduction, and installer performance reports with one-click exports to PDF, Excel, and CSV.



Re-seed: `npm run db:seed` · API: `npm run dev -w @solartech/api` · Infra: `docker compose -f docker-compose.dev.yml up -d mongodb`


