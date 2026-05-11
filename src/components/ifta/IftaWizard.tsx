import React, { useState, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ParsedTrip, ParsedFuelReceipt } from '../../hooks/useIftaCalculation';
import TripUpload from './TripUpload';
import FuelUpload from './FuelUpload';
import RouteProgress from './RouteProgress';
import IftaReport from './IftaReport';

export type WizardStep = 1 | 2 | 3 | 4;

const STEP_LABELS = ['Trip Data', 'Fuel Receipts', 'Processing', 'Report'];

interface IftaWizardProps {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  onQuarterChange: (q: 'Q1' | 'Q2' | 'Q3' | 'Q4') => void;
  onYearChange: (y: number) => void;
}

const IftaWizard: React.FC<IftaWizardProps> = ({ quarter, year, onQuarterChange, onYearChange }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [step, setStep] = useState<WizardStep>(1);
  const [trips, setTrips] = useState<ParsedTrip[]>([]);
  const [fuelReceipts, setFuelReceipts] = useState<ParsedFuelReceipt[]>([]);

  const handleTripsConfirmed = useCallback((confirmed: ParsedTrip[]) => {
    setTrips(confirmed);
    setStep(2);
  }, []);

  const handleFuelConfirmed = useCallback((confirmed: ParsedFuelReceipt[]) => {
    setFuelReceipts(confirmed);
    setStep(3);
  }, []);

  const handleRoutesResolved = useCallback((resolved: ParsedTrip[]) => {
    setTrips(resolved);
    setStep(4);
  }, []);

  const handleStartOver = useCallback(() => {
    setTrips([]);
    setFuelReceipts([]);
    setStep(1);
  }, []);

  const cardBg = isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200';

  return (
    <div className="w-full">
      {/* Stepper */}
      <div className={`rounded-xl border mb-6 p-4 ${cardBg}`}>
        <div className="flex items-center justify-between">
          {STEP_LABELS.map((label, idx) => {
            const num = idx + 1;
            const isActive = step === num;
            const isDone = step > num;
            return (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-1 min-w-[56px]">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      isDone
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-primary-600 text-white'
                        : isDark
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isDone ? '✓' : num}
                  </div>
                  <span
                    className={`text-xs font-medium text-center ${
                      isActive
                        ? 'text-primary-600'
                        : isDark
                        ? 'text-gray-400'
                        : 'text-gray-500'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {idx < STEP_LABELS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-colors ${
                      step > num
                        ? 'bg-green-400'
                        : isDark
                        ? 'bg-gray-700'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      {step === 1 && (
        <TripUpload onConfirm={handleTripsConfirmed} />
      )}
      {step === 2 && (
        <FuelUpload onConfirm={handleFuelConfirmed} onBack={() => setStep(1)} />
      )}
      {step === 3 && (
        <RouteProgress
          trips={trips}
          onComplete={handleRoutesResolved}
        />
      )}
      {step === 4 && (
        <IftaReport
          trips={trips}
          fuelReceipts={fuelReceipts}
          quarter={quarter}
          year={year}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  );
};

export default IftaWizard;
