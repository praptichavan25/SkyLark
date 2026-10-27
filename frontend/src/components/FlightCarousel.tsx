/**
 * SkyLark — Screen 4: FlightCarousel
 *
 * Horizontal panoramic boarding-pass carousel with tactile physics,
 * center-card emphasis, arrow navigation, keyboard controls, and touch/drag swipe.
 */

import { useRef, useEffect, useCallback } from 'react'
import { type Flight } from '../data/flightData'
import { FlightTicket } from './FlightTicket'

interface FlightCarouselProps {
  flights: Flight[]
  activeIndex: number
  comparedSet: Set<string>
  onSelectIndex: (idx: number) => void
  onToggleCompare: (fn: string) => void
  onViewDetails: (flight: Flight) => void
  onExploreRoute?: (flight: Flight) => void
}

export function FlightCarousel({
  flights,
  activeIndex,
  comparedSet,
  onSelectIndex,
  onToggleCompare,
  onViewDetails,
  onExploreRoute,
}: FlightCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  // Clamp index safely
  const clampedIdx = Math.max(0, Math.min(flights.length - 1, activeIndex))

  const handlePrev = useCallback(() => {
    onSelectIndex(Math.max(0, clampedIdx - 1))
  }, [clampedIdx, onSelectIndex])

  const handleNext = useCallback(() => {
    onSelectIndex(Math.min(flights.length - 1, clampedIdx + 1))
  }, [clampedIdx, flights.length, onSelectIndex])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePrev, handleNext])

  // Center the active ticket in container when index changes
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const activeEl = container.children[clampedIdx] as HTMLElement
    if (activeEl) {
      const containerWidth = container.offsetWidth
      const elOffset = activeEl.offsetLeft
      const elWidth = activeEl.offsetWidth
      const targetScroll = elOffset - (containerWidth / 2) + (elWidth / 2)
      container.scrollTo({ left: targetScroll, behavior: 'smooth' })
    }
  }, [clampedIdx])

  // Mouse drag support for smooth horizontal panning
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = containerRef.current
    if (!container) return
    isDragging.current = true
    startX.current = e.pageX - container.offsetLeft
    scrollLeft.current = container.scrollLeft
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return
    e.preventDefault()
    const x = e.pageX - containerRef.current.offsetLeft
    const walk = (x - startX.current) * 1.4
    containerRef.current.scrollLeft = scrollLeft.current - walk
  }

  const handleMouseUpOrLeave = () => {
    isDragging.current = false
  }

  return (
    <div className="fr-carousel-wrapper" aria-label="Flight tickets carousel">
      {/* Top Controls Bar */}
      <div className="fr-carousel-controls">
        <span className="fr-carousel-counter">
          TICKET {String(clampedIdx + 1).padStart(2, '0')} OF {String(flights.length).padStart(2, '0')}
        </span>

        <div className="fr-carousel-arrows">
          <button
            type="button"
            className="fr-arrow-btn"
            onClick={handlePrev}
            disabled={clampedIdx <= 0}
            aria-label="Previous flight ticket"
          >
            ←
          </button>
          <button
            type="button"
            className="fr-arrow-btn"
            onClick={handleNext}
            disabled={clampedIdx >= flights.length - 1}
            aria-label="Next flight ticket"
          >
            →
          </button>
        </div>
      </div>

      {/* Main Track containing tickets */}
      <div
        ref={containerRef}
        className="fr-carousel-track"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        role="region"
        aria-label="Swipeable tickets track"
      >
        {flights.map((flight, idx) => {
          const isSelected = idx === clampedIdx
          const isCompared = comparedSet.has(flight.flightNumber)
          return (
            <div
              key={flight.flightNumber}
              className={`fr-carousel-slide${isSelected ? ' fr-carousel-slide--active' : ''}`}
            >
              <FlightTicket
                flight={flight}
                isSelected={isSelected}
                isCompared={isCompared}
                index={idx}
                total={flights.length}
                onSelect={() => onSelectIndex(idx)}
                onToggleCompare={() => onToggleCompare(flight.flightNumber)}
                onViewDetails={() => onViewDetails(flight)}
                onExploreRoute={onExploreRoute}
              />
            </div>
          )
        })}
      </div>

      {/* Pagination Progress Dots */}
      <div className="fr-carousel-dots" role="tablist" aria-label="Ticket pagination">
        {flights.map((f, i) => (
          <button
            key={f.flightNumber}
            type="button"
            className={`fr-carousel-dot${i === clampedIdx ? ' fr-carousel-dot--active' : ''}`}
            onClick={() => onSelectIndex(i)}
            aria-label={`Go to flight ${i + 1} (${f.flightNumber})`}
            role="tab"
            aria-selected={i === clampedIdx}
          />
        ))}
      </div>
    </div>
  )
}
