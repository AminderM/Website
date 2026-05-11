import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import BackToTools from '../components/BackToTools';
import IftaWizard from '../components/ifta/IftaWizard';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
type Quarter = typeof QUARTERS[number];

function currentQuarter(): Quarter {
  const m = new Date().getMonth();
  if (m < 3) return 'Q1';
  if (m < 6) return 'Q2';
  if (m < 9) return 'Q3';
  return 'Q4';
}

const IFTACalculatorPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [quarter, setQuarter] = useState<Quarter>(currentQuarter());
  const [year, setYear] = useState(new Date().getFullYear());

  const yearOptions = [year - 1, year, year + 1];

  const selectClass = `rounded-lg border px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-colors ${
    isDark
      ? 'bg-dark-300 border-gray-600 text-white'
      : 'bg-white border-gray-300 text-gray-900'
  }`;

  return (
    <div className={`min-h-screen pt-24 pb-16 px-4 ${isDark ? 'bg-dark-400' : 'bg-gray-50'}`}>
      <div className="max-w-5xl mx-auto">
        <BackToTools />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              IFTA Fuel Tax Calculator
            </h1>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Upload trip & fuel data to generate your quarterly IFTA report
            </p>
          </div>

          {/* Quarter / year selector */}
          <div className="flex items-center gap-2">
            <select
              value={quarter}
              onChange={(e) => setQuarter(e.target.value as Quarter)}
              className={selectClass}
            >
              {QUARTERS.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className={selectClass}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <IftaWizard
          quarter={quarter}
          year={year}
          onQuarterChange={setQuarter}
          onYearChange={setYear}
        />
      </div>
    </div>
  );
};

export default IFTACalculatorPage;
