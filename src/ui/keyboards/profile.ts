import { InlineKeyboard } from "grammy";

export function getProfileKeyboard(kycStatus: string): InlineKeyboard {
  const keyboard = new InlineKeyboard()
    .text("✏️ ویرایش پروفایل", "profile:edit")
    .row();

  // Show "Request KYC" button if KYC status is 'rejected' or 'none'
  if (kycStatus === "rejected" || kycStatus === "none") {
    keyboard.text("📝 درخواست احراز هویت", "profile:request_kyc").row();
  }

  keyboard.text("🔙 بازگشت به منوی اصلی", "menu:main");

  return keyboard;
}
