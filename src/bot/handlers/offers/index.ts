import { Context, SessionFlavor } from "grammy";
import { SessionData } from "../../../types/session";
import { handleOfferCreate } from "../../conversations/createOffer";
import { coreClient } from "../../../core/coreClient";
import { offerMessages } from "../../../ui/messages/offers";
import { getMainMenuKeyboard } from "../../../ui/keyboards/mainMenu";
import { getUserData } from "../../middlewares/userData";
import { channelMessages } from "../../../ui/messages/channel";
import { channelKeyboards } from "../../../ui/keyboards/channel";
import { adminMessages } from "../../../ui/messages/admin";
import { env } from "../../../config/env";

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

  await ctx.answerCallbackQuery();

  try {
    // Get offer details to find order_id and taker info
    const offer = await coreClient.getOfferById(offerId, userId);
    const offerData = offer as any;

    if (!offerData.order_id) {
      throw new Error("اطلاعات پیشنهاد ناقص است.");
    }

    // Get order details
    const order = await coreClient.getOrderWithMaker(offerData.order_id, userId);
    const orderData = order as any;

    // Create the deal
    const dealResponse = await coreClient.createDeal(userId, {
      order_id: offerData.order_id,
      offer_id: offerId,
    });
    const dealData = dealResponse as any;
    const dealId = dealData.id || dealData.data?.id;

    // Get full deal details including maker and taker
    const deal = await coreClient.getDealById(dealId, userId);
    const dealFullData = deal as any;

    // Update the message to show it was accepted
    try {
      await ctx.editMessageText(
        (ctx.callbackQuery?.message?.text || "") + "\n\n✅ این پیشنهاد پذیرفته شد.",
        {
          reply_markup: undefined, // Remove buttons
        }
      );
    } catch {
      // If we can't edit, send a new message
      await ctx.reply(offerMessages.offerAccepted.success);
    }

    // Send notification to maker (the one who accepted)
    const makerTelegramUserId = orderData.maker?.telegram_user_id;
    if (makerTelegramUserId) {
      try {
        await ctx.api.sendMessage(
          makerTelegramUserId,
          offerMessages.offerAccepted.toMaker({
            order: orderData,
            offer: {
              id: offerId,
              price_per_unit: offerData.price_per_unit,
            },
          })
        );
      } catch (error: any) {
        console.error("Failed to notify maker:", error);
      }
    }

    // Send notification to taker (the one who made the offer)
    const takerTelegramUserId = offerData.taker?.telegram_user_id;
    if (takerTelegramUserId) {
      try {
        await ctx.api.sendMessage(
          takerTelegramUserId,
          offerMessages.offerAccepted.toTaker({
            order: orderData,
            offer: {
              id: offerId,
              price_per_unit: offerData.price_per_unit,
            },
          })
        );
      } catch (error: any) {
        console.error("Failed to notify taker:", error);
      }
    }

    // Update order status in channel
    try {
      const telegramMeta = await coreClient.getOrderTelegramMetaByOrderId(offerData.order_id);
      const meta = telegramMeta as any;

      if (meta && meta.chat_id && meta.message_id) {
        // Update order status to matched for message formatting
        const updatedOrderData = {
          ...orderData,
          status: "matched",
        };

        // Edit the channel message to update status
        await ctx.api.editMessageText(
          meta.chat_id.toString(),
          meta.message_id,
          channelMessages.orderCreated(updatedOrderData),
          {
            reply_markup: channelKeyboards.orderCreated(updatedOrderData),
          }
        );
      }
    } catch (error: any) {
      console.error("Failed to edit channel message:", error);
    }

    // Get all admins and super admins and notify them
    try {
      // Get user profile to check if we can access admin endpoints
      const currentUser = await coreClient.getUserProfile(userId);
      const currentUserRole = (currentUser as any)?.role;

      // Try to get admins if current user is admin or super_admin
      if (currentUserRole === "admin" || currentUserRole === "super_admin") {
        // Get all admins and super_admins using admins_only parameter
        let admins: any[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          try {
            const usersResponse = await coreClient.getAllUsers(userId, page, 100, true);
            const usersData = usersResponse as any;
            admins = admins.concat(usersData.data || []);
            hasMore = usersData.hasNext || false;
            page++;
          } catch (error: any) {
            // If we can't get more users, stop trying
            hasMore = false;
            if (error.statusCode !== 403) {
              // Log non-permission errors
              console.error("Error fetching admins:", error);
            }
          }
        }

        // Get maker and taker details from deal
        const maker = dealFullData.maker || orderData.maker;
        const taker = dealFullData.taker || offerData.taker;

        // Send notification to all admins
        for (const admin of admins) {
          const adminTelegramUserId = admin.telegram_user_id;
          if (adminTelegramUserId) {
            try {
              await ctx.api.sendMessage(
                adminTelegramUserId,
                adminMessages.newDeal({
                  deal: dealFullData,
                  order: orderData,
                  offer: offerData,
                  maker: maker || {},
                  taker: taker || {},
                })
              );
            } catch (error: any) {
              console.error(`Failed to notify admin ${adminTelegramUserId}:`, error);
            }
          }
        }
      } else {
        // If current user is not admin, we can't access the users endpoint
        // This is expected - the maker might not be an admin
        // The deal will still be created and maker/taker will be notified
        console.log("Current user is not admin - admin notifications skipped (this is expected)");
      }
    } catch (error: any) {
      // If we can't notify admins, log it but don't fail the whole operation
      // The deal is already created and maker/taker are notified
      if (error.statusCode === 403) {
        console.log("Cannot access admin endpoints - admin notifications skipped (this is expected)");
      } else {
        console.error("Failed to notify admins:", error);
      }
    }
  } catch (error: any) {
    await ctx.reply(
      error.message || offerMessages.offerAccepted.error,
      {
        reply_markup: getMainMenuKeyboard(false),
      }
    );
  }
}

