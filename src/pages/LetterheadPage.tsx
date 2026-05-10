import React, { useState, useRef, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Printer, Download, Upload, X, LayoutTemplate, RefreshCw, Check } from 'lucide-react';
import BackToTools from '../components/BackToTools';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ── Types ──────────────────────────────────────────────────────────── */
interface LetterheadData {
  companyName: string; tagline: string; address: string;
  cityStateZip: string; phone: string; email: string;
  website: string; accentColor: string; logo: string;
}
type TemplateId = 'bold' | 'classic' | 'minimal' | 'corporate' | 'modern' | 'executive' | 'split';

const TEMPLATES: Array<{ id: TemplateId; name: string; hint: string; wordNote?: string }> = [
  { id: 'bold',      name: 'Bold',      hint: 'Full colored header' },
  { id: 'classic',   name: 'Classic',   hint: 'Centered & timeless' },
  { id: 'minimal',   name: 'Minimal',   hint: 'Clean typography' },
  { id: 'corporate', name: 'Corporate', hint: 'Left sidebar', wordNote: 'Best as PDF' },
  { id: 'modern',    name: 'Modern',    hint: 'Accent left stripe' },
  { id: 'executive', name: 'Executive', hint: 'Premium double rule' },
  { id: 'split',     name: 'Split',     hint: 'Two-tone header' },
];

const defaults: LetterheadData = {
  companyName: '', tagline: '', address: '', cityStateZip: '',
  phone: '', email: '', website: '', accentColor: '#dc2626', logo: '',
};

const TODAY = new Date().toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

/* ── Shared preview body ────────────────────────────────────────────── */
function BodySection({ pad = '32px' }: { pad?: string }) {
  return (
    <div style={{ padding: `36px ${pad}`, flex: 1, minHeight: '200px' }}>
      <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '28px' }}>{TODAY}</div>
      <div style={{ fontSize: '12px', color: '#555', marginBottom: '0' }}>Dear Sir/Madam,</div>
    </div>
  );
}

/* ── 7 Preview Components ───────────────────────────────────────────── */
function BoldPreview({ d }: { d: LetterheadData }) {
  return (
    <div style={{ background: '#fff', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ background: d.accentColor, padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {d.logo && <img src={d.logo} alt="" style={{ height: '48px', objectFit: 'contain' }} />}
          <div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: d.companyName ? '#fff' : 'rgba(255,255,255,0.4)', fontStyle: d.companyName ? 'normal' : 'italic' }}>
              {d.companyName || 'Your Company Name'}
            </div>
            {d.tagline && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '2px' }}>{d.tagline}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '11px', color: 'rgba(255,255,255,0.9)', lineHeight: '1.7' }}>
          {d.phone && <div>{d.phone}</div>}{d.email && <div>{d.email}</div>}{d.website && <div>{d.website}</div>}
        </div>
      </div>
      <div style={{ height: '5px', background: `linear-gradient(to right,${d.accentColor}cc,${d.accentColor}22)` }} />
      {(d.address || d.cityStateZip) && (
        <div style={{ padding: '8px 32px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '11px', color: '#666' }}>
          {[d.address, d.cityStateZip].filter(Boolean).join(' · ')}
        </div>
      )}
      <BodySection />
      <div style={{ borderTop: `3px solid ${d.accentColor}`, padding: '10px 32px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#999' }}>
        <span style={{ fontWeight: 700, color: '#555' }}>{d.companyName}</span>
        <span>{[d.address, d.cityStateZip].filter(Boolean).join(', ')}</span>
        <span>{[d.phone, d.email].filter(Boolean).join(' | ')}</span>
      </div>
    </div>
  );
}

