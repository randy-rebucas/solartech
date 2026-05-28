export interface DiyStep {
  title: string;
  detail: string;
}

export interface DiyPhase {
  id: string;
  title: string;
  summary: string;
  duration: string;
  steps: DiyStep[];
  tips?: string[];
  warnings?: string[];
}

export const DIY_PHASES: DiyPhase[] = [
  {
    id: 'assess',
    title: '1. Assess your site & consumption',
    summary: 'Measure how much energy you use and whether your roof can support solar.',
    duration: '1–2 days',
    steps: [
      {
        title: 'Collect 12 months of utility bills',
        detail: 'Note monthly kWh and total amount. Identify peak months (summer AC load). Use our bill converter on the Calculators page if you only have peso amounts.',
      },
      {
        title: 'Survey roof area and shading',
        detail: 'Measure usable roof space in m². Mark chimneys, trees, and neighboring buildings that cast shade between 9 AM and 3 PM.',
      },
      {
        title: 'Check roof structure',
        detail: 'Concrete or metal roofs are common in the PH. Confirm trusses can support ~12–15 kg/m² added load. Consult a structural engineer for old or lightweight roofs.',
      },
    ],
    tips: [
      'A typical Philippine home uses 200–400 kWh/month.',
      'Each 550 W panel needs about 2.1 m² of clear roof.',
    ],
  },
  {
    id: 'design',
    title: '2. Design your system',
    summary: 'Size panels, inverter, and optional battery using your usage and location.',
    duration: '2–3 days',
    steps: [
      {
        title: 'Run the System Sizing calculator',
        detail: 'Enter monthly kWh, utility rate (₱/kWh), roof area, and province. Choose on-grid, hybrid, or off-grid.',
      },
      {
        title: 'Pick grid connection type',
        detail: 'On-grid: lowest cost, export surplus via net metering. Hybrid: battery backup for brownouts. Off-grid: full independence, highest battery cost.',
      },
      {
        title: 'Select equipment tier',
        detail: 'Tier-1 panels (JA, Longi, Canadian) and certified inverters (Growatt, Fronius, SolarEdge) simplify warranty claims. Match inverter AC rating to ~110% of DC array size.',
      },
    ],
    tips: ['Oversizing DC by ~10% vs inverter is normal.', 'Use the Production calculator to verify expected kWh before buying.'],
  },
  {
    id: 'permits',
    title: '3. Permits & net metering',
    summary: 'Comply with Philippine regulations before energizing.',
    duration: '2–8 weeks',
    steps: [
      {
        title: 'Coordinate with your Distribution Utility (DU)',
        detail: 'Meralco, Visayan Electric, Davao Light, etc. each have net-metering or interconnection forms. Submit single-line diagram, equipment specs, and site plan.',
      },
      {
        title: 'Electrical permit & inspection',
        detail: 'Licensed electrical contractor files permit with LGU / OBO. Schedule inspection before closing the main service panel work.',
      },
      {
        title: 'Register bi-directional meter',
        detail: 'DU installs or reprograms a meter that credits exported kWh. Keep copies of approved documents for warranty and insurance.',
      },
    ],
    warnings: [
      'Energizing without DU approval can void insurance and violate ERC interconnection rules.',
      'DIY owners should still use a licensed electrician for final AC connection and sign-off.',
    ],
  },
  {
    id: 'procure',
    title: '4. Procurement & safety gear',
    summary: 'Order materials and prepare tools for roof work.',
    duration: '1–2 weeks',
    steps: [
      {
        title: 'Bill of materials from your design',
        detail: 'Panels, inverter, mounting rails, DC combiner, breakers, MC4 connectors, grounding, conduit, and labeling. Add 5–10% spare connectors.',
      },
      {
        title: 'Safety equipment',
        detail: 'Harness, roof anchors, insulated gloves, safety glasses, and lockout/tagout for the main breaker. Never work on live DC strings.',
      },
      {
        title: 'Delivery & storage',
        detail: 'Store panels flat, shaded, and dry. Do not stack heavy boxes on glass. Check serial numbers for warranty registration.',
      },
    ],
    warnings: ['Working at height without fall protection is the leading cause of installer injuries.'],
  },
  {
    id: 'install',
    title: '5. Installation',
    summary: 'Mount hardware, wire DC and AC, and commission.',
    duration: '2–5 days',
    steps: [
      {
        title: 'Install mounting rails',
        detail: 'Flash every roof penetration. Maintain tilt (~10–15° for PH latitudes) and spacing per manufacturer wind-load tables.',
      },
      {
        title: 'Mount panels & home-run DC',
        detail: 'Torque clamps to spec. String panels to match inverter MPPT voltage window. Label each string at combiner box.',
      },
      {
        title: 'AC wiring & inverter',
        detail: 'Dedicated breaker sized per inverter manual. Bond ground per PEC. Keep AC and DC runs separated in conduit.',
      },
      {
        title: 'Battery (if hybrid/off-grid)',
        detail: 'Install in ventilated, dry area. Follow manufacturer parallel limits. Use Battery Sizing calculator for autonomy targets.',
      },
    ],
    warnings: [
      'DC voltage from strings can be lethal — cover panels with opaque sheets until commissioning.',
      'Only qualified personnel should tie into the service entrance.',
    ],
  },
  {
    id: 'commission',
    title: '6. Commissioning & monitoring',
    summary: 'Test, inspect, and connect monitoring.',
    duration: '1 day',
    steps: [
      {
        title: 'Insulation & polarity tests',
        detail: 'Verify Voc, Isc, and insulation resistance before connecting to inverter. Confirm no ground faults.',
      },
      {
        title: 'DU inspection & energize',
        detail: 'After utility approval, close breakers in order: DC isolator → inverter → AC breaker. Record startup readings.',
      },
      {
        title: 'Enable monitoring',
        detail: 'Register devices in SolarTech or your inverter app. Publish MQTT telemetry if using a gateway (see Knowledge Base → Connect IoT devices).',
      },
    ],
  },
  {
    id: 'maintain',
    title: '7. Ongoing maintenance',
    summary: 'Keep production high for 25+ years.',
    duration: 'Ongoing',
    steps: [
      {
        title: 'Clean panels quarterly',
        detail: 'Rinse dust and pollen; avoid abrasive tools. Inspect for bird nests or cracked glass after typhoons.',
      },
      {
        title: 'Review monthly production',
        detail: 'Compare actual kWh vs calculator estimate. A sudden drop may mean inverter fault or shading.',
      },
      {
        title: 'Annual electrical check',
        detail: 'Tighten terminals, inspect conduit, and test RCD/GFCI. Replace worn MC4 connectors if heated.',
      },
    ],
    tips: ['Most panels carry 25-year performance warranty at ~80% of year-1 output.'],
  },
];

export const DIY_SAFETY_NOTES = [
  'Philippine Electrical Code (PEC) and local ordinances apply — when in doubt, hire a licensed electrician.',
  'Net metering rules vary by DU; always use their latest application checklist.',
  'This guide is educational; SolarTech is not liable for DIY installations.',
];
