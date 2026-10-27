/**
 * SkyLark — DSA 1: STACK (LIFO)
 * Manual Stack implementation for tracking recent flight searches.
 *
 * Methods:
 *  - push(item: T): void
 *  - pop(): T | undefined
 *  - peek(): T | undefined
 *  - isEmpty(): boolean
 *  - size(): number
 *  - toArray(): T[]
 *  - clear(): void
 */

export class Stack<T> {
  private items: T[] = [];
  private capacity: number;

  constructor(capacity = 5) {
    this.capacity = capacity;
  }

  /**
   * Push an item onto the top of the stack.
   * Maintains maximum capacity by dropping oldest items if needed.
   * Time Complexity: O(1)
   */
  push(item: T): void {
    if (this.items.length >= this.capacity) {
      // Remove oldest item from bottom of stack
      this.items.shift();
    }
    this.items.push(item);
  }

  /**
   * Pop the most recent item off the top of the stack.
   * Time Complexity: O(1)
   */
  pop(): T | undefined {
    return this.items.pop();
  }

  /**
   * Peek at the item on top of the stack without removing it.
   * Time Complexity: O(1)
   */
  peek(): T | undefined {
    if (this.isEmpty()) return undefined;
    return this.items[this.items.length - 1];
  }

  /**
   * Check if stack is empty.
   * Time Complexity: O(1)
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Return number of items currently in the stack.
   * Time Complexity: O(1)
   */
  size(): number {
    return this.items.length;
  }

  /**
   * Return items in LIFO order (most recent first).
   */
  toArray(): T[] {
    return [...this.items].reverse();
  }

  /**
   * Clear all items from the stack.
   */
  clear(): void {
    this.items = [];
  }
}
