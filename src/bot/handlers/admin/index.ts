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

type MyContext = Context & SessionFlavor<SessionData>;

export async function handleOpenDeals(ctx: MyContext) {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.editMessageText("خطا در شناسایی کاربر.");
    return;
  }

  try {
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

    // Get deal status for keyboard
    const dealStatus = dealData.status || "pending_admin";
    const currentDealId = dealData.id;

    // Send or edit message with status keyboard
    if (ctx.callbackQuery?.message) {
      // If it's a callback query (button click), try to edit the message
      try {
        await ctx.editMessageText(message, {
          reply_markup: getDealStatusKeyboard(dealStatus, currentDealId),
        });
      } catch (error) {
        // If we can't edit (e.g., message is too old), send a new message
        await ctx.reply(message, {
          reply_markup: getDealStatusKeyboard(dealStatus, currentDealId),
        });
      }
    } else {
      // If it's a new message (command), send a new message
      await ctx.reply(message, {
        reply_markup: getDealStatusKeyboard(dealStatus, currentDealId),
      });
    }
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
    await ctx.reply(
      "فرمت دستور نامعتبر است. لطفاً از فرمت /deal_<id> استفاده کنید."
    );
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

export async function handleUserProfile(ctx: MyContext, userId: number) {
  const telegramUserId = ctx.from?.id;
  if (!telegramUserId) {
    await ctx.reply("خطا در شناسایی کاربر.");
    return;
  }

  // Check if user is admin
  const user = getUserData(ctx);
  const role = (user as any)?.role;
  const isAdmin = role === "admin" || role === "super_admin";

  if (!isAdmin) {
    await ctx.reply("❌ شما دسترسی لازم برای مشاهده پروفایل کاربر را ندارید.");
    return;
  }

  try {
    // Get user details
    const userData = await coreClient.getUserById(userId, telegramUserId);
    const userInfo = userData as any;

    // Get successful trades count (deals with status completed)
    let successfulTrades = 0;
    try {
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
    } catch (error) {
      console.error("Error fetching successful trades:", error);
      // Continue with 0 trades if there's an error
    }

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
  } catch (error: any) {
    await ctx.reply(
      error.message || "خطا در دریافت اطلاعات کاربر. لطفاً دوباره تلاش کنید.",
      {
        reply_markup: getBackToAdminMenuKeyboard(),
      }
    );
  }
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

  // Extract user ID from command like "/user_123"
  const match = command.match(/^\/user_(\d+)$/);
  if (!match) {
    await ctx.reply(
      "فرمت دستور نامعتبر است. لطفاً از فرمت /user_<id> استفاده کنید."
    );
    return;
  }

  const userId = parseInt(match[1], 10);
  if (isNaN(userId)) {
    await ctx.reply("شناسه کاربر نامعتبر است.");
    return;
  }

  // Check if user is admin
  const user = getUserData(ctx);
  const role = (user as any)?.role;
  const isAdmin = role === "admin" || role === "super_admin";

  if (!isAdmin) {
    await ctx.reply("❌ شما دسترسی لازم برای مشاهده پروفایل کاربر را ندارید.");
    return;
  }

  await handleUserProfile(ctx, userId);
}

export async function handleDealApprove(ctx: MyContext, dealId: number) {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.answerCallbackQuery("خطا در شناسایی کاربر.");
    return;
  }

  // Check if user is admin
  const user = getUserData(ctx);
  const role = (user as any)?.role;
  const isAdmin = role === "admin" || role === "super_admin";

  if (!isAdmin) {
    await ctx.answerCallbackQuery("❌ شما دسترسی لازم برای این عملیات را ندارید.");
    return;
  }

  try {
    await coreClient.approveDeal(dealId, userId);
    await ctx.answerCallbackQuery("✅ معامله با موفقیت شروع شد.");

    // Refresh deal details view
    await handleDealDetails(ctx, dealId);
  } catch (error: any) {
    await ctx.answerCallbackQuery(
      error.message || "خطا در شروع معامله. لطفاً دوباره تلاش کنید."
    );
  }
}

export async function handleDealComplete(ctx: MyContext, dealId: number) {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.answerCallbackQuery("خطا در شناسایی کاربر.");
    return;
  }

  // Check if user is admin
  const user = getUserData(ctx);
  const role = (user as any)?.role;
  const isAdmin = role === "admin" || role === "super_admin";

  if (!isAdmin) {
    await ctx.answerCallbackQuery("❌ شما دسترسی لازم برای این عملیات را ندارید.");
    return;
  }

  try {
    await coreClient.completeDeal(dealId, userId);
    await ctx.answerCallbackQuery("✅ معامله با موفقیت تکمیل شد.");

    // Refresh deal details view
    await handleDealDetails(ctx, dealId);
  } catch (error: any) {
    await ctx.answerCallbackQuery(
      error.message || "خطا در تکمیل معامله. لطفاً دوباره تلاش کنید."
    );
  }
}

export async function handleDealCancel(ctx: MyContext, dealId: number) {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.answerCallbackQuery("خطا در شناسایی کاربر.");
    return;
  }

  // Check if user is admin
  const user = getUserData(ctx);
  const role = (user as any)?.role;
  const isAdmin = role === "admin" || role === "super_admin";

  if (!isAdmin) {
    await ctx.answerCallbackQuery("❌ شما دسترسی لازم برای این عملیات را ندارید.");
    return;
  }

  try {
    await coreClient.cancelDeal(dealId, userId);
    await ctx.answerCallbackQuery("✅ معامله با موفقیت لغو شد.");

    // Refresh deal details view
    await handleDealDetails(ctx, dealId);
  } catch (error: any) {
    await ctx.answerCallbackQuery(
      error.message || "خطا در لغو معامله. لطفاً دوباره تلاش کنید."
    );
  }
}
