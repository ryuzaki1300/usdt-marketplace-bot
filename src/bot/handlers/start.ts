import { CommandContext, Context } from "grammy";
import { coreClient } from "../../core/coreClient";
import { commonMessages } from "../../ui/messages/common";
import { getMainMenuKeyboard } from "../../ui/keyboards/mainMenu";
import { SessionData } from "../../types/session";
import { SessionFlavor } from "grammy";

type MyContext = Context & SessionFlavor<SessionData>;

export async function handleStart(ctx: CommandContext<MyContext>) {
  const userId = ctx.from?.id;
  const firstName = ctx.from?.first_name;

  if (!userId) {
    await ctx.reply("شناسایی کاربر امکان‌پذیر نیست. لطفاً دوباره تلاش کنید.");
    return;
  }

  // Get user info from Core (server will handle user creation if needed)
  // This also checks user role for admin menu visibility
  // If API error occurs, it will be caught by error middleware and shown to user
  let user = await coreClient.getUserProfile(userId);

  if (!user) {
    user = await coreClient.createUser(userId, ctx.from?.username || "");
  }

  const role = (user as any)?.role;
  const isAdmin = role === "admin" || role === "super_admin";

  // Send welcome message with main menu
  await ctx.reply(commonMessages.welcome(firstName), {
    reply_markup: getMainMenuKeyboard(isAdmin),
  });
}
