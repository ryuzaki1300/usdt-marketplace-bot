import { MiddlewareFn, Context } from "grammy";
import { coreClient } from "../../core/coreClient";

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

  // Fetch user data from API
  const userData = await coreClient.getUserProfile(userId);

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
