import { Context, SessionFlavor } from "grammy";
import { SessionData } from "../../../types/session";
import { getUserData } from "../../middlewares/userData";
import { profileMessages } from "../../../ui/messages/profile";
import { kycKeyboards } from "../../../ui/keyboards/profile";
import { getProfileKeyboard } from "../../../ui/keyboards/profile";
import { coreClient } from "../../../core/coreClient";
import { requireUserId, safeEditOrReply, safeSendMessage, silentErrorHandling } from "../../utils/errorHandling";
import { requireAdmin } from "../../utils/validations";
import { handleProfileEdit } from "../../conversations/editProfile";
import { getMainMenuKeyboard } from "../../../ui/keyboards/mainMenu";

type MyContext = Context & SessionFlavor<SessionData>;

/**
 * Handle KYC request - check if user has required data, then show confirmation or redirect to edit profile
 */
export async function handleKycRequest(ctx: MyContext) {
  const userId = requireUserId(ctx);

  // Get user data from context (cached by middleware)
  const user = getUserData(ctx);
  if (!user) {
    throw new Error("خطا در دریافت اطلاعات کاربر. لطفاً دوباره تلاش کنید.");
  }

  const userData = user as any;

  // Check if user has phone number and full name
  if (!userData.phone_number || !userData.full_name) {
    // User doesn't have required data, redirect to edit profile
    await safeEditOrReply(ctx, profileMessages.kyc.missingData);
    await handleProfileEdit(ctx);
    return;
  }

  // User has both, show confirmation message
  const message = profileMessages.kyc.checkData(
    userData.full_name,
    userData.phone_number
  );
  const keyboard = kycKeyboards.confirmation();

  await safeEditOrReply(ctx, message, {
    reply_markup: keyboard,
    parse_mode: "Markdown",
  });
}

/**
 * Handle KYC confirmation - submit KYC request and notify admins
 */
export async function handleKycConfirm(ctx: MyContext) {
  const userId = requireUserId(ctx);

  // Get user data from context
  const user = getUserData(ctx);
  if (!user) {
    throw new Error("خطا در دریافت اطلاعات کاربر. لطفاً دوباره تلاش کنید.");
  }

  const userData = user as any;

  // Check if user has phone number and full name
  if (!userData.phone_number || !userData.full_name) {
    await safeEditOrReply(ctx, profileMessages.kyc.missingData);
    return;
  }

  // Submit KYC request
  await coreClient.submitKyc(userId, {
    full_name: userData.full_name,
    phone_number: userData.phone_number,
  });

  // Fetch updated user data to get the latest info (including internal ID)
  const updatedUser = await coreClient.getUserProfile(userId);
  const updatedUserData = updatedUser as any;

  // Send confirmation message to user
  await safeEditOrReply(ctx, profileMessages.kyc.submitted);

  // Notify all admins
  await silentErrorHandling(async () => {
    // Get all admins using the public /users/admins endpoint
    let admins: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const usersResponse = await coreClient.getAllAdmins(page, 100);
        const usersData = usersResponse as any;
        admins = admins.concat(usersData.data || []);
        hasMore = usersData.hasNext || false;
        page++;
      } catch (error: any) {
        // If we can't get more users, stop trying
        hasMore = false;
        console.error("Error fetching admins for KYC notification:", error);
      }
    }

    // Send notification to all admins (excluding the current user if they're an admin)
    const adminMessage = profileMessages.kyc.adminNotification(
      updatedUserData.full_name,
      updatedUserData.phone_number
    );
    const adminKeyboard = kycKeyboards.adminReview(updatedUserData.id);

    for (const admin of admins) {
      const adminTelegramUserId = admin.telegram_user_id;
      // Don't notify the user who submitted the KYC if they're an admin
      if (adminTelegramUserId && adminTelegramUserId !== userId) {
        await silentErrorHandling(async () => {
          await safeSendMessage(
            ctx,
            adminTelegramUserId,
            adminMessage,
            {
              reply_markup: adminKeyboard,
              parse_mode: "Markdown",
            }
          );
        }, `notifying admin ${adminTelegramUserId} about KYC request`);
      }
    }
  }, "notifying admins about new KYC request");

  // Refresh profile view (updatedUserData already fetched above)

  const message = profileMessages.profile({
    fullName: updatedUserData.full_name,
    phoneNumber: updatedUserData.phone_number,
    kycStatus: updatedUserData.kyc_status || "none",
  });

  const keyboard = getProfileKeyboard(updatedUserData.kyc_status || "none");

  await ctx.reply(message, {
    reply_markup: keyboard,
    parse_mode: "Markdown",
  });
}

