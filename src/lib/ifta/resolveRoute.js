import { STATE_CENTROIDS } from './state-centroids.js';
import { STATE_ADJACENCY } from './state-adjacency.js';

const EARTH_RADIUS_MILES = 3958.8;

function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a));
}

// BFS shortest path between two jurisdictions. Returns array of state codes.
function bfsPath(origin, destination) {
  if (origin === destination) return [origin];
  if (!STATE_ADJACENCY[origin] || !STATE_ADJACENCY[destination]) return null;

  const queue = [[origin]];
  const visited = new Set([origin]);

  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];
    for (const neighbor of (STATE_ADJACENCY[current] || [])) {
      if (!STATE_ADJACENCY[neighbor]) continue; // skip non-IFTA jurisdictions (NT, YT)
      if (neighbor === destination) return [...path, neighbor];
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }
  return null; // disconnected — should not happen with valid IFTA states
}

// Distribute totalMiles proportionally across a sequence of states using Haversine distances.
function distributeByHaversine(states, totalMiles) {
  if (states.length === 1) return [{ state: states[0], miles: totalMiles }];

  const segments = [];
  let totalDist = 0;
  for (let i = 0; i < states.length - 1; i++) {
    const a = STATE_CENTROIDS[states[i]];
    const b = STATE_CENTROIDS[states[i + 1]];
    if (!a || !b) continue;
    const dist = haversineDistance(a.lat, a.lng, b.lat, b.lng);
    segments.push({ from: states[i], to: states[i + 1], dist });
    totalDist += dist;
  }

  // Each state gets credit for the segments it bounds.
  const stateDistMap = {};
  for (const seg of segments) {
    stateDistMap[seg.from] = (stateDistMap[seg.from] || 0) + seg.dist / 2;
    stateDistMap[seg.to] = (stateDistMap[seg.to] || 0) + seg.dist / 2;
  }

  if (totalDist === 0) {
    // All centroids coincide — equal split
    return states.map((s) => ({ state: s, miles: totalMiles / states.length }));
  }

  return Object.entries(stateDistMap).map(([state, dist]) => ({
    state,
    miles: (dist / totalDist) * totalMiles,
  }));
}

/**
 * Resolve how many miles a trip spent in each IFTA jurisdiction.
 *
 * @param {string} originState          - IFTA state/province code of trip origin
 * @param {string} destinationState     - IFTA state/province code of trip destination
 * @param {number} totalMiles           - Total odometer miles for this trip
 * @param {string[]} [waypointStates]   - Optional ordered intermediate states (driver-entered)
 * @param {Object} [stateMiles]         - Optional map of { stateCode: miles } (driver-entered)
 * @returns {{ state: string, miles: number, source: 'driver-reported'|'estimated' }[]}
 */
export function resolveRoute(originState, destinationState, totalMiles, waypointStates, stateMiles) {
  const origin = (originState || '').toUpperCase().trim();
  const destination = (destinationState || '').toUpperCase().trim();
  const miles = Number(totalMiles) || 0;

  // Case 1: Same state
  if (origin === destination) {
    return [{ state: origin, miles, source: 'driver-reported' }];
  }

  // Case 2: Driver-provided stateMiles that sum within ±5% of totalMiles
  if (stateMiles && typeof stateMiles === 'object') {
    const entries = Object.entries(stateMiles)
      .filter(([, v]) => Number(v) > 0)
      .map(([state, v]) => ({ state: state.toUpperCase().trim(), miles: Number(v) }));
    if (entries.length > 0) {
      const sum = entries.reduce((acc, e) => acc + e.miles, 0);
      if (sum > 0 && Math.abs(sum - miles) / miles <= 0.05) {
        return entries.map((e) => ({ ...e, source: 'driver-reported' }));
      }
    }
  }

  // Case 3: Driver-provided waypoints — BFS through each waypoint segment
  if (waypointStates && Array.isArray(waypointStates) && waypointStates.length > 0) {
    const waypoints = waypointStates.map((s) => s.toUpperCase().trim()).filter(Boolean);
    const fullPath = [origin];
    for (const wp of waypoints) {
      const segment = bfsPath(fullPath[fullPath.length - 1], wp);
      if (segment) {
        for (let i = 1; i < segment.length; i++) fullPath.push(segment[i]);
      } else {
        fullPath.push(wp);
      }
    }
    const finalSegment = bfsPath(fullPath[fullPath.length - 1], destination);
    if (finalSegment) {
      for (let i = 1; i < finalSegment.length; i++) fullPath.push(finalSegment[i]);
    } else {
      fullPath.push(destination);
    }
    const uniquePath = [...new Set(fullPath)];
    return distributeByHaversine(uniquePath, miles).map((e) => ({ ...e, source: 'estimated' }));
  }

  // Case 4: Direct adjacency — 50/50 split
  if ((STATE_ADJACENCY[origin] || []).includes(destination)) {
    return [
      { state: origin, miles: miles / 2, source: 'estimated' },
      { state: destination, miles: miles / 2, source: 'estimated' },
    ];
  }

  // Case 5: BFS shortest path
  const path = bfsPath(origin, destination);
  if (path && path.length > 0) {
    return distributeByHaversine(path, miles).map((e) => ({ ...e, source: 'estimated' }));
  }

  // Case 6: Fallback — equal split
  return [
    { state: origin, miles: miles / 2, source: 'estimated' },
    { state: destination, miles: miles / 2, source: 'estimated' },
  ];
}
