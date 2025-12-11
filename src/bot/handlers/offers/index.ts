import { Context, SessionFlavor } from "grammy";
import { SessionData } from "../../../types/session";
import { handleOfferCreate } from "../../conversations/createOffer";
import { coreClient } from "../../../core/coreClient";
import { offerMessages } from "../../../ui/messages/offers";
import { offerKeyboards } from "../../../ui/keyboards/offers";
import { getMainMenuKeyboard } from "../../../ui/keyboards/mainMenu";
import { getUserData } from "../../middlewares/userData";
import { channelMessages } from "../../../ui/messages/channel";
import { channelKeyboards } from "../../../ui/keyboards/channel";
import { adminMessages } from "../../../ui/messages/admin";
import { env } from "../../../config/env";
import { commonMessages } from "../../../ui/messages/common";
import {
  requireUserId,
  safeAnswerCallbackQuery,
  safeEditOrReply,
  safeSendMessage,
  safeEditChannelMessage,
  silentErrorHandling,
} from "../../utils/errorHandling";
import { parseOfferIdFromCommand } from "../../utils/validations";

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

  const offerId = parseOfferIdFromCommand(command);
  await handleOfferDetails(ctx, offerId);
}

export async function handleOfferReject(ctx: MyContext, offerId: number) {
  const userId = requireUserId(ctx);
  await safeAnswerCallbackQuery(ctx);

  // Get offer details to find taker info before rejecting
  const offer = await coreClient.getOfferById(offerId, userId);
  const offerData = offer as any;

  // Reject the offer
  await coreClient.rejectOffer(offerId, userId);

  // Get order details for notification
  const order = await coreClient.getOrderWithMaker(offerData.order_id, userId);
  const orderData = order as any;

  // Update the message to show it was rejected
  const rejectedMessage =
    (ctx.callbackQuery?.message?.text || "") + "\n\n❌ این پیشنهاد رد شد.";
  await safeEditOrReply(ctx, rejectedMessage, {
    reply_markup: undefined, // Remove buttons
  });

  // Send notification to taker if we have their telegram ID
  const takerTelegramUserId = offerData.taker?.telegram_user_id;
  if (takerTelegramUserId) {
    await silentErrorHandling(async () => {
      await safeSendMessage(
        ctx,
        takerTelegramUserId,
        offerMessages.offerRejected.byMaker({
          order: orderData,
          offer: {
            id: offerId,
            price_per_unit: offerData.price_per_unit,
          },
        })
      );
    }, "notifying taker about rejected offer");
  }
}

export async function handleOfferAccept(ctx: MyContext, offerId: number) {
  const userId = requireUserId(ctx);
  await safeAnswerCallbackQuery(ctx);

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
  const acceptedMessage =
    (ctx.callbackQuery?.message?.text || "") + "\n\n✅ این پیشنهاد پذیرفته شد.";
  await safeEditOrReply(ctx, acceptedMessage, {
    reply_markup: undefined, // Remove buttons
  });

  // Send notification to maker (the one who accepted)
  const makerTelegramUserId = orderData.maker?.telegram_user_id;
  if (makerTelegramUserId) {
    await silentErrorHandling(async () => {
      await safeSendMessage(
        ctx,
        makerTelegramUserId,
        offerMessages.offerAccepted.toMaker({
          order: orderData,
          offer: {
            id: offerId,
            price_per_unit: offerData.price_per_unit,
          },
        })
      );
    }, "notifying maker about accepted offer");
  }

  // Send notification to taker (the one who made the offer)
  const takerTelegramUserId = offerData.taker?.telegram_user_id;
  if (takerTelegramUserId) {
    await silentErrorHandling(async () => {
      await safeSendMessage(
        ctx,
        takerTelegramUserId,
        offerMessages.offerAccepted.toTaker({
          order: orderData,
          offer: {
            id: offerId,
            price_per_unit: offerData.price_per_unit,
          },
        })
      );
    }, "notifying taker about accepted offer");
  }

  // Update order status in channel
  await silentErrorHandling(async () => {
    const telegramMeta = await coreClient.getOrderTelegramMetaByOrderId(
      offerData.order_id
    );
    const meta = telegramMeta as any;

    if (meta && meta.chat_id && meta.message_id) {
      // Update order status to matched for message formatting
      const updatedOrderData = {
        ...orderData,
        status: "matched",
      };

      // Edit the channel message to update status
      await safeEditChannelMessage(
        ctx,
        meta.chat_id.toString(),
        meta.message_id,
        channelMessages.orderCreated(updatedOrderData),
        {
          reply_markup: channelKeyboards.orderCreated(updatedOrderData),
        }
      );
    }
  }, "updating channel message after offer acceptance");

  // Get all admins and super admins and notify them
  await silentErrorHandling(async () => {
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
          const usersResponse = await coreClient.getAllUsers(
            userId,
            page,
            100,
            true
          );
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
          await silentErrorHandling(async () => {
            await safeSendMessage(
              ctx,
              adminTelegramUserId,
              adminMessages.newDeal({
                deal: dealFullData,
                order: orderData,
                offer: offerData,
                maker: maker || {},
                taker: taker || {},
              })
            );
          }, `notifying admin ${adminTelegramUserId}`);
        }
      }
    }
  }, "notifying admins about new deal");
}

