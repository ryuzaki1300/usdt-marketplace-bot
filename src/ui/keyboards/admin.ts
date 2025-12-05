import { InlineKeyboard } from "grammy";

export function getAdminMenuKeyboard(isSuperAdmin: boolean = false): InlineKeyboard {
  const keyboard = new InlineKeyboard()
    .text("📊 معاملات باز", "admin:open_deals")
    .row()
    .text("✅ درخواست‌های KYC", "admin:kyc_requests")
    .row()
    .text("👥 کاربران", "admin:users")
    .row()
    .text("📁 آرشیو معاملات", "admin:deal_archive")
    .row();

  if (isSuperAdmin) {
    keyboard.text("➕ افزودن ادمین", "admin:add_admin").row();
  }

  keyboard.text("🔙 بازگشت به منوی اصلی", "menu:main");

  return keyboard;
}

export function getBackToAdminMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🔙 بازگشت به منوی مدیریت", "menu:admin");
}

export function getUserProfileKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🔄 تغییر وضعیت کاربر", "admin:user:change_status")
    .row()
    .text("✅ تغییر وضعیت KYC", "admin:user:change_kyc")
    .row()
    .text("📦 سفارش‌های کاربر", "admin:user:orders")
    .row()
    .text("💼 پیشنهادهای باز کاربر", "admin:user:offers")
    .row()
    .text("🔙 بازگشت به منوی مدیریت", "menu:admin");
}

