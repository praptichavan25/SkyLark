/**
 * SkyLark — Screen 4: Flight Results (Light Sky & Boarding Pass Experience)
 *
 * Implements the signature aviation envelope experience:
 *   SEARCH REQUEST
 *         ↓
 *   QUEUE (FIFO processing)
 *         ↓
 *   FLIGHT DATA PROCESSED
 *         ↓
 *   SKYLARK AIRLINE ENVELOPE (Reference 1)
 *         ↓
 *   OPEN ENVELOPE & BOARDING PASSES SLIDE OUT
 *         ↓
 *   PANORAMIC TICKET CAROUSEL (Reference 2)
 *         ↓
 *   FLIGHT INTELLIGENCE INSPECTION
 *         ↓
 *   COMPARE FLIGHTS (Multi-selection up to 3 flights)
 *
 * Visual Environment: Light, airy morning sky blue, soft clouds, distant plane.
 * Typography: DM Serif Display + DM Sans
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  type Flight,
  AIRPORT_MAP,
  type SortKey,
} from '../data/flightData'
import { api } from '../services/api'
import { FlightQueue, type SearchRequest } from '../data/flightQueue'
import { FlightLoading } from './FlightLoading'
import { FlightEnvelope } from './FlightEnvelope'
import { FlightCarousel } from './FlightCarousel'
import { FlightFilters, type StopsFilter, type DepartureFilter } from './FlightFilters'
import { FlightIntelligence } from './FlightIntelligence'
import { FlightComparison } from './FlightComparison'
import '../styles/flight-results.css'

export interface SearchParams {
  from: string
  to: string
  date: string
  tripType?: 'oneway' | 'roundtrip'
  cabinClass?: string
  passengers?: { adults: number; children: number }
}

interface FlightResultsScreenProps {
  params: SearchParams
  onBack: () => void
  onExploreRoute?: (flight: Flight | null) => void
}

function formatDateLabel(iso: string): string {
  if (!iso) return '12 OCT 2026'
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return iso
  const day = String(d.getDate()).padStart(2, '0')
  const mon = d.toLocaleString('en-GB', { month: 'short' }).toUpperCase()
  const yr = d.getFullYear()
  return `${day} ${mon} ${yr}`
}

function getTimeBucket(timeStr: string): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = parseInt(timeStr.split(':')[0], 10)
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 22) return 'evening'
  return 'night'
}

export function FlightResultsScreen({ params, onBack, onExploreRoute }: FlightResultsScreenProps) {
  // ── QUEUE DSA INSTANCE ─────────────────────────────────────────────────────
  const queueRef = useRef(new FlightQueue<SearchRequest>())

  // ── SCREEN FLOW STATES ─────────────────────────────────────────────────────
  const [loadStage, setLoadStage] = useState<'loading' | 'envelope' | 'carousel'>('loading')
  const [envelopeOpened, setEnvelopeOpened] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [liveFlights, setLiveFlights] = useState<Flight[] | null>(null)
  const [providerSource, setProviderSource] = useState<string>('aviationstack')

  // ── SIGNATURE TRANSITION STATE ─────────────────────────────────────────────
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionFlight, setTransitionFlight] = useState<Flight | null>(null)

  const handleTriggerExploreRoute = useCallback((flight: Flight | null) => {
    if (isTransitioning) return // Prevent double-clicks
    setIsTransitioning(true)
    setTransitionFlight(flight)

    // Smooth signature transition (750ms)
    setTimeout(() => {
      setIsTransitioning(false)
      if (onExploreRoute) {
        onExploreRoute(flight)
      }
    }, 800)
  }, [isTransitioning, onExploreRoute])

  // ── FILTER & SORT STATES ───────────────────────────────────────────────────
  const [stopsFilter, setStopsFilter] = useState<StopsFilter>('all')
  const [airlineFilter, setAirlineFilter] = useState<string>('all')
  const [departureFilter, setDepartureFilter] = useState<DepartureFilter>('all')
  const [sortBy, setSortBy] = useState<SortKey>('price')

  // ── INTERACTION STATES ─────────────────────────────────────────────────────
  const [activeTicketIndex, setActiveTicketIndex] = useState(0)
  const [intelligenceFlight, setIntelligenceFlight] = useState<Flight | null>(null)
  const [comparedSet, setComparedSet] = useState<Set<string>>(new Set())
  const [showComparison, setShowComparison] = useState(false)

  const fromAirport = AIRPORT_MAP[params.from]
  const toAirport = AIRPORT_MAP[params.to]
  const fromCity = fromAirport?.city ?? params.from
  const toCity = toAirport?.city ?? params.to
  const displayDate = formatDateLabel(params.date)

  // ── FETCH FLIGHTS FROM REAL BACKEND API ────────────────────────────────────
  const fetchLiveFlights = useCallback(() => {
    setHasError(false)
    setErrorMessage('')
    const q = queueRef.current
    q.clear()
    // Enqueue search request FIFO (DSA 2)
    q.enqueue({
      from: params.from,
      to: params.to,
      date: params.date,
      sortBy,
      requestId: `req_${Date.now()}`,
      timestamp: Date.now(),
    })

    api
      .searchFlights({
        from: params.from,
        to: params.to,
        date: params.date,
        sortBy,
        tripType: params.tripType,
        cabinClass: params.cabinClass,
        passengers: params.passengers,
      })
      .then(res => {
        setLiveFlights(res.flights || [])
        setProviderSource(res.provider || 'aviationstack')
      })
      .catch(err => {
        // Handle error gracefully without crashing
        console.warn('Backend API search error:', err)
        setErrorMessage(err.message || 'Unable to connect to flight search service.')
        setHasError(true)
      })
  }, [params, sortBy])

  useEffect(() => {
    fetchLiveFlights()
  }, [fetchLiveFlights])

  // Handle queue completion from FlightLoading
  const handleLoadingComplete = useCallback(() => {
    // Dequeue request FIFO
    queueRef.current.dequeue()
    setLoadStage('envelope')
  }, [])


  // Handle envelope opening action
  const handleOpenEnvelope = useCallback(() => {
    setEnvelopeOpened(true)
    setTimeout(() => {
      setLoadStage('carousel')
    }, 450)
  }, [])

  // Handle re-packing / viewing envelope again
  const handleRepackEnvelope = useCallback(() => {
    setEnvelopeOpened(false)
    setLoadStage('envelope')
  }, [])

  // ── FETCH & FILTER FLIGHTS ─────────────────────────────────────────────────
  const rawFlights = useMemo(() => {
    return liveFlights ?? []
  }, [liveFlights])


  // Unique airlines for dropdown filter
  const availableAirlines = useMemo(() => {
    const set = new Set<string>()
    rawFlights.forEach(f => set.add(f.airline))
    return Array.from(set)
  }, [rawFlights])

  // Filter flights
  const filteredFlights = useMemo(() => {
    return rawFlights.filter(f => {
      // Stops filter
      if (stopsFilter === 'nonstop' && f.stops !== 0) return false
      if (stopsFilter === '1stop' && f.stops !== 1) return false

      // Airline filter
      if (airlineFilter !== 'all' && f.airline !== airlineFilter) return false

      // Departure time filter
      if (departureFilter !== 'all') {
        const bucket = getTimeBucket(f.departure)
        if (bucket !== departureFilter) return false
      }

      return true
    })
  }, [rawFlights, stopsFilter, airlineFilter, departureFilter])

  // Comparison flights list
  const comparedFlights = useMemo(() => {
    return rawFlights.filter(f => comparedSet.has(f.flightNumber))
  }, [rawFlights, comparedSet])

  // Toggle comparison selection (max 3)
  const handleToggleCompare = useCallback((flightNumber: string) => {
    setComparedSet(prev => {
      const next = new Set(prev)
      if (next.has(flightNumber)) {
        next.delete(flightNumber)
      } else {
        if (next.size >= 3) {
          // Remove oldest, add new (Queue-like FIFO retention)
          const first = next.values().next().value
          if (first) next.delete(first)
        }
        next.add(flightNumber)
      }
      return next
    })
  }, [])

  const handleRemoveCompare = useCallback((flightNumber: string) => {
    setComparedSet(prev => {
      const next = new Set(prev)
      next.delete(flightNumber)
      return next
    })
  }, [])

  const handleResetFilters = useCallback(() => {
    setStopsFilter('all')
    setAirlineFilter('all')
    setDepartureFilter('all')
    setSortBy('price')
  }, [])

  const hasActiveFilters =
    stopsFilter !== 'all' ||
    airlineFilter !== 'all' ||
    departureFilter !== 'all' ||
    sortBy !== 'price'

  // Sky background component (reused across all states)
  const renderSkyBackground = () => (
    <div className="fr-sky-canvas" aria-hidden="true">
      <div className="fr-sun-glow" />
      <div className="fr-clouds-layer">
        <div className="fr-cloud-group fr-cloud-group--top">
          <svg width="420" height="180" viewBox="0 0 420 180" fill="none">
            <path
              d="M60 120 C40 120 20 100 20 80 C20 60 40 45 65 48 C75 25 105 15 135 25 C150 10 180 5 210 20 C240 5 280 15 295 40 C325 35 355 55 355 80 C375 85 390 105 380 125 C370 140 345 140 60 120 Z"
              fill="white"
              opacity="0.65"
              filter="blur(8px)"
            />
          </svg>
        </div>
        <div className="fr-cloud-group fr-cloud-group--mid">
          <svg width="480" height="200" viewBox="0 0 480 200" fill="none">
            <path
              d="M80 140 C50 140 30 115 35 90 C40 65 70 55 95 65 C115 35 155 25 190 40 C220 20 270 25 290 55 C330 45 370 70 370 100 C400 105 420 130 400 155 C380 170 330 160 80 140 Z"
              fill="white"
              opacity="0.55"
              filter="blur(10px)"
            />
          </svg>
        </div>
        <div className="fr-cloud-group--bottom" />
      </div>

      {/* Small Distant Airplane flying slowly across the sky */}
      <div className="fr-sky-flight-track">
        <div className="fr-distant-plane-group">
          <div className="fr-distant-contrail" />
          <svg className="fr-distant-plane-svg" viewBox="0 0 24 24">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
          </svg>
        </div>
      </div>
    </div>
  )

  // ── ERROR STATE ────────────────────────────────────────────────────────────
  if (hasError) {
    return (
      <main className="fr-world" id="screen4">
        {renderSkyBackground()}
        <div className="fr-stage">
          <div className="fr-error-box">
            <span className="fr-error-icon" aria-hidden="true">⚠️</span>
            <h2 className="fr-error-title">FLIGHT DATA UNAVAILABLE</h2>
            <p className="fr-error-desc">{errorMessage || "We couldn't prepare your flight tickets at this time."}</p>
            <div className="fr-error-actions">
              <button type="button" className="fr-action-btn" onClick={fetchLiveFlights}>
                TRY AGAIN
              </button>
              <button type="button" className="fr-action-btn fr-action-btn--secondary" onClick={onBack}>
                BACK TO SEARCH
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // ── LOADING STATE WITH QUEUE PROCESSING ────────────────────────────────────
  if (loadStage === 'loading') {
    return (
      <main className="fr-world" id="screen4">
        {renderSkyBackground()}
        <FlightLoading
          from={params.from}
          to={params.to}
          onComplete={handleLoadingComplete}
        />
      </main>
    )
  }

  return (
    <main className="fr-world" id="screen4" aria-label="SkyLark Flight Results">
      {/* Light Morning Sky Background */}
      {renderSkyBackground()}

      {/* ── TOP NAV BAR ──────────────────────────────────────────────────── */}
      <header className="fr-nav">
        <div className="fr-nav-left">
          <span className="fr-nav-symbol">✦</span>
          <span className="fr-nav-brand">SKY<span>LARK</span></span>
          <span className="fr-nav-divider" aria-hidden="true">/</span>
          <span className="fr-nav-subtag">FLIGHT DISPATCH & TICKETS</span>
        </div>

        <div className="fr-nav-right">
          <button
            type="button"
            className="fr-nav-route-btn"
            onClick={() => handleTriggerExploreRoute(filteredFlights[activeTicketIndex] || null)}
            aria-label="Explore interactive sky route network"
          >
            <span>🌐 Sky Route Explorer</span>
          </button>

          {loadStage === 'carousel' && (
            <button
              type="button"
              className="fr-nav-envelope-toggle"
              onClick={handleRepackEnvelope}
              aria-label="View flight envelope"
            >
              <span>✉ View Flight Envelope</span>
            </button>
          )}

          <button
            type="button"
            className="fr-nav-back-btn"
            onClick={onBack}
            aria-label="Back to Flight Search"
          >
            ← Back to Flight Search
          </button>
        </div>
      </header>

      {/* ── SCREEN COMPACT HEADER ────────────────────────────────────────── */}
      <section className="fr-header-section" aria-label="Search summary header">
        <div className="fr-header-content">
          <div className="fr-header-left-col">
            <span className="fr-header-kicker">PASSENGER ITINERARY</span>
            <h1 className="fr-header-title">FLIGHT RESULTS</h1>
            <div className="fr-header-route">
              <span className="fr-header-city-from">{fromCity}</span>
              <span className="fr-header-iata-tag">{params.from}</span>
              <span className="fr-header-arrow" aria-hidden="true">✈</span>
              <span className="fr-header-city-to">{toCity}</span>
              <span className="fr-header-iata-tag">{params.to}</span>
              <span className="fr-header-dot">·</span>
              <span className="fr-header-date">{displayDate}</span>
            </div>
          </div>

          <div className="fr-header-right-col">
            <div className="fr-found-badge">
              <span className="fr-found-count">{filteredFlights.length}</span>
              <span className="fr-found-label">
                {providerSource === 'aviationstack' ? 'REAL FLIGHTS FOUND' : 'FLIGHTS FOUND'}
              </span>
            </div>
          </div>
        </div>

        {/* ── SLIM FILTER / SORT BAR ──────────────────────────────────────── */}
        <FlightFilters
          stops={stopsFilter}
          airline={airlineFilter}
          departureTime={departureFilter}
          sortBy={sortBy}
          availableAirlines={availableAirlines}
          onStopsChange={setStopsFilter}
          onAirlineChange={setAirlineFilter}
          onDepartureTimeChange={setDepartureFilter}
          onSortByChange={setSortBy}
          onReset={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </section>

      {/* ── MAIN CONTENT: ENVELOPE OR TICKET CAROUSEL ────────────────────── */}
      <section className="fr-stage" aria-label="Flight tickets presentation">
        {loadStage === 'envelope' ? (
          /* Signature Airline Mail Envelope (Reference 1) */
          <FlightEnvelope
            from={params.from}
            to={params.to}
            date={displayDate}
            ticketCount={filteredFlights.length}
            isOpen={envelopeOpened}
            onOpen={handleOpenEnvelope}
          />
        ) : filteredFlights.length > 0 ? (
          /* Panoramic Horizontal Ticket Carousel (Reference 2) */
          <div className="fr-carousel-view">
            <FlightCarousel
              flights={filteredFlights}
              activeIndex={activeTicketIndex}
              comparedSet={comparedSet}
              onSelectIndex={setActiveTicketIndex}
              onToggleCompare={handleToggleCompare}
              onViewDetails={setIntelligenceFlight}
              onExploreRoute={handleTriggerExploreRoute}
            />
          </div>
        ) : (
          /* Empty State */
          <div className="fr-empty-state" role="alert">
            <span className="fr-empty-icon" aria-hidden="true">🎫</span>
            <h2 className="fr-empty-title">NO FLIGHT TICKETS FOUND</h2>
            <p className="fr-empty-route">{fromCity} {params.from} → {toCity} {params.to}</p>
            <p className="fr-empty-desc">No available flights match this search filter combination. Try another date or filter.</p>
            <div className="fr-empty-actions">
              <button
                type="button"
                className="fr-action-btn"
                onClick={handleResetFilters}
              >
                RESET FILTERS
              </button>
              <button
                type="button"
                className="fr-action-btn fr-action-btn--secondary"
                onClick={onBack}
              >
                CHANGE SEARCH
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── FLOATING COMPARISON DOCK ─────────────────────────────────────── */}
      {comparedSet.size > 0 && (
        <aside className="fr-compare-dock" aria-label="Comparison dock">
          <div className="fr-dock-inner">
            <div className="fr-dock-left">
              <span className="fr-dock-count-badge">{comparedSet.size}</span>
              <span className="fr-dock-title">
                {comparedSet.size === 1 ? 'Flight Selected' : `${comparedSet.size} Flights Selected`}
              </span>
              <div className="fr-dock-chips">
                {Array.from(comparedSet).map(fn => (
                  <span key={fn} className="fr-dock-chip">
                    {fn}
                    <button
                      type="button"
                      className="fr-chip-remove"
                      onClick={() => handleRemoveCompare(fn)}
                      aria-label={`Remove ${fn}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="fr-dock-right">
              <button
                type="button"
                className="fr-dock-compare-btn"
                onClick={() => setShowComparison(true)}
              >
                <span>COMPARE FLIGHTS ({comparedSet.size})</span>
                <span className="fr-dock-arrow" aria-hidden="true">→</span>
              </button>

              <button
                type="button"
                className="fr-dock-clear-btn"
                onClick={() => setComparedSet(new Set())}
                aria-label="Clear selected flights"
              >
                Clear
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ── FLIGHT INTELLIGENCE DRAWER MODAL ─────────────────────────────── */}
      {intelligenceFlight && (
        <FlightIntelligence
          flight={intelligenceFlight}
          date={displayDate}
          isCompared={comparedSet.has(intelligenceFlight.flightNumber)}
          onClose={() => setIntelligenceFlight(null)}
          onToggleCompare={() => handleToggleCompare(intelligenceFlight.flightNumber)}
          onExploreRoute={handleTriggerExploreRoute}
        />
      )}

      {/* ── COMPARE FLIGHTS BENCHMARK MODAL ──────────────────────────────── */}
      {showComparison && comparedFlights.length > 0 && (
        <FlightComparison
          flights={comparedFlights}
          onClose={() => setShowComparison(false)}
          onRemove={handleRemoveCompare}
        />
      )}

      {/* ── SCREEN 4 TO SCREEN 5 SIGNATURE TRANSITION OVERLAY ──────────────── */}
      {isTransitioning && (
        <div className="fr-transition-overlay" role="alert" aria-live="assertive">
          <div className="fr-transition-content">
            <div className="fr-transition-ticket-preview">
              <span className="fr-trans-kicker">INITIALIZING SKY ROUTE NETWORK</span>
              <div className="fr-trans-route-title">
                <span>{transitionFlight?.from ?? params.from}</span>
                <span className="fr-trans-plane">✈</span>
                <span>{transitionFlight?.to ?? params.to}</span>
              </div>
              <div className="fr-trans-carrier">
                {transitionFlight ? `${transitionFlight.airline} · ${transitionFlight.flightNumber}` : 'General Airport Network Mode'}
              </div>

              {/* Animated Route Line Connecting Origin & Destination */}
              <div className="fr-trans-anim-track">
                <svg className="fr-trans-svg" viewBox="0 0 300 60">
                  <path
                    d="M 20 30 Q 150 5 280 30"
                    fill="none"
                    stroke="#018ABE"
                    strokeWidth="3"
                    className="fr-trans-path-anim"
                  />
                  <circle cx="20" cy="30" r="5" fill="#001B48" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="150" cy="18" r="3.5" fill="#00C2CB" />
                  <circle cx="280" cy="30" r="5" fill="#001B48" stroke="#FFFFFF" strokeWidth="2" />
                </svg>
              </div>
              <span className="fr-trans-sub">Projecting great-circle graph corridors...</span>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
