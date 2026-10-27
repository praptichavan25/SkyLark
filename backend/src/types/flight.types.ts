export interface AirlineInfo {
  name: string;
  code: string;
}

export interface FlightEndpoint {
  airport: string;
  city: string;
  time: string;
  terminal?: string;
  gate?: string;
}

export interface Flight {
  id: string;
  flightNumber: string;
  airline: AirlineInfo;
  departure: FlightEndpoint;
  arrival: FlightEndpoint;
  duration: string;
  durationMinutes?: number;
  stops: number;
  aircraft: string;
  price: number | null;
  status: string;
  date: string;
  stopsRoute?: string[]; // Intermediate stops for multi-stop journeys
  seats?: number;
  onTimeRating?: number;
  cabinClass?: string;
  rawProvider?: string;
}


export interface FlightIntelligence {
  flightNumber: string;
  airline: AirlineInfo;
  aircraft: string;
  route: {
    origin: string;
    destination: string;
    journey: string[]; // Generated using LinkedList
  };
  departure: FlightEndpoint;
  arrival: FlightEndpoint;
  duration: string;
  stops: number;
  status: string;
  airportInformation: {
    departureAirport: {
      iata: string;
      name: string;
      city: string;
      country: string;
    };
    arrivalAirport: {
      iata: string;
      name: string;
      city: string;
      country: string;
    };
  };
}
