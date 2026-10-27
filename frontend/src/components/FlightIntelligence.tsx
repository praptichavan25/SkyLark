/**
 * SkyLark — Screen 4: FlightIntelligence
 *
 * Premium flight intelligence drawer displaying full specs, route telemetry,
 * baggage rules, aircraft model, and on-time performance.
 */

import { useEffect } from 'react'
import { type Flight, AIRPORT_MAP } from '../data/flightData'

interface FlightIntelligenceProps {
  flight: Flight
  date: string
  isCompared: boolean
  onClose: () => void
  onToggleCompare: () => void
  onExploreRoute?: (flight: Flight) => void
}

function formatPrice(p: number | null | undefined): string {
  if (p === null || p === undefined) return 'Live Fare'
  return '₹' + p.toLocaleString('en-IN')
}

export function FlightIntelligence({
  flight,
  date,
  isCompared,
  onClose,
  onToggleCompare,
  onExploreRoute,
}: FlightIntelligenceProps) {
  const fromAirport = AIRPORT_MAP[flight.from]
  const toAirport = AIRPORT_MAP[flight.to]
  const fromCity = fromAirport?.city ?? flight.from
  const toCity = toAirport?.city ?? flight.to
  const status = flight.status ?? (flight.onTimeRating >= 90 ? 'On Time' : 'Scheduled')

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fr-intel-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Flight intelligence for ${flight.airline} ${flight.flightNumber}`}
    >
      <div
        className="fr-intel-panel"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="fr-intel-header">
          <div className="fr-intel-badge-row">
            <span className="fr-intel-kicker">FLIGHT INTELLIGENCE</span>
            <span className={`fr-intel-status fr-intel-status--${status.toLowerCase().replace(/\s+/g, '')}`}>
              {status}
            </span>
          </div>

          <button
            type="button"
            className="fr-intel-close-btn"
            onClick={onClose}
            aria-label="Close flight intelligence"
          >
            ✕
          </button>
        </div>

        {/* Airline & Flight Number Hero */}
        <div className="fr-intel-carrier-row">
          <div>
            <h2 className="fr-intel-airline">{flight.airline}</h2>
            <div className="fr-intel-fn">{flight.flightNumber} · {flight.class} Class</div>
          </div>
          <div className="fr-intel-price-box">
            <span className="fr-intel-price-label">ALL-INCLUSIVE FARE</span>
            <span className="fr-intel-price">{formatPrice(flight.price)}</span>
          </div>
        </div>

        {/* Route Card */}
        <div className="fr-intel-route-card">
          {/* Departure */}
          <div className="fr-intel-stop">
            <span className="fr-intel-iata">{flight.from}</span>
            <span className="fr-intel-city">{fromCity}</span>
            <span className="fr-intel-time">{flight.departure}</span>
            <span className="fr-intel-airport-name">{fromAirport?.name ?? 'International Airport'}</span>
            <span className="fr-intel-terminal-tag">{flight.terminal ?? 'Terminal 2'}</span>
          </div>

          {/* Path Graphic */}
          <div className="fr-intel-path">
            <span className="fr-intel-duration">{flight.duration}</span>
            <div className="fr-intel-path-line">
              <span className="fr-intel-plane-icon" aria-hidden="true">✈</span>
            </div>
            <span className="fr-intel-stops">{flight.stops === 0 ? 'NON-STOP DIRECT' : `${flight.stops} STOP`}</span>
          </div>

          {/* Arrival */}
          <div className="fr-intel-stop fr-intel-stop--right">
            <span className="fr-intel-iata">{flight.to}</span>
            <span className="fr-intel-city">{toCity}</span>
            <span className="fr-intel-time">{flight.arrival}</span>
            <span className="fr-intel-airport-name">{toAirport?.name ?? 'International Airport'}</span>
            <span className="fr-intel-terminal-tag">Gate {flight.gate ?? '04B'}</span>
          </div>
        </div>

        {/* Specifications Grid */}
        <div className="fr-intel-grid">
          <div className="fr-intel-spec">
            <span className="fr-spec-title">DATE</span>
            <span className="fr-spec-data">{date}</span>
          </div>

          <div className="fr-intel-spec">
            <span className="fr-spec-title">AIRCRAFT</span>
            <span className="fr-spec-data">{flight.aircraft}</span>
          </div>

          <div className="fr-intel-spec">
            <span className="fr-spec-title">ON-TIME PERFORMANCE</span>
            <span className="fr-spec-data fr-spec-data--highlight">{flight.onTimeRating}% Historical Accuracy</span>
          </div>

          <div className="fr-intel-spec">
            <span className="fr-spec-title">BAGGAGE ALLOWANCE</span>
            <span className="fr-spec-data">{flight.baggage ?? '15 kg check-in · 7 kg cabin'}</span>
          </div>

          <div className="fr-intel-spec">
            <span className="fr-spec-title">MEAL & SERVICE</span>
            <span className="fr-spec-data">{flight.meal ?? 'Complimentary Meal Service'}</span>
          </div>

          <div className="fr-intel-spec">
            <span className="fr-spec-title">REMAINING SEATS</span>
            <span className="fr-spec-data">{flight.seats} Available at this fare</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="fr-intel-footer">
          {onExploreRoute && (
            <button
              type="button"
              className="fr-intel-route-btn"
              onClick={() => {
                onClose()
                onExploreRoute(flight)
              }}
            >
              <span>🗺️ Explore Route (Screen 5)</span>
            </button>
          )}

          <button
            type="button"
            className={`fr-intel-compare-btn${isCompared ? ' fr-intel-compare-btn--active' : ''}`}
            onClick={onToggleCompare}
          >
            <span>{isCompared ? '✓ Selected for Compare' : '+ Add to Flight Comparison'}</span>
          </button>

          <button
            type="button"
            className="fr-intel-done-btn"
            onClick={onClose}
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  )
}
