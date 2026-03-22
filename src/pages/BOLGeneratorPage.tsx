import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface Commodity {
  id: number;
  description: string;
  qty: string;
  weight: string;
  class: string;
}

interface BOLFormState {
  bolNumber: string;
  bolDate: string;
  proNum: string;
  poNum: string;
  sName: string;
  sAddr: string;
  sCity: string;
  sState: string;
  sZip: string;
  sCountry: string;
  sContact: string;
  sPhone: string;
  cName: string;
  cAddr: string;
  cCity: string;
  cState: string;
  cZip: string;
  cCountry: string;
  cContact: string;
  cPhone: string;
  carrierName: string;
  carrierMC: string;
  driverName: string;
  truckNum: string;
  trailerNum: string;
  totalWt: string;
  wtUnit: string;
  fTerms: string;
  declVal: string;
  sHazmat: boolean;
  sLiftgate: boolean;
  sAppt: boolean;
  sRefer: boolean;
  sInside: boolean;
  sResidential: boolean;
  instrTxt: string;
  logoSrc: string;
}

// Helper components defined outside to prevent recreation on re-render
const FormSection = ({ title, children, isDark }: { title: string; children: React.ReactNode; isDark: boolean }) => (
  <div className="mb-8">
    <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 pb-2 border-b ${
      isDark ? 'text-primary-400 border-gray-700' : 'text-primary-600 border-gray-200'
    }`}>
      {title}
    </h3>
    <div className="space-y-4">{children}</div>
  </div>
);

const FormRow = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 gap-4">{children}</div>
);

const FormField = ({ label, children, isDark }: { label: string; children: React.ReactNode; isDark: boolean }) => (
  <div className="flex flex-col">
    <label className={`text-xs font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
      {label}
    </label>
    {children}
  </div>
);

const Input = (props: any & { isDark: boolean }) => {
  const { isDark, ...inputProps } = props;
  return (
    <input
      {...inputProps}
      className={`px-3 py-2 rounded border text-sm ${
        isDark
          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
      } focus:outline-none focus:ring-2 focus:ring-primary-500`}
    />
  );
};

const BOLGeneratorPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [form, setForm] = useState<BOLFormState>({
    bolNumber: '',
    bolDate: new Date().toISOString().split('T')[0],
    proNum: '',
    poNum: '',
    sName: '',
    sAddr: '',
    sCity: '',
    sState: '',
    sZip: '',
    sCountry: 'Canada',
    sContact: '',
    sPhone: '',
    cName: '',
    cAddr: '',
    cCity: '',
    cState: '',
    cZip: '',
    cCountry: 'Canada',
    cContact: '',
    cPhone: '',
    carrierName: '',
    carrierMC: '',
    driverName: '',
    truckNum: '',
    trailerNum: '',
    totalWt: '',
    wtUnit: 'lbs',
    fTerms: 'Prepaid',
    declVal: '',
    sHazmat: false,
    sLiftgate: false,
    sAppt: false,
    sRefer: false,
    sInside: false,
    sResidential: false,
    instrTxt: '',
    logoSrc: '',
  });

  useEffect(() => {
    genBOL();
    addCommodity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const genBOL = () => {
    const d = new Date();
    const newBOL = `BOL-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`;
    setForm((prev) => ({ ...prev, bolNumber: newBOL }));
  };

  const addCommodity = () => {
    const newId = Date.now() + Math.random();
    setCommodities((prev) => [
      ...prev,
      { id: newId, description: '', qty: '', weight: '', class: '' },
    ]);
  };

  const removeCommodity = (id: number) => {
    setCommodities((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCommodity = (id: number, field: keyof Commodity, value: string) => {
    setCommodities((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleInputChange = (field: keyof BOLFormState, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const formatAddr = (
    name: string,
    addr: string,
    city: string,
    state: string,
    zip: string,
    country: string,
    contact: string,
    phone: string
  ) => {
    let html = '';
    if (name) html += `<div style="font-weight:bold;margin-bottom:4px;">${name}</div>`;
    if (addr) html += `<div style="font-size:9px;">Addr: ${addr}</div>`;
    if (city || state || zip) html += `<div style="font-size:9px;">${[city, state, zip].filter(Boolean).join(', ')}</div>`;
    if (country) html += `<div style="font-size:9px;">Country: ${country}</div>`;
    if (contact) html += `<div style="font-size:9px;">Contact: ${contact}</div>`;
    if (phone) html += `<div style="font-size:9px;">Phone: ${phone}</div>`;
    if (!html) html = `<div style="font-style:italic;color:#999;">— Not filled in yet —</div>`;
    return html;
  };

  const clearForm = () => {
    if (window.confirm('Clear all form data? This cannot be undone.')) {
      setForm({
        bolNumber: '',
        bolDate: new Date().toISOString().split('T')[0],
        proNum: '',
        poNum: '',
        sName: '',
        sAddr: '',
        sCity: '',
        sState: '',
        sZip: '',
        sCountry: 'Canada',
        sContact: '',
        sPhone: '',
        cName: '',
        cAddr: '',
        cCity: '',
        cState: '',
        cZip: '',
        cCountry: 'Canada',
        cContact: '',
        cPhone: '',
        carrierName: '',
        carrierMC: '',
        driverName: '',
        truckNum: '',
        trailerNum: '',
        totalWt: '',
        wtUnit: 'lbs',
        fTerms: 'Prepaid',
        declVal: '',
        sHazmat: false,
        sLiftgate: false,
        sAppt: false,
        sRefer: false,
        sInside: false,
        sResidential: false,
        instrTxt: '',
        logoSrc: '',
      });
      setCommodities([]);
      genBOL();
      addCommodity();
    }
  };

  const downloadBOL = () => {
    alert('Opening print dialog — choose "Save as PDF" to download.');
    setTimeout(() => window.print(), 400);
  };

  return (
    <div className={`pt-32 pb-20 px-4 ${isDark ? 'bg-dark-400' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            📋 BOL Generator
          </h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Fill in the details below. Your BOL updates live as you type.
          </p>
        </div>

        {/* Main Layout: Form (left) + Preview (right) */}
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-1">
          {/* ===== FORM PANEL ===== */}
          <div className={`rounded-lg border ${
            isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200'
          } p-8`}>

            {/* BOL Reference */}
            <FormSection isDark={isDark} title="BOL Reference">
              <FormRow>
                <FormField isDark={isDark} label="BOL Number *">
                  <div className="flex gap-2">
                    <Input isDark={isDark}
                      type="text"
                      value={form.bolNumber}
                      onChange={(e: any) => handleInputChange('bolNumber', e.target.value)}
                      placeholder="BOL-2024-00001"
                    />
                    <button
                      onClick={genBOL}
                      className="px-4 py-2 bg-primary-600 text-white rounded font-semibold hover:bg-primary-700 transition text-xs whitespace-nowrap"
                    >
                      AUTO
                    </button>
                  </div>
                </FormField>
                <FormField isDark={isDark} label="Date *">
                  <Input isDark={isDark}
                    type="date"
                    value={form.bolDate}
                    onChange={(e: any) => handleInputChange('bolDate', e.target.value)}
                  />
                </FormField>
              </FormRow>
              <FormRow>
                <FormField isDark={isDark} label="Pro/Ref #">
                  <Input isDark={isDark}
                    type="text"
                    value={form.proNum}
                    onChange={(e: any) => handleInputChange('proNum', e.target.value)}
                    placeholder="PRO-12345"
                  />
                </FormField>
                <FormField isDark={isDark} label="PO #">
                  <Input isDark={isDark}
                    type="text"
                    value={form.poNum}
                    onChange={(e: any) => handleInputChange('poNum', e.target.value)}
                    placeholder="PO-67890"
                  />
                </FormField>
              </FormRow>
            </FormSection>

            {/* Shipper */}
            <FormSection isDark={isDark} title="Shipper (Origin)">
              <FormField isDark={isDark} label="Company Name *">
                <Input isDark={isDark}
                  type="text"
                  value={form.sName}
                  onChange={(e: any) => handleInputChange('sName', e.target.value)}
                  placeholder="Company name"
                />
              </FormField>
              <FormField isDark={isDark} label="Address">
                <Input isDark={isDark}
                  type="text"
                  value={form.sAddr}
                  onChange={(e: any) => handleInputChange('sAddr', e.target.value)}
                  placeholder="Street address"
                />
              </FormField>
              <FormRow>
                <FormField isDark={isDark} label="City">
                  <Input isDark={isDark}
                    type="text"
                    value={form.sCity}
                    onChange={(e: any) => handleInputChange('sCity', e.target.value)}
                    placeholder="City"
                  />
                </FormField>
                <FormField isDark={isDark} label="State/Province">
                  <Input isDark={isDark}
                    type="text"
                    value={form.sState}
                    onChange={(e: any) => handleInputChange('sState', e.target.value)}
                    placeholder="ON"
                  />
                </FormField>
              </FormRow>
              <FormRow>
                <FormField isDark={isDark} label="ZIP/Postal">
                  <Input isDark={isDark}
                    type="text"
                    value={form.sZip}
                    onChange={(e: any) => handleInputChange('sZip', e.target.value)}
                    placeholder="M5V 3A8"
                  />
                </FormField>
                <FormField isDark={isDark} label="Country">
                  <select
                    value={form.sCountry}
                    onChange={(e: any) => handleInputChange('sCountry', e.target.value)}
                    className={`px-3 py-2 rounded border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  >
                    <option>Canada</option>
                    <option>USA</option>
                  </select>
                </FormField>
              </FormRow>
              <FormRow>
                <FormField isDark={isDark} label="Contact">
                  <Input isDark={isDark}
                    type="text"
                    value={form.sContact}
                    onChange={(e: any) => handleInputChange('sContact', e.target.value)}
                    placeholder="John Smith"
                  />
                </FormField>
                <FormField isDark={isDark} label="Phone">
                  <Input isDark={isDark}
                    type="text"
                    value={form.sPhone}
                    onChange={(e: any) => handleInputChange('sPhone', e.target.value)}
                    placeholder="416-555-0100"
                  />
                </FormField>
              </FormRow>
            </FormSection>

            {/* Consignee */}
            <FormSection isDark={isDark} title="Consignee (Destination)">
              <FormField isDark={isDark} label="Company Name *">
                <Input isDark={isDark}
                  type="text"
                  value={form.cName}
                  onChange={(e: any) => handleInputChange('cName', e.target.value)}
                  placeholder="Company name"
                />
              </FormField>
              <FormField isDark={isDark} label="Address">
                <Input isDark={isDark}
                  type="text"
                  value={form.cAddr}
                  onChange={(e: any) => handleInputChange('cAddr', e.target.value)}
                  placeholder="Street address"
                />
              </FormField>
              <FormRow>
                <FormField isDark={isDark} label="City">
                  <Input isDark={isDark}
                    type="text"
                    value={form.cCity}
                    onChange={(e: any) => handleInputChange('cCity', e.target.value)}
                    placeholder="City"
                  />
                </FormField>
                <FormField isDark={isDark} label="State/Province">
                  <Input isDark={isDark}
                    type="text"
                    value={form.cState}
                    onChange={(e: any) => handleInputChange('cState', e.target.value)}
                    placeholder="IL"
                  />
                </FormField>
              </FormRow>
              <FormRow>
                <FormField isDark={isDark} label="ZIP/Postal">
                  <Input isDark={isDark}
                    type="text"
                    value={form.cZip}
                    onChange={(e: any) => handleInputChange('cZip', e.target.value)}
                    placeholder="60601"
                  />
                </FormField>
                <FormField isDark={isDark} label="Country">
                  <select
                    value={form.cCountry}
                    onChange={(e: any) => handleInputChange('cCountry', e.target.value)}
                    className={`px-3 py-2 rounded border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  >
                    <option>Canada</option>
                    <option>USA</option>
                  </select>
                </FormField>
              </FormRow>
              <FormRow>
                <FormField isDark={isDark} label="Contact">
                  <Input isDark={isDark}
                    type="text"
                    value={form.cContact}
                    onChange={(e: any) => handleInputChange('cContact', e.target.value)}
                    placeholder="Jane Doe"
                  />
                </FormField>
                <FormField isDark={isDark} label="Phone">
                  <Input isDark={isDark}
                    type="text"
                    value={form.cPhone}
                    onChange={(e: any) => handleInputChange('cPhone', e.target.value)}
                    placeholder="312-555-0200"
                  />
                </FormField>
              </FormRow>
            </FormSection>

            {/* Carrier */}
            <FormSection isDark={isDark} title="Carrier Information">
              <FormField isDark={isDark} label="Carrier Company *">
                <Input isDark={isDark}
                  type="text"
                  value={form.carrierName}
                  onChange={(e: any) => handleInputChange('carrierName', e.target.value)}
                  placeholder="Swift North Logistics"
                />
              </FormField>
              <FormRow>
                <FormField isDark={isDark} label="MC/DOT #">
                  <Input isDark={isDark}
                    type="text"
                    value={form.carrierMC}
                    onChange={(e: any) => handleInputChange('carrierMC', e.target.value)}
                    placeholder="MC-123456"
                  />
                </FormField>
                <FormField isDark={isDark} label="Driver Name">
                  <Input isDark={isDark}
                    type="text"
                    value={form.driverName}
                    onChange={(e: any) => handleInputChange('driverName', e.target.value)}
                    placeholder="Driver name"
                  />
                </FormField>
              </FormRow>
              <FormRow>
                <FormField isDark={isDark} label="Truck #">
                  <Input isDark={isDark}
                    type="text"
                    value={form.truckNum}
                    onChange={(e: any) => handleInputChange('truckNum', e.target.value)}
                    placeholder="T-001"
                  />
                </FormField>
                <FormField isDark={isDark} label="Trailer #">
                  <Input isDark={isDark}
                    type="text"
                    value={form.trailerNum}
                    onChange={(e: any) => handleInputChange('trailerNum', e.target.value)}
                    placeholder="TR-042"
                  />
                </FormField>
              </FormRow>
            </FormSection>

            {/* Commodities */}
            <FormSection isDark={isDark} title="Commodities">
              <div className="space-y-3 mb-4">
                {commodities.map((com) => (
                  <div key={com.id} className="grid grid-cols-5 gap-2 items-end">
                    <input
                      type="text"
                      value={com.description}
                      onChange={(e) => updateCommodity(com.id, 'description', e.target.value)}
                      placeholder="Description"
                      className={`px-2 py-1 rounded border text-xs ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300'
                      } focus:outline-none`}
                    />
                    <input
                      type="text"
                      value={com.qty}
                      onChange={(e) => updateCommodity(com.id, 'qty', e.target.value)}
                      placeholder="Qty"
                      className={`px-2 py-1 rounded border text-xs ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300'
                      } focus:outline-none`}
                    />
                    <input
                      type="text"
                      value={com.weight}
                      onChange={(e) => updateCommodity(com.id, 'weight', e.target.value)}
                      placeholder="Weight"
                      className={`px-2 py-1 rounded border text-xs ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300'
                      } focus:outline-none`}
                    />
                    <input
                      type="text"
                      value={com.class}
                      onChange={(e) => updateCommodity(com.id, 'class', e.target.value)}
                      placeholder="Class"
                      className={`px-2 py-1 rounded border text-xs ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300'
                      } focus:outline-none`}
                    />
                    <button
                      onClick={() => removeCommodity(com.id)}
                      className="px-2 py-1 bg-red-600/20 text-red-600 rounded text-xs hover:bg-red-600/30 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addCommodity}
                className="w-full px-4 py-2 bg-primary-600/20 text-primary-600 rounded text-xs font-bold hover:bg-primary-600/30 transition"
              >
                + Add Commodity
              </button>
              <FormRow>
                <FormField isDark={isDark} label="Total Weight">
                  <Input isDark={isDark}
                    type="text"
                    value={form.totalWt}
                    onChange={(e: any) => handleInputChange('totalWt', e.target.value)}
                    placeholder="24,500"
                  />
                </FormField>
                <FormField isDark={isDark} label="Freight Terms">
                  <select
                    value={form.fTerms}
                    onChange={(e: any) => handleInputChange('fTerms', e.target.value)}
                    className={`px-3 py-2 rounded border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  >
                    <option>Prepaid</option>
                    <option>Collect</option>
                    <option>Third Party</option>
                  </select>
                </FormField>
              </FormRow>
              <FormField isDark={isDark} label="Declared Value">
                <Input isDark={isDark}
                  type="text"
                  value={form.declVal}
                  onChange={(e: any) => handleInputChange('declVal', e.target.value)}
                  placeholder="$50,000 CAD"
                />
              </FormField>
            </FormSection>

            {/* Special Instructions */}
            <FormSection isDark={isDark} title="Special Instructions">
              <FormField isDark={isDark} label="Notes">
                <textarea
                  value={form.instrTxt}
                  onChange={(e: any) => handleInputChange('instrTxt', e.target.value)}
                  placeholder="e.g. Call 1 hour before delivery. Use dock door #4 only."
                  rows={3}
                  className={`px-3 py-2 rounded border text-sm ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none`}
                />
              </FormField>
            </FormSection>

            {/* Actions */}
            <div className="flex gap-3 pt-8 border-t border-gray-700">
              <button
                onClick={downloadBOL}
                className="flex-1 btn-primary py-3 rounded-lg font-semibold transition"
              >
                ⬇ Download PDF
              </button>
              <button
                onClick={() => window.print()}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold border transition ${
                  isDark
                    ? 'bg-dark-400 border-gray-600 text-white hover:bg-dark-300'
                    : 'bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200'
                }`}
              >
                🖨 Print
              </button>
              <button
                onClick={clearForm}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold border transition ${
                  isDark
                    ? 'bg-dark-400 border-gray-600 text-white hover:bg-dark-300'
                    : 'bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200'
                }`}
              >
                ↺ Clear
              </button>
            </div>
          </div>

          {/* ===== PREVIEW PANEL ===== */}
          <div className={`rounded-lg border overflow-hidden sticky top-32 ${
            isDark ? 'bg-white border-gray-200' : 'bg-white border-gray-200'
          } shadow-lg`} style={{ aspectRatio: '8.5 / 11', height: '750px', display: 'flex', flexDirection: 'column' }}>
            {/* BOL with watermark stripes */}
            <div style={{ position: 'relative', backgroundColor: '#ffffff', minHeight: 'auto', display: 'flex', flexDirection: 'column', pageBreakAfter: 'avoid', height: '100%' }}>
              {/* Left Watermark Stripe */}
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '18px',
                background: '#dff4fd',
                borderRight: '1px solid #9dd8f0',
                zIndex: 10,
                pointerEvents: 'none',
                overflow: 'hidden'
              }}>
                <div style={{
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed',
                  fontFamily: 'Arial',
                  fontSize: '6.5px',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  color: '#00AEEF',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  lineHeight: '18px',
                  padding: '10px 0',
                  userSelect: 'none',
                  transform: 'rotate(180deg)'
                }}>
                  INTEGRATEDTECH.CA · FREE PLAN · BOL GENERATOR
                </div>
              </div>

              {/* Right Watermark Stripe */}
              <div style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '18px',
                background: '#dff4fd',
                borderLeft: '1px solid #9dd8f0',
                zIndex: 10,
                pointerEvents: 'none',
                overflow: 'hidden'
              }}>
                <div style={{
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed',
                  fontFamily: 'Arial',
                  fontSize: '6.5px',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  color: '#00AEEF',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  lineHeight: '18px',
                  padding: '10px 0',
                  userSelect: 'none'
                }}>
                  BOL GENERATED USING INTEGRATEDTECH.CA
                </div>
              </div>

              {/* BOL Content */}
              <div style={{
                padding: '16px 26px',
                backgroundColor: '#ffffff',
                color: '#0A1628',
                fontSize: '13px',
                fontFamily: 'Arial, sans-serif',
                flex: 1,
                marginLeft: '0',
                marginRight: '0',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '14px', borderBottom: '3px solid #0A1628', marginBottom: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {form.logoSrc && (
                      <img src={form.logoSrc} alt="Logo" style={{ maxHeight: '48px', maxWidth: '125px', objectFit: 'contain' }} />
                    )}
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#0A1628', letterSpacing: '-0.3px' }}>
                        {form.carrierName || 'Your Company Name'}
                      </div>
                      <div style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '2px' }}>
                        Straight Bill of Lading
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '21px', fontWeight: 900, color: '#0A1628', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
                      Bill of Lading
                    </div>
                    <div style={{ fontSize: '8px', color: '#999', letterSpacing: '0.5px', marginTop: '2px' }}>
                      Not Negotiable · Original
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#00AEEF', fontFamily: 'Courier New, monospace', marginTop: '4px' }}>
                      BOL #: {form.bolNumber || '—'}
                    </div>
                    <div style={{ fontSize: '9px', color: '#aaa', marginTop: '2px' }}>
                      Date: {form.bolDate ? new Date(form.bolDate + 'T12:00:00').toLocaleDateString('en-CA', {year: 'numeric', month: 'short', day: 'numeric'}) : '—'}
                    </div>
                  </div>
                </div>

                {/* Quick Ref Box */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '28px' }}>
                  <div style={{ border: '1px solid #ccdde8', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ background: '#0A1628', color: '#00AEEF', fontSize: '7.5px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', padding: '4px 8px' }}>
                      Pro / Ref #
                    </div>
                    <div style={{ padding: '10px 8px', minHeight: '40px', fontSize: '10px', color: '#0A1628' }}>
                      {form.proNum || '—'}
                    </div>
                  </div>
                  <div style={{ border: '1px solid #ccdde8', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ background: '#0A1628', color: '#00AEEF', fontSize: '7.5px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', padding: '4px 8px' }}>
                      PO #
                    </div>
                    <div style={{ padding: '10px 8px', minHeight: '40px', fontSize: '10px', color: '#0A1628' }}>
                      {form.poNum || '—'}
                    </div>
                  </div>
                  <div style={{ border: '1px solid #ccdde8', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ background: '#0A1628', color: '#00AEEF', fontSize: '7.5px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', padding: '4px 8px' }}>
                      Freight Terms
                    </div>
                    <div style={{ padding: '10px 8px', minHeight: '40px', fontSize: '10px', color: '#0A1628' }}>
                      {form.fTerms || 'Prepaid'}
                    </div>
                  </div>
                </div>

                {/* Shipper/Consignee */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '28px' }}>
                  <div style={{ border: '1px solid #ccdde8', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ background: '#0A1628', color: '#00AEEF', fontSize: '7.5px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', padding: '4px 8px' }}>
                      Shipper / Consignor
                    </div>
                    <div style={{ padding: '10px 8px', minHeight: '90px', fontSize: '9px' }}>
                      <div dangerouslySetInnerHTML={{
                        __html: formatAddr(form.sName, form.sAddr, form.sCity, form.sState, form.sZip, form.sCountry, form.sContact, form.sPhone)
                      }} />
                    </div>
                  </div>
                  <div style={{ border: '1px solid #ccdde8', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ background: '#0A1628', color: '#00AEEF', fontSize: '7.5px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', padding: '4px 8px' }}>
                      Consignee / Receiver
                    </div>
                    <div style={{ padding: '10px 8px', minHeight: '90px', fontSize: '9px' }}>
                      <div dangerouslySetInnerHTML={{
                        __html: formatAddr(form.cName, form.cAddr, form.cCity, form.cState, form.cZip, form.cCountry, form.cContact, form.cPhone)
                      }} />
                    </div>
                  </div>
                </div>

                {/* Carrier Info */}
                <div style={{ border: '1px solid #ccdde8', borderRadius: '3px', overflow: 'hidden', marginBottom: '26px' }}>
                  <div style={{ background: '#0A1628', color: '#00AEEF', fontSize: '7.5px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', padding: '4px 8px' }}>
                    Carrier Information
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
                    <div style={{ padding: '6px 8px', borderRight: '1px solid #ccdde8' }}>
                      <div style={{ fontSize: '7.5px', color: '#999', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Carrier</div>
                      <div style={{ fontSize: '10px', color: '#0A1628' }}>{form.carrierName || '—'}</div>
                      <div style={{ fontSize: '7.5px', color: '#999', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '5px', marginBottom: '3px' }}>MC/DOT</div>
                      <div style={{ fontSize: '10px', color: '#0A1628' }}>{form.carrierMC || '—'}</div>
                    </div>
                    <div style={{ padding: '6px 8px', borderRight: '1px solid #ccdde8' }}>
                      <div style={{ fontSize: '7.5px', color: '#999', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Driver</div>
                      <div style={{ fontSize: '10px', color: '#0A1628' }}>{form.driverName || '—'}</div>
                    </div>
                    <div style={{ padding: '6px 8px', borderRight: '1px solid #ccdde8' }}>
                      <div style={{ fontSize: '7.5px', color: '#999', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Truck</div>
                      <div style={{ fontSize: '10px', color: '#0A1628' }}>{form.truckNum || '—'}</div>
                    </div>
                    <div style={{ padding: '6px 8px' }}>
                      <div style={{ fontSize: '7.5px', color: '#999', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Trailer</div>
                      <div style={{ fontSize: '10px', color: '#0A1628' }}>{form.trailerNum || '—'}</div>
                    </div>
                  </div>
                </div>

                {/* Commodities Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '26px', fontSize: '10px' }}>
                  <thead>
                    <tr style={{ background: '#0A1628', color: '#00AEEF' }}>
                      <th style={{ border: '1px solid #0A1628', padding: '6px 8px', textAlign: 'left', fontWeight: 700, fontSize: '8.5px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                        Description of Articles
                      </th>
                      <th style={{ border: '1px solid #0A1628', padding: '6px 8px', textAlign: 'left', fontWeight: 700, fontSize: '8.5px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                        Qty
                      </th>
                      <th style={{ border: '1px solid #0A1628', padding: '6px 8px', textAlign: 'left', fontWeight: 700, fontSize: '8.5px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                        Weight
                      </th>
                      <th style={{ border: '1px solid #0A1628', padding: '6px 8px', textAlign: 'left', fontWeight: 700, fontSize: '8.5px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                        Class
                      </th>
                      <th style={{ border: '1px solid #0A1628', padding: '6px 8px', textAlign: 'left', fontWeight: 700, fontSize: '8.5px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                        NMFC / Hazmat UN #
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {commodities.length === 0 ? (
                      <tr style={{ background: '#f5f9fc', color: '#999' }}>
                        <td colSpan={5} style={{ border: '1px solid #ccdde8', padding: '6px 8px', textAlign: 'center', fontStyle: 'italic' }}>
                          No freight added yet
                        </td>
                      </tr>
                    ) : (
                      commodities.map((com, idx) => (
                        <tr style={{ background: idx % 2 === 0 ? '#f5f9fc' : '#ffffff' }}>
                          <td style={{ border: '1px solid #ccdde8', padding: '5px 8px', color: '#0A1628' }}>{com.description || '—'}</td>
                          <td style={{ border: '1px solid #ccdde8', padding: '5px 8px', color: '#0A1628' }}>{com.qty || '—'}</td>
                          <td style={{ border: '1px solid #ccdde8', padding: '5px 8px', color: '#0A1628' }}>{com.weight || '—'}</td>
                          <td style={{ border: '1px solid #ccdde8', padding: '5px 8px', color: '#0A1628' }}>{com.class || '—'}</td>
                          <td style={{ border: '1px solid #ccdde8', padding: '4px 6px', color: '#ccc', fontStyle: 'italic', fontSize: '8.5px' }}>—</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#eaf2f8', fontWeight: 700, fontSize: '8.5px' }}>
                      <td colSpan={2} style={{ border: '1px solid #0A1628', padding: '5px 8px' }}>Totals</td>
                      <td style={{ border: '1px solid #0A1628', padding: '5px 8px', color: '#0A1628' }}>{form.totalWt || '—'} {form.wtUnit}</td>
                      <td colSpan={2} style={{ border: '1px solid #0A1628', padding: '5px 8px', color: '#0A1628', fontSize: '8.5px' }}>
                        Declared Value: <strong>{form.declVal || '—'}</strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Special Handling */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '26px' }}>
                  <div style={{ border: '1px solid #ccdde8', borderRadius: '3px', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '8px', color: '#555' }}>
                    <div style={{ width: '11px', height: '11px', border: '1.5px solid #aaa', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 900 }}>
                      {form.sHazmat ? '✓' : ''}
                    </div>
                    Hazardous Mat.
                  </div>
                  <div style={{ border: '1px solid #ccdde8', borderRadius: '3px', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '8px', color: '#555' }}>
                    <div style={{ width: '11px', height: '11px', border: '1.5px solid #aaa', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 900 }}>
                      {form.sLiftgate ? '✓' : ''}
                    </div>
                    Liftgate
                  </div>
                  <div style={{ border: '1px solid #ccdde8', borderRadius: '3px', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '8px', color: '#555' }}>
                    <div style={{ width: '11px', height: '11px', border: '1.5px solid #aaa', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 900 }}>
                      {form.sAppt ? '✓' : ''}
                    </div>
                    Appointment
                  </div>
                  <div style={{ border: '1px solid #ccdde8', borderRadius: '3px', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '8px', color: '#555' }}>
                    <div style={{ width: '11px', height: '11px', border: '1.5px solid #aaa', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 900 }}>
                      {form.sRefer ? '✓' : ''}
                    </div>
                    Temp. Controlled
                  </div>
                </div>

                {/* Special Instructions */}
                <div style={{ border: '1px solid #ccdde8', borderRadius: '3px', overflow: 'hidden', marginBottom: '26px' }}>
                  <div style={{ background: '#0A1628', color: '#00AEEF', fontSize: '7.5px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', padding: '4px 8px' }}>
                    Special Instructions / Handling Notes
                  </div>
                  <div style={{ padding: '8px 8px', minHeight: '36px' }}>
                    <span style={{ fontSize: '9px', color: form.instrTxt ? '#0A1628' : '#ccc', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontStyle: form.instrTxt ? 'normal' : 'italic' }}>
                      {form.instrTxt || 'No special instructions'}
                    </span>
                  </div>
                </div>

                {/* Liability Statement */}
                <div style={{ background: '#fffbea', border: '1px solid #f0d060', borderRadius: '3px', padding: '6px 8px', fontSize: '7.5px', color: '#6b4d00', lineHeight: 1.7, marginBottom: '26px' }}>
                  <strong>RECEIVED</strong>, subject to individually determined rates or contracts agreed upon in writing between carrier and shipper. The carrier shall not make delivery without payment of freight and all other lawful charges. Declared value: <strong>$___________</strong>
                </div>

                {/* Signatures */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginTop: '26px' }}>
                  <div>
                    <div style={{ borderTop: '1.5px solid #0A1628', paddingTop: '3px', marginBottom: '12px' }}></div>
                    <div style={{ fontSize: '7.5px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Shipper Signature & Date</div>
                    <div style={{ fontSize: '8px', color: '#bbb', fontStyle: 'italic', marginTop: '10px' }}>X ____________________</div>
                    <div style={{ fontSize: '8px', color: '#bbb', fontStyle: 'italic', marginTop: '4px' }}>Date: ________________</div>
                  </div>
                  <div>
                    <div style={{ borderTop: '1.5px solid #0A1628', paddingTop: '3px', marginBottom: '12px' }}></div>
                    <div style={{ fontSize: '7.5px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Carrier Signature & Date</div>
                    <div style={{ fontSize: '8px', color: '#bbb', fontStyle: 'italic', marginTop: '10px' }}>X ____________________</div>
                    <div style={{ fontSize: '8px', color: '#bbb', fontStyle: 'italic', marginTop: '4px' }}>Date: ________________</div>
                  </div>
                  <div>
                    <div style={{ borderTop: '1.5px solid #0A1628', paddingTop: '3px', marginBottom: '12px' }}></div>
                    <div style={{ fontSize: '7.5px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Consignee Signature & Date</div>
                    <div style={{ fontSize: '8px', color: '#bbb', fontStyle: 'italic', marginTop: '10px' }}>X ____________________</div>
                    <div style={{ fontSize: '8px', color: '#bbb', fontStyle: 'italic', marginTop: '4px' }}>Date: ________________</div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ background: '#eaf2f8', borderTop: '2px solid #0A1628', padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft: '-26px', marginRight: '-26px', marginBottom: '-16px', marginTop: 'auto', fontSize: '8px' }}>
                  <div style={{ color: '#888' }}>Generated by Integra AI · integratedtech.ca · Free BOL Generator</div>
                  <div style={{ color: '#0A1628', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Straight BOL · Not Negotiable · Original</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          /* Reset all spacing */
          * {
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Global print setup */
          html, body {
            background: white !important;
            height: 100% !important;
            overflow: visible !important;
            width: 100% !important;
          }

          /* Hide everything except preview */
          nav, footer, header, .pt-32::before {
            display: none !important;
          }

          /* Container adjustments */
          .pt-32 {
            padding: 0 !important;
            background: white !important;
            margin: 0 !important;
          }

          .pb-20 {
            padding: 0 !important;
          }

          .px-4 {
            padding: 0 !important;
          }

          .max-w-6xl {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Hide title section */
          .max-w-6xl > div:first-of-type {
            display: none !important;
          }

          /* Main grid - show only preview */
          .grid.grid-cols-2 {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Hide form (first grid item) */
          .grid.grid-cols-2 > div:first-child {
            display: none !important;
          }

          /* Preview (second grid item) - full width */
          .grid.grid-cols-2 > div:last-child {
            position: static !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            display: block !important;
          }

          /* Remove sticky positioning */
          .sticky {
            position: static !important;
          }

          /* Clean up rounded corners */
          .rounded-lg {
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          /* Page setup */
          @page {
            size: letter;
            margin: 0;
            padding: 0;
          }

          body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
          }

          /* Prevent margin collapse */
          div {
            margin-collapse: discard;
          }
        }
      `}</style>
    </div>
  );
};

export default BOLGeneratorPage;
