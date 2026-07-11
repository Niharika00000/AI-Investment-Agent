import NodeCache from "node-cache";
import { logger } from "../utils/logger";

class CacheService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 3600,
      checkperiod: 600,
      useClones: true,
    });

    this.cache.on("expired", (key) => {
      logger.debug(`Cache key expired: ${key}`);
    });
  }

  get<T>(key: string): T | undefined {
    const value = this.cache.get<T>(key);
    if (value !== undefined) {
      logger.debug(`Cache HIT: ${key}`);
    } else {
      logger.debug(`Cache MISS: ${key}`);
    }
    return value;
  }

  set<T>(key: string, value: T, ttlSeconds?: number): boolean {
    const success = ttlSeconds
      ? this.cache.set(key, value, ttlSeconds)
      : this.cache.set(key, value);
    if (success) {
      logger.debug(`Cache SET: ${key} (TTL: ${ttlSeconds ?? "default"}s)`);
    }
    return success;
  }

  del(key: string | string[]): number {
    return this.cache.del(key);
  }

  flush(): void {
    this.cache.flushAll();
    logger.info("Cache flushed");
  }

  stats() {
    return this.cache.getStats();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get or set: returns cached value or computes and caches it
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const fresh = await fetcher();
    this.set(key, fresh, ttlSeconds);
    return fresh;
  }
}

// Singleton
export const cacheService = new CacheService();
