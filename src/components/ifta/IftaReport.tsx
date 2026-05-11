import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { FileText, Download, Lock, RotateCcw, AlertCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { isPaidUser } from '../../types/auth';
import { ParsedTrip, ParsedFuelReceipt, JurisdictionRow } from '../../hooks/useIftaCalculation';
import { useIftaCalculation, IftaCalculationResult } from '../../hooks/useIftaCalculation';
import { useIftaRates } from '../../hooks/useIftaRates';
import JurisdictionTable from './JurisdictionTable';

const PDF_ENDPOINT = 'https://api.staging.integratedtech.ca/api/web-tools/letterhead/pdf';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://api.staging.integratedtech.ca';

interface Props {
  trips: ParsedTrip[];
  fuelReceipts: ParsedFuelReceipt[];
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  onStartOver: () => void;
}

const fmt = (n: number, d = 2) =>
  n.toLocaleString('en-CA', { minimumFractionDigits: d, maximumFractionDigits: d });

function buildReportHTML(
  companyName: string,
  quarter: string,
  year: number,
  result: IftaCalculationResult,
  ratesUpdated: string,
  isPaid: boolean,
): string {
  const today = new Date().toLocaleDateString('en-CA');
  const netLabel = result.netTaxDue >= 0 ? 'Net Tax Due' : 'Net Credit';
  const netValue = result.netTaxDue < 0
    ? `($${fmt(Math.abs(result.netTaxDue))})`
    : `$${fmt(result.netTaxDue)}`;
  const netColor = result.netTaxDue > 0 ? '#ef4444' : '#22c55e';
  const hasEstimated = result.jurisdictions.some((j: JurisdictionRow) => j.hasEstimatedMiles);

  const tableRows = result.jurisdictions.map((j: JurisdictionRow) => {
    const taxColor = j.taxOwed > 0 ? '#ef4444' : j.taxOwed < 0 ? '#22c55e' : '#111';
    const taxStr = j.taxOwed < 0 ? `($${fmt(Math.abs(j.taxOwed))})` : `$${fmt(j.taxOwed)}`;
    return `<tr>
      <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-weight:500">${j.state}${j.hasEstimatedMiles ? '*' : ''}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${fmt(j.milesDriven, 1)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${fmt(j.fuelConsumed)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${fmt(j.fuelPurchased)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;color:${j.netGallons < 0 ? '#22c55e' : '#111'}">${fmt(j.netGallons)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;color:#6b7280">${fmt(j.taxRate, 3)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-weight:600;color:${taxColor}">${taxStr}</td>
    </tr>`;
  }).join('');

  const totalNetGal = fmt(result.totalFuelConsumed - result.totalFuelPurchased);

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<style>
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #111; background: #fff; }
  h1 { font-size: 20px; font-weight: 700; }
  .sub { color: #6b7280; font-size: 12px; }
  .divider { border-top: 1px solid #e5e7eb; margin: 14px 0; }
  .cards { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 20px; }
  .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; text-align: center; }
  .card-label { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
  .card-val { font-size: 18px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #f9fafb; padding: 8px 10px; text-align: left; font-size: 11px; color: #6b7280; border-bottom: 2px solid #e5e7eb; white-space: nowrap; }
  tfoot td { background: #f3f4f6; font-weight: 700; padding: 8px 10px; border-top: 2px solid #d1d5db; }
  .footnote { font-size: 11px; color: #9ca3af; margin-top: 14px; }
  .watermark { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 18px; }
</style>
</head><body>
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
  <div>
    <h1>${companyName}</h1>
    <p class="sub">IFTA Quarterly Report — ${quarter} ${year}</p>
  </div>
  <div style="text-align:right">
    <p class="sub">Generated ${today}</p>
    ${result.fleetMpg > 0 ? `<p class="sub">Fleet MPG: ${fmt(result.fleetMpg)}</p>` : ''}
  </div>
</div>
<div class="divider"></div>
<div class="cards">
  <div class="card"><div class="card-label">Total Miles</div><div class="card-val" style="color:#3b82f6">${fmt(result.totalMiles, 0)}</div></div>
  <div class="card"><div class="card-label">Fuel Purchased</div><div class="card-val" style="color:#a855f7">${fmt(result.totalFuelPurchased)} gal</div></div>
  <div class="card"><div class="card-label">Fleet MPG</div><div class="card-val" style="color:#f97316">${fmt(result.fleetMpg)}</div></div>
  <div class="card"><div class="card-label">${netLabel}</div><div class="card-val" style="color:${netColor}">${netValue}</div></div>
</div>
<table>
  <thead><tr>
    <th>State/Province</th><th>Miles Driven</th><th>Fuel Consumed (gal)</th>
    <th>Fuel Purchased (gal)</th><th>Net Gallons</th><th>Tax Rate ($/gal)</th><th>Amount</th>
  </tr></thead>
  <tbody>${tableRows}</tbody>
  <tfoot><tr>
    <td>Totals</td>
    <td>${fmt(result.totalMiles, 1)}</td>
    <td>${fmt(result.totalFuelConsumed)}</td>
    <td>${fmt(result.totalFuelPurchased)}</td>
    <td>${totalNetGal}</td>
    <td>—</td>
    <td style="color:${netColor}">${netValue}</td>
  </tr></tfoot>
</table>
${hasEstimated ? '<p class="footnote">* Miles estimated via state routing algorithm. Enter actual odometer readings for accuracy.</p>' : ''}
${ratesUpdated ? `<p class="footnote">Tax rates sourced from IFTA Inc. as of ${ratesUpdated}. Verify at iftach.org before filing.</p>` : ''}
${!isPaid ? '<p class="watermark">Generated by Integra AI · integratedtech.ca</p>' : ''}
</body></html>`;
}

const IftaReport: React.FC<Props> = ({ trips, fuelReceipts, quarter, year, onStartOver }) => {
  const { theme } = useTheme();
  const { user, token } = useAuth();
  const isDark = theme === 'dark';
  const isPaid = isPaidUser(user);

  const { rates, ratesUpdated, loading: ratesLoading } = useIftaRates();
  const result = useIftaCalculation(trips, fuelReceipts, rates);
  const [histSaved, setHistSaved] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const companyName = user?.full_name || user?.name || 'My Company';

  // Save to history once rates are ready and user is paid
  useEffect(() => {
    if (ratesLoading || !isPaid || histSaved || !token || result.jurisdictions.length === 0) return;
    const payload = {
      quarter,
      year,
      trips,
      fuelReceipts,
      jurisdictionBreakdown: result.jurisdictions,
      totals: {
        totalMiles: result.totalMiles,
        fleetMpg: result.fleetMpg,
        netTaxDue: result.netTaxDue,
      },
    };
    fetch(`${BACKEND_URL}/api/history/ifta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }).catch(() => {});
    setHistSaved(true);
  }, [ratesLoading, isPaid, histSaved, token, result, quarter, year, trips, fuelReceipts]);

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      const html = buildReportHTML(companyName, quarter, year, result, ratesUpdated, isPaid);
      const res = await fetch(PDF_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html }),
      });
      if (!res.ok) throw new Error(`PDF endpoint returned ${res.status}`);
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `IFTA_Report_${quarter}_${year}_${companyName.replace(/\s+/g, '_')}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      alert('PDF generation failed. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1 — IFTA Summary
    const summaryRows = result.jurisdictions.map((j) => ({
      'State/Province': j.state + (j.hasEstimatedMiles ? '*' : ''),
      'Miles Driven': +j.milesDriven.toFixed(1),
      'Fuel Consumed (gal)': +j.fuelConsumed.toFixed(2),
      'Fuel Purchased (gal)': +j.fuelPurchased.toFixed(2),
      'Net Gallons': +j.netGallons.toFixed(2),
      'Tax Rate ($/gal)': +j.taxRate.toFixed(3),
      'Amount ($)': +j.taxOwed.toFixed(2),
      'Miles Source': j.hasEstimatedMiles ? 'estimated' : 'driver-reported',
    }));
    summaryRows.push({
      'State/Province': 'TOTAL',
      'Miles Driven': +result.totalMiles.toFixed(1),
      'Fuel Consumed (gal)': +result.totalFuelConsumed.toFixed(2),
      'Fuel Purchased (gal)': +result.totalFuelPurchased.toFixed(2),
      'Net Gallons': +(result.totalFuelConsumed - result.totalFuelPurchased).toFixed(2),
      'Tax Rate ($/gal)': 0,
      'Amount ($)': +result.netTaxDue.toFixed(2),
      'Miles Source': '',
    });

    // Sheet 2 — Trip Detail
    const tripRows: object[] = [];
    for (const trip of trips) {
      for (const seg of trip.resolvedMiles || []) {
        tripRows.push({
          'Trip ID': trip.tripId || '',
          'Date': trip.date || '',
          'Driver': trip.driverName || '',
          'Truck': trip.truckNumber || '',
          'Origin': trip.originState,
          'Destination': trip.destinationState,
          'State': seg.state,
          'Miles in State': +seg.miles.toFixed(1),
          'Source': seg.source,
        });
      }
    }

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'IFTA Summary');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tripRows), 'Trip Detail');
    XLSX.writeFile(wb, `IFTA_Report_${quarter}_${year}_${companyName.replace(/\s+/g, '_')}.xlsx`);
  };

  const downloadFilingWorksheet = () => {
    const headers = [
      ['IFTA Quarterly Fuel Tax Return'],
      [`Quarter: ${quarter}  |  Year: ${year}  |  IFTA License #: ___________________`],
      [],
      ['Jurisdiction', 'Total Miles', 'Taxable Miles', 'MPG', 'Fuel Consumed (gal)', 'Fuel Purchased (gal)', 'Net Taxable Gallons', 'Tax Rate ($/gal)', 'Tax Due ($)', 'Adjusted Rate (fill before filing)'],
    ];
    const dataRows = result.jurisdictions.map((j) => [
      j.state + (j.hasEstimatedMiles ? '*' : ''),
      +j.milesDriven.toFixed(1),
      +j.milesDriven.toFixed(1),
      result.fleetMpg > 0 ? +result.fleetMpg.toFixed(2) : '',
      +j.fuelConsumed.toFixed(2),
      +j.fuelPurchased.toFixed(2),
      +j.netGallons.toFixed(2),
      +j.taxRate.toFixed(3),
      +j.taxOwed.toFixed(2),
      '',
    ]);
    const totalRow = [
      'TOTAL',
      +result.totalMiles.toFixed(1), +result.totalMiles.toFixed(1),
      result.fleetMpg > 0 ? +result.fleetMpg.toFixed(2) : '',
      +result.totalFuelConsumed.toFixed(2),
      +result.totalFuelPurchased.toFixed(2),
      +(result.totalFuelConsumed - result.totalFuelPurchased).toFixed(2),
      '',
      +result.netTaxDue.toFixed(2),
      '',
    ];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...dataRows, totalRow]);
    ws['!cols'] = Array(10).fill({ wch: 22 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Filing Worksheet');
    XLSX.writeFile(wb, `IFTA_Filing_${quarter}_${year}_${companyName.replace(/\s+/g, '_')}.xlsx`);
  };

  const cardBg = isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textSub = isDark ? 'text-gray-400' : 'text-gray-500';

  const summaryCards = [
    { label: 'Total Miles', value: fmt(result.totalMiles, 0), color: 'text-blue-500' },
    { label: 'Total Fuel Purchased', value: `${fmt(result.totalFuelPurchased)} gal`, color: 'text-purple-500' },
    { label: 'Fleet MPG', value: fmt(result.fleetMpg), color: 'text-orange-500' },
    {
      label: result.netTaxDue >= 0 ? 'Net Tax Due' : 'Net Credit',
      value: result.netTaxDue < 0 ? `($${fmt(Math.abs(result.netTaxDue))})` : `$${fmt(result.netTaxDue)}`,
      color: result.netTaxDue > 0 ? 'text-red-500' : 'text-green-500',
    },
  ];

  return (
    <div className={`rounded-xl border p-6 ${cardBg}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className={`text-lg font-semibold ${textMain}`}>
          IFTA Report — {quarter} {year}
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {/* PDF */}
          <button
            onClick={downloadPDF}
            disabled={pdfLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
          >
            {pdfLoading
              ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating…</>
              : <><FileText className="w-4 h-4" /> Download PDF</>}
          </button>

          {/* Excel export */}
          <div className="relative group">
            <button
              onClick={isPaid ? downloadExcel : undefined}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isPaid
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : isDark
                  ? 'bg-dark-400 border border-gray-600 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed'
              }`}
            >
              {!isPaid && <Lock className="w-3.5 h-3.5" />}
              <Download className="w-4 h-4" /> Download Excel
            </button>
            {!isPaid && (
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                Upgrade to Pro to unlock Excel exports
              </div>
            )}
          </div>

          {/* Filing worksheet */}
          <div className="relative group">
            <button
              onClick={isPaid ? downloadFilingWorksheet : undefined}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isPaid
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : isDark
                  ? 'bg-dark-400 border border-gray-600 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed'
              }`}
            >
              {!isPaid && <Lock className="w-3.5 h-3.5" />}
              <FileText className="w-4 h-4" /> Filing Worksheet
            </button>
            {!isPaid && (
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                Upgrade to Pro to unlock Excel exports
              </div>
            )}
          </div>

          <button
            onClick={onStartOver}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-dark-400' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            <RotateCcw className="w-3.5 h-3.5" /> New Report
          </button>
        </div>
      </div>

      <div>
        {/* Report header */}
        <div className={`mb-5 pb-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <p className={`font-bold text-base ${textMain}`}>{companyName}</p>
              <p className={`text-sm ${textSub}`}>IFTA Quarterly Report — {quarter} {year}</p>
            </div>
            <div className="text-right">
              <p className={`text-xs ${textSub}`}>Generated {new Date().toLocaleDateString('en-CA')}</p>
              {result.fleetMpg > 0 && (
                <p className={`text-xs ${textSub}`}>Fleet MPG: {fmt(result.fleetMpg)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {summaryCards.map((card) => (
            <div key={card.label} className={`rounded-lg border p-3 text-center ${isDark ? 'bg-dark-400 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-xs font-medium mb-1 ${textSub}`}>{card.label}</p>
              <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Rates warning */}
        {ratesLoading && (
          <div className={`flex items-center gap-2 text-sm mb-4 ${textSub}`}>
            <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            Loading tax rates…
          </div>
        )}
        {!ratesLoading && Object.keys(rates).length === 0 && (
          <div className={`flex items-center gap-2 text-sm mb-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
            <AlertCircle className="w-4 h-4" />
            Tax rates unavailable — amounts shown as $0.00. Verify at iftach.org.
          </div>
        )}

        {/* Jurisdiction table */}
        <JurisdictionTable
          jurisdictions={result.jurisdictions}
          totalMiles={result.totalMiles}
          totalFuelPurchased={result.totalFuelPurchased}
          totalFuelConsumed={result.totalFuelConsumed}
          netTaxDue={result.netTaxDue}
        />

        {/* Footnotes */}
        <div className="mt-4 space-y-1">
          {ratesUpdated && (
            <p className={`text-xs ${textSub}`}>
              Tax rates sourced from IFTA Inc. as of {ratesUpdated}. Verify at iftach.org before filing.
            </p>
          )}
          {/* Free tier watermark */}
          {!isPaid && (
            <p className={`text-xs text-center mt-3 ${textSub}`}>
              Generated by Integra AI · integratedtech.ca
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default IftaReport;
