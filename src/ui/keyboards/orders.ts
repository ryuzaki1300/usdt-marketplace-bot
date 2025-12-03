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

  myOrdersHeader: (): InlineKeyboard => {
    return new InlineKeyboard()
      .text("➕ سفارش جدید", "order:create")
      .row()
      .text("🔙 بازگشت به منوی اصلی", "menu:main");
  },

  singleOrder: (order: any): InlineKeyboard => {
    const keyboard = new InlineKeyboard();
    
    // View details button
    keyboard.text("📋 مشاهده جزئیات", `order:view:${order.id}`).row();
    
    // Cancel button only if order is open
    if (order.status === "open") {
      keyboard.text("❌ لغو سفارش", `order:cancel_order:${order.id}`).row();
    }
    
    return keyboard;
  },

  chooseSide: (): InlineKeyboard => {
    return new InlineKeyboard()
      .text("🟢 خرید", "order:side:buy")
      .text("🔴 فروش", "order:side:sell")
      .row()
      .text("❌ لغو", "order:cancel");
  },

  chooseNetwork: (networkString: string = ""): InlineKeyboard => {
    const keyboard = new InlineKeyboard();
    
    // "No difference" option at the top (big button, full width) - not selectable, just proceeds
    keyboard.text("⚪ فرقی ندارد", "order:network:no_difference");
    keyboard.row();
    
    // Network options with checkboxes in a 2x2 grid (single selection only)
    const networks = ["BEP20", "TRC20", "ERC20", "TON"];
    for (let i = 0; i < networks.length; i += 2) {
      const network1 = networks[i];
      const network2 = networks[i + 1];
      
      const isSelected1 = networkString === network1;
      keyboard.text(
        isSelected1 ? `✅ ${network1}` : `⚪ ${network1}`,
        `order:network:${network1}`
      );
      
      if (network2) {
        const isSelected2 = networkString === network2;
        keyboard.text(
          isSelected2 ? `✅ ${network2}` : `⚪ ${network2}`,
          `order:network:${network2}`
        );
      }
      keyboard.row();
    }
    
    // Done button (only show if a network is selected)
    if (networkString && networkString !== "فرقی نداره") {
      keyboard.text("✅ تأیید", "order:network:done");
      keyboard.row();
    }
    
    // Cancel button
    keyboard.text("❌ لغو", "order:cancel");
    
    return keyboard;
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

  descriptionStep: (): InlineKeyboard => {
    return new InlineKeyboard()
      .text("⏭️ رد کردن", "order:skip_description")
      .row()
      .text("❌ لغو", "order:cancel");
  },

  orderDetails: (order: any): InlineKeyboard => {
    const keyboard = new InlineKeyboard();
    
    // Only show cancel button if order is open
    if (order.status === "open") {
      keyboard.text("❌ لغو سفارش", `order:cancel_order:${order.id}`).row();
    }
    
    keyboard.text("🔙 بازگشت به لیست سفارش‌ها", "order:my_orders");
    
    return keyboard;
  },
};
