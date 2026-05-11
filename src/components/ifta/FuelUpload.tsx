import React, { useRef, useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Download, AlertTriangle, Lock, ChevronLeft } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { isPaidUser, isProUser } from '../../types/auth';
import { ParsedFuelReceipt } from '../../hooks/useIftaCalculation';
import ReceiptCard from './ReceiptCard';

const FREE_FUEL_LIMIT = 20;

// EFS / Comdata column signatures
const EFS_SIGNATURE = ['TRANSACTION DATE', 'STATE', 'GALLONS', 'UNIT PRICE'];
const COMDATA_SIGNATURE = ['Tran Date', 'St', 'Net Gals', 'PPG'];

type FuelTab = 'manual' | 'efs' | 'ai';

interface RawRow { [key: string]: string | number | undefined }

function normalizeKey(k: string) {
  return k.toLowerCase().replace(/[\s_-]+/g, '_').trim();
}

function downloadTemplate() {
  const rows = [
    { date: '2025-01-10', state: 'IL', gallons: 150.3, price_per_gallon: 3.89, vendor: 'Love\'s' },
    { date: '2025-01-15', state: 'ON', gallons: 120.0, price_per_gallon: 1.52, vendor: 'Petro-Canada' },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'FuelReceipts');
  XLSX.writeFile(wb, 'IFTA_Fuel_Template.xlsx');
}

function parseManualRows(jsonRows: RawRow[]): ParsedFuelReceipt[] {
  return jsonRows.map((row) => {
    const get = (col: string) => {
      const key = Object.keys(row).find((k) => normalizeKey(k) === col);
      return key ? String(row[key] ?? '').trim() : '';
    };
    return {
      date: get('date') || undefined,
      state: get('state').toUpperCase(),
      gallons: parseFloat(get('gallons')) || 0,
      pricePerGallon: parseFloat(get('price_per_gallon')) || undefined,
      vendor: get('vendor') || undefined,
    };
  }).filter((r) => r.state && r.gallons > 0);
}

function parseEfsRows(jsonRows: RawRow[], isEfs: boolean): ParsedFuelReceipt[] {
  return jsonRows.map((row) => {
    if (isEfs) {
      return {
        date: String(row['TRANSACTION DATE'] ?? ''),
        state: String(row['STATE'] ?? '').toUpperCase(),
        gallons: parseFloat(String(row['GALLONS'] ?? '0')) || 0,
        pricePerGallon: parseFloat(String(row['UNIT PRICE'] ?? '0')) || undefined,
        vendor: String(row['MERCHANT'] ?? row['VENDOR'] ?? ''),
      };
    } else {
      // Comdata
      return {
        date: String(row['Tran Date'] ?? ''),
        state: String(row['St'] ?? '').toUpperCase(),
        gallons: parseFloat(String(row['Net Gals'] ?? '0')) || 0,
        pricePerGallon: parseFloat(String(row['PPG'] ?? '0')) || undefined,
        vendor: String(row['Location'] ?? row['Vendor'] ?? ''),
      };
    }
  }).filter((r) => r.state && r.gallons > 0);
}

function detectFormat(headers: string[]): 'efs' | 'comdata' | null {
  if (EFS_SIGNATURE.every((h) => headers.includes(h))) return 'efs';
  if (COMDATA_SIGNATURE.every((h) => headers.includes(h))) return 'comdata';
  return null;
}

interface Props {
  onConfirm: (receipts: ParsedFuelReceipt[]) => void;
  onBack: () => void;
}

