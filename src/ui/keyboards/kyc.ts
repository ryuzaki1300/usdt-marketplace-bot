import { InlineKeyboard } from "grammy";

export function getKycRequiredKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🔙 بازگشت به منوی اصلی", "menu:main")
    .row()
    .text("📝 درخواست احراز هویت", "menu:profile");
}