function ClassicPreview({ d }: { d: LetterheadData }) {
  return (
    <div style={{ background: '#fff', fontFamily: 'Georgia, serif', display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ padding: '32px 32px 20px', textAlign: 'center' }}>
        {d.logo && <img src={d.logo} alt="" style={{ height: '52px', objectFit: 'contain', display: 'block', margin: '0 auto 12px' }} />}
        <div style={{ fontSize: '26px', fontWeight: 700, color: d.companyName ? '#111' : '#bbb', fontStyle: d.companyName ? 'normal' : 'italic' }}>
          {d.companyName || 'Your Company Name'}
        </div>
        {d.tagline && <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{d.tagline}</div>}
        <div style={{ width: '60px', height: '3px', background: d.accentColor, margin: '16px auto 12px', borderRadius: '2px' }} />
        <div style={{ fontSize: '11px', color: '#666', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {[d.address, d.cityStateZip, d.phone, d.email, d.website].filter(Boolean).map((v, i) => <span key={i}>{v}</span>)}
        </div>
      </div>
      <div style={{ height: '1px', background: '#e5e7eb', margin: '0 32px' }} />
      <BodySection />
      <div style={{ borderTop: `2px solid ${d.accentColor}`, padding: '10px 32px', textAlign: 'center', fontSize: '10px', color: '#999' }}>
        {d.companyName}{d.website ? ` · ${d.website}` : ''}
      </div>
    </div>
  );
}

function MinimalPreview({ d }: { d: LetterheadData }) {
  return (
    <div style={{ background: '#fff', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ height: '4px', background: d.accentColor }} />
      <div style={{ padding: '28px 32px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {d.logo && <img src={d.logo} alt="" style={{ height: '44px', objectFit: 'contain' }} />}
          <div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: d.companyName ? '#111' : '#bbb', fontStyle: d.companyName ? 'normal' : 'italic', letterSpacing: '-0.5px' }}>
              {d.companyName || 'Your Company Name'}
            </div>
            {d.tagline && <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{d.tagline}</div>}
            {(d.address || d.cityStateZip) && <div style={{ fontSize: '10px', color: '#bbb', marginTop: '4px' }}>{[d.address, d.cityStateZip].filter(Boolean).join(', ')}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '11px', color: '#666', lineHeight: '1.7', marginTop: '4px' }}>
          {d.phone && <div>{d.phone}</div>}{d.email && <div>{d.email}</div>}{d.website && <div>{d.website}</div>}
        </div>
      </div>
      <div style={{ height: '1px', background: '#e5e7eb', margin: '0 32px' }} />
      <BodySection />
      <div style={{ height: '2px', background: d.accentColor }} />
      <div style={{ padding: '8px 32px', fontSize: '10px', color: '#aaa', textAlign: 'right' }}>
        {[d.companyName, d.phone, d.email].filter(Boolean).join(' · ')}
      </div>
    </div>
  );
}

function CorporatePreview({ d }: { d: LetterheadData }) {
  return (
    <div style={{ background: '#fff', fontFamily: 'Arial, sans-serif', display: 'flex', flex: 1, minHeight: '600px' }}>
      <div style={{ width: '155px', minWidth: '155px', background: d.accentColor, padding: '28px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        {d.logo && <img src={d.logo} alt="" style={{ height: '48px', objectFit: 'contain', marginBottom: '4px' }} />}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.3)', width: '100%' }} />
        <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff', textAlign: 'center', lineHeight: '1.3', wordBreak: 'break-word' }}>{d.companyName || 'Company'}</div>
        {d.tagline && <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>{d.tagline}</div>}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.3)', width: '100%' }} />
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.9', textAlign: 'center' }}>
          {d.phone && <div>{d.phone}</div>}
          {d.email && <div style={{ wordBreak: 'break-all' }}>{d.email}</div>}
          {d.website && <div>{d.website}</div>}
        </div>
        {(d.address || d.cityStateZip) && (
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 'auto', paddingTop: '16px' }}>
            {d.address && <div>{d.address}</div>}{d.cityStateZip && <div>{d.cityStateZip}</div>}
          </div>
        )}
      </div>
      <div style={{ flex: 1, padding: '28px 24px', minHeight: '480px' }}>
        <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '28px' }}>{TODAY}</div>
        <div style={{ fontSize: '12px', color: '#555' }}>Dear Sir/Madam,</div>
      </div>
    </div>
  );
}

function ModernPreview({ d }: { d: LetterheadData }) {
  return (
    <div style={{ background: '#fff', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ width: '6px', background: d.accentColor, flexShrink: 0 }} />
        <div style={{ flex: 1, padding: '28px 28px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {d.logo && <img src={d.logo} alt="" style={{ height: '44px', objectFit: 'contain' }} />}
            <div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: d.companyName ? '#111' : '#bbb', fontStyle: d.companyName ? 'normal' : 'italic' }}>
                {d.companyName || 'Your Company Name'}
              </div>
              {d.tagline && <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{d.tagline}</div>}
              {(d.address || d.cityStateZip) && <div style={{ fontSize: '10px', color: '#bbb', marginTop: '4px' }}>{[d.address, d.cityStateZip].filter(Boolean).join(', ')}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '11px', color: '#555', lineHeight: '1.8', borderLeft: '1px solid #e5e7eb', paddingLeft: '20px' }}>
            {d.phone && <div>{d.phone}</div>}
            {d.email && <div>{d.email}</div>}
            {d.website && <div style={{ color: d.accentColor }}>{d.website}</div>}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ width: '6px', background: `${d.accentColor}33`, flexShrink: 0 }} />
        <div style={{ flex: 1, padding: '32px 28px', minHeight: '480px' }}>
          <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '28px' }}>{TODAY}</div>
          <div style={{ fontSize: '12px', color: '#555' }}>Dear Sir/Madam,</div>
        </div>
      </div>
      <div style={{ display: 'flex' }}>
        <div style={{ width: '6px', background: d.accentColor, flexShrink: 0 }} />
        <div style={{ flex: 1, padding: '8px 28px', fontSize: '10px', color: '#999', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb' }}>
          <span style={{ fontWeight: 700, color: '#555' }}>{d.companyName}</span>
          <span>{[d.phone, d.email].filter(Boolean).join(' | ')}</span>
        </div>
      </div>
    </div>
  );
}

