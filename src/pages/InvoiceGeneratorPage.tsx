import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText, Upload, Wand2, Plus, Trash2, CheckCircle,
  Printer, Copy, AlertCircle, Receipt, ChevronDown, ChevronUp
} from 'lucide-react';
import { isPaidUser } from '../types/auth';
import { parseApiError } from '../utils/apiFetch';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'linehaul',       label: 'Linehaul',       color: '#3b82f6' },
  { id: 'fuel_surcharge', label: 'Fuel Surcharge', color: '#f59e0b' },
  { id: 'detention',      label: 'Detention',      color: '#ef4444' },
  { id: 'lumper',         label: 'Lumper',         color: '#8b5cf6' },
  { id: 'accessorial',   label: 'Accessorial',    color: '#06b6d4' },
  { id: 'layover',        label: 'Layover',        color: '#f97316' },
  { id: 'tonu',           label: 'TONU',           color: '#ec4899' },
  { id: 'stop_off',       label: 'Stop-Off',       color: '#14b8a6' },
  { id: 'other',          label: 'Other',          color: '#6b7280' },
];

const DOC_TYPES = [
  { id: 'freight_invoice',   label: 'Freight Invoice' },
  { id: 'bol',               label: 'Bill of Lading' },
  { id: 'rate_confirmation', label: 'Rate Confirmation' },
  { id: 'fuel_surcharge',    label: 'Fuel Surcharge' },
  { id: 'lumper',            label: 'Lumper Receipt' },
  { id: 'detention',         label: 'Detention Notice' },
  { id: 'delivery_receipt',  label: 'Delivery Receipt' },
  { id: 'purchase_order',    label: 'Purchase Order' },
  { id: 'general_invoice',   label: 'General Invoice' },
];

const PAYMENT_TERMS = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt', 'COD'];

// ── Types ─────────────────────────────────────────────────────────────────────
interface LineItem {
  id: string;
  description: string;
  category: string;
  calculation: string;
  amount: number;
}

