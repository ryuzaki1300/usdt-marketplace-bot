import { CommandContext, Context } from "grammy";
import { coreClient } from "../../core/coreClient";
import { commonMessages } from "../../ui/messages/common";
import { getMainMenuKeyboard } from "../../ui/keyboards/mainMenu";
import { SessionData } from "../../types/session";
import { SessionFlavor } from "grammy";
import { handleOfferCreate } from "../conversations/createOffer";
import { requireUserId } from "../utils/errorHandling";

type MyContext = Context & SessionFlavor<SessionData>;

export async function handleStart(ctx: CommandContext<MyContext>) {
  const userId = requireUserId(ctx);
  const firstName = ctx.from?.first_name;

  // Check for deep link parameters (e.g., /start offer_123)
  const startParam = ctx.match;
  if (
    startParam &&
    typeof startParam === "string" &&
    startParam.startsWith("offer_")
  ) {
    // Extract order ID from parameter like "offer_123"
    const match = startParam.match(/^offer_(\d+)$/);
    if (match) {
      const orderId = parseInt(match[1], 10);
      if (!isNaN(orderId)) {
        // Handle offer creation flow
        await handleOfferCreate(ctx, orderId);
        return;
      }
    }
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
