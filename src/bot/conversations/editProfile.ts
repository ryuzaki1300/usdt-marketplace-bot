import { Context, SessionFlavor } from "grammy";
import { SessionData } from "../../types/session";
import { profileMessages } from "../../ui/messages/profile";
import { profileEditKeyboards } from "../../ui/keyboards/profile";
import { coreClient } from "../../core/coreClient";
import { validatePhoneNumber } from "../../utils/phoneValidator";
import { getUserData } from "../middlewares/userData";
import { getMainMenuKeyboard } from "../../ui/keyboards/mainMenu";
import { requireUserId, safeEditOrReply } from "../utils/errorHandling";
import { requireWizardState } from "../utils/validations";

type MyContext = Context & SessionFlavor<SessionData>;

export async function handleProfileEdit(ctx: MyContext) {
  const userId = requireUserId(ctx);

  // Get user data from context (cached by middleware)
  const user = getUserData(ctx);
  if (!user) {
    throw new Error("خطا در دریافت اطلاعات کاربر. لطفاً دوباره تلاش کنید.");
  }

  const userData = user as any;

  // Initialize wizard state
  ctx.session.profileWizard = {
    step: "full_name",
  };

  const message = profileMessages.editProfile.enterFullName(userData.full_name);
  const keyboard = profileEditKeyboards.fullNameStep(userData.full_name);

  await safeEditOrReply(ctx, message, {
    reply_markup: keyboard,
  });
}

export async function handleProfileUseCurrentFullName(ctx: MyContext) {
  requireWizardState(ctx.session.profileWizard);

  if (ctx.session.profileWizard?.step !== "full_name") {
    return;
  }

  const user = getUserData(ctx);
  if (!user) {
    await ctx.reply("خطا در دریافت اطلاعات کاربر.");
    ctx.session.profileWizard = undefined;
    return;
  }

  const userData = user as any;
  ctx.session.profileWizard.full_name = userData.full_name;
  ctx.session.profileWizard.step = "phone_number";

  const message = profileMessages.editProfile.enterPhoneNumber(
    userData.phone_number
  );
  const keyboard = profileEditKeyboards.phoneNumberStep(userData.phone_number);

  // Use a new message so we can attach a reply keyboard (contact request)
  await ctx.reply(message, {
    reply_markup: keyboard,
  });
}

export async function handleProfileFullName(ctx: MyContext, fullName: string) {
  if (
    !ctx.session.profileWizard ||
    ctx.session.profileWizard.step !== "full_name"
  ) {
    return;
  }

  // Check if user clicked cancel
  if (fullName === "❌ لغو" || fullName === "لغو") {
    await handleProfileEditCancel(ctx);
    return;
  }

  const trimmedFullName = fullName.trim();
  if (!trimmedFullName || trimmedFullName.length === 0) {
    await ctx.reply("لطفاً نام کامل خود را وارد کنید.");
    return;
  }

  if (trimmedFullName.length > 150) {
    await ctx.reply("نام کامل نمی‌تواند بیشتر از ۱۵۰ کاراکتر باشد.");
    return;
  }

  ctx.session.profileWizard.full_name = trimmedFullName;
  ctx.session.profileWizard.step = "phone_number";

  const user = getUserData(ctx);
  const userData = user as any;

  const message = profileMessages.editProfile.enterPhoneNumber(
    userData.phone_number
  );
  const keyboard = profileEditKeyboards.phoneNumberStep(userData.phone_number);

  await ctx.reply(message, {
    reply_markup: keyboard,
  });
}

export async function handleProfileUseCurrentPhoneNumber(ctx: MyContext) {
  requireWizardState(ctx.session.profileWizard);

  if (ctx.session.profileWizard?.step !== "phone_number") {
    return;
  }

  const user = getUserData(ctx);
  if (!user) {
    await ctx.reply("خطا در دریافت اطلاعات کاربر.");
    ctx.session.profileWizard = undefined;
    return;
  }

  const userData = user as any;

  if (!userData.phone_number) {
    await ctx.reply("شماره تلفن فعلی موجود نیست. لطفاً شماره جدید وارد کنید.");
    return;
  }

  ctx.session.profileWizard.phone_number = userData.phone_number;
  await handleProfileConfirm(ctx);
}

