import React, { useRef, useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Download, AlertTriangle, AlertCircle, ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { isPaidUser } from '../../types/auth';
import { ParsedTrip } from '../../hooks/useIftaCalculation';

const IFTA_STATES = new Set([
  'AL','AZ','AR','CA','CO','CT','DE','FL','GA','ID','IL','IN','IA','KS','KY','LA',
  'ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND',
  'OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'AB','BC','MB','NB','NL','NS','ON','QC','SK',
]);

const FREE_TRIP_LIMIT = 10;

const EXPECTED_COLS = [
  'trip_id','date','driver_name','truck_number','trailer_number',
  'origin_city','origin_state','destination_city','destination_state',
  'total_miles','waypoint_states','state_miles',
];
const REQUIRED_COLS = ['origin_state','destination_state','total_miles'];

interface RawRow { [key: string]: string | number | undefined }

function normalizeKey(k: string): string {
  return k.toLowerCase().replace(/[\s_-]+/g, '_').trim();
}

function findMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const col of EXPECTED_COLS) {
    const match = headers.find((h) => normalizeKey(h) === col);
    if (match) mapping[col] = match;
  }
  return mapping;
}

function parseStateMiles(raw: string | undefined): Record<string, number> | undefined {
  if (!raw) return undefined;
  const pairs = String(raw).split(/[,;|]+/);
  const result: Record<string, number> = {};
  for (const pair of pairs) {
    const [state, miles] = pair.trim().split(':');
    if (state && miles && !isNaN(Number(miles))) {
      result[state.toUpperCase().trim()] = Number(miles);
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function parseWaypoints(raw: string | undefined): string[] | undefined {
  if (!raw) return undefined;
  const pts = String(raw).split(/[,;|]+/).map((s) => s.toUpperCase().trim()).filter(Boolean);
  return pts.length > 0 ? pts : undefined;
}

function rowToTrip(row: RawRow, mapping: Record<string, string>): ParsedTrip | null {
  const get = (col: string) => {
    const key = mapping[col];
    return key ? String(row[key] ?? '').trim() : '';
  };
  const originState = get('origin_state').toUpperCase();
  const destinationState = get('destination_state').toUpperCase();
  const totalMiles = parseFloat(get('total_miles'));
  if (!originState || !destinationState || isNaN(totalMiles)) return null;
  return {
    tripId: get('trip_id') || undefined,
    date: get('date') || undefined,
    driverName: get('driver_name') || undefined,
    truckNumber: get('truck_number') || undefined,
    trailerNumber: get('trailer_number') || undefined,
    originCity: get('origin_city') || undefined,
    originState,
    destinationCity: get('destination_city') || undefined,
    destinationState,
    totalMiles,
    waypointStates: parseWaypoints(get('waypoint_states')),
    stateMilesMap: parseStateMiles(get('state_miles')),
  };
}

function validateTrip(trip: ParsedTrip, stateMilesRaw?: string): { error?: string; warning?: string } {
  if (!IFTA_STATES.has(trip.originState)) return { error: `Invalid origin state: ${trip.originState}` };
  if (!IFTA_STATES.has(trip.destinationState)) return { error: `Invalid destination state: ${trip.destinationState}` };
  if (trip.stateMilesMap) {
    const sum = Object.values(trip.stateMilesMap).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - trip.totalMiles) / trip.totalMiles > 0.05) {
      return { warning: "State miles don't add up — check your entries" };
    }
  }
  return {};
}

function downloadTemplate() {
  const trips: Record<string, string>[] = [
    {
      trip_id: 'T001', date: '2025-01-15', driver_name: 'John Doe',
      truck_number: 'TRK-01', trailer_number: 'TRL-01',
      origin_city: 'Chicago', origin_state: 'IL',
      destination_city: 'Detroit', destination_state: 'MI',
      total_miles: '280', waypoint_states: '', state_miles: '',
    },
    {
      trip_id: 'T002', date: '2025-01-18', driver_name: 'Jane Smith',
      truck_number: 'TRK-02', trailer_number: '',
      origin_city: 'Dallas', origin_state: 'TX',
      destination_city: 'Oklahoma City', destination_state: 'OK',
      total_miles: '205', waypoint_states: '', state_miles: 'TX:120,OK:85',
    },
  ];
  const instructions = [
    ['Column', 'Description', 'Example'],
    ['trip_id', 'Unique trip identifier (optional)', 'T001'],
    ['date', 'Trip date (YYYY-MM-DD)', '2025-01-15'],
    ['driver_name', 'Driver full name (optional)', 'John Doe'],
    ['truck_number', 'Truck/unit number (optional)', 'TRK-01'],
    ['trailer_number', 'Trailer number (optional)', 'TRL-01'],
    ['origin_city', 'City of departure (optional)', 'Chicago'],
    ['origin_state', 'REQUIRED — 2-letter IFTA jurisdiction code', 'IL'],
    ['destination_city', 'City of arrival (optional)', 'Detroit'],
    ['destination_state', 'REQUIRED — 2-letter IFTA jurisdiction code', 'MI'],
    ['total_miles', 'REQUIRED — Total miles for this trip', '280'],
    ['waypoint_states', 'Intermediate states, comma-separated (optional)', 'OH,IN'],
    ['state_miles', 'Miles per state: STATE:miles,STATE:miles (optional)', 'TX:120,OK:85'],
  ];
  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(trips, { header: Object.keys(trips[0]) });
  const ws2 = XLSX.utils.aoa_to_sheet(instructions);
  ws2['!cols'] = [{ wch: 20 }, { wch: 50 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Trips');
  XLSX.utils.book_append_sheet(wb, ws2, 'Instructions');
  XLSX.writeFile(wb, 'IFTA_Trip_Template.xlsx');
}

interface Props {
  onConfirm: (trips: ParsedTrip[]) => void;
}

const TripUpload: React.FC<Props> = ({ onConfirm }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';
  const isPaid = isPaidUser(user);
  const fileRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [rows, setRows] = useState<ParsedTrip[]>([]);
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [needsMapping, setNeedsMapping] = useState(false);
  const [validations, setValidations] = useState<{ error?: string; warning?: string }[]>([]);
  const [fileName, setFileName] = useState('');
  const [freeLimitHit, setFreeLimitHit] = useState(false);

  const parseFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonRows: RawRow[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (jsonRows.length === 0) return;
      const hdrs = Object.keys(jsonRows[0]);
      setHeaders(hdrs);
      setRawRows(jsonRows);
      const autoMap = findMapping(hdrs);
      setMapping(autoMap);
      const missingRequired = REQUIRED_COLS.filter((c) => !autoMap[c]);
      setNeedsMapping(missingRequired.length > 0);
      if (missingRequired.length === 0) applyMapping(jsonRows, autoMap);
    };
    reader.readAsArrayBuffer(file);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applyMapping = useCallback((raw: RawRow[], map: Record<string, string>) => {
    let parsed = raw.map((r) => rowToTrip(r, map)).filter(Boolean) as ParsedTrip[];
    let limited = false;
    if (!isPaid && parsed.length > FREE_TRIP_LIMIT) {
      parsed = parsed.slice(0, FREE_TRIP_LIMIT);
      limited = true;
    }
    setFreeLimitHit(limited);
    setRows(parsed);
    setValidations(parsed.map((t) => validateTrip(t)));
  }, [isPaid]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleMappingChange = (col: string, header: string) => {
    const newMap = { ...mapping, [col]: header };
    setMapping(newMap);
    const missingRequired = REQUIRED_COLS.filter((c) => !newMap[c]);
    if (missingRequired.length === 0) {
      setNeedsMapping(false);
      applyMapping(rawRows, newMap);
    }
  };

  const handleConfirm = () => {
    const valid = rows.filter((_, i) => !validations[i]?.error);
    onConfirm(valid);
  };

  const cardBg = isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textSub = isDark ? 'text-gray-400' : 'text-gray-500';

  const uniqueDrivers = new Set(rows.map((r) => r.driverName).filter(Boolean)).size;
  const uniqueTrucks = new Set(rows.map((r) => r.truckNumber).filter(Boolean)).size;
  const dates = rows.map((r) => r.date).filter(Boolean).sort() as string[];
  const dateRange = dates.length > 0 ? `${dates[0]} – ${dates[dates.length - 1]}` : '—';

  const validRows = rows.filter((_, i) => !validations[i]?.error);
  const errorCount = validations.filter((v) => v.error).length;
  const warnCount = validations.filter((v) => v.warning && !v.error).length;

  return (
    <div className={`rounded-xl border p-6 ${cardBg}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-lg font-semibold ${textMain}`}>Step 1: Trip Data</h2>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Excel Template
        </button>
      </div>

      {/* Drop zone */}
      {rows.length === 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            dragging
              ? 'border-primary-500 bg-primary-500/10'
              : isDark
              ? 'border-gray-600 hover:border-gray-500'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <Upload className={`w-10 h-10 mx-auto mb-3 ${textSub}`} />
          <p className={`font-medium ${textMain}`}>Drop your Excel or CSV file here</p>
          <p className={`text-sm mt-1 ${textSub}`}>or click to browse — .xlsx and .csv accepted</p>
          <input ref={fileRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={handleFileChange} />
        </div>
      )}

      {/* Column mapping UI */}
      {needsMapping && rawRows.length > 0 && (
        <div className={`mt-4 rounded-lg border p-4 ${isDark ? 'bg-yellow-950/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'}`}>
          <p className={`text-sm font-medium mb-3 ${isDark ? 'text-yellow-300' : 'text-yellow-800'}`}>
            Map your columns to the required fields:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {REQUIRED_COLS.map((col) => (
              <div key={col}>
                <label className={`block text-xs font-medium mb-1 ${textSub}`}>{col}</label>
                <div className="relative">
                  <select
                    value={mapping[col] || ''}
                    onChange={(e) => handleMappingChange(col, e.target.value)}
                    className={`w-full rounded-lg border px-3 py-1.5 text-sm appearance-none pr-8 ${
                      isDark ? 'bg-dark-400 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">— select —</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-2 w-4 h-4 pointer-events-none text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Free tier banner */}
      {freeLimitHit && (
        <div className={`mt-4 flex items-start gap-2 rounded-lg border p-3 text-sm ${isDark ? 'bg-amber-950/20 border-amber-700 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          Free plan supports up to {FREE_TRIP_LIMIT} trips. Showing first {FREE_TRIP_LIMIT}. Upgrade to Pro for unlimited trips.
        </div>
      )}

      {/* Validation errors/warnings summary */}
      {rows.length > 0 && (errorCount > 0 || warnCount > 0) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {errorCount > 0 && (
            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isDark ? 'bg-red-950/30 text-red-300' : 'bg-red-100 text-red-700'}`}>
              <AlertCircle className="w-3 h-3" /> {errorCount} row{errorCount > 1 ? 's' : ''} skipped (missing required fields)
            </span>
          )}
          {warnCount > 0 && (
            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isDark ? 'bg-amber-950/30 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
              <AlertTriangle className="w-3 h-3" /> {warnCount} row{warnCount > 1 ? 's' : ''} with warnings
            </span>
          )}
        </div>
      )}

      {/* Summary strip */}
      {rows.length > 0 && (
        <div className={`mt-4 flex flex-wrap gap-4 text-sm py-3 px-4 rounded-lg ${isDark ? 'bg-dark-400' : 'bg-gray-50'}`}>
          <span className={textSub}><span className={`font-semibold ${textMain}`}>{rows.length}</span> trips</span>
          <span className={textSub}>|</span>
          <span className={textSub}>{dateRange}</span>
          {uniqueDrivers > 0 && <><span className={textSub}>|</span><span className={textSub}><span className={`font-semibold ${textMain}`}>{uniqueDrivers}</span> drivers</span></>}
          {uniqueTrucks > 0 && <><span className={textSub}>|</span><span className={textSub}><span className={`font-semibold ${textMain}`}>{uniqueTrucks}</span> trucks</span></>}
          {fileName && <><span className={textSub}>|</span><span className={`text-xs ${textSub}`}>{fileName}</span></>}
        </div>
      )}

      {/* Preview table — first 10 rows */}
      {rows.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className={isDark ? 'bg-dark-400' : 'bg-gray-50'}>
                {['#','Date','Driver','Origin','Destination','Miles','Status'].map((h) => (
                  <th key={h} className={`px-3 py-2 text-left text-xs font-semibold ${textSub}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 10).map((trip, i) => {
                const v = validations[i] || {};
                return (
                  <tr
                    key={i}
                    className={`border-t ${
                      isDark ? 'border-gray-700' : 'border-gray-100'
                    } ${v.error ? (isDark ? 'bg-red-950/10' : 'bg-red-50') : v.warning ? (isDark ? 'bg-amber-950/10' : 'bg-amber-50') : ''}`}
                  >
                    <td className={`px-3 py-1.5 ${textSub}`}>{i + 1}</td>
                    <td className={`px-3 py-1.5 ${textMain}`}>{trip.date || '—'}</td>
                    <td className={`px-3 py-1.5 ${textMain}`}>{trip.driverName || '—'}</td>
                    <td className={`px-3 py-1.5 ${textMain}`}>{trip.originState}{trip.originCity ? ` (${trip.originCity})` : ''}</td>
                    <td className={`px-3 py-1.5 ${textMain}`}>{trip.destinationState}{trip.destinationCity ? ` (${trip.destinationCity})` : ''}</td>
                    <td className={`px-3 py-1.5 ${textMain}`}>{trip.totalMiles.toLocaleString()}</td>
                    <td className="px-3 py-1.5">
                      {v.error
                        ? <span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{v.error}</span>
                        : v.warning
                        ? <span className="text-xs text-amber-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{v.warning}</span>
                        : <span className="text-xs text-green-500">OK</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length > 10 && (
            <p className={`px-3 py-2 text-xs ${textSub}`}>Showing 10 of {rows.length} rows</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex items-center gap-3">
        {rows.length > 0 && (
          <>
            <button
              onClick={() => { setRows([]); setRawRows([]); setHeaders([]); setMapping({}); setNeedsMapping(false); setFileName(''); setFreeLimitHit(false); }}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-dark-400' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Clear
            </button>
            <button
              onClick={handleConfirm}
              disabled={validRows.length === 0}
              className="px-6 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm & Continue ({validRows.length} trips)
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TripUpload;
