import { MiddlewareFn, Context } from 'grammy';

export const loggerMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  const start = Date.now();
  const updateType = Object.keys(ctx.update)[0] || 'unknown';
  const userId = ctx.from?.id;
  const username = ctx.from?.username;

  console.log(
    `[${new Date().toISOString()}] Update: ${updateType} | User: ${userId}${username ? ` (@${username})` : ''}`
  );

  try {
    await next();
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error:`, error);
    throw error;
  } finally {
    const duration = Date.now() - start;
    if (duration > 100) {
      console.log(`[${new Date().toISOString()}] Slow update: ${duration}ms`);
    }
  }
};

