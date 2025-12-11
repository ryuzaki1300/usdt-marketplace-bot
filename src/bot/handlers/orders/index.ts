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
import {
  requireUserId,
  safeAnswerCallbackQuery,
  safeEditOrReply,
  safeEditChannelMessage,
  silentErrorHandling,
} from "../../utils/errorHandling";
import { parseOrderIdFromCommand } from "../../utils/validations";

type MyContext = Context & SessionFlavor<SessionData>;

export async function handleMyOrders(ctx: MyContext) {
  const userId = requireUserId(ctx);

  // Get user orders from Core
  const response = await coreClient.getUserOrders(userId, "open");
  const orders = response.data || [];

  if (orders.length === 0) {
    // No orders
    await safeEditOrReply(ctx, orderMessages.myOrders.noOrders, {
      reply_markup: orderKeyboards.myOrdersEmpty(),
    });
    return;
  }

  // Send all orders in a single message
  const message = orderMessages.myOrders.allOrders(orders);
  const keyboard = orderKeyboards.allOrders(orders);

  await safeEditOrReply(ctx, message, {
    reply_markup: keyboard,
  });
}

export async function handleOrderDetails(ctx: MyContext, orderId: number) {
  const userId = requireUserId(ctx);
  await safeAnswerCallbackQuery(ctx);

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

  const orderId = parseOrderIdFromCommand(command);
  await handleOrderDetails(ctx, orderId);
}

export async function handleCancelOrder(ctx: MyContext, orderId: number) {
  const userId = requireUserId(ctx);
  await safeAnswerCallbackQuery(ctx);

  // Get order details before canceling to have the order data
  const order = await coreClient.getOrderById(orderId, userId);
  const orderData = order as any;

  // Cancel the order
  await coreClient.cancelOrder(orderId, userId);

  // Update order status to canceled for message formatting
  orderData.status = "canceled";

  // Try to get telegram meta and edit channel message
  await silentErrorHandling(async () => {
    const telegramMeta = await coreClient.getOrderTelegramMetaByOrderId(orderId);
    const meta = telegramMeta as any;

    if (meta && meta.chat_id && meta.message_id) {
      // Edit the channel message to update status
      await safeEditChannelMessage(
        ctx,
        meta.chat_id.toString(),
        meta.message_id,
        channelMessages.orderCreated(orderData),
        {
          reply_markup: channelKeyboards.orderCreated(orderData),
        }
      );
    }
  }, "editing channel message after order cancellation");

  await ctx.reply(orderMessages.orderDetails.cancelSuccess);
}
