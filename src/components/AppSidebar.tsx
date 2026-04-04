import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FileText,
  Fuel,
  Calculator,
  History,
  ChevronLeft,
  ChevronRight,
  Clock,
  Truck,
  Receipt,
  Download,
  ExternalLink
} from 'lucide-react';

interface HistoryItem {
  id: string;
  type: 'fuel-surcharge' | 'ifta' | 'bol' | 'invoice';
  data: any;
  created_at: string;
}

const AppSidebar: React.FC = () => {
  const { theme } = useTheme();
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = theme === 'dark';
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeSection, setActiveSection] = useState<'tools' | 'history'>('tools');

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

  const menuItems = [
    { 
      id: 'bol-generator', 
      name: 'BOL Generator', 
      icon: FileText, 
      path: '/bol-generator',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/20'
    },
    { 
      id: 'fuel-surcharge', 
      name: 'Fuel Surcharge Calculator', 
      icon: Fuel, 
      path: '/fuel-surcharge',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/20'
    },
    {
      id: 'ifta-calculator',
      name: 'IFTA Tax Calculator',
      icon: Calculator,
      path: '/ifta-calculator',
      color: 'text-green-500',
      bgColor: 'bg-green-500/20'
    },
    {
      id: 'invoice-generator',
      name: 'Invoice Generator',
      icon: Receipt,
      path: '/invoice-generator',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/20'
    },
  ];

  const fetchHistory = async () => {
    if (!token) return;
    
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data.records || []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Fetch history when section changes to history
  useEffect(() => {
    if (activeSection === 'history' && token) {
      fetchHistory();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, token]);

  // Don't show sidebar if not authenticated - must be after all hooks
  if (!isAuthenticated) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getHistoryIcon = (type: string) => {
    switch (type) {
      case 'fuel-surcharge': return <Fuel className="w-4 h-4 text-orange-500" />;
      case 'ifta': return <Calculator className="w-4 h-4 text-green-500" />;
      case 'bol': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'invoice': return <Receipt className="w-4 h-4 text-purple-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getHistoryTitle = (item: HistoryItem) => {
    switch (item.type) {
      case 'fuel-surcharge':
        return `Fuel: ${item.data.surcharge_percent?.toFixed(1)}% surcharge`;
      case 'ifta':
        return `IFTA: $${item.data.total_tax_due?.toFixed(2)} tax`;
      case 'bol':
        return `BOL: ${item.data.bol_number}`;
      case 'invoice':
        return `Invoice: ${item.data.invoice_number}`;
      default:
        return 'Unknown';
    }
  };

  const getHistorySubtitle = (item: HistoryItem) => {
    switch (item.type) {
      case 'fuel-surcharge':
        return `$${item.data.current_fuel_price}/gal → $${item.data.surcharge_amount?.toFixed(2)}`;
      case 'ifta':
        return `${item.data.total_miles?.toLocaleString()} mi, ${item.data.jurisdictions?.length || 0} states`;
      case 'bol':
        return `${item.data.shipper_name || 'Shipper'} → ${item.data.consignee_name || 'Consignee'}`;
      case 'invoice':
        return `${item.data.vendor_name || ''} → ${item.data.bill_to_name || ''} • $${item.data.total?.toFixed(2) || '0.00'}`;
      default:
        return '';
    }
  };

  const openItem = (item: HistoryItem) => {
    const routes: Record<string, string> = {
      'fuel-surcharge': '/fuel-surcharge',
      'ifta': '/ifta-calculator',
      'bol': '/bol-generator',
      'invoice': '/invoice-generator',
    };
    const path = routes[item.type];
    if (path) navigate(path);
  };

  // Invoice category / doc-type lookups (mirrors InvoiceGeneratorPage constants)
  const INV_CATEGORIES = [
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
  const INV_DOC_TYPES = [
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
  const invCatColor  = (id: string) => INV_CATEGORIES.find(c => c.id === id)?.color || '#6b7280';
  const invCatLabel  = (id: string) => INV_CATEGORIES.find(c => c.id === id)?.label || id;
  const invDocLabel  = (id: string) => INV_DOC_TYPES.find(t => t.id === id)?.label || 'Invoice';

  const printHtml = (html: string) => {
    const w = window.open('', '_blank', 'width=900,height=1200');
    if (w) { w.document.write(html); w.document.close(); }
  };

  const baseHtmlShell = (title: string, body: string) => `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">
  <style>
    @page { margin: 0; size: A4 portrait; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, sans-serif; color: #111; background: white; padding: 14mm; }
    table { border-collapse: collapse; width: 100%; }
  </style>
</head><body>
${body}
<script>window.onload=function(){ setTimeout(function(){ window.print(); window.onafterprint=function(){ window.close(); }; }, 600); }</script>
</body></html>`;

  const downloadItem = async (item: HistoryItem) => {
    const d = item.data;
    const date = new Date(item.created_at).toLocaleString();
    const fmtc = (n: number) => `$${(Math.round((n + Number.EPSILON) * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (item.type === 'fuel-surcharge') {
      printHtml(baseHtmlShell(`Fuel Surcharge – ${date}`, `
        <div style="background:#1e293b;color:white;padding:24px 32px;border-radius:8px 8px 0 0;display:flex;justify-content:space-between;align-items:center;">
          <div><div style="font-size:20px;font-weight:900;">Fuel Surcharge Summary</div><div style="font-size:12px;color:#94a3b8;margin-top:3px;">${date}</div></div>
          <div style="font-size:28px;font-weight:900;color:#f59e0b;">FSC</div>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;overflow:hidden;">
          ${[
            ['Current Fuel Price', d.current_fuel_price != null ? `$${d.current_fuel_price}/gal` : '—'],
            ['Base Fuel Price',    d.base_fuel_price    != null ? `$${d.base_fuel_price}/gal`    : '—'],
            ['Surcharge %',        d.surcharge_percent  != null ? `${Number(d.surcharge_percent).toFixed(2)}%` : '—'],
            ['Surcharge Amount',   d.surcharge_amount   != null ? fmtc(d.surcharge_amount)  : '—'],
            d.base_rate           ? ['Base Rate',           fmtc(d.base_rate)]           : null,
            d.total_with_surcharge ? ['Total with Surcharge', fmtc(d.total_with_surcharge)] : null,
          ].filter(Boolean).map((row: any, i) => `
            <div style="display:flex;justify-content:space-between;padding:12px 24px;background:${i % 2 === 0 ? '#f8fafc' : 'white'};border-bottom:1px solid #f1f5f9;">
              <span style="font-size:13px;color:#64748b;">${row[0]}</span>
              <span style="font-size:13px;font-weight:600;">${row[1]}</span>
            </div>`).join('')}
        </div>`));

    } else if (item.type === 'ifta') {
      printHtml(baseHtmlShell(`IFTA Summary – ${date}`, `
        <div style="background:#1e293b;color:white;padding:24px 32px;border-radius:8px 8px 0 0;display:flex;justify-content:space-between;align-items:center;">
          <div><div style="font-size:20px;font-weight:900;">IFTA Tax Summary</div><div style="font-size:12px;color:#94a3b8;margin-top:3px;">${date}</div></div>
          <div style="font-size:28px;font-weight:900;color:#10b981;">IFTA</div>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;overflow:hidden;">
          ${[
            ['Total Miles',    d.total_miles    != null ? Number(d.total_miles).toLocaleString() : '—'],
            ['Total Tax Due',  d.total_tax_due  != null ? fmtc(d.total_tax_due)  : '—'],
            ['Jurisdictions',  d.jurisdictions  != null ? `${d.jurisdictions.length || 0} states/provinces` : '—'],
          ].map((row, i) => `
            <div style="display:flex;justify-content:space-between;padding:12px 24px;background:${i % 2 === 0 ? '#f8fafc' : 'white'};border-bottom:1px solid #f1f5f9;">
              <span style="font-size:13px;color:#64748b;">${row[0]}</span>
              <span style="font-size:13px;font-weight:600;">${row[1]}</span>
            </div>`).join('')}
        </div>`));

    } else if (item.type === 'bol') {
      printHtml(baseHtmlShell(`BOL – ${d.bol_number || ''}`, `
        <div style="background:#1e293b;color:white;padding:24px 32px;border-radius:8px 8px 0 0;display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div style="font-size:20px;font-weight:900;">${d.shipper_name || 'Bill of Lading'}</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:3px;">${date}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:22px;font-weight:900;color:#60a5fa;">BILL OF LADING</div>
            ${d.bol_number ? `<div style="font-size:12px;color:#94a3b8;margin-top:2px;">${d.bol_number}</div>` : ''}
          </div>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:20px 32px;display:grid;grid-template-columns:1fr 1fr;gap:24px;border-bottom:1px solid #e2e8f0;">
          <div>
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;margin-bottom:8px;">Shipper</div>
            <div style="font-weight:700;font-size:14px;">${d.shipper_name || '—'}</div>
            <div style="font-size:12px;color:#64748b;margin-top:3px;">${d.shipper_address || ''}</div>
          </div>
          <div>
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;margin-bottom:8px;">Consignee</div>
            <div style="font-weight:700;font-size:14px;">${d.consignee_name || '—'}</div>
            <div style="font-size:12px;color:#64748b;margin-top:3px;">${d.consignee_address || ''}</div>
          </div>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;overflow:hidden;">
          ${[
            d.carrier_name         ? ['Carrier',               d.carrier_name]               : null,
            d.pro_number           ? ['PRO #',                 d.pro_number]                 : null,
            d.weight               ? ['Weight',                `${d.weight} lbs`]            : null,
            d.reference_number     ? ['Reference #',           d.reference_number]           : null,
            d.special_instructions ? ['Special Instructions',  d.special_instructions]       : null,
          ].filter(Boolean).map((row: any, i) => `
            <div style="display:flex;justify-content:space-between;padding:11px 24px;background:${i % 2 === 0 ? '#f8fafc' : 'white'};border-bottom:1px solid #f1f5f9;">
              <span style="font-size:13px;color:#64748b;">${row[0]}</span>
              <span style="font-size:13px;font-weight:600;text-align:right;max-width:60%;">${row[1]}</span>
            </div>`).join('')}
        </div>`));

    } else if (item.type === 'invoice') {
      const r2i   = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
      const fmtc2 = (n: number) => `$${r2i(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      // 1. Check localStorage cache (saved when invoice was generated)
      let cached: any = null;
      try {
        const raw = localStorage.getItem(`invoice_cache_${d.invoice_number}`);
        if (raw) cached = JSON.parse(raw);
      } catch {}

      // 2. If not in cache, try backend
      if (!cached) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/invoice/${item.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const json = await res.json();
            cached = json.invoice || json;
          }
        } catch {}
      }

      if (cached && (cached.lineItems?.length || cached.vendor)) {
        // Full invoice — render identical to handlePrint() in InvoiceGeneratorPage
        const inv = cached;
        const v   = inv.vendor  || {};
        const b   = inv.billTo  || {};
        const meta = inv.invoice || {};
        const lineItems: any[] = inv.lineItems || [];
        const subtotal   = lineItems.reduce((s: number, i: any) => s + r2i(i.amount ?? (i.quantity || 0) * (i.rate || 0)), 0);
        const taxRate    = inv.totals?.taxRate || 0;
        const taxAmount  = r2i(subtotal * (taxRate / 100));
        const discAmount = inv.totals?.discountAmount || 0;
        const total      = r2i(inv.totals?.total ?? (subtotal + taxAmount - discAmount));
        const vendorAddr = [v.address, v.city, v.state, v.zip].filter(Boolean).join(', ');
        const billToAddr = [b.city, b.state, b.zip].filter(Boolean).join(', ');
        const mcDot      = [v.mc ? `MC# ${v.mc}` : '', v.dot ? `DOT# ${v.dot}` : ''].filter(Boolean).join(' · ');
        const docLabel   = invDocLabel(inv.documentType || d.document_type || '').toUpperCase();
        const logoHtml   = inv.logoBase64
          ? `<img src="${inv.logoBase64}" style="height:44px;margin-bottom:6px;object-fit:contain;display:block;" />`
          : '';
        const lineRows = lineItems.map((li: any) => `
          <tr>
            <td style="padding:9px 8px;border-bottom:1px solid #f1f5f9;">${li.description || ''}</td>
            <td style="padding:9px 8px;border-bottom:1px solid #f1f5f9;">
              <span style="background:${invCatColor(li.category)}22;color:${invCatColor(li.category)};padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;">${invCatLabel(li.category)}</span>
            </td>
            <td style="padding:9px 8px;border-bottom:1px solid #f1f5f9;color:#64748b;">${li.calculation || ''}</td>
            <td style="padding:9px 8px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;">${fmtc2(li.amount ?? r2i((li.quantity || 0) * (li.rate || 0)))}</td>
          </tr>`).join('');

        printHtml(baseHtmlShell(meta.number || d.invoice_number || 'Invoice', `
          <div style="padding:12mm;">
            <div style="background:#1e293b;color:white;padding:24px 32px;display:flex;justify-content:space-between;align-items:flex-start;border-radius:8px 8px 0 0;">
              <div>
                ${logoHtml}
                <div style="font-size:${inv.logoBase64 ? 16 : 20}px;font-weight:900;margin-bottom:3px;">${v.name || 'Your Company'}</div>
                ${vendorAddr ? `<div style="font-size:11px;color:#94a3b8;">${vendorAddr}</div>` : ''}
                ${v.phone ? `<div style="font-size:11px;color:#94a3b8;">${v.phone}</div>` : ''}
                ${v.email ? `<div style="font-size:11px;color:#94a3b8;">${v.email}</div>` : ''}
                ${mcDot ? `<div style="font-size:10px;color:#64748b;margin-top:3px;">${mcDot}</div>` : ''}
              </div>
              <div style="text-align:right;">
                <div style="font-size:26px;font-weight:900;color:#a78bfa;margin-bottom:4px;">${docLabel}</div>
                <div style="font-size:13px;font-weight:700;color:#cbd5e1;">${meta.number || d.invoice_number || ''}</div>
                ${meta.date    ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px;">Date: ${meta.date}</div>` : ''}
                ${meta.dueDate ? `<div style="font-size:11px;color:#94a3b8;">Due: ${meta.dueDate}</div>` : ''}
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:18px 32px;border:1px solid #e2e8f0;border-top:none;">
              <div>
                <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;margin-bottom:6px;">Bill To</div>
                <div style="font-weight:700;font-size:14px;margin-bottom:3px;">${b.name || '—'}</div>
                ${b.address ? `<div style="font-size:12px;color:#64748b;">${b.address}</div>` : ''}
                ${billToAddr ? `<div style="font-size:12px;color:#64748b;">${billToAddr}</div>` : ''}
                ${b.phone ? `<div style="font-size:12px;color:#64748b;">${b.phone}</div>` : ''}
                ${b.email ? `<div style="font-size:12px;color:#64748b;">${b.email}</div>` : ''}
              </div>
              <div>
                <table style="font-size:12px;width:100%;">
                  ${meta.poNumber   ? `<tr><td style="color:#94a3b8;padding:3px 0;">PO #</td><td style="text-align:right;font-weight:600;padding:3px 0;">${meta.poNumber}</td></tr>` : ''}
                  ${meta.bolNumber  ? `<tr><td style="color:#94a3b8;padding:3px 0;">BOL #</td><td style="text-align:right;font-weight:600;padding:3px 0;">${meta.bolNumber}</td></tr>` : ''}
                  ${meta.loadNumber ? `<tr><td style="color:#94a3b8;padding:3px 0;">Load #</td><td style="text-align:right;font-weight:600;padding:3px 0;">${meta.loadNumber}</td></tr>` : ''}
                  <tr><td style="color:#94a3b8;padding:3px 0;">Terms</td><td style="text-align:right;font-weight:600;padding:3px 0;">${inv.paymentTerms || 'Net 30'}</td></tr>
                </table>
              </div>
            </div>
            <div style="padding:0 32px;border:1px solid #e2e8f0;border-top:none;">
              <table style="font-size:12px;">
                <thead><tr style="border-bottom:2px solid #e2e8f0;">
                  <th style="text-align:left;padding:10px 8px 7px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;">Description</th>
                  <th style="text-align:left;padding:10px 8px 7px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;">Category</th>
                  <th style="text-align:left;padding:10px 8px 7px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;">Calculation</th>
                  <th style="text-align:right;padding:10px 8px 7px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;">Amount</th>
                </tr></thead>
                <tbody>${lineRows}</tbody>
              </table>
            </div>
            <div style="padding:14px 32px 20px;border:1px solid #e2e8f0;border-top:none;display:flex;justify-content:flex-end;">
              <table style="width:220px;font-size:12px;">
                <tr><td style="padding:4px 0;color:#64748b;">Subtotal</td><td style="padding:4px 0;text-align:right;">${fmtc2(subtotal)}</td></tr>
                ${taxAmount > 0  ? `<tr><td style="padding:4px 0;color:#64748b;">Tax (${taxRate}%)</td><td style="padding:4px 0;text-align:right;">${fmtc2(taxAmount)}</td></tr>` : ''}
                ${discAmount > 0 ? `<tr><td style="padding:4px 0;color:#16a34a;">Discount</td><td style="padding:4px 0;text-align:right;color:#16a34a;">-${fmtc2(discAmount)}</td></tr>` : ''}
                <tr style="border-top:2px solid #111;">
                  <td style="padding:8px 0 0;font-size:16px;font-weight:900;">TOTAL</td>
                  <td style="padding:8px 0 0;text-align:right;font-size:16px;font-weight:900;color:#7c3aed;">${fmtc2(total)}</td>
                </tr>
              </table>
            </div>
            ${inv.notes ? `<div style="padding:14px 32px;border:1px solid #e2e8f0;border-top:none;"><div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;margin-bottom:5px;">Notes</div><div style="font-size:12px;color:#64748b;">${inv.notes}</div></div>` : ''}
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;padding:12px 32px;text-align:center;font-size:10px;color:#94a3b8;border-radius:0 0 8px 8px;">
              Thank you for your business${v.name ? ` · ${v.name}` : ''}
            </div>
          </div>`));
      } else {
        // Fallback — summary only (shown until invoice is regenerated to populate cache)
        printHtml(baseHtmlShell(d.invoice_number || 'Invoice', `
          <div style="background:#1e293b;color:white;padding:24px 32px;border-radius:8px 8px 0 0;display:flex;justify-content:space-between;align-items:center;">
            <div><div style="font-size:20px;font-weight:900;">${d.vendor_name || 'Invoice'}</div><div style="font-size:12px;color:#94a3b8;margin-top:3px;">${date}</div></div>
            <div style="text-align:right;"><div style="font-size:22px;font-weight:900;color:#a78bfa;">${(d.document_type || 'INVOICE').replace(/_/g,' ').toUpperCase()}</div><div style="font-size:13px;color:#94a3b8;margin-top:3px;">${d.invoice_number || ''}</div></div>
          </div>
          <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;overflow:hidden;">
            ${[
              ['Invoice Number', d.invoice_number || '—'],
              ['Vendor',        d.vendor_name    || '—'],
              ['Bill To',       d.bill_to_name   || '—'],
              ['Total',         d.total != null ? fmtc(d.total) : '—'],
              ['Status',        d.status         || '—'],
            ].map((row, i) => `
              <div style="display:flex;justify-content:space-between;padding:12px 24px;background:${i % 2 === 0 ? '#f8fafc' : 'white'};border-bottom:1px solid #f1f5f9;">
                <span style="font-size:13px;color:#64748b;">${row[0]}</span>
                <span style="font-size:13px;font-weight:600;">${row[1]}</span>
              </div>`).join('')}
          </div>`));
      }
    }
  };

  return (
    <aside 
      className={`fixed left-0 top-20 h-[calc(100vh-5rem)] z-40 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-72'
      } ${isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200'} border-r`}
      data-testid="app-sidebar"
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`absolute -right-3 top-6 z-50 p-1 rounded-full border shadow-md ${
          isDark ? 'bg-dark-300 border-gray-600 text-gray-400' : 'bg-white border-gray-200 text-gray-600'
        } hover:scale-110 transition-transform`}
        data-testid="sidebar-toggle"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className="flex flex-col h-full">
        {/* Section Tabs */}
        {!isCollapsed && (
          <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => setActiveSection('tools')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeSection === 'tools'
                  ? isDark ? 'text-white border-b-2 border-primary-500' : 'text-gray-900 border-b-2 border-primary-600'
                  : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
              }`}
              data-testid="tools-tab"
            >
              <Truck className="w-4 h-4 inline mr-2" />
              Tools
            </button>
            <button
              onClick={() => setActiveSection('history')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeSection === 'history'
                  ? isDark ? 'text-white border-b-2 border-primary-500' : 'text-gray-900 border-b-2 border-primary-600'
                  : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
              }`}
              data-testid="history-tab"
            >
              <History className="w-4 h-4 inline mr-2" />
              History
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3">
          {activeSection === 'tools' || isCollapsed ? (
            /* Tools Menu */
            <div className="space-y-2">
              {!isCollapsed && (
                <p className={`text-xs font-semibold uppercase tracking-wider mb-3 px-2 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Fleet Tools
                </p>
              )}
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path.split('?')[0];
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                      isActive
                        ? isDark ? 'bg-primary-600/20 text-primary-400' : 'bg-primary-50 text-primary-700'
                        : isDark ? 'text-gray-300 hover:bg-dark-400' : 'text-gray-700 hover:bg-gray-100'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                    data-testid={`sidebar-${item.id}`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className={`p-2 rounded-lg ${item.bgColor}`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    {!isCollapsed && (
                      <span className="font-medium text-sm">{item.name}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            /* History Section */
            <div>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent"></div>
                </div>
              ) : history.length === 0 ? (
                <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No history yet</p>
                  <p className="text-xs mt-1">Your calculations and BOLs will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border overflow-hidden transition ${
                        isDark ? 'bg-dark-400 border-gray-700' : 'bg-gray-50 border-gray-200'
                      }`}
                      data-testid={`history-item-${idx}`}
                    >
                      {/* Main row — click to open tool */}
                      <button
                        onClick={() => openItem(item)}
                        className={`w-full p-3 flex items-start gap-3 text-left transition hover:bg-primary-500/10`}
                        title="Open tool"
                      >
                        <div className={`p-2 rounded-lg flex-shrink-0 ${
                          item.type === 'fuel-surcharge' ? 'bg-orange-500/20' :
                          item.type === 'ifta' ? 'bg-green-500/20' :
                          item.type === 'invoice' ? 'bg-purple-500/20' : 'bg-blue-500/20'
                        }`}>
                          {getHistoryIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {getHistoryTitle(item)}
                          </p>
                          <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {getHistorySubtitle(item)}
                          </p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {formatDate(item.created_at)}
                          </p>
                        </div>
                        <ExternalLink className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                      </button>

                      {/* Action bar */}
                      <div className={`flex border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <button
                          onClick={() => downloadItem(item)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium transition ${
                            isDark
                              ? 'text-gray-400 hover:text-white hover:bg-dark-200'
                              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                          }`}
                          title="Download summary"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Refresh Button */}
              <button
                onClick={fetchHistory}
                className={`w-full mt-4 py-2 text-sm font-medium rounded-lg transition ${
                  isDark 
                    ? 'bg-dark-400 text-gray-300 hover:bg-dark-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                data-testid="refresh-history"
              >
                Refresh History
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
