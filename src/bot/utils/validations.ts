import { Context, SessionFlavor } from "grammy";
import { SessionData } from "../../types/session";
import { getUserData } from "../middlewares/userData";
import { requireUserId } from "./errorHandling";

type MyContext = Context & SessionFlavor<SessionData>;

/**
 * Validate user ID and return it, or throw error
 */
export function validateUserId(ctx: MyContext): number {
  return requireUserId(ctx);
}

/**
 * Check if user has admin role
 */
export function isAdmin(ctx: MyContext): boolean {
  const user = getUserData(ctx);
  const role = (user as any)?.role;
  return role === "admin" || role === "super_admin";
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(ctx: MyContext): boolean {
  const user = getUserData(ctx);
  const role = (user as any)?.role;
  return role === "super_admin";
}

/**
 * Require admin role, throw error if not admin
 */
export function requireAdmin(ctx: MyContext): void {
  if (!isAdmin(ctx)) {
    throw new Error("❌ شما دسترسی لازم برای این عملیات را ندارید.");
  }
}

/**
 * Require super admin role, throw error if not super admin
 */
export function requireSuperAdmin(ctx: MyContext): void {
  if (!isSuperAdmin(ctx)) {
    throw new Error("❌ شما دسترسی لازم برای این عملیات را ندارید.");
  }
}

/**
 * Check if user has approved KYC
 */
export function hasApprovedKyc(ctx: MyContext): boolean {
  const user = getUserData(ctx);
  return user.kyc_status === "approved";
}

/**
 * Require approved KYC, throw error if not approved
 */
export function requireApprovedKyc(ctx: MyContext): void {
  if (!hasApprovedKyc(ctx)) {
    throw new Error(
      "برای استفاده از این قابلیت، ابتدا باید احراز هویت خود را تکمیل کنید."
    );
  }
}

/**
 * Validate that wizard state exists
 */
export function requireWizardState<T>(
  wizard: T | undefined,
  errorMessage: string = "لطفاً از منوی اصلی شروع کنید."
): T {
  if (!wizard) {
    throw new Error(errorMessage);
  }
  return wizard;
}

/**
 * Validate required fields in an object
 */
export function requireFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[],
  errorMessage?: string
): void {
  const missingFields = fields.filter((field) => !obj[field]);
  if (missingFields.length > 0) {
    throw new Error(
      errorMessage ||
        `اطلاعات ناقص است. فیلدهای مورد نیاز: ${missingFields.join(", ")}`
    );
  }
}

/**
 * Validate number input
 */
export function validateNumber(value: any): number {
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (isNaN(num) || num <= 0) {
    throw new Error("عدد وارد شده نامعتبر است.");
  }
  return num;
}

/**
 * Validate order ID from command
 */
export function parseOrderIdFromCommand(command: string): number {
  const match = command.match(/^\/order_(\d+)$/);
  if (!match) {
    throw new Error(
      "فرمت دستور نامعتبر است. لطفاً از فرمت /order_<id> استفاده کنید."
    );
  }
  const orderId = parseInt(match[1], 10);
  if (isNaN(orderId)) {
    throw new Error("شناسه سفارش نامعتبر است.");
  }
  return orderId;
}

/**
 * Validate offer ID from command
 */
export function parseOfferIdFromCommand(command: string): number {
  const match = command.match(/^\/?offer_(\d+)$/);
  if (!match) {
    throw new Error(
      "فرمت دستور نامعتبر است. لطفاً از فرمت /offer_<id> استفاده کنید."
    );
  }
  const offerId = parseInt(match[1], 10);
  if (isNaN(offerId)) {
    throw new Error("شناسه پیشنهاد نامعتبر است.");
  }
  return offerId;
}

/**
 * Validate deal ID from command
 */
export function parseDealIdFromCommand(command: string): number {
  const match = command.match(/^\/deal_(\d+)$/);
  if (!match) {
    throw new Error(
      "فرمت دستور نامعتبر است. لطفاً از فرمت /deal_<id> استفاده کنید."
    );
  }
  const dealId = parseInt(match[1], 10);
  if (isNaN(dealId)) {
    throw new Error("شناسه معامله نامعتبر است.");
  }
  return dealId;
}

/**
 * Validate user ID from command
 */
export function parseUserIdFromCommand(command: string): number {
  const match = command.match(/^\/user_(\d+)$/);
  if (!match) {
    throw new Error(
      "فرمت دستور نامعتبر است. لطفاً از فرمت /user_<id> استفاده کنید."
    );
  }
  const userId = parseInt(match[1], 10);
  if (isNaN(userId)) {
    throw new Error("شناسه کاربر نامعتبر است.");
  }
  return userId;
}
