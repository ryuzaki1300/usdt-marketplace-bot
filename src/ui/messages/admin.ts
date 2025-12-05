// Admin-related messages
export const adminMessages = {
  menu: "⚙️ منوی مدیریت\n\nلطفاً یکی از گزینه‌های زیر را انتخاب کنید:",
  
  openDeals: "📊 معاملات باز\n\nاین قابلیت به زودی اضافه می‌شود.",
  
  kycRequests: "✅ درخواست‌های KYC\n\nاین قابلیت به زودی اضافه می‌شود.",
  
  users: "👥 کاربران\n\nاین قابلیت به زودی اضافه می‌شود.",
  
  dealArchive: "📁 آرشیو معاملات\n\nاین قابلیت به زودی اضافه می‌شود.",
  
  addAdmin: "➕ افزودن ادمین\n\nاین قابلیت به زودی اضافه می‌شود.",

  newDeal: (data: {
    deal: any;
    order: any;
    offer: any;
    maker: any;
    taker: any;
  }) => {
    const side = data.order.side === "buy" ? "🟢 خرید" : "🔴 فروش";
    let message = "🔔 معامله جدید ایجاد شد\n\n";
    message += `📋 شناسه معامله: ${data.deal.id}\n`;
    message += `📦 شناسه سفارش: ${data.order.id}\n`;
    message += `💼 نوع: ${side}\n`;
    message += `💰 مقدار: ${data.order.amount_usdt} USDT\n`;
    message += `💵 قیمت واحد: ${data.offer.price_per_unit.toLocaleString()} تومان\n`;
    message += `💸 قیمت کل: ${(data.order.amount_usdt * data.offer.price_per_unit).toLocaleString()} تومان\n\n`;
    message += `👤 سازنده سفارش (Maker):\n`;
    message += `   - نام: ${data.maker.full_name || "نامشخص"}\n`;
    message += `   - شناسه تلگرام: @${data.maker.telegram_username || "نامشخص"}\n`;
    message += `   - شناسه کاربری: /user_${data.maker.id}\n\n`;
    message += `👤 پیشنهاددهنده (Taker):\n`;
    message += `   - نام: ${data.taker.full_name || "نامشخص"}\n`;
    message += `   - شناسه تلگرام: @${data.taker.telegram_username || "نامشخص"}\n`;
    message += `   - شناسه کاربری: /user_${data.taker.id}\n\n`;
    message += `📊 وضعیت: در انتظار بررسی ادمین\n`;
    if (data.offer.comment) {
      message += `💬 پیام پیشنهاد: ${data.offer.comment}\n`;
    }
    return message;
  },

  userProfile: (data: {
    user: any;
    successfulTrades: number;
  }) => {
    const user = data.user;
    let message = "👤 پروفایل کاربر\n\n";
    
    message += `📝 نام کامل: ${user.full_name || "نامشخص"}\n`;
    if (user.phone_number) {
      message += `📱 شماره تلفن: \`${user.phone_number}\`\n`;
    } else {
      message += `📱 شماره تلفن: نامشخص\n`;
    }
    
    if (user.created_at) {
      const date = new Date(user.created_at);
      message += `📅 تاریخ ایجاد: ${date.toLocaleDateString("fa-IR")}\n`;
    }
    
    const statusText = user.status === "active" ? "✅ فعال" : "❌ مسدود";
    message += `🔐 وضعیت کاربر: ${statusText}\n`;
    
    let kycStatusText = "نامشخص";
    if (user.kyc_status === "none") kycStatusText = "❌ ثبت نشده";
    else if (user.kyc_status === "pending") kycStatusText = "⏳ در انتظار بررسی";
    else if (user.kyc_status === "approved") kycStatusText = "✅ تایید شده";
    else if (user.kyc_status === "rejected") kycStatusText = "❌ رد شده";
    message += `✅ وضعیت KYC: ${kycStatusText}\n`;
    
    message += `📊 معاملات موفق: ${data.successfulTrades}\n`;
    
    return message;
  },
};

