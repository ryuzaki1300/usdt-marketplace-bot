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

    // Get user role for keyboard
    const user = await coreClient.getUserProfile(userId);
    const role = (user as any)?.role;
    const isAdmin = role === "admin" || role === "super_admin";

    if (orders.length === 0) {
      await ctx.editMessageText(orderMessages.myOrders.noOrders, {
        reply_markup: orderKeyboards.myOrdersEmpty(isAdmin),
      });
    } else {
      await ctx.editMessageText(orderMessages.myOrders.orderList(orders), {
        reply_markup: orderKeyboards.myOrders(isAdmin),
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