interface InvoiceData {
  documentType: string;
  logoBase64: string | null;
  vendor:  { name: string; address: string; city: string; state: string; zip: string; phone: string; email: string; mc: string; dot: string };
  billTo:  { name: string; address: string; city: string; state: string; zip: string; phone: string; email: string };
  invoice: { number: string; date: string; dueDate: string; poNumber: string; bolNumber: string; loadNumber: string };
  lineItems: LineItem[];
  totals: { taxRate: number; discountAmount: number };
  notes: string;
  paymentTerms: string;
  aiSuggestions: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const uid    = () => `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const r2     = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const fmtc   = (n: number) => `$${r2(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today  = () => new Date().toISOString().slice(0, 10);
const invNum = () => `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;

const blankItem = (): LineItem => ({
  id: uid(), description: '', category: 'other', calculation: '', amount: 0,
});

const blankInvoice = (): InvoiceData => ({
  documentType: 'freight_invoice',
  logoBase64:   null,
  vendor:  { name: '', address: '', city: '', state: '', zip: '', phone: '', email: '', mc: '', dot: '' },
  billTo:  { name: '', address: '', city: '', state: '', zip: '', phone: '', email: '' },
  invoice: { number: invNum(), date: today(), dueDate: '', poNumber: '', bolNumber: '', loadNumber: '' },
  lineItems:    [blankItem()],
  totals:       { taxRate: 0, discountAmount: 0 },
  notes:        '',
  paymentTerms: 'Net 30',
  aiSuggestions: [],
});

const getCatColor = (cat: string) => CATEGORIES.find(c => c.id === cat)?.color || '#6b7280';
const getDocLabel = (id: string) => DOC_TYPES.find(t => t.id === id)?.label || 'Invoice';

// ── Component ─────────────────────────────────────────────────────────────────
const InvoiceGeneratorPage: React.FC = () => {
  const { theme } = useTheme();
  const { token, user } = useAuth();
  const isDark = theme === 'dark';

  const [data, setData]               = useState<InvoiceData>(blankInvoice());
  const [aiText, setAiText]           = useState('');
  const [fileName, setFileName]       = useState('');
  const [aiLoading, setAiLoading]     = useState(false);
  const [aiError, setAiError]         = useState('');
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [aiOpen, setAiOpen]           = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [finalized, setFinalized]     = useState(false);
  const [savedHistory, setSavedHistory] = useState(false);
  const [saveError, setSaveError]     = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [copied, setCopied]           = useState(false);
  const [dragOver, setDragOver]       = useState(false);

  // Preview scaling (matches the 900px-wide preview doc)
  const previewRef  = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.45);

  useEffect(() => {
    if (!previewRef.current) return;
    const ob = new ResizeObserver(entries => {
      setPreviewScale(entries[0].contentRect.width / 900);
    });
    ob.observe(previewRef.current);
    return () => ob.disconnect();
  }, []);

  // ── Computed totals ─────────────────────────────────────────────────────────
  const subtotal       = data.lineItems.reduce((s, i) => s + r2(i.amount), 0);
  const taxAmount      = r2(subtotal * (data.totals.taxRate / 100));
  const discountAmount = r2(data.totals.discountAmount);
  const total          = r2(subtotal + taxAmount - discountAmount);

  // ── Setters ─────────────────────────────────────────────────────────────────
  const setVendor  = (k: string, v: string) => setData(d => ({ ...d, vendor:  { ...d.vendor,  [k]: v } }));
  const setBillTo  = (k: string, v: string) => setData(d => ({ ...d, billTo:  { ...d.billTo,  [k]: v } }));
  const setInvoice = (k: string, v: string) => setData(d => ({ ...d, invoice: { ...d.invoice, [k]: v } }));
  const setTotals  = (k: string, v: number) => setData(d => ({ ...d, totals:  { ...d.totals,  [k]: v } }));

  const updateItem = (id: string, k: string, v: any) =>
    setData(d => ({
      ...d,
      lineItems: d.lineItems.map(i => i.id !== id ? i : { ...i, [k]: v }),
    }));

  const addItem    = () => setData(d => ({ ...d, lineItems: [...d.lineItems, blankItem()] }));
  const removeItem = (id: string) => setData(d => ({ ...d, lineItems: d.lineItems.filter(i => i.id !== id) }));

  // ── Logo upload ─────────────────────────────────────────────────────────────
  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => setData(d => ({ ...d, logoBase64: (e.target?.result as string) ?? null }));
    reader.readAsDataURL(file);
  };

  // ── AI Parse ────────────────────────────────────────────────────────────────
  const handleAiParse = useCallback(async (fileBase64?: string, fileMimeType?: string) => {
    setAiLoading(true); setAiError(''); setAiConfidence(null);
    try {
      const body = fileBase64 ? { file: fileBase64, mimeType: fileMimeType } : { text: aiText };
      const res  = await fetch(`${BACKEND_URL}/api/invoice/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) throw new Error('Session expired. Please log in again.');
        if (res.status === 422) throw new Error('AI could not parse the document. Try pasting the text instead.');
        if (res.status === 502) throw new Error('AI service is temporarily unavailable. Please try again shortly.');
        throw new Error(json.detail || json.error || 'Parse failed');
      }
      const parsed = json.data;
      setAiConfidence(parsed.confidence ?? null);
      setData({
        documentType:  parsed.documentType  || 'freight_invoice',
        logoBase64:    null,
        vendor:        { ...blankInvoice().vendor,  ...(parsed.vendor  || {}) },
        billTo:        { ...blankInvoice().billTo,  ...(parsed.billTo  || {}) },
        invoice:       { ...blankInvoice().invoice, ...(parsed.invoice || {}) },
        lineItems:     parsed.lineItems?.length ? parsed.lineItems : [blankItem()],
        totals:        { taxRate: parsed.totals?.taxRate || 0, discountAmount: parsed.totals?.discountAmount || 0 },
        notes:         parsed.notes        || '',
        paymentTerms:  parsed.paymentTerms || 'Net 30',
        aiSuggestions: parsed.aiSuggestions || [],
      });
      setAiOpen(false);
      setFinalized(false);
    } catch (e: any) {
      setAiError(e.message);
    } finally {
      setAiLoading(false);
    }
  }, [aiText, token]);

  const SUPPORTED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  const handleFileUpload = (file: File) => {
    if (file.name.toLowerCase().endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      setAiError('DOCX files are not supported. Please export as PDF or paste the text instead.');
      return;
    }
    if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
      setAiError(`Unsupported file type (${file.type}). Please upload a PDF, JPG, PNG, GIF, or WEBP.`);
      return;
    }
    setAiError('');
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      const base64 = (e.target?.result as string).split(',')[1];
      handleAiParse(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  // ── Validate ────────────────────────────────────────────────────────────────
  const validate = () => {
    const errors: Record<string, boolean> = {};
    if (!data.vendor.name.trim())    errors['vendor.name']    = true;
    if (!data.billTo.name.trim())    errors['billTo.name']    = true;
    if (!data.invoice.number.trim()) errors['invoice.number'] = true;
    if (!data.invoice.date)          errors['invoice.date']   = true;
    data.lineItems.forEach((item, i) => {
      if (!item.description.trim()) errors[`lineItems.${i}.description`] = true;
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Generate + Save to History + Print ──────────────────────────────────────
  const handleGenerate = async () => {
    if (!validate()) { setSubmitError('Please fill in all required fields highlighted in red.'); return; }
    setSubmitting(true); setSubmitError(''); setSaveError('');
    try {
      // 1. Save full invoice to backend
      const { logoBase64: _logo, aiSuggestions: _ai, ...sendData } = data;
      const genRes = await fetch(`${BACKEND_URL}/api/invoice/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ...sendData, totals: { ...sendData.totals, subtotal, taxAmount, discountAmount, total } }),
      });
      const genJson = await genRes.json();
      if (!genRes.ok) throw new Error(genJson.detail || genJson.error || `Server error (${genRes.status})`);

      // 2. Save to history (paid users only — silent skip for free users)
      if (token && isPaidUser(user)) {
        try {
          const histRes = await fetch(`${BACKEND_URL}/api/history/invoice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              invoice_number: data.invoice.number,
              document_type:  data.documentType,
              vendor_name:    data.vendor.name,
              bill_to_name:   data.billTo.name,
              total,
              status: 'finalized',
            }),
          });
          const histJson = await histRes.json();
          if (!histRes.ok) throw new Error(parseApiError(histJson));
          setSavedHistory(true);
        } catch (e: any) {
          setSaveError(e.message);
        }
      }

      // 3. Cache locally for history Download
      try { localStorage.setItem(`invoice_cache_${data.invoice.number}`, JSON.stringify(data)); } catch {}

      setFinalized(true);

      // 4. Open print/PDF dialog
      handlePrint();
    } catch (e: any) {
      setSubmitError(e.message || 'Failed to generate invoice. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyInvoiceNumber = () => {
    navigator.clipboard.writeText(data.invoice.number).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Print — opens a new window with pure HTML, no CSS cascade issues ─────────
  const handlePrint = () => {
    const cat = (id: string) => CATEGORIES.find(c => c.id === id)?.label || id;
    const catColor = (id: string) => getCatColor(id);

    const lineItemRows = data.lineItems.map(item => `
      <tr>
        <td style="padding:9px 8px;border-bottom:1px solid #f1f5f9;">${item.description}</td>
        <td style="padding:9px 8px;border-bottom:1px solid #f1f5f9;">
          <span style="background:${catColor(item.category)}22;color:${catColor(item.category)};padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;">${cat(item.category)}</span>
        </td>
        <td style="padding:9px 8px;border-bottom:1px solid #f1f5f9;color:#64748b;">${item.calculation}</td>
        <td style="padding:9px 8px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;">${fmtc(item.amount)}</td>
      </tr>`).join('');

    const vendorAddr = [data.vendor.address, data.vendor.city, data.vendor.state, data.vendor.zip].filter(Boolean).join(', ');
    const billToAddr = [data.billTo.city, data.billTo.state, data.billTo.zip].filter(Boolean).join(', ');
    const mcDot = [data.vendor.mc ? `MC# ${data.vendor.mc}` : '', data.vendor.dot ? `DOT# ${data.vendor.dot}` : ''].filter(Boolean).join(' · ');

    const logoHtml = data.logoBase64
      ? `<img src="${data.logoBase64}" style="height:44px;margin-bottom:6px;object-fit:contain;display:block;" />`
      : '';

    const taxRow    = taxAmount > 0    ? `<tr><td style="padding:4px 0;color:#64748b;">Tax (${data.totals.taxRate}%)</td><td style="padding:4px 0;text-align:right;">${fmtc(taxAmount)}</td></tr>` : '';
    const discRow   = discountAmount > 0 ? `<tr><td style="padding:4px 0;color:#16a34a;">Discount</td><td style="padding:4px 0;text-align:right;color:#16a34a;">-${fmtc(discountAmount)}</td></tr>` : '';
    const poRow     = data.invoice.poNumber   ? `<tr><td style="color:#94a3b8;padding:3px 0;">PO #</td><td style="text-align:right;font-weight:600;padding:3px 0;">${data.invoice.poNumber}</td></tr>` : '';
    const bolRow    = data.invoice.bolNumber  ? `<tr><td style="color:#94a3b8;padding:3px 0;">BOL #</td><td style="text-align:right;font-weight:600;padding:3px 0;">${data.invoice.bolNumber}</td></tr>` : '';
    const loadRow   = data.invoice.loadNumber ? `<tr><td style="color:#94a3b8;padding:3px 0;">Load #</td><td style="text-align:right;font-weight:600;padding:3px 0;">${data.invoice.loadNumber}</td></tr>` : '';
    const notesHtml = data.notes ? `
      <div style="padding:14px 32px 20px;border-top:1px solid #e2e8f0;">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;margin-bottom:5px;">Notes</div>
        <div style="font-size:12px;color:#64748b;">${data.notes}</div>
      </div>` : '';

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${data.invoice.number}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">
  <style>
    @page { margin: 0; size: A4 portrait; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #111; background: white; }
    table { border-collapse: collapse; width: 100%; }
  </style>
</head>
<body>
  <div style="padding:12mm;">
    <!-- Header -->
    <div style="background:#1e293b;color:white;padding:24px 32px;display:flex;justify-content:space-between;align-items:flex-start;border-radius:8px 8px 0 0;">
      <div>
        ${logoHtml}
        <div style="font-size:${data.logoBase64 ? 16 : 20}px;font-weight:900;margin-bottom:3px;">${data.vendor.name || 'Your Company'}</div>
        ${vendorAddr ? `<div style="font-size:11px;color:#94a3b8;">${vendorAddr}</div>` : ''}
        ${data.vendor.phone ? `<div style="font-size:11px;color:#94a3b8;">${data.vendor.phone}</div>` : ''}
        ${data.vendor.email ? `<div style="font-size:11px;color:#94a3b8;">${data.vendor.email}</div>` : ''}
        ${mcDot ? `<div style="font-size:10px;color:#64748b;margin-top:3px;">${mcDot}</div>` : ''}
      </div>
      <div style="text-align:right;">
        <div style="font-size:26px;font-weight:900;color:#a78bfa;margin-bottom:4px;">${getDocLabel(data.documentType).toUpperCase()}</div>
        <div style="font-size:13px;font-weight:700;color:#cbd5e1;">${data.invoice.number}</div>
        ${data.invoice.date ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px;">Date: ${data.invoice.date}</div>` : ''}
        ${data.invoice.dueDate ? `<div style="font-size:11px;color:#94a3b8;">Due: ${data.invoice.dueDate}</div>` : ''}
      </div>
    </div>

    <!-- Bill To + Meta -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:18px 32px;border:1px solid #e2e8f0;border-top:none;">
      <div>
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;margin-bottom:6px;">Bill To</div>
        <div style="font-weight:700;font-size:14px;margin-bottom:3px;">${data.billTo.name || '—'}</div>
        ${data.billTo.address ? `<div style="font-size:12px;color:#64748b;">${data.billTo.address}</div>` : ''}
        ${billToAddr ? `<div style="font-size:12px;color:#64748b;">${billToAddr}</div>` : ''}
        ${data.billTo.phone ? `<div style="font-size:12px;color:#64748b;">${data.billTo.phone}</div>` : ''}
        ${data.billTo.email ? `<div style="font-size:12px;color:#64748b;">${data.billTo.email}</div>` : ''}
      </div>
      <div>
        <table style="font-size:12px;">
          ${poRow}${bolRow}${loadRow}
          <tr><td style="color:#94a3b8;padding:3px 0;">Terms</td><td style="text-align:right;font-weight:600;padding:3px 0;">${data.paymentTerms}</td></tr>
        </table>
      </div>
    </div>

    <!-- Line Items -->
    <div style="padding:0 32px;border:1px solid #e2e8f0;border-top:none;">
      <table style="font-size:12px;">
        <thead>
          <tr style="border-bottom:2px solid #e2e8f0;">
            <th style="text-align:left;padding:10px 8px 7px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;">Description</th>
            <th style="text-align:left;padding:10px 8px 7px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;">Category</th>
            <th style="text-align:left;padding:10px 8px 7px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;">Calculation</th>
            <th style="text-align:right;padding:10px 8px 7px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;">Amount</th>
          </tr>
        </thead>
        <tbody>${lineItemRows}</tbody>
      </table>
    </div>

    <!-- Totals -->
    <div style="padding:14px 32px 20px;border:1px solid #e2e8f0;border-top:none;display:flex;justify-content:flex-end;">
      <table style="width:220px;font-size:12px;">
        <tr><td style="padding:4px 0;color:#64748b;">Subtotal</td><td style="padding:4px 0;text-align:right;">${fmtc(subtotal)}</td></tr>
        ${taxRow}${discRow}
        <tr style="border-top:2px solid #111;">
          <td style="padding:8px 0 0;font-size:16px;font-weight:900;">TOTAL</td>
          <td style="padding:8px 0 0;text-align:right;font-size:16px;font-weight:900;color:#7c3aed;">${fmtc(total)}</td>
        </tr>
      </table>
    </div>

    ${notesHtml}

    <!-- Footer -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;padding:12px 32px;text-align:center;font-size:10px;color:#94a3b8;border-radius:0 0 8px 8px;">
      Thank you for your business${data.vendor.name ? ` · ${data.vendor.name}` : ''}
    </div>
  </div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); window.onafterprint = function(){ window.close(); }; }, 600); }</script>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=900,height=1200');
    if (w) { w.document.write(html); w.document.close(); }
  };

  // ── Shared field styles ──────────────────────────────────────────────────────
  const inp = (err?: boolean) =>
    `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors ${
      isDark ? 'bg-gray-800 text-white placeholder-gray-500 focus:ring-primary-500' : 'bg-white text-gray-900 placeholder-gray-400 focus:ring-primary-400'
    } ${err ? 'border-red-500 focus:ring-red-400' : isDark ? 'border-gray-600' : 'border-gray-300'}`;

  const lbl = `block text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`;

  const sec = (accent?: string) =>
    `rounded-xl border mb-4 overflow-hidden ${isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200'}`;

  const secHead = `px-5 py-3 border-b flex items-center gap-2 font-bold text-sm ${isDark ? 'border-gray-700 text-white' : 'border-gray-200 text-gray-800'}`;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Print-only invoice content — rendered off-screen for reference */}
      <div style={{ position: 'absolute', left: -9999, top: 0, width: 0, height: 0, overflow: 'hidden' }}>
        <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: '#111', width: '100%' }}>
          {/* Header */}
          <div style={{ background: '#1e293b', color: 'white', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 0 }}>
            <div>
              {data.logoBase64 ? <img src={data.logoBase64} alt="logo" style={{ height: 40, marginBottom: 6, objectFit: 'contain' }} /> : null}
              <div style={{ fontSize: data.logoBase64 ? 16 : 20, fontWeight: 900, marginBottom: 2 }}>{data.vendor.name || 'Your Company Name'}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{[data.vendor.address, data.vendor.city, data.vendor.state, data.vendor.zip].filter(Boolean).join(', ')}</div>
              {data.vendor.phone && <div style={{ fontSize: 11, color: '#94a3b8' }}>{data.vendor.phone}</div>}
              {data.vendor.email && <div style={{ fontSize: 11, color: '#94a3b8' }}>{data.vendor.email}</div>}
              {(data.vendor.mc || data.vendor.dot) && <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>{data.vendor.mc && `MC# ${data.vendor.mc}`}{data.vendor.mc && data.vendor.dot && ' · '}{data.vendor.dot && `DOT# ${data.vendor.dot}`}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#a78bfa', marginBottom: 4 }}>{getDocLabel(data.documentType).toUpperCase()}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1' }}>{data.invoice.number}</div>
              {data.invoice.date && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Date: {data.invoice.date}</div>}
              {data.invoice.dueDate && <div style={{ fontSize: 11, color: '#64748b' }}>Due: {data.invoice.dueDate}</div>}
            </div>
          </div>
          {/* Bill To + Meta */}
          <div style={{ padding: '20px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, borderBottom: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#94a3b8', marginBottom: 6 }}>Bill To</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{data.billTo.name || '—'}</div>
              {data.billTo.address && <div style={{ fontSize: 12, color: '#64748b' }}>{data.billTo.address}</div>}
              {(data.billTo.city || data.billTo.state) && <div style={{ fontSize: 12, color: '#64748b' }}>{[data.billTo.city, data.billTo.state, data.billTo.zip].filter(Boolean).join(', ')}</div>}
              {data.billTo.phone && <div style={{ fontSize: 12, color: '#64748b' }}>{data.billTo.phone}</div>}
              {data.billTo.email && <div style={{ fontSize: 12, color: '#64748b' }}>{data.billTo.email}</div>}
            </div>
            <div style={{ fontSize: 12 }}>
              {data.invoice.poNumber && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ color: '#94a3b8' }}>PO #</span><span style={{ fontWeight: 600 }}>{data.invoice.poNumber}</span></div>}
              {data.invoice.bolNumber && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ color: '#94a3b8' }}>BOL #</span><span style={{ fontWeight: 600 }}>{data.invoice.bolNumber}</span></div>}
              {data.invoice.loadNumber && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ color: '#94a3b8' }}>Load #</span><span style={{ fontWeight: 600 }}>{data.invoice.loadNumber}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Terms</span><span style={{ fontWeight: 600 }}>{data.paymentTerms}</span></div>
            </div>
          </div>
          {/* Line Items */}
          <div style={{ padding: '0 32px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  {['Description', 'Category', 'Calculation', 'Amount'].map(h => (
                    <th key={h} style={{ textAlign: (h === 'Amount') ? 'right' : 'left', padding: '10px 6px 7px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#94a3b8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.lineItems.map((item, i) => (
                  <tr key={item.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '9px 6px' }}>{item.description}</td>
                    <td style={{ padding: '9px 6px' }}><span style={{ background: getCatColor(item.category) + '22', color: getCatColor(item.category), padding: '2px 7px', borderRadius: 99, fontSize: 10, fontWeight: 700 }}>{CATEGORIES.find(c => c.id === item.category)?.label || item.category}</span></td>
                    <td style={{ padding: '9px 6px', color: '#64748b' }}>{item.calculation}</td>
                    <td style={{ padding: '9px 6px', textAlign: 'right', fontWeight: 700 }}>{fmtc(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Totals */}
          <div style={{ padding: '14px 32px 20px', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 220 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5, color: '#64748b' }}><span>Subtotal</span><span>{fmtc(subtotal)}</span></div>
              {taxAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5, color: '#64748b' }}><span>Tax ({data.totals.taxRate}%)</span><span>{fmtc(taxAmount)}</span></div>}
              {discountAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5, color: '#16a34a' }}><span>Discount</span><span>-{fmtc(discountAmount)}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, borderTop: '2px solid #111', paddingTop: 8, marginTop: 3 }}><span>TOTAL</span><span style={{ color: '#7c3aed' }}>{fmtc(total)}</span></div>
            </div>
          </div>
          {/* Notes */}
          {data.notes && (
            <div style={{ padding: '0 32px 20px', borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#94a3b8', marginBottom: 5 }}>Notes</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{data.notes}</div>
            </div>
          )}
          {/* Footer */}
          <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '12px 32px', textAlign: 'center', fontSize: 10, color: '#94a3b8' }}>
            Thank you for your business{data.vendor.name ? ` · ${data.vendor.name}` : ''}
          </div>
        </div>
      </div>

      <div className={`min-h-screen pb-12 ${isDark ? 'bg-dark-200' : 'bg-gray-50'}`}>
        {/* Page Header */}
        <div className={`px-6 py-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between max-w-screen-xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20">
                <Receipt className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Invoice Generator</h1>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Fill in details — live preview updates instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {finalized && (
                <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${
                  isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                }`}>✓ Finalized</span>
              )}
              <button onClick={copyInvoiceNumber}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-colors ${
                  isDark ? 'bg-dark-400 text-gray-300 hover:bg-dark-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied!' : data.invoice.number}
              </button>
              {finalized && (
                <button onClick={handlePrint}
                  className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-colors ${
                    isDark ? 'bg-dark-400 text-gray-300 hover:bg-dark-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  <Printer className="w-3.5 h-3.5" /> Print / PDF
                </button>
              )}
              {savedHistory && (
                <span className="flex items-center gap-1.5 text-xs text-green-400 font-semibold px-3 py-2">
                  <CheckCircle className="w-4 h-4" /> Saved to History
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Errors */}
        {(submitError || saveError) && (
          <div className="max-w-screen-xl mx-auto px-6 mt-3">
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {submitError || saveError}
            </div>
          </div>
        )}

        {/* Two-column layout */}
        <div className="max-w-screen-xl mx-auto px-6 mt-5 grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* ═══ LEFT: FORM ═══════════════════════════════════════════════════ */}
          <div className="lg:col-span-2">

            {/* AI Import (collapsible) */}
            <div className={sec()}>
              <button
                onClick={() => setAiOpen(o => !o)}
                className={`${secHead} w-full text-left`}
              >
                <Wand2 className="w-4 h-4 text-primary-500" />
                <span className="flex-1">AI-Powered Import</span>
                {aiOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {aiOpen && (
                <div className="p-5 space-y-4">
                  {aiConfidence !== null && (
                    <div className={`p-2 rounded-lg text-xs flex items-center gap-2 ${
                      aiConfidence >= 0.8 ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      <Wand2 className="w-3.5 h-3.5" />
                      AI extracted data with {Math.round(aiConfidence * 100)}% confidence — review fields below.
                    </div>
                  )}

                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) { setAiError(''); handleFileUpload(f); } }}
                    onClick={() => document.getElementById('inv-file-upload')?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      dragOver ? 'border-primary-500 bg-primary-500/10'
                      : isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Upload className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>
                      {fileName || 'Drop a PDF, image, or document'}
                    </p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>PDF, PNG, JPG, GIF, WEBP</p>
                    <input id="inv-file-upload" type="file" accept=".pdf,.png,.jpg,.jpeg,.gif,.webp" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                  </div>

                  <div>
                    <label className={lbl}>Or paste invoice text</label>
                    <textarea rows={3} value={aiText} onChange={e => setAiText(e.target.value)}
                      placeholder="Paste raw invoice text here..."
                      className={`${inp()} resize-none`} />
                  </div>

                  {aiError && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 text-red-400 text-xs">
                      <AlertCircle className="w-3.5 h-3.5" /> {aiError}
                    </div>
                  )}

                  <button onClick={() => handleAiParse()} disabled={!aiText.trim() || aiLoading}
                    className="w-full py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                    {aiLoading
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Parsing...</>
                      : <><Wand2 className="w-4 h-4" /> Parse with AI</>}
                  </button>
                </div>
              )}
            </div>

            {/* Document Settings */}
            <div className={sec()}>
              <div className={secHead}>
                <Receipt className="w-4 h-4 text-purple-500" /> Document Settings
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Document Type</label>
                  <select value={data.documentType} onChange={e => setData(d => ({ ...d, documentType: e.target.value }))}
                    className={inp()}>
                    {DOC_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Company Logo</label>
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                    isDark ? 'border-gray-600 text-gray-400 hover:bg-dark-400' : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}>
                    <Upload className="w-4 h-4" />
                    {data.logoBase64 ? 'Logo uploaded ✓' : 'Upload logo'}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
                  </label>
                </div>
              </div>
            </div>

            {/* Vendor */}
            <div className={sec()}>
              <div className={secHead}><FileText className="w-4 h-4 text-blue-500" /> Your Company (Vendor)</div>
              <div className="p-5 grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={lbl}>Company Name *</label>
                  <input className={inp(fieldErrors['vendor.name'])} value={data.vendor.name}
                    onChange={e => setVendor('name', e.target.value)} placeholder="ABC Trucking Inc." />
                </div>
                <div><label className={lbl}>Address</label>
                  <input className={inp()} value={data.vendor.address} onChange={e => setVendor('address', e.target.value)} placeholder="123 Main St" /></div>
                <div><label className={lbl}>City</label>
                  <input className={inp()} value={data.vendor.city} onChange={e => setVendor('city', e.target.value)} placeholder="Toronto" /></div>
                <div><label className={lbl}>Province/State</label>
                  <input className={inp()} value={data.vendor.state} onChange={e => setVendor('state', e.target.value)} placeholder="ON" /></div>
                <div><label className={lbl}>Postal/ZIP</label>
                  <input className={inp()} value={data.vendor.zip} onChange={e => setVendor('zip', e.target.value)} placeholder="M5V 3A8" /></div>
                <div><label className={lbl}>Phone</label>
                  <input className={inp()} value={data.vendor.phone} onChange={e => setVendor('phone', e.target.value)} placeholder="416-555-0100" /></div>
                <div><label className={lbl}>Email</label>
                  <input className={inp()} value={data.vendor.email} onChange={e => setVendor('email', e.target.value)} placeholder="billing@abc.com" /></div>
                <div><label className={lbl}>MC #</label>
                  <input className={inp()} value={data.vendor.mc} onChange={e => setVendor('mc', e.target.value)} placeholder="MC-123456" /></div>
                <div><label className={lbl}>DOT #</label>
                  <input className={inp()} value={data.vendor.dot} onChange={e => setVendor('dot', e.target.value)} placeholder="DOT-654321" /></div>
              </div>
            </div>

            {/* Bill To */}
            <div className={sec()}>
              <div className={secHead}><FileText className="w-4 h-4 text-green-500" /> Bill To</div>
              <div className="p-5 grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={lbl}>Company Name *</label>
                  <input className={inp(fieldErrors['billTo.name'])} value={data.billTo.name}
                    onChange={e => setBillTo('name', e.target.value)} placeholder="XYZ Logistics" />
                </div>
                <div><label className={lbl}>Address</label>
                  <input className={inp()} value={data.billTo.address} onChange={e => setBillTo('address', e.target.value)} placeholder="456 Bay St" /></div>
                <div><label className={lbl}>City</label>
                  <input className={inp()} value={data.billTo.city} onChange={e => setBillTo('city', e.target.value)} placeholder="Calgary" /></div>
                <div><label className={lbl}>Province/State</label>
                  <input className={inp()} value={data.billTo.state} onChange={e => setBillTo('state', e.target.value)} placeholder="AB" /></div>
                <div><label className={lbl}>Postal/ZIP</label>
                  <input className={inp()} value={data.billTo.zip} onChange={e => setBillTo('zip', e.target.value)} placeholder="T2P 1H9" /></div>
                <div><label className={lbl}>Phone</label>
                  <input className={inp()} value={data.billTo.phone} onChange={e => setBillTo('phone', e.target.value)} placeholder="403-555-0200" /></div>
                <div><label className={lbl}>Email</label>
                  <input className={inp()} value={data.billTo.email} onChange={e => setBillTo('email', e.target.value)} placeholder="ap@xyz.com" /></div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className={sec()}>
              <div className={secHead}><Receipt className="w-4 h-4 text-yellow-500" /> Invoice Details</div>
              <div className="p-5 grid grid-cols-3 gap-3">
                <div><label className={lbl}>Invoice # *</label>
                  <input className={inp(fieldErrors['invoice.number'])} value={data.invoice.number}
                    onChange={e => setInvoice('number', e.target.value)} /></div>
                <div><label className={lbl}>Date *</label>
                  <input type="date" className={inp(fieldErrors['invoice.date'])} value={data.invoice.date}
                    onChange={e => setInvoice('date', e.target.value)} /></div>
                <div><label className={lbl}>Due Date</label>
                  <input type="date" className={inp()} value={data.invoice.dueDate}
                    onChange={e => setInvoice('dueDate', e.target.value)} /></div>
                <div><label className={lbl}>PO #</label>
                  <input className={inp()} value={data.invoice.poNumber}
                    onChange={e => setInvoice('poNumber', e.target.value)} placeholder="PO-12345" /></div>
                <div><label className={lbl}>BOL #</label>
                  <input className={inp()} value={data.invoice.bolNumber}
                    onChange={e => setInvoice('bolNumber', e.target.value)} placeholder="BOL-67890" /></div>
                <div><label className={lbl}>Load #</label>
                  <input className={inp()} value={data.invoice.loadNumber}
                    onChange={e => setInvoice('loadNumber', e.target.value)} placeholder="LOAD-001" /></div>
                <div className="col-span-3"><label className={lbl}>Payment Terms</label>
                  <select className={inp()} value={data.paymentTerms}
                    onChange={e => setData(d => ({ ...d, paymentTerms: e.target.value }))}>
                    {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className={sec()}>
              <div className={secHead}><Plus className="w-4 h-4 text-purple-500" /> Line Items</div>
              <div className="p-5 space-y-3">
                {data.lineItems.map((item, idx) => (
                  <div key={item.id} className={`p-3 rounded-lg border ${isDark ? 'border-gray-700 bg-dark-400' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-end">
                      <div className="col-span-2 sm:col-span-4">
                        <label className={lbl}>Description *</label>
                        <input className={inp(fieldErrors[`lineItems.${idx}.description`])}
                          value={item.description} placeholder="Linehaul - Toronto to Calgary"
                          onChange={e => updateItem(item.id, 'description', e.target.value)} />
                      </div>
                      <div className="col-span-1 sm:col-span-3">
                        <label className={lbl}>Category</label>
                        <select className={inp()} value={item.category}
                          onChange={e => updateItem(item.id, 'category', e.target.value)}>
                          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                      </div>
                      <div className="col-span-1 sm:col-span-3">
                        <label className={lbl}>Calculation</label>
                        <input className={inp()} value={item.calculation}
                          placeholder="e.g. 5 days × $500"
                          onChange={e => updateItem(item.id, 'calculation', e.target.value)} />
                      </div>
                      <div className="col-span-1 sm:col-span-1">
                        <label className={lbl}>Amount</label>
                        <input type="number" className={inp()} value={item.amount === 0 ? '' : item.amount}
                          min={0} step="0.01" placeholder="0.00"
                          onChange={e => updateItem(item.id, 'amount', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="col-span-1 sm:col-span-1 flex justify-end pb-1">
                        {data.lineItems.length > 1 && (
                          <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={addItem}
                  className={`w-full py-2 rounded-lg border-2 border-dashed text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    isDark ? 'border-gray-600 text-gray-400 hover:border-purple-500 hover:text-purple-400'
                    : 'border-gray-300 text-gray-500 hover:border-purple-400 hover:text-purple-600'
                  }`}>
                  <Plus className="w-4 h-4" /> Add Line Item
                </button>
              </div>
            </div>

            {/* Totals + Notes */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className={sec()}>
                <div className={secHead}><FileText className="w-4 h-4 text-cyan-500" /> Notes</div>
                <div className="p-4">
                  <textarea rows={3} className={`${inp()} resize-none`} value={data.notes}
                    onChange={e => setData(d => ({ ...d, notes: e.target.value }))}
                    placeholder="Payment instructions, thank you note..." />
                </div>
              </div>
              <div className={sec()}>
                <div className={secHead}><Receipt className="w-4 h-4 text-green-500" /> Totals</div>
                <div className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Subtotal</span>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{fmtc(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Tax %</span>
                    <input type="number" min={0} max={100} step="0.1" value={data.totals.taxRate}
                      onChange={e => setTotals('taxRate', parseFloat(e.target.value) || 0)}
                      className={`${inp()} w-20 text-right`} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Discount $</span>
                    <input type="number" min={0} step="0.01" value={data.totals.discountAmount}
                      onChange={e => setTotals('discountAmount', parseFloat(e.target.value) || 0)}
                      className={`${inp()} w-20 text-right`} />
                  </div>
                  <div className={`flex justify-between font-black text-base pt-2 border-t ${isDark ? 'border-gray-700 text-white' : 'border-gray-200 text-gray-900'}`}>
                    <span>Total</span>
                    <span className="text-purple-500">{fmtc(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={handleGenerate} disabled={submitting}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving & Generating PDF...</>
                : <><FileText className="w-5 h-5" /> {finalized ? 'Re-generate & Print Invoice' : 'Generate & Save Invoice'}</>}
            </button>
          </div>

          {/* ═══ RIGHT: LIVE PREVIEW ══════════════════════════════════════════ */}
          <div className="hidden lg:block lg:col-span-3 sticky top-24">
            <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              {/* Preview toolbar */}
              <div className={`px-4 py-3 flex items-center justify-between border-b ${isDark ? 'bg-dark-300 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Live Preview</span>
                {finalized && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">Finalized</span>
                )}
              </div>

              {/* Scaled preview container — A4 ratio: width × 1.414 */}
              <div ref={previewRef} className={`overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-gray-200'}`}
                style={{ height: `${900 * previewScale * 1.414}px` }}>
                <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left', width: 900, height: 900 * 1.414 }}>
                  {/* ── Invoice Document (900px wide source of truth) ── */}
                  <div id="invoice-print-doc" style={{ width: 900, background: 'white', fontFamily: "'Inter', system-ui, sans-serif", color: '#111' }}>

                    {/* Header */}
                    <div style={{ background: '#1e293b', color: 'white', padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        {data.logoBase64
                          ? <img src={data.logoBase64} alt="logo" style={{ height: 48, marginBottom: 8, objectFit: 'contain' }} />
                          : null}
                        <div style={{ fontSize: data.logoBase64 ? 18 : 22, fontWeight: 900, marginBottom: 4 }}>
                          {data.vendor.name || 'Your Company Name'}
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                          {[data.vendor.address, data.vendor.city, data.vendor.state, data.vendor.zip].filter(Boolean).join(', ')}
                        </div>
                        {data.vendor.phone && <div style={{ fontSize: 12, color: '#94a3b8' }}>{data.vendor.phone}</div>}
                        {data.vendor.email && <div style={{ fontSize: 12, color: '#94a3b8' }}>{data.vendor.email}</div>}
                        {(data.vendor.mc || data.vendor.dot) && (
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                            {data.vendor.mc && `MC# ${data.vendor.mc}`}{data.vendor.mc && data.vendor.dot && ' · '}{data.vendor.dot && `DOT# ${data.vendor.dot}`}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#a78bfa', marginBottom: 6 }}>
                          {getDocLabel(data.documentType).toUpperCase()}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#cbd5e1' }}>{data.invoice.number}</div>
                        {data.invoice.date && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Date: {data.invoice.date}</div>}
                        {data.invoice.dueDate && <div style={{ fontSize: 12, color: '#64748b' }}>Due: {data.invoice.dueDate}</div>}
                      </div>
                    </div>

                    {/* Bill To + Meta */}
                    <div style={{ padding: '24px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, borderBottom: '1px solid #e2e8f0' }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#94a3b8', marginBottom: 8 }}>Bill To</div>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{data.billTo.name || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not filled yet</span>}</div>
                        {data.billTo.address && <div style={{ fontSize: 13, color: '#64748b' }}>{data.billTo.address}</div>}
                        {(data.billTo.city || data.billTo.state) && (
                          <div style={{ fontSize: 13, color: '#64748b' }}>{[data.billTo.city, data.billTo.state, data.billTo.zip].filter(Boolean).join(', ')}</div>
                        )}
                        {data.billTo.phone && <div style={{ fontSize: 13, color: '#64748b' }}>{data.billTo.phone}</div>}
                        {data.billTo.email && <div style={{ fontSize: 13, color: '#64748b' }}>{data.billTo.email}</div>}
                      </div>
                      <div style={{ fontSize: 13 }}>
                        {data.invoice.poNumber && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ color: '#94a3b8' }}>PO #</span><span style={{ fontWeight: 600 }}>{data.invoice.poNumber}</span></div>}
                        {data.invoice.bolNumber && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ color: '#94a3b8' }}>BOL #</span><span style={{ fontWeight: 600 }}>{data.invoice.bolNumber}</span></div>}
                        {data.invoice.loadNumber && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ color: '#94a3b8' }}>Load #</span><span style={{ fontWeight: 600 }}>{data.invoice.loadNumber}</span></div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Terms</span><span style={{ fontWeight: 600 }}>{data.paymentTerms}</span></div>
                      </div>
                    </div>

                    {/* Line Items */}
                    <div style={{ padding: '0 40px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                            {['Description', 'Category', 'Calculation', 'Amount'].map(h => (
                              <th key={h} style={{ textAlign: h === 'Amount' ? 'right' : 'left', padding: '12px 6px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#94a3b8' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.lineItems.map((item, i) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 6px', maxWidth: 220 }}>{item.description || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Description...</span>}</td>
                              <td style={{ padding: '10px 6px' }}>
                                <span style={{ background: getCatColor(item.category) + '22', color: getCatColor(item.category), padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
                                  {CATEGORIES.find(c => c.id === item.category)?.label || item.category}
                                </span>
                              </td>
                              <td style={{ padding: '10px 6px', color: '#64748b' }}>{item.calculation}</td>
                              <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 700 }}>{fmtc(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals */}
                    <div style={{ padding: '16px 40px 24px', display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ width: 240 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, color: '#64748b' }}>
                          <span>Subtotal</span><span>{fmtc(subtotal)}</span>
                        </div>
                        {taxAmount > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, color: '#64748b' }}>
                            <span>Tax ({data.totals.taxRate}%)</span><span>{fmtc(taxAmount)}</span>
                          </div>
                        )}
                        {discountAmount > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, color: '#16a34a' }}>
                            <span>Discount</span><span>-{fmtc(discountAmount)}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 900, borderTop: '2px solid #111', paddingTop: 10, marginTop: 4 }}>
                          <span>TOTAL</span><span style={{ color: '#7c3aed' }}>{fmtc(total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {data.notes && (
                      <div style={{ padding: '0 40px 24px', borderTop: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#94a3b8', marginBottom: 6 }}>Notes</div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>{data.notes}</div>
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '14px 40px', textAlign: 'center', fontSize: 11, color: '#94a3b8' }}>
                      Thank you for your business{data.vendor.name ? ` · ${data.vendor.name}` : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI suggestions below preview */}
            {data.aiSuggestions.length > 0 && (
              <div className={`mt-3 p-3 rounded-lg text-xs border ${isDark ? 'bg-dark-300 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-500'}`}>
                <span className="font-semibold text-primary-500">AI suggestions: </span>
                {data.aiSuggestions.join(' · ')}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceGeneratorPage;
