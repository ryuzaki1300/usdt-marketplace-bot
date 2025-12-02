import { MiddlewareFn, Context } from 'grammy';
import { coreClient } from '../../core/coreClient';
import { UserCache } from '../../utils/userCache';

// Cache user data for 5 minutes (300 seconds)
const userCache = new UserCache<any>(300);

/**
 * Middleware to fetch and cache user data by Telegram ID
 * Stores user data in context for use in handlers
 */
export const userDataMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  const userId = ctx.from?.id;

  // Skip if no user ID (shouldn't happen, but safety check)
  if (!userId) {
    await next();
    return;
  }

  // Check cache first
  let userData = userCache.get(userId);

  // If not in cache, fetch from API
  if (!userData) {
    try {
      userData = await coreClient.getUserProfile(userId);
      // Store in cache
      userCache.set(userId, userData);
    } catch (error) {
      // If user doesn't exist or API error, continue without user data
      // Handlers can check if userData exists
      console.warn(`Failed to fetch user data for ${userId}:`, error);
      userData = null;
    }
  }

  // Attach user data to context
  (ctx as any).userData = userData;

  await next();
};

/**
 * Helper function to get user data from context
 */
export function getUserData(ctx: Context): any | null {
  return (ctx as any).userData || null;
}

/**
 * Helper function to invalidate user cache (useful after user updates)
 */
export function invalidateUserCache(userId: number): void {
  userCache.delete(userId);
}

