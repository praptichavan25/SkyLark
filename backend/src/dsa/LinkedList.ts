/**
 * SkyLark — DSA 3: LINKED LIST
 * Manual Singly Linked List implementation to represent multi-stop flight journeys.
 *
 * Example:
 *   Mumbai → Dubai → London → NULL
 *
 * Methods:
 *  - insert(value: T): void
 *  - delete(predicate: (value: T) => boolean): boolean
 *  - find(predicate: (value: T) => boolean): T | null
 *  - traverse(): T[]
 *  - isEmpty(): boolean
 *  - size(): number
 */

export class ListNode<T> {
  value: T;
  next: ListNode<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }
}

export class LinkedList<T> {
  head: ListNode<T> | null = null;
  private count = 0;

  /**
   * Insert: Appends a new node to the end of the linked list.
   * Time Complexity: O(n)
   */
  insert(value: T): void {
    const newNode = new ListNode(value);
    if (!this.head) {
      this.head = newNode;
    } else {
      let current = this.head;
      while (current.next !== null) {
        current = current.next;
      }
      current.next = newNode;
    }
    this.count++;
  }

  /**
   * Delete: Removes the first node that matches the predicate.
   * Time Complexity: O(n)
   */
  delete(predicate: (value: T) => boolean): boolean {
    if (!this.head) return false;

    // Delete head node
    if (predicate(this.head.value)) {
      this.head = this.head.next;
      this.count--;
      return true;
    }

    // Traverse to find node to delete
    let current = this.head;
    while (current.next !== null && !predicate(current.next.value)) {
      current = current.next;
    }

    if (current.next !== null) {
      current.next = current.next.next;
      this.count--;
      return true;
    }

    return false;
  }

  /**
   * Find: Returns the first value matching the predicate.
   * Time Complexity: O(n)
   */
  find(predicate: (value: T) => boolean): T | null {
    let current = this.head;
    while (current !== null) {
      if (predicate(current.value)) {
        return current.value;
      }
      current = current.next;
    }
    return null;
  }

  /**
   * Traverse: Returns an array of all node values in order.
   * Time Complexity: O(n)
   */
  traverse(): T[] {
    const elements: T[] = [];
    let current = this.head;
    while (current !== null) {
      elements.push(current.value);
      current = current.next;
    }
    return elements;
  }

  /**
   * IsEmpty: True if list contains zero nodes.
   * Time Complexity: O(1)
   */
  isEmpty(): boolean {
    return this.head === null;
  }

  /**
   * Size: Returns current number of nodes.
   * Time Complexity: O(1)
   */
  size(): number {
    return this.count;
  }
}
