import { Bot, Context, session, SessionFlavor } from 'grammy';
import { env } from '../config/env';
import { SessionData } from '../types/session';
import { loggerMiddleware } from './middlewares/logger';
import { errorHandlerMiddleware } from './middlewares/errorHandler';
import { handleStart } from './handlers/start';

// Extend Grammy session type
type MyContext = Context & SessionFlavor<SessionData>;

export function createBot(): Bot<MyContext> {
  const bot = new Bot<MyContext>(env.BOT_TOKEN);

  // Initialize session (in-memory, can be upgraded to Redis later)
  bot.use(
    session({
      initial: (): SessionData => ({}),
    })
  );

  // Apply middlewares in order
  bot.use(loggerMiddleware);
  bot.use(errorHandlerMiddleware);

  // Register command handlers
  bot.command('start', handleStart);

  // Register callback query handlers (for inline keyboards)
  // These will be implemented in future tasks
  bot.callbackQuery('menu:my_orders', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText('My Orders feature coming soon!');
  });

  bot.callbackQuery('menu:my_offers', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText('My Offers feature coming soon!');
  });

  bot.callbackQuery('menu:new_order', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText('New Order feature coming soon!');
  });

  bot.callbackQuery('menu:profile', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText('Profile feature coming soon!');
  });

  bot.callbackQuery('menu:admin', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText('Admin Menu feature coming soon!');
  });

  return bot;
}

