import { InlineKeyboard } from "grammy";

export const channelKeyboards = {
  orderCreated: (order: any) => {
    return new InlineKeyboard().text(
      "📋 مشاهده جزئیات",
      `order:view:${order.id}`
    );
  },
};
