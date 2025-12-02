import { Context, SessionFlavor } from "grammy";
import { SessionData } from "../../types/session";
import { orderMessages } from "../../ui/messages/orders";
import { orderKeyboards } from "../../ui/keyboards/orders";
import { coreClient } from "../../core/coreClient";
import { getMainMenuKeyboard } from "../../ui/keyboards/mainMenu";
import { validateNumberInput } from "../../utils/numberParser";

type MyContext = Context & SessionFlavor<SessionData>;

export async function handleOrderCreate(ctx: MyContext) {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply("شناسایی کاربر امکان‌پذیر نیست.");
    return;
  }

  // Initialize wizard state
  ctx.session.orderWizard = {
    step: "side",
  };

  await ctx.reply(orderMessages.createOrder.chooseSide, {
    reply_markup: orderKeyboards.chooseSide(),
  });
}

export async function handleOrderSide(ctx: MyContext, side: "buy" | "sell") {
  if (!ctx.session.orderWizard) {
    await ctx.reply("لطفاً از منوی اصلی شروع کنید.");
    return;
  }

  ctx.session.orderWizard.side = side;
  ctx.session.orderWizard.step = "amount";

  await ctx.editMessageText(orderMessages.createOrder.enterAmount, {
    reply_markup: orderKeyboards.cancelOrder(),
  });
}

export async function handleOrderAmount(ctx: MyContext, amountText: string) {
  if (!ctx.session.orderWizard || ctx.session.orderWizard.step !== "amount") {
    return;
  }

  const { isValid, number: amount } = validateNumberInput(amountText);
  if (!isValid) {
    await ctx.reply(orderMessages.createOrder.invalidAmount);
    return;
  }

  ctx.session.orderWizard.amount = amount;
  ctx.session.orderWizard.step = "price";

  await ctx.reply(orderMessages.createOrder.enterPrice, {
    reply_markup: orderKeyboards.cancelOrder(),
  });
}

export async function handleOrderPrice(ctx: MyContext, priceText: string) {
  if (!ctx.session.orderWizard || ctx.session.orderWizard.step !== "price") {
    return;
  }

  const { isValid, number: price } = validateNumberInput(priceText);
  if (!isValid) {
    await ctx.reply(orderMessages.createOrder.invalidPrice);
    return;
  }

  ctx.session.orderWizard.price = price;
  ctx.session.orderWizard.step = "network";

  await ctx.reply(orderMessages.createOrder.enterNetwork, {
    reply_markup: orderKeyboards.chooseNetwork(),
  });
}

export async function handleOrderNetwork(ctx: MyContext, network: string) {
  if (!ctx.session.orderWizard || ctx.session.orderWizard.step !== "network") {
    return;
  }

  ctx.session.orderWizard.network = network;
  ctx.session.orderWizard.step = "description";

  await ctx.reply(orderMessages.createOrder.enterDescription, {
    reply_markup: orderKeyboards.cancelOrder(),
  });
}

export async function handleOrderDescription(
  ctx: MyContext,
  description?: string
) {
  if (
    !ctx.session.orderWizard ||
    ctx.session.orderWizard.step !== "description"
  ) {
    return;
  }

  if (description && description.trim() !== "") {
    ctx.session.orderWizard.description = description.trim();
  }

  // Validate that required fields are present
  const wizard = ctx.session.orderWizard;
  if (!wizard.side || !wizard.amount || !wizard.price) {
    await ctx.reply("خطا در پردازش اطلاعات. لطفاً دوباره شروع کنید.");
    ctx.session.orderWizard = undefined;
    return;
  }

  ctx.session.orderWizard.step = "summary";

  const summary = orderMessages.createOrder.summary({
    side: wizard.side,
    amount: wizard.amount,
    price: wizard.price,
    network: wizard.network,
    description: wizard.description,
  });
  await ctx.reply(summary, {
    reply_markup: orderKeyboards.confirmOrder(),
  });
}

export async function handleOrderConfirm(ctx: MyContext) {
  const userId = ctx.from?.id;
  if (!userId || !ctx.session.orderWizard) {
    await ctx.reply("خطا در پردازش درخواست.");
    return;
  }

  const wizard = ctx.session.orderWizard;
  if (!wizard.side || !wizard.amount || !wizard.price) {
    await ctx.reply("اطلاعات سفارش ناقص است.");
    return;
  }

  try {
    await coreClient.createOrder(userId, {
      side: wizard.side,
      amount_usdt: wizard.amount,
      price_per_unit: wizard.price,
      network: wizard.network,
      description: wizard.description,
    });

    // Clear wizard state
    ctx.session.orderWizard = undefined;

    // Get user role for main menu
    const user = await coreClient.getUserProfile(userId);
    const role = (user as any)?.role;
    const isAdmin = role === "admin" || role === "super_admin";

    await ctx.editMessageText(orderMessages.createOrder.success, {
      reply_markup: getMainMenuKeyboard(isAdmin),
    });
  } catch (error: any) {
    await ctx.editMessageText(
      error.message || orderMessages.createOrder.error,
      {
        reply_markup: getMainMenuKeyboard(false),
      }
    );
  }
}

export async function handleOrderCancel(ctx: MyContext) {
  ctx.session.orderWizard = undefined;

  // Get user role for main menu
  const userId = ctx.from?.id;
  if (!userId) {
    try {
      await ctx.editMessageText(orderMessages.createOrder.cancelled, {
        reply_markup: getMainMenuKeyboard(false),
      });
    } catch {
      await ctx.reply(orderMessages.createOrder.cancelled, {
        reply_markup: getMainMenuKeyboard(false),
      });
    }
    return;
  }

  try {
    const user = await coreClient.getUserProfile(userId);
    const role = (user as any)?.role;
    const isAdmin = role === "admin" || role === "super_admin";

    try {
      await ctx.editMessageText(orderMessages.createOrder.cancelled, {
        reply_markup: getMainMenuKeyboard(isAdmin),
      });
    } catch {
      // If we can't edit (e.g., message is too old), send a new message
      await ctx.reply(orderMessages.createOrder.cancelled, {
        reply_markup: getMainMenuKeyboard(isAdmin),
      });
    }
  } catch {
    try {
      await ctx.editMessageText(orderMessages.createOrder.cancelled, {
        reply_markup: getMainMenuKeyboard(false),
      });
    } catch {
      await ctx.reply(orderMessages.createOrder.cancelled, {
        reply_markup: getMainMenuKeyboard(false),
      });
    }
  }
}
