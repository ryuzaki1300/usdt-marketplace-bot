import { Context, SessionFlavor } from "grammy";
import { SessionData } from "../../types/session";
import { orderMessages } from "../../ui/messages/orders";
import { orderKeyboards } from "../../ui/keyboards/orders";
import { coreClient } from "../../core/coreClient";
import { getMainMenuKeyboard } from "../../ui/keyboards/mainMenu";
import { validateNumberInput } from "../../utils/numberParser";
import { getUserData } from "../middlewares/userData";
import { kycMessages } from "../../ui/messages/kyc";
import { getKycRequiredKeyboard } from "../../ui/keyboards/kyc";
import { env } from "../../config/env";
import { channelMessages } from "../../ui/messages/channel";

type MyContext = Context & SessionFlavor<SessionData>;

export async function handleOrderCreate(ctx: MyContext) {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply("شناسایی کاربر امکان‌پذیر نیست.");
    return;
  }

  const user = getUserData(ctx);
  console.log(user)
  if (user.kyc_status !== 'approved') {
    await ctx.reply(kycMessages.kycRequired, {
      reply_markup: getKycRequiredKeyboard(),
    });
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
  ctx.session.orderWizard.network = ""; // Initialize network string

  await ctx.reply(orderMessages.createOrder.enterNetwork, {
    reply_markup: orderKeyboards.chooseNetwork(""),
  });
}

export async function handleOrderNetwork(ctx: MyContext, network: string) {
  if (!ctx.session.orderWizard || ctx.session.orderWizard.step !== "network") {
    return;
  }

  // Handle "no difference" - clicking it immediately goes to next step
  if (network === "no_difference") {
    ctx.session.orderWizard.network = "فرقی نداره";
    ctx.session.orderWizard.step = "description";

    await ctx.editMessageText(orderMessages.createOrder.enterDescription, {
      reply_markup: orderKeyboards.descriptionStep(),
    });
    return;
  }

  // Handle regular networks - only single selection (toggle)
  // Initialize network string if not exists
  if (!ctx.session.orderWizard.network) {
    ctx.session.orderWizard.network = "";
  }

  const currentNetwork = ctx.session.orderWizard.network;

  // For single network selection, toggle the selected network
  if (currentNetwork === network) {
    // Deselect if already selected
    ctx.session.orderWizard.network = "";
  } else {
    // Select this network (replace any previous selection)
    ctx.session.orderWizard.network = network;
  }

  // Update the keyboard to show current selection
  await ctx.editMessageReplyMarkup({
    reply_markup: orderKeyboards.chooseNetwork(
      ctx.session.orderWizard.network
    ),
  });
}

export async function handleOrderNetworkDone(ctx: MyContext) {
  if (!ctx.session.orderWizard || ctx.session.orderWizard.step !== "network") {
    return;
  }

  // Validate that at least one network is selected
  if (!ctx.session.orderWizard.network || ctx.session.orderWizard.network.trim() === "") {
    await ctx.answerCallbackQuery({
      text: "لطفاً حداقل یک شبکه را انتخاب کنید",
      show_alert: true,
    });
    return;
  }

  ctx.session.orderWizard.step = "description";

  await ctx.editMessageText(orderMessages.createOrder.enterDescription, {
    reply_markup: orderKeyboards.descriptionStep(),
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

    // Show success message and redirect to my_orders
    await ctx.editMessageText(orderMessages.createOrder.success);

    // Send message to public channel
    await ctx.api.sendMessage(env.PUBLIC_ORDER_CHANNEL, channelMessages.orderCreated({
      side: wizard.side,
      amount_usdt: wizard.amount,
      price_per_unit: wizard.price,
      network: wizard.network,
      description: wizard.description,
      created_at: new Date().toISOString(),
    }));

    // Send my_orders as a new message
    try {
      const response = await coreClient.getUserOrders(userId);
      const orders = response.data || [];

      if (orders.length === 0) {
        await ctx.reply(orderMessages.myOrders.noOrders, {
          reply_markup: orderKeyboards.myOrdersEmpty(),
        });
      } else {
        // Send header message
        await ctx.reply(orderMessages.myOrders.header(orders.length), {
          reply_markup: orderKeyboards.myOrdersHeader(),
        });

        // Send each order as a separate message with its buttons
        for (let i = 0; i < orders.length; i++) {
          const order = orders[i];
          const message = orderMessages.myOrders.singleOrder(order, i + 1);
          const keyboard = orderKeyboards.singleOrder(order);
          
          await ctx.reply(message, {
            reply_markup: keyboard,
          });
        }
      }
    } catch (error: any) {
      // If fetching orders fails, just show success message
      // Error is already handled
    }
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
