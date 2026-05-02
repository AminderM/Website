import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Plus, X, Printer, RotateCcw, ArrowLeftRight, MapPin, Navigation,
  DollarSign, Copy,
} from 'lucide-react';
import BackToTools from '../components/BackToTools';

/* ── Fix Leaflet default marker icons (webpack strips them) ──────────── */
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
  id: string;
  label: string;
  ratePerMile: string;
  fuelSurcharge: string;
  ratePerStop: string;
  ratePerLbs: string;
  ftlLtl: string;
  accessorials: AccessorialRow[];
  margin: string;
}
interface RouteInfo {
  distanceMiles: number;
  distanceKm: number;
  durationMin: number;
  numStops: number;
  polyline: [number, number][];
  markers: [number, number][];
}

/* ── Helpers ─────────────────────────────────────────────────────────── */
let _qid = 1;
const newId = () => String(_qid++);

const blankQuote = (): QuoteTab => ({
  id: newId(),
  label: `Quote ${_qid - 1}`,
  ratePerMile: '',
  fuelSurcharge: '',
  ratePerStop: '',
  ratePerLbs: '',
  ftlLtl: '100',
  accessorials: [],
  margin: '',
});

const n = (v: string) => parseFloat(v) || 0;

function computeQuote(q: QuoteTab, route: RouteInfo | null) {
  const mi      = route?.distanceMiles ?? 0;
  const stops   = route?.numStops ?? 0;
  const base    = mi * n(q.ratePerMile);
  const fuel    = n(q.fuelSurcharge);
  const stopsAmt = stops * n(q.ratePerStop);
  const acc     = q.accessorials.reduce((s, a) => s + n(a.amount), 0);
  const sub     = base + fuel + stopsAmt + acc;
  const ftl     = sub * (n(q.ftlLtl) / 100);
  const margin  = ftl * (n(q.margin) / 100);
  const total   = ftl + margin;
  return { base, fuel, stopsAmt, acc, sub, ftl, margin, total, mi, stops };
}

const fmt = (v: number) =>
  '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function geocode(address: string): Promise<[number, number]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=ca,us`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  if (!data.length) throw new Error(`Could not find "${address}"`);
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

