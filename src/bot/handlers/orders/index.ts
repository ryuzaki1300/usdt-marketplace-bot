import { Context, SessionFlavor } from "grammy";
import { SessionData } from "../../../types/session";
import { coreClient } from "../../../core/coreClient";
import { orderMessages } from "../../../ui/messages/orders";
import { orderKeyboards } from "../../../ui/keyboards/orders";
import { getMainMenuKeyboard } from "../../../ui/keyboards/mainMenu";
import { getUserData } from "../../middlewares/userData";
import { channelMessages } from "../../../ui/messages/channel";
import { channelKeyboards } from "../../../ui/keyboards/channel";
import { env } from "../../../config/env";

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

    // Send all orders in a single message
    const message = orderMessages.myOrders.allOrders(orders);
    const keyboard = orderKeyboards.allOrders(orders);
    
    try {
      await ctx.editMessageText(message, {
        reply_markup: keyboard,
      });
    } catch {
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
    // Try to answer callback query if it exists, otherwise just return
    try {
      await ctx.answerCallbackQuery("شناسایی کاربر امکان‌پذیر نیست.");
    } catch {
      // Not a callback query, ignore
    }
    return;
  }

  // Try to answer callback query if it exists
  try {
    await ctx.answerCallbackQuery();
  } catch {
    // Not a callback query, ignore
  }

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

export async function handleOrderCommand(ctx: MyContext) {
  // Skip if user is in a wizard
  if (ctx.session.orderWizard) {
    return;
  }

  const command = ctx.message?.text;
  if (!command) {
    return;
  }

  // Extract order ID from command like "/order_123"
  const match = command.match(/^\/order_(\d+)$/);
  if (!match) {
    await ctx.reply("فرمت دستور نامعتبر است. لطفاً از فرمت /order_<id> استفاده کنید.");
    return;
  }

  const orderId = parseInt(match[1], 10);
  if (isNaN(orderId)) {
    await ctx.reply("شناسه سفارش نامعتبر است.");
    return;
  }

  await handleOrderDetails(ctx, orderId);
}

export async function handleCancelOrder(ctx: MyContext, orderId: number) {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.answerCallbackQuery("شناسایی کاربر امکان‌پذیر نیست.");
    return;
  }

  await ctx.answerCallbackQuery();

  try {
    // Get order details before canceling to have the order data
    const order = await coreClient.getOrderById(orderId, userId);
    const orderData = order as any;

    // Cancel the order
    await coreClient.cancelOrder(orderId, userId);

    // Update order status to canceled for message formatting
    orderData.status = "canceled";

    // Try to get telegram meta and edit channel message
    try {
      const telegramMeta = await coreClient.getOrderTelegramMetaByOrderId(orderId);
      const meta = telegramMeta as any;

      if (meta && meta.chat_id && meta.message_id) {
        // Edit the channel message to update status
        await ctx.api.editMessageText(
          meta.chat_id.toString(),
          meta.message_id,
          channelMessages.orderCreated(orderData),
          {
            reply_markup: channelKeyboards.orderCreated(orderData),
          }
        );
      }
    } catch (error: any) {
      // Log error but don't fail the cancellation
      console.error("Failed to edit channel message:", error);
    }

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
