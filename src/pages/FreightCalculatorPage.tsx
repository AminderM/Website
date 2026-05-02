import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Truck, AlertCircle, ChevronDown, Info } from 'lucide-react';
import { apiFetch, parseApiError } from '../utils/apiFetch';
import BackToTools from '../components/BackToTools';

interface CalculatorOptions {
  provinces: { code: string; name: string }[];
  equipment_types: { code: string; name: string }[];
  accessorials: { code: string; name: string; charge: number; charge_type: string }[];
  fuel_surcharge_rate_pct: number;
}

interface FreightCalculatorResult {
  origin_province: string;
  destination_province: string;
  equipment_type: string;
  distance_km: number;
  distance_estimated: boolean;
  rate_per_km: number;
  line_haul: number;
  fuel_surcharge: number;
  fuel_surcharge_rate_pct: number;
  accessorials: { code: string; name: string; charge: number; charge_type: string }[];
  accessorials_total: number;
  subtotal: number;
  estimate_low: number;
  estimate_high: number;
  currency: string;
  disclaimer: string;
}

const fmt = (n: number) =>
  n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const FreightCalculatorPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [options, setOptions] = useState<CalculatorOptions | null>(null);
  const [optionsError, setOptionsError] = useState('');

  const [originProvince, setOriginProvince] = useState('');
  const [destinationProvince, setDestinationProvince] = useState('');
  const [equipmentType, setEquipmentType] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [selectedAccessorials, setSelectedAccessorials] = useState<string[]>([]);

  const [result, setResult] = useState<FreightCalculatorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<CalculatorOptions>('/web-tools/freight-calculator/options')
      .then(data => {
        setOptions(data);
        if (data.provinces.length) setOriginProvince(data.provinces[0].code);
        if (data.provinces.length > 1) setDestinationProvince(data.provinces[1].code);
        if (data.equipment_types.length) setEquipmentType(data.equipment_types[0].code);
      })
      .catch(err => setOptionsError(err.message || 'Failed to load options.'));
  }, []);

  const toggleAccessorial = (code: string) => {
    setSelectedAccessorials(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const data = await apiFetch<FreightCalculatorResult>('/web-tools/freight-calculator', {
        method: 'POST',
        body: JSON.stringify({
          origin_province: originProvince,
          destination_province: destinationProvince,
          equipment_type: equipmentType,
          ...(distanceKm ? { distance_km: parseFloat(distanceKm) } : {}),
          ...(selectedAccessorials.length ? { accessorial_codes: selectedAccessorials } : {}),
        }),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const selectClass = `w-full px-4 py-3 rounded-lg border text-sm appearance-none ${
    isDark
      ? 'bg-gray-700 border-gray-600 text-white'
      : 'bg-white border-gray-300 text-gray-900'
  } focus:outline-none focus:ring-2 focus:ring-primary-500`;

  const inputClass = `w-full px-4 py-3 rounded-lg border text-sm ${
    isDark
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  } focus:outline-none focus:ring-2 focus:ring-primary-500`;

  const labelClass = `block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className={`min-h-screen pt-20 sm:pt-28 pb-20 px-4 ${isDark ? 'bg-dark-400' : 'bg-gray-50'}`}>
      <div className="max-w-2xl mx-auto">
        <BackToTools />

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 rounded-xl bg-indigo-500/20">
            <Truck className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Freight Calculator
            </h1>
            <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Estimate freight costs between Canadian provinces
            </p>
          </div>
        </div>

        {optionsError && (
          <div className={`flex items-start gap-3 p-4 rounded-lg mb-6 border ${
            isDark ? 'bg-red-950/30 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{optionsError}</p>
          </div>
        )}

        {/* Form Card */}
        <div className={`rounded-xl border ${isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200'} p-8`}>
          <form onSubmit={handleCalculate}>

            {/* Route */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className={labelClass}>Origin Province</label>
                <div className="relative">
                  <select
                    value={originProvince}
                    onChange={e => setOriginProvince(e.target.value)}
                    className={selectClass}
                    disabled={!options}
                    required
                  >
                    {options?.provinces.map(p => (
                      <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown className={`absolute right-3 top-3.5 w-4 h-4 pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Destination Province</label>
                <div className="relative">
                  <select
                    value={destinationProvince}
                    onChange={e => setDestinationProvince(e.target.value)}
                    className={selectClass}
                    disabled={!options}
                    required
                  >
                    {options?.provinces.map(p => (
                      <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown className={`absolute right-3 top-3.5 w-4 h-4 pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
              </div>
            </div>

            {/* Equipment */}
            <div className="mb-6">
              <label className={labelClass}>Equipment Type</label>
              <div className="relative">
                <select
                  value={equipmentType}
                  onChange={e => setEquipmentType(e.target.value)}
                  className={selectClass}
                  disabled={!options}
                  required
                >
                  {options?.equipment_types.map(et => (
                    <option key={et.code} value={et.code}>{et.name}</option>
                  ))}
                </select>
                <ChevronDown className={`absolute right-3 top-3.5 w-4 h-4 pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
            </div>

            {/* Distance */}
            <div className="mb-6">
              <label className={labelClass}>Distance (km) — optional</label>
              <input
                type="number"
                min="1"
                step="1"
                value={distanceKm}
                onChange={e => setDistanceKm(e.target.value)}
                placeholder="Leave blank to auto-estimate"
                className={inputClass}
              />
              <p className={`text-xs mt-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Leave blank and the backend will estimate the distance for you.
              </p>
            </div>

            {/* Accessorials */}
            {options && options.accessorials.length > 0 && (
              <div className="mb-8">
                <label className={`${labelClass} mb-3`}>Accessorial Charges</label>
                <div className="space-y-2">
                  {options.accessorials.map(acc => (
                    <label
                      key={acc.code}
                      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedAccessorials.includes(acc.code)
                          ? isDark
                            ? 'border-primary-600/50 bg-primary-600/10'
                            : 'border-primary-300 bg-primary-50'
                          : isDark
                            ? 'border-gray-700 hover:border-gray-600'
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedAccessorials.includes(acc.code)}
                          onChange={() => toggleAccessorial(acc.code)}
                          className="w-4 h-4 text-primary-600 rounded"
                        />
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {acc.name}
                        </span>
                      </div>
                      <span className={`text-sm font-semibold shrink-0 ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
                        ${fmt(acc.charge)}
                        <span className={`text-xs font-normal ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {acc.charge_type === 'flat' ? 'flat' : `/${acc.charge_type.replace('per_', '')}`}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className={`flex items-start gap-3 p-4 rounded-lg mb-6 border ${
                isDark ? 'bg-red-950/30 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !options}
              className="w-full btn-primary py-4 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Calculating...' : 'Calculate Freight Cost'}
            </button>
          </form>
        </div>

        {/* Results */}
        {result && (
          <div className={`mt-6 rounded-xl border ${isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200'} p-8`}>
            <h2 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Estimate Results
            </h2>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {result.origin_province} → {result.destination_province} &nbsp;·&nbsp; {result.distance_km.toLocaleString()} km
              {result.distance_estimated && (
                <span className={`ml-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                  isDark ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-50 text-yellow-600'
                }`}>
                  <Info className="w-3 h-3" /> Estimated distance
                </span>
              )}
            </p>

            {/* Line items */}
            <div className={`rounded-lg border divide-y ${isDark ? 'border-gray-700 divide-gray-700' : 'border-gray-200 divide-gray-200'}`}>
              {/* Line haul */}
              <div className="flex justify-between items-center px-5 py-3.5">
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Line Haul</span>
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ${fmt(result.line_haul)} {result.currency}
                </span>
              </div>

              {/* Fuel surcharge */}
              <div className="flex justify-between items-center px-5 py-3.5">
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Fuel Surcharge ({result.fuel_surcharge_rate_pct}%)
                </span>
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ${fmt(result.fuel_surcharge)} {result.currency}
                </span>
              </div>

              {/* Accessorials */}
              {result.accessorials.map(acc => (
                <div key={acc.code} className="flex justify-between items-center px-5 py-3.5">
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{acc.name}</span>
                  <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    ${fmt(acc.charge)} {result.currency}
                  </span>
                </div>
              ))}

              {/* Subtotal */}
              <div className={`flex justify-between items-center px-5 py-4 ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                <span className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Subtotal</span>
                <span className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ${fmt(result.subtotal)} {result.currency}
                </span>
              </div>
            </div>

            {/* Estimate Range */}
            <div className={`mt-5 rounded-xl p-5 border ${
              isDark ? 'bg-primary-600/10 border-primary-600/20' : 'bg-primary-50 border-primary-200'
            }`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
                Estimate Range
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ${Math.round(result.estimate_low).toLocaleString('en-CA')}
                <span className={`mx-2 font-normal text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>—</span>
                ${Math.round(result.estimate_high).toLocaleString('en-CA')}
                <span className={`ml-2 text-base font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{result.currency}</span>
              </p>
              {result.distance_estimated && (
                <p className={`text-xs mt-2 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                  Distance was estimated — provide actual distance for a more accurate quote.
                </p>
              )}
            </div>

            {/* Disclaimer */}
            <p className={`text-xs mt-5 leading-relaxed ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              {result.disclaimer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FreightCalculatorPage;
