import { CommandContext, Context } from 'grammy';
import { coreClient } from '../../core/coreClient';
import { commonMessages } from '../../ui/messages/common';
import { menuMessages } from '../../ui/messages/menu';
import { getMainMenuKeyboard } from '../../ui/keyboards/mainMenu';
import { SessionData } from '../../types/session';
import { SessionFlavor } from 'grammy';

type MyContext = Context & SessionFlavor<SessionData>;

export async function handleStart(ctx: CommandContext<MyContext>) {
  try {
    const userId = ctx.from?.id;
    const firstName = ctx.from?.first_name;

    if (!userId) {
      await ctx.reply(commonMessages.error.generic);
      return;
    }

    // Get or create user in Core
    try {
      await coreClient.getUserByTelegramId(userId);
    } catch (error) {
      // User might not exist, Core will auto-create on first request with telegram_user_id
      // If it's a different error, we'll handle it below
      console.log('User might not exist yet, Core will auto-create');
    }

    // Check if user is admin
    const isAdmin = ctx.userRole?.role === 'admin' || ctx.userRole?.role === 'super_admin';

    // Send welcome message with main menu
    await ctx.reply(commonMessages.welcome(firstName), {
      reply_markup: getMainMenuKeyboard(isAdmin),
    });
  } catch (error) {
    console.error('Error in /start handler:', error);
    await ctx.reply(commonMessages.error.generic);
  }
}

