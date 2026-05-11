import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ParsedTrip } from '../../hooks/useIftaCalculation';
import { resolveRoute } from '../../lib/ifta/resolveRoute.js';

const CHUNK_SIZE = 20;

interface Props {
  trips: ParsedTrip[];
  onComplete: (resolvedTrips: ParsedTrip[]) => void;
}

const RouteProgress: React.FC<Props> = ({ trips, onComplete }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [processed, setProcessed] = useState(0);
  const resolvedRef = useRef<ParsedTrip[]>([]);
  const tripIndexRef = useRef(0);

  useEffect(() => {
    resolvedRef.current = [];
    tripIndexRef.current = 0;
    setProcessed(0);

    const processChunk = () => {
      const start = tripIndexRef.current;
      const end = Math.min(start + CHUNK_SIZE, trips.length);

      for (let i = start; i < end; i++) {
        const trip = trips[i];
        const segments = resolveRoute(
          trip.originState,
          trip.destinationState,
          trip.totalMiles,
          trip.waypointStates,
          trip.stateMilesMap,
        );
        resolvedRef.current.push({ ...trip, resolvedMiles: segments });
      }

      tripIndexRef.current = end;
      setProcessed(end);

      if (end < trips.length) {
        setTimeout(processChunk, 0);
      } else {
        onComplete(resolvedRef.current);
      }
    };

    if (trips.length === 0) {
      onComplete([]);
      return;
    }

    setTimeout(processChunk, 0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pct = trips.length > 0 ? Math.round((processed / trips.length) * 100) : 100;
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textSub = isDark ? 'text-gray-400' : 'text-gray-500';
  const cardBg = isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200';

  return (
    <div className={`rounded-xl border p-8 text-center ${cardBg}`}>
      <div className={`text-lg font-semibold mb-2 ${textMain}`}>Calculating Routes…</div>
      <p className={`text-sm mb-6 ${textSub}`}>
        {processed} of {trips.length} trips — allocating miles by jurisdiction
      </p>

      <div className={`w-full rounded-full h-3 ${isDark ? 'bg-dark-400' : 'bg-gray-100'} overflow-hidden`}>
        <div
          className="h-3 rounded-full bg-primary-600 transition-all duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`mt-2 text-xs ${textSub}`}>{pct}%</p>
    </div>
  );
};

export default RouteProgress;
