import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Wrench, X, Fuel, Calculator, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

// Mini Fuel Surcharge Calculator
const MiniFuelSurcharge: React.FC<{ isDark: boolean; onClose: () => void }> = ({ isDark, onClose }) => {
  const [currentPrice, setCurrentPrice] = useState('');
  const [basePrice, setBasePrice] = useState('2.50');
  const [rate, setRate] = useState('');
  const [result, setResult] = useState<{ percent: number; amount: number } | null>(null);

  const calculate = () => {
    const current = parseFloat(currentPrice);
    const base = parseFloat(basePrice);
    const baseRate = parseFloat(rate);
    
    if (isNaN(current) || isNaN(base) || isNaN(baseRate)) return;
    
    const percent = Math.max(0, ((current - base) / base) * 100);
    const amount = (percent / 100) * baseRate;
    
    setResult({ percent, amount });
  };

  const inputClass = `w-full px-3 py-2 rounded border text-sm ${
    isDark
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  } focus:outline-none focus:ring-1 focus:ring-primary-500`;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Fuel Surcharge
        </h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Current $/gal</label>
          <input
            type="number"
            step="0.01"
            value={currentPrice}
            onChange={(e) => setCurrentPrice(e.target.value)}
            placeholder="4.25"
            className={inputClass}
            data-testid="quick-fuel-current"
          />
        </div>
        <div>
          <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Base $/gal</label>
          <input
            type="number"
            step="0.01"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            placeholder="2.50"
            className={inputClass}
            data-testid="quick-fuel-base"
          />
        </div>
        <div>
          <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Base Rate $</label>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="2500"
            className={inputClass}
            data-testid="quick-fuel-rate"
          />
        </div>
        <button
          onClick={calculate}
          className="w-full btn-primary py-2 rounded text-sm font-medium"
          data-testid="quick-fuel-calculate"
        >
          Calculate
        </button>
        
        {result && (
          <div className={`p-3 rounded ${isDark ? 'bg-dark-400' : 'bg-gray-100'}`} data-testid="quick-fuel-result">
            <div className="flex justify-between text-sm">
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Surcharge</span>
              <span className={`font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                {result.percent.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Amount</span>
              <span className={`font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                ${result.amount.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Mini IFTA Calculator
const MiniIFTA: React.FC<{ isDark: boolean; onClose: () => void }> = ({ isDark, onClose }) => {
  const [miles, setMiles] = useState('');
  const [mpg, setMpg] = useState('6.5');
  const [fuelPurchased, setFuelPurchased] = useState('');
  const [taxRate, setTaxRate] = useState('0.20');
  const [result, setResult] = useState<{ fuelUsed: number; netFuel: number; tax: number } | null>(null);

  const calculate = () => {
    const m = parseFloat(miles);
    const g = parseFloat(mpg);
    const fp = parseFloat(fuelPurchased);
    const tr = parseFloat(taxRate);
    
    if (isNaN(m) || isNaN(g) || isNaN(fp) || isNaN(tr)) return;
    
    const fuelUsed = m / g;
    const netFuel = fuelUsed - fp;
    const tax = netFuel * tr;
    
    setResult({ fuelUsed, netFuel, tax });
  };

  const inputClass = `w-full px-3 py-2 rounded border text-sm ${
    isDark
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  } focus:outline-none focus:ring-1 focus:ring-primary-500`;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Quick IFTA
        </h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Miles</label>
            <input
              type="number"
              value={miles}
              onChange={(e) => setMiles(e.target.value)}
              placeholder="1500"
              className={inputClass}
              data-testid="quick-ifta-miles"
            />
          </div>
          <div>
            <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>MPG</label>
            <input
              type="number"
              step="0.1"
              value={mpg}
              onChange={(e) => setMpg(e.target.value)}
              placeholder="6.5"
              className={inputClass}
              data-testid="quick-ifta-mpg"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Fuel Bought</label>
            <input
              type="number"
              value={fuelPurchased}
              onChange={(e) => setFuelPurchased(e.target.value)}
              placeholder="200"
              className={inputClass}
              data-testid="quick-ifta-fuel"
            />
          </div>
          <div>
            <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tax $/gal</label>
            <input
              type="number"
              step="0.01"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              placeholder="0.20"
              className={inputClass}
              data-testid="quick-ifta-rate"
            />
          </div>
        </div>
        <button
          onClick={calculate}
          className="w-full btn-primary py-2 rounded text-sm font-medium"
          data-testid="quick-ifta-calculate"
        >
          Calculate
        </button>
        
        {result && (
          <div className={`p-3 rounded ${isDark ? 'bg-dark-400' : 'bg-gray-100'}`} data-testid="quick-ifta-result">
            <div className="flex justify-between text-sm">
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Fuel Used</span>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {result.fuelUsed.toFixed(1)} gal
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Net Taxable</span>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {result.netFuel.toFixed(1)} gal
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Tax Due</span>
              <span className={`font-bold ${result.tax >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                ${result.tax.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const QuickToolsSidebar: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<'menu' | 'fuel' | 'ifta'>('menu');

  // Don't show on tools page
  if (location.pathname === '/tools') {
    return null;
  }

  const tools = [
    { id: 'fuel', name: 'Fuel Surcharge', icon: Fuel, color: 'text-orange-500' },
    { id: 'ifta', name: 'IFTA Calculator', icon: Calculator, color: 'text-blue-500' },
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-4 bottom-20 z-50 p-4 rounded-full shadow-lg transition-all duration-300 ${
          isOpen 
            ? 'bg-gray-600 rotate-90' 
            : 'bg-primary-600 hover:bg-primary-700'
        }`}
        data-testid="quick-tools-toggle"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Wrench className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Sidebar Panel */}
      <div
        className={`fixed right-0 bottom-0 z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ bottom: '80px' }}
      >
        <div
          className={`w-72 rounded-l-xl shadow-2xl border-l border-t border-b overflow-hidden ${
            isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200'
          }`}
          data-testid="quick-tools-sidebar"
        >
          {activeTool === 'menu' ? (
            <div className="p-4">
              <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Quick Tools
              </h3>
              <div className="space-y-2">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id as any)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition ${
                      isDark 
                        ? 'hover:bg-dark-400 text-gray-300' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                    data-testid={`quick-tool-${tool.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <tool.icon className={`w-5 h-5 ${tool.color}`} />
                      <span className="font-medium">{tool.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
              <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => {
                    navigate('/tools');
                    setIsOpen(false);
                  }}
                  className="w-full text-center text-sm text-primary-500 hover:text-primary-400 font-medium"
                  data-testid="view-all-tools"
                >
                  View All Tools →
                </button>
              </div>
            </div>
          ) : activeTool === 'fuel' ? (
            <MiniFuelSurcharge isDark={isDark} onClose={() => setActiveTool('menu')} />
          ) : (
            <MiniIFTA isDark={isDark} onClose={() => setActiveTool('menu')} />
          )}
        </div>
      </div>
    </>
  );
};

export default QuickToolsSidebar;
