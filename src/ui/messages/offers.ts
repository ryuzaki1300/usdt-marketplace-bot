// Offer-related messages
export const offerMessages = {
  createOffer: {
    enterPrice: (orderPrice: number) => {
      return `💰 قیمت پیشنهادی خود را وارد کنید (تومان):\n\nقیمت سفارش: ${orderPrice.toLocaleString()} تومان\n\nمی‌توانید این مرحله را رد کنید تا از قیمت سفارش استفاده شود.`;
    },
    enterComment: "💬 پیام اختیاری خود را وارد کنید یا دکمه «رد کردن» را بزنید:",
    summary: (data: {
      order: any;
      price: number;
      comment?: string;
    }) => {
      const side = data.order.side === "buy" ? "🟢 خرید" : "🔴 فروش";
      const total = data.order.amount_usdt * data.price;
      let message = "📋 خلاصه پیشنهاد:\n\n";
      message += `سفارش: ${side}\n`;
      message += `مقدار: ${data.order.amount_usdt} USDT\n`;
      message += `قیمت پیشنهادی: ${data.price.toLocaleString()} تومان\n`;
      message += `قیمت کل: ${total.toLocaleString()} تومان\n`;
      if (data.comment) {
        message += `پیام: ${data.comment}\n`;
      }
      message += `\nآیا می‌خواهید این پیشنهاد را ارسال کنید؟`;
      return message;
    },
    success: "✅ پیشنهاد شما با موفقیت ارسال شد!",
    error: "❌ خطا در ارسال پیشنهاد. لطفاً دوباره تلاش کنید.",
    invalidPrice: "❌ قیمت نامعتبر است. لطفاً یک عدد مثبت وارد کنید.",
    cancelled: "❌ ایجاد پیشنهاد لغو شد.",
  },
  offerReceived: (data: {
    order: any;
    offer: {
      id: number;
      price_per_unit: number;
      comment?: string;
    };
  }) => {
    const side = data.order.side === "buy" ? "🟢 خرید" : "🔴 فروش";
    const total = data.order.amount_usdt * data.offer.price_per_unit;
    let message = "🎉 پیشنهاد جدید برای سفارش شما:\n\n";
    message += `سفارش: ${side}\n`;
    message += `مقدار: ${data.order.amount_usdt} USDT\n`;
    message += `قیمت پیشنهادی: ${data.offer.price_per_unit.toLocaleString()} تومان\n`;
    message += `قیمت کل: ${total.toLocaleString()} تومان\n`;
    if (data.offer.comment) {
      message += `پیام: ${data.offer.comment}\n`;
    }
    return message;
  },
  offerRejected: {
    byMaker: (data: {
      order: any;
      offer: {
        id: number;
        price_per_unit: number;
      };
    }) => {
      const side = data.order.side === "buy" ? "🟢 خرید" : "🔴 فروش";
      let message = "❌ پیشنهاد شما رد شد\n\n";
      message += `سفارش: ${side}\n`;
      message += `مقدار: ${data.order.amount_usdt} USDT\n`;
      message += `قیمت پیشنهادی: ${data.offer.price_per_unit.toLocaleString()} تومان\n`;
      message += `\nمتأسفانه سازنده سفارش پیشنهاد شما را رد کرد.`;
      return message;
    },
    success: "✅ پیشنهاد با موفقیت رد شد.",
    error: "❌ خطا در رد پیشنهاد. لطفاً دوباره تلاش کنید.",
  },
  offerAccepted: {
    success: "✅ پیشنهاد با موفقیت پذیرفته شد.",
    error: "❌ خطا در پذیرش پیشنهاد. لطفاً دوباره تلاش کنید.",
    placeholder: "قابلیت پذیرش پیشنهاد به زودی اضافه می‌شود.",
    toMaker: (data: {
      order: any;
      offer: {
        id: number;
        price_per_unit: number;
      };
    }) => {
      const side = data.order.side === "buy" ? "🟢 خرید" : "🔴 فروش";
      let message = "✅ پیشنهاد شما پذیرفته شد!\n\n";
      message += `سفارش: ${side}\n`;
      message += `مقدار: ${data.order.amount_usdt} USDT\n`;
      message += `قیمت: ${data.offer.price_per_unit.toLocaleString()} تومان\n`;
      message += `قیمت کل: ${(data.order.amount_usdt * data.offer.price_per_unit).toLocaleString()} تومان\n\n`;
      message += `🔔 معامله ایجاد شد و در حال بررسی توسط ادمین است. به زودی با شما تماس خواهیم گرفت.`;
      return message;
    },
    toTaker: (data: {
      order: any;
      offer: {
        id: number;
        price_per_unit: number;
      };
    }) => {
      const side = data.order.side === "buy" ? "🟢 خرید" : "🔴 فروش";
      let message = "✅ پیشنهاد شما پذیرفته شد!\n\n";
      message += `سفارش: ${side}\n`;
      message += `مقدار: ${data.order.amount_usdt} USDT\n`;
      message += `قیمت: ${data.offer.price_per_unit.toLocaleString()} تومان\n`;
      message += `قیمت کل: ${(data.order.amount_usdt * data.offer.price_per_unit).toLocaleString()} تومان\n\n`;
      message += `🔔 معامله ایجاد شد و در حال بررسی توسط ادمین است. به زودی با شما تماس خواهیم گرفت.`;
      return message;
    },
  },
  existingOffer: (data: {
    order: any;
    offer: {
      id: number;
      price_per_unit: number;
      comment?: string;
    };
  }) => {
    const side = data.order.side === "buy" ? "🟢 خرید" : "🔴 فروش";
    const total = data.order.amount_usdt * data.offer.price_per_unit;
    let message = "⚠️ شما قبلاً برای این سفارش پیشنهاد داده‌اید:\n\n";
    message += `سفارش: ${side}\n`;
    message += `مقدار: ${data.order.amount_usdt} USDT\n`;
    message += `قیمت پیشنهادی فعلی: ${data.offer.price_per_unit.toLocaleString()} تومان\n`;
    message += `قیمت کل: ${total.toLocaleString()} تومان\n`;
    if (data.offer.comment) {
      message += `پیام: ${data.offer.comment}\n`;
    }
    message += `\nآیا می‌خواهید پیشنهاد خود را با قیمت یا پیام جدید به‌روزرسانی کنید؟`;
    return message;
  },
  offerUpdated: {
    success: "✅ پیشنهاد شما با موفقیت به‌روزرسانی شد!",
    error: "❌ خطا در به‌روزرسانی پیشنهاد. لطفاً دوباره تلاش کنید.",
  },
};