function ExecutivePreview({ d }: { d: LetterheadData }) {
  return (
    <div style={{ background: '#fff', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ padding: '32px 32px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {d.logo && <img src={d.logo} alt="" style={{ height: '52px', objectFit: 'contain' }} />}
            <div>
              <div style={{ fontSize: '30px', fontWeight: 900, color: d.companyName ? '#111' : '#bbb', fontStyle: d.companyName ? 'normal' : 'italic', letterSpacing: '-0.5px' }}>
                {d.companyName || 'Your Company Name'}
              </div>
              {d.tagline && <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{d.tagline}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '11px', color: '#444', lineHeight: '1.9', borderRight: `4px solid ${d.accentColor}`, paddingRight: '14px' }}>
            {d.phone && <div>{d.phone}</div>}{d.email && <div>{d.email}</div>}{d.website && <div>{d.website}</div>}
            {(d.address || d.cityStateZip) && <div style={{ color: '#999', fontSize: '10px', marginTop: '4px' }}>{[d.address, d.cityStateZip].filter(Boolean).join(', ')}</div>}
          </div>
        </div>
        <div style={{ height: '2px', background: '#111', marginBottom: '3px' }} />
        <div style={{ height: '4px', background: d.accentColor }} />
      </div>
      <BodySection />
      <div style={{ padding: '8px 32px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#999', borderTop: '1px solid #e5e7eb' }}>
        <span style={{ fontWeight: 700, color: '#555' }}>{d.companyName}</span>
        <span>{d.website}</span>
      </div>
    </div>
  );
}

function SplitPreview({ d }: { d: LetterheadData }) {
  return (
    <div style={{ background: '#fff', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ display: 'flex', height: '120px' }}>
        <div style={{ flex: '0 0 45%', background: '#1f2937', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px 24px' }}>
          {d.logo && <img src={d.logo} alt="" style={{ height: '32px', objectFit: 'contain', objectPosition: 'left', marginBottom: '8px' }} />}
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{d.companyName || 'Company Name'}</div>
          {d.tagline && <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '3px' }}>{d.tagline}</div>}
        </div>
        <div style={{ flex: 1, background: d.accentColor, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px 24px', textAlign: 'right' }}>
          {d.phone && <div style={{ fontSize: '11px', color: '#fff', marginBottom: '3px' }}>{d.phone}</div>}
          {d.email && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)' }}>{d.email}</div>}
          {d.website && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', marginTop: '3px' }}>{d.website}</div>}
        </div>
      </div>
      {(d.address || d.cityStateZip) && (
        <div style={{ padding: '6px 24px', background: '#f9fafb', fontSize: '10px', color: '#666', borderBottom: '1px solid #e5e7eb' }}>
          {[d.address, d.cityStateZip].filter(Boolean).join(' · ')}
        </div>
      )}
      <div style={{ padding: '32px 32px', flex: 1, minHeight: '200px' }}>
        <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '28px' }}>{TODAY}</div>
        <div style={{ fontSize: '12px', color: '#555' }}>Dear Sir/Madam,</div>
      </div>
      <div style={{ display: 'flex', height: '28px' }}>
        <div style={{ flex: '0 0 45%', background: '#1f2937', display: 'flex', alignItems: 'center', paddingLeft: '24px' }}>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)' }}>{d.companyName}</span>
        </div>
        <div style={{ flex: 1, background: d.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '24px' }}>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)' }}>{d.email || d.phone}</span>
        </div>
      </div>
    </div>
  );
}

function TemplatePreview({ id, d }: { id: TemplateId; d: LetterheadData }) {
  switch (id) {
    case 'bold':      return <BoldPreview d={d} />;
    case 'classic':   return <ClassicPreview d={d} />;
    case 'minimal':   return <MinimalPreview d={d} />;
    case 'corporate': return <CorporatePreview d={d} />;
    case 'modern':    return <ModernPreview d={d} />;
    case 'executive': return <ExecutivePreview d={d} />;
    case 'split':     return <SplitPreview d={d} />;
  }
}

/* ── HTML Export ────────────────────────────────────────────────────── */
const TODAY_STR = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const BODY_HTML = (pad = '40px') => `<div style="flex:1;padding:48px ${pad} 40px;min-height:200mm"><div style="font-size:11px;color:#aaa;margin-bottom:28px">${TODAY_STR}</div><div style="font-size:13px;color:#555;margin-bottom:20px">Dear Sir/Madam,</div></div>`;

function wrapDoc(body: string, title: string, forWord: boolean) {
  const ns = forWord ? `xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'` : '';
  const meta = forWord ? `<xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument><w:Sect><w:pgSz w:w="11907" w:h="16839"/><w:pgMar w:top="0" w:right="0" w:bottom="0" w:left="0" w:header="0" w:footer="0" w:gutter="0"/></w:Sect></xml>` : '';
  return `<!DOCTYPE html><html ${ns}><head><meta charset="utf-8"><title>${esc(title)}</title>${meta}
<style>@page{size:A4;margin:0}*{box-sizing:border-box;margin:0;padding:0}html,body{margin:0;padding:0;width:100%}body{font-family:Arial,sans-serif;background:#fff;color:#111}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>
</head><body>${body}</body></html>`;
}

