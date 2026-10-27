/**
 * SkyLark — DSA 2: QUEUE (FIFO)
 * Manual Queue implementation for flight search request processing.
 *
 * Methods:
 *  - enqueue(item: T): void
 *  - dequeue(): T | undefined
 *  - peek(): T | undefined
 *  - isEmpty(): boolean
 *  - size(): number
 *  - toArray(): T[]
 *  - clear(): void
 */

export class Queue<T> {
  private items: T[] = [];

  /**
   * Enqueue: Adds an item to the back of the queue.
   * Time Complexity: O(1)
   */
  enqueue(item: T): void {
    this.items.push(item);
  }

  /**
   * Dequeue: Removes and returns the item from the front of the queue.
   * Time Complexity: O(n)
   */
  dequeue(): T | undefined {
    return this.items.shift();
  }

  /**
   * Peek: Returns the item at the front of the queue without removing it.
   * Time Complexity: O(1)
   */
  peek(): T | undefined {
    if (this.isEmpty()) return undefined;
    return this.items[0];
  }

  /**
   * IsEmpty: Returns true if the queue has no elements.
   * Time Complexity: O(1)
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Size: Returns the current number of elements in the queue.
   * Time Complexity: O(1)
   */
  size(): number {
    return this.items.length;
  }

  /**
   * ToArray: Returns a copy of the queued elements in FIFO order.
   */
  toArray(): T[] {
    return [...this.items];
  }

  /**
   * Clear: Empties the queue.
   */
  clear(): void {
    this.items = [];
  }
}
