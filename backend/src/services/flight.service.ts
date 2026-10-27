import { Flight, FlightIntelligence } from '../types/flight.types';
import { SearchQuery } from '../types/search.types';
import { FLIGHTS } from '../data/flights';
import { Queue } from '../dsa/Queue';
import { LinkedList } from '../dsa/LinkedList';
import { airportService } from './airport.service';
import { aviationstackService } from './aviationstack.service';
import { flightTransformer } from './flight.transformer';

interface EnqueuedSearchJob {
  requestId: string;
  query: SearchQuery;
  enqueuedAt: number;
}

class FlightService {
  private staticFlights: Flight[] = FLIGHTS;
  private flightCache: Map<string, Flight> = new Map();

  /**
   * ── DSA 2: QUEUE ─────────────────────────────────────────────────────────
   * Manages incoming flight search requests in sequential FIFO order.
   * Flow:
   *   1. Queue.enqueue(request)
   *   2. Process search matching (Aviationstack live provider / fallback)
   *   3. Queue.dequeue()
   *   4. Return flight results
   */
  private searchProcessingQueue: Queue<EnqueuedSearchJob> = new Queue<EnqueuedSearchJob>();

  constructor() {
    // Seed static flights into cache for instant ID lookup
    this.staticFlights.forEach(f => this.flightCache.set(f.id, f));
  }

  /**
   * Process a flight search query using the Queue and real Aviationstack provider.
   */
  async searchFlights(query: SearchQuery): Promise<{
    query: SearchQuery;
    count: number;
    flights: Flight[];
    provider: 'aviationstack' | 'static';
  }> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const job: EnqueuedSearchJob = {
      requestId,
      query,
      enqueuedAt: Date.now(),
    };

    // 1. Enqueue incoming search job (DSA 2: FIFO Queue)
    this.searchProcessingQueue.enqueue(job);

    try {
      const fromCode = query.from.toUpperCase();
      const toCode = query.to.toUpperCase();
      let matchingFlights: Flight[] = [];
      let activeProvider: 'aviationstack' | 'static' = 'static';

      // 2. Fetch from real Aviationstack provider if configured
      if (aviationstackService.isConfigured()) {
        try {
          const providerResponse = await aviationstackService.fetchFlights({
            dep_iata: fromCode,
            arr_iata: toCode,
            flight_date: query.date,
            limit: 100,
          });

          if (providerResponse.data && providerResponse.data.length > 0) {
            activeProvider = 'aviationstack';
            // Transform raw provider data to SkyLark Flight format
            matchingFlights = flightTransformer.transformRecords(providerResponse.data, query.date);

            // Store live flights in cache so getFlightById / getFlightIntelligence work seamlessly
            matchingFlights.forEach(f => {
              this.flightCache.set(f.id, f);
              this.flightCache.set(f.flightNumber, f);
            });
          }
        } catch (providerErr: unknown) {
          console.warn('⚠️ Aviationstack live lookup failed, falling back to local dataset:', providerErr instanceof Error ? providerErr.message : providerErr);
        }
      }

      // If provider yielded 0 flights or was unconfigured/failed, use local static dataset
      if (matchingFlights.length === 0) {
        matchingFlights = this.staticFlights.filter(f => {
          const matchRoute =
            f.departure.airport.toUpperCase() === fromCode &&
            f.arrival.airport.toUpperCase() === toCode;
          return matchRoute;
        });
      }

      // 3. Optional filtering: airline
      if (query.airline && query.airline !== 'all') {
        const airlineQuery = query.airline.toLowerCase();
        matchingFlights = matchingFlights.filter(
          f =>
            f.airline.name.toLowerCase().includes(airlineQuery) ||
            f.airline.code.toLowerCase() === airlineQuery
        );
      }

      // 4. Optional filtering: stops
      if (typeof query.stops === 'number') {
        matchingFlights = matchingFlights.filter(f => f.stops === query.stops);
      }

      // 5. Optional sorting: price, departure, duration
      if (query.sortBy === 'price') {
        matchingFlights.sort((a, b) => {
          if (a.price === null && b.price === null) return 0;
          if (a.price === null) return 1;
          if (b.price === null) return -1;
          return a.price - b.price;
        });
      } else if (query.sortBy === 'departure') {
        matchingFlights.sort((a, b) => a.departure.time.localeCompare(b.departure.time));
      } else if (query.sortBy === 'duration') {
        const parseDuration = (d: string) => {
          const parts = d.match(/(\d+)h\s*(\d+)m/);
          if (parts) return parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
          return 0;
        };
        matchingFlights.sort((a, b) => (a.durationMinutes || parseDuration(a.duration)) - (b.durationMinutes || parseDuration(b.duration)));
      }

      return {
        query,
        count: matchingFlights.length,
        flights: matchingFlights,
        provider: activeProvider,
      };
    } finally {
      // 6. Dequeue after processing is complete
      this.searchProcessingQueue.dequeue();
    }
  }

  /**
   * Get flight by ID or flight number.
   */
  getFlightById(id: string): Flight | undefined {
    return this.flightCache.get(id) || this.staticFlights.find(f => f.id === id || f.flightNumber === id);
  }

  /**
   * ── DSA 3: LINKED LIST ───────────────────────────────────────────────────
   * Represents a multi-stop flight journey as a Singly Linked List of waypoints.
   * Example:
   *   Mumbai (BOM) → Dubai (DXB) → London (LHR) → NULL
   */
  getFlightIntelligence(id: string): FlightIntelligence | null {
    const flight = this.getFlightById(id);
    if (!flight) return null;

    // Build multi-stop journey using manual LinkedList (DSA 3)
    const journeyList = new LinkedList<string>();

    if (flight.stopsRoute && flight.stopsRoute.length > 0) {
      // Insert each waypoint along the route
      flight.stopsRoute.forEach(stopName => {
        journeyList.insert(stopName);
      });
    } else {
      // Direct route: Origin → Destination
      journeyList.insert(`${flight.departure.city} (${flight.departure.airport})`);
      journeyList.insert(`${flight.arrival.city} (${flight.arrival.airport})`);
    }

    // Traverse the linked list to output the ordered sequence of stops
    const journeySteps = journeyList.traverse();

    const depAirport = airportService.getAirportByIata(flight.departure.airport);
    const arrAirport = airportService.getAirportByIata(flight.arrival.airport);

    return {
      flightNumber: flight.flightNumber,
      airline: flight.airline,
      aircraft: flight.aircraft,
      route: {
        origin: flight.departure.airport,
        destination: flight.arrival.airport,
        journey: journeySteps,
      },
      departure: flight.departure,
      arrival: flight.arrival,
      duration: flight.duration,
      stops: flight.stops,
      status: flight.status,
      airportInformation: {
        departureAirport: {
          iata: flight.departure.airport,
          name: depAirport?.name || flight.departure.airport,
          city: flight.departure.city,
          country: depAirport?.country || '',
        },
        arrivalAirport: {
          iata: flight.arrival.airport,
          name: arrAirport?.name || flight.arrival.airport,
          city: flight.arrival.city,
          country: arrAirport?.country || '',
        },
      },
    };
  }
}

export const flightService = new FlightService();
