import { MiddlewareFn, Context } from 'grammy';
import { ApiError } from '../../core/coreClient';
import { commonMessages } from '../../ui/messages/common';

export const errorHandlerMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.error('Error in middleware:', error);

    let message = commonMessages.error.generic;

    if (error && typeof error === 'object' && 'type' in error) {
      const apiError = error as ApiError;

      switch (apiError.type) {
        case 'KYC_VERIFICATION_REQUIRED':
          message = commonMessages.error.kycRequired;
          break;
        case 'USER_ACCOUNT_BLOCKED':
          message = commonMessages.error.userBlocked;
          break;
        case 'NOT_FOUND':
          message = commonMessages.error.notFound;
          break;
        case 'ROLE_REQUIRED':
        case 'AUTHENTICATION_REQUIRED':
          message = commonMessages.error.unauthorized;
          break;
        default:
          message = apiError.message || commonMessages.error.generic;
      }
    }

    try {
      await ctx.reply(message);
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
};

