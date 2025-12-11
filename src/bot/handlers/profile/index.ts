import { Context, SessionFlavor } from "grammy";
import { SessionData } from "../../../types/session";
import { getUserData } from "../../middlewares/userData";
import { profileMessages } from "../../../ui/messages/profile";
import { getProfileKeyboard } from "../../../ui/keyboards/profile";

type MyContext = Context & SessionFlavor<SessionData>;

export async function handleProfile(ctx: MyContext) {
  const userId = ctx.from?.id;
  if (!userId) {
    const errorMsg = "خطا در شناسایی کاربر.";
    if (ctx.callbackQuery) {
      await ctx.editMessageText(errorMsg);
    } else {
      await ctx.reply(errorMsg);
    }
    return;
  }

  // Get user data from context (cached by middleware)
  const user = getUserData(ctx);
  if (!user) {
    const errorMsg = "خطا در دریافت اطلاعات کاربر. لطفاً دوباره تلاش کنید.";
    if (ctx.callbackQuery) {
      await ctx.editMessageText(errorMsg);
    } else {
      await ctx.reply(errorMsg);
    }
    return;
  }

  const userData = user as any;

  // Format profile message
  const message = profileMessages.profile({
    fullName: userData.full_name,
    phoneNumber: userData.phone_number,
    kycStatus: userData.kyc_status || "none",
  });

  // Get keyboard based on KYC status
  const keyboard = getProfileKeyboard(userData.kyc_status || "none");

  const messageOptions = {
    reply_markup: keyboard,
    parse_mode: "Markdown" as const,
  };

  // Try to edit message if it's a callback query, otherwise reply
  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(message, messageOptions);
    } catch (error) {
      // If editing fails, send a new message
      await ctx.reply(message, messageOptions);
    }
  } else {
    await ctx.reply(message, messageOptions);
  }
}
