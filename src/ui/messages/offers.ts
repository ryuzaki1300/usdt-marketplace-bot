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
  myOffers: {
    title: "💼 پیشنهادهای من",
    noOffers: "شما هنوز پیشنهادی ثبت نکرده‌اید.",
    allOffers: (offers: any[]) => {
      if (offers.length === 0) {
        return "شما هنوز پیشنهادی ثبت نکرده‌اید.";
      }

      let message = "";
      
      offers.forEach((offer, index) => {
        const order = offer.order || {};
        const side = order.side === "buy" ? "🟢 خرید" : "🔴 فروش";
        const createdAt = offer.created_at 
          ? new Date(offer.created_at).toLocaleDateString("fa-IR")
          : new Date().toLocaleDateString("fa-IR");
        const totalPrice = (order.amount_usdt || 0) * (offer.price_per_unit || 0);
        
        message += `پیشنهاد ${index + 1}\n\n`;
        message += `تاریخ: ${createdAt}\n`;
        message += `نوع: ${side}\n`;
        message += `مقدار: ${order.amount_usdt || 0} USDT\n`;
        message += `قیمت هر واحد: ${(offer.price_per_unit || 0).toLocaleString()} تومان\n`;
        message += `قیمت کل: ${totalPrice.toLocaleString()} تومان\n`;
        message += `\n/offer_${offer.id}\n`;
        
        // Add separator between offers (except after the last one)
        if (index < offers.length - 1) {
          message += `\n--------------------------------\n\n`;
        }
      });
      
      return message;
    },
  },
  offerDetails: {
    title: (offer: any) => {
      const order = offer.order || {};
      const side = order.side === "buy" ? "🟢 خرید" : "🔴 فروش";
      const createdAt = offer.created_at 
        ? new Date(offer.created_at).toLocaleDateString("fa-IR")
        : new Date().toLocaleDateString("fa-IR");
      const totalPrice = (order.amount_usdt || 0) * (offer.price_per_unit || 0);
      
      let message = `پیشنهاد ${offer.id}\n\n`;
      message += `تاریخ: ${createdAt}\n`;
      message += `نوع: ${side}\n`;
      message += `مقدار: ${order.amount_usdt || 0} USDT\n`;
      message += `قیمت هر واحد: ${(offer.price_per_unit || 0).toLocaleString()} تومان\n`;
      message += `قیمت کل: ${totalPrice.toLocaleString()} تومان\n`;
      
      if (order.network) {
        message += `شبکه: ${order.network}\n`;
      }
      
      if (offer.comment) {
        message += `نظر: ${offer.comment}\n`;
      }
      
      return message;
    },
    cancelSuccess: "✅ پیشنهاد با موفقیت لغو شد.",
    cancelError: "❌ خطا در لغو پیشنهاد. لطفاً دوباره تلاش کنید.",
    notFound: "❌ پیشنهاد یافت نشد.",
  },
  offerCanceledByTaker: (data: {
    order: any;
    offer: {
      id: number;
      price_per_unit: number;
    };
  }) => {
    const side = data.order.side === "buy" ? "🟢 خرید" : "🔴 فروش";
    let message = "❌ پیشنهاد شما توسط پیشنهاددهنده لغو شد\n\n";
    message += `سفارش: ${side}\n`;
    message += `مقدار: ${data.order.amount_usdt} USDT\n`;
    message += `قیمت پیشنهادی: ${data.offer.price_per_unit.toLocaleString()} تومان\n`;
    message += `\nپیشنهاددهنده پیشنهاد خود را لغو کرد.`;
    return message;
  },
};

