import { InlineKeyboard } from "grammy";
import { env } from "../../config/env";

export const channelKeyboards = {
  orderCreated: (order: any) => {
    return new InlineKeyboard().url(
      "📋 افزودن پیشنهاد",
      `https://t.me/${env.BOT_USERNAME.replace('@', '')}?start=offer_${order.id}`
    );
  },
};
