import { Context } from "grammy";
import { SessionFlavor } from "grammy";
import { SessionData } from "../../../types/session";
import { coreClient } from "../../../core/coreClient";
import { adminMessages } from "../../../ui/messages/admin";
import {
  getAdminMenuKeyboard,
  getBackToAdminMenuKeyboard,
  getUserProfileKeyboard,
  getDealStatusKeyboard,
} from "../../../ui/keyboards/admin";
import { getUserData } from "../../middlewares/userData";
import { defaultDateTime } from "../../../utils/date-helper";
import {
  requireUserId,
  safeAnswerCallbackQuery,
  safeEditOrReply,
  silentErrorHandling,
} from "../../utils/errorHandling";
import {
  requireAdmin,
  parseDealIdFromCommand,
  parseUserIdFromCommand,
} from "../../utils/validations";

type MyContext = Context & SessionFlavor<SessionData>;

export async function handleOpenDeals(ctx: MyContext) {
  const userId = requireUserId(ctx);

  // Get all pending_admin and in_progress deals
  const [pendingDealsResponse, inProgressDealsResponse] = await Promise.all([
    coreClient.getDeals(userId, {
      status: "pending_admin",
      page: 1,
      limit: 100,
    }),
    coreClient.getDeals(userId, {
      status: "in_progress",
      page: 1,
      limit: 100,
    }),
  ]);

  const pendingDealsData = pendingDealsResponse as any;
  const inProgressDealsData = inProgressDealsResponse as any;

  // Combine both arrays
  const deals = [
    ...(pendingDealsData.data || []),
    ...(inProgressDealsData.data || []),
  ];

  if (deals.length === 0) {
    await safeEditOrReply(
      ctx,
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

  await safeEditOrReply(ctx, message, {
    reply_markup: getBackToAdminMenuKeyboard(),
  });
}

export async function handleDealDetails(ctx: MyContext, dealId: number) {
  const userId = requireUserId(ctx);
  requireAdmin(ctx);

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
    await silentErrorHandling(async () => {
      const orderData = await coreClient.getOrderWithMaker(orderId, userId);
      order = orderData as any;
    }, "fetching order details for deal");
  }

  if (offerId && (!offer.id || !offer.taker)) {
    await silentErrorHandling(async () => {
      const offerData = await coreClient.getOfferById(offerId, userId);
      offer = offerData as any;
    }, "fetching offer details for deal");
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

  // Get deal status for keyboard
  const dealStatus = dealData.status || "pending_admin";
  const currentDealId = dealData.id;

  // Send or edit message with status keyboard
  await safeEditOrReply(ctx, message, {
    reply_markup: getDealStatusKeyboard(dealStatus, currentDealId),
  });
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

  requireAdmin(ctx);
  const dealId = parseDealIdFromCommand(command);
  await handleDealDetails(ctx, dealId);
}

export async function handleUserProfile(ctx: MyContext, userId: number) {
  const telegramUserId = requireUserId(ctx);
  requireAdmin(ctx);

  // Get user details
  const userData = await coreClient.getUserById(userId, telegramUserId);
  const userInfo = userData as any;

  // Get successful trades count (deals with status completed)
  let successfulTrades = 0;
  await silentErrorHandling(async () => {
    // Get deals where user is maker or taker and status is completed
    const makerDeals = await coreClient.getDeals(telegramUserId, {
      maker_id: userId,
      status: "completed",
      page: 1,
      limit: 100,
    });
    const takerDeals = await coreClient.getDeals(telegramUserId, {
      taker_id: userId,
      status: "completed",
      page: 1,
      limit: 100,
    });

    const makerDealsData = makerDeals as any;
    const takerDealsData = takerDeals as any;

    // Count unique deals (user might be both maker and taker in different deals)
    const dealIds = new Set();
    (makerDealsData.data || []).forEach((deal: any) => dealIds.add(deal.id));
    (takerDealsData.data || []).forEach((deal: any) => dealIds.add(deal.id));
    successfulTrades = dealIds.size;
  }, "fetching successful trades count");

  // Format message using adminMessages.userProfile
  const message = adminMessages.userProfile({
    user: userInfo,
    successfulTrades: successfulTrades,
  });

  // Send message with keyboard
  await ctx.reply(message, {
    reply_markup: getUserProfileKeyboard(),
    parse_mode: "Markdown",
  });
}

export async function handleUserCommand(ctx: MyContext) {
  // Skip if user is in a wizard
  if (ctx.session.orderWizard || ctx.session.offerWizard) {
    return;
  }

  const command = ctx.message?.text;
  if (!command) {
    return;
  }

  requireAdmin(ctx);
  const userId = parseUserIdFromCommand(command);
  await handleUserProfile(ctx, userId);
}

export async function handleDealApprove(ctx: MyContext, dealId: number) {
  const userId = requireUserId(ctx);
  requireAdmin(ctx);

  await coreClient.approveDeal(dealId, userId);
  await safeAnswerCallbackQuery(ctx, {
    text: "✅ معامله با موفقیت شروع شد.",
  });

  // Refresh deal details view
  await handleDealDetails(ctx, dealId);
}

export async function handleDealComplete(ctx: MyContext, dealId: number) {
  const userId = requireUserId(ctx);
  requireAdmin(ctx);

  await coreClient.completeDeal(dealId, userId);
  await safeAnswerCallbackQuery(ctx, {
    text: "✅ معامله با موفقیت تکمیل شد.",
  });

  // Refresh deal details view
  await handleDealDetails(ctx, dealId);
}

export async function handleDealCancel(ctx: MyContext, dealId: number) {
  const userId = requireUserId(ctx);
  requireAdmin(ctx);

  await coreClient.cancelDeal(dealId, userId);
  await safeAnswerCallbackQuery(ctx, {
    text: "✅ معامله با موفقیت لغو شد.",
  });

  // Refresh deal details view
  await handleDealDetails(ctx, dealId);
}
