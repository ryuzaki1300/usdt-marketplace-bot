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

  offerReceived: (offerId: number): InlineKeyboard => {
    return new InlineKeyboard()
      .text("✅ پذیرفتن", `offer:accept:${offerId}`)
      .text("❌ رد کردن", `offer:reject:${offerId}`)
      .row();
  },

  existingOffer: (orderId: number): InlineKeyboard => {
    return new InlineKeyboard()
      .text("🔄 به‌روزرسانی پیشنهاد", `offer:overwrite:${orderId}`)
      .row()
      .text("❌ لغو", "offer:cancel");
  },

  myOffersEmpty: (): InlineKeyboard => {
    return new InlineKeyboard()
      .text("🔙 بازگشت به منوی اصلی", "menu:main");
  },

  allOffers: (): InlineKeyboard => {
    return new InlineKeyboard()
      .text("🔙 بازگشت به منوی اصلی", "menu:main");
  },

  offerDetails: (offerId: number): InlineKeyboard => {
    return new InlineKeyboard()
      .text("❌ لغو پیشنهاد", `offer:cancel_offer:${offerId}`)
      .row()
      .text("🔙 بازگشت به لیست پیشنهادها", "offer:my_offers");
  },
};
