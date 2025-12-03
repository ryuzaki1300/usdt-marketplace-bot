import { Context, SessionFlavor } from "grammy";
import { SessionData } from "../../../types/session";
import { handleOfferCreate } from "../../conversations/createOffer";
import { coreClient } from "../../../core/coreClient";
import { offerMessages } from "../../../ui/messages/offers";
import { getMainMenuKeyboard } from "../../../ui/keyboards/mainMenu";
import { getUserData } from "../../middlewares/userData";

type MyContext = Context & SessionFlavor<SessionData>;

export async function handleOfferCommand(ctx: MyContext) {
  // Skip if user is in a wizard
  if (ctx.session.offerWizard || ctx.session.orderWizard) {
    return;
  }

  const command = ctx.message?.text;
  if (!command) {
    return;
  }

  // Extract order ID from command like "/offer_123" or "offer_123"
  const match = command.match(/^\/?offer_(\d+)$/);
  if (!match) {
    await ctx.reply("فرمت دستور نامعتبر است. لطفاً از فرمت /offer_<id> استفاده کنید.");
    return;
  }

  const orderId = parseInt(match[1], 10);
  if (isNaN(orderId)) {
    await ctx.reply("شناسه سفارش نامعتبر است.");
    return;
  }

  await handleOfferCreate(ctx, orderId);
}

export async function handleOfferReject(ctx: MyContext, offerId: number) {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.answerCallbackQuery("شناسایی کاربر امکان‌پذیر نیست.");
    return;
  }

  await ctx.answerCallbackQuery();

  try {
    // Get offer details to find taker info before rejecting
    const offer = await coreClient.getOfferById(offerId, userId);
    const offerData = offer as any;

    // Reject the offer
    await coreClient.rejectOffer(offerId, userId);

    // Get order details for notification
    const order = await coreClient.getOrderWithMaker(offerData.order_id, userId);
    const orderData = order as any;

    // Update the message to show it was rejected
    try {
      await ctx.editMessageText(
        ctx.callbackQuery?.message?.text + "\n\n❌ این پیشنهاد رد شد.",
        {
          reply_markup: undefined, // Remove buttons
        }
      );
    } catch {
      // If we can't edit, send a new message
      await ctx.reply(offerMessages.offerRejected.success);
    }

    // Send notification to taker if we have their telegram ID
    const takerTelegramUserId = offerData.taker?.telegram_user_id;
    if (takerTelegramUserId) {
      try {
        await ctx.api.sendMessage(
          takerTelegramUserId,
          offerMessages.offerRejected.byMaker({
            order: orderData,
            offer: {
              id: offerId,
              price_per_unit: offerData.price_per_unit,
            },
          })
        );
      } catch (error: any) {
        // If we can't send to taker (e.g., they blocked the bot), just log it
        console.error("Failed to notify taker:", error);
      }
    }
  } catch (error: any) {
    await ctx.reply(
      error.message || offerMessages.offerRejected.error,
      {
        reply_markup: getMainMenuKeyboard(false),
      }
    );
  }
}

export async function handleOfferAccept(ctx: MyContext, offerId: number) {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.answerCallbackQuery("شناسایی کاربر امکان‌پذیر نیست.");
    return;
  }

  await ctx.answerCallbackQuery({
    text: offerMessages.offerAccepted.placeholder,
    show_alert: true,
  });
}

