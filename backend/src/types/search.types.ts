export interface SearchQuery {
  from: string;
  to: string;
  date: string;
  sortBy?: 'price' | 'departure' | 'duration';
  airline?: string;
  stops?: number;
}

export interface RecentSearch {
  from: string;
  to: string;
  date: string;
  timestamp: number;
}
