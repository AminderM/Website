import { useState, useEffect } from 'react';

interface IftaRatesData {
  updated: string;
  source: string;
  rates: Record<string, number>;
}

interface UseIftaRatesResult {
  rates: Record<string, number>;
  ratesUpdated: string;
  loading: boolean;
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function useIftaRates(): UseIftaRatesResult {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [ratesUpdated, setRatesUpdated] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Try localStorage cache first
        const cacheKeys = Object.keys(localStorage).filter((k) =>
          k.startsWith('ifta_rates_')
        );
        for (const key of cacheKeys) {
          try {
            const cached = JSON.parse(localStorage.getItem(key) || '');
            if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
              if (!cancelled) {
                setRates(cached.rates);
                setRatesUpdated(cached.updated);
                setLoading(false);
              }
              return;
            }
            localStorage.removeItem(key);
          } catch {
            localStorage.removeItem(key);
          }
        }

        // CRA serves JSON from /src/data via import, not fetch
        const data: IftaRatesData = await import('../data/ifta-rates.json');
        if (!cancelled) {
          const cacheKey = `ifta_rates_${data.updated}`;
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ rates: data.rates, updated: data.updated, ts: Date.now() })
          );
          setRates(data.rates);
          setRatesUpdated(data.updated);
        }
      } catch {
        // Fallback — rates remain empty; caller should show warning
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { rates, ratesUpdated, loading };
}
