/**
 * SkyLark — Flight Search Data Layer
 *
 * DSA preparedness:
 *   - Airport lookup uses a Hash Map (Record<string, Airport>)
 *   - Autocomplete uses a Trie structure (prepared for prefix search)
 *   - Flight data stored as an Array for easy sort/filter
 *   - Search functions are pure and replaceable with real API calls
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface Airport {
  code: string        // IATA code, e.g. "BOM"
  icao: string        // ICAO code, e.g. "VABB"
  city: string        // Display city name
  country: string
  name: string        // Full airport name
  timezone: string
}

export interface Flight {
  flightNumber: string
  airline: string
  airlineCode: string // 2-letter IATA airline code
  from: string        // IATA code
  to: string
  departure: string   // "HH:MM" 24h
  arrival: string
  duration: string    // "Xh Ym"
  durationMinutes: number
  aircraft: string
  stops: number
  price: number | null // null when real provider does not provide fares
  class: 'Economy' | 'Premium Economy' | 'Business' | 'First'
  seats: number       // remaining seats
  onTimeRating: number // 0-100
  terminal?: string
  gate?: string
  baggage?: string
  meal?: string
  status?: 'On Time' | 'Boarding' | 'Scheduled' | 'Delayed' | 'En Route' | 'Landed' | 'Cancelled'
  date?: string
  serial?: string
}


// ─────────────────────────────────────────────────────────────────────────────
// AIRPORT DATASET
// ─────────────────────────────────────────────────────────────────────────────

export const AIRPORTS: Airport[] = [
  { code: 'BOM', icao: 'VABB', city: 'Mumbai',    country: 'India',        name: 'Chhatrapati Shivaji Maharaj International Airport', timezone: 'IST' },
  { code: 'DEL', icao: 'VIDP', city: 'Delhi',     country: 'India',        name: 'Indira Gandhi International Airport',               timezone: 'IST' },
  { code: 'BLR', icao: 'VOBL', city: 'Bangalore', country: 'India',        name: 'Kempegowda International Airport',                  timezone: 'IST' },
  { code: 'MAA', icao: 'VOMM', city: 'Chennai',   country: 'India',        name: 'Chennai International Airport',                    timezone: 'IST' },
  { code: 'CCU', icao: 'VECC', city: 'Kolkata',   country: 'India',        name: 'Netaji Subhas Chandra Bose International Airport',  timezone: 'IST' },
  { code: 'HYD', icao: 'VOHS', city: 'Hyderabad', country: 'India',        name: 'Rajiv Gandhi International Airport',                timezone: 'IST' },
  { code: 'LHR', icao: 'EGLL', city: 'London',    country: 'UK',           name: 'Heathrow Airport',                                 timezone: 'BST' },
  { code: 'DXB', icao: 'OMDB', city: 'Dubai',     country: 'UAE',          name: 'Dubai International Airport',                      timezone: 'GST' },
  { code: 'SIN', icao: 'WSSS', city: 'Singapore', country: 'Singapore',    name: 'Changi Airport',                                   timezone: 'SGT' },
  { code: 'JFK', icao: 'KJFK', city: 'New York',  country: 'USA',          name: 'John F. Kennedy International Airport',            timezone: 'EST' },
  { code: 'CDG', icao: 'LFPG', city: 'Paris',     country: 'France',       name: 'Charles de Gaulle Airport',                       timezone: 'CET' },
  { code: 'HND', icao: 'RJTT', city: 'Tokyo',     country: 'Japan',        name: 'Haneda Airport',                                   timezone: 'JST' },
  { code: 'SYD', icao: 'YSSY', city: 'Sydney',    country: 'Australia',    name: 'Kingsford Smith International Airport',            timezone: 'AEST'},
  { code: 'FRA', icao: 'EDDF', city: 'Frankfurt', country: 'Germany',      name: 'Frankfurt Airport',                                timezone: 'CET' },
  { code: 'DOH', icao: 'OTHH', city: 'Doha',      country: 'Qatar',        name: 'Hamad International Airport',                     timezone: 'AST' },
]

export const AIRPORT_MAP: Record<string, Airport> = Object.fromEntries(
  AIRPORTS.map(a => [a.code, a])
)

// ─────────────────────────────────────────────────────────────────────────────
// TRIE — Prefix search for autocomplete
// ─────────────────────────────────────────────────────────────────────────────

class TrieNode {
  children: Map<string, TrieNode> = new Map()
  airportCodes: string[] = []
}

class AirportTrie {
  private root = new TrieNode()

  insert(text: string, airportCode: string): void {
    let node = this.root
    for (const char of text.toLowerCase()) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode())
      }
      node = node.children.get(char)!
      if (!node.airportCodes.includes(airportCode)) {
        node.airportCodes.push(airportCode)
      }
    }
  }

  search(prefix: string): string[] {
    let node = this.root
    for (const char of prefix.toLowerCase()) {
      if (!node.children.has(char)) return []
      node = node.children.get(char)!
    }
    return node.airportCodes
  }
}

const airportTrie = new AirportTrie()
for (const airport of AIRPORTS) {
  airportTrie.insert(airport.city, airport.code)
  airportTrie.insert(airport.name, airport.code)
  airportTrie.insert(airport.code, airport.code)
  const words = airport.city.split(' ')
  for (const word of words) {
    airportTrie.insert(word, airport.code)
  }
}

export function searchAirports(prefix: string, limit = 6): Airport[] {
  if (!prefix || prefix.trim().length === 0) {
    return ['BOM', 'DEL', 'DXB', 'LHR', 'SIN', 'JFK']
      .map(code => AIRPORT_MAP[code])
      .filter(Boolean)
      .slice(0, limit)
  }
  const codes = airportTrie.search(prefix.trim())
  return codes
    .map(code => AIRPORT_MAP[code])
    .filter(Boolean)
    .slice(0, limit)
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK FLIGHT DATASET
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_FLIGHTS: Flight[] = [
  // BOM → DEL
  {
    flightNumber: 'AI 101', airline: 'Air India', airlineCode: 'AI',
    from: 'BOM', to: 'DEL', departure: '08:30', arrival: '10:40',
    duration: '2h 10m', durationMinutes: 130, aircraft: 'Airbus A320neo',
    stops: 0, price: 5240, class: 'Economy', seats: 18, onTimeRating: 92,
    terminal: 'T2', gate: '14B', baggage: '15 kg check-in · 7 kg cabin',
    meal: 'Complimentary Warm Meal', status: 'On Time', serial: 'SK-101-BD'
  },
  {
    flightNumber: '6E 203', airline: 'IndiGo', airlineCode: '6E',
    from: 'BOM', to: 'DEL', departure: '11:20', arrival: '13:30',
    duration: '2h 10m', durationMinutes: 130, aircraft: 'Airbus A321neo',
    stops: 0, price: 4890, class: 'Economy', seats: 34, onTimeRating: 88,
    terminal: 'T1', gate: '22A', baggage: '15 kg check-in · 7 kg cabin',
    meal: 'Snack & Beverage purchase', status: 'On Time', serial: 'SK-203-BD'
  },
  {
    flightNumber: 'UK 955', airline: 'Vistara', airlineCode: 'UK',
    from: 'BOM', to: 'DEL', departure: '14:10', arrival: '16:25',
    duration: '2h 15m', durationMinutes: 135, aircraft: 'Boeing 787-9 Dreamliner',
    stops: 0, price: 5650, class: 'Economy', seats: 12, onTimeRating: 96,
    terminal: 'T2', gate: '08C', baggage: '20 kg check-in · 7 kg cabin',
    meal: 'Three-course Gourmet Dining', status: 'Boarding', serial: 'SK-955-BD'
  },
  {
    flightNumber: 'AI 865', airline: 'Air India', airlineCode: 'AI',
    from: 'BOM', to: 'DEL', departure: '06:00', arrival: '08:15',
    duration: '2h 15m', durationMinutes: 135, aircraft: 'Airbus A350-900',
    stops: 0, price: 5490, class: 'Economy', seats: 28, onTimeRating: 90,
    terminal: 'T2', gate: '11A', baggage: '25 kg check-in · 7 kg cabin',
    meal: 'Hot Breakfast & Fresh Coffee', status: 'On Time', serial: 'SK-865-BD'
  },
  {
    flightNumber: 'QP 1120', airline: 'Akasa Air', airlineCode: 'QP',
    from: 'BOM', to: 'DEL', departure: '16:45', arrival: '19:00',
    duration: '2h 15m', durationMinutes: 135, aircraft: 'Boeing 737 MAX 8',
    stops: 0, price: 4620, class: 'Economy', seats: 16, onTimeRating: 85,
    terminal: 'T1', gate: '05D', baggage: '15 kg check-in · 7 kg cabin',
    meal: 'Café Akasa Gourmet Selection', status: 'On Time', serial: 'SK-1120-BD'
  },
  {
    flightNumber: 'UK 992', airline: 'Vistara', airlineCode: 'UK',
    from: 'BOM', to: 'DEL', departure: '19:30', arrival: '21:45',
    duration: '2h 15m', durationMinutes: 135, aircraft: 'Airbus A321neo',
    stops: 0, price: 7850, class: 'Business', seats: 6, onTimeRating: 94,
    terminal: 'T2', gate: '02B', baggage: '30 kg check-in · 10 kg cabin',
    meal: 'Chef Curated Evening Supper', status: 'Scheduled', serial: 'SK-992-BD'
  },
  {
    flightNumber: '6E 5012', airline: 'IndiGo', airlineCode: '6E',
    from: 'BOM', to: 'DEL', departure: '22:15', arrival: '00:30',
    duration: '2h 15m', durationMinutes: 135, aircraft: 'Airbus A320neo',
    stops: 0, price: 4290, class: 'Economy', seats: 42, onTimeRating: 84,
    terminal: 'T1', gate: '18A', baggage: '15 kg check-in · 7 kg cabin',
    meal: 'Beverage & Cookie', status: 'Scheduled', serial: 'SK-5012-BD'
  },
  {
    flightNumber: 'SG 8169', airline: 'SpiceJet', airlineCode: 'SG',
    from: 'BOM', to: 'DEL', departure: '13:00', arrival: '16:20',
    duration: '3h 20m', durationMinutes: 200, aircraft: 'Boeing 737-800',
    stops: 1, price: 3950, class: 'Economy', seats: 9, onTimeRating: 75,
    terminal: 'T1', gate: '07C', baggage: '15 kg check-in · 7 kg cabin',
    meal: 'SpiceMax Meal Included', status: 'On Time', serial: 'SK-8169-BD'
  },
  {
    flightNumber: 'AI 103', airline: 'Air India', airlineCode: 'AI',
    from: 'BOM', to: 'DEL', departure: '15:20', arrival: '19:10',
    duration: '3h 50m', durationMinutes: 230, aircraft: 'Airbus A320',
    stops: 1, price: 4400, class: 'Economy', seats: 14, onTimeRating: 82,
    terminal: 'T2', gate: '16A', baggage: '20 kg check-in · 7 kg cabin',
    meal: 'Hot Lunch & Refreshment', status: 'On Time', serial: 'SK-103-BD'
  },

  // BLR → DEL
  {
    flightNumber: 'AI 505', airline: 'Air India', airlineCode: 'AI',
    from: 'BLR', to: 'DEL', departure: '07:00', arrival: '09:50',
    duration: '2h 50m', durationMinutes: 170, aircraft: 'Boeing 787-8',
    stops: 0, price: 5900, class: 'Economy', seats: 24, onTimeRating: 89,
    terminal: 'T1', gate: '09A', baggage: '20 kg check-in · 7 kg cabin',
    meal: 'Hot Breakfast', status: 'On Time', serial: 'SK-505-BLRDEL'
  },
  {
    flightNumber: '6E 612', airline: 'IndiGo', airlineCode: '6E',
    from: 'BLR', to: 'DEL', departure: '12:30', arrival: '15:15',
    duration: '2h 45m', durationMinutes: 165, aircraft: 'Airbus A321neo',
    stops: 0, price: 5120, class: 'Economy', seats: 30, onTimeRating: 86,
    terminal: 'T1', gate: '14B', baggage: '15 kg check-in · 7 kg cabin',
    meal: 'Snack Combo', status: 'On Time', serial: 'SK-612-BLRDEL'
  },

  // DEL → LHR
  {
    flightNumber: 'AI 111', airline: 'Air India', airlineCode: 'AI',
    from: 'DEL', to: 'LHR', departure: '14:45', arrival: '19:30',
    duration: '9h 15m', durationMinutes: 555, aircraft: 'Boeing 777-300ER',
    stops: 0, price: 58500, class: 'Economy', seats: 20, onTimeRating: 90,
    terminal: 'T3', gate: '21A', baggage: '2 x 23 kg check-in',
    meal: 'Multi-course International Dining', status: 'On Time', serial: 'SK-111-DELLHR'
  },
  {
    flightNumber: 'BA 142', airline: 'British Airways', airlineCode: 'BA',
    from: 'DEL', to: 'LHR', departure: '03:15', arrival: '07:55',
    duration: '9h 10m', durationMinutes: 550, aircraft: 'Boeing 787-9 Dreamliner',
    stops: 0, price: 64200, class: 'Economy', seats: 15, onTimeRating: 93,
    terminal: 'T3', gate: '17C', baggage: '23 kg check-in · 10 kg cabin',
    meal: 'Club World & World Traveller Dining', status: 'On Time', serial: 'SK-142-DELLHR'
  },

  // DXB → BOM
  {
    flightNumber: 'EK 504', airline: 'Emirates', airlineCode: 'EK',
    from: 'DXB', to: 'BOM', departure: '03:30', arrival: '08:10',
    duration: '3h 10m', durationMinutes: 190, aircraft: 'Boeing 777-300ER',
    stops: 0, price: 24800, class: 'Economy', seats: 38, onTimeRating: 95,
    terminal: 'T3', gate: 'B12', baggage: '30 kg check-in · 7 kg cabin',
    meal: 'Emirates Regional Multi-course', status: 'On Time', serial: 'SK-504-DXBBOM'
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH FUNCTION — Returns flights for route with deterministic generation
// ─────────────────────────────────────────────────────────────────────────────

export type SortKey = 'departure' | 'duration' | 'price'

export interface FlightSearchParams {
  from: string
  to: string
  sortBy?: SortKey
}

/**
 * Generate synthetic realistic flights when a route has few or no hardcoded records
 */
