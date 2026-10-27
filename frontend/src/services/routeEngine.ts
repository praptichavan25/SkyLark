/**
 * SkyLark — Frontend Route Engine & Multi-Stop Animation Manager
 *
 * Provides:
 *  - Canonical ordered route representation: [origin, ...stopovers, destination]
 *  - Consecutive leg generation: Leg i from stops[i] to stops[i+1]
 *  - 3 Selectable Aircraft models with visual signatures & cruise speeds
 *  - Sequential multi-leg animation engine tracking exact stopover arrivals
 */

import {
  AIRPORT_GEO,
  projectGeoToSvg,
  generateCurvedRoutePath,
} from '../data/routeNetwork';
export type { AirportGeo } from '../data/routeNetwork';

export interface RouteStop {
  code: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  stopIndex: number;
  role: 'ORIGIN' | 'STOPOVER' | 'DESTINATION';
}

export interface FlightLeg {
  legIndex: number;
  from: RouteStop;
  to: RouteStop;
  distanceKm: number;
  durationMinutes: number;
  durationFormatted: string;
  flightNumber: string;
  airline: string;
  svgPath: string;
}

export interface AircraftOption {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  cruiseSpeedKmH: number;
  maxRangeKm: number;
  passengerCapacity: number;
  description: string;
  badge: string;
  modelCode: string;
}

/**
 * The 3 Independently Selectable Aircraft in SkyLark Fleet:
 *  1. Gulfstream G650ER — Ultra Long Range Private Jet
 *  2. Airbus A350-900 — Widebody Intercontinental Flagship
 *  3. Embraer E195-E2 — Next-Gen Commercial Regional Jet (matches user reference photo)
 */
export const FLEET_AIRCRAFT: AircraftOption[] = [
  {
    id: 'e195-e2',
    name: 'Embraer E195-E2',
    manufacturer: 'Embraer',
    category: 'Next-Gen Commercial Regional Jet',
    cruiseSpeedKmH: 870,
    maxRangeKm: 4815,
    passengerCapacity: 132,
    description: 'Ultra-quiet Pratt & Whitney geared turbofan airliner with gull wings and high aerodynamic efficiency.',
    badge: 'REGIONAL JET',
    modelCode: 'E295',
  },
  {
    id: 'a350-900',
    name: 'Airbus A350-900',
    manufacturer: 'Airbus',
    category: 'Widebody Intercontinental Jet',
    cruiseSpeedKmH: 903,
    maxRangeKm: 15000,
    passengerCapacity: 325,
    description: 'Long-range composite airliner featuring adaptive winglets, twin high-thrust Trent XWB engines.',
    badge: 'WIDEBODY',
    modelCode: 'A359',
  },
  {
    id: 'g650er',
    name: 'Gulfstream G650ER',
    manufacturer: 'Gulfstream',
    category: 'Ultra Long Range Private Jet',
    cruiseSpeedKmH: 956,
    maxRangeKm: 13890,
    passengerCapacity: 14,
    description: 'Private executive aircraft designed for non-stop global travel with lowest cabin altitude.',
    badge: 'PRIVATE JET',
    modelCode: 'GLF6',
  },
];

export interface CanonicalJourney {
  id: string;
  aircraft: AircraftOption;
  stops: RouteStop[];
  legs: FlightLeg[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
  totalDurationFormatted: string;
}

/**
 * Calculate great-circle distance (km) between 2 points
 */
export function calculateGreatCircleKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/**
 * Builds the canonical ordered route from an array of airport codes.
 * Generates consecutive flight legs from stops[i] to stops[i+1].
 */
export function buildCanonicalRoute(
  airportCodes: string[],
  aircraftId: string = 'e195-e2'
): CanonicalJourney {
  const aircraft =
    FLEET_AIRCRAFT.find(a => a.id.toLowerCase() === aircraftId.toLowerCase()) ||
    FLEET_AIRCRAFT[0];

  // Filter valid codes
  const validCodes = airportCodes.filter(c => !!AIRPORT_GEO[c]);
  if (validCodes.length < 2) {
    // Fallback to minimal BOM -> LHR if insufficient
    validCodes.push('BOM', 'LHR');
  }

  // Filter consecutive duplicates
  const deduplicatedCodes: string[] = [];
  for (let i = 0; i < validCodes.length; i++) {
    if (i === 0 || validCodes[i] !== validCodes[i - 1]) {
      deduplicatedCodes.push(validCodes[i]);
    }
  }

  const stops: RouteStop[] = deduplicatedCodes.map((code, index) => {
    const geo = AIRPORT_GEO[code];
    const pos = projectGeoToSvg(geo.lng, geo.lat);
    const isFirst = index === 0;
    const isLast = index === deduplicatedCodes.length - 1;

    return {
      code,
      name: geo.name,
      city: geo.city,
      country: geo.country,
      lat: geo.lat,
      lng: geo.lng,
      x: pos.x,
      y: pos.y,
      stopIndex: index,
      role: isFirst ? 'ORIGIN' : isLast ? 'DESTINATION' : 'STOPOVER',
    };
  });

  const legs: FlightLeg[] = [];
  let totalDistanceKm = 0;
  let totalDurationMinutes = 0;

  for (let i = 0; i < stops.length - 1; i++) {
    const from = stops[i];
    const to = stops[i + 1];
    const dist = calculateGreatCircleKm(from.lat, from.lng, to.lat, to.lng);
    const p1 = { x: from.x, y: from.y };
    const p2 = { x: to.x, y: to.y };
    const svgPath = generateCurvedRoutePath(p1, p2);

    // Calculate duration based on aircraft speed + 20 mins terminal buffer
    const cruiseHours = dist / aircraft.cruiseSpeedKmH;
    const legMinutes = Math.max(30, Math.round(cruiseHours * 60 + 20));

    totalDistanceKm += dist;
    totalDurationMinutes += legMinutes;

    legs.push({
      legIndex: i,
      from,
      to,
      distanceKm: dist,
      durationMinutes: legMinutes,
      durationFormatted: formatDuration(legMinutes),
      flightNumber: `SK-${110 + i * 2}-${from.code}${to.code}`,
      airline: 'SkyLark International',
      svgPath,
    });
  }

  return {
    id: `route-${deduplicatedCodes.join('-')}-${aircraft.id}`,
    aircraft,
    stops,
    legs,
    totalDistanceKm,
    totalDurationMinutes,
    totalDurationFormatted: formatDuration(totalDurationMinutes),
  };
}
