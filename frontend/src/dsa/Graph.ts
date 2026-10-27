/**
 * SkyLark — DSA 5: GRAPH
 * Manual Graph implementation representing the airport network and flight route connections.
 *
 *  AIRPORT           = VERTEX (IATA Code)
 *  FLIGHT CONNECTION = EDGE (Direct route between two airports)
 *
 * Methods:
 *  - addVertex(vertex: string): void
 *  - addEdge(from: string, to: string, weight?: number, metadata?: T): void
 *  - getNeighbors(vertex: string): Edge<T>[]
 *  - hasVertex(vertex: string): boolean
 *  - getVertices(): string[]
 *  - getEdges(): GraphEdgeOutput[]
 *  - getConnectionCount(): number
 */

export interface Edge<T = any> {
  to: string
  weight?: number
  metadata?: T
}

export interface GraphEdgeOutput {
  from: string
  to: string
  weight?: number
}

export class Graph<T = any> {
  private adjacencyList: Map<string, Edge<T>[]> = new Map()

  /**
   * AddVertex: Adds an airport vertex to the graph if it doesn't already exist.
   * Time Complexity: O(1)
   */
  addVertex(vertex: string): void {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, [])
    }
  }

  /**
   * AddEdge: Adds a directed or bidirectional flight connection between two airports.
   * Time Complexity: O(1)
   */
  addEdge(from: string, to: string, weight?: number, metadata?: T, bidirectional = true): void {
    this.addVertex(from)
    this.addVertex(to)

    const fromEdges = this.adjacencyList.get(from)!
    if (!fromEdges.some(e => e.to === to)) {
      fromEdges.push({ to, weight, metadata })
    }

    if (bidirectional) {
      const toEdges = this.adjacencyList.get(to)!
      if (!toEdges.some(e => e.to === from)) {
        toEdges.push({ to: from, weight, metadata })
      }
    }
  }

  /**
   * GetNeighbors: Returns all destination airports directly reachable from this airport.
   * Time Complexity: O(1)
   */
  getNeighbors(vertex: string): Edge<T>[] {
    return this.adjacencyList.get(vertex) || []
  }

  /**
   * HasVertex: Checks if an airport vertex exists in the network.
   * Time Complexity: O(1)
   */
  hasVertex(vertex: string): boolean {
    return this.adjacencyList.has(vertex)
  }

  /**
   * GetVertices: Returns all registered airport vertices.
   * Time Complexity: O(V)
   */
  getVertices(): string[] {
    return Array.from(this.adjacencyList.keys())
  }

  /**
   * GetEdges: Returns all flight connection edges in the graph.
   * Time Complexity: O(V + E)
   */
  getEdges(): GraphEdgeOutput[] {
    const edgeList: GraphEdgeOutput[] = []
    const seen = new Set<string>()

    for (const [from, edges] of this.adjacencyList.entries()) {
      for (const edge of edges) {
        const key = [from, edge.to].sort().join('-')
        if (!seen.has(key)) {
          seen.add(key)
          edgeList.push({
            from,
            to: edge.to,
            weight: edge.weight,
          })
        }
      }
    }
    return edgeList
  }

  /**
   * GetConnectionCount: Returns total number of unique flight connection corridors.
   * Time Complexity: O(V + E)
   */
  getConnectionCount(): number {
    return this.getEdges().length
  }
}
