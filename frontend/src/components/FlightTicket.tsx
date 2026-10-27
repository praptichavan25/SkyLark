/**
 * SkyLark — Screen 4: FlightTicket
 *
 * Boarding-pass style flight ticket with physical paper texture,
 * perforation cutouts, barcode, tear-off stub, and rich airline data.
 */

import { type Flight, AIRPORT_MAP } from '../data/flightData'

interface FlightTicketProps {
  flight: Flight
  isSelected: boolean
  isCompared: boolean
  index: number
  total: number
  onSelect: () => void
  onToggleCompare: (e: React.MouseEvent) => void
  onViewDetails: () => void
  onExploreRoute?: (flight: Flight) => void
}

function formatPrice(p: number | null | undefined): string {
  if (p === null || p === undefined) return 'Live Fare'
  return '₹' + p.toLocaleString('en-IN')
}

// Generate deterministic seat and gate from flight number
function getSeatFromFlight(fn: string): string {
  const num = parseInt(fn.replace(/\D/g, '') || '101', 10)
  const row = (num % 28) + 1
  const col = ['A', 'B', 'C', 'D', 'E', 'F'][num % 6]
  return `${row}${col}`
}

function getGateFromFlight(fn: string, terminal?: string): string {
  const num = parseInt(fn.replace(/\D/g, '') || '101', 10)
  const letter = ['A', 'B', 'C', 'D'][num % 4]
  const gateNum = (num % 18) + 1
  return `${terminal ? terminal + ' · ' : ''}${letter}${gateNum}`
}

