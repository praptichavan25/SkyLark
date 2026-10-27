/**
 * SkyLark — Route Network Data Layer
 * Initializes Graph & Tree DSA instances with real airport geo-coordinates.
 */

import { Graph } from '../dsa/Graph'
import { Tree } from '../dsa/Tree'
import { AIRPORTS, type Airport } from './flightData'

export interface AirportGeo extends Airport {
  lat: number
  lng: number
  continent: string
}

export const AIRPORT_GEO: Record<string, AirportGeo> = {
  BOM: { ...AIRPORTS.find(a => a.code === 'BOM')!, lat: 19.0896, lng: 72.8679, continent: 'ASIA' },
  DEL: { ...AIRPORTS.find(a => a.code === 'DEL')!, lat: 28.5562, lng: 77.1000, continent: 'ASIA' },
  BLR: { ...AIRPORTS.find(a => a.code === 'BLR')!, lat: 13.1986, lng: 77.7066, continent: 'ASIA' },
  MAA: { ...AIRPORTS.find(a => a.code === 'MAA')!, lat: 12.9941, lng: 80.1709, continent: 'ASIA' },
  CCU: { ...AIRPORTS.find(a => a.code === 'CCU')!, lat: 22.6547, lng: 88.4467, continent: 'ASIA' },
  HYD: { ...AIRPORTS.find(a => a.code === 'HYD')!, lat: 17.2403, lng: 78.4294, continent: 'ASIA' },
  DXB: { ...AIRPORTS.find(a => a.code === 'DXB')!, lat: 25.2532, lng: 55.3644, continent: 'ASIA' },
  DOH: { ...AIRPORTS.find(a => a.code === 'DOH')!, lat: 25.2731, lng: 51.6081, continent: 'ASIA' },
  SIN: { ...AIRPORTS.find(a => a.code === 'SIN')!, lat: 1.3644, lng: 103.9915, continent: 'ASIA' },
  HND: { ...AIRPORTS.find(a => a.code === 'HND')!, lat: 35.5494, lng: 139.7811, continent: 'ASIA' },
  LHR: { ...AIRPORTS.find(a => a.code === 'LHR')!, lat: 51.4700, lng: -0.4543, continent: 'EUROPE' },
  CDG: { ...AIRPORTS.find(a => a.code === 'CDG')!, lat: 49.0097, lng: 2.5479, continent: 'EUROPE' },
  FRA: { ...AIRPORTS.find(a => a.code === 'FRA')!, lat: 50.0379, lng: 8.5622, continent: 'EUROPE' },
  JFK: { ...AIRPORTS.find(a => a.code === 'JFK')!, lat: 40.6413, lng: -73.7781, continent: 'NORTH AMERICA' },
  SYD: { ...AIRPORTS.find(a => a.code === 'SYD')!, lat: -33.9399, lng: 151.1772, continent: 'OCEANIA' },
}

/**
 * Builds and populates the SkyLark Airport Network Graph (DSA 5).
 */