/**
 * Handle KYC cancellation
 */
export async function handleKycCancel(ctx: MyContext) {
  const userId = requireUserId(ctx);

  await safeEditOrReply(ctx, profileMessages.kyc.cancelled);

  // Get user data for profile view
  const user = getUserData(ctx);
  if (!user) {
    // Fallback to main menu
    const userData = await coreClient.getUserProfile(userId);
    const role = (userData as any)?.role;
    const isAdmin = role === "admin" || role === "super_admin";
    await ctx.reply("🔙 بازگشت به منوی اصلی", {
      reply_markup: getMainMenuKeyboard(isAdmin),
    });
    return;
  }

  const userData = user as any;

  const message = profileMessages.profile({
    fullName: userData.full_name,
    phoneNumber: userData.phone_number,
    kycStatus: userData.kyc_status || "none",
  });

  const keyboard = getProfileKeyboard(userData.kyc_status || "none");

  await ctx.reply(message, {
    reply_markup: keyboard,
    parse_mode: "Markdown",
  });
}

/**
 * Handle admin KYC approval
 */
export async function handleKycAdminApprove(ctx: MyContext, userId: number) {
  const adminUserId = requireUserId(ctx);
  requireAdmin(ctx);

  // Review KYC application
  await coreClient.reviewKyc(userId, adminUserId, {
    status: "approved",
  });

  await ctx.answerCallbackQuery({
    text: "✅ درخواست احراز هویت تایید شد.",
  });

  // Get user details to notify them
  await silentErrorHandling(async () => {
    const userData = await coreClient.getUserById(userId, adminUserId);
    const userInfo = userData as any;
    const userTelegramId = userInfo.telegram_user_id;

    if (userTelegramId) {
      await safeSendMessage(
        ctx,
        userTelegramId,
        profileMessages.kyc.approved
      );
    }
  }, "notifying user about KYC approval");

  // Update the admin's message
  await ctx.editMessageText(
    `✅ درخواست احراز هویت تایید شد.\n\nکاربر مطلع شد.`,
    {
      reply_markup: kycKeyboards.adminReview(userId),
    }
  );
}

/**
 * Handle admin KYC rejection
 */
export async function handleKycAdminReject(ctx: MyContext, userId: number) {
  const adminUserId = requireUserId(ctx);
  requireAdmin(ctx);

  // Review KYC application
  await coreClient.reviewKyc(userId, adminUserId, {
    status: "rejected",
  });

  await ctx.answerCallbackQuery({
    text: "❌ درخواست احراز هویت رد شد.",
  });

  // Get user details to notify them
  await silentErrorHandling(async () => {
    const userData = await coreClient.getUserById(userId, adminUserId);
    const userInfo = userData as any;
    const userTelegramId = userInfo.telegram_user_id;

    if (userTelegramId) {
      await safeSendMessage(
        ctx,
        userTelegramId,
        profileMessages.kyc.rejected
      );
    }
  }, "notifying user about KYC rejection");

  // Update the admin's message
  await ctx.editMessageText(
    `❌ درخواست احراز هویت رد شد.\n\nکاربر مطلع شد.`,
    {
      reply_markup: kycKeyboards.adminReview(userId),
    }
  );
}
