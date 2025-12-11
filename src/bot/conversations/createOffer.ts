import { Context, SessionFlavor } from "grammy";
import { SessionData } from "../../types/session";
import { offerMessages } from "../../ui/messages/offers";
import { offerKeyboards } from "../../ui/keyboards/offers";
import { coreClient } from "../../core/coreClient";
import { validateNumberInput } from "../../utils/numberParser";
import { getUserData } from "../middlewares/userData";
import { getMainMenuKeyboard } from "../../ui/keyboards/mainMenu";
import { env } from "../../config/env";
import {
  requireUserId,
  safeAnswerCallbackQuery,
  safeSendMessageWithFallback,
  safeEditOrReply,
  silentErrorHandling,
} from "../utils/errorHandling";
import { requireApprovedKyc } from "../utils/validations";

type MyContext = Context & SessionFlavor<SessionData>;

export async function handleOfferCreate(ctx: MyContext, orderId: number) {
  const userId = requireUserId(ctx);
  requireApprovedKyc(ctx);

  // Fetch order details to get the order price
  const order = await coreClient.getOrderWithMaker(orderId, userId);
  const orderData = order as any;

  if (!orderData || orderData.status !== "open") {
    await safeAnswerCallbackQuery(ctx, {
      text: "این سفارش دیگر در دسترس نیست.",
      show_alert: true,
    });
    await safeEditOrReply(ctx, "این سفارش دیگر در دسترس نیست.");
    return;
  }

  // Check if user is trying to make an offer on their own order
  const userProfile = await coreClient.getUserProfile(userId);
  const currentUserId = (userProfile as any)?.id;
  if (orderData.maker_id === currentUserId) {
    await safeAnswerCallbackQuery(ctx, {
      text: "شما نمی‌توانید برای سفارش خودتان پیشنهاد بدهید.",
      show_alert: true,
    });
    await safeEditOrReply(
      ctx,
      "شما نمی‌توانید برای سفارش خودتان پیشنهاد بدهید."
    );
    return;
  }

  // Check if user already has a pending offer for this order
  const offersResponse = await coreClient.getOrderOffers(
    orderId,
    userId,
    1,
    100
  );
  const existingOffer = (offersResponse.data || []).find(
    (offer: any) =>
      offer.taker_id === currentUserId &&
      offer.status === "pending_maker_decision"
  );

  if (existingOffer) {
    // User already has a pending offer - show message with overwrite option
    await safeAnswerCallbackQuery(ctx);

    const message = offerMessages.existingOffer({
      order: orderData,
      offer: {
        id: existingOffer.id,
        price_per_unit: existingOffer.price_per_unit,
        comment: existingOffer.comment,
      },
    });
    const keyboard = offerKeyboards.existingOffer(orderId);

    const isCallbackQuery = ctx.callbackQuery !== undefined;
    const fallbackUrl = `https://t.me/${env.BOT_USERNAME.replace(
      "@",
      ""
    )}?start=offer_${orderId}`;

    if (isCallbackQuery) {
      await safeSendMessageWithFallback(ctx, userId, message, {
        reply_markup: keyboard,
        fallbackUrl,
        fallbackText: "لطفاً ابتدا ربات را در چت خصوصی شروع کنید.",
      });
    } else {
      await ctx.reply(message, { reply_markup: keyboard });
    }
    return;
  }

  // Initialize wizard state for new offer
  ctx.session.offerWizard = {
    order_id: orderId,
    order_price: orderData.price_per_unit,
    step: "price",
  };

  // Send message to user's private chat
  // If called from callback query (button click), send to private chat
  // If called from command, reply in current chat
  const isCallbackQuery = ctx.callbackQuery !== undefined;
  const message = offerMessages.createOffer.enterPrice(
    orderData.price_per_unit
  );
  const keyboard = offerKeyboards.priceStep();
  const fallbackUrl = `https://t.me/${env.BOT_USERNAME.replace(
    "@",
    ""
  )}?start=offer_${orderId}`;

  if (isCallbackQuery) {
    // Called from button click - send to private chat
    await safeSendMessageWithFallback(ctx, userId, message, {
      reply_markup: keyboard,
      fallbackUrl,
      fallbackText: "لطفاً ابتدا ربات را در چت خصوصی شروع کنید.",
    });
  } else {
    // Called from command - reply in current chat
    await ctx.reply(message, { reply_markup: keyboard });
  }
}

export async function handleOfferPrice(ctx: MyContext, priceText?: string) {
  if (!ctx.session.offerWizard || ctx.session.offerWizard.step !== "price") {
    return;
  }

  // If price is provided, validate it
  if (priceText && priceText.trim() !== "") {
    const { isValid, number: price } = validateNumberInput(priceText);
    if (!isValid) {
      await ctx.reply(offerMessages.createOffer.invalidPrice);
      return;
    }
    ctx.session.offerWizard.price = price;
  } else {
    // Use order price as default if skipped
    ctx.session.offerWizard.price = ctx.session.offerWizard.order_price;
  }

  ctx.session.offerWizard.step = "comment";

  await ctx.reply(offerMessages.createOffer.enterComment, {
    reply_markup: offerKeyboards.commentStep(),
  });
}

