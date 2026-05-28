import { jsPDF } from 'jspdf';
import type { QuotationCalcOutput } from './quotation-analytics';
import { ensureAnalytics } from './quotation-analytics';

type PdfInput = {
  address: string;
  city: string;
  province?: string;
  monthlyBill: number;
  monthlyKwh: number;
  utilityRate: number;
};

function formatPhp(n: number) {
  return `PHP ${n.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;
}

export function downloadQuotationPdf(
  input: PdfInput,
  output: QuotationCalcOutput,
  notes?: string,
  clientName?: string,
) {
  const analytics = ensureAnalytics(output, input.monthlyKwh);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 18;
  let y = margin;

  const line = (text: string, size = 10, bold = false) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, 180);
    if (y + lines.length * (size * 0.45) > 280) {
      doc.addPage();
      y = margin;
    }
    doc.text(lines, margin, y);
    y += lines.length * (size * 0.45) + 2;
  };

  doc.setFillColor(34, 197, 94);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SolarTech — Solar Proposal', margin, 18);
  y = 36;
  doc.setTextColor(30, 30, 30);

  const headline = output.proposalSummary?.headline ?? `${output.recommendedSystemSizeKw} kW Solar Proposal`;
  line(headline, 14, true);
  line(
    [input.address, input.city, input.province].filter(Boolean).join(', ') +
      (clientName ? ` · Client: ${clientName}` : ''),
    9,
  );
  line(`Generated ${new Date().toLocaleDateString('en-PH')}`, 9);

  y += 2;
  line('System summary', 12, true);
  line(
    output.proposalSummary?.systemOverview ??
      `${output.numberOfPanels} panels · ${output.recommendedSystemSizeKw} kW · ${output.panelWattage}W modules`,
  );
  line(
    `Inverter: ${analytics.inverterRecommendation.brand} ${analytics.inverterRecommendation.model} (${analytics.inverterRecommendation.sizeKw} kW)`,
  );
  if (output.batteryCapacityKwh) {
    line(`Battery: ${output.batteryCapacityKwh} kWh storage`);
  }
  line(`Peak sun hours: ${analytics.peakSunHoursUsed} h/day · Energy offset: ${analytics.energyOffsetPercent}%`);

  y += 2;
  line('Financial summary', 12, true);
  line(`Total investment: ${formatPhp(output.totalCost)}`);
  line(`  Equipment: ${formatPhp(output.systemCost)} · Installation: ${formatPhp(output.installationCost)}`);
  line(`Annual production: ${output.estimatedAnnualProductionKwh.toLocaleString()} kWh`);
  line(`Annual savings: ${formatPhp(output.estimatedAnnualSavings)} · Monthly: ${formatPhp(output.estimatedMonthlySavings)}`);
  line(`Payback: ${output.paybackPeriodYears} years · 25-year ROI: ${output.roi25Years}%`);

  if (analytics.netMetering.eligible) {
    y += 2;
    line('Net metering estimate', 12, true);
    line(`Bill reduction: ~${analytics.netMetering.estimatedBillReductionPercent}%`);
    line(`Export credit (est.): ${formatPhp(analytics.netMetering.estimatedAnnualCreditPhp)}/year`);
    line(analytics.netMetering.notes, 9);
  }

  y += 2;
  line('Equipment breakdown', 12, true);
  for (const eq of output.equipment ?? []) {
    line(
      `• ${eq.type}: ${eq.brand} ${eq.model} × ${eq.quantity} — ${formatPhp(eq.totalPrice)}`,
      9,
    );
  }

  if (notes) {
    y += 3;
    line('Consultant notes', 12, true);
    line(notes, 9);
  }

  y += 4;
  line('Valid for 30 days. Final design subject to site survey and utility approval.', 8);
  line('SolarTech · Philippines solar management platform', 8);

  const slug = input.city.replace(/\s+/g, '-').toLowerCase() || 'proposal';
  doc.save(`solartech-quotation-${slug}-${Date.now()}.pdf`);
}
