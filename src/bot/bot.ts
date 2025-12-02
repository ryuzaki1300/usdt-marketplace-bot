import { Bot, Context, session, SessionFlavor } from 'grammy';
import { env } from '../config/env';
import { SessionData } from '../types/session';
import { loggerMiddleware } from './middlewares/logger';
import { errorHandlerMiddleware } from './middlewares/errorHandler';
import { handleStart } from './handlers/start';
import { handleMyOrders } from './handlers/orders';
import {
  handleOrderCreate,
  handleOrderSide,
  handleOrderAmount,
  handleOrderPrice,
  handleOrderNetwork,
  handleOrderDescription,
  handleOrderConfirm,
  handleOrderCancel,
} from './conversations/createOrder';
import { coreClient } from '../core/coreClient';
import { commonMessages } from '../ui/messages/common';
import { getMainMenuKeyboard } from '../ui/keyboards/mainMenu';

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
  bot.callbackQuery('menu:my_orders', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleMyOrders(ctx);
  });

  bot.callbackQuery('menu:my_offers', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText('قابلیت پیشنهادهای من به زودی اضافه می‌شود!');
  });

  bot.callbackQuery('menu:new_order', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleOrderCreate(ctx);
  });

  // Order creation wizard handlers
  bot.callbackQuery('order:create', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleOrderCreate(ctx);
  });

  bot.callbackQuery(/^order:side:(buy|sell)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const side = ctx.match[1] as 'buy' | 'sell';
    await handleOrderSide(ctx, side);
  });

  bot.callbackQuery(/^order:network:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const network = ctx.match[1];
    await handleOrderNetwork(ctx, network);
  });

  bot.callbackQuery('order:confirm', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleOrderConfirm(ctx);
  });

  bot.callbackQuery('order:cancel', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleOrderCancel(ctx);
  });

  bot.callbackQuery('order:skip_description', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleOrderDescription(ctx);
  });

  // Handle text messages during order creation wizard
  bot.on('message:text', async (ctx) => {
    const wizard = ctx.session.orderWizard;
    if (!wizard) {
      return; // Not in wizard, ignore
    }

    const text = ctx.message.text;

    // Handle /skip for optional description
    if (text === '/skip' && wizard.step === 'description') {
      await handleOrderDescription(ctx);
      return;
    }

    // Handle wizard steps
    switch (wizard.step) {
      case 'amount':
        await handleOrderAmount(ctx, text);
        break;
      case 'price':
        await handleOrderPrice(ctx, text);
        break;
      case 'description':
        await handleOrderDescription(ctx, text);
        break;
      default:
        // Ignore text in other steps
        break;
    }
  });

  // Handle back to main menu
  bot.callbackQuery('menu:main', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.editMessageText('خطا در شناسایی کاربر.');
      return;
    }

    try {
      const user = await coreClient.getUserProfile(userId);
      const role = (user as any)?.role;
      const isAdmin = role === "admin" || role === "super_admin";
      await ctx.editMessageText(commonMessages.welcome(ctx.from?.first_name), {
        reply_markup: getMainMenuKeyboard(isAdmin),
      });
    } catch {
      await ctx.editMessageText(commonMessages.welcome(ctx.from?.first_name), {
        reply_markup: getMainMenuKeyboard(false),
      });
    }
  });

  bot.callbackQuery('menu:profile', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText('قابلیت پروفایل به زودی اضافه می‌شود!');
  });

  bot.callbackQuery('menu:admin', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText('قابلیت منوی مدیریت به زودی اضافه می‌شود!');
  });

  return bot;
}