export async function handleOfferComment(ctx: MyContext, comment?: string) {
  if (!ctx.session.offerWizard || ctx.session.offerWizard.step !== "comment") {
    return;
  }

  if (comment && comment.trim() !== "") {
    ctx.session.offerWizard.comment = comment.trim();
  }

  // Validate that required fields are present
  const wizard = ctx.session.offerWizard;
  if (!wizard.order_id || !wizard.price) {
    await ctx.reply("خطا در پردازش اطلاعات. لطفاً دوباره شروع کنید.");
    ctx.session.offerWizard = undefined;
    return;
  }

  ctx.session.offerWizard.step = "summary";

  // Fetch order details for summary
  const userId = requireUserId(ctx);
  const order = await coreClient.getOrderWithMaker(wizard.order_id, userId);
  const orderData = order as any;

  const summary = offerMessages.createOffer.summary({
    order: orderData,
    price: wizard.price!,
    comment: wizard.comment,
  });

  await ctx.reply(summary, {
    reply_markup: offerKeyboards.confirmOffer(),
  });
}

export async function handleOfferConfirm(ctx: MyContext) {
  const userId = requireUserId(ctx);
  if (!ctx.session.offerWizard) {
    await ctx.reply("خطا در پردازش درخواست.");
    return;
  }

  const wizard = ctx.session.offerWizard;
  if (!wizard.order_id || !wizard.price) {
    await ctx.reply("اطلاعات پیشنهاد ناقص است.");
    return;
  }

  // Store price in a variable to satisfy TypeScript
  const price = wizard.price;
  const orderId = wizard.order_id;

  let offerId: number;
  let isUpdate = false;

  // Check if we're updating an existing offer
  if (wizard.existing_offer_id) {
    // Update existing offer
    isUpdate = true;
    await coreClient.updateOffer(wizard.existing_offer_id, userId, {
      price_per_unit: price,
      comment: wizard.comment,
    });
    offerId = wizard.existing_offer_id;
  } else {
    // Create new offer
    const offerResponse = await coreClient.createOffer(userId, {
      order_id: orderId,
      price_per_unit: price,
      comment: wizard.comment,
    });
    offerId = (offerResponse as any)?.id || (offerResponse as any)?.data?.id;
  }

  // Get order details to notify the maker
  const order = await coreClient.getOrderWithMaker(orderId, userId);
  const orderData = order as any;

  // Get maker's telegram user ID from order
  const makerTelegramUserId = orderData.maker?.telegram_user_id;

  // Clear wizard state
  ctx.session.offerWizard = undefined;

  // Show success message
  const successMessage = isUpdate
    ? offerMessages.offerUpdated.success
    : offerMessages.createOffer.success;
  await safeEditOrReply(ctx, successMessage);

  // Send notification to maker if we have their telegram ID
  // Only send notification for new offers, not updates (to avoid spam)
  if (makerTelegramUserId && !isUpdate) {
    await silentErrorHandling(async () => {
      await ctx.api.sendMessage(
        makerTelegramUserId,
        offerMessages.offerReceived({
          order: orderData,
          offer: {
            id: offerId,
            price_per_unit: price,
            comment: wizard.comment,
          },
        }),
        {
          reply_markup: offerKeyboards.offerReceived(offerId),
        }
      );
    }, "notifying maker about new offer");
  }

  // Send main menu
  await silentErrorHandling(async () => {
    const user = getUserData(ctx);
    const role = (user as any)?.role;
    const isAdmin = role === "admin" || role === "super_admin";
    await ctx.reply("منوی اصلی:", {
      reply_markup: getMainMenuKeyboard(isAdmin),
    });
  }, "sending main menu");
}

export async function handleOfferOverwrite(ctx: MyContext, orderId: number) {
  const userId = requireUserId(ctx);
  await safeAnswerCallbackQuery(ctx);

  // Get user profile to get internal user ID
  const userProfile = await coreClient.getUserProfile(userId);
  const currentUserId = (userProfile as any)?.id;

  // Get order details
  const order = await coreClient.getOrderWithMaker(orderId, userId);
  const orderData = order as any;

  // Find existing offer
  const offersResponse = await coreClient.getOrderOffers(
    orderId,
    userId,
    1,
    100
  );
  const existingOffer = (offersResponse.data || []).find(
    (offer: any) =>
      offer.taker_id === currentUserId &&
      offer.status === "pending_maker_decision"
  );

  if (!existingOffer) {
    await ctx.reply("پیشنهاد موجود یافت نشد. لطفاً دوباره تلاش کنید.");
    return;
  }

  // Initialize wizard state for overwriting
  ctx.session.offerWizard = {
    order_id: orderId,
    order_price: orderData.price_per_unit,
    existing_offer_id: existingOffer.id,
    step: "price",
  };

  await ctx.reply(
    offerMessages.createOffer.enterPrice(orderData.price_per_unit),
    {
      reply_markup: offerKeyboards.priceStep(),
    }
  );
}

export async function handleOfferCancel(ctx: MyContext) {
  ctx.session.offerWizard = undefined;

  // Get user role for main menu
  const user = getUserData(ctx);
  const role = (user as any)?.role;
  const isAdmin = role === "admin" || role === "super_admin";

  await safeEditOrReply(ctx, offerMessages.createOffer.cancelled, {
    reply_markup: getMainMenuKeyboard(isAdmin),
  });
}
