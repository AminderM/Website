import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { JurisdictionRow } from '../../hooks/useIftaCalculation';

interface Props {
  jurisdictions: JurisdictionRow[];
  totalMiles: number;
  totalFuelPurchased: number;
  totalFuelConsumed: number;
  netTaxDue: number;
  // Optional driver/truck filter for Enterprise
  filterDriver?: string;
  filterTruck?: string;
}

const fmt = (n: number, decimals = 2) =>
  n.toLocaleString('en-CA', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const JurisdictionTable: React.FC<Props> = ({
  jurisdictions,
  totalMiles,
  totalFuelPurchased,
  totalFuelConsumed,
  netTaxDue,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textSub = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';
  const headerBg = isDark ? 'bg-dark-400' : 'bg-gray-50';
  const totalBg = isDark ? 'bg-dark-200' : 'bg-gray-100';
  const hasEstimated = jurisdictions.some((j) => j.hasEstimatedMiles);

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className={`${headerBg} border-b ${borderClass}`}>
              {['State/Province', 'Miles Driven', 'Fuel Consumed (gal)', 'Fuel Purchased (gal)', 'Net Gallons', 'Tax Rate ($/gal)', 'Amount'].map((h) => (
                <th key={h} className={`px-4 py-2.5 text-left text-xs font-semibold ${textSub} whitespace-nowrap`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jurisdictions.map((row) => (
              <tr key={row.state} className={`border-b ${borderClass} hover:${isDark ? 'bg-dark-400/40' : 'bg-gray-50/60'} transition-colors`}>
                <td className={`px-4 py-2 font-medium ${textMain}`}>
                  {row.state}{row.hasEstimatedMiles ? '*' : ''}
                </td>
                <td className={`px-4 py-2 ${textMain}`}>{fmt(row.milesDriven, 1)}</td>
                <td className={`px-4 py-2 ${textMain}`}>{fmt(row.fuelConsumed)}</td>
                <td className={`px-4 py-2 ${textMain}`}>{fmt(row.fuelPurchased)}</td>
                <td className={`px-4 py-2 ${row.netGallons >= 0 ? textMain : 'text-green-500'}`}>
                  {fmt(row.netGallons)}
                </td>
                <td className={`px-4 py-2 ${textSub}`}>{fmt(row.taxRate, 3)}</td>
                <td className={`px-4 py-2 font-semibold ${row.taxOwed > 0 ? 'text-red-500' : row.taxOwed < 0 ? 'text-green-500' : textMain}`}>
                  {row.taxOwed < 0 ? `($${fmt(Math.abs(row.taxOwed))})` : `$${fmt(row.taxOwed)}`}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className={`${totalBg} border-t-2 ${borderClass}`}>
              <td className={`px-4 py-2.5 font-bold ${textMain}`}>Totals</td>
              <td className={`px-4 py-2.5 font-semibold ${textMain}`}>{fmt(totalMiles, 1)}</td>
              <td className={`px-4 py-2.5 font-semibold ${textMain}`}>{fmt(totalFuelConsumed)}</td>
              <td className={`px-4 py-2.5 font-semibold ${textMain}`}>{fmt(totalFuelPurchased)}</td>
              <td className={`px-4 py-2.5 font-semibold ${textMain}`}>{fmt(totalFuelConsumed - totalFuelPurchased)}</td>
              <td className={`px-4 py-2.5 ${textSub}`}>—</td>
              <td className={`px-4 py-2.5 font-bold ${netTaxDue > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {netTaxDue < 0 ? `($${fmt(Math.abs(netTaxDue))})` : `$${fmt(netTaxDue)}`}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {hasEstimated && (
        <p className={`mt-2 text-xs ${textSub}`}>
          * Miles estimated via state routing algorithm. For accuracy, enter actual odometer readings in your trip data.
        </p>
      )}
    </div>
  );
};

export default JurisdictionTable;
