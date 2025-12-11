import { InlineKeyboard, Keyboard } from "grammy";

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

export const profileEditKeyboards = {
  fullNameStep: (currentFullName?: string): InlineKeyboard => {
    const keyboard = new InlineKeyboard();
    if (currentFullName) {
      keyboard.text(`استفاده از: ${currentFullName}`, "profile:use_current_fullname").row();
    }
    keyboard.text("❌ لغو", "profile:edit_cancel");
    return keyboard;
  },
  phoneNumberStep: (currentPhoneNumber?: string): Keyboard => {
    const keyboard = new Keyboard()
      .requestContact("📱 استفاده از شماره تلگرام")
      .row();
    
    if (currentPhoneNumber) {
      keyboard.text(`استفاده از: ${currentPhoneNumber}`).row();
    }
    
    keyboard.text("❌ لغو");
    
    return keyboard.resized();
  },
  cancel: (): InlineKeyboard => {
    return new InlineKeyboard().text("❌ لغو", "profile:edit_cancel");
  },
};
