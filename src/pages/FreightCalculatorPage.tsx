import React, { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Plus, X, Printer, RotateCcw, ArrowLeftRight, MapPin, Navigation,
  DollarSign, Copy, Save, CheckCircle, Lock, User, Building2,
} from 'lucide-react';
import { apiFetch, parseApiError } from '../utils/apiFetch';
import { useAuth } from '../contexts/AuthContext';
import { isPaidUser } from '../types/auth';
import BackToTools from '../components/BackToTools';

/* ── Fix Leaflet marker icons ────────────────────────────────────────── */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

/* ── Types ───────────────────────────────────────────────────────────── */
interface AccessorialRow { id: string; amount: string; name: string; }
interface QuoteTab {
  id: string; label: string;
  ratePerMile: string; fuelSurcharge: string; ratePerStop: string;
  ratePerLbs: string; ftlLtl: string; accessorials: AccessorialRow[]; margin: string;
}
interface RouteInfo {
  distanceMiles: number; distanceKm: number; durationMin: number;
  numStops: number; polyline: [number, number][]; markers: [number, number][];
}
interface PartyInfo { company: string; contact: string; address: string; city: string; state: string; phone: string; email: string; }

/* ── Helpers ─────────────────────────────────────────────────────────── */
let _qid = 1;
const newId  = () => String(_qid++);
const blankQ = (): QuoteTab => ({
  id: newId(), label: `Quote ${_qid - 1}`,
  ratePerMile: '', fuelSurcharge: '', ratePerStop: '',
  ratePerLbs: '', ftlLtl: '100', accessorials: [], margin: '',
});
const blankParty = (): PartyInfo => ({ company: '', contact: '', address: '', city: '', state: '', phone: '', email: '' });
const n   = (v: string) => parseFloat(v) || 0;
const fmt = (v: number) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function computeQuote(q: QuoteTab, route: RouteInfo | null) {
  const mi       = route?.distanceMiles ?? 0;
  const stops    = route?.numStops ?? 0;
  const base     = mi * n(q.ratePerMile);
  const fuel     = n(q.fuelSurcharge);
  const stopsAmt = stops * n(q.ratePerStop);
  const acc      = q.accessorials.reduce((s, a) => s + n(a.amount), 0);
  const sub      = base + fuel + stopsAmt + acc;
  const ftl      = sub * (n(q.ftlLtl) / 100);
  const margin   = ftl * (n(q.margin) / 100);
  const total    = ftl + margin;
  return { base, fuel, stopsAmt, acc, sub, ftl, margin, total, mi, stops };
}

