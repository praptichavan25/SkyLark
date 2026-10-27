/**
 * SkyLark — DSA: Queue (FIFO)
 * Manual TypeScript implementation of a First-In, First-Out Queue.
 *
 * Used for processing flight search requests sequentially in Screen 4.
 *
 * Methods:
 *   - enqueue(item: T): void      — Adds an item to the back of the queue (O(1))
 *   - dequeue(): T | undefined    — Removes and returns the item from the front (O(n) / O(1))
 *   - peek(): T | undefined       — Returns the front item without removing it (O(1))
 *   - isEmpty(): boolean          — Checks whether the queue is empty (O(1))
 *   - size(): number              — Returns current number of queued elements (O(1))
 *   - toArray(): T[]              — Returns an array representation of the queue (O(n))
 *   - clear(): void               — Empties all items from the queue (O(1))
 */

export interface QueueItem<T> {
  value: T
  timestamp: number
  id: string
}

export class Queue<T> {
  private items: T[] = []

  /**
   * Enqueue: Adds an item to the tail (end) of the queue.
   * Time Complexity: O(1)
   */
  enqueue(item: T): void {
    this.items.push(item)
  }

  /**
   * Dequeue: Removes and returns the item at the head (front) of the queue.
   * Time Complexity: O(n) with array shift, perfectly optimal for interactive flight batches.
   */
  dequeue(): T | undefined {
    return this.items.shift()
  }

  /**
   * Peek: Returns the front item without removing it.
   * Time Complexity: O(1)
   */
  peek(): T | undefined {
    return this.items[0]
  }

  /**
   * IsEmpty: True if no elements remain in the queue.
   * Time Complexity: O(1)
   */
  isEmpty(): boolean {
    return this.items.length === 0
  }

  /**
   * Size: Returns the number of items currently waiting.
   * Time Complexity: O(1)
   */
  size(): number {
    return this.items.length
  }

  /**
   * ToArray: Returns a shallow copy array of all queued items in FIFO order.
   * Time Complexity: O(n)
   */
  toArray(): T[] {
    return [...this.items]
  }

  /**
   * Clear: Resets the queue to an empty state.
   */
  clear(): void {
    this.items = []
  }
}
