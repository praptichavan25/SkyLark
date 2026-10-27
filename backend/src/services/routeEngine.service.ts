import { AIRPORTS } from '../data/airports';
import { FLEET, Aircraft } from '../data/mockData';

export interface RouteStop {
  code: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  continent?: string;
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
}

export interface OrderedJourneyRoute {
  id: string;
  aircraftId: string;
  aircraft: {
    id: string;
    model: string;
    manufacturer: string;
    category: string;
    maxSpeedMach: number;
    rangeNm: number;
    passengerCapacity: number;
    description: string;
  };
  stops: RouteStop[];
  legs: FlightLeg[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
  totalDurationFormatted: string;
  createdAt: string;
}

export interface RouteCalculationInput {
  origin: string;
  destination: string;
  stopovers?: string[];
  aircraftId?: string;
}

/**
 * Great-circle distance calculation via Haversine formula (km)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
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

/**
 * Format minutes into readable "Xh Ym"
 */
export function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

class RouteEngineService {
  private routeStore: Map<string, OrderedJourneyRoute> = new Map();

  /**
   * Validate and get aircraft by ID
   */
  getAircraft(aircraftId?: string): Aircraft {
    const id = (aircraftId || 'e195-e2').toLowerCase();
    const aircraft = FLEET.find(a => a.id.toLowerCase() === id);
    if (!aircraft) {
      throw new Error(`INVALID_AIRCRAFT: Aircraft with ID "${aircraftId}" does not exist in the fleet.`);
    }
    return aircraft;
  }

  /**
   * Calculate aircraft flight speed in km/h based on Mach number
   * Mach 1 ≈ 1062 km/h at typical cruise altitude (35,000+ ft)
   */
  getAircraftCruiseSpeedKmH(aircraft: Aircraft): number {
    return Math.round(aircraft.maxSpeedMach * 1060);
  }

  /**
   * Calculate leg duration in minutes based on distance and aircraft speed,
   * with a taxi/climb/descent maneuver allowance.
   */
  calculateLegDurationMinutes(distanceKm: number, aircraft: Aircraft): number {
    const speedKmH = this.getAircraftCruiseSpeedKmH(aircraft);
    const cruiseHours = distanceKm / speedKmH;
    const terminalBufferMinutes = 20; // 20 mins for taxi/takeoff/descent
    return Math.max(30, Math.round(cruiseHours * 60 + terminalBufferMinutes));
  }

  /**
   * Validate airport code against known dataset
   */
  getAirport(code: string) {
    const cleanCode = code.trim().toUpperCase();
    const airport = AIRPORTS.find(a => a.iata.toUpperCase() === cleanCode);
    if (!airport) {
      throw new Error(`INVALID_AIRPORT: Airport with IATA code "${code}" is not in the SkyLark network.`);
    }
    if (typeof airport.lat !== 'number' || typeof airport.lng !== 'number') {
      throw new Error(`MISSING_COORDINATES: Airport "${code}" has missing or invalid coordinates.`);
    }
    return airport;
  }

  /**
   * Build Canonical Ordered Route from origin, stopovers, and destination.
   * Enforces zero, one, two, or multiple stopovers with strict sequence validation.
   */
  buildOrderedRoute(input: RouteCalculationInput): OrderedJourneyRoute {
    if (!input.origin || !input.destination) {
      throw new Error('INSUFFICIENT_STOPS: Both origin and destination airports are mandatory.');
    }

    const aircraft = this.getAircraft(input.aircraftId);

    // Filter and sanitize stopovers array
    const rawStopovers = Array.isArray(input.stopovers)
      ? input.stopovers.map(s => String(s).trim().toUpperCase()).filter(Boolean)
      : [];

    const orderedCodes = [
      input.origin.trim().toUpperCase(),
      ...rawStopovers,
      input.destination.trim().toUpperCase(),
    ];

    if (orderedCodes.length < 2) {
      throw new Error('INSUFFICIENT_STOPS: A route must have at least 2 airports.');
    }

    // Check consecutive duplicate airports
    for (let i = 0; i < orderedCodes.length - 1; i++) {
      if (orderedCodes[i] === orderedCodes[i + 1]) {
        throw new Error(
          `CONSECUTIVE_DUPLICATES: Consecutive duplicate stop "${orderedCodes[i]}" at position ${i + 1} is not allowed.`
        );
      }
    }

    // Resolve RouteStops with exact index and role
    const stops: RouteStop[] = orderedCodes.map((code, index) => {
      const airport = this.getAirport(code);
      const isFirst = index === 0;
      const isLast = index === orderedCodes.length - 1;

      return {
        code: airport.iata,
        name: airport.name,
        city: airport.city,
        country: airport.country,
        lat: airport.lat,
        lng: airport.lng,
        continent: airport.continent,
        stopIndex: index,
        role: isFirst ? 'ORIGIN' : isLast ? 'DESTINATION' : 'STOPOVER',
      };
    });

    // Generate consecutive flight legs: stops[i] -> stops[i+1]
    const legs: FlightLeg[] = [];
    let totalDistanceKm = 0;
    let totalDurationMinutes = 0;

    for (let i = 0; i < stops.length - 1; i++) {
      const from = stops[i];
      const to = stops[i + 1];
      const dist = calculateDistanceKm(from.lat, from.lng, to.lat, to.lng);
      const legDurationMin = this.calculateLegDurationMinutes(dist, aircraft);

      totalDistanceKm += dist;
      totalDurationMinutes += legDurationMin;

      legs.push({
        legIndex: i,
        from,
        to,
        distanceKm: dist,
        durationMinutes: legDurationMin,
        durationFormatted: formatMinutes(legDurationMin),
        flightNumber: `SK-${100 + i * 2}-${from.code}${to.code}`,
        airline: 'SkyLark International',
      });
    }

    const routeId = `RT-${Date.now().toString(36).toUpperCase()}-${stops[0].code}-${stops[stops.length - 1].code}`;

    const route: OrderedJourneyRoute = {
      id: routeId,
      aircraftId: aircraft.id,
      aircraft: {
        id: aircraft.id,
        model: aircraft.model,
        manufacturer: aircraft.manufacturer,
        category: aircraft.category,
        maxSpeedMach: aircraft.maxSpeedMach,
        rangeNm: aircraft.rangeNm,
        passengerCapacity: aircraft.passengerCapacity,
        description: aircraft.description,
      },
      stops,
      legs,
      totalDistanceKm,
      totalDurationMinutes,
      totalDurationFormatted: formatMinutes(totalDurationMinutes),
      createdAt: new Date().toISOString(),
    };

    // Store in persistence map
    this.routeStore.set(routeId, route);

    return route;
  }

  /**
   * Retrieve a persisted route by ID
   */
  getRouteById(id: string): OrderedJourneyRoute | undefined {
    return this.routeStore.get(id);
  }

  /**
   * List all persisted routes
   */
  getAllRoutes(): OrderedJourneyRoute[] {
    return Array.from(this.routeStore.values());
  }

  /**
   * Reset store (used in testing)
   */
  clearRoutes(): void {
    this.routeStore.clear();
  }
}

export const routeEngineService = new RouteEngineService();
