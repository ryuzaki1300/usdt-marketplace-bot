import { MiddlewareFn, Context, SessionFlavor } from 'grammy';
import { ApiError } from '../../core/coreClient';
import { SessionData } from '../../types/session';
import { 
  getErrorMessage, 
  isApiError, 
  isTelegramBlockedError,
  safeAnswerCallbackQuery,
  safeEditOrReply 
} from '../utils/errorHandling';
import { getMainMenuKeyboard } from '../../ui/keyboards/mainMenu';

type MyContext = Context & SessionFlavor<SessionData>;

export const errorHandlerMiddleware: MiddlewareFn<MyContext> = async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    // Log error for debugging
    console.error('Error in middleware:', error);

    // Get user-friendly error message
    const message = getErrorMessage(error);

    // Try to answer callback query if it exists
    await safeAnswerCallbackQuery(ctx, {
      text: message,
      show_alert: true,
    });

    // Send error message with fallback to edit or reply
    try {
      await safeEditOrReply(ctx, message, {
        reply_markup: getMainMenuKeyboard(false),
      });
    } catch (replyError) {
      // If even error reply fails, log it
      console.error('Failed to send error message:', replyError);
    }
  }
};