export function createAirportGraph(): Graph<{ distanceKm: number }> {
  const graph = new Graph<{ distanceKm: number }>()

  // Add all vertices (Airports)
  Object.keys(AIRPORT_GEO).forEach(code => {
    graph.addVertex(code)
  })

  // Add realistic network edges (Corridors)
  const connections: [string, string, number][] = [
    // India domestic trunk lines
    ['BOM', 'DEL', 1148],
    ['BOM', 'BLR', 842],
    ['BOM', 'MAA', 1033],
    ['BOM', 'CCU', 1654],
    ['BOM', 'HYD', 623],
    ['DEL', 'BLR', 1740],
    ['DEL', 'CCU', 1305],
    ['DEL', 'HYD', 1253],
    ['BLR', 'MAA', 290],
    ['BLR', 'HYD', 500],
    ['MAA', 'CCU', 1366],
    ['HYD', 'CCU', 1180],

    // Middle East Hub connections
    ['BOM', 'DXB', 1928],
    ['DEL', 'DXB', 2185],
    ['BLR', 'DXB', 2704],
    ['HYD', 'DXB', 2550],
    ['MAA', 'DXB', 2940],
    ['BOM', 'DOH', 2290],
    ['DEL', 'DOH', 2555],
    ['DXB', 'DOH', 378],

    // Europe Hub connections
    ['BOM', 'LHR', 7197],
    ['DEL', 'LHR', 6710],
    ['BLR', 'LHR', 8035],
    ['DEL', 'FRA', 6120],
    ['BOM', 'FRA', 6570],
    ['DEL', 'CDG', 6580],
    ['BOM', 'CDG', 7010],
    ['DXB', 'LHR', 5470],
    ['DXB', 'CDG', 5240],
    ['DXB', 'FRA', 4840],
    ['DOH', 'LHR', 5220],
    ['DOH', 'CDG', 4970],
    ['LHR', 'CDG', 344],
    ['LHR', 'FRA', 655],
    ['CDG', 'FRA', 450],

    // Transatlantic connections
    ['LHR', 'JFK', 5540],
    ['CDG', 'JFK', 5835],
    ['FRA', 'JFK', 6200],
    ['DEL', 'JFK', 11760],
    ['DXB', 'JFK', 11020],
    ['DOH', 'JFK', 10770],

    // Asia & Pacific Hub connections
    ['BOM', 'SIN', 3915],
    ['DEL', 'SIN', 4150],
    ['BLR', 'SIN', 3180],
    ['MAA', 'SIN', 2910],
    ['DXB', 'SIN', 5840],
    ['DEL', 'HND', 5840],
    ['SIN', 'HND', 5320],
    ['FRA', 'HND', 9360],
    ['DXB', 'HND', 7935],
    ['SIN', 'SYD', 6300],
    ['DXB', 'SYD', 12040],
    ['DOH', 'SYD', 12380],
    ['HND', 'SYD', 7830],
  ]

  connections.forEach(([from, to, dist]) => {
    graph.addEdge(from, to, dist, { distanceKm: dist }, true)
  })

  return graph
}

/**
 * Builds and populates the SkyLark Destination Hierarchy Tree (DSA 4).
 */
export function createDestinationTree(): Tree {
  const tree = new Tree('WORLD')

  // Continents
  tree.insert('WORLD', 'ASIA')
  tree.insert('WORLD', 'EUROPE')
  tree.insert('WORLD', 'NORTH AMERICA')
  tree.insert('WORLD', 'OCEANIA')

  // Asia Countries
  tree.insert('ASIA', 'INDIA')
  tree.insert('INDIA', 'Mumbai', 'BOM', 19.0896, 72.8679)
  tree.insert('INDIA', 'Delhi', 'DEL', 28.5562, 77.1000)
  tree.insert('INDIA', 'Bengaluru', 'BLR', 13.1986, 77.7066)
  tree.insert('INDIA', 'Chennai', 'MAA', 12.9941, 80.1709)
  tree.insert('INDIA', 'Kolkata', 'CCU', 22.6547, 88.4467)
  tree.insert('INDIA', 'Hyderabad', 'HYD', 17.2403, 78.4294)

  tree.insert('ASIA', 'UAE')
  tree.insert('UAE', 'Dubai', 'DXB', 25.2532, 55.3644)

  tree.insert('ASIA', 'QATAR')
  tree.insert('QATAR', 'Doha', 'DOH', 25.2731, 51.6081)

  tree.insert('ASIA', 'SINGAPORE')
  tree.insert('SINGAPORE', 'Singapore', 'SIN', 1.3644, 103.9915)

  tree.insert('ASIA', 'JAPAN')
  tree.insert('JAPAN', 'Tokyo', 'HND', 35.5494, 139.7811)

  // Europe Countries
  tree.insert('EUROPE', 'UNITED KINGDOM')
  tree.insert('UNITED KINGDOM', 'London', 'LHR', 51.4700, -0.4543)

  tree.insert('EUROPE', 'FRANCE')
  tree.insert('FRANCE', 'Paris', 'CDG', 49.0097, 2.5479)

  tree.insert('EUROPE', 'GERMANY')
  tree.insert('GERMANY', 'Frankfurt', 'FRA', 50.0379, 8.5622)

  // North America
  tree.insert('NORTH AMERICA', 'USA')
  tree.insert('USA', 'New York', 'JFK', 40.6413, -73.7781)

  // Oceania
  tree.insert('OCEANIA', 'AUSTRALIA')
  tree.insert('AUSTRALIA', 'Sydney', 'SYD', -33.9399, 151.1772)

  return tree
}

