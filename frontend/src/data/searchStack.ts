/**
 * SkyLark — DSA: Stack (LIFO)
 * Used for Recent Searches in Screen 3.
 *
 * The Stack stores recent flight search queries and surfaces them
 * in reverse chronological order (newest first). The UI never
 * exposes the term "Stack" to the user — it shows "RECENT SEARCHES".
 *
 * Methods: push(), pop(), peek(), isEmpty(), size(), toArray(), clear()
 */

export interface RecentSearch {
  from: string   // IATA code
  to: string     // IATA code
  date: string   // ISO date string "YYYY-MM-DD"
  displayDate: string // Display format "DD MON YYYY"
  timestamp: number
}

const STORAGE_KEY = 'skylark_recent_searches'
const MAX_SIZE = 8

/**
 * Manual Stack implementation (LIFO).
 * Uses an internal array — newest items are at the front (index 0).
 * No external library is used.
 */
export class SearchStack {
  private items: RecentSearch[] = []
  private maxSize: number

  constructor(maxSize: number = MAX_SIZE) {
    this.maxSize = maxSize
    this.loadFromStorage()
  }

  /** Push a new search onto the top of the stack — O(n) due to deduplication */
  push(item: RecentSearch): void {
    // Remove any existing duplicate (same from/to pair)
    this.items = this.items.filter(
      s => !(s.from === item.from && s.to === item.to)
    )
    // Add to front (top of stack)
    this.items.unshift(item)
    // Enforce max size
    if (this.items.length > this.maxSize) {
      this.items = this.items.slice(0, this.maxSize)
    }
    this.saveToStorage()
  }

  /** Remove and return the top item — O(1) amortized */
  pop(): RecentSearch | undefined {
    const item = this.items.shift()
    if (item) this.saveToStorage()
    return item
  }

  /** Look at the top item without removing it — O(1) */
  peek(): RecentSearch | undefined {
    return this.items[0]
  }

  /** Check if the stack is empty — O(1) */
  isEmpty(): boolean {
    return this.items.length === 0
  }

  /** Number of items in the stack — O(1) */
  size(): number {
    return this.items.length
  }

  /** Return all items as an array (top to bottom) — O(n) */
  toArray(): RecentSearch[] {
    return [...this.items]
  }

  /** Clear the stack */
  clear(): void {
    this.items = []
    this.saveToStorage()
  }

  /** Persist to localStorage */
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items))
    } catch {
      // Storage unavailable — silently continue
    }
  }

  /** Restore from localStorage */
  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          this.items = parsed.slice(0, this.maxSize)
        }
      }
    } catch {
      // Storage unavailable or corrupt — start fresh
      this.items = []
    }
  }
}

/** Seed data for initial recent searches */
export const SEED_RECENT: RecentSearch[] = [
  { from: 'BOM', to: 'DEL', date: '2026-10-12', displayDate: '12 OCT 2026', timestamp: Date.now() - 3600000 },
  { from: 'DEL', to: 'DXB', date: '2026-11-05', displayDate: '05 NOV 2026', timestamp: Date.now() - 7200000 },
  { from: 'BOM', to: 'LHR', date: '2026-12-20', displayDate: '20 DEC 2026', timestamp: Date.now() - 10800000 },
]
