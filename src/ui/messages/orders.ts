// Order-related messages
export const orderMessages = {
  myOrders: {
    title: "📦 سفارش‌های من",
    noOrders: "شما هنوز سفارشی ثبت نکرده‌اید.",
    header: (total: number) => `📦 سفارش‌های شما (${total} سفارش):\n`,
    singleOrder: (order: any, index: number) => {
      const side = order.side === "buy" ? "🟢 خرید" : "🔴 فروش";
      const status =
        order.status === "open"
          ? "✅ باز"
          : order.status === "matched"
          ? "✅ تطبیق شده"
          : "❌ لغو شده";
      
      let message = `📋 سفارش ${index + 1}\n\n`;
      message += `نوع: ${side}\n`;
      message += `مقدار: ${order.amount_usdt} USDT\n`;
      message += `قیمت: ${order.price_per_unit.toLocaleString()} تومان\n`;
      message += `قیمت کل: ${(order.amount_usdt * order.price_per_unit).toLocaleString()} تومان\n`;
      message += `وضعیت: ${status}\n`;
      if (order.network) {
        message += `شبکه: ${order.network}\n`;
      }
      if (order.description) {
        message += `توضیحات: ${order.description}\n`;
      }
      
      return message;
    },
  },

  createOrder: {
    chooseSide: "لطفاً نوع سفارش را انتخاب کنید:",
    enterAmount: "مقدار USDT را وارد کنید:",
    enterPrice: "قیمت هر واحد (تومان) را وارد کنید:",
    enterNetwork: "شبکه(ها) را انتخاب کنید (می‌توانید چند مورد انتخاب کنید):",
    enterDescription: "توضیحات اختیاری را وارد کنید یا دکمه «رد کردن» را بزنید:",
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

  orderDetails: {
    title: (order: any, isSuperAdmin: boolean = false) => {
      const side = order.side === "buy" ? "🟢 خرید" : "🔴 فروش";
      const status =
        order.status === "open"
          ? "✅ باز"
          : order.status === "matched"
          ? "✅ تطبیق شده"
          : "❌ لغو شده";
      
      let message = `📋 جزئیات سفارش\n\n`;
      
      // Only show ID to super admin
      if (isSuperAdmin) {
        message += `شناسه: #${order.id}\n`;
      }
      
      message += `نوع: ${side}\n`;
      message += `مقدار: ${order.amount_usdt} USDT\n`;
      message += `قیمت هر واحد: ${order.price_per_unit.toLocaleString()} تومان\n`;
      message += `قیمت کل: ${(order.amount_usdt * order.price_per_unit).toLocaleString()} تومان\n`;
      message += `وضعیت: ${status}\n`;
      
      if (order.network) {
        message += `شبکه: ${order.network}\n`;
      }
      
      if (order.description) {
        message += `توضیحات: ${order.description}\n`;
      }
      
      if (order.created_at) {
        const date = new Date(order.created_at);
        message += `تاریخ ایجاد: ${date.toLocaleDateString("fa-IR")}\n`;
      }
      
      return message;
    },
    
    offers: (offers: any[]) => {
      if (offers.length === 0) {
        return "\n\n📭 هیچ پیشنهادی برای این سفارش وجود ندارد.";
      }
      
      let message = `\n\n📨 پیشنهادها (${offers.length}):\n\n`;
      
      offers.forEach((offer, index) => {
        const status =
          offer.status === "pending_maker_decision"
            ? "⏳ در انتظار تصمیم"
            : offer.status === "accepted_by_maker"
            ? "✅ پذیرفته شده"
            : offer.status === "rejected_by_maker"
            ? "❌ رد شده"
            : "❌ لغو شده";
        
        message += `${index + 1}. پیشنهاد #${offer.id}\n`;
        message += `   قیمت: ${offer.price_per_unit.toLocaleString()} تومان\n`;
        message += `   وضعیت: ${status}\n`;
        if (offer.comment) {
          message += `   نظر: ${offer.comment}\n`;
        }
        message += `\n`;
      });
      
      return message;
    },
    
    cancelSuccess: "✅ سفارش با موفقیت لغو شد.",
    cancelError: "❌ خطا در لغو سفارش. لطفاً دوباره تلاش کنید.",
    notFound: "❌ سفارش یافت نشد.",
  },
};
