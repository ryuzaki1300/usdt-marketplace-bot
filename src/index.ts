import { createBot } from './bot/bot';
import { env } from './config/env';

async function main() {
  console.log('Starting USDT Marketplace Bot...');
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Core API: ${env.CORE_BASE_URL}`);

  const bot = createBot();

  // Start the bot
  bot.start({
    onStart: (botInfo) => {
      console.log(`Bot @${botInfo.username} is running!`);
    },
  });

  // Handle graceful shutdown
  process.once('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    bot.stop();
    process.exit(0);
  });

  process.once('SIGTERM', () => {
    console.log('\nShutting down gracefully...');
    bot.stop();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

