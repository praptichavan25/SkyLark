import { useState } from 'react'
import { PageOneIntro } from '../components/PageOneIntro'
import { AircraftWindowSequence } from '../components/AircraftWindowSequence'
import { FlightSearchSky, type FlightSearchParams } from '../components/FlightSearchSky'
import { FlightResultsScreen } from '../components/FlightResultsScreen'
import { SkyRouteExplorer } from '../components/SkyRouteExplorer'
import { type Flight } from '../data/flightData'

export function LandingPage() {
  const [searchParams, setSearchParams] = useState<FlightSearchParams | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [showRouteExplorer, setShowRouteExplorer] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get('screen') === '5' || urlParams.has('explorer')
    }
    return false
  })
  const [selectedRouteFlight, setSelectedRouteFlight] = useState<Flight | null>(null)

  const handleSearch = (params: FlightSearchParams) => {
    setSearchParams(params)
    setShowResults(true)
    setShowRouteExplorer(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackToSearch = () => {
    setShowResults(false)
    setShowRouteExplorer(false)
    setTimeout(() => {
      const el = document.getElementById('screen3')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  const handleExploreRoute = (flight: Flight | null) => {
    setSelectedRouteFlight(flight)
    setShowRouteExplorer(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackFromRouteExplorer = () => {
    setShowRouteExplorer(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Screen 5: Sky Route Explorer
  if (showRouteExplorer) {
    return (
      <SkyRouteExplorer
        flight={selectedRouteFlight}
        dataSource="LIVE"
        onBack={handleBackFromRouteExplorer}
      />
    )
  }

  // Screen 4: Flight Results
  if (showResults && searchParams) {
    return (
      <FlightResultsScreen
        params={searchParams}
        onBack={handleBackToSearch}
        onExploreRoute={handleExploreRoute}
      />
    )
  }

  // Screens 1, 2, 3
  return (
    <main>
      <PageOneIntro />
      <AircraftWindowSequence />
      <FlightSearchSky onSearch={handleSearch} />
    </main>
  )
}
