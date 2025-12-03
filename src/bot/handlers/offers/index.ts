import { Context, SessionFlavor } from "grammy";
import { SessionData } from "../../../types/session";
import { handleOfferCreate } from "../../conversations/createOffer";

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

