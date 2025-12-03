import { Context, SessionFlavor } from "grammy";
import { SessionData } from "../../../types/session";
import { coreClient } from "../../../core/coreClient";
import { orderMessages } from "../../../ui/messages/orders";
import { orderKeyboards } from "../../../ui/keyboards/orders";
import { getMainMenuKeyboard } from "../../../ui/keyboards/mainMenu";
import { getUserData } from "../../middlewares/userData";

type MyContext = Context & SessionFlavor<SessionData>;

export async function handleMyOrders(ctx: MyContext) {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply("شناسایی کاربر امکان‌پذیر نیست.");
    return;
  }

  try {
    // Get user orders from Core
    const response = await coreClient.getUserOrders(userId, "open");
    const orders = response.data || [];

    if (orders.length === 0) {
      // No orders - try to edit, otherwise send new message
      try {
        await ctx.editMessageText(orderMessages.myOrders.noOrders, {
          reply_markup: orderKeyboards.myOrdersEmpty(),
        });
      } catch {
        await ctx.reply(orderMessages.myOrders.noOrders, {
          reply_markup: orderKeyboards.myOrdersEmpty(),
        });
      }
      return;
    }

    // Send header message
    try {
      await ctx.editMessageText(orderMessages.myOrders.header(orders.length), {
        reply_markup: orderKeyboards.myOrdersHeader(),
      });
    } catch {
      await ctx.reply(orderMessages.myOrders.header(orders.length), {
        reply_markup: orderKeyboards.myOrdersHeader(),
      });
    }

    // Send each order as a separate message with its buttons
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const message = orderMessages.myOrders.singleOrder(order, i + 1);
      const keyboard = orderKeyboards.singleOrder(order);
      
      await ctx.reply(message, {
        reply_markup: keyboard,
      });
    }
  } catch (error: any) {
    const errorMessage = error.message || "خطا در دریافت سفارش‌ها. لطفاً دوباره تلاش کنید.";
    try {
      await ctx.editMessageText(errorMessage, {
        reply_markup: getMainMenuKeyboard(false),
      });
    } catch {
      await ctx.reply(errorMessage, {
        reply_markup: getMainMenuKeyboard(false),
      });
    }
  }
}

export async function handleOrderDetails(ctx: MyContext, orderId: number) {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.answerCallbackQuery("شناسایی کاربر امکان‌پذیر نیست.");
    return;
  }

  await ctx.answerCallbackQuery();

  try {
    // Get order details
    const order = await coreClient.getOrderById(orderId, userId);
    
    const offers = (order as any).offers || [];

    // Check if user is super admin
    const user = getUserData(ctx);
    const isSuperAdmin = user && (user as any)?.role === "super_admin";

    // Build message with order details and offers
    let message = orderMessages.orderDetails.title(order as any, isSuperAdmin);
    message += orderMessages.orderDetails.offers(offers);

    // Send as a new message
    await ctx.reply(message, {
      reply_markup: orderKeyboards.orderDetails(order as any),
    });
  } catch (error: any) {
    await ctx.reply(
      error.message || orderMessages.orderDetails.notFound,
      {
        reply_markup: getMainMenuKeyboard(false),
      }
    );
  }
}

export async function handleCancelOrder(ctx: MyContext, orderId: number) {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.answerCallbackQuery("شناسایی کاربر امکان‌پذیر نیست.");
    return;
  }

  await ctx.answerCallbackQuery();

  try {
    await coreClient.cancelOrder(orderId, userId);
    await ctx.reply(orderMessages.orderDetails.cancelSuccess);
  } catch (error: any) {
    await ctx.reply(
      error.message || orderMessages.orderDetails.cancelError,
      {
        reply_markup: getMainMenuKeyboard(false),
      }
    );
  }
}
