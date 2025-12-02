import axios, { AxiosInstance, AxiosError } from "axios";
import { env } from "../config/env";

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  type: string;
  details?: string;
}

export class CoreClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.CORE_BASE_URL,
      headers: {
        "x-api-key": env.CORE_API_KEY,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Make a request to the Core API with user context
   */
  async request<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    endpoint: string,
    options?: {
      data?: any;
      telegramUserId?: number;
      telegramChatId?: number;
    }
  ): Promise<T> {
    try {
      const headers: Record<string, string> = {};

      if (options?.telegramUserId) {
        headers["x-telegram-user-id"] = options.telegramUserId.toString();
      }

      if (options?.telegramChatId) {
        headers["x-telegram-chat-id"] = options.telegramChatId.toString();
      }

      const response = await this.client.request<T>({
        method,
        url: endpoint,
        data: options?.data,
        headers,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        if (axiosError.response?.data) {
          throw axiosError.response.data;
        }
      }

      throw {
        statusCode: 500,
        message: "خطای غیرمنتظره‌ای رخ داد. لطفاً بعداً دوباره تلاش کنید.",
        error: "UNKNOWN_ERROR",
        type: "UNKNOWN_ERROR",
      } as ApiError;
    }
  }

  /**
   * Get user by Telegram ID
   */
  async getUserProfile(telegramUserId: number) {
    return this.request("GET", `/users/me/profile`, {
      telegramUserId,
    });
  }

  /**
   * Create a new user
   */
  async createUser(telegramUserId: number, telegramUsername: string) {
    return this.request("POST", `/users`, {
      data: {
        telegram_user_id: telegramUserId,
        telegram_username: telegramUsername,
      },
    });
  }

  /**
   * Get current user profile
   */
  async getCurrentUserProfile(telegramUserId: number) {
    return this.request("GET", "/users/me/profile", {
      telegramUserId,
    });
  }

  /**
   * Get user orders
   * First gets the user profile to get internal user ID, then fetches orders
   */
  async getUserOrders(telegramUserId: number, page: number = 1, limit: number = 10) {
    // Get user profile to get internal user ID
    const user = await this.getUserProfile(telegramUserId);
    const userId = (user as any)?.id;
    
    if (!userId) {
      throw {
        statusCode: 404,
        message: "کاربر یافت نشد.",
        error: "USER_NOT_FOUND",
        type: "USER_NOT_FOUND",
      } as ApiError;
    }

    // Use query parameter approach as it's more flexible
    return this.request<{
      data: any[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    }>("GET", `/orders?maker_id=${userId}&page=${page}&limit=${limit}`, {
      telegramUserId,
    });
  }

  /**
   * Create a new order
   */
  async createOrder(
    telegramUserId: number,
    data: {
      side: 'buy' | 'sell';
      amount_usdt: number;
      price_per_unit: number;
      network?: string;
      description?: string;
    }
  ) {
    return this.request("POST", "/orders", {
      telegramUserId,
      data,
    });
  }
}

export const coreClient = new CoreClient();
