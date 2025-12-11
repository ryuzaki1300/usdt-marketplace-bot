import { Context, SessionFlavor } from "grammy";
import { SessionData } from "../../../types/session";
import { getUserData } from "../../middlewares/userData";
import { profileMessages } from "../../../ui/messages/profile";
import { getProfileKeyboard } from "../../../ui/keyboards/profile";
import { requireUserId, safeEditOrReply } from "../../utils/errorHandling";

type MyContext = Context & SessionFlavor<SessionData>;

export async function handleProfile(ctx: MyContext) {
  requireUserId(ctx);

  // Get user data from context (cached by middleware)
  const user = getUserData(ctx);
  if (!user) {
    throw new Error("خطا در دریافت اطلاعات کاربر. لطفاً دوباره تلاش کنید.");
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

  // Use safeEditOrReply to handle both edit and reply cases
  await safeEditOrReply(ctx, message, {
    reply_markup: keyboard,
    parse_mode: "Markdown",
  });
}
