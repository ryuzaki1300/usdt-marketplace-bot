import { MiddlewareFn, Context } from 'grammy';
import { ApiError } from '../../core/coreClient';

export const errorHandlerMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.error('Error in middleware:', error);

    let message = 'خطایی رخ داد. لطفاً بعداً دوباره تلاش کنید.';

    // Show server error message directly to user
    if (error && typeof error === 'object' && 'message' in error) {
      const apiError = error as ApiError;
      message = apiError.message || message;
    } else if (error instanceof Error) {
      // For non-API errors, log but show generic message
      message = 'خطای غیرمنتظره‌ای رخ داد. لطفاً بعداً دوباره تلاش کنید.';
    }

    try {
      await ctx.reply(message);
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
};