export async function handleProfilePhoneNumberFromContact(ctx: MyContext) {
  requireWizardState(ctx.session.profileWizard);

  if (ctx.session.profileWizard?.step !== "phone_number") {
    return;
  }

  if (!ctx.message?.contact?.phone_number) {
    await ctx.reply("خطا در دریافت شماره تلفن. لطفاً دوباره تلاش کنید.");
    return;
  }

  const phoneNumber = ctx.message.contact.phone_number;

  // Validate phone number
  const validation = validatePhoneNumber(phoneNumber);
  if (!validation.isValid || !validation.normalizedPhone) {
    await ctx.reply(profileMessages.editProfile.invalidPhoneNumber, {
      reply_markup: profileEditKeyboards.phoneNumberStep(
        getUserData(ctx)?.phone_number as string | undefined
      ),
    });
    return;
  }

  ctx.session.profileWizard.phone_number = validation.normalizedPhone;
  await handleProfileConfirm(ctx);
}

export async function handleProfilePhoneNumber(
  ctx: MyContext,
  phoneNumber: string
) {
  if (
    !ctx.session.profileWizard ||
    ctx.session.profileWizard.step !== "phone_number"
  ) {
    return;
  }

  // Check if user clicked "use current phone number" button
  if (phoneNumber.startsWith("استفاده از:")) {
    await handleProfileUseCurrentPhoneNumber(ctx);
    return;
  }

  // Check if user clicked cancel
  if (phoneNumber === "❌ لغو") {
    await handleProfileEditCancel(ctx);
    return;
  }

  // Validate phone number
  const validation = validatePhoneNumber(phoneNumber);
  if (!validation.isValid || !validation.normalizedPhone) {
    const user = getUserData(ctx);
    const userData = user as any;

    await ctx.reply(profileMessages.editProfile.invalidPhoneNumber, {
      reply_markup: profileEditKeyboards.phoneNumberStep(userData.phone_number),
    });
    return;
  }

  ctx.session.profileWizard.phone_number = validation.normalizedPhone;
  await handleProfileConfirm(ctx);
}

async function handleProfileConfirm(ctx: MyContext) {
  const userId = requireUserId(ctx);
  const wizard = requireWizardState(ctx.session.profileWizard);

  if (!wizard.full_name && !wizard.phone_number) {
    await ctx.reply("اطلاعات برای به‌روزرسانی کافی نیست.");
    ctx.session.profileWizard = undefined;
    return;
  }

  // Prepare update data
  const updateData: { full_name?: string; phone_number?: string } = {};
  if (wizard.full_name) {
    updateData.full_name = wizard.full_name;
  }
  if (wizard.phone_number) {
    updateData.phone_number = wizard.phone_number;
  }

  // Update profile via API
  await coreClient.updateProfile(userId, updateData);

  // Clear wizard state
  ctx.session.profileWizard = undefined;

  // Show success message
  await safeEditOrReply(ctx, profileMessages.editProfile.success);

  // Fetch fresh user data after update
  const updatedUser = await coreClient.getUserProfile(userId);
  const updatedUserData = updatedUser as any;

  const message = profileMessages.profile({
    fullName: updatedUserData.full_name,
    phoneNumber: updatedUserData.phone_number,
    kycStatus: updatedUserData.kyc_status || "none",
  });

  // Get keyboard based on KYC status
  const { getProfileKeyboard } = await import("../../ui/keyboards/profile");
  const keyboard = getProfileKeyboard(updatedUserData.kyc_status || "none");

  await ctx.reply(message, {
    reply_markup: keyboard,
    parse_mode: "Markdown",
  });
}

export async function handleProfileEditCancel(ctx: MyContext) {
  ctx.session.profileWizard = undefined;

  // Get user role for main menu
  const user = getUserData(ctx);
  const role = (user as any)?.role;
  const isAdmin = role === "admin" || role === "super_admin";

  await safeEditOrReply(ctx, profileMessages.editProfile.cancelled, {
    reply_markup: getMainMenuKeyboard(isAdmin),
  });
}