export function FlightTicket({
  flight,
  isSelected,
  isCompared,
  onSelect,
  onToggleCompare,
  onViewDetails,
  onExploreRoute,
}: FlightTicketProps) {
  const fromAirport = AIRPORT_MAP[flight.from]
  const toAirport = AIRPORT_MAP[flight.to]
  const fromCity = fromAirport?.city ?? flight.from
  const toCity = toAirport?.city ?? flight.to
  const seat = getSeatFromFlight(flight.flightNumber)
  const gate = flight.gate ?? getGateFromFlight(flight.flightNumber, flight.terminal)
  const status = flight.status ?? (flight.onTimeRating >= 90 ? 'On Time' : 'Scheduled')

  return (
    <article
      className={`fr-ticket${isSelected ? ' fr-ticket--selected' : ''}${isCompared ? ' fr-ticket--compared' : ''}`}
      onClick={onSelect}
      tabIndex={0}
      role="button"
      aria-label={`Flight ticket ${flight.airline} ${flight.flightNumber} from ${fromCity} to ${toCity}`}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      {/* ── LEFT / MAIN BOARDING PASS SECTION ─────────────────────── */}
      <div className="fr-ticket-main">
        {/* Top Header Strip */}
        <div className="fr-ticket-topstrip">
          <div className="fr-ticket-airline-box">
            <span className="fr-airline-icon" aria-hidden="true">✈</span>
            <span className="fr-airline-name">{flight.airline}</span>
            <span className="fr-flight-number">{flight.flightNumber}</span>
          </div>

          <div className="fr-ticket-header-right">
            <span className="fr-ticket-class-badge">{flight.class.toUpperCase()}</span>
            <span className={`fr-ticket-status-pill fr-ticket-status-pill--${status.toLowerCase().replace(/\s+/g, '')}`}>
              {status}
            </span>
          </div>
        </div>

        {/* Route Row: Origin ✈ Destination */}
        <div className="fr-ticket-route-row">
          {/* Origin */}
          <div className="fr-ticket-point">
            <span className="fr-ticket-iata">{flight.from}</span>
            <span className="fr-ticket-city">{fromCity}</span>
            <span className="fr-ticket-time">{flight.departure}</span>
          </div>

          {/* Flight Path Graphic */}
          <div className="fr-ticket-path-col">
            <div className="fr-path-duration">{flight.duration}</div>
            <div className="fr-path-line-wrapper">
              <span className="fr-path-dot" />
              <div className="fr-path-dashed" />
              <span className="fr-path-airplane" aria-hidden="true">✈</span>
              <div className="fr-path-dashed" />
              <span className="fr-path-dot" />
            </div>
            <div className="fr-path-stops">
              {flight.stops === 0 ? 'NON-STOP' : `${flight.stops} STOP`}
            </div>
          </div>

          {/* Destination */}
          <div className="fr-ticket-point fr-ticket-point--right">
            <span className="fr-ticket-iata">{flight.to}</span>
            <span className="fr-ticket-city">{toCity}</span>
            <span className="fr-ticket-time">{flight.arrival}</span>
          </div>
        </div>

        {/* Details & Specs Row */}
        <div className="fr-ticket-specs-row">
          <div className="fr-spec-item">
            <span className="fr-spec-label">AIRCRAFT</span>
            <span className="fr-spec-val">{flight.aircraft}</span>
          </div>
          <div className="fr-spec-item">
            <span className="fr-spec-label">TERMINAL / GATE</span>
            <span className="fr-spec-val">{gate}</span>
          </div>
          <div className="fr-spec-item">
            <span className="fr-spec-label">PRICE</span>
            <span className="fr-spec-price">{formatPrice(flight.price)}</span>
          </div>
        </div>

        {/* Action Controls Footer on Ticket */}
        <div className="fr-ticket-actions">
          <button
            type="button"
            className="fr-ticket-details-btn"
            onClick={e => {
              e.stopPropagation()
              onViewDetails()
            }}
            aria-label={`View intelligence details for ${flight.flightNumber}`}
          >
            <span>VIEW FLIGHT</span>
            <span className="fr-ticket-arrow" aria-hidden="true">→</span>
          </button>

          {onExploreRoute && (
            <button
              type="button"
              className="fr-ticket-route-btn"
              onClick={e => {
                e.stopPropagation()
                onExploreRoute(flight)
              }}
              aria-label={`Explore flight route for ${flight.flightNumber}`}
            >
              <span className="fr-route-btn-icon" aria-hidden="true">🗺️</span>
              <span>EXPLORE ROUTE</span>
            </button>
          )}

          <button
            type="button"
            className={`fr-ticket-compare-btn${isCompared ? ' fr-ticket-compare-btn--active' : ''}`}
            onClick={e => {
              e.stopPropagation()
              onToggleCompare(e)
            }}
            aria-label={isCompared ? `Remove ${flight.flightNumber} from comparison` : `Select ${flight.flightNumber} for comparison`}
          >
            <span className="fr-compare-checkbox" aria-hidden="true">
              {isCompared ? '✓' : '+'}
            </span>
            <span>{isCompared ? 'SELECTED' : 'SELECT'}</span>
          </button>
        </div>
      </div>

      {/* ── PERFORATED DIVIDER WITH CUTOUT NOTCHES ─────────────────── */}
      <div className="fr-ticket-perforation" aria-hidden="true">
        <div className="fr-notch fr-notch--top" />
        <div className="fr-perforation-line" />
        <div className="fr-notch fr-notch--bottom" />
      </div>

      {/* ── RIGHT TEAR-OFF BOARDING PASS STUB ───────────────────────── */}
      <div className="fr-ticket-stub">
        <div className="fr-stub-header">
          <span className="fr-stub-tag">BOARDING PASS</span>
          <span className="fr-stub-seat-highlight">{seat}</span>
        </div>

        <div className="fr-stub-route">
          <span className="fr-stub-iata">{flight.from}</span>
          <span className="fr-stub-arrow">→</span>
          <span className="fr-stub-iata">{flight.to}</span>
        </div>

        <div className="fr-stub-meta-grid">
          <div className="fr-stub-meta-item">
            <span className="fr-stub-meta-label">PASSENGER</span>
            <span className="fr-stub-meta-val">PRIORITY</span>
          </div>
          <div className="fr-stub-meta-item">
            <span className="fr-stub-meta-label">FLIGHT</span>
            <span className="fr-stub-meta-val">{flight.flightNumber}</span>
          </div>
          <div className="fr-stub-meta-item">
            <span className="fr-stub-meta-label">GATE</span>
            <span className="fr-stub-meta-val">{gate}</span>
          </div>
          <div className="fr-stub-meta-item">
            <span className="fr-stub-meta-label">TIME</span>
            <span className="fr-stub-meta-val">{flight.departure}</span>
          </div>
        </div>

        {/* Barcode SVG */}
        <div className="fr-stub-barcode-box" aria-hidden="true">
          <svg className="fr-barcode-svg" viewBox="0 0 140 36" fill="currentColor">
            <rect x="0" y="0" width="3" height="36" />
            <rect x="5" y="0" width="1" height="36" />
            <rect x="8" y="0" width="2" height="36" />
            <rect x="12" y="0" width="4" height="36" />
            <rect x="18" y="0" width="1" height="36" />
            <rect x="21" y="0" width="3" height="36" />
            <rect x="26" y="0" width="2" height="36" />
            <rect x="30" y="0" width="1" height="36" />
            <rect x="33" y="0" width="4" height="36" />
            <rect x="39" y="0" width="2" height="36" />
            <rect x="43" y="0" width="1" height="36" />
            <rect x="46" y="0" width="3" height="36" />
            <rect x="51" y="0" width="2" height="36" />
            <rect x="55" y="0" width="4" height="36" />
            <rect x="61" y="0" width="1" height="36" />
            <rect x="64" y="0" width="3" height="36" />
            <rect x="69" y="0" width="1" height="36" />
            <rect x="72" y="0" width="2" height="36" />
            <rect x="76" y="0" width="4" height="36" />
            <rect x="82" y="0" width="1" height="36" />
            <rect x="85" y="0" width="3" height="36" />
            <rect x="90" y="0" width="2" height="36" />
            <rect x="94" y="0" width="1" height="36" />
            <rect x="97" y="0" width="4" height="36" />
            <rect x="103" y="0" width="2" height="36" />
            <rect x="107" y="0" width="1" height="36" />
            <rect x="110" y="0" width="3" height="36" />
            <rect x="115" y="0" width="2" height="36" />
            <rect x="119" y="0" width="4" height="36" />
            <rect x="125" y="0" width="1" height="36" />
            <rect x="128" y="0" width="3" height="36" />
            <rect x="133" y="0" width="2" height="36" />
            <rect x="137" y="0" width="3" height="36" />
          </svg>
          <span className="fr-barcode-serial">{flight.serial ?? `SK-${flight.flightNumber}`}</span>
        </div>
      </div>
    </article>
  )
}
