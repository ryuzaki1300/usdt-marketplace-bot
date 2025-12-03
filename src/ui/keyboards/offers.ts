import { InlineKeyboard } from "grammy";
import { getMainMenuKeyboard } from "./mainMenu";

// Offer-related keyboards
export const offerKeyboards = {
  priceStep: (): InlineKeyboard => {
    return new InlineKeyboard()
      .text("⏭️ استفاده از قیمت سفارش", "offer:skip_price")
      .row()
      .text("❌ لغو", "offer:cancel");
  },

  commentStep: (): InlineKeyboard => {
    return new InlineKeyboard()
      .text("⏭️ رد کردن", "offer:skip_comment")
      .row()
      .text("❌ لغو", "offer:cancel");
  },

  confirmOffer: (): InlineKeyboard => {
    return new InlineKeyboard()
      .text("✅ تأیید و ارسال", "offer:confirm")
      .row()
      .text("❌ لغو", "offer:cancel");
  },
};
