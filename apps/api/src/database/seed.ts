/**
 * SolarTech demo database seed
 *
 * Usage (from repo root):
 *   npm run db:seed
 *   npm run db:seed -- --keep   # skip dropping collections
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import mongoose, { Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import {
  DEMO_PASSWORD,
  ORGANIZATIONS,
  SAMPLE_QUOTATION_OUTPUT,
  SOLAR_SITES,
  USERS,
} from './seed-data';
import { UserSchema } from './schemas/user.schema';
import { OrganizationSchema } from './schemas/organization.schema';
import { QuotationSchema } from './schemas/quotation.schema';
import { SolarSystemSchema } from './schemas/solar-system.schema';
import { DeviceSchema } from './schemas/device.schema';
import { TelemetrySchema } from './schemas/telemetry.schema';
import { MaintenanceTicketSchema } from './schemas/maintenance.schema';
import { InvoiceSchema } from './schemas/invoice.schema';
import { InstallerSchema } from './schemas/installer.schema';
import { ReviewSchema } from './schemas/review.schema';
import { NotificationSchema } from './schemas/notification.schema';
import { MarketplaceLeadSchema } from './schemas/marketplace-lead.schema';
import { MarketplaceBidSchema } from './schemas/marketplace-bid.schema';
import { MarketplaceBookingSchema } from './schemas/marketplace-booking.schema';
import { MarketplaceMessageSchema } from './schemas/marketplace-message.schema';

function loadEnv() {
  const candidates = [
    resolve(__dirname, '../../../../.env'),
    resolve(__dirname, '../../../.env'),
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '../../.env'),
  ];
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
    break;
  }
}

const COLLECTIONS = [
  'users',
  'organizations',
  'quotations',
  'solar_systems',
  'devices',
  'telemetry',
  'maintenance_tickets',
  'invoices',
  'installers',
  'reviews',
  'notifications',
  'marketplace_leads',
  'marketplace_bids',
  'marketplace_bookings',
  'marketplace_messages',
];

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function hoursAgo(n: number) {
  return new Date(Date.now() - n * 3600_000);
}

function nextCalendarSlots(days = 21) {
  const slots: Array<{ date: string; status: 'available' | 'busy' | 'booked' }> = [];
  for (let i = 1; i <= days; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const date = d.toISOString().slice(0, 10);
    const dow = d.getDay();
    const status = dow === 0 ? 'busy' : i % 9 === 0 ? 'booked' : 'available';
    slots.push({ date, status });
  }
  return slots;
}

function generateTelemetry(deviceId: Types.ObjectId, systemKw: number, days = 14) {
  const points: Array<{ deviceId: Types.ObjectId; timestamp: Date; metrics: Record<string, number> }> = [];
  const now = new Date();
  let energyToday = 0;

  for (let d = days; d >= 0; d--) {
    energyToday = 0;
    for (let h = 6; h <= 18; h++) {
      const ts = new Date(now);
      ts.setDate(ts.getDate() - d);
      ts.setHours(h, Math.floor(Math.random() * 60), 0, 0);
      const hourFactor = Math.sin(((h - 6) / 12) * Math.PI);
      const cloud = 0.75 + Math.random() * 0.2;
      const powerOutputW = Math.round(systemKw * 1000 * hourFactor * cloud);
      const irradianceWm2 = Math.round(200 + hourFactor * 750 * cloud);
      const loadPowerW = Math.round(powerOutputW * (0.85 + Math.random() * 0.35) + (h >= 18 || h <= 7 ? 400 : 0));
      const gridPowerW = Math.max(0, loadPowerW - powerOutputW);
      const batterySoc = Math.min(100, Math.round(40 + hourFactor * 50 + Math.random() * 10));
      energyToday += powerOutputW / 1000;
      points.push({
        deviceId,
        timestamp: ts,
        metrics: {
          powerOutputW,
          loadPowerW,
          gridPowerW,
          irradianceWm2,
          batteryStateOfCharge: batterySoc,
          voltageV: Math.round(228 + Math.random() * 10),
          currentA: Math.round((powerOutputW / 230) * 10) / 10,
          frequencyHz: 59.9 + Math.random() * 0.2,
          energyTodayKwh: Math.round(energyToday * 10) / 10,
          temperatureCelsius: Math.round(38 + hourFactor * 22 + Math.random() * 6),
        },
      });
    }
  }
  return points;
}

async function main() {
  loadEnv();
  const keep = process.argv.includes('--keep');
  const uri = process.env.MONGODB_URI ?? 'mongodb://solartech:solartech_dev@localhost:27017/solartech?authSource=admin';

  console.log('Connecting to MongoDB…');
  await mongoose.connect(uri, { dbName: 'solartech' });

  const User = mongoose.model('User', UserSchema);
  const Organization = mongoose.model('Organization', OrganizationSchema);
  const Quotation = mongoose.model('Quotation', QuotationSchema);
  const SolarSystem = mongoose.model('SolarSystem', SolarSystemSchema);
  const Device = mongoose.model('Device', DeviceSchema);
  const Telemetry = mongoose.model('Telemetry', TelemetrySchema);
  const MaintenanceTicket = mongoose.model('MaintenanceTicket', MaintenanceTicketSchema);
  const Invoice = mongoose.model('Invoice', InvoiceSchema);
  const Installer = mongoose.model('Installer', InstallerSchema);
  const Review = mongoose.model('Review', ReviewSchema);
  const Notification = mongoose.model('Notification', NotificationSchema);
  const MarketplaceLead = mongoose.model('MarketplaceLead', MarketplaceLeadSchema);
  const MarketplaceBid = mongoose.model('MarketplaceBid', MarketplaceBidSchema);
  const MarketplaceBooking = mongoose.model('MarketplaceBooking', MarketplaceBookingSchema);
  const MarketplaceMessage = mongoose.model('MarketplaceMessage', MarketplaceMessageSchema);

  if (!keep) {
    console.log('Clearing existing demo collections…');
    const db = mongoose.connection.db!;
    for (const name of COLLECTIONS) {
      try {
        await db.collection(name).drop();
      } catch {
        /* collection may not exist */
      }
    }
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  console.log('Creating organizations…');
  const orgIds: Record<string, Types.ObjectId> = {};
  for (const o of ORGANIZATIONS) {
    const doc = await Organization.create({
      name: o.name,
      slug: o.slug,
      plan: o.plan,
      city: o.city,
      province: o.province,
      website: o.website,
      phone: o.phone,
      address: `${o.city}, ${o.province}, Philippines`,
      country: 'PH',
      isActive: true,
    });
    orgIds[o.key] = doc._id as Types.ObjectId;
  }

  console.log('Creating users…');
  const userIds: Record<string, Types.ObjectId> = {};
  for (const u of USERS) {
    const doc = await User.create({
      email: u.email.toLowerCase(),
      password: passwordHash,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      organizationId: u.org ? orgIds[u.org] : undefined,
      isActive: true,
      isEmailVerified: true,
      phone: '+63 917 000 0000',
      lastLoginAt: daysAgo(1),
    });
    userIds[u.key] = doc._id as Types.ObjectId;
  }

  const ecosolarId = orgIds.ecosolar;
  const mariaId = userIds.maria;
  const carloId = userIds.carlo;
  const techId = userIds.tech;
  const clientId = userIds.client;

  console.log('Creating quotations…');
  const quotationStatuses = ['draft', 'pending', 'approved', 'approved', 'rejected', 'pending', 'approved', 'draft'] as const;
  const quotationIds: Types.ObjectId[] = [];
  for (let i = 0; i < quotationStatuses.length; i++) {
    const site = SOLAR_SITES[i % SOLAR_SITES.length];
    const output = {
      ...SAMPLE_QUOTATION_OUTPUT,
      recommendedSystemSizeKw: site.kw,
      numberOfPanels: Math.ceil((site.kw * 1000) / 550),
      totalCost: Math.round(site.kw * 35000),
      estimatedAnnualSavings: Math.round(site.kw * 1460 * 10.5),
    };
    const q = await Quotation.create({
      clientId,
      organizationId: ecosolarId,
      createdBy: mariaId,
      status: quotationStatuses[i],
      input: {
        monthlyBill: 4500 + i * 800,
        monthlyKwh: 320 + i * 40,
        roofArea: 40 + i * 5,
        roofType: 'pitched',
        latitude: site.lat,
        longitude: site.lng,
        gridType: i % 3 === 0 ? 'hybrid' : 'on_grid',
        includesBattery: i % 3 === 0,
        currency: 'PHP',
        utilityRate: 10.5,
        address: `${site.city} solar site`,
        city: site.city,
        province: site.province,
      },
      output,
      notes: i % 2 === 0 ? 'Net metering application in progress with DU.' : undefined,
      validUntil: new Date(Date.now() + 30 * 86400_000),
      createdAt: daysAgo(20 - i),
    });
    quotationIds.push(q._id as Types.ObjectId);
  }

  console.log('Creating solar systems & devices…');
  const systemIds: Types.ObjectId[] = [];
  let deviceSeq = 0;

  for (let i = 0; i < SOLAR_SITES.length; i++) {
    const site = SOLAR_SITES[i];
    const orgId = orgIds[site.org];
    const installedAt = i < 3 ? daysAgo(5 + i) : daysAgo(40 + i);
    const sys = await SolarSystem.create({
      name: site.name,
      organizationId: orgId,
      clientId: site.client ? clientId : mariaId,
      quotationId: i < quotationIds.length ? quotationIds[i] : undefined,
      status: 'active',
      systemSizeKw: site.kw,
      installedAt,
      location: {
        address: `${site.name}, ${site.city}`,
        city: site.city,
        province: site.province,
        country: 'PH',
        latitude: site.lat,
        longitude: site.lng,
      },
      devices: [],
    });
    const systemId = sys._id as Types.ObjectId;
    systemIds.push(systemId);

    const deviceTypes: Array<{ type: string; name: string; status: string }> = [
      { type: 'inverter', name: `${site.name} Inverter`, status: i === 4 ? 'warning' : 'online' },
      { type: 'smart_meter', name: `${site.name} Meter`, status: 'online' },
    ];
    if (i % 3 === 0) {
      deviceTypes.push({ type: 'battery', name: `${site.name} Battery`, status: 'online' });
    }

    const linkedDevices: Types.ObjectId[] = [];
    for (const dt of deviceTypes) {
      deviceSeq += 1;
      const slug = site.name.toLowerCase().replace(/\s+/g, '-').slice(0, 20);
      const dev = await Device.create({
        solarSystemId: systemId,
        organizationId: orgId,
        name: dt.name,
        type: dt.type,
        status: dt.status,
        serialNumber: `SN-DEMO-${String(deviceSeq).padStart(4, '0')}`,
        mqttClientId: `${orgId.toString().slice(-6)}-${slug}-${dt.type}`,
        firmware: '2.1.0',
        lastSeenAt: hoursAgo(dt.status === 'offline' ? 48 : 0.1),
        location: { latitude: site.lat, longitude: site.lng },
        metadata: { seeded: true },
      });
      linkedDevices.push(dev._id as Types.ObjectId);
    }

    await SolarSystem.findByIdAndUpdate(systemId, { devices: linkedDevices });
  }

  // Fix inverter device id tracking
  const inverters: Array<{ id: Types.ObjectId; kw: number }> = [];
  const allDevices = await Device.find({ type: 'inverter' }).lean();
  for (const d of allDevices) {
    const sys = await SolarSystem.findById(d.solarSystemId).lean();
    inverters.push({ id: d._id as Types.ObjectId, kw: sys?.systemSizeKw ?? 10 });
  }

  console.log('Creating telemetry (14 days per inverter)…');
  const telemetryBatch: Array<{ deviceId: Types.ObjectId; timestamp: Date; metrics: Record<string, number> }> = [];
  for (const inv of inverters) {
    telemetryBatch.push(...generateTelemetry(inv.id, inv.kw, 14));
  }
  for (let i = 0; i < telemetryBatch.length; i += 500) {
    await Telemetry.insertMany(telemetryBatch.slice(i, i + 500), { ordered: false });
  }

  console.log('Creating installer profiles & reviews…');
  const installerProfiles = [
    {
      userId: carloId,
      organizationId: ecosolarId,
      businessName: 'EcoSolar Install Team',
      description: 'Licensed solar EPC serving NCR and CALABARZON since 2018.',
      serviceAreas: ['Metro Manila', 'Laguna', 'Batangas', 'Cavite'],
      specializations: ['residential', 'commercial', 'hybrid'],
      isVerified: true,
      isFeatured: true,
      verificationStatus: 'verified',
      avgRating: 4.8,
      totalReviews: 24,
      totalProjects: 186,
      priceRangeMin: 180000,
      priceRangeMax: 2500000,
    },
    {
      userId: userIds.jenny,
      organizationId: orgIds.sunworks,
      businessName: 'SunWorks Cebu',
      description: 'Visayas-focused installer with strong net metering support.',
      serviceAreas: ['Cebu', 'Mandaue', 'Lapu-Lapu'],
      specializations: ['residential', 'off-grid'],
      isVerified: true,
      isFeatured: false,
      verificationStatus: 'verified',
      avgRating: 4.6,
      totalReviews: 12,
      totalProjects: 74,
      priceRangeMin: 150000,
      priceRangeMax: 900000,
    },
    {
      userId: userIds.maria,
      organizationId: ecosolarId,
      businessName: 'EcoSolar Metro',
      description: 'Commercial and residential installs across Metro Manila.',
      serviceAreas: ['Metro Manila', 'Makati', 'Quezon City', 'Taguig'],
      specializations: ['commercial', 'residential'],
      isVerified: true,
      isFeatured: true,
      verificationStatus: 'verified',
      avgRating: 4.9,
      totalReviews: 31,
      totalProjects: 240,
      priceRangeMin: 200000,
      priceRangeMax: 5000000,
    },
  ];

  const installerIds: Types.ObjectId[] = [];
  for (const p of installerProfiles) {
    const inst = await Installer.create({
      ...p,
      portfolio: [
        {
          title: '5 kW Residential — QC',
          systemSizeKw: 5,
          completedAt: daysAgo(120),
          images: [],
          clientTestimonial: 'Smooth install and clear monitoring handover.',
        },
      ],
      certifications: [
        { name: 'Philippine Solar PV Installer', issuedBy: 'DOE', issuedAt: daysAgo(400) },
      ],
      availability: { mon: true, tue: true, wed: true, thu: true, fri: true },
      calendarSlots: nextCalendarSlots(),
    });
    installerIds.push(inst._id as Types.ObjectId);
  }

  const reviewComments = [
    'Excellent workmanship and fast net metering paperwork.',
    'Production matches the proposal within 5%.',
    'Responsive team when we had an inverter warning.',
    'Professional from site survey to commissioning.',
    'Would recommend for commercial rooftops.',
  ];
  for (const instId of installerIds) {
    for (let r = 0; r < 4; r++) {
      await Review.create({
        installerId: instId,
        reviewerId: clientId,
        rating: 4 + (r % 2),
        comment: reviewComments[(r + installerIds.indexOf(instId)) % reviewComments.length],
        isVerified: true,
        createdAt: daysAgo(30 + r * 10),
      });
    }
  }

  console.log('Creating maintenance tickets…');
  const ticketDefs = [
    { title: 'Inverter showing ground fault', status: 'open', priority: 'high', type: 'corrective' },
    { title: 'Annual panel cleaning', status: 'assigned', priority: 'medium', type: 'preventive' },
    { title: 'Low production investigation', status: 'in_progress', priority: 'high', type: 'corrective' },
    { title: 'Replace damaged MC4 connector', status: 'pending_parts', priority: 'medium', type: 'corrective' },
    { title: 'Post-typhoon inspection', status: 'resolved', priority: 'medium', type: 'inspection' },
    { title: 'Battery BMS firmware update', status: 'closed', priority: 'low', type: 'preventive' },
  ];
  for (let i = 0; i < ticketDefs.length; i++) {
    const def = ticketDefs[i];
    await MaintenanceTicket.create({
      workOrderNo: `WO-DEMO-${String(i + 1).padStart(4, '0')}`,
      solarSystemId: systemIds[i % systemIds.length],
      organizationId: ecosolarId,
      clientId,
      assignedTechnicianId: ['assigned', 'in_progress', 'pending_parts', 'resolved', 'closed'].includes(def.status)
        ? techId
        : undefined,
      title: def.title,
      description: `Demo ticket: ${def.title}. Seeded for maintenance CRM walkthrough.`,
      status: def.status,
      priority: def.priority,
      type: def.type,
      scheduledAt: def.status !== 'open' ? daysAgo(2) : undefined,
      resolvedAt: ['resolved', 'closed'].includes(def.status) ? daysAgo(1) : undefined,
      slaDeadline: new Date(Date.now() + 3 * 86400_000),
      workLog:
        def.status !== 'open'
          ? [
              {
                technicianId: techId,
                action: 'Site visit completed',
                notes: 'Checked DC strings and AC breaker.',
                timestamp: daysAgo(1),
              },
            ]
          : [],
      parts:
        def.status === 'pending_parts'
          ? [{ name: 'MC4 connector pair', quantity: 2, unitCost: 450, status: 'ordered' }]
          : [],
    });
  }

  console.log('Creating invoices…');
  const invoiceStatuses = ['paid', 'paid', 'sent', 'sent', 'overdue', 'draft', 'paid', 'sent'] as const;
  for (let i = 0; i < invoiceStatuses.length; i++) {
    const subtotal = 85000 + i * 25000;
    const taxAmount = Math.round(subtotal * 0.12);
    const total = subtotal + taxAmount;
    const status = invoiceStatuses[i];
    await Invoice.create({
      invoiceNumber: `INV-DEMO-${String(2026)}-${String(i + 1).padStart(4, '0')}`,
      clientId,
      organizationId: ecosolarId,
      solarSystemId: systemIds[i % systemIds.length],
      status,
      lineItems: [
        { description: 'Solar installation — phase 1', quantity: 1, unitPrice: subtotal, total: subtotal },
      ],
      subtotal,
      taxRate: 0.12,
      taxAmount,
      total,
      currency: 'PHP',
      dueDate: status === 'overdue' ? daysAgo(14) : new Date(Date.now() + 14 * 86400_000),
      paidAt: status === 'paid' ? daysAgo(3 + i) : undefined,
      paymentMethod: status === 'paid' ? (i % 2 === 0 ? 'bank_transfer' : 'gcash') : undefined,
      createdAt: daysAgo(25 - i),
    });
  }

  console.log('Creating marketplace leads, bids, chat & bookings…');
  const openLead = await MarketplaceLead.create({
    clientId,
    title: '5 kW residential — Quezon City',
    description: 'Looking for net metering install on pitched roof. Bill ~₱5,500/mo.',
    city: 'Quezon City',
    province: 'Metro Manila',
    systemSizeKw: 5,
    budgetMin: 180000,
    budgetMax: 280000,
    requestType: 'installation',
    status: 'bidding',
    bidCount: 2,
    preferredStartDate: daysAgo(-30),
  });

  const directLead = await MarketplaceLead.create({
    clientId,
    installerId: installerIds[0],
    title: 'Quotation request — EcoSolar Install Team',
    description: 'Please send formal proposal for 8 kW hybrid system.',
    city: 'Makati',
    province: 'Metro Manila',
    systemSizeKw: 8,
    requestType: 'quotation',
    status: 'open',
    bidCount: 0,
  });

  await MarketplaceBid.create({
    leadId: openLead._id,
    installerId: installerIds[0],
    submittedBy: carloId,
    amount: 245000,
    proposalText: 'Full install with Growatt hybrid inverter and net metering filing.',
    estimatedDurationDays: 14,
    status: 'submitted',
  });

  await MarketplaceBid.create({
    leadId: openLead._id,
    installerId: installerIds[1],
    submittedBy: userIds.jenny,
    amount: 238000,
    proposalText: 'Visayas-certified team; includes 1-year O&M.',
    estimatedDurationDays: 18,
    status: 'submitted',
  });

  const awardedLead = await MarketplaceLead.create({
    clientId,
    installerId: installerIds[0],
    title: 'Commercial rooftop — Laguna',
    city: 'Laguna',
    systemSizeKw: 25,
    status: 'awarded',
    bidCount: 1,
  });

  await MarketplaceMessage.create([
    { leadId: openLead._id, senderId: clientId, body: 'Hi, when can you do a site survey?' },
    { leadId: openLead._id, senderId: carloId, body: 'We can visit this Saturday morning. Sending bid details now.' },
    { leadId: directLead._id, senderId: clientId, body: 'Interested in battery backup for evening loads.' },
  ]);

  const bookingDate = new Date();
  bookingDate.setDate(bookingDate.getDate() + 14);
  await MarketplaceBooking.create({
    leadId: awardedLead._id,
    installerId: installerIds[0],
    clientId,
    scheduledDate: bookingDate,
    totalAmount: 890000,
    escrowStatus: 'escrow_funded',
    escrowHeldAmount: 890000,
    escrowReleasedAmount: 0,
    notes: 'Milestone 1: deposit held in escrow (demo).',
  });

  console.log('Creating notifications…');
  const notifyUsers = [mariaId, carloId, techId, clientId, userIds.finance];
  const events = [
    { event: 'device.offline', title: 'Device offline', body: 'Makati Corporate HQ Inverter has not reported in 30 minutes.' },
    { event: 'quotation.approved', title: 'Quotation approved', body: 'QC Family Home proposal was approved by the client.' },
    { event: 'maintenance.assigned', title: 'Ticket assigned', body: 'You were assigned: Annual panel cleaning.' },
    { event: 'invoice.paid', title: 'Payment received', body: 'Invoice INV-DEMO-2026-0001 marked as paid.' },
    { event: 'system.production', title: 'Daily production summary', body: 'Fleet produced 2.4 MWh yesterday — 4% above forecast.' },
    { event: 'device.warning', title: 'Inverter warning', body: 'Batangas Resort inverter reported elevated temperature.' },
  ];
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    await Notification.create({
      userId: notifyUsers[i % notifyUsers.length],
      organizationId: ecosolarId,
      event: e.event,
      channel: 'in_app',
      title: e.title,
      body: e.body,
      isRead: i > 3,
      readAt: i > 3 ? daysAgo(1) : undefined,
      sentAt: daysAgo(i),
      data: { seeded: 'true' },
    });
  }

  await mongoose.disconnect();

  console.log('\n✅ Demo seed complete\n');
  console.log('── Login credentials (password for all):', DEMO_PASSWORD, '──\n');
  for (const u of USERS) {
    console.log(`  ${u.role.padEnd(16)} ${u.email}`);
  }
  console.log('\nCounts:');
  console.log(`  Organizations: ${ORGANIZATIONS.length}`);
  console.log(`  Users:         ${USERS.length}`);
  console.log(`  Systems:       ${SOLAR_SITES.length} (active, geolocated)`);
  console.log(`  Devices:       ~${SOLAR_SITES.length * 2}+ with telemetry`);
  console.log(`  Quotations:    ${quotationStatuses.length}`);
  console.log(`  Installers:    ${installerProfiles.length}`);
  console.log(`  Mkt leads:     3 (bidding, open, awarded)`);
  console.log(`  Tickets:       ${ticketDefs.length}`);
  console.log(`  Invoices:      ${invoiceStatuses.length}`);
  console.log('\nTip: log in as maria@ecosolar.ph for the main installer demo, or lgu@manila.gov.ph for Smart City.\n');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
