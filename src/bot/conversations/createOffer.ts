import { Context, SessionFlavor } from "grammy";
import { SessionData } from "../../types/session";
import { offerMessages } from "../../ui/messages/offers";
import { offerKeyboards } from "../../ui/keyboards/offers";
import { coreClient } from "../../core/coreClient";
import { validateNumberInput } from "../../utils/numberParser";
import { getUserData } from "../middlewares/userData";
import { kycMessages } from "../../ui/messages/kyc";
import { getKycRequiredKeyboard } from "../../ui/keyboards/kyc";
import { getMainMenuKeyboard } from "../../ui/keyboards/mainMenu";
import { env } from "../../config/env";

type MyContext = Context & SessionFlavor<SessionData>;

export async function handleOfferCreate(ctx: MyContext, orderId: number) {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply("شناسایی کاربر امکان‌پذیر نیست.");
    return;
  }

  const user = getUserData(ctx);
  if (user.kyc_status !== 'approved') {
    await ctx.reply(kycMessages.kycRequired, {
      reply_markup: getKycRequiredKeyboard(),
    });
    return;
  }

  try {
    // Fetch order details to get the order price
    const order = await coreClient.getOrderWithMaker(orderId, userId);
    const orderData = order as any;

    if (!orderData || orderData.status !== 'open') {
      // Try to answer callback query if it exists (from button click)
      try {
        await ctx.answerCallbackQuery({
          text: "این سفارش دیگر در دسترس نیست.",
          show_alert: true,
        });
      } catch {
        // Not a callback query, send a regular message
        await ctx.reply("این سفارش دیگر در دسترس نیست.");
      }
      return;
    }

    // Check if user is trying to make an offer on their own order
    const userProfile = await coreClient.getUserProfile(userId);
    const currentUserId = (userProfile as any)?.id;
    if (orderData.maker_id === currentUserId) {
      // Try to answer callback query if it exists (from button click)
      try {
        await ctx.answerCallbackQuery({
          text: "شما نمی‌توانید برای سفارش خودتان پیشنهاد بدهید.",
          show_alert: true,
        });
      } catch {
        // Not a callback query, send a regular message
        await ctx.reply("شما نمی‌توانید برای سفارش خودتان پیشنهاد بدهید.");
      }
      return;
    }

    // Check if user already has a pending offer for this order
    const offersResponse = await coreClient.getOrderOffers(orderId, userId, 1, 100);
    const existingOffer = (offersResponse.data || []).find(
      (offer: any) => 
        offer.taker_id === currentUserId && 
        offer.status === 'pending_maker_decision'
    );

    if (existingOffer) {
      // User already has a pending offer - show message with overwrite option
      const isCallbackQuery = ctx.callbackQuery !== undefined;
      
      if (isCallbackQuery) {
        await ctx.answerCallbackQuery();
      }

      try {
        if (isCallbackQuery) {
          await ctx.api.sendMessage(
            userId,
            offerMessages.existingOffer({
              order: orderData,
              offer: {
                id: existingOffer.id,
                price_per_unit: existingOffer.price_per_unit,
                comment: existingOffer.comment,
              },
            }),
            {
              reply_markup: offerKeyboards.existingOffer(orderId),
            }
          );
        } else {
          await ctx.reply(
            offerMessages.existingOffer({
              order: orderData,
              offer: {
                id: existingOffer.id,
                price_per_unit: existingOffer.price_per_unit,
                comment: existingOffer.comment,
              },
            }),
            {
              reply_markup: offerKeyboards.existingOffer(orderId),
            }
          );
        }
      } catch (error: any) {
        if (error.error_code === 403 || error.description?.includes('bot was blocked') || error.description?.includes('chat not found')) {
          if (isCallbackQuery) {
            try {
              await ctx.answerCallbackQuery({
                text: "لطفاً ابتدا ربات را در چت خصوصی شروع کنید.",
                url: `https://t.me/${env.BOT_USERNAME.replace('@', '')}?start=offer_${orderId}`,
              });
            } catch {
              await ctx.reply("لطفاً ابتدا ربات را در چت خصوصی شروع کنید.");
            }
          } else {
            await ctx.reply("لطفاً ابتدا ربات را در چت خصوصی شروع کنید.");
          }
        } else {
          if (isCallbackQuery) {
            try {
              await ctx.answerCallbackQuery({
                text: error.message || "خطا در ارسال پیام. لطفاً دوباره تلاش کنید.",
                show_alert: true,
              });
            } catch {
              await ctx.reply(error.message || "خطا در ارسال پیام. لطفاً دوباره تلاش کنید.");
            }
          } else {
            await ctx.reply(error.message || "خطا در ارسال پیام. لطفاً دوباره تلاش کنید.");
          }
        }
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
    
    try {
      if (isCallbackQuery) {
        // Called from button click - send to private chat
        await ctx.api.sendMessage(
          userId,
          offerMessages.createOffer.enterPrice(orderData.price_per_unit),
          {
            reply_markup: offerKeyboards.priceStep(),
          }
        );
      } else {
        // Called from command - reply in current chat
        await ctx.reply(
          offerMessages.createOffer.enterPrice(orderData.price_per_unit),
          {
            reply_markup: offerKeyboards.priceStep(),
          }
        );
      }
    } catch (error: any) {
      // If we can't send to user (e.g., they haven't started the bot), 
      // answer with a URL to start the bot
      if (error.error_code === 403 || error.description?.includes('bot was blocked') || error.description?.includes('chat not found')) {
        if (isCallbackQuery) {
          try {
            await ctx.answerCallbackQuery({
              text: "لطفاً ابتدا ربات را در چت خصوصی شروع کنید.",
              url: `https://t.me/${env.BOT_USERNAME.replace('@', '')}?start=offer_${orderId}`,
            });
          } catch {
            // Fallback
            await ctx.reply("لطفاً ابتدا ربات را در چت خصوصی شروع کنید.");
          }
        } else {
          await ctx.reply("لطفاً ابتدا ربات را در چت خصوصی شروع کنید.");
        }
      } else {
        if (isCallbackQuery) {
          try {
            await ctx.answerCallbackQuery({
              text: error.message || "خطا در ارسال پیام. لطفاً دوباره تلاش کنید.",
              show_alert: true,
            });
          } catch {
            await ctx.reply(error.message || "خطا در ارسال پیام. لطفاً دوباره تلاش کنید.");
          }
        } else {
          await ctx.reply(error.message || "خطا در ارسال پیام. لطفاً دوباره تلاش کنید.");
        }
      }
    }
  } catch (error: any) {
    // Try to answer callback query if it exists (from button click)
    try {
      await ctx.answerCallbackQuery({
        text: error.message || "خطا در دریافت اطلاعات سفارش.",
        show_alert: true,
      });
    } catch {
      // Not a callback query, send a regular message
      await ctx.reply(error.message || "خطا در دریافت اطلاعات سفارش.");
    }
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

export async function handleOfferComment(
  ctx: MyContext,
  comment?: string
) {
  if (
    !ctx.session.offerWizard ||
    ctx.session.offerWizard.step !== "comment"
  ) {
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
  try {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply("خطا در شناسایی کاربر.");
      return;
    }

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
  } catch (error: any) {
    await ctx.reply(
      error.message || offerMessages.createOffer.error,
      {
        reply_markup: getMainMenuKeyboard(false),
      }
    );
    ctx.session.offerWizard = undefined;
  }
}

export async function handleOfferConfirm(ctx: MyContext) {
  const userId = ctx.from?.id;
  if (!userId || !ctx.session.offerWizard) {
    await ctx.reply("خطا در پردازش درخواست.");
    return;
  }

  const wizard = ctx.session.offerWizard;
  if (!wizard.order_id || !wizard.price) {
    await ctx.reply("اطلاعات پیشنهاد ناقص است.");
    return;
  }

  try {
    let offerId: number;
    let isUpdate = false;

    // Check if we're updating an existing offer
    if (wizard.existing_offer_id) {
      // Update existing offer
      isUpdate = true;
      await coreClient.updateOffer(wizard.existing_offer_id, userId, {
        price_per_unit: wizard.price,
        comment: wizard.comment,
      });
      offerId = wizard.existing_offer_id;
    } else {
      // Create new offer
      const offerResponse = await coreClient.createOffer(userId, {
        order_id: wizard.order_id,
        price_per_unit: wizard.price,
        comment: wizard.comment,
      });
      offerId = (offerResponse as any)?.id || (offerResponse as any)?.data?.id;
    }

    // Get order details to notify the maker
    const order = await coreClient.getOrderWithMaker(wizard.order_id, userId);
    const orderData = order as any;

    // Get maker's telegram user ID from order
    // Try different possible structures: maker.telegram_user_id or maker_id with separate lookup
    let makerTelegramUserId = orderData.maker?.telegram_user_id;
    
    // If maker object doesn't have telegram_user_id, try to get it from maker relation
    if (!makerTelegramUserId && orderData.maker) {
      makerTelegramUserId = orderData.maker.telegram_user_id;
    }

    // Clear wizard state
    ctx.session.offerWizard = undefined;

    // Show success message
    if (isUpdate) {
      await ctx.editMessageText(offerMessages.offerUpdated.success);
    } else {
      await ctx.editMessageText(offerMessages.createOffer.success);
    }

    // Send notification to maker if we have their telegram ID
    // Only send notification for new offers, not updates (to avoid spam)
    if (makerTelegramUserId && !isUpdate) {
      try {
        await ctx.api.sendMessage(
          makerTelegramUserId,
          offerMessages.offerReceived({
            order: orderData,
            offer: {
              id: offerId,
              price_per_unit: wizard.price,
              comment: wizard.comment,
            },
          }),
          {
            reply_markup: offerKeyboards.offerReceived(offerId),
          }
        );
      } catch (error: any) {
        // If we can't send to maker (e.g., they blocked the bot), just log it
        console.error("Failed to notify maker:", error);
      }
    }

    // Send main menu
    try {
      const user = getUserData(ctx);
      const role = (user as any)?.role;
      const isAdmin = role === "admin" || role === "super_admin";
      await ctx.reply("منوی اصلی:", {
        reply_markup: getMainMenuKeyboard(isAdmin),
      });
    } catch (error) {
      // Ignore errors in sending main menu
    }
  } catch (error: any) {
    const wizard = ctx.session.offerWizard;
    const isUpdate = wizard?.existing_offer_id !== undefined;
    
    await ctx.editMessageText(
      error.message || (isUpdate ? offerMessages.offerUpdated.error : offerMessages.createOffer.error),
      {
        reply_markup: getMainMenuKeyboard(false),
      }
    );
    ctx.session.offerWizard = undefined;
  }
}

export async function handleOfferOverwrite(ctx: MyContext, orderId: number) {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.answerCallbackQuery("شناسایی کاربر امکان‌پذیر نیست.");
    return;
  }

  await ctx.answerCallbackQuery();

  try {
    // Get user profile to get internal user ID
    const userProfile = await coreClient.getUserProfile(userId);
    const currentUserId = (userProfile as any)?.id;

    // Get order details
    const order = await coreClient.getOrderWithMaker(orderId, userId);
    const orderData = order as any;

    // Find existing offer
    const offersResponse = await coreClient.getOrderOffers(orderId, userId, 1, 100);
    const existingOffer = (offersResponse.data || []).find(
      (offer: any) => 
        offer.taker_id === currentUserId && 
        offer.status === 'pending_maker_decision'
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

    await ctx.reply(offerMessages.createOffer.enterPrice(orderData.price_per_unit), {
      reply_markup: offerKeyboards.priceStep(),
    });
  } catch (error: any) {
    await ctx.reply(
      error.message || "خطا در شروع به‌روزرسانی پیشنهاد. لطفاً دوباره تلاش کنید.",
      {
        reply_markup: getMainMenuKeyboard(false),
      }
    );
  }
}

export async function handleOfferCancel(ctx: MyContext) {
  ctx.session.offerWizard = undefined;

  // Get user role for main menu
  const userId = ctx.from?.id;
  if (!userId) {
    try {
      await ctx.editMessageText(offerMessages.createOffer.cancelled, {
        reply_markup: getMainMenuKeyboard(false),
      });
    } catch {
      await ctx.reply(offerMessages.createOffer.cancelled, {
        reply_markup: getMainMenuKeyboard(false),
      });
    }
    return;
  }

  try {
    const user = getUserData(ctx);
    const role = (user as any)?.role;
    const isAdmin = role === "admin" || role === "super_admin";

    try {
      await ctx.editMessageText(offerMessages.createOffer.cancelled, {
        reply_markup: getMainMenuKeyboard(isAdmin),
      });
    } catch {
      // If we can't edit (e.g., message is too old), send a new message
      await ctx.reply(offerMessages.createOffer.cancelled, {
        reply_markup: getMainMenuKeyboard(isAdmin),
      });
    }
  } catch {
    try {
      await ctx.editMessageText(offerMessages.createOffer.cancelled, {
        reply_markup: getMainMenuKeyboard(false),
      });
    } catch {
      await ctx.reply(offerMessages.createOffer.cancelled, {
        reply_markup: getMainMenuKeyboard(false),
      });
    }
  }
}

