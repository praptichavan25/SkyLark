/**
 * SkyLark — Screen 4: FlightComparison
 *
 * Clean, editorial multi-flight comparison view comparing up to 3 selected flights.
 * Compares Airline, Times, Duration, Stops, Aircraft, Baggage, Price, and Status.
 */

import { useEffect } from 'react'
import { type Flight } from '../data/flightData'

interface FlightComparisonProps {
  flights: Flight[]
  onClose: () => void
  onRemove: (flightNumber: string) => void
}

function formatPrice(p: number | null | undefined): string {
  if (p === null || p === undefined) return 'Live Fare'
  return '₹' + p.toLocaleString('en-IN')
}

export function FlightComparison({ flights, onClose, onRemove }: FlightComparisonProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (flights.length === 0) return null

  // Determine lowest price and shortest duration
  const validPrices = flights.map(f => f.price).filter((p): p is number => typeof p === 'number')
  const lowestPrice = validPrices.length > 0 ? Math.min(...validPrices) : null
  const shortestDuration = Math.min(...flights.map(f => f.durationMinutes))

  return (
    <div
      className="fr-compare-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Flight comparison"
    >
      <div
        className="fr-compare-modal"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="fr-compare-header">
          <div>
            <span className="fr-compare-kicker">FLIGHT INTELLIGENCE BENCHMARK</span>
            <h2 className="fr-compare-title">Compare Flights ({flights.length} Selected)</h2>
          </div>

          <button
            type="button"
            className="fr-compare-close-btn"
            onClick={onClose}
            aria-label="Close flight comparison"
          >
            ✕
          </button>
        </div>

        {/* Flight Cards Columns Header */}
        <div className="fr-compare-grid">
          <div className="fr-compare-row fr-compare-row--carriers">
            <span className="fr-compare-label">FLIGHT</span>
            <div className="fr-compare-values">
              {flights.map(f => (
                <div key={f.flightNumber} className="fr-carrier-cell">
                  <div className="fr-carrier-top">
                    <span className="fr-carrier-name">{f.airline}</span>
                    <button
                      type="button"
                      className="fr-carrier-remove"
                      onClick={() => onRemove(f.flightNumber)}
                      aria-label={`Remove ${f.flightNumber} from comparison`}
                    >
                      ✕
                    </button>
                  </div>
                  <span className="fr-carrier-fn">{f.flightNumber}</span>
                  <span className="fr-carrier-class">{f.class}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Departure */}
          <div className="fr-compare-row">
            <span className="fr-compare-label">DEPARTURE</span>
            <div className="fr-compare-values">
              {flights.map(f => (
                <div key={f.flightNumber} className="fr-compare-cell">
                  <span className="fr-cell-time">{f.departure}</span>
                  <span className="fr-cell-sub">{f.from}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Arrival */}
          <div className="fr-compare-row">
            <span className="fr-compare-label">ARRIVAL</span>
            <div className="fr-compare-values">
              {flights.map(f => (
                <div key={f.flightNumber} className="fr-compare-cell">
                  <span className="fr-cell-time">{f.arrival}</span>
                  <span className="fr-cell-sub">{f.to}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="fr-compare-row">
            <span className="fr-compare-label">DURATION</span>
            <div className="fr-compare-values">
              {flights.map(f => {
                const isFastest = f.durationMinutes === shortestDuration
                return (
                  <div key={f.flightNumber} className="fr-compare-cell">
                    <span className="fr-cell-val">{f.duration}</span>
                    {isFastest && <span className="fr-best-badge fr-best-badge--fast">SHORTEST</span>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stops */}
          <div className="fr-compare-row">
            <span className="fr-compare-label">ROUTING</span>
            <div className="fr-compare-values">
              {flights.map(f => (
                <div key={f.flightNumber} className="fr-compare-cell">
                  <span className="fr-cell-val">{f.stops === 0 ? 'Non-stop Direct' : `${f.stops} Stop`}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Aircraft */}
          <div className="fr-compare-row">
            <span className="fr-compare-label">AIRCRAFT</span>
            <div className="fr-compare-values">
              {flights.map(f => (
                <div key={f.flightNumber} className="fr-compare-cell">
                  <span className="fr-cell-val">{f.aircraft}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="fr-compare-row fr-compare-row--price">
            <span className="fr-compare-label">PRICE</span>
            <div className="fr-compare-values">
              {flights.map(f => {
                const isCheapest = f.price === lowestPrice
                return (
                  <div key={f.flightNumber} className="fr-compare-cell">
                    <span className="fr-cell-price">{formatPrice(f.price)}</span>
                    {isCheapest && <span className="fr-best-badge fr-best-badge--price">BEST FARE</span>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Status & Accuracy */}
          <div className="fr-compare-row">
            <span className="fr-compare-label">ON-TIME RECORD</span>
            <div className="fr-compare-values">
              {flights.map(f => (
                <div key={f.flightNumber} className="fr-compare-cell">
                  <span className="fr-cell-val">{f.onTimeRating}% Accurate</span>
                  <span className="fr-cell-sub">{f.status ?? 'On Time'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="fr-compare-footer">
          <button
            type="button"
            className="fr-compare-done-btn"
            onClick={onClose}
          >
            Back to Flight Tickets
          </button>
        </div>
      </div>
    </div>
  )
}
