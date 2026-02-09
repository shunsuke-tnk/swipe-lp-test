import { Redis } from '@upstash/redis';

// Lazy-initialized Redis client
let _redis: Redis | null = null;

function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error('Upstash Redis environment variables not configured');
    }
    _redis = new Redis({ url, token });
  }
  return _redis;
}

// Export getter for redis client
export const redis = {
  get client() {
    return getRedis();
  },
  pipeline() {
    return getRedis().pipeline();
  },
  async smembers(key: string) {
    return getRedis().smembers(key);
  },
  async scard(key: string) {
    return getRedis().scard(key);
  },
  async get<T>(key: string): Promise<T | null> {
    return getRedis().get<T>(key);
  },
  async set(key: string, value: unknown, options?: { ex: number }) {
    return getRedis().set(key, value, options);
  },
};

// Key patterns
export const REDIS_KEYS = {
  // Real-time visitors (SET with TTL)
  realtimeVisitors: 'realtime:visitors',
  // Per-slide visitors
  slideVisitors: (slideId: string) => `realtime:slide:${slideId}`,
  // Session data (JSON with TTL)
  session: (visitorId: string) => `session:${visitorId}`,
  // Daily stats cache
  dailyStats: (date: string) => `stats:daily:${date}`,
} as const;

// TTL values (in seconds)
export const TTL = {
  realtimeVisitor: 60 * 5, // 5 minutes
  slideVisitor: 60, // 1 minute
  session: 60 * 30, // 30 minutes
  dailyStats: 60 * 60, // 1 hour
} as const;

// Real-time tracking functions
export async function trackRealtimeVisitor(visitorId: string, slideId: string) {
  const pipeline = redis.pipeline();

  // Add to global visitors set
  pipeline.sadd(REDIS_KEYS.realtimeVisitors, visitorId);
  pipeline.expire(REDIS_KEYS.realtimeVisitors, TTL.realtimeVisitor);

  // Add to slide-specific set
  pipeline.sadd(REDIS_KEYS.slideVisitors(slideId), visitorId);
  pipeline.expire(REDIS_KEYS.slideVisitors(slideId), TTL.slideVisitor);

  await pipeline.exec();
}

export async function getRealtimeStats() {
  const visitors = await redis.smembers(REDIS_KEYS.realtimeVisitors);
  return {
    currentVisitors: visitors.length,
    lastUpdated: Date.now(),
  };
}

export async function getSlideRealtimeStats(slideIds: string[]) {
  const breakdown: Record<string, number> = {};

  for (const slideId of slideIds) {
    const count = await redis.scard(REDIS_KEYS.slideVisitors(slideId));
    if (count > 0) {
      breakdown[slideId] = count;
    }
  }

  return breakdown;
}

// Session management
export interface SessionCache {
  sessionId: string;
  currentSlide: string;
  startedAt: number;
  lastActive: number;
  slidesViewed: string[];
}

export async function getSessionCache(visitorId: string): Promise<SessionCache | null> {
  return await redis.get<SessionCache>(REDIS_KEYS.session(visitorId));
}

export async function setSessionCache(visitorId: string, session: SessionCache) {
  await redis.set(REDIS_KEYS.session(visitorId), session, {
    ex: TTL.session,
  });
}

export async function updateSessionSlide(visitorId: string, slideId: string) {
  const session = await getSessionCache(visitorId);
  if (session) {
    session.currentSlide = slideId;
    session.lastActive = Date.now();
    if (!session.slidesViewed.includes(slideId)) {
      session.slidesViewed.push(slideId);
    }
    await setSessionCache(visitorId, session);
  }
}
