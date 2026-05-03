import React, { useState, useRef, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Printer, Download, Upload, X, LayoutTemplate, RefreshCw } from 'lucide-react';
import BackToTools from '../components/BackToTools';

/* ── Helpers ─────────────────────────────────────────────────────────── */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

interface LetterheadData {
  companyName: string;
  tagline: string;
  address: string;
  cityStateZip: string;
  phone: string;
  email: string;
  website: string;
  accentColor: string;
  logo: string;
}

const defaults: LetterheadData = {
  companyName: '',
  tagline: '',
  address: '',
  cityStateZip: '',
  phone: '',
  email: '',
  website: '',
  accentColor: '#dc2626',
  logo: '',
};

function buildHTML(d: LetterheadData, forWord = false): string {
  const wordNS = forWord
    ? `xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'`
    : '';
  const wordMeta = forWord
    ? `<xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml>`
    : '';

  return `<!DOCTYPE html>
<html ${wordNS}>
<head>
<meta charset="utf-8">
<title>${esc(d.companyName || 'Letterhead')}</title>
${wordMeta}
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; background: #fff; color: #111; }

  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    position: relative;
    background: #fff;
  }

  /* ── Header ── */
  .lh-header {
    background: ${d.accentColor};
    padding: 28px 40px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }
  .lh-logo-wrap {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .lh-logo { height: 56px; width: auto; object-fit: contain; }
  .lh-company { font-size: 26px; font-weight: 900; color: #fff; letter-spacing: -0.5px; }
  .lh-tagline { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 3px; text-transform: uppercase; letter-spacing: 0.12em; }
  .lh-contact { text-align: right; font-size: 11px; color: rgba(255,255,255,0.85); line-height: 1.6; }

  /* ── Accent bar ── */
  .lh-bar { height: 5px; background: linear-gradient(to right, ${d.accentColor}cc, ${d.accentColor}22); }

  /* ── Body area ── */
  .lh-body { padding: 48px 40px 40px; min-height: 200mm; }
  .lh-date { font-size: 12px; color: #888; margin-bottom: 32px; }
  .lh-salutation { font-size: 13px; color: #444; margin-bottom: 16px; }
  .lh-content-lines { }
  .lh-line { height: 1px; background: #e5e7eb; margin: 10px 0; }

  /* ── Footer ── */
  .lh-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    border-top: 3px solid ${d.accentColor};
    padding: 12px 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 10px;
    color: #999;
  }
  .lh-footer-company { font-weight: 700; color: #555; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { width: 100%; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="lh-header">
    <div class="lh-logo-wrap">
      ${d.logo ? `<img class="lh-logo" src="${d.logo}" alt="Logo" />` : ''}
      <div>
        ${d.companyName ? `<div class="lh-company">${esc(d.companyName)}</div>` : ''}
        ${d.tagline     ? `<div class="lh-tagline">${esc(d.tagline)}</div>`     : ''}
      </div>
    </div>
    <div class="lh-contact">
      ${d.phone   ? `<div>${esc(d.phone)}</div>`   : ''}
      ${d.email   ? `<div>${esc(d.email)}</div>`   : ''}
      ${d.website ? `<div>${esc(d.website)}</div>` : ''}
    </div>
  </div>
  <div class="lh-bar"></div>

  <!-- Address line -->
  ${d.address || d.cityStateZip ? `
  <div style="padding:10px 40px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-size:11px;color:#666;">
    ${[d.address, d.cityStateZip].filter(Boolean).map(esc).join(' &bull; ')}
  </div>` : ''}

  <!-- Body -->
  <div class="lh-body">
    <div class="lh-date">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
    <div class="lh-salutation">Dear Sir/Madam,</div>
    <div class="lh-content-lines">
      ${Array.from({ length: 22 }, () => '<div class="lh-line"></div>').join('\n      ')}
    </div>
  </div>

  <!-- Footer -->
  <div class="lh-footer">
    <span class="lh-footer-company">${esc(d.companyName || '')}</span>
    <span>${[d.address, d.cityStateZip].filter(Boolean).map(esc).join(', ')}</span>
    <span>${[d.phone, d.email].filter(Boolean).map(esc).join(' | ')}</span>
  </div>

</div>
</body>
</html>`;
}

