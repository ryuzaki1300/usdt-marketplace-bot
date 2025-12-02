import axios, { AxiosInstance, AxiosError } from 'axios';
import { env } from '../config/env';

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
        'x-api-key': env.CORE_API_KEY,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Make a request to the Core API with user context
   */
  async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
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
        headers['x-telegram-user-id'] = options.telegramUserId.toString();
      }

      if (options?.telegramChatId) {
        headers['x-telegram-chat-id'] = options.telegramChatId.toString();
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
        message: 'An unexpected error occurred',
        error: 'Internal Server Error',
        type: 'UNKNOWN_ERROR',
      } as ApiError;
    }
  }

  /**
   * Get user by Telegram ID
   */
  async getUserByTelegramId(telegramUserId: number) {
    return this.request('GET', `/users/telegram/${telegramUserId}`);
  }

  /**
   * Get current user profile
   */
  async getCurrentUserProfile(telegramUserId: number) {
    return this.request('GET', '/users/me/profile', {
      telegramUserId,
    });
  }
}

export const coreClient = new CoreClient();

