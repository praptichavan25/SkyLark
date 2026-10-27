/**
 * SkyLark — Screen 3: Flight Cabinet
 *
 * A minimal, premium, 3D aviation cabinet.
 * The cabinet is the hero visual — no aircraft, no maps, no airline logos.
 *
 * DSA: Recent Searches section is backed by a simple Stack (LIFO array).
 *      The Stack interface is ready to be promoted to a proper Stack class.
 *
 * Typography: DM Serif Display (title) + DM Sans (all UI text)
 * Fonts loaded in index.html
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  type Airport,
  AIRPORT_MAP,
  searchAirports,
} from '../data/flightData'
import '../styles/flight-cabinet.css'

// ─────────────────────────────────────────────────────────────────────────────
// DSA: Stack — Recent Searches (LIFO)
// The UI surfaces only the top N items; the underlying structure is a Stack.
// ─────────────────────────────────────────────────────────────────────────────
interface RecentSearch {
  from: string   // IATA code
  to:   string   // IATA code
  date: string   // Display date string "DD MON YYYY"
}

// Simple local Stack implemented as an array (newest at index 0)
const RECENT_MAX = 5

function stackPush(stack: RecentSearch[], item: RecentSearch): RecentSearch[] {
  // Remove duplicates (same from/to)
  const deduplicated = stack.filter(s => !(s.from === item.from && s.to === item.to))
  return [item, ...deduplicated].slice(0, RECENT_MAX)
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed: initial recent searches (stack top = newest)
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_RECENT: RecentSearch[] = [
  { from: 'BOM', to: 'DEL', date: '12 OCT' },
  { from: 'DEL', to: 'LHR', date: '28 NOV' },
  { from: 'BLR', to: 'DXB', date: '04 DEC' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Date formatting helper
// ─────────────────────────────────────────────────────────────────────────────
function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return dateStr
  const day = String(d.getDate()).padStart(2, '0')
  const mon = d.toLocaleString('en-GB', { month: 'short' }).toUpperCase()
  const yr  = d.getFullYear()
  return `${day} ${mon} ${yr}`
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return dateStr
  const day = String(d.getDate()).padStart(2, '0')
  const mon = d.toLocaleString('en-GB', { month: 'short' }).toUpperCase()
  return `${day} ${mon}`
}

// Min date for the date picker = today
function todayISO(): string {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

// Default date = 12 Oct 2026
const DEFAULT_DATE_ISO = '2026-10-12'

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Airport Autocomplete Dropdown
// ─────────────────────────────────────────────────────────────────────────────
interface AirportDropdownProps {
  id: string
  title: string
  query: string
  onSelect: (airport: Airport) => void
}

function AirportDropdown({ id, title, query, onSelect }: AirportDropdownProps) {
  const results = searchAirports(query)
  return (
    <div className="fc-dropdown" id={id} role="listbox" aria-label={title}>
      <div className="fc-dropdown-header">
        <span className="fc-dropdown-title">{title}</span>
        <span className="fc-dropdown-iata-col">IATA</span>
      </div>
      <ul className="fc-dropdown-list">
        {results.map(airport => (
          <li
            key={airport.code}
            className="fc-dropdown-item"
            role="option"
            tabIndex={0}
            onClick={() => onSelect(airport)}
            onKeyDown={e => { if (e.key === 'Enter') onSelect(airport) }}
          >
            <div className="fc-dropdown-item-info">
              <span className="fc-dropdown-city">{airport.city}</span>
              <span className="fc-dropdown-airport-name">{airport.name}</span>
            </div>
            <span className="fc-dropdown-code">{airport.code}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT: FlightCabinetScreen
// ─────────────────────────────────────────────────────────────────────────────
export function FlightCabinetScreen() {
  // ── State ───────────────────────────────────────────────────────────────────
  const [fromAirport, setFromAirport] = useState<Airport>(AIRPORT_MAP['BOM'])
  const [toAirport,   setToAirport]   = useState<Airport>(AIRPORT_MAP['DEL'])
  const [fromQuery,   setFromQuery]   = useState('')
  const [toQuery,     setToQuery]     = useState('')
  const [activeDropdown, setActiveDropdown] = useState<'from' | 'to' | null>(null)
  const [dateISO,     setDateISO]     = useState(DEFAULT_DATE_ISO)
  const [searchState, setSearchState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [recentStack, setRecentStack] = useState<RecentSearch[]>(INITIAL_RECENT)
  const [errors,      setErrors]      = useState<{ from?: boolean; to?: boolean; date?: boolean }>({})

  // ── Refs ────────────────────────────────────────────────────────────────────
  const titleRef    = useRef<HTMLDivElement>(null)
  const cabinetRef  = useRef<HTMLDivElement>(null)

  // ── Scroll-reveal via IntersectionObserver ─────────────────────────────────
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fc-revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: prefersReduced ? 0.05 : 0.1 }
    )
    ;[titleRef.current, cabinetRef.current].forEach(el => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [])

  // ── Close dropdowns on outside click ───────────────────────────────────────
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (!t.closest('[data-fc-field]')) {
        setActiveDropdown(null)
        setFromQuery('')
        setToQuery('')
      }
    }
    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [])

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleFromSelect = useCallback((airport: Airport) => {
    setFromAirport(airport)
    setActiveDropdown(null)
    setFromQuery('')
    setErrors(prev => ({ ...prev, from: false }))
  }, [])

  const handleToSelect = useCallback((airport: Airport) => {
    setToAirport(airport)
    setActiveDropdown(null)
    setToQuery('')
    setErrors(prev => ({ ...prev, to: false }))
  }, [])

  const handleSwap = useCallback(() => {
    setFromAirport(prev => {
      const newFrom = toAirport
      setToAirport(prev)
      return newFrom
    })
  }, [toAirport])

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDateISO(e.target.value)
    setErrors(prev => ({ ...prev, date: false }))
  }, [])

  const handleRecentClick = useCallback((item: RecentSearch) => {
    const from = AIRPORT_MAP[item.from]
    const to   = AIRPORT_MAP[item.to]
    if (from) setFromAirport(from)
    if (to)   setToAirport(to)
  }, [])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchState === 'loading') return

    // Validate
    const newErrors: typeof errors = {}
    if (!fromAirport) newErrors.from = true
    if (!toAirport)   newErrors.to   = true
    if (!dateISO)     newErrors.date = true
    if (fromAirport && toAirport && fromAirport.code === toAirport.code) {
      newErrors.from = true
      newErrors.to   = true
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Push to recent stack
    setRecentStack(prev =>
      stackPush(prev, {
        from: fromAirport.code,
        to:   toAirport.code,
        date: formatDateShort(dateISO),
      })
    )

    setSearchState('loading')
    // Prepare search params — Screen 4 will consume these
    const searchParams = {
      from: fromAirport.code,
      to:   toAirport.code,
      date: dateISO,
    }
    // TODO: navigate to Screen 4 with searchParams when ready
    console.log('[SkyLark] Search params prepared for Screen 4:', searchParams)

    setTimeout(() => {
      setSearchState('done')
      setTimeout(() => setSearchState('idle'), 2400)
    }, 900)
  }, [searchState, fromAirport, toAirport, dateISO, errors])

  const displayDate = dateISO ? formatDateDisplay(dateISO) : '12 OCT 2026'

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── TRANSITION ZONE: Screen 2 Sky → Screen 3 Dark ──────────────── */}
      <div className="fc-transition-zone" aria-hidden="true" />

      {/* ── SCREEN 3 WORLD ─────────────────────────────────────────────── */}
      <div className="fc-world" id="screen3" aria-label="SkyLark Flight Cabinet">

        {/* ── TITLE ──────────────────────────────────────────────────────── */}
        <div className="fc-title-section" ref={titleRef}>
          <span className="fc-title-kicker">SKYLARK</span>
          <h2 className="fc-main-title">Flight Cabinet</h2>
        </div>

        {/* ── PHYSICAL CABINET ───────────────────────────────────────────── */}
        <div
          className="fc-cabinet-shell"
          ref={cabinetRef}
          role="region"
          aria-label="Flight search cabinet"
        >
          {/* Corner fasteners (bottom two) */}
          <div className="fc-cabinet-corners" aria-hidden="true" />

          {/* ── HEADER PLATE ─────────────────────────────────────────────── */}
          <div className="fc-cabinet-header">
            <div className="fc-header-left">
              <span className="fc-brand-micro">SKYLARK</span>
              <h3 className="fc-cabinet-title">Flight Cabinet</h3>
            </div>
            <div className="fc-header-badge" aria-hidden="true">
              <span className="fc-badge-dot" />
              <span className="fc-badge-text">UNIT 03</span>
            </div>
          </div>

          {/* ── SEARCH FORM ───────────────────────────────────────────────── */}
          <form
            id="fc-flight-search-form"
            onSubmit={handleSearch}
            aria-label="Search for flights"
            noValidate
          >
            <div className="fc-cabinet-body">

              {/* FROM / TO ROW */}
              <div className={`fc-route-row${errors.from || errors.to ? ' fc-route-row--error' : ''}`}>

                {/* FROM */}
                <div
                  className={`fc-airport-field${activeDropdown === 'from' ? ' fc-active' : ''}`}
                  data-fc-field="from"
                  role="button"
                  tabIndex={0}
                  aria-haspopup="listbox"
                  aria-expanded={activeDropdown === 'from'}
                  aria-controls="fc-from-dropdown"
                  onClick={() => setActiveDropdown(prev => prev === 'from' ? null : 'from')}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDropdown(prev => prev === 'from' ? null : 'from') }}
                >
                  <span className="fc-field-label">FROM</span>
                  <div className="fc-field-city-row">
                    <input
                      id="fc-from-input"
                      className="fc-field-city-input"
                      type="text"
                      value={fromQuery || fromAirport.city}
                      onChange={e => { setFromQuery(e.target.value); setActiveDropdown('from') }}
                      onClick={e => e.stopPropagation()}
                      aria-label="Origin city or airport"
                      autoComplete="off"
                    />
                    <span className="fc-field-iata">{fromAirport.code}</span>
                  </div>

                  {activeDropdown === 'from' && (
                    <AirportDropdown
                      id="fc-from-dropdown"
                      title="SELECT ORIGIN"
                      query={fromQuery}
                      onSelect={handleFromSelect}
                    />
                  )}
                </div>

                {/* SWAP */}
                <div className="fc-swap-col">
                  <button
                    type="button"
                    className="fc-swap-btn"
                    onClick={e => { e.stopPropagation(); handleSwap() }}
                    aria-label="Swap origin and destination"
                  >
                    ⇄
                  </button>
                </div>

                {/* TO */}
                <div
                  className={`fc-airport-field${activeDropdown === 'to' ? ' fc-active' : ''}`}
                  data-fc-field="to"
                  role="button"
                  tabIndex={0}
                  aria-haspopup="listbox"
                  aria-expanded={activeDropdown === 'to'}
                  aria-controls="fc-to-dropdown"
                  onClick={() => setActiveDropdown(prev => prev === 'to' ? null : 'to')}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDropdown(prev => prev === 'to' ? null : 'to') }}
                >
                  <span className="fc-field-label">TO</span>
                  <div className="fc-field-city-row">
                    <input
                      id="fc-to-input"
                      className="fc-field-city-input"
                      type="text"
                      value={toQuery || toAirport.city}
                      onChange={e => { setToQuery(e.target.value); setActiveDropdown('to') }}
                      onClick={e => e.stopPropagation()}
                      aria-label="Destination city or airport"
                      autoComplete="off"
                    />
                    <span className="fc-field-iata">{toAirport.code}</span>
                  </div>

                  {activeDropdown === 'to' && (
                    <AirportDropdown
                      id="fc-to-dropdown"
                      title="SELECT DESTINATION"
                      query={toQuery}
                      onSelect={handleToSelect}
                    />
                  )}
                </div>
              </div>

              {/* Validation error */}
              {(errors.from || errors.to) && (
                <div className="fc-error-row">
                  <span className="fc-error-msg">
                    {fromAirport?.code === toAirport?.code
                      ? 'Origin and destination must differ'
                      : 'Please select origin and destination'}
                  </span>
                </div>
              )}

              {/* DATE ROW */}
              <div
                className={`fc-date-row${errors.date ? ' fc-date-row--error' : ''}`}
                role="button"
                aria-label={`Travel date: ${displayDate}. Click to change.`}
              >
                <div className="fc-date-left">
                  <span className="fc-field-label">DATE</span>
                  <span className="fc-date-value" id="fc-date-text" aria-live="polite">
                    {displayDate}
                  </span>
                </div>
                <div className="fc-date-right">
                  <span className="fc-date-standby">STANDBY</span>
                  <div className="fc-date-icon" aria-hidden="true">📅</div>
                </div>
                {/* Native date picker overlaid invisibly */}
                <input
                  type="date"
                  className="fc-date-input-hidden"
                  id="fc-date-input"
                  value={dateISO}
                  min={todayISO()}
                  onChange={handleDateChange}
                  aria-label="Select travel date"
                />
              </div>

              {/* DATE ERROR */}
              {errors.date && (
                <div className="fc-error-row">
                  <span className="fc-error-msg">Please select a travel date</span>
                </div>
              )}

              {/* SEARCH FLIGHTS BUTTON */}
              <button
                id="fc-search-btn"
                type="submit"
                className={`fc-search-btn${searchState === 'loading' ? ' fc-search-btn--loading' : ''}${searchState === 'done' ? ' fc-search-btn--done' : ''}`}
                disabled={searchState === 'loading'}
                aria-label="Search for available flights"
                aria-busy={searchState === 'loading'}
              >
                {searchState === 'idle' && (
                  <>SEARCH FLIGHTS <span className="fc-btn-arrow" aria-hidden="true">→</span></>
                )}
                {searchState === 'loading' && <>LOCATING FLIGHTS…</>}
                {searchState === 'done' && <>FLIGHTS READY ✓</>}
              </button>

            </div>
          </form>

          {/* ── RECENT SEARCHES ───────────────────────────────────────────── */}
          <div className="fc-cabinet-footer">
            <div className="fc-recent-header">
              <span className="fc-recent-label">RECENT</span>
              <span className="fc-recent-archive">ARCHIVE</span>
            </div>
            <ul className="fc-recent-list" aria-label="Recent searches">
              {recentStack.slice(0, 3).map((item, i) => (
                <li
                  key={`${item.from}-${item.to}-${i}`}
                  className="fc-recent-item"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleRecentClick(item)}
                  onKeyDown={e => { if (e.key === 'Enter') handleRecentClick(item) }}
                  aria-label={`Search ${item.from} to ${item.to}`}
                >
                  <span className="fc-recent-route">
                    <span>{item.from}</span>
                    <span className="fc-recent-arrow">→</span>
                    <span>{item.to}</span>
                  </span>
                  <span className="fc-recent-date">
                    {item.date}
                    <span className="fc-recent-pip" aria-hidden="true" />
                  </span>
                </li>
              ))}
            </ul>
          </div>

        </div>{/* /fc-cabinet-shell */}
      </div>{/* /fc-world */}
    </>
  )
}
