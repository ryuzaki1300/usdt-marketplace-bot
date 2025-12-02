// Order-related messages
export const orderMessages = {
  myOrders: {
    title: "📦 سفارش‌های من",
    noOrders: "شما هنوز سفارشی ثبت نکرده‌اید.",
    orderList: (orders: any[]) => {
      if (orders.length === 0) {
        return orderMessages.myOrders.noOrders;
      }

      let message = "📦 سفارش‌های شما:\n\n";
      orders.forEach((order, index) => {
        const side = order.side === "buy" ? "🟢 خرید" : "🔴 فروش";
        const status =
          order.status === "open"
            ? "✅ باز"
            : order.status === "matched"
            ? "✅ تطبیق شده"
            : "❌ لغو شده";
        message += `${index + 1}. ${side} - ${order.amount_usdt} USDT\n`;
        message += `   قیمت: ${order.price_per_unit} تومان\n`;
        message += `   وضعیت: ${status}\n`;
        if (order.network) {
          message += `   شبکه: ${order.network}\n`;
        }
        message += `\n`;
      });

      return message;
    },
  },

  createOrder: {
    chooseSide: "لطفاً نوع سفارش را انتخاب کنید:",
    enterAmount: "مقدار USDT را وارد کنید:",
    enterPrice: "قیمت هر واحد (تومان) را وارد کنید:",
    enterNetwork: "شبکه را انتخاب کنید:",
    enterDescription: "توضیحات اختیاری را وارد کنید (یا /skip برای رد کردن):",
    summary: (wizard: {
      side: "buy" | "sell";
      amount: number;
      price: number;
      network?: string;
      description?: string;
    }) => {
      const side = wizard.side === "buy" ? "🟢 خرید" : "🔴 فروش";
      const total = wizard.amount * wizard.price;
      let message = "📋 خلاصه سفارش:\n\n";
      message += `نوع: ${side}\n`;
      message += `مقدار: ${wizard.amount} USDT\n`;
      message += `قیمت هر واحد: ${wizard.price} تومان\n`;
      message += `قیمت کل: ${total.toLocaleString()} تومان\n`;
      if (wizard.network) {
        message += `شبکه: ${wizard.network}\n`;
      }
      if (wizard.description) {
        message += `توضیحات: ${wizard.description}\n`;
      }
      message += `\nآیا می‌خواهید این سفارش را ثبت کنید؟`;
      return message;
    },
    success: "✅ سفارش شما با موفقیت ثبت شد!",
    error: "❌ خطا در ثبت سفارش. لطفاً دوباره تلاش کنید.",
    invalidAmount: "❌ مقدار نامعتبر است. لطفاً یک عدد مثبت وارد کنید.",
    invalidPrice: "❌ قیمت نامعتبر است. لطفاً یک عدد مثبت وارد کنید.",
    cancelled: "❌ ایجاد سفارش لغو شد.",
  },
};
