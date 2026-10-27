/**
 * SkyLark — DSA 1: STACK (LIFO)
 * Manual Stack implementation for recent airport/route views and navigation history.
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
  private items: T[] = []

  /**
   * Push: Inserts an element to the top of the stack.
   * Time Complexity: O(1)
   */
  push(item: T): void {
    this.items.push(item)
  }

  /**
   * Pop: Removes and returns the element from the top of the stack.
   * Time Complexity: O(1)
   */
  pop(): T | undefined {
    return this.items.pop()
  }

  /**
   * Peek: Returns the top element without removing it.
   * Time Complexity: O(1)
   */
  peek(): T | undefined {
    return this.items[this.items.length - 1]
  }

  /**
   * IsEmpty: True if stack has no elements.
   * Time Complexity: O(1)
   */
  isEmpty(): boolean {
    return this.items.length === 0
  }

  /**
   * Size: Returns current number of elements in the stack.
   * Time Complexity: O(1)
   */
  size(): number {
    return this.items.length
  }

  /**
   * ToArray: Returns a copy of the stack elements from top to bottom.
   * Time Complexity: O(n)
   */
  toArray(): T[] {
    return [...this.items].reverse()
  }

  /**
   * Clear: Clears all items in the stack.
   * Time Complexity: O(1)
   */
  clear(): void {
    this.items = []
  }
}
