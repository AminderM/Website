import { useMemo } from 'react';

export interface ParsedTrip {
  tripId?: string;
  date?: string;
  driverName?: string;
  truckNumber?: string;
  trailerNumber?: string;
  originCity?: string;
  originState: string;
  destinationCity?: string;
  destinationState: string;
  totalMiles: number;
  waypointStates?: string[];
  stateMilesMap?: Record<string, number>;
  // Filled in after resolveRoute
  resolvedMiles?: { state: string; miles: number; source: 'driver-reported' | 'estimated' }[];
}

export interface ParsedFuelReceipt {
  date?: string;
  state: string;
  gallons: number;
  pricePerGallon?: number;
  vendor?: string;
}

export interface JurisdictionRow {
  state: string;
  milesDriven: number;
  fuelConsumed: number;
  fuelPurchased: number;
  netGallons: number;
  taxRate: number;
  taxOwed: number;
  hasEstimatedMiles: boolean;
}

export interface IftaCalculationResult {
  jurisdictions: JurisdictionRow[];
  totalMiles: number;
  totalFuelPurchased: number;
  totalFuelConsumed: number;
  fleetMpg: number;
  netTaxDue: number;
}

export function useIftaCalculation(
  trips: ParsedTrip[],
  fuelReceipts: ParsedFuelReceipt[],
  rates: Record<string, number>
): IftaCalculationResult {
  return useMemo(() => {
    const totalMiles = trips.reduce((sum, t) => {
      const resolved = t.resolvedMiles || [];
      return sum + resolved.reduce((s, r) => s + r.miles, 0);
    }, 0);
    const totalFuelPurchased = fuelReceipts.reduce((sum, r) => sum + (r.gallons || 0), 0);
    const fleetMpg = totalFuelPurchased > 0 ? totalMiles / totalFuelPurchased : 0;

    // Aggregate miles and estimated flag per jurisdiction
    const milesMap: Record<string, { miles: number; hasEstimated: boolean }> = {};
    for (const trip of trips) {
      for (const seg of trip.resolvedMiles || []) {
        if (!milesMap[seg.state]) milesMap[seg.state] = { miles: 0, hasEstimated: false };
        milesMap[seg.state].miles += seg.miles;
        if (seg.source === 'estimated') milesMap[seg.state].hasEstimated = true;
      }
    }

    // Aggregate fuel purchased per jurisdiction
    const fuelMap: Record<string, number> = {};
    for (const receipt of fuelReceipts) {
      fuelMap[receipt.state] = (fuelMap[receipt.state] || 0) + (receipt.gallons || 0);
    }

    // Build union of all jurisdictions
    const allStates = Array.from(new Set([...Object.keys(milesMap), ...Object.keys(fuelMap)]));

    const jurisdictions: JurisdictionRow[] = [];
    let netTaxDue = 0;
    let totalFuelConsumed = 0;

    for (const state of allStates) {
      const milesDriven = milesMap[state]?.miles || 0;
      const hasEstimatedMiles = milesMap[state]?.hasEstimated || false;
      const fuelConsumed = fleetMpg > 0 ? milesDriven / fleetMpg : 0;
      const fuelPurchased = fuelMap[state] || 0;
      const netGallons = fuelConsumed - fuelPurchased;
      const taxRate = rates[state] || 0;
      const taxOwed = netGallons * taxRate;

      totalFuelConsumed += fuelConsumed;
      netTaxDue += taxOwed;

      jurisdictions.push({
        state,
        milesDriven,
        fuelConsumed,
        fuelPurchased,
        netGallons,
        taxRate,
        taxOwed,
        hasEstimatedMiles,
      });
    }

    // Sort: US states alphabetically first, then CA provinces
    const caProvinces = new Set(['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'ON', 'QC', 'SK']);
    jurisdictions.sort((a, b) => {
      const aCA = caProvinces.has(a.state) ? 1 : 0;
      const bCA = caProvinces.has(b.state) ? 1 : 0;
      if (aCA !== bCA) return aCA - bCA;
      return a.state.localeCompare(b.state);
    });

    return {
      jurisdictions,
      totalMiles,
      totalFuelPurchased,
      totalFuelConsumed,
      fleetMpg,
      netTaxDue,
    };
  }, [trips, fuelReceipts, rates]);
}