async function geocode(address: string): Promise<[number, number]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=ca,us`;
  const res  = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'IntegraAI-FreightCalc/1.0' } });
  const data = await res.json();
  if (!data?.length) throw new Error(`Could not find "${address}". Try a more specific address.`);
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

async function fetchRoute(waypoints: [number, number][]): Promise<RouteInfo> {
  const coords = waypoints.map(([lat, lon]) => `${lon},${lat}`).join(';');
  const res    = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
  );
  const data   = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No driving route found between these locations.');
  const r = data.routes[0];
  return {
    distanceMiles: (r.distance / 1000) * 0.621371,
    distanceKm:    r.distance / 1000,
    durationMin:   r.duration / 60,
    numStops:      waypoints.length - 2,
    polyline:      r.geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon] as [number, number]),
    markers:       waypoints,
  };
}

/* ── Map fit bounds helper ───────────────────────────────────────────── */
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] });
  }, [map, positions]);
  return null;
}

/* ── PDF export ──────────────────────────────────────────────────────── */
function exportPDF(
  q: QuoteTab, route: RouteInfo | null, c: ReturnType<typeof computeQuote>,
  customer: PartyInfo, consignor: PartyInfo, consignee: PartyInfo,
  pickup: string, destination: string,
) {
  const partyBlock = (title: string, p: PartyInfo) => `
    <div class="party">
      <h4>${title}</h4>
      ${p.company  ? `<p><strong>${p.company}</strong></p>` : ''}
      ${p.contact  ? `<p>${p.contact}</p>` : ''}
      ${p.address  ? `<p>${p.address}</p>` : ''}
      ${p.city     ? `<p>${p.city}${p.state ? ', ' + p.state : ''}</p>` : ''}
      ${p.phone    ? `<p>📞 ${p.phone}</p>` : ''}
      ${p.email    ? `<p>✉ ${p.email}</p>` : ''}
    </div>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <title>${q.label} — Freight Quote</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:Arial,sans-serif;padding:36px;color:#111;max-width:720px;margin:0 auto;font-size:13px}
    h1{color:#dc2626;border-bottom:3px solid #dc2626;padding-bottom:10px;margin-bottom:20px;font-size:22px}
    h4{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#888;margin:0 0 6px}
    .parties{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;border:1px solid #eee;border-radius:6px;padding:16px}
    .party p{margin:2px 0;font-size:12px}
    .route-info{background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px 16px;margin-bottom:20px;display:flex;gap:32px}
    .route-info span{font-size:12px;color:#555} .route-info strong{color:#dc2626;font-size:15px;display:block}
    table{width:100%;border-collapse:collapse;margin-bottom:16px}
    th{background:#f8f8f8;padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#666;border-bottom:2px solid #eee}
    td{padding:9px 12px;border-bottom:1px solid #f0f0f0;font-size:13px}
    .total-row td{font-weight:700;font-size:17px;color:#dc2626;border-top:2px solid #dc2626;padding-top:12px}
    .disclaimer{margin-top:20px;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:10px}
    @media print{body{padding:20px}}
  </style></head><body>
  <h1>Freight Quote — ${q.label}</h1>
  <div class="parties">
    ${partyBlock('Customer', customer)}
    ${partyBlock('Consignor / Shipper', consignor)}
    ${partyBlock('Consignee / Receiver', consignee)}
  </div>
  ${route ? `
  <div class="route-info">
    <div><span>Route</span><strong>${pickup || '—'} → ${destination || '—'}</strong></div>
    <div><span>Distance</span><strong>${c.mi.toFixed(1)} mi (${route.distanceKm.toFixed(1)} km)</strong></div>
    <div><span>Est. Drive Time</span><strong>~${Math.floor(route.durationMin/60)}h ${Math.round(route.durationMin%60)}m</strong></div>
  </div>` : ''}
  <table>
    <tr><th>Item</th><th>Details</th><th style="text-align:right">Amount</th></tr>
    <tr><td>Base Rate</td><td>${c.mi.toFixed(1)} mi × ${fmt(n(q.ratePerMile))}/mi</td><td style="text-align:right">${fmt(c.base)}</td></tr>
    <tr><td>Fuel Surcharge</td><td>Flat</td><td style="text-align:right">${fmt(c.fuel)}</td></tr>
    <tr><td>Stops</td><td>${c.stops} stop(s) × ${fmt(n(q.ratePerStop))}</td><td style="text-align:right">${fmt(c.stopsAmt)}</td></tr>
    ${q.accessorials.map(a => `<tr><td>Accessorial</td><td>${a.name||'—'}</td><td style="text-align:right">${fmt(n(a.amount))}</td></tr>`).join('')}
    <tr><td colspan="2"><strong>Subtotal</strong></td><td style="text-align:right"><strong>${fmt(c.sub)}</strong></td></tr>
    <tr><td>FTL/LTL Applied</td><td>${n(q.ftlLtl)}%</td><td style="text-align:right">${fmt(c.ftl)}</td></tr>
    <tr><td>Margin</td><td>${n(q.margin)}%</td><td style="text-align:right">${fmt(c.margin)}</td></tr>
    <tr class="total-row"><td colspan="2">TOTAL QUOTE</td><td style="text-align:right">${fmt(c.total)} USD</td></tr>
  </table>
  <p class="disclaimer">This is an estimate only. Actual charges may vary based on final weight, distance, and accessorial requirements. Generated by Integra AI — Integrated Supply Chain Solutions.</p>
  </body></html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

/* ── Component ───────────────────────────────────────────────────────── */
const FreightCalculatorPage: React.FC = () => {
  const { user, token } = useAuth();

  /* Quotes */
  const [quotes, setQuotes]     = useState<QuoteTab[]>([blankQ()]);
  const [activeId, setActiveId] = useState(() => quotes[0].id);

  /* Parties */
  const [customer,  setCustomer]  = useState<PartyInfo>(blankParty());
  const [consignor, setConsignor] = useState<PartyInfo>(blankParty());
  const [consignee, setConsignee] = useState<PartyInfo>(blankParty());

  /* Route */
  const [pickup, setPickup]             = useState('');
  const [extraStops, setExtraStops]     = useState<string[]>([]);
  const [destination, setDestination]   = useState('');
  const [route, setRoute]               = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError]     = useState('');

  /* Map */
  const [mapStyle, setMapStyle] = useState<'osm' | 'sat'>('osm');

  /* Unit converter */
  const [convType, setConvType] = useState<'weight' | 'distance'>('weight');
  const [convA, setConvA]       = useState('');
  const [convB, setConvB]       = useState('');

  /* History save */
  const [saved, setSaved]         = useState(false);
  const [saveError, setSaveError] = useState('');

  const activeQuote = quotes.find(q => q.id === activeId) ?? quotes[0];
  const calc        = computeQuote(activeQuote, route);

  /* Quote helpers */
  const updateQuote = useCallback((patch: Partial<QuoteTab>) => {
    setQuotes(qs => qs.map(q => q.id === activeId ? { ...q, ...patch } : q));
  }, [activeId]);

  const addQuote = () => {
    const q = blankQ();
    setQuotes(qs => [...qs, q]);
    setActiveId(q.id);
  };
  const removeQuote = (id: string) => {
    setQuotes(qs => {
      const next = qs.filter(q => q.id !== id);
      if (!next.length) return qs;
      if (id === activeId) setActiveId(next[next.length - 1].id);
      return next;
    });
  };

  /* Accessorials */
  const addAcc    = () => updateQuote({ accessorials: [...activeQuote.accessorials, { id: newId(), amount: '', name: '' }] });
  const removeAcc = (id: string) => updateQuote({ accessorials: activeQuote.accessorials.filter(a => a.id !== id) });
  const updateAcc = (id: string, patch: Partial<AccessorialRow>) =>
    updateQuote({ accessorials: activeQuote.accessorials.map(a => a.id === id ? { ...a, ...patch } : a) });

  /* Route calculation */
  const calculateRoute = async () => {
    const addrs = [pickup, ...extraStops.filter(Boolean), destination].filter(Boolean);
    if (addrs.length < 2) { setRouteError('Enter at least a pickup and destination.'); return; }
    setRouteLoading(true);
    setRouteError('');
    try {
      const coords = await Promise.all(addrs.map(geocode));
      setRoute(await fetchRoute(coords));
    } catch (e: any) {
      setRouteError(e.message || 'Route calculation failed.');
    } finally {
      setRouteLoading(false);
    }
  };

  /* Unit converter */
  const handleConvA = (v: string) => {
    setConvA(v);
    const x = parseFloat(v);
    if (isNaN(x)) { setConvB(''); return; }
    setConvB(convType === 'weight' ? (x * 0.453592).toFixed(3) : (x * 1.60934).toFixed(3));
  };
  const handleConvB = (v: string) => {
    setConvB(v);
    const x = parseFloat(v);
    if (isNaN(x)) { setConvA(''); return; }
    setConvA(convType === 'weight' ? (x * 2.20462).toFixed(3) : (x * 0.621371).toFixed(3));
  };
  useEffect(() => { setConvA(''); setConvB(''); }, [convType]);

  /* Save to history */
  const saveToHistory = async () => {
    if (!token) return;
    setSaveError('');
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
    try {
      const res = await fetch(`${BACKEND_URL}/api/history/freight-quote`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:          `${activeQuote.label}${pickup && destination ? ` — ${pickup} to ${destination}` : ''}`,
          customer_name:  customer.company || customer.contact || undefined,
          consignor:      consignor.company || undefined,
          consignee:      consignee.company || undefined,
          origin:         pickup || undefined,
          destination:    destination || undefined,
          distance_miles: route ? parseFloat(route.distanceMiles.toFixed(2)) : undefined,
          distance_km:    route ? parseFloat(route.distanceKm.toFixed(2)) : undefined,
          rate_per_mile:  n(activeQuote.ratePerMile) || undefined,
          fuel_surcharge: n(activeQuote.fuelSurcharge) || undefined,
          rate_per_stop:  n(activeQuote.ratePerStop) || undefined,
          ftl_ltl_pct:    n(activeQuote.ftlLtl),
          margin_pct:     n(activeQuote.margin),
          accessorials:   activeQuote.accessorials.filter(a => a.amount || a.name),
          total_quote:    parseFloat(calc.total.toFixed(2)),
        }),
      });
      if (res.status === 402) { setSaveError('upgrade'); return; }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveError(parseApiError(err));
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError('Network error. Please try again.');
    }
  };

  /* Shared input styles */
  const inp  = 'w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500 bg-white text-gray-900';
  const lbl  = 'block text-xs font-semibold text-gray-600 mb-1';
  const prefixInp = (key: keyof QuoteTab, placeholder = '0.00') => (
    <div className="flex items-center border border-gray-300 rounded overflow-hidden bg-white focus-within:ring-1 focus-within:ring-red-500">
      <span className="px-2 text-xs text-gray-400 border-r border-gray-200 bg-gray-50">$</span>
      <input
        type="number" min="0" step="0.01"
        value={(activeQuote as any)[key]}
        onChange={e => updateQuote({ [key]: e.target.value } as any)}
        placeholder={placeholder}
        className="flex-1 px-2 py-1.5 text-sm focus:outline-none min-w-0"
      />
    </div>
  );

  const partyFields = (label: string, val: PartyInfo, set: React.Dispatch<React.SetStateAction<PartyInfo>>, Icon: React.ElementType) => (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-3 pb-1 border-b border-gray-100">
        <Icon className="w-3.5 h-3.5 text-red-500" /> {label}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { f: 'company',  ph: 'Company name',   full: true  },
          { f: 'contact',  ph: 'Contact person',  full: false },
          { f: 'phone',    ph: 'Phone',           full: false },
          { f: 'email',    ph: 'Email',           full: false },
          { f: 'address',  ph: 'Street address',  full: true  },
          { f: 'city',     ph: 'City',            full: false },
          { f: 'state',    ph: 'State/Province',  full: false },
        ].map(({ f, ph, full }) => (
          <input
            key={f}
            type={f === 'email' ? 'email' : 'text'}
            placeholder={ph}
            value={(val as any)[f]}
            onChange={e => set(v => ({ ...v, [f]: e.target.value }))}
            className={`${inp} ${full ? 'col-span-2' : ''}`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-20 sm:pt-28 pb-16 px-4 bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <BackToTools />

        {/* ── Tab bar ──────────────────────────────────────────────── */}
        <div className="flex items-center bg-white border border-b-0 border-gray-200 rounded-t-xl px-2 h-10 gap-1 mt-4">
          {quotes.map(q => (
            <button
              key={q.id}
              onClick={() => setActiveId(q.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-sm font-medium transition-colors ${
                q.id === activeId ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="text-xs">📄</span>
              {q.label}
              {quotes.length > 1 && (
                <span role="button" onClick={e => { e.stopPropagation(); removeQuote(q.id); }} className="ml-1 opacity-70 hover:opacity-100">
                  <X className="w-3 h-3" />
                </span>
              )}
            </button>
          ))}
          <button
            onClick={addQuote}
            className="ml-1 flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded border border-dashed border-gray-300"
          >
            <Plus className="w-3.5 h-3.5" /> New Quote
          </button>
        </div>

        {/* ── Main: left panel + map ───────────────────────────────── */}
        <div className="flex border border-gray-200 bg-white">

          {/* Left panel — no scroll */}
          <div className="w-64 shrink-0 flex flex-col border-r border-gray-200">
            <div className="p-3 space-y-3">
              <div className="flex items-center gap-1.5 text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">
                <DollarSign className="w-4 h-4 text-red-600" /> Quote Calculator
              </div>

              {([
                ['Rate per Mile',   'ratePerMile'],
                ['Fuel Surcharge',  'fuelSurcharge'],
                ['Rate per Stop',   'ratePerStop'],
                ['Rate per Lbs',    'ratePerLbs'],
              ] as [string, keyof QuoteTab][]).map(([label, key]) => (
                <div key={key}>
                  <label className={lbl}>{label}</label>
                  {prefixInp(key)}
                </div>
              ))}

              {/* FTL/LTL */}
              <div>
                <label className={lbl}>FTL/LTL (%)</label>
                <div className="flex items-center border border-gray-300 rounded overflow-hidden focus-within:ring-1 focus-within:ring-red-500">
                  <input
                    type="number" min="0" max="100"
                    value={activeQuote.ftlLtl}
                    onChange={e => updateQuote({ ftlLtl: e.target.value })}
                    className="flex-1 px-2 py-1.5 text-sm focus:outline-none"
                  />
                  <span className="px-2 text-xs text-gray-400 border-l border-gray-200 bg-gray-50">%</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">0% = LTL &nbsp;·&nbsp; 100% = FTL</p>
              </div>

              {/* Accessorials */}
              <div>
                <label className={lbl}>Accessorial Charges</label>
                <div className="space-y-1.5">
                  {activeQuote.accessorials.map(a => (
                    <div key={a.id} className="flex gap-1">
                      <div className="flex items-center border border-gray-300 rounded overflow-hidden w-20 shrink-0">
                        <span className="px-1 text-xs text-gray-400 border-r border-gray-200 bg-gray-50">$</span>
                        <input type="number" min="0" value={a.amount}
                          onChange={e => updateAcc(a.id, { amount: e.target.value })}
                          placeholder="0.00" className="flex-1 px-1 py-1 text-xs focus:outline-none w-0" />
                      </div>
                      <input type="text" value={a.name}
                        onChange={e => updateAcc(a.id, { name: e.target.value })}
                        placeholder="Name"
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500" />
                      <button onClick={() => removeAcc(a.id)} className="text-gray-400 hover:text-red-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button onClick={addAcc} className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Accessorial
                  </button>
                </div>
              </div>

              {/* Margin */}
              <div>
                <label className={lbl}>Margin (%)</label>
                <div className="flex items-center border border-gray-300 rounded overflow-hidden focus-within:ring-1 focus-within:ring-red-500">
                  <input type="number" min="0" value={activeQuote.margin}
                    onChange={e => updateQuote({ margin: e.target.value })}
                    placeholder="0" className="flex-1 px-2 py-1.5 text-sm focus:outline-none" />
                  <span className="px-2 text-xs text-gray-400 border-l border-gray-200 bg-gray-50">%</span>
                </div>
              </div>
            </div>

            {/* Total Quote */}
            <div className="mt-auto bg-gradient-to-b from-red-600 to-red-800 text-white p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wide opacity-80">Total Quote</span>
                <button onClick={() => navigator.clipboard?.writeText(calc.total.toFixed(2))} title="Copy total" className="opacity-60 hover:opacity-100">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-3xl font-black mb-3">{fmt(calc.total)}</div>
              <div className="text-[11px] space-y-0.5 opacity-90 border-t border-white/20 pt-2">
                <div className="flex justify-between"><span>Base Rate ({calc.mi.toFixed(0)} mi × {fmt(n(activeQuote.ratePerMile))}/mi)</span><span>{fmt(calc.base)}</span></div>
                <div className="flex justify-between"><span>+ Fuel Surcharge</span><span>{fmt(calc.fuel)}</span></div>
                <div className="flex justify-between"><span>+ Stops ({calc.stops} × {fmt(n(activeQuote.ratePerStop))})</span><span>{fmt(calc.stopsAmt)}</span></div>
                <div className="flex justify-between"><span>+ Accessorials</span><span>{fmt(calc.acc)}</span></div>
                <div className="flex justify-between font-bold border-t border-white/20 pt-1 mt-1"><span>Subtotal</span><span>{fmt(calc.sub)}</span></div>
                <div className="flex justify-between"><span>× {n(activeQuote.ftlLtl)}% (FTL)</span><span>{fmt(calc.ftl)}</span></div>
                <div className="flex justify-between"><span>+ Margin ({n(activeQuote.margin)}%)</span><span>{fmt(calc.margin)}</span></div>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                <button
                  onClick={() => exportPDF(activeQuote, route, calc, customer, consignor, consignee, pickup, destination)}
                  className="w-full flex items-center justify-center gap-2 bg-white text-red-700 font-bold text-xs py-2 rounded hover:bg-red-50 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Export PDF Quote
                </button>
                <button
                  onClick={saveToHistory}
                  className={`w-full flex items-center justify-center gap-2 font-bold text-xs py-2 rounded transition-colors border ${
                    saved
                      ? 'bg-green-500/20 text-green-300 border-green-400/30'
                      : !isPaidUser(user)
                        ? 'bg-white/10 text-white/70 border-white/20'
                        : 'bg-white/15 text-white border-white/30 hover:bg-white/25'
                  }`}
                >
                  {saved ? <CheckCircle className="w-3.5 h-3.5" /> : !isPaidUser(user) ? <Lock className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  {saved ? 'Saved!' : !isPaidUser(user) ? 'Pro Required to Save' : 'Save to History'}
                </button>
                {saveError && <p className="text-[10px] text-red-200">{saveError}</p>}
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="flex-1 relative" style={{ minHeight: '620px' }}>
            {/* Map/Satellite toggle */}
            <div className="absolute top-3 right-3 z-[1000] flex overflow-hidden rounded border border-gray-300 shadow-sm">
              {(['osm', 'sat'] as const).map(s => (
                <button key={s} onClick={() => setMapStyle(s)}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors ${mapStyle === s ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
                  {s === 'osm' ? 'Map' : 'Satellite'}
                </button>
              ))}
            </div>

            <MapContainer center={[48, -96]} zoom={3} style={{ height: '100%', width: '100%', minHeight: '620px' }} zoomControl>
              <TileLayer
                key={mapStyle}
                url={mapStyle === 'osm'
                  ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                  : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'}
                attribution={mapStyle === 'osm'
                  ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  : '&copy; Esri &mdash; Esri, i-cubed, USDA, USGS'}
              />
              {route && route.polyline.length > 1 && (
                <>
                  <Polyline positions={route.polyline} pathOptions={{ color: '#dc2626', weight: 4, opacity: 0.9 }} />
                  {route.markers.map((pos, i) => <Marker key={i} position={pos} />)}
                  <FitBounds positions={route.polyline} />
                </>
              )}
              {!route && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 400 }}>
                  <div className="text-center text-gray-500 bg-white/80 rounded-xl px-6 py-4 shadow-md">
                    <div className="text-4xl mb-2">🗺️</div>
                    <p className="font-semibold text-sm">No route calculated</p>
                    <p className="text-xs mt-1 text-gray-400">Enter locations below to view route</p>
                  </div>
                </div>
              )}
            </MapContainer>
          </div>
        </div>

        {/* ── Customer / Consignor / Consignee ─────────────────────── */}
        <div className="border border-t-0 border-gray-200 bg-white p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {partyFields('Customer', customer, setCustomer, User)}
            {partyFields('Consignor / Shipper', consignor, setConsignor, Building2)}
            {partyFields('Consignee / Receiver', consignee, setConsignee, Building2)}
          </div>
        </div>

        {/* ── Bottom: unit converter + route calculator ────────────── */}
        <div className="flex border border-t-0 border-gray-200 bg-white rounded-b-xl overflow-hidden">

          {/* Unit Converter */}
          <div className="w-1/2 p-4 border-r border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                <ArrowLeftRight className="w-4 h-4 text-red-600" /> Unit Converter
              </div>
              <select value={convType} onChange={e => setConvType(e.target.value as any)}
                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-red-500">
                <option value="weight">Weight</option>
                <option value="distance">Distance</option>
              </select>
            </div>
            <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center mb-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1">{convType === 'weight' ? 'Pounds (lbs)' : 'Miles (mi)'}</label>
                <input type="number" value={convA} onChange={e => handleConvA(e.target.value)}
                  placeholder={convType === 'weight' ? 'Enter lbs' : 'Enter miles'} className={inp} />
              </div>
              <button onClick={() => { const t = convA; setConvA(convB); setConvB(t); }} className="text-gray-400 hover:text-red-600 mt-5">
                <ArrowLeftRight className="w-4 h-4" />
              </button>
              <div>
                <label className="text-xs text-gray-500 block mb-1">{convType === 'weight' ? 'Kilograms (kg)' : 'Kilometers (km)'}</label>
                <input type="number" value={convB} onChange={e => handleConvB(e.target.value)}
                  placeholder={convType === 'weight' ? 'Enter kg' : 'Enter km'} className={inp} />
              </div>
            </div>
            <p className="text-[11px] text-gray-400">
              {convType === 'weight' ? '1 lb = 0.454 kg  ·  1 kg = 2.205 lbs' : '1 mi = 1.609 km  ·  1 km = 0.621 mi'}
            </p>
          </div>

          {/* Route Calculator */}
          <div className="w-1/2 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
              <Navigation className="w-4 h-4 text-red-600" /> Route Calculator
            </div>
            <div className="space-y-2 mb-3">
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-green-500" />
                <input type="text" value={pickup} onChange={e => setPickup(e.target.value)}
                  placeholder="Pickup location (city, state/province)"
                  className={`${inp} pl-7`} />
              </div>
              {extraStops.map((stop, i) => (
                <div key={i} className="flex gap-1">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-yellow-500" />
                    <input type="text" value={stop}
                      onChange={e => setExtraStops(s => s.map((v, j) => j === i ? e.target.value : v))}
                      placeholder="Stop (optional)" className={`${inp} pl-7`} />
                  </div>
                  <button onClick={() => setExtraStops(s => s.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-1">
                <div className="relative flex-1">
                  <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-red-500" />
                  <input type="text" value={destination} onChange={e => setDestination(e.target.value)}
                    placeholder="Destination (city, state/province)"
                    className={`${inp} pl-7`} />
                </div>
                <button onClick={() => setExtraStops(s => [...s, ''])} title="Add stop"
                  className="px-2.5 bg-red-600 text-white rounded hover:bg-red-700">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            {routeError && <p className="text-xs text-red-500 mb-2">{routeError}</p>}
            {route && (
              <p className="text-xs text-green-600 mb-2 font-medium">
                ✓ {route.distanceMiles.toFixed(1)} mi · {route.distanceKm.toFixed(1)} km · ~{Math.floor(route.durationMin / 60)}h {Math.round(route.durationMin % 60)}m drive time
              </p>
            )}
            <button onClick={calculateRoute} disabled={routeLoading}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 rounded transition-colors disabled:opacity-60">
              {routeLoading
                ? <><RotateCcw className="w-4 h-4 animate-spin" /> Calculating...</>
                : <><Navigation className="w-4 h-4" /> Calculate Route</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FreightCalculatorPage;
