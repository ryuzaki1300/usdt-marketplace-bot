import { Context, SessionFlavor } from "grammy";
import { SessionData } from "../../types/session";
import { ApiError } from "../../core/coreClient";
import { env } from "../../config/env";

type MyContext = Context & SessionFlavor<SessionData>;

/**
 * Check if an error is a Telegram API error indicating bot was blocked or chat not found
 */
export function isTelegramBlockedError(error: any): boolean {
  return (
    error?.error_code === 403 ||
    error?.description?.includes("bot was blocked") ||
    error?.description?.includes("chat not found") ||
    error?.description?.includes("Forbidden: bot was blocked by the user") ||
    error?.description?.includes("Forbidden: chat not found")
  );
}

/**
 * Check if an error is a Telegram API error indicating message is too old to edit
 */
export function isMessageTooOldError(error: any): boolean {
  return (
    error?.error_code === 400 &&
    (error?.description?.includes("message is not modified") ||
      error?.description?.includes("message to edit not found") ||
      error?.description?.includes("message can't be edited"))
  );
}

/**
 * Check if an error is an API error from our core service
 */
export function isApiError(error: any): error is ApiError {
  return (
    error &&
    typeof error === "object" &&
    "statusCode" in error &&
    "message" in error &&
    "type" in error
  );
}

/**
 * Check if an error is a permission error (403)
 */
export function isPermissionError(error: any): boolean {
  return isApiError(error) && error.statusCode === 403;
}

/**
 * Check if an error is a not found error (404)
 */
export function isNotFoundError(error: any): boolean {
  return isApiError(error) && error.statusCode === 404;
}

/**
 * Check if an error is a validation/conflict error (400, 409, 422)
 */
export function isValidationError(error: any): boolean {
  return (
    isApiError(error) &&
    (error.statusCode === 400 || error.statusCode === 409 || error.statusCode === 422)
  );
}

/**
 * Get user-friendly error message from any error
 */
export function getErrorMessage(error: any, defaultMessage?: string): string {
  if (isApiError(error)) {
    return error.message || defaultMessage || "خطایی رخ داد. لطفاً بعداً دوباره تلاش کنید.";
  }
  if (error instanceof Error) {
    return error.message || defaultMessage || "خطای غیرمنتظره‌ای رخ داد. لطفاً بعداً دوباره تلاش کنید.";
  }
  return defaultMessage || "خطایی رخ داد. لطفاً بعداً دوباره تلاش کنید.";
}

/**
 * Safely answer a callback query (handles cases where it's not a callback query)
 */
export async function safeAnswerCallbackQuery(
  ctx: MyContext,
  options?: {
    text?: string;
    show_alert?: boolean;
    url?: string;
  }
): Promise<boolean> {
  try {
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery(options);
      return true;
    }
    return false;
  } catch (error) {
    // Not a callback query or already answered, ignore
    return false;
  }
}

/**
 * Safely edit a message, falling back to sending a new message if edit fails
 */
export async function safeEditOrReply(
  ctx: MyContext,
  text: string,
  options?: {
    reply_markup?: any;
    parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
  }
): Promise<void> {
  try {
    // Try to edit if we have a callback query message
    if (ctx.callbackQuery?.message && "text" in ctx.callbackQuery.message) {
      await ctx.editMessageText(text, options);
      return;
    }
  } catch (error: any) {
    // If edit fails (message too old, etc.), fall back to reply
    if (!isMessageTooOldError(error)) {
      // Log unexpected errors
      console.error("Unexpected error editing message:", error);
    }
  }

  // Fall back to sending a new message
  await ctx.reply(text, options);
}

/**
 * Safely send a message to a user, handling blocked bot errors
 */
