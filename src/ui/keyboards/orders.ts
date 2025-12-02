import { InlineKeyboard } from "grammy";
import { getMainMenuKeyboard } from "./mainMenu";

// Order-related keyboards
export const orderKeyboards = {
  myOrdersEmpty: (): InlineKeyboard => {
    return new InlineKeyboard()
      .text("➕ سفارش جدید", "order:create")
      .row()
      .text("🔙 بازگشت به منوی اصلی", "menu:main");
  },

  myOrders: (): InlineKeyboard => {
    return new InlineKeyboard()
      .text("➕ سفارش جدید", "order:create")
      .row()
      .text("🔙 بازگشت به منوی اصلی", "menu:main");
  },

  chooseSide: (): InlineKeyboard => {
    return new InlineKeyboard()
      .text("🟢 خرید", "order:side:buy")
      .text("🔴 فروش", "order:side:sell")
      .row()
      .text("❌ لغو", "order:cancel");
  },

  chooseNetwork: (): InlineKeyboard => {
    return new InlineKeyboard()
      .text("TRC20", "order:network:TRC20")
      .text("ERC20", "order:network:ERC20")
      .row()
      .text("TON", "order:network:TON")
      .row()
      .text("❌ لغو", "order:cancel");
  },

  confirmOrder: (): InlineKeyboard => {
    return new InlineKeyboard()
      .text("✅ تأیید و ثبت", "order:confirm")
      .row()
      .text("❌ لغو", "order:cancel");
  },

  cancelOrder: (): InlineKeyboard => {
    return new InlineKeyboard().text("❌ لغو", "order:cancel");
  },
};