function buildBoldHTML(d: LetterheadData, fw: boolean) {
  return wrapDoc(`<div style="background:#fff;display:flex;flex-direction:column;min-height:297mm;width:100%">
  <div style="background:${d.accentColor};padding:24px 40px;display:flex;align-items:center;justify-content:space-between;gap:20px">
    <div style="display:flex;align-items:center;gap:14px">
      ${d.logo ? `<img src="${d.logo}" style="height:52px;width:auto;object-fit:contain">` : ''}
      <div>${d.companyName ? `<div style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.3px">${esc(d.companyName)}</div>` : ''}
      ${d.tagline ? `<div style="font-size:10px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.12em;margin-top:3px">${esc(d.tagline)}</div>` : ''}</div>
    </div>
    <div style="text-align:right;font-size:11px;color:rgba(255,255,255,0.9);line-height:1.7">
      ${d.phone ? `<div>${esc(d.phone)}</div>` : ''}${d.email ? `<div>${esc(d.email)}</div>` : ''}${d.website ? `<div>${esc(d.website)}</div>` : ''}
    </div>
  </div>
  <div style="height:5px;background:linear-gradient(to right,${d.accentColor}cc,${d.accentColor}22)"></div>
  ${(d.address || d.cityStateZip) ? `<div style="padding:8px 40px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-size:11px;color:#666">${[d.address,d.cityStateZip].filter(Boolean).map(esc).join(' &bull; ')}</div>` : ''}
  ${BODY_HTML()}
  <div style="border-top:3px solid ${d.accentColor};padding:12px 40px;display:flex;align-items:center;justify-content:space-between;font-size:10px;color:#999">
    <span style="font-weight:700;color:#555">${esc(d.companyName)}</span>
    <span>${[d.address,d.cityStateZip].filter(Boolean).map(esc).join(', ')}</span>
    <span>${[d.phone,d.email].filter(Boolean).map(esc).join(' | ')}</span>
  </div>
</div>`, d.companyName || 'Letterhead', fw);
}

function buildClassicHTML(d: LetterheadData, fw: boolean) {
  return wrapDoc(`<div style="background:#fff;font-family:Georgia,serif;display:flex;flex-direction:column;min-height:297mm;width:100%">
  <div style="padding:32px 40px 20px;text-align:center">
    ${d.logo ? `<img src="${d.logo}" style="height:56px;width:auto;object-fit:contain;display:block;margin:0 auto 12px">` : ''}
    <div style="font-size:28px;font-weight:700;color:#111;letter-spacing:0.02em">${esc(d.companyName)}</div>
    ${d.tagline ? `<div style="font-size:11px;color:#888;margin-top:4px;letter-spacing:0.15em;text-transform:uppercase">${esc(d.tagline)}</div>` : ''}
    <div style="width:60px;height:3px;background:${d.accentColor};margin:16px auto 12px;border-radius:2px"></div>
    <div style="font-size:11px;color:#666;display:flex;justify-content:center;gap:16px;flex-wrap:wrap">
      ${[d.address,d.cityStateZip,d.phone,d.email,d.website].filter(Boolean).map(v=>`<span>${esc(v)}</span>`).join('')}
    </div>
  </div>
  <div style="height:1px;background:#e5e7eb;margin:0 40px"></div>
  ${BODY_HTML()}
  <div style="border-top:2px solid ${d.accentColor};padding:12px 40px;text-align:center;font-size:10px;color:#999">
    ${esc(d.companyName)}${d.website ? ` &middot; ${esc(d.website)}` : ''}
  </div>
</div>`, d.companyName || 'Letterhead', fw);
}

function buildMinimalHTML(d: LetterheadData, fw: boolean) {
  return wrapDoc(`<div style="background:#fff;display:flex;flex-direction:column;min-height:297mm;width:100%">
  <div style="height:4px;background:${d.accentColor}"></div>
  <div style="padding:28px 40px 16px;display:flex;align-items:flex-start;justify-content:space-between;gap:20px">
    <div style="display:flex;align-items:center;gap:12px">
      ${d.logo ? `<img src="${d.logo}" style="height:48px;width:auto;object-fit:contain">` : ''}
      <div>
        <div style="font-size:30px;font-weight:900;color:#111;letter-spacing:-0.5px">${esc(d.companyName)}</div>
        ${d.tagline ? `<div style="font-size:11px;color:#888;margin-top:2px">${esc(d.tagline)}</div>` : ''}
        ${(d.address||d.cityStateZip)?`<div style="font-size:10px;color:#bbb;margin-top:4px">${[d.address,d.cityStateZip].filter(Boolean).map(esc).join(', ')}</div>`:''}
      </div>
    </div>
    <div style="text-align:right;font-size:11px;color:#666;line-height:1.7;margin-top:4px">
      ${d.phone?`<div>${esc(d.phone)}</div>`:''}${d.email?`<div>${esc(d.email)}</div>`:''}${d.website?`<div>${esc(d.website)}</div>`:''}
    </div>
  </div>
  <div style="height:1px;background:#e5e7eb;margin:0 40px"></div>
  ${BODY_HTML()}
  <div style="height:2px;background:${d.accentColor}"></div>
  <div style="padding:8px 40px;font-size:10px;color:#aaa;text-align:right">
    ${[d.companyName,d.phone,d.email].filter(Boolean).map(esc).join(' &middot; ')}
  </div>
</div>`, d.companyName || 'Letterhead', fw);
}

function buildCorporateHTML(d: LetterheadData, fw: boolean) {
  return wrapDoc(`<div style="background:#fff;display:flex;min-height:297mm;width:100%">
  <div style="width:160px;min-width:160px;background:${d.accentColor};padding:32px 18px;display:flex;flex-direction:column;align-items:center;gap:12px">
    ${d.logo?`<img src="${d.logo}" style="height:52px;width:auto;object-fit:contain;margin-bottom:4px">`:''}
    <div style="height:1px;background:rgba(255,255,255,0.3);width:100%"></div>
    <div style="font-size:15px;font-weight:900;color:#fff;text-align:center;line-height:1.3;word-break:break-word">${esc(d.companyName)}</div>
    ${d.tagline?`<div style="font-size:9px;color:rgba(255,255,255,0.65);text-transform:uppercase;letter-spacing:0.1em;text-align:center">${esc(d.tagline)}</div>`:''}
    <div style="height:1px;background:rgba(255,255,255,0.3);width:100%"></div>
    <div style="font-size:10px;color:rgba(255,255,255,0.85);line-height:1.9;text-align:center">
      ${d.phone?`<div>${esc(d.phone)}</div>`:''}${d.email?`<div style="word-break:break-all">${esc(d.email)}</div>`:''}${d.website?`<div>${esc(d.website)}</div>`:''}
    </div>
    ${(d.address||d.cityStateZip)?`<div style="font-size:9px;color:rgba(255,255,255,0.55);text-align:center;margin-top:auto;padding-top:16px">${d.address?`<div>${esc(d.address)}</div>`:''}${d.cityStateZip?`<div>${esc(d.cityStateZip)}</div>`:''}</div>`:''}
  </div>
  ${BODY_HTML('28px')}
</div>`, d.companyName || 'Letterhead', fw);
}

function buildModernHTML(d: LetterheadData, fw: boolean) {
  return wrapDoc(`<div style="background:#fff;display:flex;flex-direction:column;min-height:297mm;width:100%">
  <div style="display:flex;border-bottom:1px solid #e5e7eb">
    <div style="width:6px;background:${d.accentColor};flex-shrink:0"></div>
    <div style="flex:1;padding:28px 28px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px">
      <div style="display:flex;align-items:center;gap:14px">
        ${d.logo?`<img src="${d.logo}" style="height:48px;width:auto;object-fit:contain">`:''}
        <div>
          <div style="font-size:26px;font-weight:900;color:#111;letter-spacing:-0.3px">${esc(d.companyName)}</div>
          ${d.tagline?`<div style="font-size:11px;color:#888;margin-top:2px">${esc(d.tagline)}</div>`:''}
          ${(d.address||d.cityStateZip)?`<div style="font-size:10px;color:#bbb;margin-top:4px">${[d.address,d.cityStateZip].filter(Boolean).map(esc).join(', ')}</div>`:''}
        </div>
      </div>
      <div style="text-align:right;font-size:11px;color:#555;line-height:1.8;border-left:1px solid #e5e7eb;padding-left:20px">
        ${d.phone?`<div>${esc(d.phone)}</div>`:''}${d.email?`<div>${esc(d.email)}</div>`:''}${d.website?`<div style="color:${d.accentColor}">${esc(d.website)}</div>`:''}
      </div>
    </div>
  </div>
  <div style="display:flex;flex:1">
    <div style="width:6px;background:${d.accentColor}33;flex-shrink:0"></div>
    ${BODY_HTML('28px')}
  </div>
  <div style="display:flex">
    <div style="width:6px;background:${d.accentColor};flex-shrink:0"></div>
    <div style="flex:1;padding:8px 28px;font-size:10px;color:#999;display:flex;justify-content:space-between;border-top:1px solid #e5e7eb">
      <span style="font-weight:700;color:#555">${esc(d.companyName)}</span>
      <span>${[d.phone,d.email].filter(Boolean).map(esc).join(' | ')}</span>
    </div>
  </div>
</div>`, d.companyName || 'Letterhead', fw);
}

function buildExecutiveHTML(d: LetterheadData, fw: boolean) {
  return wrapDoc(`<div style="background:#fff;display:flex;flex-direction:column;min-height:297mm;width:100%">
  <div style="padding:32px 40px 0">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:14px">
        ${d.logo?`<img src="${d.logo}" style="height:56px;width:auto;object-fit:contain">`:''}
        <div>
          <div style="font-size:32px;font-weight:900;color:#111;letter-spacing:-0.5px">${esc(d.companyName)}</div>
          ${d.tagline?`<div style="font-size:11px;color:#888;margin-top:4px;letter-spacing:0.1em;text-transform:uppercase">${esc(d.tagline)}</div>`:''}
        </div>
      </div>
      <div style="text-align:right;font-size:11px;color:#444;line-height:1.9;border-right:4px solid ${d.accentColor};padding-right:14px">
        ${d.phone?`<div>${esc(d.phone)}</div>`:''}${d.email?`<div>${esc(d.email)}</div>`:''}${d.website?`<div>${esc(d.website)}</div>`:''}
        ${(d.address||d.cityStateZip)?`<div style="color:#999;font-size:10px;margin-top:4px">${[d.address,d.cityStateZip].filter(Boolean).map(esc).join(', ')}</div>`:''}
      </div>
    </div>
    <div style="height:2px;background:#111;margin-bottom:3px"></div>
    <div style="height:4px;background:${d.accentColor}"></div>
  </div>
  ${BODY_HTML()}
  <div style="padding:8px 40px;display:flex;justify-content:space-between;font-size:10px;color:#999;border-top:1px solid #e5e7eb">
    <span style="font-weight:700;color:#555">${esc(d.companyName)}</span>
    <span>${esc(d.website)}</span>
  </div>
</div>`, d.companyName || 'Letterhead', fw);
}

function buildSplitHTML(d: LetterheadData, fw: boolean) {
  return wrapDoc(`<div style="background:#fff;display:flex;flex-direction:column;min-height:297mm;width:100%">
  <div style="display:flex;height:130px">
    <div style="flex:0 0 45%;background:#1f2937;display:flex;flex-direction:column;justify-content:center;padding:20px 28px">
      ${d.logo?`<img src="${d.logo}" style="height:34px;width:auto;object-fit:contain;object-position:left;margin-bottom:8px">`:''}
      <div style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-0.3px">${esc(d.companyName)}</div>
      ${d.tagline?`<div style="font-size:9px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.1em;margin-top:3px">${esc(d.tagline)}</div>`:''}
    </div>
    <div style="flex:1;background:${d.accentColor};display:flex;flex-direction:column;justify-content:center;padding:20px 28px;text-align:right">
      ${d.phone?`<div style="font-size:11px;color:#fff;margin-bottom:3px">${esc(d.phone)}</div>`:''}
      ${d.email?`<div style="font-size:11px;color:rgba(255,255,255,0.85)">${esc(d.email)}</div>`:''}
      ${d.website?`<div style="font-size:11px;color:rgba(255,255,255,0.85);margin-top:3px">${esc(d.website)}</div>`:''}
    </div>
  </div>
  ${(d.address||d.cityStateZip)?`<div style="padding:6px 28px;background:#f9fafb;font-size:10px;color:#666;border-bottom:1px solid #e5e7eb">${[d.address,d.cityStateZip].filter(Boolean).map(esc).join(' &bull; ')}</div>`:''}
  ${BODY_HTML()}
  <div style="display:flex;height:30px">
    <div style="flex:0 0 45%;background:#1f2937;display:flex;align-items:center;padding-left:28px">
      <span style="font-size:9px;color:rgba(255,255,255,0.6)">${esc(d.companyName)}</span>
    </div>
    <div style="flex:1;background:${d.accentColor};display:flex;align-items:center;justify-content:flex-end;padding-right:28px">
      <span style="font-size:9px;color:rgba(255,255,255,0.7)">${esc(d.email||d.phone)}</span>
    </div>
  </div>
</div>`, d.companyName || 'Letterhead', fw);
}

function buildWordHTML(id: TemplateId, d: LetterheadData): string {
  const ac = d.accentColor;
  const isSplit = id === 'split';

  const header = isSplit
    ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
  <tr>
    <td bgcolor="#1f2937" width="45%" valign="middle" style="background:#1f2937;padding:22px 28px">
      ${d.logo ? `<img src="${d.logo}" height="36" style="display:block;margin-bottom:6px">` : ''}
      <div style="font-size:18pt;font-weight:bold;color:#ffffff;font-family:Arial,sans-serif">${esc(d.companyName)}</div>
      ${d.tagline ? `<div style="font-size:8pt;color:#ffffffaa;margin-top:3px;text-transform:uppercase;font-family:Arial">${esc(d.tagline)}</div>` : ''}
    </td>
    <td bgcolor="${ac}" valign="middle" style="background:${ac};padding:22px 28px;text-align:right">
      <div style="font-size:11pt;color:#ffffff;font-family:Arial,sans-serif;line-height:1.7">
        ${d.phone ? `${esc(d.phone)}<br>` : ''}${d.email ? `${esc(d.email)}<br>` : ''}${d.website ? esc(d.website) : ''}
      </div>
    </td>
  </tr>
</table>`
    : `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
  <tr>
    <td bgcolor="${ac}" valign="middle" style="background:${ac};padding:22px 32px">
      ${d.logo ? `<img src="${d.logo}" height="44" style="display:block;margin-bottom:8px">` : ''}
      <div style="font-size:22pt;font-weight:bold;color:#ffffff;font-family:Arial,sans-serif">${esc(d.companyName)}</div>
      ${d.tagline ? `<div style="font-size:9pt;color:#ffffffcc;margin-top:3px;text-transform:uppercase;font-family:Arial">${esc(d.tagline)}</div>` : ''}
    </td>
    <td bgcolor="${ac}" valign="middle" style="background:${ac};padding:22px 32px;text-align:right">
      <div style="font-size:11pt;color:#ffffff;font-family:Arial,sans-serif;line-height:1.8">
        ${d.phone ? `${esc(d.phone)}<br>` : ''}${d.email ? `${esc(d.email)}<br>` : ''}${d.website ? esc(d.website) : ''}
      </div>
    </td>
  </tr>
</table>`;

  const addressRow = (d.address || d.cityStateZip) ? `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background:#f9fafb;border-bottom:1px solid #e5e7eb">
  <tr><td style="padding:7px 32px;font-size:10pt;color:#666;font-family:Arial,sans-serif">
    ${[d.address, d.cityStateZip].filter(Boolean).map(esc).join(' &bull; ')}
  </td></tr>
</table>` : '';

  const body = `
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td valign="top" style="padding:48px 32px 40px;font-family:Arial,sans-serif;height:580pt;mso-height-source:userset;vertical-align:top">
    <div style="font-size:10pt;color:#aaaaaa;margin-bottom:24px">${TODAY_STR}</div>
    <div style="font-size:12pt;color:#555555">Dear Sir/Madam,</div>
  </td></tr>
</table>`;

  const footer = `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:2px solid ${ac}">
  <tr>
    <td style="padding:8px 32px;font-size:9pt;font-family:Arial,sans-serif;font-weight:bold;color:#555555">${esc(d.companyName)}</td>
    <td style="padding:8px 32px;font-size:9pt;font-family:Arial,sans-serif;color:#999999;text-align:right">${[d.phone, d.email].filter(Boolean).map(esc).join(' | ')}</td>
  </tr>
</table>`;

  return wrapDoc(`${header}${addressRow}${body}${footer}`, d.companyName || 'Letterhead', true);
}

function buildHTML(id: TemplateId, d: LetterheadData, forWord: boolean): string {
  if (forWord) return buildWordHTML(id, d);
  switch (id) {
    case 'bold':      return buildBoldHTML(d, false);
    case 'classic':   return buildClassicHTML(d, false);
    case 'minimal':   return buildMinimalHTML(d, false);
    case 'corporate': return buildCorporateHTML(d, false);
    case 'modern':    return buildModernHTML(d, false);
    case 'executive': return buildExecutiveHTML(d, false);
    case 'split':     return buildSplitHTML(d, false);
  }
}

/* ── Component ──────────────────────────────────────────────────────── */
const LetterheadPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const logoRef = useRef<HTMLInputElement>(null);

  const [template, setTemplate] = useState<TemplateId>('bold');
  const [data, setData] = useState<LetterheadData>(() => ({
    ...defaults,
    logo: localStorage.getItem('integra_company_logo') || '',
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
    const html = buildHTML(template, data, false);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    setTimeout(() => { win?.print(); URL.revokeObjectURL(url); }, 500);
  };

  const downloadWord = () => {
    const html = buildHTML(template, data, true);
    const blob = new Blob(['﻿', html], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${(data.companyName || 'letterhead').replace(/\s+/g, '_')}_letterhead.doc`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  /* Thumbnail dimensions */
  const INNER_W = 700;
  const SCALE   = 175 / INNER_W;
  const THUMB_W = 175;
  const THUMB_H = 116;

  /* Styles */
  const inp = isDark
    ? 'w-full px-3 py-2 text-sm rounded-lg border border-gray-600 bg-dark-300 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500'
    : 'w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500';
  const lbl  = isDark ? 'block text-xs font-semibold text-gray-400 mb-1' : 'block text-xs font-semibold text-gray-500 mb-1';
  const card = isDark ? 'bg-dark-200 border border-gray-700 rounded-xl' : 'bg-white border border-gray-200 rounded-xl';

  /* Sample data for thumbnails — use real values if entered, otherwise placeholders */
  const thumbData: LetterheadData = {
    companyName:  data.companyName  || 'Acme Logistics',
    tagline:      data.tagline      || 'Moving the World Forward',
    address:      data.address      || '123 Logistics Ave',
    cityStateZip: data.cityStateZip || 'Toronto, ON M5H 2N2',
    phone:        data.phone        || '+1 (416) 555-0100',
    email:        data.email        || 'hello@acme.ca',
    website:      data.website      || 'www.acme.ca',
    accentColor:  data.accentColor,
    logo:         data.logo,
  };

  return (
    <div className={`min-h-screen py-8 px-4 ${isDark ? 'bg-dark-300' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        <BackToTools />

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 mt-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/20">
            <LayoutTemplate className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Letterhead Generator</h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Choose a template · Customize · Download as PDF or Word</p>
          </div>
        </div>

        {/* ── Template Picker ── */}
        <div className={`${card} p-5 mb-6`}>
          <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Step 1 — Choose a Template
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {TEMPLATES.map(t => {
              const active = template === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                    active
                      ? 'border-red-500 shadow-[0_0_0_3px_rgba(220,38,38,0.2)]'
                      : isDark ? 'border-gray-700 hover:border-gray-500' : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ width: `${THUMB_W}px` }}
                >
                  {/* Scaled thumbnail */}
                  <div style={{ width: `${THUMB_W}px`, height: `${THUMB_H}px`, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ width: `${INNER_W}px`, transformOrigin: 'top left', transform: `scale(${SCALE})`, pointerEvents: 'none' }}>
                      <TemplatePreview id={t.id} d={thumbData} />
                    </div>
                  </div>
                  {/* Label */}
                  <div className={`px-3 py-2 flex items-center justify-between ${isDark ? 'bg-dark-300' : 'bg-gray-50'}`}>
                    <div>
                      <p className={`text-xs font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{t.name}</p>
                      <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t.hint}</p>
                    </div>
                    {active && <Check className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                  </div>
                  {t.wordNote && (
                    <div className={`px-3 pb-2 text-[9px] ${isDark ? 'text-yellow-600' : 'text-yellow-700'}`}>{t.wordNote}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Form + Preview ── */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left: form */}
          <div className={`lg:w-80 shrink-0 ${card} p-5 space-y-4 self-start`}>
            <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Step 2 — Company Details</p>

            {/* Logo */}
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
                  <p className={`text-xs font-semibold truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{data.logo ? 'Change logo' : 'Upload logo'}</p>
                  <p className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>PNG, JPG · Max 2 MB</p>
                </div>
                {data.logo && (
                  <button onClick={e => { e.stopPropagation(); set('logo', ''); }} className={`ml-auto shrink-0 ${isDark ? 'text-gray-600 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>

            <div><label className={lbl}>Company Name *</label><input className={inp} value={data.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Acme Logistics Inc." /></div>
            <div><label className={lbl}>Tagline / Slogan</label><input className={inp} value={data.tagline} onChange={e => set('tagline', e.target.value)} placeholder="Moving the world forward" /></div>
            <div><label className={lbl}>Street Address</label><input className={inp} value={data.address} onChange={e => set('address', e.target.value)} placeholder="123 Logistics Ave, Suite 400" /></div>
            <div><label className={lbl}>City, Province, Postal</label><input className={inp} value={data.cityStateZip} onChange={e => set('cityStateZip', e.target.value)} placeholder="Toronto, ON M5H 2N2" /></div>
            <div><label className={lbl}>Phone</label><input className={inp} value={data.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 (416) 555-0100" /></div>
            <div><label className={lbl}>Email</label><input type="email" className={inp} value={data.email} onChange={e => set('email', e.target.value)} placeholder="hello@company.com" /></div>
            <div><label className={lbl}>Website</label><input className={inp} value={data.website} onChange={e => set('website', e.target.value)} placeholder="www.company.com" /></div>

            <div>
              <label className={lbl}>Accent Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={data.accentColor} onChange={e => set('accentColor', e.target.value)} className="w-10 h-9 rounded cursor-pointer border-0 p-0.5 bg-transparent" />
                <input className={`${inp} flex-1`} value={data.accentColor} onChange={e => set('accentColor', e.target.value)} placeholder="#dc2626" />
                <button onClick={() => set('accentColor', '#dc2626')} title="Reset" className={`shrink-0 p-2 rounded-lg transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Download buttons */}
            <div className="pt-2 space-y-2">
              <button onClick={downloadPDF} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-2.5 rounded-lg transition-colors">
                <Printer className="w-4 h-4" /> Print / Save as PDF
              </button>
              <button onClick={downloadWord} className={`w-full flex items-center justify-center gap-2 font-bold text-sm py-2.5 rounded-lg transition-colors border ${isDark ? 'border-gray-600 text-gray-200 hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                <Download className="w-4 h-4" /> Download Word (.doc)
              </button>
            </div>
          </div>

          {/* Right: live preview — A4 document viewer */}
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Live Preview</p>

            {/* Document viewer chrome */}
            <div className="rounded-xl overflow-hidden" style={{ background: '#3a3a3a', padding: '24px 24px 16px' }}>
              {/* A4 page: 794px wide × 1123px tall at 96dpi — shown full width, scrollable */}
              <div
                style={{
                  background: '#fff',
                  width: '100%',
                  maxWidth: '794px',
                  minHeight: '1123px',
                  margin: '0 auto',
                  boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <TemplatePreview id={template} d={data} />
              </div>
              <p className="text-xs mt-4 text-center" style={{ color: '#888' }}>
                Preview updates live · PDF uses your browser print dialog · Word opens in Microsoft Word, LibreOffice, or Pages
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LetterheadPage;