const FuelUpload: React.FC<Props> = ({ onConfirm, onBack }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';
  const isPaid = isPaidUser(user);
  const isPro = isProUser(user);

  const [tab, setTab] = useState<FuelTab>('manual');
  const [receipts, setReceipts] = useState<ParsedFuelReceipt[]>([]);
  const [dragging, setDragging] = useState(false);
  const [detectedFormat, setDetectedFormat] = useState<'efs' | 'comdata' | null>(null);
  const [freeLimitHit, setFreeLimitHit] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);
  const aiFileRef = useRef<HTMLInputElement>(null);

  const applyLimit = useCallback((rows: ParsedFuelReceipt[]): ParsedFuelReceipt[] => {
    if (!isPaid && rows.length > FREE_FUEL_LIMIT) {
      setFreeLimitHit(true);
      return rows.slice(0, FREE_FUEL_LIMIT);
    }
    setFreeLimitHit(false);
    return rows;
  }, [isPaid]);

  const parseFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonRows: RawRow[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (jsonRows.length === 0) return;
      const hdrs = Object.keys(jsonRows[0]);
      const fmt = detectFormat(hdrs);
      setDetectedFormat(fmt);
      let parsed: ParsedFuelReceipt[];
      if (fmt) {
        parsed = parseEfsRows(jsonRows, fmt === 'efs');
      } else {
        parsed = parseManualRows(jsonRows);
      }
      setReceipts(applyLimit(parsed));
    };
    reader.readAsArrayBuffer(file);
  }, [applyLimit]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleReceiptChange = (index: number, updated: ParsedFuelReceipt) => {
    setReceipts((prev) => prev.map((r, i) => (i === index ? updated : r)));
  };

  const handleReceiptRemove = (index: number) => {
    setReceipts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAiScan = useCallback(async (files: File[]) => {
    if (!isPro || files.length === 0) return;
    setAiLoading(true);
    setAiError('');
    const results: ParsedFuelReceipt[] = [];
    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        const response = await fetch('https://api.staging.integratedtech.ca/api/ifta/parse-receipt', {
          method: 'POST',
          body: fd,
        });
        if (!response.ok) {
          results.push({ state: '', gallons: 0, vendor: file.name });
          continue;
        }
        const data = await response.json();
        results.push({
          date: data.date || undefined,
          state: (data.state || '').toUpperCase(),
          gallons: Number(data.gallons) || 0,
          pricePerGallon: Number(data.price_per_gallon) || undefined,
          vendor: data.vendor || undefined,
        });
      } catch {
        results.push({ state: '', gallons: 0, vendor: file.name });
      }
    }
    setReceipts((prev) => applyLimit([...prev, ...results]));
    setAiLoading(false);
  }, [isPro, applyLimit]);

  const cardBg = isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textSub = isDark ? 'text-gray-400' : 'text-gray-500';
  const tabBase = `px-4 py-2 text-sm font-medium border-b-2 transition-colors`;
  const tabActive = `border-primary-600 text-primary-600`;
  const tabInactive = `border-transparent ${textSub} hover:${textMain}`;

  const totalGallons = receipts.reduce((s, r) => s + (r.gallons || 0), 0);
  const uniqueStates = new Set(receipts.map((r) => r.state).filter(Boolean)).size;
  const dates = receipts.map((r) => r.date).filter(Boolean).sort() as string[];
  const dateRange = dates.length > 0 ? `${dates[0]} – ${dates[dates.length - 1]}` : '—';

  return (
    <div className={`rounded-xl border p-6 ${cardBg}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-lg font-semibold ${textMain}`}>Step 2: Fuel Receipts</h2>
        {tab === 'manual' && (
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Template
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className={`flex border-b mb-5 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        {([['manual', 'Manual / Excel'], ['efs', 'EFS / Comdata'], ['ai', 'AI Receipt Scan']] as [FuelTab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`${tabBase} ${tab === id ? tabActive : tabInactive} ${id === 'ai' && !isPro ? 'opacity-60' : ''}`}
          >
            {id === 'ai' && !isPro && <Lock className="w-3 h-3 inline mr-1" />}
            {label}
          </button>
        ))}
      </div>

      {/* Manual / Excel tab */}
      {tab === 'manual' && (
        <>
          {receipts.length === 0 ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                dragging ? 'border-primary-500 bg-primary-500/10' : isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Upload className={`w-10 h-10 mx-auto mb-3 ${textSub}`} />
              <p className={`font-medium ${textMain}`}>Drop your fuel receipt Excel or CSV</p>
              <p className={`text-sm mt-1 ${textSub}`}>.xlsx and .csv accepted</p>
              <input ref={fileRef} type="file" accept=".xlsx,.csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) parseFile(f); }} />
            </div>
          ) : (
            <div className="space-y-2">
              {receipts.map((r, i) => (
                <ReceiptCard key={i} receipt={r} index={i} onChange={handleReceiptChange} onRemove={handleReceiptRemove} />
              ))}
            </div>
          )}
        </>
      )}

      {/* EFS / Comdata tab */}
      {tab === 'efs' && (
        <>
          {detectedFormat && (
            <div className={`mb-3 flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${isDark ? 'bg-green-950/20 border border-green-700 text-green-400' : 'bg-green-50 border border-green-200 text-green-700'}`}>
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              {detectedFormat === 'efs' ? 'EFS Format Detected' : 'Comdata Format Detected'} — columns auto-mapped
            </div>
          )}
          {receipts.length === 0 ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                dragging ? 'border-primary-500 bg-primary-500/10' : isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Upload className={`w-10 h-10 mx-auto mb-3 ${textSub}`} />
              <p className={`font-medium ${textMain}`}>Drop your EFS or Comdata CSV export</p>
              <p className={`text-sm mt-1 ${textSub}`}>Format is detected automatically</p>
              <input ref={fileRef} type="file" accept=".xlsx,.csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) parseFile(f); }} />
            </div>
          ) : (
            <div className="space-y-2">
              {receipts.map((r, i) => (
                <ReceiptCard key={i} receipt={r} index={i} onChange={handleReceiptChange} onRemove={handleReceiptRemove} />
              ))}
            </div>
          )}
        </>
      )}

      {/* AI Receipt Scan tab */}
      {tab === 'ai' && (
        <>
          {!isPro ? (
            <div className={`text-center py-12 ${textSub}`}>
              <Lock className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className={`font-medium ${textMain}`}>AI Receipt Scanning is a Pro feature</p>
              <p className="text-sm mt-1">Upgrade to Pro to let Claude parse your fuel receipts automatically.</p>
            </div>
          ) : (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const files = Array.from(e.dataTransfer.files);
                  // files queued for scan
                  handleAiScan(files);
                }}
                onClick={() => aiFileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  dragging ? 'border-primary-500 bg-primary-500/10' : isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Upload className={`w-10 h-10 mx-auto mb-3 ${textSub}`} />
                <p className={`font-medium ${textMain}`}>Drop fuel receipt images or PDFs</p>
                <p className={`text-sm mt-1 ${textSub}`}>PDF, JPG, PNG — Claude AI will extract the data</p>
                <input
                  ref={aiFileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    // files queued for scan
                    handleAiScan(files);
                  }}
                />
              </div>
              {aiLoading && (
                <div className="mt-4 flex items-center gap-2 text-sm text-primary-600">
                  <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  Scanning receipts…
                </div>
              )}
              {aiError && <p className="mt-2 text-sm text-red-500">{aiError}</p>}
              {receipts.length > 0 && (
                <div className="mt-4 space-y-2">
                  {receipts.map((r, i) => (
                    <ReceiptCard key={i} receipt={r} index={i} onChange={handleReceiptChange} onRemove={handleReceiptRemove} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Free tier banner */}
      {freeLimitHit && (
        <div className={`mt-4 flex items-start gap-2 rounded-lg border p-3 text-sm ${isDark ? 'bg-amber-950/20 border-amber-700 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          Free plan supports up to {FREE_FUEL_LIMIT} receipts. Upgrade to Pro for unlimited.
        </div>
      )}

      {/* Summary strip */}
      {receipts.length > 0 && (
        <div className={`mt-4 flex flex-wrap gap-4 text-sm py-3 px-4 rounded-lg ${isDark ? 'bg-dark-400' : 'bg-gray-50'}`}>
          <span className={textSub}><span className={`font-semibold ${textMain}`}>{totalGallons.toFixed(1)}</span> gal</span>
          <span className={textSub}>|</span>
          <span className={textSub}><span className={`font-semibold ${textMain}`}>{uniqueStates}</span> states</span>
          <span className={textSub}>|</span>
          <span className={textSub}>{dateRange}</span>
          <span className={textSub}>|</span>
          <span className={textSub}><span className={`font-semibold ${textMain}`}>{receipts.length}</span> receipts</span>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className={`flex items-center gap-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-dark-400' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={() => onConfirm(receipts)}
          className="px-6 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors"
        >
          {receipts.length > 0 ? `Confirm & Process (${receipts.length} receipts)` : 'Skip & Process'}
        </button>
      </div>
    </div>
  );
};

export default FuelUpload;
