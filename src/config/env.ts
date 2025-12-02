import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface EnvConfig {
  BOT_TOKEN: string;
  CORE_API_KEY: string;
  CORE_BASE_URL: string;
  PUBLIC_ORDER_CHANNEL_ID: string;
  NODE_ENV: string;
}

function validateEnv(): EnvConfig {
  const required = ['BOT_TOKEN', 'CORE_API_KEY', 'CORE_BASE_URL', 'PUBLIC_ORDER_CHANNEL_ID'];
  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }

  return {
    BOT_TOKEN: process.env.BOT_TOKEN!,
    CORE_API_KEY: process.env.CORE_API_KEY!,
    CORE_BASE_URL: process.env.CORE_BASE_URL!,
    PUBLIC_ORDER_CHANNEL_ID: process.env.PUBLIC_ORDER_CHANNEL_ID!,
    NODE_ENV: process.env.NODE_ENV || 'development',
  };
}

export const env = validateEnv();

