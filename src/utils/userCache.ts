/**
 * Simple in-memory cache for user data with TTL support
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class UserCache<T> {
  private cache: Map<number, CacheEntry<T>> = new Map();
  private ttl: number; // Time to live in milliseconds

  constructor(ttlSeconds: number = 300) {
    this.ttl = ttlSeconds * 1000; // Convert to milliseconds
  }

  /**
   * Get cached user data
   */
  get(userId: number): T | null {
    const entry = this.cache.get(userId);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(userId);
      return null;
    }

    return entry.data;
  }

  /**
   * Set user data in cache
   */
  set(userId: number, data: T): void {
    this.cache.set(userId, {
      data,
      expiresAt: Date.now() + this.ttl,
    });
  }

  /**
   * Remove user from cache
   */
  delete(userId: number): void {
    this.cache.delete(userId);
  }

  /**
   * Clear all expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [userId, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(userId);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