export async function handleMyOffers(ctx: MyContext) {
  const userId = requireUserId(ctx);

  // Get user offers with pending_maker_decision status
  const response = await coreClient.getUserOffers(userId);
  const offers = response as any;

  if (offers.length === 0) {
    // No offers
    await safeEditOrReply(ctx, offerMessages.myOffers.noOffers, {
      reply_markup: offerKeyboards.myOffersEmpty(),
    });
    return;
  }

  // Send all offers in a single message
  const message = offerMessages.myOffers.allOffers(offers);
  const keyboard = offerKeyboards.allOffers();

  await safeEditOrReply(ctx, message, {
    reply_markup: keyboard,
  });
}

export async function handleOfferDetails(ctx: MyContext, offerId: number) {
  const userId = requireUserId(ctx);
  await safeAnswerCallbackQuery(ctx);

  // Get offer details
  const offer = await coreClient.getOfferById(offerId, userId);
  const offerData = offer as any;

  // Build message with offer details
  const message = offerMessages.offerDetails.title(offerData);

  // Send as a new message
  await ctx.reply(message, {
    reply_markup: offerKeyboards.offerDetails(offerId),
  });
}

export async function handleCancelOffer(ctx: MyContext, offerId: number) {
  const userId = requireUserId(ctx);
  await safeAnswerCallbackQuery(ctx);

  // Get offer details before canceling to have the offer and order data
  const offer = await coreClient.getOfferById(offerId, userId);
  const offerData = offer as any;

  if (!offerData.order_id) {
    throw new Error("اطلاعات پیشنهاد ناقص است.");
  }

  // Get order details for notification
  const order = await coreClient.getOrderWithMaker(offerData.order_id, userId);
  const orderData = order as any;

  // Cancel the offer by updating status to canceled_by_taker
  await coreClient.updateOffer(offerId, userId, {
    status: "canceled_by_taker",
  });

  // Update the message to show it was canceled
  const canceledMessage =
    (ctx.callbackQuery?.message?.text || "") + "\n\n❌ این پیشنهاد لغو شد.";
  await safeEditOrReply(ctx, canceledMessage, {
    reply_markup: undefined, // Remove buttons
  });

  // Send home message and menu keyboard
  const user = getUserData(ctx);
  const isAdmin =
    (user as any)?.role === "admin" || (user as any)?.role === "super_admin";
  await ctx.reply(commonMessages.welcome(), {
    reply_markup: getMainMenuKeyboard(isAdmin),
  });

  // Send notification to maker if we have their telegram ID
  const makerTelegramUserId = orderData.maker?.telegram_user_id;
  if (makerTelegramUserId) {
    await silentErrorHandling(async () => {
      await safeSendMessage(
        ctx,
        makerTelegramUserId,
        offerMessages.offerCanceledByTaker({
          order: orderData,
          offer: {
            id: offerId,
            price_per_unit: offerData.price_per_unit,
          },
        })
      );
    }, "notifying maker about canceled offer");
  }
}

