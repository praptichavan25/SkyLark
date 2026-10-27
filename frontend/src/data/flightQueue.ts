/**
 * SkyLark — DSA: Queue Integration for Screen 4
 *
 * Implements FIFO request queuing for flight search queries.
 * Re-exports the manual Queue DSA class from ../dsa/Queue.ts.
 */

import { Queue } from '../dsa/Queue'

export { Queue }

export interface SearchRequest {
  from: string
  to: string
  date: string
  sortBy?: 'price' | 'departure' | 'duration'
  requestId: string
  timestamp: number
}

/**
 * FlightQueue subclass with typed helper methods
 */
export class FlightQueue<T = SearchRequest> extends Queue<T> {}

/** Session singleton queue instance */
export const flightSearchQueue = new FlightQueue<SearchRequest>()
