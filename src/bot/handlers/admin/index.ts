import { Context } from "grammy";
import { SessionFlavor } from "grammy";
import { SessionData } from "../../../types/session";
import { coreClient } from "../../../core/coreClient";
import { adminMessages } from "../../../ui/messages/admin";
import { getAdminMenuKeyboard, getBackToAdminMenuKeyboard } from "../../../ui/keyboards/admin";
import { getUserData } from "../../middlewares/userData";
import { defaultDateTime } from "../../../utils/date-helper";

type MyContext = Context & SessionFlavor<SessionData>;

export async function handleOpenDeals(ctx: MyContext) {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.editMessageText("خطا در شناسایی کاربر.");
    return;
  }

  try {
    // Get all pending_admin deals
    const dealsResponse = await coreClient.getDeals(userId, {
      status: "pending_admin",
      page: 1,
      limit: 100, // Get all pending deals
    });

    const dealsData = dealsResponse as any;
    const deals = dealsData.data || [];

    if (deals.length === 0) {
      await ctx.editMessageText(
        "📊 معاملات باز\n\nهیچ معامله‌ای در انتظار بررسی وجود ندارد.",
        {
          reply_markup: getAdminMenuKeyboard(
            (getUserData(ctx) as any)?.role === "super_admin"
          ),
        }
      );
      return;
    }

    // Format message with all deals
    let message = "📊 معاملات باز\n\n";

    deals.forEach((deal: any, index: number) => {
      // Date
      if (deal.created_at) {
        const date = new Date(deal.created_at);
        message += `${defaultDateTime()}\n`;
      }

      // Amount (from deal or order)
      const amount = deal.amount_usdt || deal.order?.amount_usdt || 0;
      message += `${amount.toLocaleString()} USDT\n`;

      // Price (from deal or offer)
      const price = deal.price_per_unit || deal.offer?.price_per_unit || 0;
      message += `${price.toLocaleString()} تومان\n`;

      // Total (from deal or calculated)
      const total = deal.total_price || amount * price;
      message += `${total.toLocaleString()} تومان\n`;

      // Deal link
      message += `/deal_${deal.id}\n`;

      // Add separator between deals
      if (index < deals.length - 1) {
        message += "\n";
      }
    });

    await ctx.editMessageText(message, {
      reply_markup: getBackToAdminMenuKeyboard(),
    });
  } catch (error: any) {
    await ctx.editMessageText(
      error.message || "خطا در دریافت معاملات باز. لطفاً دوباره تلاش کنید.",
      {
        reply_markup: getAdminMenuKeyboard(
          (getUserData(ctx) as any)?.role === "super_admin"
        ),
      }
    );
  }
}

export async function handleDealDetails(ctx: MyContext, dealId: number) {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply("خطا در شناسایی کاربر.");
    return;
  }

  // Check if user is admin
  const user = getUserData(ctx);
  const role = (user as any)?.role;
  const isAdmin = role === "admin" || role === "super_admin";
  
  if (!isAdmin) {
    await ctx.reply("❌ شما دسترسی لازم برای مشاهده جزئیات معامله را ندارید.");
    return;
  }

  try {
    // Get deal details
    const deal = await coreClient.getDealById(dealId, userId);
    const dealData = deal as any;

    // Extract order_id and offer_id from deal
    const orderId = dealData.order_id || dealData.order?.id;
    const offerId = dealData.offer_id || dealData.offer?.id;

    // Fetch order and offer details if not included in deal response
    let order = dealData.order || {};
    let offer = dealData.offer || {};

    if (orderId && (!order.id || !order.maker)) {
      try {
        const orderData = await coreClient.getOrderWithMaker(orderId, userId);
        order = orderData as any;
      } catch (error) {
        console.error("Error fetching order details:", error);
      }
    }

    if (offerId && (!offer.id || !offer.taker)) {
      try {
        const offerData = await coreClient.getOfferById(offerId, userId);
        offer = offerData as any;
      } catch (error) {
        console.error("Error fetching offer details:", error);
      }
    }

    // Extract maker and taker
    const maker = dealData.maker || order.maker || {};
    const taker = dealData.taker || offer.taker || {};

    // Format message using adminMessages.newDeal
    const message = adminMessages.newDeal({
      deal: dealData,
      order: order,
      offer: offer,
      maker: maker,
      taker: taker,
    });

    // Send message with back button
    await ctx.reply(message, {
      reply_markup: getBackToAdminMenuKeyboard(),
    });
  } catch (error: any) {
    await ctx.reply(
      error.message || "خطا در دریافت اطلاعات معامله. لطفاً دوباره تلاش کنید.",
      {
        reply_markup: getBackToAdminMenuKeyboard(),
      }
    );
  }
}

export async function handleDealCommand(ctx: MyContext) {
  // Skip if user is in a wizard
  if (ctx.session.orderWizard || ctx.session.offerWizard) {
    return;
  }

  const command = ctx.message?.text;
  if (!command) {
    return;
  }

  // Extract deal ID from command like "/deal_123"
  const match = command.match(/^\/deal_(\d+)$/);
  if (!match) {
    await ctx.reply("فرمت دستور نامعتبر است. لطفاً از فرمت /deal_<id> استفاده کنید.");
    return;
  }

  const dealId = parseInt(match[1], 10);
  if (isNaN(dealId)) {
    await ctx.reply("شناسه معامله نامعتبر است.");
    return;
  }

  // Check if user is admin
  const user = getUserData(ctx);
  const role = (user as any)?.role;
  const isAdmin = role === "admin" || role === "super_admin";
  
  if (!isAdmin) {
    await ctx.reply("❌ شما دسترسی لازم برای مشاهده جزئیات معامله را ندارید.");
    return;
  }

  await handleDealDetails(ctx, dealId);
}