export async function safeSendMessage(
  ctx: MyContext,
  chatId: number,
  text: string,
  options?: {
    reply_markup?: any;
    parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
  }
): Promise<boolean> {
  try {
    await ctx.api.sendMessage(chatId, text, options);
    return true;
  } catch (error: any) {
    if (isTelegramBlockedError(error)) {
      // User blocked the bot, log but don't throw
      console.log(`User ${chatId} has blocked the bot`);
      return false;
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Safely send a message with fallback for blocked users
 * If sending fails due to blocked bot, tries to answer callback query with URL
 */
export async function safeSendMessageWithFallback(
  ctx: MyContext,
  chatId: number,
  text: string,
  options?: {
    reply_markup?: any;
    parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
    fallbackUrl?: string;
    fallbackText?: string;
  }
): Promise<boolean> {
  try {
    await ctx.api.sendMessage(chatId, text, options);
    return true;
  } catch (error: any) {
    if (isTelegramBlockedError(error)) {
      // Try to answer callback query with URL if available
      if (options?.fallbackUrl && ctx.callbackQuery) {
        try {
          await ctx.answerCallbackQuery({
            text: options.fallbackText || "لطفاً ابتدا ربات را در چت خصوصی شروع کنید.",
            url: options.fallbackUrl,
          });
        } catch {
          // If callback query answer fails, just log
          console.log(`User ${chatId} has blocked the bot and callback query failed`);
        }
      } else {
        console.log(`User ${chatId} has blocked the bot`);
      }
      return false;
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Safely edit a channel message
 */
export async function safeEditChannelMessage(
  ctx: MyContext,
  chatId: number | string,
  messageId: number,
  text: string,
  options?: {
    reply_markup?: any;
  }
): Promise<boolean> {
  try {
    await ctx.api.editMessageText(chatId, messageId, text, options);
    return true;
  } catch (error: any) {
    // Log but don't throw - channel message editing failures shouldn't break the flow
    console.error("Failed to edit channel message:", error);
    return false;
  }
}

/**
 * Validate user ID and return it, or throw a user-friendly error
 */
export function requireUserId(ctx: MyContext): number {
  const userId = ctx.from?.id;
  if (!userId) {
    throw new Error("شناسایی کاربر امکان‌پذیر نیست.");
  }
  return userId;
}

/**
 * Execute a function with automatic error handling for common Telegram operations
 * Catches errors and provides appropriate user feedback
 */
export async function withErrorHandling<T>(
  ctx: MyContext,
  fn: () => Promise<T>,
  options?: {
    errorMessage?: string;
    onError?: (error: any) => Promise<void> | void;
    fallbackKeyboard?: any;
  }
): Promise<T | null> {
  try {
    return await fn();
  } catch (error: any) {
    // Call custom error handler if provided
    if (options?.onError) {
      await options.onError(error);
      return null;
    }

    // Default error handling
    const errorMessage = getErrorMessage(error, options?.errorMessage);

    // Try to answer callback query if it exists
    await safeAnswerCallbackQuery(ctx, {
      text: errorMessage,
      show_alert: true,
    });

    // Send error message
    try {
      await safeEditOrReply(ctx, errorMessage, {
        reply_markup: options?.fallbackKeyboard,
      });
    } catch (replyError) {
      // If even error reply fails, log it
      console.error("Failed to send error message:", replyError);
    }

    return null;
  }
}

/**
 * Execute a function that might fail silently (for non-critical operations)
 * Logs errors but doesn't show them to the user
 */
export async function silentErrorHandling<T>(
  fn: () => Promise<T>,
  errorContext?: string
): Promise<T | null> {
  try {
    return await fn();
  } catch (error: any) {
    if (errorContext) {
      console.error(`Error in ${errorContext}:`, error);
    } else {
      console.error("Silent error:", error);
    }
    return null;
  }
}

/**
 * Wrap an async handler function with automatic error handling
 * This can be used to wrap handler functions to automatically catch and handle errors
 */
export function wrapHandler<T extends any[]>(
  handler: (ctx: MyContext, ...args: T) => Promise<void>
): (ctx: MyContext, ...args: T) => Promise<void> {
  return async (ctx: MyContext, ...args: T) => {
    await withErrorHandling(ctx, async () => {
      await handler(ctx, ...args);
    });
  };
}

