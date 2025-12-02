import { InlineKeyboard } from "grammy";

export function getMainMenuKeyboard(isAdmin: boolean = false): InlineKeyboard {
  const keyboard = new InlineKeyboard()
    .text("📦 My Orders", "menu:my_orders")
    .row()
    .text("💼 My Offers", "menu:my_offers")
    .row()
    .text("➕ New Order", "menu:new_order")
    .row()
    .text("👤 Profile", "menu:profile");

  if (isAdmin) {
    keyboard.row().text("⚙️ Admin Menu", "menu:admin");
  }

  return keyboard;
}
