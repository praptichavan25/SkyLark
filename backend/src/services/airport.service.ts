import { Airport } from '../types/airport.types';
import { AIRPORTS } from '../data/airports';
import { Tree } from '../dsa/Tree';
import { Graph } from '../dsa/Graph';
import { FLIGHTS } from '../data/flights';

class AirportService {
  private airports: Airport[] = AIRPORTS;
  private destinationTree: Tree;
  private flightGraph: Graph;

  constructor() {
    this.destinationTree = this.initializeDestinationTree();
    this.flightGraph = this.initializeFlightGraph();
  }

  /**
   * Search airports by query string matching city, airport name, IATA, or ICAO.
   */
  searchAirports(query: string): Airport[] {
    if (!query || typeof query !== 'string') return [];
    const q = query.trim().toLowerCase();
    return this.airports.filter(
      a =>
        a.iata.toLowerCase().includes(q) ||
        a.icao.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q)
    );
  }

  /**
   * Find airport by IATA code.
   */
  getAirportByIata(iata: string): Airport | undefined {
    const code = iata.toUpperCase();
    return this.airports.find(a => a.iata.toUpperCase() === code);
  }

  getAllAirports(): Airport[] {
    return [...this.airports];
  }

  /**
   * ── DSA 4: TREE ───────────────────────────────────────────────────────────
   * Builds destination geographic hierarchy:
   *  WORLD
   *  ├── ASIA
   *  │   ├── INDIA
   *  │   │   ├── Mumbai (BOM)
   *  │   │   ├── Delhi (DEL)
   *  │   │   ├── Bengaluru (BLR)
   *  │   │   ├── Hyderabad (HYD)
   *  │   │   └── Chennai (MAA)
   *  │   └── UAE
   *  │       └── Dubai (DXB)
   *  └── EUROPE
   *      ├── UK
   *      │   └── London (LHR)
   *      └── FRANCE
   *          └── Paris (CDG)
   */
  private initializeDestinationTree(): Tree {
    const tree = new Tree('WORLD');

    // Continents
    tree.insert('WORLD', 'ASIA', undefined);
    tree.insert('WORLD', 'EUROPE', undefined);
    tree.insert('WORLD', 'NORTH AMERICA', undefined);
    tree.insert('WORLD', 'OCEANIA', undefined);

    // Countries under ASIA
    tree.insert('ASIA', 'INDIA', undefined);
    tree.insert('ASIA', 'UAE', undefined);
    tree.insert('ASIA', 'QATAR', undefined);
    tree.insert('ASIA', 'SINGAPORE', undefined);
    tree.insert('ASIA', 'JAPAN', undefined);

    // Countries under EUROPE
    tree.insert('EUROPE', 'UNITED KINGDOM', undefined);
    tree.insert('EUROPE', 'FRANCE', undefined);
    tree.insert('EUROPE', 'GERMANY', undefined);

    // Countries under NORTH AMERICA
    tree.insert('NORTH AMERICA', 'UNITED STATES', undefined);

    // Countries under OCEANIA
    tree.insert('OCEANIA', 'AUSTRALIA', undefined);

    // Cities under INDIA
    tree.insert('INDIA', 'Mumbai', 'BOM');
    tree.insert('INDIA', 'Delhi', 'DEL');
    tree.insert('INDIA', 'Bengaluru', 'BLR');
    tree.insert('INDIA', 'Hyderabad', 'HYD');
    tree.insert('INDIA', 'Chennai', 'MAA');
    tree.insert('INDIA', 'Kolkata', 'CCU');

    // Cities under UAE
    tree.insert('UAE', 'Dubai', 'DXB');

    // Cities under QATAR
    tree.insert('QATAR', 'Doha', 'DOH');

    // Cities under SINGAPORE
    tree.insert('SINGAPORE', 'Singapore', 'SIN');

    // Cities under JAPAN
    tree.insert('JAPAN', 'Tokyo', 'HND');

    // Cities under UK
    tree.insert('UNITED KINGDOM', 'London', 'LHR');

    // Cities under FRANCE
    tree.insert('FRANCE', 'Paris', 'CDG');

    // Cities under GERMANY
    tree.insert('GERMANY', 'Frankfurt', 'FRA');

    // Cities under USA
    tree.insert('UNITED STATES', 'New York', 'JFK');

    // Cities under AUSTRALIA
    tree.insert('AUSTRALIA', 'Sydney', 'SYD');

    return tree;
  }

  getDestinationHierarchy() {
    return this.destinationTree.traverse();
  }

  /**
   * ── DSA 5: GRAPH ──────────────────────────────────────────────────────────
   * Builds airport network graph where:
   *  AIRPORT           = VERTEX
   *  FLIGHT CONNECTION = EDGE
   */
  private initializeFlightGraph(): Graph {
    const graph = new Graph();

    // 1. Add all airport vertices
    this.airports.forEach(airport => {
      graph.addVertex(airport.iata);
    });

    // 2. Add edges from all available flight connections in static flights
    FLIGHTS.forEach(flight => {
      graph.addEdge(
        flight.departure.airport,
        flight.arrival.airport,
        flight.price ?? undefined,
        {
          flightNumber: flight.flightNumber,
          duration: flight.duration,
          airline: flight.airline.name,
        }
      );
    });

    // 3. Add core international corridors so the full global network is connected
    const keyCorridors: {
      from: string;
      to: string;
      price: number;
      duration: string;
      airline: string;
      flightNumber: string;
    }[] = [
      { from: 'BOM', to: 'SIN', price: 21500, duration: '5h 15m', airline: 'Singapore Airlines', flightNumber: 'SQ 421' },
      { from: 'DEL', to: 'SIN', price: 22800, duration: '5h 30m', airline: 'Air India', flightNumber: 'AI 382' },
      { from: 'BLR', to: 'SIN', price: 19400, duration: '4h 45m', airline: 'IndiGo', flightNumber: '6E 53' },
      { from: 'SIN', to: 'SYD', price: 42000, duration: '7h 50m', airline: 'Qantas', flightNumber: 'QF 82' },
      { from: 'SIN', to: 'HND', price: 38000, duration: '6h 40m', airline: 'Japan Airlines', flightNumber: 'JL 36' },
      { from: 'DXB', to: 'HND', price: 54000, duration: '9h 25m', airline: 'Emirates', flightNumber: 'EK 318' },
      { from: 'LHR', to: 'JFK', price: 46500, duration: '7h 55m', airline: 'British Airways', flightNumber: 'BA 117' },
      { from: 'CDG', to: 'JFK', price: 49000, duration: '8h 20m', airline: 'Air France', flightNumber: 'AF 022' },
      { from: 'FRA', to: 'JFK', price: 51200, duration: '8h 40m', airline: 'Lufthansa', flightNumber: 'LH 400' },
      { from: 'DEL', to: 'JFK', price: 78000, duration: '14h 50m', airline: 'Air India', flightNumber: 'AI 101' },
      { from: 'LHR', to: 'CDG', price: 8500, duration: '1h 15m', airline: 'Air France', flightNumber: 'AF 1681' },
      { from: 'LHR', to: 'FRA', price: 9200, duration: '1h 35m', airline: 'British Airways', flightNumber: 'BA 906' },
      { from: 'BOM', to: 'CDG', price: 44000, duration: '9h 10m', airline: 'Air France', flightNumber: 'AF 217' },
      { from: 'DEL', to: 'FRA', price: 45000, duration: '8h 45m', airline: 'Lufthansa', flightNumber: 'LH 761' },
      { from: 'DXB', to: 'SYD', price: 68000, duration: '13h 45m', airline: 'Emirates', flightNumber: 'EK 412' },
      { from: 'DOH', to: 'LHR', price: 47000, duration: '7h 15m', airline: 'Qatar Airways', flightNumber: 'QR 007' },
      { from: 'BOM', to: 'DOH', price: 17500, duration: '3h 40m', airline: 'Qatar Airways', flightNumber: 'QR 557' },
      { from: 'DEL', to: 'HND', price: 41000, duration: '7h 20m', airline: 'All Nippon Airways', flightNumber: 'NH 838' },
      { from: 'MAA', to: 'SIN', price: 18200, duration: '4h 20m', airline: 'Singapore Airlines', flightNumber: 'SQ 529' },
      { from: 'HYD', to: 'DXB', price: 19800, duration: '4h 10m', airline: 'Emirates', flightNumber: 'EK 527' },
      { from: 'CCU', to: 'BOM', price: 6200, duration: '2h 45m', airline: 'Air India', flightNumber: 'AI 676' },
      { from: 'CCU', to: 'DEL', price: 5800, duration: '2h 20m', airline: 'IndiGo', flightNumber: '6E 204' },
    ];

    keyCorridors.forEach(c => {
      graph.addEdge(c.from, c.to, c.price, {
        flightNumber: c.flightNumber,
        duration: c.duration,
        airline: c.airline,
      });
      // also ensure reverse edge for bidirectional route network
      graph.addEdge(c.to, c.from, c.price, {
        flightNumber: c.flightNumber,
        duration: c.duration,
        airline: c.airline,
      });
    });

    return graph;
  }

  /**
   * Returns the graph nodes and edges for GET /api/routes
   */
  getRouteGraph() {
    const vertices = this.flightGraph.getVertices();
    const edges = this.flightGraph.getEdges();

    const nodes = vertices.map(code => {
      const airport = this.getAirportByIata(code);
      return {
        id: code,
        name: airport?.name || code,
        city: airport?.city || code,
        country: airport?.country || '',
        lat: airport?.lat ?? 0,
        lng: airport?.lng ?? 0,
        continent: airport?.continent || '',
      };
    });

    return {
      nodes,
      edges,
    };
  }
}

export const airportService = new AirportService();
