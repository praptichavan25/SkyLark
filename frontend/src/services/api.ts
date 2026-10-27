import type { Flight } from '../data/flightData';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

export interface BackendFlightResponse {
  success: boolean;
  provider?: string;
  query: {
    from: string;
    to: string;
    date: string;
  };
  count: number;
  flights: Array<{
    id: string;
    flightNumber: string;
    airline: {
      name: string;
      code: string;
    };
    departure: {
      airport: string;
      city: string;
      time: string;
      terminal?: string;
      gate?: string;
    };
    arrival: {
      airport: string;
      city: string;
      time: string;
      terminal?: string;
      gate?: string;
    };
    duration: string;
    durationMinutes?: number;
    stops: number;
    aircraft: string;
    price: number | null;
    status: string;
    date: string;
    stopsRoute?: string[];
    seats?: number;
    onTimeRating?: number;
  }>;
}

export interface SearchFlightParams {
  from: string;
  to: string;
  date: string;
  sortBy?: 'price' | 'departure' | 'duration';
  airline?: string;
  stops?: number;
  tripType?: 'oneway' | 'roundtrip';
  cabinClass?: string;
  passengers?: { adults: number; children: number };
}


/**
 * Normalizes backend flight structure into frontend Flight format.
 */
function normalizeBackendFlight(bf: BackendFlightResponse['flights'][0]): Flight {
  const durationParts = bf.duration.match(/(\d+)h\s*(\d+)m/);
  const calculatedMinutes = durationParts
    ? parseInt(durationParts[1], 10) * 60 + parseInt(durationParts[2], 10)
    : 130;

  return {
    flightNumber: bf.flightNumber,
    airline: bf.airline?.name || 'Aviation Carrier',
    airlineCode: bf.airline?.code || bf.flightNumber.substring(0, 2),
    from: bf.departure?.airport || 'DEP',
    to: bf.arrival?.airport || 'ARR',
    departure: bf.departure?.time || '--:--',
    arrival: bf.arrival?.time || '--:--',
    duration: bf.duration || '2h 15m',
    durationMinutes: bf.durationMinutes || calculatedMinutes,
    aircraft: bf.aircraft || 'Airbus / Boeing',
    stops: bf.stops ?? 0,
    price: bf.price,
    class: 'Economy',
    seats: bf.seats ?? 12,
    onTimeRating: bf.onTimeRating ?? 92,
    terminal: bf.departure?.terminal,
    gate: bf.departure?.gate,
    status: (bf.status as Flight['status']) || 'Scheduled',
    date: bf.date,
  };
}

export const api = {
  /**
   * Search flights via the backend API.
   */
  async searchFlights(params: SearchFlightParams): Promise<{
    flights: Flight[];
    count: number;
    provider: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/flights/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        from: params.from,
        to: params.to,
        date: params.date,
        sortBy: params.sortBy,
        airline: params.airline,
        stops: params.stops,
        tripType: params.tripType,
        cabinClass: params.cabinClass,
        passengers: params.passengers,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Server returned HTTP ${res.status}`);
    }

    const data: BackendFlightResponse = await res.json();
    const normalized = (data.flights || []).map(normalizeBackendFlight);

    return {
      flights: normalized,
      count: data.count || normalized.length,
      provider: data.provider || 'aviationstack',
    };
  },

  /**
   * Check backend health status.
   */
  async checkHealth(): Promise<{ status: string; aviationstackConfigured: boolean }> {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },
};