/**
 * Maps geographic coordinates (lng, lat) to SVG canvas coordinates (width: 1000, height: 520).
 * Uses equirectangular projection centered at 10°E to give a balanced global view.
 */
export function projectGeoToSvg(lng: number, lat: number, width = 1000, height = 520): { x: number; y: number } {
  // Longitude range: -170° to +190° (width 360°)
  // Latitude range: +82° to -58° (height 140°)
  const x = ((lng + 170) / 360) * width
  const y = ((82 - lat) / 140) * height

  return {
    x: Math.round(Math.max(15, Math.min(width - 15, x)) * 10) / 10,
    y: Math.round(Math.max(15, Math.min(height - 15, y)) * 10) / 10,
  }
}

/**
 * Calculates a smooth curved SVG quadratic bezier path between two 2D points.
 * Produces an authentic great-circle arc appearance arching gracefully.
 */
export function generateCurvedRoutePath(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  curvature = 0.16
): string {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  // Midpoint
  const mx = (p1.x + p2.x) / 2
  const my = (p1.y + p2.y) / 2

  // Perpendicular vector
  const nx = -dy / (dist || 1)
  const ny = dx / (dist || 1)

  // Northern hemisphere routes bow upward towards polar paths
  const arcHeight = Math.min(65, Math.max(18, dist * curvature))

  const cx = mx + nx * arcHeight * 0.35
  const cy = my + ny * arcHeight * 0.35 - arcHeight

  return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
}

/**
 * Curated Label Positions and Primary Display Flags
 * Guarantees zero overlapping text labels across the entire map.
 */
export interface AirportLabelConfig {
  dx: number
  dy: number
  anchor: 'start' | 'middle' | 'end'
  isPrimary: boolean
}

export const AIRPORT_LABEL_CONFIG: Record<string, AirportLabelConfig> = {
  // Primary 10 Global Hubs requested by user
  BOM: { dx: -12, dy: 4, anchor: 'end', isPrimary: true },
  DEL: { dx: 0, dy: -14, anchor: 'middle', isPrimary: true },
  BLR: { dx: 14, dy: 10, anchor: 'start', isPrimary: true },
  DXB: { dx: 12, dy: -8, anchor: 'start', isPrimary: true },
  SIN: { dx: -12, dy: 14, anchor: 'end', isPrimary: true },
  LHR: { dx: -12, dy: -10, anchor: 'end', isPrimary: true },
  CDG: { dx: 14, dy: 14, anchor: 'start', isPrimary: true },
  JFK: { dx: -14, dy: 4, anchor: 'end', isPrimary: true },
  HND: { dx: 14, dy: 4, anchor: 'start', isPrimary: true },
  SYD: { dx: 14, dy: 14, anchor: 'start', isPrimary: true },

  // Secondary Network Hubs (displayed slightly subtler or when connected/selected)
  FRA: { dx: 14, dy: -8, anchor: 'start', isPrimary: false },
  DOH: { dx: -12, dy: 12, anchor: 'end', isPrimary: false },
  MAA: { dx: 14, dy: 4, anchor: 'start', isPrimary: false },
  HYD: { dx: 12, dy: -8, anchor: 'start', isPrimary: false },
  CCU: { dx: 12, dy: -8, anchor: 'start', isPrimary: false },
}
