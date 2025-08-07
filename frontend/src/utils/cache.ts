// Frontend caching system for BetterBooks
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  persist?: boolean; // Whether to persist to localStorage
  key?: string; // Custom cache key
}

class CacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly PREFIX = 'betterbooks_cache_';

  // Get cached data
  get<T>(key: string): T | null {
    const fullKey = this.PREFIX + key;
    
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(fullKey);
    if (memoryEntry && this.isValid(memoryEntry)) {
      return memoryEntry.data;
    }

    // Check localStorage if memory cache miss
    try {
      const stored = localStorage.getItem(fullKey);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (this.isValid(entry)) {
          // Restore to memory cache
          this.memoryCache.set(fullKey, entry);
          return entry.data;
        } else {
          // Remove expired entry
          localStorage.removeItem(fullKey);
        }
      }
    } catch (error) {
      console.warn('Cache read error:', error);
    }

    return null;
  }

  // Set cached data
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const fullKey = this.PREFIX + key;
    const ttl = options.ttl || this.DEFAULT_TTL;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    // Store in memory cache
    this.memoryCache.set(fullKey, entry);

    // Store in localStorage if requested
    if (options.persist) {
      try {
        localStorage.setItem(fullKey, JSON.stringify(entry));
      } catch (error) {
        console.warn('Cache write error:', error);
      }
    }
  }

  // Check if cache entry is still valid
  private isValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  // Invalidate specific cache entry
  invalidate(key: string): void {
    const fullKey = this.PREFIX + key;
    this.memoryCache.delete(fullKey);
    try {
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.warn('Cache invalidation error:', error);
    }
  }

  // Invalidate all cache entries matching a pattern
  invalidatePattern(pattern: string): void {
    const fullPattern = this.PREFIX + pattern;
    
    // Clear memory cache entries
    for (const key of this.memoryCache.keys()) {
      if (key.includes(fullPattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear localStorage entries
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.includes(fullPattern)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Cache pattern invalidation error:', error);
    }
  }

  // Clear all cache
  clear(): void {
    this.memoryCache.clear();
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  // Get cache statistics
  getStats(): { memorySize: number; localStorageSize: number } {
    let localStorageSize = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            localStorageSize += value.length;
          }
        }
      }
    } catch (error) {
      console.warn('Cache stats error:', error);
    }

    return {
      memorySize: this.memoryCache.size,
      localStorageSize
    };
  }
}

// Global cache instance
export const cache = new CacheManager();

// Cache keys for different data types
export const CACHE_KEYS = {
  TRANSACTIONS: 'transactions',
  ACCOUNTS: 'accounts',
  RECENT_TRANSACTIONS: 'recent_transactions',
  ACCOUNT_BALANCES: 'account_balances',
  BALANCE_SHEET: 'balance_sheet',
  INCOME_STATEMENT: 'income_statement',
  CASH_FLOW: 'cash_flow',
  GOALS: 'goals',
  SUGGESTIONS: 'suggestions',
  CATEGORY_SUGGESTIONS: 'category_suggestions',
  TRANSACTION_TYPE_SUGGESTIONS: 'transaction_type_suggestions'
} as const;

// Cache-aware API wrapper
export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Check cache first
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return Promise.resolve(cached);
  }

  // Fetch and cache
  return fetcher().then(data => {
    cache.set(key, data, options);
    return data;
  });
}

// Cache invalidation helpers
export function invalidateTransactions(): void {
  cache.invalidatePattern('transactions');
  cache.invalidate(CACHE_KEYS.RECENT_TRANSACTIONS);
  cache.invalidate(CACHE_KEYS.ACCOUNT_BALANCES);
}

export function invalidateAccounts(): void {
  cache.invalidatePattern('accounts');
  cache.invalidate(CACHE_KEYS.ACCOUNT_BALANCES);
}

export function invalidateReports(): void {
  cache.invalidate(CACHE_KEYS.BALANCE_SHEET);
  cache.invalidate(CACHE_KEYS.INCOME_STATEMENT);
  cache.invalidate(CACHE_KEYS.CASH_FLOW);
}

export function invalidateAll(): void {
  cache.clear();
}

export function invalidateSuggestions(): void {
  cache.invalidatePattern('SUGGESTIONS');
} 