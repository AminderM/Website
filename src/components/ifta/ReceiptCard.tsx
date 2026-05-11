import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { ParsedFuelReceipt } from '../../hooks/useIftaCalculation';

interface Props {
  receipt: ParsedFuelReceipt;
  index: number;
  onChange: (index: number, updated: ParsedFuelReceipt) => void;
  onRemove: (index: number) => void;
}

const ReceiptCard: React.FC<Props> = ({ receipt, index, onChange, onRemove }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-dark-400 border-gray-700' : 'bg-gray-50 border-gray-200';
  const inputClass = `w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 ${
    isDark ? 'bg-dark-300 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
  }`;
  const labelClass = `block text-xs font-medium mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`;
  const nullClass = `${isDark ? 'border-amber-600' : 'border-amber-400'} bg-amber-50/10`;

  const update = (field: keyof ParsedFuelReceipt, value: string | number) => {
    onChange(index, { ...receipt, [field]: value });
  };

  const hasNull =
    !receipt.date || !receipt.state || !receipt.gallons || receipt.gallons === 0;

  return (
    <div className={`relative rounded-lg border p-3 ${cardBg} ${hasNull ? (isDark ? 'border-amber-700' : 'border-amber-300') : ''}`}>
      <button
        onClick={() => onRemove(index)}
        className="absolute top-2 right-2 text-gray-400 hover:text-red-400 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {hasNull && (
        <div className={`flex items-center gap-1 text-xs mb-2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
          <AlertTriangle className="w-3 h-3" /> Review required
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pr-6">
        <div>
          <label className={labelClass}>Date</label>
          <input
            type="text"
            value={receipt.date || ''}
            onChange={(e) => update('date', e.target.value)}
            placeholder="YYYY-MM-DD"
            className={`${inputClass} ${!receipt.date ? nullClass : ''}`}
          />
        </div>
        <div>
          <label className={labelClass}>State</label>
          <input
            type="text"
            value={receipt.state || ''}
            onChange={(e) => update('state', e.target.value.toUpperCase())}
            placeholder="ON"
            maxLength={2}
            className={`${inputClass} ${!receipt.state ? nullClass : ''}`}
          />
        </div>
        <div>
          <label className={labelClass}>Gallons</label>
          <input
            type="number"
            value={receipt.gallons || ''}
            onChange={(e) => update('gallons', parseFloat(e.target.value) || 0)}
            placeholder="0.0"
            className={`${inputClass} ${!receipt.gallons ? nullClass : ''}`}
          />
        </div>
        <div>
          <label className={labelClass}>Price/gal</label>
          <input
            type="number"
            value={receipt.pricePerGallon || ''}
            onChange={(e) => update('pricePerGallon', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Vendor</label>
          <input
            type="text"
            value={receipt.vendor || ''}
            onChange={(e) => update('vendor', e.target.value)}
            placeholder="Petro-Canada"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
};

export default ReceiptCard;
