/**
 * SkyLark — DSA 5: GRAPH
 * Manual Graph implementation representing the airport network and flight connections.
 *
 *  AIRPORT           = VERTEX
 *  FLIGHT CONNECTION = EDGE
 *
 * Methods:
 *  - addVertex(vertex: string): void
 *  - addEdge(from: string, to: string, weight?: number, metadata?: T): void
 *  - getNeighbors(vertex: string): Edge<T>[]
 *  - hasVertex(vertex: string): boolean
 *  - getVertices(): string[]
 *  - getEdges(): GraphEdgeOutput[]
 */

export interface Edge<T = any> {
  to: string;
  weight?: number;
  metadata?: T;
}

export interface GraphEdgeOutput {
  from: string;
  to: string;
  weight?: number;
}

export class Graph<T = any> {
  private adjacencyList: Map<string, Edge<T>[]> = new Map();

  /**
   * AddVertex: Adds an airport vertex to the graph if it doesn't already exist.
   * Time Complexity: O(1)
   */
  addVertex(vertex: string): void {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, []);
    }
  }

  /**
   * AddEdge: Adds a directed flight connection between two airports.
   * Time Complexity: O(1)
   */
  addEdge(from: string, to: string, weight?: number, metadata?: T): void {
    this.addVertex(from);
    this.addVertex(to);

    const edges = this.adjacencyList.get(from)!;
    const existing = edges.find(e => e.to === to);
    if (!existing) {
      edges.push({ to, weight, metadata });
    }
  }

  /**
   * GetNeighbors: Returns all destination airports directly reachable from this airport.
   * Time Complexity: O(1)
   */
  getNeighbors(vertex: string): Edge<T>[] {
    return this.adjacencyList.get(vertex) || [];
  }

  /**
   * HasVertex: Checks if an airport vertex exists in the network.
   * Time Complexity: O(1)
   */
  hasVertex(vertex: string): boolean {
    return this.adjacencyList.has(vertex);
  }

  /**
   * GetVertices: Returns all registered airport vertices.
   * Time Complexity: O(V)
   */
  getVertices(): string[] {
    return Array.from(this.adjacencyList.keys());
  }

  /**
   * GetEdges: Returns all directed flight connection edges in the graph.
   * Time Complexity: O(V + E)
   */
  getEdges(): GraphEdgeOutput[] {
    const edgeList: GraphEdgeOutput[] = [];
    for (const [from, edges] of this.adjacencyList.entries()) {
      for (const edge of edges) {
        edgeList.push({
          from,
          to: edge.to,
          weight: edge.weight,
        });
      }
    }
    return edgeList;
  }
}
