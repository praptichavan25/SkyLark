/**
 * SkyLark — Screen 3: Flight Search Sky
 *
 * Premium sky-themed flight search interface inspired by high-end aviation aesthetics.
 * Continues the sky atmosphere from Screen 2's aircraft window reveal.
 *
 * Key Features:
 *   - Atmospheric sky environment with animated cloud layers and subtle sun glow
 *   - Photorealistic Airbus A350 aircraft floating majestically in the clouds
 *   - Floating telemetry stat badges (450+ Airlines, 12,230+ Routes, 24/7 Telemetry)
 *   - Verified traveler satisfaction badge (4.9 ★ from 85k+ journeys)
 *   - Category selection tabs (Flights, Private Charters, Express Routes)
 *   - Trip type (One-way / Round-trip) & Cabin class selector
 *   - Interactive passenger counter (Adults / Children) popover
 *   - Airport selectors with instant search, IATA codes, and quick-pick chips
 *   - Smooth animated ⇄ swap button
 *   - Departure date selector with quick shortcuts (Today, Tomorrow, +7 Days)
 *   - DSA: Recent Searches backed by a Stack (LIFO) with localStorage persistence
 *   - Flight search submission with animated plane radar loader
 *   - Direct transition to Screen 4 (FlightResultsScreen)
 *
 * Typography: DM Serif Display + DM Sans
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import aircraftHeroImg from '../assets/aircraft-hero.jpg'
import {
  type Airport,
  AIRPORT_MAP,
  searchAirports,
} from '../data/flightData'
import { SearchStack, SEED_RECENT, type RecentSearch } from '../data/searchStack'
import { CalendarPostcard } from './CalendarPostcard'
import '../styles/flight-search-sky.css'

// ─────────────────────────────────────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────────────────────────────────────
function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function addDaysISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function formatDateDisplay(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return iso
  const day = String(d.getDate()).padStart(2, '0')
  const mon = d.toLocaleString('en-GB', { month: 'short' }).toUpperCase()
  const yr = d.getFullYear()
  return `${day} ${mon} ${yr}`
}

function formatDayOfWeek(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('en-US', { weekday: 'long' })
}

function formatDateShort(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return iso
  const day = String(d.getDate()).padStart(2, '0')
  const mon = d.toLocaleString('en-GB', { month: 'short' }).toUpperCase()
  return `${day} ${mon}`
}

// Quick pick airports for instant selection
const QUICK_AIRPORTS = ['BOM', 'DEL', 'BLR', 'DXB', 'LHR', 'SIN', 'JFK']

// ─────────────────────────────────────────────────────────────────────────────
// Search state types
// ─────────────────────────────────────────────────────────────────────────────
type SearchStatus = 'empty' | 'partial' | 'invalid' | 'ready' | 'loading'

interface ValidationErrors {
  from?: string
  to?: string
  date?: string
  sameAirport?: string
}

export interface FlightSearchParams {
  from: string
  to: string
  date: string
  tripType?: 'oneway' | 'roundtrip'
  cabinClass?: 'Economy' | 'Premium Economy' | 'Business' | 'First'
  passengers?: { adults: number; children: number }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: AirportSelector
// ─────────────────────────────────────────────────────────────────────────────
interface AirportSelectorProps {
  id: string
  label: string
  sublabel: string
  icon: string
  airport: Airport | null
  isOpen: boolean
  query: string
  onToggle: () => void
  onQueryChange: (q: string) => void
  onSelect: (airport: Airport) => void
  error?: string
}

function AirportSelector({
  id,
  label,
  sublabel,
  icon,
  airport,
  isOpen,
  query,
  onToggle,
  onQueryChange,
  onSelect,
  error,
}: AirportSelectorProps) {
  const results = searchAirports(query)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onToggle()
      }
    },
    [onToggle]
  )

  return (
    <div
      className={`sky-airport-field${isOpen ? ' sky-airport-field--active' : ''}${error ? ' sky-airport-field--error' : ''}`}
      data-sky-field={id}
    >
      <div className="sky-field-header-row">
        <span className="sky-field-icon" aria-hidden="true">{icon}</span>
        <span className="sky-field-label">{label}</span>
      </div>

      <div
        className="sky-field-main"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${id}-dropdown`}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle()
          }
        }}
      >
        <div className="sky-field-city-row">
          {isOpen ? (
            <input
              ref={inputRef}
              className="sky-field-input"
              id={`${id}-input`}
              type="text"
              value={query}
              placeholder="Search city, country, or code..."
              onChange={e => onQueryChange(e.target.value)}
              onClick={e => e.stopPropagation()}
              onKeyDown={handleKeyDown}
              aria-label={`Search ${label.toLowerCase()} airport`}
              autoComplete="off"
            />
          ) : (
            <div className="sky-field-text-group">
              <span className="sky-field-city">
                {airport ? `${airport.city}, ${airport.country}` : 'Select airport'}
              </span>
              <span className="sky-field-airport-name">
                {airport ? airport.name : sublabel}
              </span>
            </div>
          )}
          <span className="sky-field-iata">
            {airport ? airport.code : '---'}
          </span>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="sky-dropdown"
          id={`${id}-dropdown`}
          role="listbox"
          aria-label={`Select ${label.toLowerCase()}`}
          onClick={e => e.stopPropagation()}
        >
          {/* Quick-pick airport chips */}
          <div className="sky-dropdown-quick-picks">
            <span className="sky-quick-picks-label">POPULAR:</span>
            <div className="sky-quick-chips">
              {QUICK_AIRPORTS.map(code => {
                const ap = AIRPORT_MAP[code]
                if (!ap) return null
                return (
                  <button
                    key={code}
                    type="button"
                    className={`sky-quick-chip${airport?.code === code ? ' sky-quick-chip--active' : ''}`}
                    onClick={() => onSelect(ap)}
                  >
                    {code}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="sky-dropdown-header">
            <span className="sky-dropdown-title">AIRPORT DIRECTORY</span>
            <span className="sky-dropdown-iata-col">IATA</span>
          </div>

          <ul className="sky-dropdown-list">
            {results.length > 0 ? (
              results.map(ap => (
                <li
                  key={ap.code}
                  className={`sky-dropdown-item${airport?.code === ap.code ? ' sky-dropdown-item--active' : ''}`}
                  role="option"
                  aria-selected={airport?.code === ap.code}
                  tabIndex={0}
                  onClick={() => onSelect(ap)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      onSelect(ap)
                    }
                  }}
                >
                  <div className="sky-dropdown-item-info">
                    <span className="sky-dropdown-city">{ap.city}, {ap.country}</span>
                    <span className="sky-dropdown-airport-name">{ap.name}</span>
                  </div>
                  <span className="sky-dropdown-code">{ap.code}</span>
                </li>
              ))
            ) : (
              <li className="sky-dropdown-empty">
                No airports match "{query}". Try "Mumbai", "London", or "DXB".
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT: FlightSearchSky
// ─────────────────────────────────────────────────────────────────────────────
interface FlightSearchSkyProps {
  onSearch?: (params: FlightSearchParams) => void
}

export function FlightSearchSky({ onSearch }: FlightSearchSkyProps) {
  // ── Search form state ──────────────────────────────────────────────────────
  const [fromAirport, setFromAirport] = useState<Airport | null>(AIRPORT_MAP['BOM'])
  const [toAirport, setToAirport] = useState<Airport | null>(AIRPORT_MAP['DEL'])
  const [fromQuery, setFromQuery] = useState('')
  const [toQuery, setToQuery] = useState('')
  const [activeDropdown, setActiveDropdown] = useState<'from' | 'to' | null>(null)
  const [dateISO, setDateISO] = useState('2026-10-12')
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip'>('oneway')
  const [cabinClass, setCabinClass] = useState<'Economy' | 'Premium Economy' | 'Business' | 'First'>('Economy')
  const [activeTab, setActiveTab] = useState<'flight' | 'charter' | 'express'>('flight')
  
  // Passenger state & popover
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [showPassengerModal, setShowPassengerModal] = useState(false)
  const [showClassModal, setShowClassModal] = useState(false)
  const [showCalendarModal, setShowCalendarModal] = useState(false)

  // Status & validation
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('ready')
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [swapAnimating, setSwapAnimating] = useState(false)

  // Stack-backed recent searches
  const stackRef = useRef(new SearchStack())
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])

  // Initialize recent searches from Stack (seed if empty)
  useEffect(() => {
    const stack = stackRef.current
    if (stack.isEmpty()) {
      for (let i = SEED_RECENT.length - 1; i >= 0; i--) {
        stack.push(SEED_RECENT[i])
      }
    }
    setRecentSearches(stack.toArray())
  }, [])

  // ── Refs ───────────────────────────────────────────────────────────────────
  const sectionRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const consoleRef = useRef<HTMLDivElement>(null)
  const recentRef = useRef<HTMLDivElement>(null)

  // ── Scroll-reveal via IntersectionObserver ─────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('sky-revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08 }
    )
    const targets = [heroRef.current, consoleRef.current, recentRef.current]
    targets.forEach(el => {
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  // ── Close dropdowns on outside click ───────────────────────────────────────
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (!t.closest('[data-sky-field]')) {
        setActiveDropdown(null)
        setFromQuery('')
        setToQuery('')
      }
      if (!t.closest('.sky-passenger-control')) {
        setShowPassengerModal(false)
      }
      if (!t.closest('.sky-class-control')) {
        setShowClassModal(false)
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
    setErrors(prev => ({ ...prev, from: undefined, sameAirport: undefined }))
  }, [])

  const handleToSelect = useCallback((airport: Airport) => {
    setToAirport(airport)
    setActiveDropdown(null)
    setToQuery('')
    setErrors(prev => ({ ...prev, to: undefined, sameAirport: undefined }))
  }, [])

  const handleSwap = useCallback(() => {
    if (!fromAirport || !toAirport) return
    setSwapAnimating(true)
    setTimeout(() => {
      setFromAirport(prev => {
        const newFrom = toAirport
        setToAirport(prev)
        return newFrom
      })
      setErrors({})
      setTimeout(() => setSwapAnimating(false), 320)
    }, 120)
  }, [toAirport, fromAirport])

  const handleDateShortcut = useCallback((days: number) => {
    const newDate = addDaysISO(days)
    setDateISO(newDate)
    setErrors(prev => ({ ...prev, date: undefined }))
  }, [])

  const handleRecentClick = useCallback((item: RecentSearch) => {
    const from = AIRPORT_MAP[item.from]
    const to = AIRPORT_MAP[item.to]
    if (from) setFromAirport(from)
    if (to) setToAirport(to)
    if (item.date) setDateISO(item.date)
    setErrors({})
  }, [])

  const handleClear = useCallback(() => {
    setFromAirport(null)
    setToAirport(null)
    setDateISO('')
    setErrors({})
    setActiveDropdown(null)
    setFromQuery('')
    setToQuery('')
  }, [])

  const handleClearHistory = useCallback(() => {
    stackRef.current.clear()
    setRecentSearches([])
  }, [])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchStatus === 'loading') return

    // Validation
    const newErrors: ValidationErrors = {}
    if (!fromAirport) newErrors.from = 'Please select a departure airport'
    if (!toAirport) newErrors.to = 'Please select a destination airport'
    if (!dateISO) newErrors.date = 'Please select a travel date'
    if (fromAirport && toAirport && fromAirport.code === toAirport.code) {
      newErrors.sameAirport = 'Departure and destination cannot be identical'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Push to Stack (LIFO)
    const searchEntry: RecentSearch = {
      from: fromAirport!.code,
      to: toAirport!.code,
      date: dateISO,
      displayDate: formatDateShort(dateISO),
      timestamp: Date.now(),
    }
    stackRef.current.push(searchEntry)
    setRecentSearches(stackRef.current.toArray())

    // Start loading animation
    setSearchStatus('loading')

    const searchParams: FlightSearchParams = {
      from: fromAirport!.code,
      to: toAirport!.code,
      date: dateISO,
      tripType,
      cabinClass,
      passengers: { adults, children },
    }

    // Simulate flight data search & route to Screen 4
    setTimeout(() => {
      setSearchStatus('ready')
      if (onSearch) {
        onSearch(searchParams)
      }
    }, 1400)
  }, [searchStatus, fromAirport, toAirport, dateISO, tripType, cabinClass, adults, children, onSearch])

  const displayDate = dateISO ? formatDateDisplay(dateISO) : ''
  const displayDay = dateISO ? formatDayOfWeek(dateISO) : ''
  const totalPassengers = adults + children
  const passengerSummary = `${totalPassengers} Traveler${totalPassengers > 1 ? 's' : ''}`

  // Validation message
  const statusMessage = useMemo(() => {
    if (errors.sameAirport) return errors.sameAirport
    if (errors.from) return errors.from
    if (errors.to) return errors.to
    if (errors.date) return errors.date
    if (searchStatus === 'loading') return 'Searching flights across 450+ global airlines...'
    return ''
  }, [errors, searchStatus])

  const hasError = !!(errors.from || errors.to || errors.date || errors.sameAirport)

  return (
    <>
      {/* ── TRANSITION ZONE: Screen 2 Sky → Screen 3 Environment ────────── */}
      <div className="sky-transition-zone" aria-hidden="true">
        <div className="sky-transition-cloud-blur" />
        <div className="sky-transition-horizon-line" />
      </div>

      {/* ── SCREEN 3 FLIGHT SEARCH WORLD ─────────────────────────────────── */}
      <div className="sky-world" ref={sectionRef} id="screen3" aria-label="SkyLark Flight Search">
        
        {/* Sky Background Layers */}
        <div className="sky-bg-layer" aria-hidden="true">
          <div className="sky-gradient-base" />
          <div className="sky-clouds sky-clouds-1" />
          <div className="sky-clouds sky-clouds-2" />
          <div className="sky-clouds sky-clouds-3" />
          <div className="sky-sun-glow" />
          <div className="sky-atmosphere-haze" />
        </div>

        {/* ── TOP NAV BAR ──────────────────────────────────────────────── */}
        <header className="sky-nav" aria-label="SkyLark Main Navigation">
          <div className="sky-nav-brand">
            <span className="sky-brand-symbol">✦</span>
            <span className="sky-brand-name">SKY<span>LARK</span></span>
          </div>

          <div className="sky-nav-links">
            <button
              type="button"
              className={`sky-nav-tab${activeTab === 'flight' ? ' sky-nav-tab--active' : ''}`}
              onClick={() => setActiveTab('flight')}
            >
              <span>✈ Flights</span>
            </button>
            <button
              type="button"
              className={`sky-nav-tab${activeTab === 'charter' ? ' sky-nav-tab--active' : ''}`}
              onClick={() => setActiveTab('charter')}
            >
              <span>✦ Private Jets</span>
            </button>
            <button
              type="button"
              className={`sky-nav-tab${activeTab === 'express' ? ' sky-nav-tab--active' : ''}`}
              onClick={() => setActiveTab('express')}
            >
              <span>⚡ Curated Routes</span>
            </button>
          </div>

          <div className="sky-nav-actions">
            <span className="sky-badge-flock">GLOBAL CRUISE FL410</span>
          </div>
        </header>

        {/* ── HERO SECTION: AIRCRAFT + FLOATING STATS + HEADLINE ────────── */}
        <section className="sky-hero" ref={heroRef} aria-label="Flight Search Hero">
          
          {/* FLOATING STATS: LEFT SIDE */}
          <aside className="sky-floating-stats" aria-label="Aviation network stats">
            <div className="sky-stat-badge">
              <span className="sky-badge-icon" aria-hidden="true">✈</span>
              <div className="sky-badge-content">
                <span className="sky-badge-number">450+</span>
                <span className="sky-badge-label">Airlines Supported</span>
              </div>
            </div>
            <div className="sky-stat-badge">
              <span className="sky-badge-icon" aria-hidden="true">🌐</span>
              <div className="sky-badge-content">
                <span className="sky-badge-number">12,230+</span>
                <span className="sky-badge-label">Global Routes</span>
              </div>
            </div>
            <div className="sky-stat-badge">
              <span className="sky-badge-icon" aria-hidden="true">⚡</span>
              <div className="sky-badge-content">
                <span className="sky-badge-number">8.5M+</span>
                <span className="sky-badge-label">Journeys Curated</span>
              </div>
            </div>
          </aside>

          {/* FLOATING REVIEWS / TRUST BADGE: RIGHT SIDE */}
          <aside className="sky-floating-rating" aria-label="Customer satisfaction rating">
            <div className="sky-avatar-stack">
              <div className="sky-avatar" style={{ backgroundColor: '#2d6aa0' }}>JD</div>
              <div className="sky-avatar" style={{ backgroundColor: '#8a6534' }}>EL</div>
              <div className="sky-avatar" style={{ backgroundColor: '#1d8a6e' }}>MK</div>
              <div className="sky-avatar sky-avatar-more">+9k</div>
            </div>
            <div className="sky-rating-info">
              <div className="sky-stars-row">
                <span className="sky-star" aria-hidden="true">★</span>
                <span className="sky-rating-val">4.9</span>
                <span className="sky-rating-count">(85.3k)</span>
              </div>
              <span className="sky-rating-sub">SkyLark Verified</span>
            </div>
          </aside>

          {/* HERO AIRCRAFT PRESENTATION */}
          <div className="sky-aircraft-stage" aria-hidden="true">
            <div className="sky-aircraft-frame">
              <img
                src={aircraftHeroImg}
                alt="SkyLark airliner cruising through clear skies"
                className="sky-aircraft-hero-img"
              />
              <div className="sky-aircraft-glass-overlay" />
              <div className="sky-aircraft-contrail" />
            </div>
          </div>

          {/* HERO TYPOGRAPHY */}
          <div className="sky-hero-text">
            <h1 className="sky-hero-heading">
              Find the Best Flights <br />
              <span className="sky-hero-heading-em">at the Best Prices</span>
            </h1>
            <p className="sky-hero-sub">
              Search, compare, and reserve flights across top global airlines with real-time routing.
            </p>
          </div>
        </section>

        {/* ── SEARCH CONSOLE ──────────────────────────────────────────── */}
        <section className="sky-console-wrapper" ref={consoleRef} aria-label="Flight Search Console">
          <form id="sky-flight-search-form" onSubmit={handleSearch} noValidate>
            
            {/* Console Glass Box */}
            <div className="sky-console">
              
              {/* TOP ROW CONTROLS: Mode, Trip Type, Cabin Class */}
              <div className="sky-console-topbar">
                
                {/* Mode Pills */}
                <div className="sky-topbar-pills" role="tablist">
                  <button
                    type="button"
                    className={`sky-topbar-pill${activeTab === 'flight' ? ' sky-topbar-pill--active' : ''}`}
                    onClick={() => setActiveTab('flight')}
                    role="tab"
                    aria-selected={activeTab === 'flight'}
                  >
                    <span className="sky-pill-icon">✈</span> Flight
                  </button>
                  <button
                    type="button"
                    className={`sky-topbar-pill${activeTab === 'charter' ? ' sky-topbar-pill--active' : ''}`}
                    onClick={() => setActiveTab('charter')}
                    role="tab"
                    aria-selected={activeTab === 'charter'}
                  >
                    <span className="sky-pill-icon">✦</span> Charters
                  </button>
                  <button
                    type="button"
                    className={`sky-topbar-pill${activeTab === 'express' ? ' sky-topbar-pill--active' : ''}`}
                    onClick={() => setActiveTab('express')}
                    role="tab"
                    aria-selected={activeTab === 'express'}
                  >
                    <span className="sky-pill-icon">🧭</span> Discover
                  </button>
                </div>

                {/* Right Options: One way / Round trip & Cabin class */}
                <div className="sky-topbar-options">
                  
                  {/* Trip Type Selector */}
                  <div className="sky-triptype-toggle">
                    <button
                      type="button"
                      className={`sky-triptype-btn${tripType === 'oneway' ? ' sky-triptype-btn--active' : ''}`}
                      onClick={() => setTripType('oneway')}
                    >
                      One way
                    </button>
                    <button
                      type="button"
                      className={`sky-triptype-btn${tripType === 'roundtrip' ? ' sky-triptype-btn--active' : ''}`}
                      onClick={() => setTripType('roundtrip')}
                    >
                      Round trip
                    </button>
                  </div>

                  {/* Cabin Class Popover Selector */}
                  <div className="sky-class-control">
                    <button
                      type="button"
                      className="sky-option-select-btn"
                      onClick={() => setShowClassModal(prev => !prev)}
                      aria-haspopup="listbox"
                      aria-expanded={showClassModal}
                    >
                      <span>{cabinClass}</span>
                      <span className="sky-select-caret">▾</span>
                    </button>

                    {showClassModal && (
                      <div className="sky-class-modal" role="listbox">
                        {(['Economy', 'Premium Economy', 'Business', 'First'] as const).map(cls => (
                          <button
                            key={cls}
                            type="button"
                            className={`sky-class-opt${cabinClass === cls ? ' sky-class-opt--active' : ''}`}
                            onClick={() => {
                              setCabinClass(cls)
                              setShowClassModal(false)
                            }}
                          >
                            <span>{cls}</span>
                            {cabinClass === cls && <span className="sky-opt-check">✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Status / validation message */}
              {statusMessage && (
                <div
                  className={`sky-status-bar${hasError ? ' sky-status-bar--error' : ''}`}
                  role="alert"
                  aria-live="polite"
                >
                  <span className="sky-status-dot" aria-hidden="true" />
                  <span className="sky-status-text">{statusMessage}</span>
                </div>
              )}

              {/* MAIN INPUT FIELDS ROW */}
              <div className="sky-console-fields">
                
                {/* FROM AIRPORT */}
                <AirportSelector
                  id="sky-from"
                  label="FROM"
                  sublabel="Origin Departure"
                  icon="🛫"
                  airport={fromAirport}
                  isOpen={activeDropdown === 'from'}
                  query={fromQuery}
                  onToggle={() => setActiveDropdown(prev => (prev === 'from' ? null : 'from'))}
                  onQueryChange={setFromQuery}
                  onSelect={handleFromSelect}
                  error={errors.from || errors.sameAirport}
                />

                {/* SWAP BUTTON */}
                <div className="sky-swap-col">
                  <button
                    type="button"
                    className={`sky-swap-btn${swapAnimating ? ' sky-swap-btn--animating' : ''}`}
                    onClick={e => {
                      e.stopPropagation()
                      handleSwap()
                    }}
                    aria-label="Swap departure and destination airports"
                    disabled={!fromAirport || !toAirport}
                    title="Swap Origin and Destination"
                  >
                    <span className="sky-swap-icon" aria-hidden="true">⇄</span>
                  </button>
                </div>

                {/* TO AIRPORT */}
                <AirportSelector
                  id="sky-to"
                  label="TO"
                  sublabel="Destination Arrival"
                  icon="🛬"
                  airport={toAirport}
                  isOpen={activeDropdown === 'to'}
                  query={toQuery}
                  onToggle={() => setActiveDropdown(prev => (prev === 'to' ? null : 'to'))}
                  onQueryChange={setToQuery}
                  onSelect={handleToSelect}
                  error={errors.to || errors.sameAirport}
                />

                <div className="sky-field-divider" aria-hidden="true" />

                {/* DEPARTURE DATE */}
                <div
                  className={`sky-date-field${errors.date ? ' sky-date-field--error' : ''}`}
                  onClick={() => setShowCalendarModal(true)}
                  role="button"
                  tabIndex={0}
                  aria-label="Select travel date"
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setShowCalendarModal(true)
                    }
                  }}
                >
                  <div className="sky-field-header-row">
                    <span className="sky-field-icon" aria-hidden="true">📅</span>
                    <span className="sky-field-label">DEPARTURE</span>
                  </div>

                  <div className="sky-date-display">
                    <div className="sky-date-text-group">
                      <span className="sky-date-value">
                        {displayDate || 'Select Date'}
                      </span>
                      {displayDay && (
                        <span className="sky-date-sub">{displayDay}</span>
                      )}
                    </div>
                    <span className="sky-date-picker-icon" aria-hidden="true">🗓</span>
                  </div>

                  {/* Quick date shortcuts */}
                  <div className="sky-date-shortcuts" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      className="sky-date-chip"
                      onClick={() => handleDateShortcut(0)}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      className="sky-date-chip"
                      onClick={() => handleDateShortcut(1)}
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      className="sky-date-chip"
                      onClick={() => handleDateShortcut(7)}
                    >
                      +7 Days
                    </button>
                  </div>
                </div>

                {/* ── INTERACTIVE VINTAGE CALENDAR POSTCARD MODAL ───────────── */}
                {showCalendarModal && (
                  <div
                    className="postcard-calendar-backdrop"
                    onClick={() => setShowCalendarModal(false)}
                  >
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className="postcard-close-btn"
                        onClick={e => {
                          e.stopPropagation()
                          setShowCalendarModal(false)
                        }}
                        aria-label="Close Calendar"
                      >
                        ✕
                      </button>
                      <CalendarPostcard
                        selectedDateISO={dateISO}
                        minDateISO={todayISO()}
                        onSelectDate={iso => {
                          setDateISO(iso)
                          setErrors(prev => ({ ...prev, date: undefined }))
                          setShowCalendarModal(false)
                        }}
                        onClose={() => setShowCalendarModal(false)}
                      />
                    </div>
                  </div>
                )}

                <div className="sky-field-divider" aria-hidden="true" />

                {/* PASSENGERS & CLASS */}
                <div className="sky-passenger-control">
                  <div
                    className="sky-passenger-field"
                    onClick={() => setShowPassengerModal(prev => !prev)}
                    role="button"
                    tabIndex={0}
                    aria-haspopup="dialog"
                    aria-expanded={showPassengerModal}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setShowPassengerModal(prev => !prev)
                      }
                    }}
                  >
                    <div className="sky-field-header-row">
                      <span className="sky-field-icon" aria-hidden="true">👥</span>
                      <span className="sky-field-label">PASSENGERS</span>
                    </div>

                    <div className="sky-passenger-display">
                      <div className="sky-passenger-text-group">
                        <span className="sky-passenger-value">{passengerSummary}</span>
                        <span className="sky-passenger-sub">{cabinClass}</span>
                      </div>
                      <span className="sky-passenger-caret">▾</span>
                    </div>
                  </div>

                  {/* Passenger Counter Popover */}
                  {showPassengerModal && (
                    <div
                      className="sky-passenger-popover"
                      role="dialog"
                      aria-label="Select passengers"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="sky-popover-row">
                        <div className="sky-popover-info">
                          <span className="sky-popover-title">Adults</span>
                          <span className="sky-popover-desc">Ages 12+</span>
                        </div>
                        <div className="sky-counter">
                          <button
                            type="button"
                            className="sky-counter-btn"
                            onClick={() => setAdults(prev => Math.max(1, prev - 1))}
                            disabled={adults <= 1}
                            aria-label="Decrease adults"
                          >
                            –
                          </button>
                          <span className="sky-counter-val">{adults}</span>
                          <button
                            type="button"
                            className="sky-counter-btn"
                            onClick={() => setAdults(prev => Math.min(9, prev + 1))}
                            disabled={adults >= 9}
                            aria-label="Increase adults"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="sky-popover-row">
                        <div className="sky-popover-info">
                          <span className="sky-popover-title">Children</span>
                          <span className="sky-popover-desc">Ages 2–11</span>
                        </div>
                        <div className="sky-counter">
                          <button
                            type="button"
                            className="sky-counter-btn"
                            onClick={() => setChildren(prev => Math.max(0, prev - 1))}
                            disabled={children <= 0}
                            aria-label="Decrease children"
                          >
                            –
                          </button>
                          <span className="sky-counter-val">{children}</span>
                          <button
                            type="button"
                            className="sky-counter-btn"
                            onClick={() => setChildren(prev => Math.min(6, prev + 1))}
                            disabled={children >= 6}
                            aria-label="Increase children"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="sky-popover-footer">
                        <button
                          type="button"
                          className="sky-popover-done-btn"
                          onClick={() => setShowPassengerModal(false)}
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* SEARCH ACTION BUTTON */}
                <div className="sky-search-action-col">
                  <button
                    id="sky-search-btn"
                    type="submit"
                    className={`sky-search-btn${searchStatus === 'loading' ? ' sky-search-btn--loading' : ''}`}
                    disabled={searchStatus === 'loading'}
                    aria-label="Search available flights"
                    aria-busy={searchStatus === 'loading'}
                  >
                    {searchStatus === 'loading' ? (
                      <span className="sky-search-loading">
                        <span className="sky-loading-track">
                          <span className="sky-loading-plane" aria-hidden="true">✈</span>
                          <span className="sky-loading-line" />
                        </span>
                        <span>SEARCHING...</span>
                      </span>
                    ) : (
                      <>
                        <span>SEARCH</span>
                        <span className="sky-btn-arrow" aria-hidden="true">→</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* CLEAR RESET LINK */}
              {(fromAirport || toAirport || dateISO) && (
                <div className="sky-console-footer">
                  <button
                    type="button"
                    className="sky-clear-link"
                    onClick={handleClear}
                    aria-label="Clear search fields"
                  >
                    Reset fields
                  </button>
                </div>
              )}

            </div>
          </form>
        </section>

        {/* ── RECENT SEARCHES (BACKED BY STACK DSA) ────────────────────── */}
        {recentSearches.length > 0 && (
          <section className="sky-recent-section" ref={recentRef} aria-label="Recent searches">
            <div className="sky-recent-header">
              <div className="sky-recent-title-group">
                <span className="sky-recent-icon" aria-hidden="true">⏱</span>
                <span className="sky-recent-title">RECENT SEARCHES</span>
                <span className="sky-recent-count">{recentSearches.length} cached</span>
              </div>
              <button
                type="button"
                className="sky-recent-clear-btn"
                onClick={handleClearHistory}
                aria-label="Clear recent searches history"
              >
                Clear History
              </button>
            </div>

            <div className="sky-recent-list" role="list">
              {recentSearches.slice(0, 5).map((item, i) => {
                const fromCity = AIRPORT_MAP[item.from]?.city ?? item.from
                const toCity = AIRPORT_MAP[item.to]?.city ?? item.to
                return (
                  <button
                    key={`${item.from}-${item.to}-${i}`}
                    className="sky-recent-item"
                    role="listitem"
                    type="button"
                    onClick={() => handleRecentClick(item)}
                    aria-label={`Search flights from ${fromCity} to ${toCity}`}
                  >
                    <div className="sky-recent-route">
                      <span className="sky-recent-code">{item.from}</span>
                      <span className="sky-recent-arrow" aria-hidden="true">→</span>
                      <span className="sky-recent-code">{item.to}</span>
                    </div>
                    <div className="sky-recent-meta">
                      <span className="sky-recent-cities">{fromCity} · {toCity}</span>
                      {item.displayDate && (
                        <span className="sky-recent-date">{item.displayDate}</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )}

      </div>
    </>
  )
}
