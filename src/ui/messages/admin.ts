// Admin-related messages
export const adminMessages = {
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
    message += `   - شناسه کاربری: ${data.maker.id}\n\n`;
    message += `👤 پیشنهاددهنده (Taker):\n`;
    message += `   - نام: ${data.taker.full_name || "نامشخص"}\n`;
    message += `   - شناسه تلگرام: @${data.taker.telegram_username || "نامشخص"}\n`;
    message += `   - شناسه کاربری: ${data.taker.id}\n\n`;
    message += `📊 وضعیت: در انتظار بررسی ادمین\n`;
    if (data.offer.comment) {
      message += `💬 پیام پیشنهاد: ${data.offer.comment}\n`;
    }
    return message;
  },
};

