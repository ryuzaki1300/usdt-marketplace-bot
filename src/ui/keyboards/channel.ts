import { InlineKeyboard } from "grammy";
import { env } from "../../config/env";

export const channelKeyboards = {
  orderCreated: (order: any) => {
    const keyboard = new InlineKeyboard();
    
    // Only show "Add Offer" button if order is open
    if (order.status === "open") {
      keyboard.url(
        "📋 افزودن پیشنهاد",
        `https://t.me/${env.BOT_USERNAME.replace('@', '')}?start=offer_${order.id}`
      );
    }
    
    return keyboard;
  },
};
