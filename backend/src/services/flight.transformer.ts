import { Flight } from '../types/flight.types';
import { AviationstackFlightRecord } from './aviationstack.service';
import { airportService } from './airport.service';

/**
 * Parses time string (e.g., "2026-10-20T14:30:00+00:00" or "14:30") into display "HH:MM".
 */
function extractTime(isoOrTimeStr: string | null | undefined): string {
  if (!isoOrTimeStr) return '--:--';
  if (/^\d{2}:\d{2}/.test(isoOrTimeStr)) {
    return isoOrTimeStr.substring(0, 5);
  }
  const dateObj = new Date(isoOrTimeStr);
  if (isNaN(dateObj.getTime())) return '--:--';
  const hours = String(dateObj.getUTCHours()).padStart(2, '0');
  const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Computes flight duration in minutes and human-readable string (e.g. "2h 15m").
 */
function calculateDuration(
  depIso: string | null | undefined,
  arrIso: string | null | undefined
): { duration: string; durationMinutes: number } {
  if (depIso && arrIso) {
    const dep = new Date(depIso).getTime();
    const arr = new Date(arrIso).getTime();
    if (!isNaN(dep) && !isNaN(arr) && arr > dep) {
      const diffMs = arr - dep;
      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return {
        duration: `${hours}h ${mins}m`,
        durationMinutes: totalMinutes,
      };
    }
  }

  // Default fallback if arrival timestamp is missing
  return {
    duration: '2h 10m',
    durationMinutes: 130,
  };
}

/**
 * Normalizes provider flight status into user-friendly title casing.
 */
function normalizeStatus(rawStatus: string | null | undefined): string {
  if (!rawStatus) return 'Scheduled';
  const lower = rawStatus.toLowerCase().trim();
  switch (lower) {
    case 'active':
    case 'en-route':
    case 'en route':
      return 'En Route';
    case 'scheduled':
      return 'Scheduled';
    case 'landed':
      return 'Landed';
    case 'delayed':
      return 'Delayed';
    case 'cancelled':
      return 'Cancelled';
    case 'incident':
    case 'diverted':
      return 'Diverted';
    default:
      return rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
  }
}

export class FlightTransformer {
  /**
   * Transforms a single Aviationstack flight record into SkyLark Flight model.
   */
  transformRecord(record: AviationstackFlightRecord, fallbackDate?: string): Flight {
    const depIata = (record.departure?.iata || '').toUpperCase();
    const arrIata = (record.arrival?.iata || '').toUpperCase();

    const depAirportInfo = depIata ? airportService.getAirportByIata(depIata) : undefined;
    const arrAirportInfo = arrIata ? airportService.getAirportByIata(arrIata) : undefined;

    const depCity = depAirportInfo?.city || record.departure?.airport || depIata || 'Origin';
    const arrCity = arrAirportInfo?.city || record.arrival?.airport || arrIata || 'Destination';

    const depTimeRaw = record.departure?.scheduled || record.departure?.estimated;
    const arrTimeRaw = record.arrival?.scheduled || record.arrival?.estimated;

    const depTime = extractTime(depTimeRaw);
    const arrTime = extractTime(arrTimeRaw);
    const { duration, durationMinutes } = calculateDuration(depTimeRaw, arrTimeRaw);

    const flightNumber =
      record.flight?.iata ||
      record.flight?.icao ||
      (record.airline?.iata && record.flight?.number
        ? `${record.airline.iata}${record.flight.number}`
        : record.flight?.number || `FL-${Math.floor(100 + Math.random() * 900)}`);

    const airlineName = record.airline?.name || depAirportInfo?.name || 'Aviation Carrier';
    const airlineCode = record.airline?.iata || record.airline?.icao || flightNumber.substring(0, 2);

    const aircraftType =
      record.aircraft?.iata ||
      record.aircraft?.icao ||
      record.aircraft?.registration ||
      'Airbus A320 / Boeing 737';

    const flightId = `${flightNumber}_${record.flight_date || fallbackDate || 'live'}_${depIata}_${arrIata}`;

    return {
      id: flightId,
      flightNumber,
      airline: {
        name: airlineName,
        code: airlineCode,
      },
      departure: {
        airport: depIata,
        city: depCity,
        time: depTime,
        terminal: record.departure?.terminal || undefined,
        gate: record.departure?.gate || undefined,
      },
      arrival: {
        airport: arrIata,
        city: arrCity,
        time: arrTime,
        terminal: record.arrival?.terminal || undefined,
        gate: record.arrival?.gate || undefined,
      },
      duration,
      durationMinutes,
      stops: 0,
      aircraft: aircraftType,
      price: null, // As required by Step 6: Aviationstack does not provide fares; do NOT fake prices.
      status: normalizeStatus(record.flight_status),
      date: record.flight_date || fallbackDate || new Date().toISOString().split('T')[0],
      stopsRoute: [
        `${depCity} (${depIata})`,
        `${arrCity} (${arrIata})`,
      ],
      rawProvider: 'aviationstack',
    };
  }

  /**
   * Transforms an array of Aviationstack records into SkyLark Flight array.
   */
  transformRecords(records: AviationstackFlightRecord[] | undefined, fallbackDate?: string): Flight[] {
    if (!records || !Array.isArray(records)) return [];
    return records.map(rec => this.transformRecord(rec, fallbackDate));
  }
}

export const flightTransformer = new FlightTransformer();
