import { InlineKeyboard } from "grammy";

export function getMainMenuKeyboard(isAdmin: boolean = false): InlineKeyboard {
  const keyboard = new InlineKeyboard()
    .text("📦 سفارش‌های من", "menu:my_orders")
    .row()
    .text("💼 پیشنهادهای من", "menu:my_offers")
    .row()
    .text("➕ سفارش جدید", "menu:new_order")
    .row()
    .text("👤 پروفایل", "menu:profile");

  if (isAdmin) {
    keyboard.row().text("⚙️ منوی مدیریت", "menu:admin");
  }

  return keyboard;
}
