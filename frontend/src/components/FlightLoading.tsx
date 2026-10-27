/**
 * SkyLark — Screen 4: FlightLoading
 *
 * Cinematic flight processing state backed by Queue DSA.
 * Displays FIFO request processing: "SEARCH REQUEST ENQUEUED (FIFO)" → "PROCESSING FLIGHT DATA..." → "FLIGHT TICKETS READY".
 */

import { useEffect, useState } from 'react'
import { AIRPORT_MAP } from '../data/flightData'

interface FlightLoadingProps {
  from: string
  to: string
  onComplete: () => void
}

export function FlightLoading({ from, to, onComplete }: FlightLoadingProps) {
  const [phase, setPhase] = useState<'queueing' | 'processing' | 'ready'>('queueing')
  const fromCity = AIRPORT_MAP[from]?.city ?? from
  const toCity = AIRPORT_MAP[to]?.city ?? to

  useEffect(() => {
    // Phase 1: Enqueue & dispatch
    const t1 = setTimeout(() => {
      setPhase('processing')
    }, 650)

    // Phase 2: Process batch & prepare tickets
    const t2 = setTimeout(() => {
      setPhase('ready')
    }, 1400)

    // Phase 3: Transition to Envelope
    const t3 = setTimeout(() => {
      onComplete()
    }, 2000)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onComplete])

  return (
    <div className="fr-loading-stage" aria-live="polite" aria-label="Processing flight request">
      <div className="fr-loading-card">
        {/* Route callout */}
        <div className="fr-loading-route">
          <span className="fr-loading-iata">{from}</span>
          <span className="fr-loading-city">({fromCity})</span>
          <span className="fr-loading-arrow" aria-hidden="true">✈</span>
          <span className="fr-loading-iata">{to}</span>
          <span className="fr-loading-city">({toCity})</span>
        </div>

        {/* Dynamic status message */}
        <div className="fr-loading-status-text">
          {phase === 'queueing' && 'SEARCH REQUEST ENQUEUED (FIFO QUEUE)...'}
          {phase === 'processing' && 'PROCESSING FLIGHT DATA...'}
          {phase === 'ready' && 'FLIGHT TICKETS READY'}
        </div>

        {/* Aviation progress track */}
        <div className="fr-loading-radar">
          <div className="fr-radar-track">
            <div className={`fr-radar-fill fr-radar-fill--${phase}`} />
            <span
              className="fr-radar-plane"
              style={{
                left: phase === 'queueing' ? '28%' : phase === 'processing' ? '68%' : '98%',
              }}
              aria-hidden="true"
            >
              ✈
            </span>
          </div>
        </div>

        <div className="fr-loading-hint">
          {phase === 'ready'
            ? 'Preparing physical boarding documents & envelope...'
            : 'Evaluating schedules, seating classes and on-time accuracy...'}
        </div>
      </div>
    </div>
  )
}
