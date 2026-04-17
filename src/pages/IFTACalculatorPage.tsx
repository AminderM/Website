import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Calculator, Save, CheckCircle, Lock } from 'lucide-react';
import { isPaidUser } from '../types/auth';
import { parseApiError } from '../utils/apiFetch';
import BackToTools from '../components/BackToTools';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const IFTACalculatorPage: React.FC = () => {
  const { theme } = useTheme();
  const { token, user } = useAuth();
  const isDark = theme === 'dark';

  const [jurisdictions, setJurisdictions] = useState<Array<{
    id: number;
    state: string;
    miles: string;
    fuelPurchased: string;
    taxRate: string;
  }>>([
    { id: 1, state: '', miles: '', fuelPurchased: '', taxRate: '' }
  ]);
  const [totalFuelPurchased, setTotalFuelPurchased] = useState('');
  const [mpg, setMpg] = useState('6.5');
  const [result, setResult] = useState<{
    totalMiles: number;
    totalFuelUsed: number;
    avgMpg: number;
    jurisdictionResults: Array<{
      state: string;
      miles: number;
      fuelUsed: number;
      fuelPurchased: number;
      netTaxableFuel: number;
      taxRate: number;
      taxDue: number;
    }>;
    totalTaxDue: number;
  } | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Common IFTA tax rates (cents per gallon) - 2024 rates
  const stateRates: { [key: string]: number } = {
    'AL': 0.29, 'AK': 0.0895, 'AZ': 0.26, 'AR': 0.285, 'CA': 0.68,
    'CO': 0.22, 'CT': 0.25, 'DE': 0.22, 'FL': 0.35, 'GA': 0.324,
    'HI': 0.17, 'ID': 0.32, 'IL': 0.467, 'IN': 0.54, 'IA': 0.30,
    'KS': 0.24, 'KY': 0.246, 'LA': 0.20, 'ME': 0.312, 'MD': 0.417,
    'MA': 0.24, 'MI': 0.467, 'MN': 0.285, 'MS': 0.18, 'MO': 0.22,
    'MT': 0.2975, 'NE': 0.246, 'NV': 0.23, 'NH': 0.222, 'NJ': 0.414,
    'NM': 0.21, 'NY': 0.3215, 'NC': 0.38, 'ND': 0.23, 'OH': 0.47,
    'OK': 0.19, 'OR': 0.38, 'PA': 0.741, 'RI': 0.35, 'SC': 0.22,
    'SD': 0.28, 'TN': 0.27, 'TX': 0.20, 'UT': 0.314, 'VT': 0.121,
    'VA': 0.262, 'WA': 0.494, 'WV': 0.357, 'WI': 0.329, 'WY': 0.24,
    'ON': 0.143, 'QC': 0.192, 'BC': 0.15, 'AB': 0.13, 'SK': 0.15,
    'MB': 0.14
  };

  const addJurisdiction = () => {
    setJurisdictions([
      ...jurisdictions,
      { id: Date.now(), state: '', miles: '', fuelPurchased: '', taxRate: '' }
    ]);
  };

  const removeJurisdiction = (id: number) => {
    if (jurisdictions.length > 1) {
      setJurisdictions(jurisdictions.filter(j => j.id !== id));
    }
  };

  const updateJurisdiction = (id: number, field: string, value: string) => {
    setJurisdictions(jurisdictions.map(j => {
      if (j.id === id) {
        const updated = { ...j, [field]: value };
        if (field === 'state' && stateRates[value.toUpperCase()]) {
          updated.taxRate = stateRates[value.toUpperCase()].toString();
        }
        return updated;
      }
      return j;
    }));
  };

  const calculateIFTA = () => {
    const avgMpg = parseFloat(mpg) || 6;
    
    let totalMiles = 0;
    const jurisdictionResults = jurisdictions.map(j => {
      const miles = parseFloat(j.miles) || 0;
      const fuelPurchased = parseFloat(j.fuelPurchased) || 0;
      const taxRate = parseFloat(j.taxRate) || 0;
      
      totalMiles += miles;
      const fuelUsed = miles / avgMpg;
      const netTaxableFuel = fuelUsed - fuelPurchased;
      const taxDue = netTaxableFuel * taxRate;

      return {
        state: j.state || 'Unknown',
        miles,
        fuelUsed,
        fuelPurchased,
        netTaxableFuel,
        taxRate,
        taxDue
      };
    });

    const totalFuelUsed = totalMiles / avgMpg;
    const totalTaxDue = jurisdictionResults.reduce((sum, j) => sum + j.taxDue, 0);

    setResult({
      totalMiles,
      totalFuelUsed,
      avgMpg,
      jurisdictionResults,
      totalTaxDue
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
      const response = await fetch(`${BACKEND_URL}/api/history/ifta`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mpg: parseFloat(mpg),
          total_fuel_purchased: parseFloat(totalFuelPurchased) || 0,
          total_miles: result.totalMiles,
          total_fuel_used: result.totalFuelUsed,
          jurisdictions: result.jurisdictionResults.map(j => ({
            state: j.state,
            miles: j.miles,
            fuel_purchased: j.fuelPurchased,
            tax_rate: j.taxRate,
            fuel_used: j.fuelUsed,
            net_taxable_fuel: j.netTaxableFuel,
            tax_due: j.taxDue
          })),
          total_tax_due: result.totalTaxDue
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
    <div className={`min-h-screen pt-20 sm:pt-28 pb-20 px-4 ${isDark ? 'bg-dark-400' : 'bg-gray-50'}`} data-testid="ifta-calculator-page">
      <div className="max-w-3xl mx-auto">
        <BackToTools />
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 rounded-xl bg-green-500/20">
            <Calculator className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              IFTA Fuel Tax Estimator
            </h1>
            <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Calculate quarterly IFTA fuel tax liability by jurisdiction
            </p>
          </div>
        </div>

        {/* Calculator Card */}
        <div className={`rounded-xl border ${isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200'} p-8`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className={labelClass}>Fleet Average MPG</label>
              <input
                type="number"
                step="0.1"
                value={mpg}
                onChange={(e) => setMpg(e.target.value)}
                placeholder="6.5"
                className={inputClass}
                data-testid="ifta-mpg-input"
              />
            </div>
            <div>
              <label className={labelClass}>Total Fuel Purchased (gal)</label>
              <input
                type="number"
                value={totalFuelPurchased}
                onChange={(e) => setTotalFuelPurchased(e.target.value)}
                placeholder="5000"
                className={inputClass}
                data-testid="ifta-total-fuel-input"
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className={labelClass}>Jurisdictions</label>
              <button
                onClick={addJurisdiction}
                className="text-sm text-primary-500 hover:text-primary-400 font-medium"
                data-testid="add-jurisdiction-btn"
              >
                + Add Jurisdiction
              </button>
            </div>
            
            <div className="space-y-4">
              {jurisdictions.map((j, idx) => (
                <div key={j.id} className={`p-4 rounded-lg ${isDark ? 'bg-dark-400' : 'bg-gray-50'}`}>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 items-end">
                    <div>
                      <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>State/Province</label>
                      <input
                        type="text"
                        value={j.state}
                        onChange={(e) => updateJurisdiction(j.id, 'state', e.target.value.toUpperCase())}
                        placeholder="TX"
                        maxLength={2}
                        className={inputClass}
                        data-testid={`jurisdiction-state-${idx}`}
                      />
                    </div>
                    <div>
                      <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Miles</label>
                      <input
                        type="number"
                        value={j.miles}
                        onChange={(e) => updateJurisdiction(j.id, 'miles', e.target.value)}
                        placeholder="1500"
                        className={inputClass}
                        data-testid={`jurisdiction-miles-${idx}`}
                      />
                    </div>
                    <div>
                      <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Fuel Purchased</label>
                      <input
                        type="number"
                        value={j.fuelPurchased}
                        onChange={(e) => updateJurisdiction(j.id, 'fuelPurchased', e.target.value)}
                        placeholder="200"
                        className={inputClass}
                        data-testid={`jurisdiction-fuel-${idx}`}
                      />
                    </div>
                    <div>
                      <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tax Rate ($/gal)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={j.taxRate}
                        onChange={(e) => updateJurisdiction(j.id, 'taxRate', e.target.value)}
                        placeholder="0.20"
                        className={inputClass}
                        data-testid={`jurisdiction-rate-${idx}`}
                      />
                    </div>
                    <button
                      onClick={() => removeJurisdiction(j.id)}
                      className="px-4 py-3 bg-red-600/20 text-red-500 rounded-lg text-sm hover:bg-red-600/30 transition"
                      data-testid={`remove-jurisdiction-${idx}`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={calculateIFTA}
            className="w-full btn-primary py-4 rounded-lg font-semibold text-lg mb-8"
            data-testid="calculate-ifta-btn"
          >
            Calculate IFTA Tax
          </button>

          {result && (
            <div className={`rounded-xl p-6 ${isDark ? 'bg-dark-400' : 'bg-gray-50'}`} data-testid="ifta-result">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>IFTA Summary</h3>
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
                    data-testid="save-ifta"
                  >
                    {saved ? <CheckCircle className="w-4 h-4" /> : !isPaidUser(user) ? <Lock className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? 'Saved!' : !isPaidUser(user) ? 'Paid Plan Required' : 'Save to History'}
                  </button>
                  {saveError && <p className="text-xs text-red-400">{saveError}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-dark-300' : 'bg-white'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Miles</p>
                  <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {result.totalMiles.toLocaleString()}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-dark-300' : 'bg-white'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Fuel Used</p>
                  <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {result.totalFuelUsed.toFixed(1)} gal
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-dark-300' : 'bg-white'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Avg MPG</p>
                  <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {result.avgMpg.toFixed(1)}
                  </p>
                </div>
              </div>

              <div className={`border-t ${isDark ? 'border-gray-600' : 'border-gray-200'} pt-4 mb-4`}>
                <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>By Jurisdiction</h4>
                <div className="overflow-x-auto -mx-1">
                  <div className="space-y-2 min-w-[300px]">
                    {result.jurisdictionResults.map((j, idx) => (
                      <div key={idx} className={`flex flex-wrap justify-between items-center gap-2 p-3 rounded-lg ${isDark ? 'bg-dark-300' : 'bg-white'}`}>
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{j.state}</span>
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{j.miles.toLocaleString()} mi</span>
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{j.fuelUsed.toFixed(1)} gal used</span>
                        <span className={`font-semibold ${j.taxDue >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {j.taxDue >= 0 ? '+' : ''}${j.taxDue.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={`border-t ${isDark ? 'border-gray-600' : 'border-gray-200'} pt-4`}>
                <div className="flex justify-between items-center">
                  <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Total Tax {result.totalTaxDue >= 0 ? 'Due' : 'Credit'}
                  </span>
                  <span className={`text-3xl font-bold ${result.totalTaxDue >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                    ${Math.abs(result.totalTaxDue).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IFTACalculatorPage;
