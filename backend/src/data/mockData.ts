export interface Aircraft {
  id: string;
  model: string;
  manufacturer: string;
  category: string;
  rangeNm: number;
  maxSpeedMach: number;
  cruiseAltitudeFt: number;
  passengerCapacity: number;
  cabinPressureEquivFt: number;
  description: string;
}

export interface Destination {
  id: string;
  code: string;
  icao: string;
  name: string;
  city: string;
  country: string;
  elevationFt: number;
  terminalType: string;
}

export interface FlightRoute {
  id: string;
  flightNumber: string;
  origin: Destination;
  destination: Destination;
  aircraft: Aircraft;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  emptyLeg: boolean;
  priceUsd: number;
  cruiseAltitude: string;
  status: 'Scheduled' | 'Boarding' | 'En Route' | 'Available';
}

export const FLEET: Aircraft[] = [
  {
    id: 'g650er',
    model: 'G650ER',
    manufacturer: 'Gulfstream',
    category: 'Ultra Long Range Private Jet',
    rangeNm: 7500,
    maxSpeedMach: 0.925,
    cruiseAltitudeFt: 45000,
    passengerCapacity: 14,
    cabinPressureEquivFt: 4850,
    description: 'The standard for worldwide long-range private aviation with whisper-quiet cabin acoustics.'
  },
  {
    id: 'a350-900',
    model: 'Airbus A350-900',
    manufacturer: 'Airbus',
    category: 'Widebody Intercontinental Jet',
    rangeNm: 8100,
    maxSpeedMach: 0.85,
    cruiseAltitudeFt: 43100,
    passengerCapacity: 325,
    cabinPressureEquivFt: 6000,
    description: 'State-of-the-art composite widebody with adaptive aerodynamic winglets and whisper-quiet flight.'
  },
  {
    id: 'e195-e2',
    model: 'Embraer E195-E2',
    manufacturer: 'Embraer',
    category: 'Next-Gen Commercial Regional Jet',
    rangeNm: 2600,
    maxSpeedMach: 0.82,
    cruiseAltitudeFt: 41000,
    passengerCapacity: 132,
    cabinPressureEquivFt: 7000,
    description: 'Ultra-efficient geared turbofan regional jet featuring high-aspect ratio wings and clean dual-engine performance.'
  },
  {
    id: 'global-7500',
    model: 'Global 7500',
    manufacturer: 'Bombardier',
    category: 'Ultra Long Range',
    rangeNm: 7700,
    maxSpeedMach: 0.925,
    cruiseAltitudeFt: 51000,
    passengerCapacity: 16,
    cabinPressureEquivFt: 4500,
    description: 'Four true living spaces with full-size master suite and smooth-flex wing architecture.'
  },
  {
    id: 'falcon-8x',
    model: 'Falcon 8X',
    manufacturer: 'Dassault',
    category: 'Large Cabin',
    rangeNm: 6450,
    maxSpeedMach: 0.90,
    cruiseAltitudeFt: 51000,
    passengerCapacity: 12,
    cabinPressureEquivFt: 3900,
    description: 'Tri-jet redundancy with steep-approach certification for short mountain runways.'
  },
  {
    id: 'citation-longitude',
    model: 'Citation Longitude',
    manufacturer: 'Cessna',
    category: 'Super Midsize',
    rangeNm: 3500,
    maxSpeedMach: 0.84,
    cruiseAltitudeFt: 45000,
    passengerCapacity: 8,
    cabinPressureEquivFt: 5950,
    description: 'Best-in-class cabin altitude and quietest interior sound levels in super-midsize aviation.'
  }
];

export const DESTINATIONS: Destination[] = [
  {
    id: 'teb',
    code: 'TEB',
    icao: 'KTEB',
    name: 'Teterboro Airport',
    city: 'New York',
    country: 'United States',
    elevationFt: 9,
    terminalType: 'Dedicated FBO Jetport'
  },
  {
    id: 'vny',
    code: 'VNY',
    icao: 'KVNY',
    name: 'Van Nuys Airport',
    city: 'Los Angeles',
    country: 'United States',
    elevationFt: 802,
    terminalType: 'Dedicated FBO Jetport'
  },
  {
    id: 'ase',
    code: 'ASE',
    icao: 'KASE',
    name: 'Aspen/Pitkin County Airport',
    city: 'Aspen',
    country: 'United States',
    elevationFt: 7820,
    terminalType: 'Alpine Executive FBO'
  },
  {
    id: 'nce',
    code: 'NCE',
    icao: 'LFMN',
    name: 'Nice Côte d’Azur Airport',
    city: 'Nice / Cannes / Monaco',
    country: 'France',
    elevationFt: 13,
    terminalType: 'VIP General Aviation Terminal'
  },
  {
    id: 'gva',
    code: 'GVA',
    icao: 'LSGG',
    name: 'Geneva International Airport',
    city: 'Geneva',
    country: 'Switzerland',
    elevationFt: 1411,
    terminalType: 'Executive Aviation Terminal'
  },
  {
    id: 'dwc',
    code: 'DWC',
    icao: 'OMDW',
    name: 'Al Maktoum International',
    city: 'Dubai',
    country: 'United Arab Emirates',
    elevationFt: 171,
    terminalType: 'VIP Royal Pavilion'
  }
];

export const FEATURED_FLIGHTS: FlightRoute[] = [
  {
    id: 'fl-101',
    flightNumber: 'SK-410',
    origin: DESTINATIONS[0], // TEB (New York)
    destination: DESTINATIONS[2], // ASE (Aspen)
    aircraft: FLEET[3], // Citation Longitude
    departureTime: '2026-10-01T09:30:00Z',
    arrivalTime: '2026-10-01T12:45:00Z',
    durationMinutes: 255,
    emptyLeg: false,
    priceUsd: 18500,
    cruiseAltitude: 'FL410',
    status: 'Available'
  },
  {
    id: 'fl-204',
    flightNumber: 'SK-750',
    origin: DESTINATIONS[1], // VNY (Los Angeles)
    destination: DESTINATIONS[0], // TEB (New York)
    aircraft: FLEET[0], // Gulfstream G650ER
    departureTime: '2026-10-02T14:00:00Z',
    arrivalTime: '2026-10-02T22:15:00Z',
    durationMinutes: 315,
    emptyLeg: true,
    priceUsd: 22000,
    cruiseAltitude: 'FL450',
    status: 'Available'
  },
  {
    id: 'fl-309',
    flightNumber: 'SK-800',
    origin: DESTINATIONS[3], // NCE (Nice)
    destination: DESTINATIONS[4], // GVA (Geneva)
    aircraft: FLEET[2], // Falcon 8X
    departureTime: '2026-10-03T11:00:00Z',
    arrivalTime: '2026-10-03T12:05:00Z',
    durationMinutes: 65,
    emptyLeg: true,
    priceUsd: 8900,
    cruiseAltitude: 'FL390',
    status: 'Available'
  }
];