/* ── Component ───────────────────────────────────────────────────────── */
const LetterheadPage: React.FC = () => {
  const { theme } = useTheme();
  const { } = useAuth();
  const isDark = theme === 'dark';

  const logoRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<LetterheadData>(() => ({
    ...defaults,
    logo: localStorage.getItem('integra_company_logo') || '',
    companyName: '',
  }));

  const set = useCallback((key: keyof LetterheadData, val: string) => {
    setData(d => ({ ...d, [key]: val }));
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Logo must be under 2 MB.'); return; }
    const reader = new FileReader();
    reader.onload = ev => set('logo', ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const downloadPDF = () => {
    const html = buildHTML(data, false);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank');
    setTimeout(() => { win?.print(); URL.revokeObjectURL(url); }, 500);
  };

  const downloadWord = () => {
    const html = buildHTML(data, true);
    const blob = new Blob(['﻿', html], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href     = URL.createObjectURL(blob);
    link.download = `${(data.companyName || 'letterhead').replace(/\s+/g, '_')}_letterhead.doc`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  /* Shared styles */
  const inp = isDark
    ? 'w-full px-3 py-2 text-sm rounded-lg border border-gray-600 bg-dark-300 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500'
    : 'w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500';
  const lbl = isDark ? 'block text-xs font-semibold text-gray-400 mb-1' : 'block text-xs font-semibold text-gray-500 mb-1';
  const card = isDark ? 'bg-dark-200 border border-gray-700 rounded-xl' : 'bg-white border border-gray-200 rounded-xl';

  return (
    <div className={`min-h-screen py-8 px-4 ${isDark ? 'bg-dark-300' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        <BackToTools />

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 mt-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/20">
            <LayoutTemplate className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Letterhead Generator</h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Create a professional company letterhead · Download as PDF or Word</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Left: form ── */}
          <div className={`lg:w-80 shrink-0 ${card} p-5 space-y-4 self-start`}>
            <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Company Details</p>

            {/* Logo upload */}
            <div>
              <label className={lbl}>Company Logo</label>
              <div
                onClick={() => logoRef.current?.click()}
                className={`flex items-center gap-3 p-3 rounded-lg border border-dashed cursor-pointer transition-colors ${
                  isDark ? 'border-gray-600 hover:border-red-500/50 bg-dark-400' : 'border-gray-300 hover:border-red-400 bg-gray-50'
                }`}
              >
                {data.logo ? (
                  <img src={data.logo} alt="logo" className="h-10 w-auto object-contain rounded" />
                ) : (
                  <div className={`w-10 h-10 rounded flex items-center justify-center ${isDark ? 'bg-dark-300' : 'bg-gray-100'}`}>
                    <Upload className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {data.logo ? 'Change logo' : 'Upload logo'}
                  </p>
                  <p className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>PNG, JPG · Max 2 MB</p>
                </div>
                {data.logo && (
                  <button
                    onClick={e => { e.stopPropagation(); set('logo', ''); }}
                    className={`ml-auto shrink-0 ${isDark ? 'text-gray-600 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>

            <div>
              <label className={lbl}>Company Name *</label>
              <input className={inp} value={data.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Acme Logistics Inc." />
            </div>
            <div>
              <label className={lbl}>Tagline / Slogan</label>
              <input className={inp} value={data.tagline} onChange={e => set('tagline', e.target.value)} placeholder="Moving the world forward" />
            </div>
            <div>
              <label className={lbl}>Street Address</label>
              <input className={inp} value={data.address} onChange={e => set('address', e.target.value)} placeholder="123 Logistics Ave, Suite 400" />
            </div>
            <div>
              <label className={lbl}>City, State / Province, ZIP</label>
              <input className={inp} value={data.cityStateZip} onChange={e => set('cityStateZip', e.target.value)} placeholder="Toronto, ON M5H 2N2" />
            </div>
            <div>
              <label className={lbl}>Phone</label>
              <input className={inp} value={data.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 (416) 555-0100" />
            </div>
            <div>
              <label className={lbl}>Email</label>
              <input type="email" className={inp} value={data.email} onChange={e => set('email', e.target.value)} placeholder="hello@company.com" />
            </div>
            <div>
              <label className={lbl}>Website</label>
              <input className={inp} value={data.website} onChange={e => set('website', e.target.value)} placeholder="www.company.com" />
            </div>
            <div>
              <label className={lbl}>Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={data.accentColor}
                  onChange={e => set('accentColor', e.target.value)}
                  className="w-10 h-9 rounded cursor-pointer border-0 p-0.5 bg-transparent"
                />
                <input
                  className={`${inp} flex-1`}
                  value={data.accentColor}
                  onChange={e => set('accentColor', e.target.value)}
                  placeholder="#dc2626"
                />
                <button
                  onClick={() => set('accentColor', '#dc2626')}
                  title="Reset to red"
                  className={`shrink-0 p-2 rounded-lg transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Download buttons */}
            <div className="pt-2 space-y-2">
              <button
                onClick={downloadPDF}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-2.5 rounded-lg transition-colors"
              >
                <Printer className="w-4 h-4" /> Print / Save as PDF
              </button>
              <button
                onClick={downloadWord}
                className={`w-full flex items-center justify-center gap-2 font-bold text-sm py-2.5 rounded-lg transition-colors border ${
                  isDark
                    ? 'border-gray-600 text-gray-200 hover:bg-white/10'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Download className="w-4 h-4" /> Download Word (.doc)
              </button>
            </div>
          </div>

          {/* ── Right: live preview ── */}
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Live Preview</p>
            <div
              className="w-full rounded-xl overflow-hidden shadow-xl"
              style={{ background: '#fff', minHeight: '600px' }}
            >
              {/* Preview header */}
              <div
                style={{ background: data.accentColor, padding: '24px 32px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {data.logo && (
                    <img src={data.logo} alt="Logo" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
                  )}
                  <div>
                    {data.companyName ? (
                      <div style={{ fontSize: '22px', fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{data.companyName}</div>
                    ) : (
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>Your Company Name</div>
                    )}
                    {data.tagline && (
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '2px' }}>{data.tagline}</div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.7' }}>
                  {data.phone   && <div>{data.phone}</div>}
                  {data.email   && <div>{data.email}</div>}
                  {data.website && <div>{data.website}</div>}
                </div>
              </div>

              {/* Accent gradient bar */}
              <div style={{ height: '5px', background: `linear-gradient(to right, ${data.accentColor}cc, ${data.accentColor}22)` }} />

              {/* Address bar */}
              {(data.address || data.cityStateZip) && (
                <div style={{ padding: '8px 32px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '11px', color: '#666' }}>
                  {[data.address, data.cityStateZip].filter(Boolean).join(' · ')}
                </div>
              )}

              {/* Body area */}
              <div style={{ padding: '36px 32px 24px' }}>
                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '24px' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>Dear Sir/Madam,</div>
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} style={{ height: '1px', background: '#e5e7eb', margin: '10px 0' }} />
                ))}
              </div>

              {/* Footer */}
              <div style={{ borderTop: `3px solid ${data.accentColor}`, padding: '10px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: '#999' }}>
                <span style={{ fontWeight: 700, color: '#555' }}>{data.companyName}</span>
                <span>{[data.address, data.cityStateZip].filter(Boolean).join(', ')}</span>
                <span>{[data.phone, data.email].filter(Boolean).join(' | ')}</span>
              </div>
            </div>

            <p className={`text-xs mt-3 text-center ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              Preview updates live as you type · Word download opens in Microsoft Word, LibreOffice, or Pages
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LetterheadPage;
