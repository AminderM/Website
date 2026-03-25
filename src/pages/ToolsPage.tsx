import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Fuel, Calculator, TrendingUp, DollarSign, Truck, MapPin } from 'lucide-react';

// Fuel Surcharge Calculator Component
const FuelSurchargeCalculator: React.FC<{ isDark: boolean }> = ({ isDark }) => {
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

  const calculateSurcharge = () => {
    const current = parseFloat(currentFuelPrice);
    const base = parseFloat(baseFuelPrice);
    const rate = parseFloat(baseRate);
    const mileage = parseFloat(miles);

    if (isNaN(current) || isNaN(base) || isNaN(rate)) {
      return;
    }

    // Standard DOE fuel surcharge calculation
    // Surcharge % = (Current Price - Base Price) / Base Price * 100
    // Or using CPM method: (Current - Base) * MPG factor
    const priceDiff = current - base;
    const surchargePercent = (priceDiff / base) * 100;
    
    // CPM calculation (assuming 6 MPG average for trucks)
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
  };

  const inputClass = `w-full px-4 py-3 rounded-lg border text-sm ${
    isDark
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  } focus:outline-none focus:ring-2 focus:ring-primary-500`;

  const labelClass = `block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className={`rounded-xl border ${isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-orange-500/20">
          <Fuel className="w-6 h-6 text-orange-500" />
        </div>
        <div>
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Fuel Surcharge Calculator
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Calculate fuel surcharges based on DOE standards
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

      <div className="mb-6">
        <label className={labelClass}>Surcharge Method</label>
        <div className="flex gap-4">
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
        className="w-full btn-primary py-3 rounded-lg font-semibold mb-6"
        data-testid="calculate-fuel-surcharge-btn"
      >
        Calculate Surcharge
      </button>

      {result && (
        <div className={`rounded-lg p-4 ${isDark ? 'bg-dark-400' : 'bg-gray-50'}`} data-testid="fuel-surcharge-result">
          <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Results</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Surcharge %</p>
              <p className={`text-lg font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                {result.surchargePercent.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>CPM Surcharge</p>
              <p className={`text-lg font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                ${result.cpmSurcharge.toFixed(3)}/mi
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Surcharge Amount</p>
              <p className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                ${result.surchargeAmount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total with Surcharge</p>
              <p className={`text-lg font-bold ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
                ${result.totalWithSurcharge.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// IFTA Fuel Tax Estimator Component
const IFTAFuelTaxEstimator: React.FC<{ isDark: boolean }> = ({ isDark }) => {
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
        // Auto-fill tax rate when state is selected
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
    const totalFuel = parseFloat(totalFuelPurchased) || 0;
    
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
  };

  const inputClass = `w-full px-3 py-2 rounded-lg border text-sm ${
    isDark
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  } focus:outline-none focus:ring-2 focus:ring-primary-500`;

  const labelClass = `block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className={`rounded-xl border ${isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-blue-500/20">
          <Calculator className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            IFTA Fuel Tax Estimator
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Calculate quarterly IFTA fuel tax liability by jurisdiction
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <label className={labelClass}>Jurisdictions</label>
          <button
            onClick={addJurisdiction}
            className="text-sm text-primary-500 hover:text-primary-400 font-medium"
            data-testid="add-jurisdiction-btn"
          >
            + Add Jurisdiction
          </button>
        </div>
        
        <div className="space-y-3">
          {jurisdictions.map((j, idx) => (
            <div key={j.id} className={`p-3 rounded-lg ${isDark ? 'bg-dark-400' : 'bg-gray-50'}`}>
              <div className="grid grid-cols-5 gap-2 items-end">
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
                  <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Fuel Purchased (gal)</label>
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
                  className="px-3 py-2 bg-red-600/20 text-red-500 rounded-lg text-sm hover:bg-red-600/30 transition"
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
        className="w-full btn-primary py-3 rounded-lg font-semibold mb-6"
        data-testid="calculate-ifta-btn"
      >
        Calculate IFTA Tax
      </button>

      {result && (
        <div className={`rounded-lg p-4 ${isDark ? 'bg-dark-400' : 'bg-gray-50'}`} data-testid="ifta-result">
          <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>IFTA Summary</h4>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Miles</p>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {result.totalMiles.toLocaleString()}
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Fuel Used</p>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {result.totalFuelUsed.toFixed(1)} gal
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Avg MPG</p>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {result.avgMpg.toFixed(1)}
              </p>
            </div>
          </div>

          <div className={`border-t ${isDark ? 'border-gray-600' : 'border-gray-200'} pt-4 mb-4`}>
            <h5 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>By Jurisdiction</h5>
            <div className="space-y-2">
              {result.jurisdictionResults.map((j, idx) => (
                <div key={idx} className={`flex justify-between items-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span className="font-medium">{j.state}</span>
                  <span>{j.miles.toLocaleString()} mi</span>
                  <span>{j.fuelUsed.toFixed(1)} gal used</span>
                  <span className={j.taxDue >= 0 ? 'text-red-500' : 'text-green-500'}>
                    {j.taxDue >= 0 ? '+' : ''}${j.taxDue.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={`border-t ${isDark ? 'border-gray-600' : 'border-gray-200'} pt-4`}>
            <div className="flex justify-between items-center">
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Total Tax {result.totalTaxDue >= 0 ? 'Due' : 'Credit'}
              </span>
              <span className={`text-2xl font-bold ${result.totalTaxDue >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                ${Math.abs(result.totalTaxDue).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ToolsPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen pt-32 pb-20 px-4 ${isDark ? 'bg-dark-400' : 'bg-gray-50'}`} data-testid="tools-page">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Fleet Tools
          </h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Essential calculators and utilities for fleet management and compliance
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <FuelSurchargeCalculator isDark={isDark} />
          <IFTAFuelTaxEstimator isDark={isDark} />
        </div>
      </div>
    </div>
  );
};

export default ToolsPage;