function generateSyntheticFlights(from: string, to: string): Flight[] {
  const carriers = [
    { name: 'Air India', code: 'AI', aircraft: 'Airbus A320neo' },
    { name: 'IndiGo', code: '6E', aircraft: 'Airbus A321neo' },
    { name: 'Vistara', code: 'UK', aircraft: 'Boeing 787-9' },
    { name: 'Akasa Air', code: 'QP', aircraft: 'Boeing 737 MAX' },
    { name: 'Emirates', code: 'EK', aircraft: 'Boeing 777-300ER' },
    { name: 'Singapore Airlines', code: 'SQ', aircraft: 'Airbus A350-900' },
  ]

  const times = [
    { dep: '06:15', arr: '08:30', dur: '2h 15m', mins: 135, price: 4950, stops: 0 },
    { dep: '09:00', arr: '11:10', dur: '2h 10m', mins: 130, price: 5420, stops: 0 },
    { dep: '12:30', arr: '14:45', dur: '2h 15m', mins: 135, price: 4790, stops: 0 },
    { dep: '15:20', arr: '17:35', dur: '2h 15m', mins: 135, price: 5890, stops: 0 },
    { dep: '17:45', arr: '21:10', dur: '3h 25m', mins: 205, price: 3990, stops: 1 },
    { dep: '19:10', arr: '21:25', dur: '2h 15m', mins: 135, price: 6150, stops: 0 },
    { dep: '21:30', arr: '23:40', dur: '2h 10m', mins: 130, price: 4450, stops: 0 },
    { dep: '23:15', arr: '01:30', dur: '2h 15m', mins: 135, price: 4200, stops: 0 },
  ]

  return times.map((t, idx) => {
    const carrier = carriers[idx % carriers.length]
    return {
      flightNumber: `${carrier.code} ${100 + (idx * 27) + 5}`,
      airline: carrier.name,
      airlineCode: carrier.code,
      from,
      to,
      departure: t.dep,
      arrival: t.arr,
      duration: t.dur,
      durationMinutes: t.mins,
      aircraft: carrier.aircraft,
      stops: t.stops,
      price: t.price,
      class: idx === 1 ? 'Business' : 'Economy',
      seats: 8 + (idx * 3),
      onTimeRating: 82 + (idx * 2),
      terminal: `T${(idx % 2) + 1}`,
      gate: `${String.fromCharCode(65 + (idx % 4))}${idx + 2}`,
      baggage: '15 kg check-in · 7 kg cabin',
      meal: 'Complimentary Hot Dining',
      status: idx === 0 ? 'Boarding' : 'On Time',
      serial: `SK-${from}${to}-${100 + idx}`,
    }
  })
}

export function searchFlights(params: FlightSearchParams): Flight[] {
  const { from, to, sortBy = 'price' } = params

  let results = MOCK_FLIGHTS.filter(
    f => f.from.toUpperCase() === from.toUpperCase()
      && f.to.toUpperCase() === to.toUpperCase()
  )

  // If no mock flights exist for this pair, generate realistic fallback flights
  if (results.length === 0) {
    results = generateSyntheticFlights(from.toUpperCase(), to.toUpperCase())
  }

  // Sort according to requested key
  results = [...results].sort((a, b) => {
    switch (sortBy) {
      case 'price': {
        if (a.price === null && b.price === null) return 0
        if (a.price === null) return 1
        if (b.price === null) return -1
        return a.price - b.price
      }
      case 'duration':  return a.durationMinutes - b.durationMinutes
      case 'departure': return a.departure.localeCompare(b.departure)
      default:          return 0
    }
  })

  return results
}
