import { toTehranUnix } from "../../utils/date-helper";

export const channelMessages = {
  orderCreated: (order: any) => {
    const side = order.side === "buy" ? "🟢 خرید" : "🔴 فروش";
    const status =
      order.status === "open"
        ? "✅ باز"
        : order.status === "matched"
        ? "✅ تطبیق شده"
        : "❌ لغو شده";
    const createdAt = toTehranUnix(order.created_at);
    let message = `📋 سفارش جدید (${createdAt})\n\n`;
    message += `نوع: ${side}\n`;
    message += `مقدار: ${order.amount_usdt} USDT\n`;
    message += `قیمت: ${order.price_per_unit.toLocaleString()} تومان\n`;
    message += `قیمت کل: ${(
      order.amount_usdt * order.price_per_unit
    ).toLocaleString()} تومان\n`;
    message += `وضعیت: ${status}\n`;
    if (order.network) {
      message += `شبکه: ${order.network}\n`;
    }
    if (order.description) {
      message += `توضیحات: ${order.description}\n`;
    }
    return message;
  },
};
