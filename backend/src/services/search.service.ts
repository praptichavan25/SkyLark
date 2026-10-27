import { Stack } from '../dsa/Stack';
import { RecentSearch, SearchQuery } from '../types/search.types';

class SearchService {
  /**
   * ── DSA 1: STACK ─────────────────────────────────────────────────────────
   * Stores the user's latest 5 flight searches using a manual LIFO Stack.
   */
  private recentSearchesStack: Stack<RecentSearch> = new Stack<RecentSearch>(5);

  /**
   * Add a search query to the recent searches stack.
   * Uses stack.push() to place search on top of stack.
   */
  addRecentSearch(query: { from: string; to: string; date: string }): RecentSearch {
    const searchRecord: RecentSearch = {
      from: query.from.toUpperCase(),
      to: query.to.toUpperCase(),
      date: query.date,
      timestamp: Date.now(),
    };

    this.recentSearchesStack.push(searchRecord);
    return searchRecord;
  }

  /**
   * Retrieve recent searches.
   * Returns items in LIFO order (latest search on top).
   */
  getRecentSearches(): RecentSearch[] {
    return this.recentSearchesStack.toArray();
  }

  /**
   * Get the most recent search without removing it.
   * Uses stack.peek().
   */
  getLatestSearch(): RecentSearch | undefined {
    return this.recentSearchesStack.peek();
  }

  /**
   * Clear all recent searches.
   */
  clearRecentSearches(): void {
    this.recentSearchesStack.clear();
  }

  /**
   * Get current stack size.
   */
  getRecentSearchesCount(): number {
    return this.recentSearchesStack.size();
  }
}

export const searchService = new SearchService();
