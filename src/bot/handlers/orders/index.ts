import { Context, SessionFlavor } from "grammy";
import { SessionData } from "../../../types/session";
import { coreClient } from "../../../core/coreClient";
import { orderMessages } from "../../../ui/messages/orders";
import { orderKeyboards } from "../../../ui/keyboards/orders";
import { getMainMenuKeyboard } from "../../../ui/keyboards/mainMenu";

type MyContext = Context & SessionFlavor<SessionData>;

export async function handleMyOrders(ctx: MyContext) {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply("شناسایی کاربر امکان‌پذیر نیست.");
    return;
  }

  try {
    // Get user orders from Core
    const response = await coreClient.getUserOrders(userId);
    const orders = response.data || [];

    if (orders.length === 0) {
      await ctx.editMessageText(orderMessages.myOrders.noOrders, {
        reply_markup: orderKeyboards.myOrdersEmpty(),
      });
    } else {
      await ctx.editMessageText(orderMessages.myOrders.orderList(orders), {
        reply_markup: orderKeyboards.myOrders(),
      });
    }
  } catch (error: any) {
    await ctx.editMessageText(
      error.message || "خطا در دریافت سفارش‌ها. لطفاً دوباره تلاش کنید.",
      {
        reply_markup: getMainMenuKeyboard(false),
      }
    );
  }
}
