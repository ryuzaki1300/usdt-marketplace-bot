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
  async getUserOrders(
    telegramUserId: number,
    status: "open" | "matched" | "canceled" = "open",
    page: number = 1,
    limit: number = 10
  ) {
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
    }>("GET", `/orders?maker_id=${userId}&status=${status}&page=${page}&limit=${limit}`, {
      telegramUserId,
    });
  }

  /**
   * Create a new order
   */
  async createOrder(
    telegramUserId: number,
    data: {
      side: "buy" | "sell";
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

  /**
   * Get order by ID
   */
  async getOrderById(orderId: number, telegramUserId?: number) {
    return this.request("GET", `/orders/${orderId}`, {
      telegramUserId,
    });
  }

  /**
   * Get offers for an order
   */
  async getOrderOffers(
    orderId: number,
    telegramUserId?: number,
    page: number = 1,
    limit: number = 100
  ) {
    return this.request<{
      data: any[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    }>("GET", `/order-offers?order_id=${orderId}&page=${page}&limit=${limit}`, {
      telegramUserId,
    });
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: number, telegramUserId: number) {
    return this.request("POST", `/orders/${orderId}/cancel`, {
      telegramUserId,
    });
  }

  /**
   * Create an offer on an order
   */
  async createOffer(
    telegramUserId: number,
    data: {
      order_id: number;
      price_per_unit: number;
      comment?: string;
    }
  ) {
    return this.request("POST", "/order-offers", {
      telegramUserId,
      data,
    });
  }

  /**
   * Get order by ID (for fetching order details including maker info)
   */
  async getOrderWithMaker(orderId: number, telegramUserId?: number) {
    return this.request("GET", `/orders/${orderId}`, {
      telegramUserId,
    });
  }

  /**
   * Reject an offer (maker action)
   */
  async rejectOffer(offerId: number, telegramUserId: number) {
    return this.request("POST", `/order-offers/${offerId}/reject`, {
      telegramUserId,
    });
  }

  /**
   * Get offer by ID (for fetching offer details including taker info)
   */
  async getOfferById(offerId: number, telegramUserId?: number) {
    return this.request("GET", `/order-offers/${offerId}`, {
      telegramUserId,
    });
  }

  /**
   * Update an offer
   */
  async updateOffer(
    offerId: number,
    telegramUserId: number,
    data: {
      price_per_unit?: number;
      comment?: string;
    }
  ) {
    return this.request("PATCH", `/order-offers/${offerId}`, {
      telegramUserId,
      data,
    });
  }

  /**
   * Create order telegram metadata
   */
  async createOrderTelegramMeta(data: {
    order_id: number;
    chat_id: number;
    message_id?: number;
    inline_message_id?: string;
  }) {
    return this.request("POST", "/order-telegram-meta", {
      data,
    });
  }

  /**
   * Get order telegram metadata by order ID
   */
  async getOrderTelegramMetaByOrderId(orderId: number) {
    return this.request("GET", `/order-telegram-meta/order/${orderId}`);
  }

  /**
   * Update order telegram metadata by order ID
   */
  async updateOrderTelegramMetaByOrderId(
    orderId: number,
    data: {
      chat_id?: number;
      message_id?: number;
      inline_message_id?: string;
    }
  ) {
    return this.request("PATCH", `/order-telegram-meta/order/${orderId}`, {
      data,
    });
  }

  /**
   * Create a deal from an accepted offer
   */
  async createDeal(
    telegramUserId: number,
    data: {
      order_id: number;
      offer_id: number;
    }
  ) {
    return this.request("POST", "/deals", {
      telegramUserId,
      data,
    });
  }

  /**
   * Get deal by ID
   */
  async getDealById(dealId: number, telegramUserId?: number) {
    return this.request("GET", `/deals/${dealId}`, {
      telegramUserId,
    });
  }

  /**
   * Get deals with filters (paginated)
   */
  async getDeals(
    telegramUserId: number,
    filters?: {
      status?: "pending_admin" | "in_progress" | "completed" | "cancelled";
      order_id?: number;
      maker_id?: number;
      taker_id?: number;
      page?: number;
      limit?: number;
    }
  ) {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.order_id) params.append("order_id", filters.order_id.toString());
    if (filters?.maker_id) params.append("maker_id", filters.maker_id.toString());
    if (filters?.taker_id) params.append("taker_id", filters.taker_id.toString());
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const queryString = params.toString();
    const endpoint = `/deals${queryString ? `?${queryString}` : ""}`;

    return this.request<{
      data: any[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    }>("GET", endpoint, {
      telegramUserId,
    });
  }

  /**
   * Get all users (paginated, for admins)
   */
  async getAllUsers(
    telegramUserId: number,
    page: number = 1,
    limit: number = 100,
    adminsOnly: boolean = false
  ) {
    const adminsOnlyParam = adminsOnly ? "&admins_only=1" : "";
    return this.request<{
      data: any[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    }>("GET", `/users?page=${page}&limit=${limit}${adminsOnlyParam}`, {
      telegramUserId,
    });
  }

  /**
   * Get user by ID (admin only)
   */
  async getUserById(userId: number, telegramUserId: number) {
    return this.request("GET", `/users/${userId}`, {
      telegramUserId,
    });
  }

  /**
   * Approve deal (admin only) - changes status from pending_admin to in_progress
   */
  async approveDeal(dealId: number, telegramUserId: number) {
    return this.request("POST", `/deals/${dealId}/approve`, {
      telegramUserId,
    });
  }

  /**
   * Complete deal (admin only) - changes status from in_progress to completed
   */
  async completeDeal(dealId: number, telegramUserId: number) {
    return this.request("POST", `/deals/${dealId}/complete`, {
      telegramUserId,
    });
  }

  /**
   * Cancel deal (admin only)
   */
  async cancelDeal(dealId: number, telegramUserId: number) {
    return this.request("POST", `/deals/${dealId}/cancel`, {
      telegramUserId,
    });
  }
}

export const coreClient = new CoreClient();
