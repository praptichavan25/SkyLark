/**
 * SkyLark — Screen 4: FlightFilters
 *
 * Slim, minimal control bar beneath header:
 *   - Stops pills: [ ALL ], [ NON-STOP ], [ 1 STOP ]
 *   - Airline filter dropdown
 *   - Departure time of day dropdown
 *   - Sort by dropdown (Departure, Duration, Price)
 */

import { useState, useRef, useEffect } from 'react'

export type StopsFilter = 'all' | 'nonstop' | '1stop'
export type DepartureFilter = 'all' | 'morning' | 'afternoon' | 'evening' | 'night'
export type SortOption = 'price' | 'duration' | 'departure'

interface FlightFiltersProps {
  stops: StopsFilter
  airline: string
  departureTime: DepartureFilter
  sortBy: SortOption
  availableAirlines: string[]
  onStopsChange: (s: StopsFilter) => void
  onAirlineChange: (a: string) => void
  onDepartureTimeChange: (d: DepartureFilter) => void
  onSortByChange: (s: SortOption) => void
  onReset: () => void
  hasActiveFilters: boolean
}

export function FlightFilters({
  stops,
  airline,
  departureTime,
  sortBy,
  availableAirlines,
  onStopsChange,
  onAirlineChange,
  onDepartureTimeChange,
  onSortByChange,
  onReset,
  hasActiveFilters,
}: FlightFiltersProps) {
  const [openDropdown, setOpenDropdown] = useState<'airline' | 'departure' | 'sort' | null>(null)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  return (
    <div className="fr-filters-bar" ref={barRef} aria-label="Flight filters and sorting">
      {/* ── STOPS PILLS ────────────────────────────────────────── */}
      <div className="fr-filter-pills" role="radiogroup" aria-label="Filter by stops">
        <button
          type="button"
          className={`fr-pill${stops === 'all' ? ' fr-pill--active' : ''}`}
          onClick={() => onStopsChange('all')}
          role="radio"
          aria-checked={stops === 'all'}
        >
          ALL
        </button>
        <button
          type="button"
          className={`fr-pill${stops === 'nonstop' ? ' fr-pill--active' : ''}`}
          onClick={() => onStopsChange('nonstop')}
          role="radio"
          aria-checked={stops === 'nonstop'}
        >
          NON-STOP
        </button>
        <button
          type="button"
          className={`fr-pill${stops === '1stop' ? ' fr-pill--active' : ''}`}
          onClick={() => onStopsChange('1stop')}
          role="radio"
          aria-checked={stops === '1stop'}
        >
          1 STOP
        </button>
      </div>

      <div className="fr-filter-dividers" aria-hidden="true" />

      {/* ── DROPDOWNS: AIRLINE, DEPARTURE, SORT BY ─────────────── */}
      <div className="fr-filter-dropdowns">
        {/* AIRLINE DROPDOWN */}
        <div className="fr-dropdown-control">
          <button
            type="button"
            className={`fr-dropdown-btn${airline !== 'all' ? ' fr-dropdown-btn--active' : ''}`}
            onClick={() => setOpenDropdown(prev => prev === 'airline' ? null : 'airline')}
            aria-haspopup="listbox"
            aria-expanded={openDropdown === 'airline'}
          >
            <span>{airline === 'all' ? 'AIRLINE' : airline}</span>
            <span className="fr-caret">▾</span>
          </button>

          {openDropdown === 'airline' && (
            <div className="fr-dropdown-menu" role="listbox">
              <button
                type="button"
                className={`fr-dropdown-opt${airline === 'all' ? ' fr-dropdown-opt--active' : ''}`}
                onClick={() => {
                  onAirlineChange('all')
                  setOpenDropdown(null)
                }}
              >
                All Airlines
              </button>
              {availableAirlines.map(a => (
                <button
                  key={a}
                  type="button"
                  className={`fr-dropdown-opt${airline === a ? ' fr-dropdown-opt--active' : ''}`}
                  onClick={() => {
                    onAirlineChange(a)
                    setOpenDropdown(null)
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* DEPARTURE TIME DROPDOWN */}
        <div className="fr-dropdown-control">
          <button
            type="button"
            className={`fr-dropdown-btn${departureTime !== 'all' ? ' fr-dropdown-btn--active' : ''}`}
            onClick={() => setOpenDropdown(prev => prev === 'departure' ? null : 'departure')}
            aria-haspopup="listbox"
            aria-expanded={openDropdown === 'departure'}
          >
            <span>
              {departureTime === 'all' && 'DEPARTURE'}
              {departureTime === 'morning' && 'Morning (06:00-12:00)'}
              {departureTime === 'afternoon' && 'Afternoon (12:00-18:00)'}
              {departureTime === 'evening' && 'Evening (18:00-22:00)'}
              {departureTime === 'night' && 'Night (22:00-06:00)'}
            </span>
            <span className="fr-caret">▾</span>
          </button>

          {openDropdown === 'departure' && (
            <div className="fr-dropdown-menu" role="listbox">
              <button
                type="button"
                className={`fr-dropdown-opt${departureTime === 'all' ? ' fr-dropdown-opt--active' : ''}`}
                onClick={() => {
                  onDepartureTimeChange('all')
                  setOpenDropdown(null)
                }}
              >
                Any Departure Time
              </button>
              <button
                type="button"
                className={`fr-dropdown-opt${departureTime === 'morning' ? ' fr-dropdown-opt--active' : ''}`}
                onClick={() => {
                  onDepartureTimeChange('morning')
                  setOpenDropdown(null)
                }}
              >
                Morning (06:00 – 12:00)
              </button>
              <button
                type="button"
                className={`fr-dropdown-opt${departureTime === 'afternoon' ? ' fr-dropdown-opt--active' : ''}`}
                onClick={() => {
                  onDepartureTimeChange('afternoon')
                  setOpenDropdown(null)
                }}
              >
                Afternoon (12:00 – 18:00)
              </button>
              <button
                type="button"
                className={`fr-dropdown-opt${departureTime === 'evening' ? ' fr-dropdown-opt--active' : ''}`}
                onClick={() => {
                  onDepartureTimeChange('evening')
                  setOpenDropdown(null)
                }}
              >
                Evening (18:00 – 22:00)
              </button>
              <button
                type="button"
                className={`fr-dropdown-opt${departureTime === 'night' ? ' fr-dropdown-opt--active' : ''}`}
                onClick={() => {
                  onDepartureTimeChange('night')
                  setOpenDropdown(null)
                }}
              >
                Night (22:00 – 06:00)
              </button>
            </div>
          )}
        </div>

        {/* SORT BY DROPDOWN */}
        <div className="fr-dropdown-control">
          <button
            type="button"
            className="fr-dropdown-btn"
            onClick={() => setOpenDropdown(prev => prev === 'sort' ? null : 'sort')}
            aria-haspopup="listbox"
            aria-expanded={openDropdown === 'sort'}
          >
            <span>
              SORT: {sortBy.toUpperCase()}
            </span>
            <span className="fr-caret">▾</span>
          </button>

          {openDropdown === 'sort' && (
            <div className="fr-dropdown-menu fr-dropdown-menu--right" role="listbox">
              <button
                type="button"
                className={`fr-dropdown-opt${sortBy === 'price' ? ' fr-dropdown-opt--active' : ''}`}
                onClick={() => {
                  onSortByChange('price')
                  setOpenDropdown(null)
                }}
              >
                Lowest Price First
              </button>
              <button
                type="button"
                className={`fr-dropdown-opt${sortBy === 'duration' ? ' fr-dropdown-opt--active' : ''}`}
                onClick={() => {
                  onSortByChange('duration')
                  setOpenDropdown(null)
                }}
              >
                Shortest Duration
              </button>
              <button
                type="button"
                className={`fr-dropdown-opt${sortBy === 'departure' ? ' fr-dropdown-opt--active' : ''}`}
                onClick={() => {
                  onSortByChange('departure')
                  setOpenDropdown(null)
                }}
              >
                Earliest Departure
              </button>
            </div>
          )}
        </div>

        {/* RESET FILTERS BUTTON */}
        {hasActiveFilters && (
          <button
            type="button"
            className="fr-filter-reset-btn"
            onClick={onReset}
            aria-label="Reset all filters"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}