async function fetchRoute(waypoints: [number, number][]): Promise<RouteInfo> {
  const coords = waypoints.map(([lat, lon]) => `${lon},${lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('Route not found');
  const route = data.routes[0];
  const poly: [number, number][] = route.geometry.coordinates.map(
    ([lon, lat]: [number, number]) => [lat, lon]
  );
  const distanceKm   = route.distance / 1000;
  const distanceMiles = distanceKm * 0.621371;
  const durationMin  = route.duration / 60;
  return {
    distanceMiles,
    distanceKm,
    durationMin,
    numStops: waypoints.length - 2,
    polyline: poly,
    markers: waypoints,
  };
}

/* ── Map fit helper ──────────────────────────────────────────────────── */
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] });
    }
  }, [map, positions]);
  return null;
}

/* ── PDF export ──────────────────────────────────────────────────────── */
function exportPDF(q: QuoteTab, route: RouteInfo | null, c: ReturnType<typeof computeQuote>) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <title>${q.label} — Freight Quote</title>
  <style>
    body{font-family:Arial,sans-serif;padding:40px;color:#111;max-width:700px;margin:0 auto}
    h1{color:#dc2626;border-bottom:2px solid #dc2626;padding-bottom:8px;margin-bottom:24px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}
    .field label{font-size:11px;font-weight:600;text-transform:uppercase;color:#666;display:block;margin-bottom:2px}
    .field span{font-size:14px}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    td,th{padding:10px 12px;text-align:left;border-bottom:1px solid #eee}
    th{background:#f5f5f5;font-size:12px;font-weight:700;text-transform:uppercase}
    .total-row td{font-weight:700;font-size:18px;color:#dc2626;border-top:2px solid #dc2626}
    .disclaimer{margin-top:24px;font-size:11px;color:#888;border-top:1px solid #eee;padding-top:12px}
    @media print{body{padding:20px}}
  </style></head><body>
  <h1>Freight Quote — ${q.label}</h1>
  ${route ? `
  <div class="grid">
    <div class="field"><label>Distance</label><span>${c.mi.toFixed(1)} miles (${route.distanceKm.toFixed(1)} km)</span></div>
    <div class="field"><label>Duration</label><span>~${Math.round(route.durationMin / 60)}h ${Math.round(route.durationMin % 60)}m drive time</span></div>
  </div>` : ''}
  <table>
    <tr><th>Item</th><th>Details</th><th>Amount</th></tr>
    <tr><td>Base Rate</td><td>${c.mi.toFixed(1)} mi × ${fmt(n(q.ratePerMile))}/mi</td><td>${fmt(c.base)}</td></tr>
    <tr><td>Fuel Surcharge</td><td>Flat</td><td>${fmt(c.fuel)}</td></tr>
    <tr><td>Stops</td><td>${c.stops} × ${fmt(n(q.ratePerStop))}/stop</td><td>${fmt(c.stopsAmt)}</td></tr>
    ${q.accessorials.map(a => `<tr><td>Accessorial</td><td>${a.name || '—'}</td><td>${fmt(n(a.amount))}</td></tr>`).join('')}
    <tr><td><strong>Subtotal</strong></td><td></td><td><strong>${fmt(c.sub)}</strong></td></tr>
    <tr><td>FTL/LTL</td><td>${n(q.ftlLtl)}%</td><td>${fmt(c.ftl)}</td></tr>
    <tr><td>Margin</td><td>${n(q.margin)}%</td><td>${fmt(c.margin)}</td></tr>
    <tr class="total-row"><td colspan="2">TOTAL</td><td>${fmt(c.total)}</td></tr>
  </table>
  <p class="disclaimer">This is an estimate only. Actual charges may vary. Generated by Integra AI Supply Chain.</p>
  </body></html>`;
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

/* ── Main component ──────────────────────────────────────────────────── */
const FreightCalculatorPage: React.FC = () => {
  const [quotes, setQuotes]     = useState<QuoteTab[]>([blankQuote()]);
  const [activeId, setActiveId] = useState<string>(() => quotes[0].id);
  const [route, setRoute]       = useState<RouteInfo | null>(null);
  const [mapStyle, setMapStyle] = useState<'osm' | 'sat'>('osm');

  /* Route form */
  const [pickup, setPickup]           = useState('');
  const [extraStops, setExtraStops]   = useState<string[]>([]);
  const [destination, setDestination] = useState('');
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError]   = useState('');

  /* Unit converter */
  const [convType, setConvType]   = useState<'weight' | 'distance'>('weight');
  const [convA, setConvA]         = useState('');
  const [convB, setConvB]         = useState('');

  const activeQuote = quotes.find(q => q.id === activeId) ?? quotes[0];
  const calc = computeQuote(activeQuote, route);

  /* Quote updater */
  const updateQuote = useCallback((patch: Partial<QuoteTab>) => {
    setQuotes(qs => qs.map(q => q.id === activeId ? { ...q, ...patch } : q));
  }, [activeId]);

  /* Tabs */
  const addQuote = () => {
    const q = blankQuote();
    setQuotes(qs => [...qs, q]);
    setActiveId(q.id);
  };
  const removeQuote = (id: string) => {
    setQuotes(qs => {
      const next = qs.filter(q => q.id !== id);
      if (next.length === 0) return qs;
      if (id === activeId) setActiveId(next[next.length - 1].id);
      return next;
    });
  };

  /* Route calculation */
  const calculateRoute = async () => {
    const addrs = [pickup, ...extraStops.filter(Boolean), destination].filter(Boolean);
    if (addrs.length < 2) { setRouteError('Enter at least pickup and destination.'); return; }
    setRouteLoading(true);
    setRouteError('');
    try {
      const coords = await Promise.all(addrs.map(geocode));
      const info   = await fetchRoute(coords);
      setRoute(info);
    } catch (e: any) {
      setRouteError(e.message || 'Route calculation failed.');
    } finally {
      setRouteLoading(false);
    }
  };

  /* Unit converter logic */
  const handleConvA = (v: string) => {
    setConvA(v);
    const num = parseFloat(v);
    if (isNaN(num)) { setConvB(''); return; }
    if (convType === 'weight') setConvB((num * 0.453592).toFixed(3));
    else setConvB((num * 1.60934).toFixed(3));
  };
  const handleConvB = (v: string) => {
    setConvB(v);
    const num = parseFloat(v);
    if (isNaN(num)) { setConvA(''); return; }
    if (convType === 'weight') setConvA((num * 2.20462).toFixed(3));
    else setConvA((num * 0.621371).toFixed(3));
  };
  const swapConv = () => {
    setConvA(convB);
    setConvB(convA);
  };
  useEffect(() => { setConvA(''); setConvB(''); }, [convType]);

  /* Accessorials */
  const addAcc = () => updateQuote({ accessorials: [...activeQuote.accessorials, { id: newId(), amount: '', name: '' }] });
  const removeAcc = (id: string) => updateQuote({ accessorials: activeQuote.accessorials.filter(a => a.id !== id) });
  const updateAcc = (id: string, patch: Partial<AccessorialRow>) =>
    updateQuote({ accessorials: activeQuote.accessorials.map(a => a.id === id ? { ...a, ...patch } : a) });

  /* Shared styles */
  const inputCls = 'w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500 bg-white text-gray-900';
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

  return (
    <div className="min-h-screen pt-20 sm:pt-28 pb-16 px-4 bg-gray-100">
      <div className="max-w-6xl mx-auto">

      <BackToTools />

      {/* ── Tab bar ─────────────────────────────────────────────── */}
      <div className="flex items-center bg-white border border-gray-200 rounded-t-xl px-2 h-10 gap-1 mt-4">
        {quotes.map(q => (
          <button
            key={q.id}
            onClick={() => setActiveId(q.id)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-sm font-medium transition-colors ${
              q.id === activeId
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="text-xs">📄</span>
            {q.label}
            {quotes.length > 1 && (
              <span
                role="button"
                onClick={e => { e.stopPropagation(); removeQuote(q.id); }}
                className="ml-1 opacity-70 hover:opacity-100"
              >
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

      {/* ── Main row (calculator + map) ──────────────────────────── */}
      <div className="flex border-x border-gray-200 bg-white" style={{ height: '480px' }}>

        {/* Left panel */}
        <div className="w-56 shrink-0 flex flex-col border-r border-gray-200 overflow-hidden">

          {/* Quote calculator inputs — scrollable */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">
              <DollarSign className="w-4 h-4 text-red-600" /> Quote Calculator
            </div>

            {[
              { label: 'Rate per Mile', key: 'ratePerMile', prefix: '$' },
              { label: 'Fuel Surcharge', key: 'fuelSurcharge', prefix: '$' },
              { label: 'Rate per Stop', key: 'ratePerStop', prefix: '$' },
              { label: 'Rate per Lbs', key: 'ratePerLbs', prefix: '$' },
            ].map(({ label, key, prefix }) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <div className="flex items-center border border-gray-300 rounded overflow-hidden bg-white focus-within:ring-1 focus-within:ring-red-500">
                  <span className="px-2 text-xs text-gray-500 border-r border-gray-300 bg-gray-50">{prefix}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={(activeQuote as any)[key]}
                    onChange={e => updateQuote({ [key]: e.target.value } as any)}
                    placeholder="0.00"
                    className="flex-1 px-2 py-1.5 text-sm focus:outline-none"
                  />
                </div>
              </div>
            ))}

            {/* FTL/LTL */}
            <div>
              <label className={labelCls}>FTL/LTL (%)</label>
              <div className="flex items-center border border-gray-300 rounded overflow-hidden focus-within:ring-1 focus-within:ring-red-500">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={activeQuote.ftlLtl}
                  onChange={e => updateQuote({ ftlLtl: e.target.value })}
                  className="flex-1 px-2 py-1.5 text-sm focus:outline-none"
                />
                <span className="px-2 text-xs text-gray-500 border-l border-gray-300 bg-gray-50">%</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">0% = LTL · 100% = FTL</p>
            </div>

            {/* Accessorials */}
            <div>
              <label className={labelCls}>Accessorial Charges</label>
              <div className="space-y-1.5">
                {activeQuote.accessorials.map(a => (
                  <div key={a.id} className="flex gap-1">
                    <div className="flex items-center border border-gray-300 rounded overflow-hidden w-20 shrink-0">
                      <span className="px-1 text-xs text-gray-500 border-r border-gray-300 bg-gray-50">$</span>
                      <input
                        type="number"
                        min="0"
                        value={a.amount}
                        onChange={e => updateAcc(a.id, { amount: e.target.value })}
                        placeholder="0.00"
                        className="flex-1 px-1 py-1 text-xs focus:outline-none w-0"
                      />
                    </div>
                    <input
                      type="text"
                      value={a.name}
                      onChange={e => updateAcc(a.id, { name: e.target.value })}
                      placeholder="Name"
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <button onClick={() => removeAcc(a.id)} className="text-gray-400 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addAcc}
                  className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Accessorial
                </button>
              </div>
            </div>

            {/* Margin */}
            <div>
              <label className={labelCls}>Margin (%)</label>
              <div className="flex items-center border border-gray-300 rounded overflow-hidden focus-within:ring-1 focus-within:ring-red-500">
                <input
                  type="number"
                  min="0"
                  value={activeQuote.margin}
                  onChange={e => updateQuote({ margin: e.target.value })}
                  placeholder="0"
                  className="flex-1 px-2 py-1.5 text-sm focus:outline-none"
                />
                <span className="px-2 text-xs text-gray-500 border-l border-gray-300 bg-gray-50">%</span>
              </div>
            </div>
          </div>

          {/* Total Quote panel */}
          <div className="shrink-0 bg-gradient-to-b from-red-600 to-red-800 text-white p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wide opacity-80">Total Quote</span>
              <button
                onClick={() => navigator.clipboard?.writeText(calc.total.toFixed(2))}
                title="Copy total"
                className="opacity-60 hover:opacity-100 transition-opacity"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-3xl font-black mb-3">{fmt(calc.total)}</div>
            <div className="text-[11px] space-y-0.5 opacity-90 border-t border-white/20 pt-2">
              <div className="flex justify-between">
                <span>Base Rate ({calc.mi.toFixed(0)} mi × {fmt(n(activeQuote.ratePerMile))}/mi)</span>
                <span>{fmt(calc.base)}</span>
              </div>
              <div className="flex justify-between">
                <span>+ Fuel Surcharge</span>
                <span>{fmt(calc.fuel)}</span>
              </div>
              <div className="flex justify-between">
                <span>+ Stops ({calc.stops} × {fmt(n(activeQuote.ratePerStop))})</span>
                <span>{fmt(calc.stopsAmt)}</span>
              </div>
              <div className="flex justify-between">
                <span>+ Accessorials</span>
                <span>{fmt(calc.acc)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-white/20 pt-1 mt-1">
                <span>Subtotal</span>
                <span>{fmt(calc.sub)}</span>
              </div>
              <div className="flex justify-between">
                <span>× {n(activeQuote.ftlLtl)}% (FTL)</span>
                <span>{fmt(calc.ftl)}</span>
              </div>
              <div className="flex justify-between">
                <span>+ Margin ({n(activeQuote.margin)}%)</span>
                <span>{fmt(calc.margin)}</span>
              </div>
            </div>
            <button
              onClick={() => exportPDF(activeQuote, route, calc)}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-white text-red-700 font-bold text-xs py-2 rounded hover:bg-red-50 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Export PDF Quote
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          {/* Map/Satellite toggle */}
          <div className="absolute top-3 right-3 z-[1000] flex overflow-hidden rounded border border-gray-300 shadow">
            {(['osm', 'sat'] as const).map(s => (
              <button
                key={s}
                onClick={() => setMapStyle(s)}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  mapStyle === s ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {s === 'osm' ? 'Map' : 'Satellite'}
              </button>
            ))}
          </div>

          <MapContainer
            center={[56, -96]}
            zoom={4}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              key={mapStyle}
              url={
                mapStyle === 'osm'
                  ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                  : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
              }
              attribution={
                mapStyle === 'osm'
                  ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  : '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX'
              }
            />
            {route && route.polyline.length > 1 && (
              <>
                <Polyline
                  positions={route.polyline}
                  pathOptions={{ color: '#dc2626', weight: 4, opacity: 0.85 }}
                />
                {route.markers.map((pos, i) => (
                  <Marker key={i} position={pos} />
                ))}
                <FitBounds positions={route.polyline} />
              </>
            )}
            {!route && (
              <div
                className="leaflet-top leaflet-center"
                style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 400 }}
              >
                <div className="text-center text-gray-500 bg-white/80 rounded-xl px-6 py-4 shadow">
                  <div className="text-4xl mb-2">🗺️</div>
                  <p className="font-semibold text-sm">No route calculated</p>
                  <p className="text-xs mt-1">Enter locations below to view route</p>
                </div>
              </div>
            )}
          </MapContainer>
        </div>
      </div>

      {/* ── Bottom row (unit converter + route calculator) ───────── */}
      <div className="flex border border-t-0 border-gray-200 bg-white rounded-b-xl overflow-hidden" style={{ height: '200px' }}>

        {/* Unit Converter */}
        <div className="w-1/2 p-4 border-r border-gray-200 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <ArrowLeftRight className="w-4 h-4 text-red-600" /> Unit Converter
            </div>
            <select
              value={convType}
              onChange={e => setConvType(e.target.value as any)}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="weight">Weight</option>
              <option value="distance">Distance</option>
            </select>
          </div>
          <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center mb-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                {convType === 'weight' ? 'Pounds (lbs)' : 'Miles (mi)'}
              </label>
              <input
                type="number"
                value={convA}
                onChange={e => handleConvA(e.target.value)}
                placeholder={convType === 'weight' ? 'Enter lbs' : 'Enter miles'}
                className={inputCls}
              />
            </div>
            <button onClick={swapConv} className="text-gray-400 hover:text-red-600 mt-5">
              <ArrowLeftRight className="w-4 h-4" />
            </button>
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                {convType === 'weight' ? 'Kilograms (kg)' : 'Kilometers (km)'}
              </label>
              <input
                type="number"
                value={convB}
                onChange={e => handleConvB(e.target.value)}
                placeholder={convType === 'weight' ? 'Enter kg' : 'Enter km'}
                className={inputCls}
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-400">
            {convType === 'weight'
              ? 'Quick Reference: 1 lb: 0.454 kg  ·  1 kg: 2.205 lbs'
              : 'Quick Reference: 1 mi: 1.609 km  ·  1 km: 0.621 mi'}
          </p>
        </div>

        {/* Route Calculator */}
        <div className="w-1/2 p-4 overflow-y-auto">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
            <Navigation className="w-4 h-4 text-red-600" /> Route Calculator
          </div>
          <div className="space-y-2 mb-3">
            <div className="relative">
              <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-green-500" />
              <input
                type="text"
                value={pickup}
                onChange={e => setPickup(e.target.value)}
                placeholder="Pickup location"
                className={`${inputCls} pl-7`}
              />
            </div>
            {extraStops.map((stop, i) => (
              <div key={i} className="flex gap-1">
                <div className="relative flex-1">
                  <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-yellow-500" />
                  <input
                    type="text"
                    value={stop}
                    onChange={e => setExtraStops(s => s.map((v, j) => j === i ? e.target.value : v))}
                    placeholder="Add stop (optional)"
                    className={`${inputCls} pl-7`}
                  />
                </div>
                <button
                  onClick={() => setExtraStops(s => s.filter((_, j) => j !== i))}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-1">
              <div className="relative flex-1">
                <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-red-500" />
                <input
                  type="text"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  placeholder="Destination"
                  className={`${inputCls} pl-7`}
                />
              </div>
              <button
                onClick={() => setExtraStops(s => [...s, ''])}
                title="Add stop"
                className="px-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          {routeError && <p className="text-xs text-red-500 mb-2">{routeError}</p>}
          {route && (
            <p className="text-xs text-green-600 mb-2 font-medium">
              ✓ {route.distanceMiles.toFixed(1)} mi · {route.distanceKm.toFixed(1)} km · ~{Math.round(route.durationMin / 60)}h {Math.round(route.durationMin % 60)}m
            </p>
          )}
          <button
            onClick={calculateRoute}
            disabled={routeLoading}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 rounded transition-colors disabled:opacity-60"
          >
            {routeLoading
              ? <><RotateCcw className="w-4 h-4 animate-spin" /> Calculating...</>
              : <><Navigation className="w-4 h-4" /> Calculate</>}
          </button>
        </div>
      </div>

      </div>{/* end max-w-6xl */}
    </div>
  );
};

export default FreightCalculatorPage;
