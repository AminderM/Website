import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Fuel, Save, CheckCircle, Lock } from 'lucide-react';
import { isPaidUser } from '../types/auth';
import { parseApiError } from '../utils/apiFetch';
import BackToTools from '../components/BackToTools';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const FuelSurchargePage: React.FC = () => {
  const { theme } = useTheme();
  const { token, user } = useAuth();
  const isDark = theme === 'dark';

  const [currentFuelPrice, setCurrentFuelPrice] = useState('');
  const [baseFuelPrice, setBaseFuelPrice] = useState('2.50');
  const [baseRate, setBaseRate] = useState('');
  const [miles, setMiles] = useState('');
  const [surchargeMethod, setSurchargeMethod] = useState<'percentage' | 'cpm'>('percentage');
  const [result, setResult] = useState<{
    surchargePercent: number;
    surchargeAmount: number;
    totalWithSurcharge: number;
    cpmSurcharge: number;
  } | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const calculateSurcharge = () => {
    const current = parseFloat(currentFuelPrice);
    const base = parseFloat(baseFuelPrice);
    const rate = parseFloat(baseRate);
    const mileage = parseFloat(miles);

    if (isNaN(current) || isNaN(base) || isNaN(rate)) {
      return;
    }

    const priceDiff = current - base;
    const surchargePercent = (priceDiff / base) * 100;
    const mpg = 6;
    const cpmSurcharge = priceDiff / mpg;

    let surchargeAmount = 0;
    if (surchargeMethod === 'percentage') {
      surchargeAmount = (surchargePercent / 100) * rate;
    } else {
      surchargeAmount = cpmSurcharge * (isNaN(mileage) ? 0 : mileage);
    }

    const totalWithSurcharge = rate + surchargeAmount;

    setResult({
      surchargePercent: Math.max(0, surchargePercent),
      surchargeAmount: Math.max(0, surchargeAmount),
      totalWithSurcharge,
      cpmSurcharge: Math.max(0, cpmSurcharge),
    });
    setSaved(false);
  };

  const saveToHistory = async () => {
    if (!result || !token) return;
    if (!isPaidUser(user)) {
      setSaveError('Upgrade to a paid plan to save calculations to history.');
      return;
    }
    setSaveError('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/history/fuel-surcharge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_fuel_price: parseFloat(currentFuelPrice),
          base_fuel_price: parseFloat(baseFuelPrice),
          base_rate: parseFloat(baseRate),
          miles: parseFloat(miles) || 0,
          surcharge_method: surchargeMethod,
          surcharge_percent: result.surchargePercent,
          surcharge_amount: result.surchargeAmount,
          total_with_surcharge: result.totalWithSurcharge,
          cpm_surcharge: result.cpmSurcharge
        })
      });
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else if (response.status === 403) {
        setSaveError('Upgrade to a paid plan to save calculations to history.');
      } else {
        const err = await response.json().catch(() => ({}));
        setSaveError(parseApiError(err));
      }
    } catch (error) {
      setSaveError('Network error. Please try again.');
    }
  };

  const inputClass = `w-full px-4 py-3 rounded-lg border text-sm ${
    isDark
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  } focus:outline-none focus:ring-2 focus:ring-primary-500`;

  const labelClass = `block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className={`min-h-screen pt-32 pb-20 px-4 ${isDark ? 'bg-dark-400' : 'bg-gray-50'}`} data-testid="fuel-surcharge-page">
      <div className="max-w-2xl mx-auto">
        <BackToTools />
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 rounded-xl bg-orange-500/20">
            <Fuel className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Fuel Surcharge Calculator
            </h1>
            <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Calculate fuel surcharges based on DOE standards
            </p>
          </div>
        </div>

        {/* Calculator Card */}
        <div className={`rounded-xl border ${isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200'} p-8`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className={labelClass}>Current Fuel Price ($/gal)</label>
              <input
                type="number"
                step="0.01"
                value={currentFuelPrice}
                onChange={(e) => setCurrentFuelPrice(e.target.value)}
                placeholder="4.25"
                className={inputClass}
                data-testid="current-fuel-price-input"
              />
            </div>
            <div>
              <label className={labelClass}>Base Fuel Price ($/gal)</label>
              <input
                type="number"
                step="0.01"
                value={baseFuelPrice}
                onChange={(e) => setBaseFuelPrice(e.target.value)}
                placeholder="2.50"
                className={inputClass}
                data-testid="base-fuel-price-input"
              />
            </div>
            <div>
              <label className={labelClass}>Base Freight Rate ($)</label>
              <input
                type="number"
                step="0.01"
                value={baseRate}
                onChange={(e) => setBaseRate(e.target.value)}
                placeholder="2500.00"
                className={inputClass}
                data-testid="base-rate-input"
              />
            </div>
            <div>
              <label className={labelClass}>Miles (for CPM method)</label>
              <input
                type="number"
                value={miles}
                onChange={(e) => setMiles(e.target.value)}
                placeholder="500"
                className={inputClass}
                data-testid="miles-input"
              />
            </div>
          </div>

          <div className="mb-8">
            <label className={labelClass}>Surcharge Method</label>
            <div className="flex gap-6">
              <label className={`flex items-center gap-2 cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <input
                  type="radio"
                  name="surchargeMethod"
                  checked={surchargeMethod === 'percentage'}
                  onChange={() => setSurchargeMethod('percentage')}
                  className="w-4 h-4 text-primary-600"
                />
                Percentage of Rate
              </label>
              <label className={`flex items-center gap-2 cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <input
                  type="radio"
                  name="surchargeMethod"
                  checked={surchargeMethod === 'cpm'}
                  onChange={() => setSurchargeMethod('cpm')}
                  className="w-4 h-4 text-primary-600"
                />
                Cost Per Mile (CPM)
              </label>
            </div>
          </div>

          <button
            onClick={calculateSurcharge}
            className="w-full btn-primary py-4 rounded-lg font-semibold text-lg mb-8"
            data-testid="calculate-fuel-surcharge-btn"
          >
            Calculate Surcharge
          </button>

          {result && (
            <div className={`rounded-xl p-6 ${isDark ? 'bg-dark-400' : 'bg-gray-50'}`} data-testid="fuel-surcharge-result">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Results</h3>
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={saveToHistory}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                      saved
                        ? 'bg-green-500/20 text-green-500'
                        : !isPaidUser(user)
                          ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                          : isDark ? 'bg-dark-300 text-gray-300 hover:bg-dark-200' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    data-testid="save-fuel-surcharge"
                  >
                    {saved ? <CheckCircle className="w-4 h-4" /> : !isPaidUser(user) ? <Lock className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? 'Saved!' : !isPaidUser(user) ? 'Paid Plan Required' : 'Save to History'}
                  </button>
                  {saveError && <p className="text-xs text-red-400">{saveError}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-dark-300' : 'bg-white'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Surcharge %</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                    {result.surchargePercent.toFixed(2)}%
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-dark-300' : 'bg-white'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>CPM Surcharge</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                    ${result.cpmSurcharge.toFixed(3)}/mi
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-dark-300' : 'bg-white'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Surcharge Amount</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    ${result.surchargeAmount.toFixed(2)}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-dark-300' : 'bg-white'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total with Surcharge</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
                    ${result.totalWithSurcharge.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FuelSurchargePage;
