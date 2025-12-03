import { Bot, Context, session, SessionFlavor } from 'grammy';
import { env } from '../config/env';
import { SessionData } from '../types/session';
import { loggerMiddleware } from './middlewares/logger';
import { errorHandlerMiddleware } from './middlewares/errorHandler';
import { userDataMiddleware, getUserData } from './middlewares/userData';
import { handleStart } from './handlers/start';
import { handleMyOrders, handleOrderDetails, handleCancelOrder, handleOrderCommand } from './handlers/orders';
import { handleOfferCommand } from './handlers/offers';
import {
  handleOrderCreate,
  handleOrderSide,
  handleOrderAmount,
  handleOrderPrice,
  handleOrderNetwork,
  handleOrderNetworkDone,
  handleOrderDescription,
  handleOrderConfirm,
  handleOrderCancel,
} from './conversations/createOrder';
import {
  handleOfferCreate,
  handleOfferPrice,
  handleOfferComment,
  handleOfferConfirm,
  handleOfferCancel,
} from './conversations/createOffer';
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
  bot.use(userDataMiddleware);
  bot.use(errorHandlerMiddleware);

  // Register command handlers
  bot.command('start', handleStart);
  
  // Handle /order_<id> command pattern (when user clicks on /order_123 in message)
  bot.hears(/^\/order_\d+$/, handleOrderCommand);
  
  // Handle /offer_<id> or offer_<id> command pattern (when user clicks on /offer_123 in message)
  bot.hears(/^\/?offer_\d+$/, handleOfferCommand);

  // Register callback query handlers (for inline keyboards)
  bot.callbackQuery('menu:my_orders', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleMyOrders(ctx);
  });

  bot.callbackQuery('order:my_orders', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleMyOrders(ctx);
  });

  bot.callbackQuery(/^order:view:(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const orderId = parseInt(ctx.match[1], 10);
    await handleOrderDetails(ctx, orderId);
  });

  bot.callbackQuery(/^order:cancel_order:(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const orderId = parseInt(ctx.match[1], 10);
    await handleCancelOrder(ctx, orderId);
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

  bot.callbackQuery('order:network:done', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleOrderNetworkDone(ctx);
  });

  bot.callbackQuery(/^order:network:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const network = ctx.match[1];
    // Skip if it's the "done" button (already handled above)
    if (network === 'done') {
      return;
    }
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

  // Offer creation wizard handlers
  bot.callbackQuery(/^offer:create:(\d+)$/, async (ctx) => {
    const orderId = parseInt(ctx.match[1], 10);
    await handleOfferCreate(ctx, orderId);
  });

  bot.callbackQuery('offer:skip_price', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleOfferPrice(ctx);
  });

  bot.callbackQuery('offer:skip_comment', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleOfferComment(ctx);
  });

  bot.callbackQuery('offer:confirm', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleOfferConfirm(ctx);
  });

  bot.callbackQuery('offer:cancel', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleOfferCancel(ctx);
  });

  // Handle text messages during order creation wizard
  bot.on('message:text', async (ctx) => {
    const orderWizard = ctx.session.orderWizard;
    const offerWizard = ctx.session.offerWizard;

    // Handle offer wizard first (if active)
    if (offerWizard) {
      const text = ctx.message.text;

      switch (offerWizard.step) {
        case 'price':
          await handleOfferPrice(ctx, text);
          break;
        case 'comment':
          await handleOfferComment(ctx, text);
          break;
        default:
          // Ignore text in other steps
          break;
      }
      return;
    }

    // Handle order wizard (if active)
    if (orderWizard) {
      const text = ctx.message.text;

      // Handle wizard steps
      switch (orderWizard.step) {
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

    // Use cached user data from middleware
    const user = getUserData(ctx);
    if (user) {
      const role = (user as any)?.role;
      const isAdmin = role === "admin" || role === "super_admin";
      await ctx.editMessageText(commonMessages.welcome(ctx.from?.first_name), {
        reply_markup: getMainMenuKeyboard(isAdmin),
      });
    } else {
      // Fallback if user data not available
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

