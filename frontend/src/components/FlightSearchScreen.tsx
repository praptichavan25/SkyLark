/**
 * SkyLark — Screen 3: Flight Search
 *
 * Continues from Screen 2's "SEE WHERE YOU COULD GO." sky reveal.
 * The visual bridge is a smooth transition from sky blue → ivory paper,
 * achieved via the s3-transition-zone gradient and scroll-triggered
 * reveal animations (IntersectionObserver + CSS class toggles).
 *
 * Animation philosophy: same GSAP ScrollTrigger already installed.
 * We use gsap.fromTo() for the hero content so timing matches Screen 2.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import heroImg from '../assets/hero.png'
import {
  type Airport,
  AIRPORT_MAP,
  searchAirports,
  searchFlights,
} from '../data/flightData'
import '../styles/flight-search.css'

gsap.registerPlugin(ScrollTrigger)

// ─────────────────────────────────────────────────────────────────────────────
// TRAVEL DATE CYCLE DATA
// ─────────────────────────────────────────────────────────────────────────────
const TRAVEL_DATES = [
  { date: '12 OCT 2026', day: 'MONDAY · MORNING DISPATCH' },
  { date: '14 OCT 2026', day: 'WEDNESDAY · SUNSET CRUISE' },
  { date: '18 OCT 2026', day: 'SUNDAY · DIRECT CORRIDOR' },
] as const

const PASSENGER_OPTIONS = ['1 Passenger', '2 Passengers', '4 Passengers']

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Airport Autocomplete Dropdown
// ─────────────────────────────────────────────────────────────────────────────
interface AutocompleteDropdownProps {
  id: string
  title: string
  onSelect: (airport: Airport) => void
  query: string
}

function AutocompleteDropdown({ id, title, onSelect, query }: AutocompleteDropdownProps) {
  const results = searchAirports(query)

  return (
    <div className="s3-autocomplete-dropdown" id={id} role="listbox" aria-label={title}>
      <div className="s3-dropdown-header">
        <span className="s3-dropdown-header-text">{title}</span>
        <span className="s3-dropdown-header-iata">IATA</span>
      </div>
      <ul className="s3-airport-list">
        {results.map(airport => (
          <li
            key={airport.code}
            className="s3-airport-item"
            role="option"
            onClick={() => onSelect(airport)}
            onKeyDown={e => { if (e.key === 'Enter') onSelect(airport) }}
            tabIndex={0}
          >
            <div className="s3-airport-item-info">
              <span className="s3-airport-city">{airport.city}, {airport.country}</span>
              <span className="s3-airport-name">{airport.name}</span>
            </div>
            <span className="s3-airport-code">{airport.code}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function FlightSearchScreen() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [fromAirport, setFromAirport] = useState<Airport>(AIRPORT_MAP['BOM'])
  const [toAirport, setToAirport] = useState<Airport>(AIRPORT_MAP['DEL'])
  const [fromQuery, setFromQuery] = useState('')
  const [toQuery, setToQuery] = useState('')
  const [activeDropdown, setActiveDropdown] = useState<'from' | 'to' | null>(null)
  const [dateIdx, setDateIdx] = useState(0)
  const [passengerIdx, setPassengerIdx] = useState(0)
  const [searchState, setSearchState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [flightCount, setFlightCount] = useState<number | null>(null)

  // ── Refs ───────────────────────────────────────────────────────────────────
  const sectionRef    = useRef<HTMLDivElement>(null)
  const headlineRef   = useRef<HTMLDivElement>(null)
  const aircraftRef   = useRef<HTMLDivElement>(null)
  const routeSvgRef   = useRef<SVGSVGElement>(null)
  const routePathRef  = useRef<SVGPathElement>(null)
  const consoleRef    = useRef<HTMLDivElement>(null)
  const manifestRef   = useRef<HTMLElement>(null)

  // ── Scroll-driven reveal animations ───────────────────────────────────────
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Capture current values at effect run time (avoids stale ref in cleanup)
    const sectionEl    = sectionRef.current
    const aircraftEl   = aircraftRef.current
    const routeSvgEl   = routeSvgRef.current
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('s3-revealed')
            // Once revealed, no need to observe again
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: prefersReduced ? 0.05 : 0.15 }
    )

    // IntersectionObserver for simple class-toggle reveals
    const targets = [
      headlineRef.current,
      aircraftEl,
      consoleRef.current,
    ]
    targets.forEach(el => { if (el) observer.observe(el) })

    // Route SVG reveal — draw path on scroll into view
    const routeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && routeSvgEl) {
            routeSvgEl.classList.add('s3-route-revealed')
            routeObserver.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.3 }
    )
    if (routeSvgEl) routeObserver.observe(routeSvgEl)

    // GSAP subtle aircraft float on scroll (parallax bridge from Screen 2)
    if (!prefersReduced && aircraftEl && sectionEl) {
      gsap.to(aircraftEl, {
        y: -28,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionEl,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.4,
        },
      })
    }

    return () => {
      observer.disconnect()
      routeObserver.disconnect()
      ScrollTrigger.getAll().forEach(st => {
        if (st.trigger === sectionEl) st.kill()
      })
    }
  }, [])

  // ── Close dropdowns on outside click ──────────────────────────────────────
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-dropdown-field]')) {
        setActiveDropdown(null)
        setFromQuery('')
        setToQuery('')
      }
    }
    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleFromSelect = useCallback((airport: Airport) => {
    setFromAirport(airport)
    setActiveDropdown(null)
    setFromQuery('')
  }, [])

  const handleToSelect = useCallback((airport: Airport) => {
    setToAirport(airport)
    setActiveDropdown(null)
    setToQuery('')
  }, [])

  const handleSwap = useCallback(() => {
    setFromAirport(prev => {
      const newFrom = toAirport
      setToAirport(prev)
      return newFrom
    })
  }, [toAirport])

  const handleCycleDate = useCallback(() => {
    setDateIdx(i => (i + 1) % TRAVEL_DATES.length)
  }, [])

  const handleCyclePassengers = useCallback(() => {
    setPassengerIdx(i => (i + 1) % PASSENGER_OPTIONS.length)
  }, [])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchState === 'loading') return

    setSearchState('loading')
    // Simulate async flight search (replace with real API call)
    setTimeout(() => {
      const results = searchFlights({ from: fromAirport.code, to: toAirport.code })
      setFlightCount(results.length)
      setSearchState('done')
      setTimeout(() => setSearchState('idle'), 2200)
    }, 750)
  }, [searchState, fromAirport.code, toAirport.code])

  const setCorridor = useCallback((fromCode: string, toCode: string) => {
    const from = AIRPORT_MAP[fromCode]
    const to   = AIRPORT_MAP[toCode]
    if (from) setFromAirport(from)
    if (to)   setToAirport(to)
  }, [])

  const currentDate = TRAVEL_DATES[dateIdx]

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ─── TRANSITION ZONE: Sky → Ivory Paper ─────────────────────────── */}
      <div className="s3-transition-zone" aria-hidden="true" />

      {/* ─── SCREEN 3 WORLD ────────────────────────────────────────────────── */}
      <div className="flight-search-world" ref={sectionRef} id="screen3">

        {/* ── HERO SECTION ───────────────────────────────────────────────── */}
        <section
          className="s3-hero-section"
          aria-label="SkyLark Flight Search"
        >
          {/* Subtle cartographic background SVG */}
          <div className="s3-chart-bg" aria-hidden="true">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 1440 900"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ position: 'absolute', inset: 0 }}
            >
              {/* Coordinate grid hairlines */}
              {[180, 360, 540, 720].map(y => (
                <line key={y} x1="0" x2="1440" y1={y} y2={y}
                  stroke="rgba(23,21,21,0.05)" strokeWidth="0.75" />
              ))}
              {[240, 560, 880, 1200].map(x => (
                <line key={x} x1={x} x2={x} y1="0" y2="900"
                  stroke="rgba(23,21,21,0.05)" strokeWidth="0.75" />
              ))}
              {/* Compass rose — top right */}
              <g transform="translate(1180, 200)" stroke="rgba(23,21,21,0.07)" strokeWidth="0.75">
                <circle cx="0" cy="0" r="120" strokeDasharray="2 5" />
                <circle cx="0" cy="0" r="85" />
                <line x1="0" x2="0" y1="-130" y2="130" />
                <line x1="-130" x2="130" y1="0" y2="0" />
                <path d="M0 -130 L3.5 -118 L-3.5 -118 Z" fill="#A9926C" stroke="none" opacity="0.5" />
              </g>
              {/* Coordinate micro-text */}
              <text x="250" y="196" fill="rgba(111,105,98,0.5)" fontFamily="Inter" fontSize="8" letterSpacing="1.5">
                18°N // 72°E
              </text>
              <text x="570" y="376" fill="rgba(111,105,98,0.5)" fontFamily="Inter" fontSize="8" letterSpacing="1.5">
                23°N // 75°E
              </text>
              <text x="890" y="556" fill="rgba(111,105,98,0.5)" fontFamily="Inter" fontSize="8" letterSpacing="1.5">
                28°N // 77°E
              </text>
            </svg>
          </div>

          {/* ── LEFT COLUMN ──────────────────────────────────────────────── */}
          <div className="s3-left-col s3-headline-block" ref={headlineRef}>
            {/* Edition kicker */}
            <div className="s3-edition-kicker">
              <span className="s3-kicker-rule" aria-hidden="true" />
              <span className="s3-kicker-text">EDITION 03 · GLOBAL DISPATCH</span>
            </div>

            {/* Monumental heading */}
            <h2 className="s3-headline">
              SEARCH<br />
              <span className="s3-headline-italic">THE SKY</span>
            </h2>

            {/* Supporting text */}
            <p className="s3-supporting-text">
              Find flights. Explore routes.<br />
              Follow the journey with real-time<br />
              vector precision.
            </p>

            {/* Telemetry stat bar */}
            <div className="s3-stat-bar" role="list" aria-label="Flight statistics">
              <div className="s3-stat-item" role="listitem">
                <span className="s3-stat-label">Available Flights</span>
                <span
                  className="s3-stat-value"
                  id="s3-stat-flights"
                  aria-live="polite"
                >
                  {flightCount !== null && searchState === 'done'
                    ? flightCount.toString()
                    : '124'}
                </span>
              </div>
              <div className="s3-stat-item" role="listitem">
                <span className="s3-stat-label">Direct Routes</span>
                <span className="s3-stat-value">38</span>
              </div>
              <div className="s3-stat-item" role="listitem">
                <span className="s3-stat-label">Airports</span>
                <span className="s3-stat-value">2,000+</span>
              </div>
              <div className="s3-stat-item" role="listitem">
                <span className="s3-stat-label">Live Status</span>
                <div className="s3-stat-live">
                  <span className="s3-live-dot" aria-hidden="true" />
                  <span className="s3-live-label">OPERATIONAL</span>
                </div>
              </div>
            </div>

            {/* Corridor stamp */}
            <div className="s3-corridor-stamp">
              <div className="s3-corridor-item">
                <span className="s3-corridor-icon" aria-hidden="true">◈</span>
                <span className="s3-corridor-text">CORRIDOR BOM-DEL ACTIVE</span>
              </div>
              <span aria-hidden="true" style={{ color: 'var(--s3-divider)' }}>·</span>
              <span className="s3-corridor-archive">ARCHIVE NO. SK-409</span>
            </div>
          </div>

          {/* ── RIGHT COLUMN: AIRCRAFT + ROUTE ───────────────────────────── */}
          <div className="s3-right-col">
            {/* Route arc SVG — behind the aircraft */}
            <svg
              ref={routeSvgRef}
              className="s3-route-svg-container"
              viewBox="0 0 620 520"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Flight route from Mumbai to Delhi"
            >
              <defs>
                <linearGradient id="s3ArcGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#A9926C" stopOpacity="0.25" />
                  <stop offset="55%"  stopColor="#A9926C" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#6F5C3A" stopOpacity="1" />
                </linearGradient>
              </defs>

              {/* The main route arc — drawn by CSS on scroll */}
              <path
                ref={routePathRef}
                className="s3-route-path"
                d="M 90 430 Q 280 180 530 80"
                stroke="url(#s3ArcGrad)"
                strokeWidth="1.5"
                strokeDasharray="7 4"
                strokeLinecap="round"
              />
              {/* Subtle glow shadow */}
              <path
                d="M 90 430 Q 280 180 530 80"
                stroke="#A9926C"
                strokeWidth="0.6"
                strokeOpacity="0.3"
              />

              {/* Tangent bearing marks */}
              <line x1="90" y1="430" x2="135" y2="406" stroke="#A9926C" strokeOpacity="0.5" strokeWidth="0.75" />
              <line x1="530" y1="80"  x2="488" y2="103" stroke="#A9926C" strokeOpacity="0.5" strokeWidth="0.75" />

              {/* WAYPOINT: BOM — Mumbai */}
              <g className="s3-waypoint-group" transform="translate(90, 430)">
                <circle cx="0" cy="0" r="12" fill="rgba(241,236,228,0.9)" stroke="#A9926C" strokeWidth="0.75" />
                <circle cx="0" cy="0" r="4.5" fill="#171515" />
                <circle cx="0" cy="0" r="1.8" fill="#A9926C" />
                <circle cx="0" cy="0" r="19" stroke="#A9926C" strokeDasharray="2 3" strokeWidth="0.5" opacity="0.5" />
                {/* Label */}
                <rect x="16" y="-20" width="130" height="38" rx="2"
                  fill="rgba(241,236,228,0.94)" stroke="rgba(23,21,21,0.1)" strokeWidth="0.75" />
                <text x="24" y="-6" fill="#171515" fontFamily="Inter" fontSize="10.5" fontWeight="600" letterSpacing="0.07em">
                  BOM // MUMBAI
                </text>
                <text x="24" y="9" fill="#6F6962" fontFamily="Inter" fontSize="8" letterSpacing="0.1em">
                  19.09° N · 72.87° E
                </text>
              </g>

              {/* Active aircraft glyph at midpoint */}
              <g transform="translate(330, 240) rotate(-30)">
                <circle cx="0" cy="0" r="6" fill="#A9926C" fillOpacity="0.18" />
                <circle cx="0" cy="0" r="3" fill="#6F5C3A" />
                <path d="M 0 -6.5 L 4.5 5 L 0 2.5 L -4.5 5 Z" fill="#171515" />
              </g>

              {/* Mid-point telemetry callout */}
              <g transform="translate(355, 210)">
                <rect x="0" y="0" width="106" height="32" rx="2" fill="rgba(23,21,21,0.9)" />
                <text x="9" y="13" fill="#C4AC87" fontFamily="Inter" fontSize="7.5" fontWeight="600" letterSpacing="0.14em">
                  CRUISING VECTOR
                </text>
                <text x="9" y="24" fill="rgba(241,236,228,0.9)" fontFamily="Inter" fontSize="8.5" fontWeight="500" letterSpacing="0.06em">
                  0.82 MACH · FL370
                </text>
              </g>

              {/* WAYPOINT: DEL — Delhi */}
              <g className="s3-waypoint-group" transform="translate(530, 80)">
                <circle cx="0" cy="0" r="12" fill="rgba(241,236,228,0.9)" stroke="#A9926C" strokeWidth="0.75" />
                <circle cx="0" cy="0" r="4.5" fill="#171515" />
                <circle cx="0" cy="0" r="1.8" fill="#A9926C" />
                <circle cx="0" cy="0" r="19" stroke="#A9926C" strokeDasharray="2 3" strokeWidth="0.5" opacity="0.5" />
                {/* Label — anchored left */}
                <rect x="-148" y="-20" width="132" height="38" rx="2"
                  fill="rgba(241,236,228,0.94)" stroke="rgba(23,21,21,0.1)" strokeWidth="0.75" />
                <text x="-139" y="-6" fill="#171515" fontFamily="Inter" fontSize="10.5" fontWeight="600" letterSpacing="0.07em">
                  DEL // DELHI
                </text>
                <text x="-139" y="9" fill="#6F6962" fontFamily="Inter" fontSize="8" letterSpacing="0.1em">
                  28.56° N · 77.10° E
                </text>
              </g>
            </svg>

            {/* Aircraft image — receives scroll parallax from GSAP */}
            <div className="s3-aircraft-wrapper" ref={aircraftRef}>
              <img
                src={heroImg}
                alt="Commercial airliner cruising at altitude"
                className="s3-aircraft-img"
                draggable={false}
              />

              {/* Tail badge */}
              <div className="s3-tail-badge" aria-hidden="true">
                <span className="s3-tail-dot" />
                <span className="s3-tail-text">A321NEO · TAIL SK-BOM</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── FLIGHT SEARCH CONSOLE ─────────────────────────────────────── */}
        <section className="s3-search-section" aria-label="Flight Search">
          <div className="s3-search-console" ref={consoleRef}>
            {/* Top label bar */}
            <div className="s3-console-topbar">
              <span className="s3-console-label">FLIGHT DISPATCH CONSOLE · SECTOR 04</span>
              <span className="s3-console-id">ARCHIVE NO. SK-409</span>
            </div>

            {/* Fields row */}
            <form
              id="s3-flight-search-form"
              onSubmit={handleSearch}
              aria-label="Search for flights"
            >
              <div className="s3-search-fields">

                {/* FROM field */}
                <div
                  className="s3-search-field"
                  data-dropdown-field="from"
                  onClick={() => setActiveDropdown(prev => prev === 'from' ? null : 'from')}
                  role="button"
                  tabIndex={0}
                  aria-haspopup="listbox"
                  aria-expanded={activeDropdown === 'from'}
                  aria-controls="s3-from-dropdown"
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDropdown(prev => prev === 'from' ? null : 'from') }}
                >
                  <span className="s3-field-label">ORIGIN / FROM</span>
                  <div className="s3-field-main">
                    <input
                      className="s3-field-city"
                      id="s3-from-input"
                      type="text"
                      value={fromQuery || fromAirport.city}
                      onChange={e => { setFromQuery(e.target.value); setActiveDropdown('from') }}
                      onClick={e => e.stopPropagation()}
                      aria-label="Origin city or airport"
                      autoComplete="off"
                    />
                    <span className="s3-field-iata">{fromAirport.code}</span>
                  </div>
                  <span className="s3-field-sub">{fromAirport.name}</span>

                  {activeDropdown === 'from' && (
                    <AutocompleteDropdown
                      id="s3-from-dropdown"
                      title="SELECT ORIGIN"
                      query={fromQuery}
                      onSelect={handleFromSelect}
                    />
                  )}
                </div>

                <div className="s3-field-divider" aria-hidden="true" />

                {/* TO field */}
                <div
                  className="s3-search-field"
                  data-dropdown-field="to"
                  onClick={() => setActiveDropdown(prev => prev === 'to' ? null : 'to')}
                  role="button"
                  tabIndex={0}
                  aria-haspopup="listbox"
                  aria-expanded={activeDropdown === 'to'}
                  aria-controls="s3-to-dropdown"
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDropdown(prev => prev === 'to' ? null : 'to') }}
                >
                  <span className="s3-field-label">DESTINATION / TO</span>
                  <div className="s3-field-main">
                    <input
                      className="s3-field-city"
                      id="s3-to-input"
                      type="text"
                      value={toQuery || toAirport.city}
                      onChange={e => { setToQuery(e.target.value); setActiveDropdown('to') }}
                      onClick={e => e.stopPropagation()}
                      aria-label="Destination city or airport"
                      autoComplete="off"
                    />
                    <span className="s3-field-iata">{toAirport.code}</span>
                  </div>
                  <span className="s3-field-sub">{toAirport.name}</span>

                  {activeDropdown === 'to' && (
                    <AutocompleteDropdown
                      id="s3-to-dropdown"
                      title="SELECT DESTINATION"
                      query={toQuery}
                      onSelect={handleToSelect}
                    />
                  )}
                </div>

                <div className="s3-field-divider" aria-hidden="true" />

                {/* DATE field */}
                <div
                  className="s3-search-field"
                  onClick={handleCycleDate}
                  role="button"
                  tabIndex={0}
                  aria-label={`Travel date: ${currentDate.date}. Click to change.`}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleCycleDate() }}
                >
                  <span className="s3-field-label">DATE OF TRAVEL</span>
                  <div className="s3-field-main">
                    <span className="s3-field-value" id="s3-date-text">{currentDate.date}</span>
                  </div>
                  <span className="s3-field-sub" id="s3-day-text">{currentDate.day}</span>
                </div>

                <div className="s3-field-divider s3-field-passengers-divider" aria-hidden="true" />

                {/* PASSENGERS field */}
                <div
                  className="s3-search-field s3-field-passengers"
                  onClick={handleCyclePassengers}
                  role="button"
                  tabIndex={0}
                  aria-label={`Passengers: ${PASSENGER_OPTIONS[passengerIdx]}. Click to change.`}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleCyclePassengers() }}
                >
                  <span className="s3-field-label">SEAT / PASSENGERS</span>
                  <div className="s3-field-main">
                    <span className="s3-field-value" id="s3-passengers-text">
                      {PASSENGER_OPTIONS[passengerIdx]}
                    </span>
                  </div>
                  <span className="s3-field-sub" style={{ color: 'var(--s3-accent)' }}>
                    ECONOMY CLASS
                  </span>
                </div>

                <div className="s3-field-divider" aria-hidden="true" />

                {/* SEARCH CTA */}
                <div className="s3-search-cta">
                  <button
                    id="s3-search-btn"
                    type="submit"
                    className={`s3-search-btn ${searchState === 'loading' ? 's3-search-btn--loading' : ''} ${searchState === 'done' ? 's3-search-btn--done' : ''}`}
                    disabled={searchState === 'loading'}
                    aria-label="Search for available flights"
                    aria-busy={searchState === 'loading'}
                  >
                    {searchState === 'idle' && (
                      <>SEARCH FLIGHTS <span className="s3-btn-arrow" aria-hidden="true">→</span></>
                    )}
                    {searchState === 'loading' && (
                      <>CALCULATING…</>
                    )}
                    {searchState === 'done' && (
                      <>{flightCount ?? 0} FLIGHTS FOUND ✓</>
                    )}
                  </button>
                </div>

              </div>
            </form>

            {/* Console footer: quick corridors + ICAO badge */}
            <div className="s3-console-footer">
              <div className="s3-corridors-row">
                <span className="s3-corridor-prefix">POPULAR CORRIDORS:</span>
                <div className="s3-corridor-tags">
                  <button
                    type="button"
                    className="s3-corridor-tag"
                    onClick={() => setCorridor('BOM', 'DEL')}
                    aria-label="Search BOM to DEL"
                  >
                    BOM → DEL
                  </button>
                  <button
                    type="button"
                    className="s3-corridor-tag"
                    onClick={() => setCorridor('LHR', 'DEL')}
                    aria-label="Search LHR to DEL"
                  >
                    LHR → DEL
                  </button>
                  <button
                    type="button"
                    className="s3-corridor-tag"
                    onClick={() => setCorridor('DXB', 'BOM')}
                    aria-label="Search DXB to BOM"
                  >
                    DXB → BOM
                  </button>
                </div>
              </div>
              <div className="s3-verify-badge">
                <span className="s3-verify-dot" aria-hidden="true" />
                <span className="s3-verify-text">REAL-TIME ICAO SCHEDULE VERIFIED</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── MANIFEST STRIP ───────────────────────────────────────────────── */}
        <section
          className="s3-manifest-strip"
          ref={manifestRef}
          aria-label="SkyLark services overview"
        >
          <div className="s3-manifest-grid">

            <div className="s3-manifest-item">
              <div className="s3-manifest-header">
                <span className="s3-manifest-label">NETWORK INFRASTRUCTURE</span>
                <span className="s3-manifest-num">01 // NET</span>
              </div>
              <h3 className="s3-manifest-title">Airports &amp; Hubs</h3>
              <p className="s3-manifest-body">
                Integrated hub access across 2,000+ certified class-A commercial
                terminals worldwide with automated slot management.
              </p>
              <button
                type="button"
                className="s3-manifest-link"
                aria-label="Explore global terminals"
              >
                <span>EXPLORE GLOBAL TERMINALS</span>
                <span className="s3-manifest-link-arrow" aria-hidden="true">↗</span>
              </button>
            </div>

            <div className="s3-manifest-item">
              <div className="s3-manifest-header">
                <span className="s3-manifest-label">GREAT-CIRCLE GEOMETRY</span>
                <span className="s3-manifest-num">02 // COR</span>
              </div>
              <h3 className="s3-manifest-title">Curated Routes</h3>
              <p className="s3-manifest-body">
                Proprietary fuel-optimized flight tracks following upper
                tropospheric jet streams for minimal atmospheric disruption.
              </p>
              <button
                type="button"
                className="s3-manifest-link"
                aria-label="View vector catalog"
              >
                <span>VIEW VECTOR CATALOG</span>
                <span className="s3-manifest-link-arrow" aria-hidden="true">↗</span>
              </button>
            </div>

            <div className="s3-manifest-item">
              <div className="s3-manifest-header">
                <span className="s3-manifest-label">FLEET TELEMETRY</span>
                <span className="s3-manifest-num">03 // DIS</span>
              </div>
              <h3 className="s3-manifest-title">Daily Flights</h3>
              <p className="s3-manifest-body">
                Precision schedules calibrated to the second. Continuous telemetry
                beacon tracking with zero-latency dispatch logs.
              </p>
              <button
                type="button"
                className="s3-manifest-link"
                aria-label="View live radar feed"
              >
                <span>VIEW LIVE RADAR FEED</span>
                <span className="s3-manifest-link-arrow" aria-hidden="true">↗</span>
              </button>
            </div>

          </div>
        </section>

        {/* Swap button — floating over the route area on desktop */}
        <button
          type="button"
          onClick={handleSwap}
          aria-label="Swap origin and destination airports"
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'var(--s3-text)',
            color: 'var(--s3-bg)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(23,21,21,0.18)',
            transition: 'transform 0.2s ease, background-color 0.2s ease',
            zIndex: 50,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'rotate(180deg) scale(1.08)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'rotate(0deg) scale(1)' }}
        >
          ⇄
        </button>

      </div>
    </>
  )
}
