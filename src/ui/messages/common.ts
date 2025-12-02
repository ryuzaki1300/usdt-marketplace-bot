export const commonMessages = {
  welcome: (firstName?: string) =>
    `👋 Welcome${firstName ? `, ${firstName}` : ''}!\n\n` +
    `This is the USDT Marketplace Bot. You can safely trade USDT in a peer-to-peer manner.\n\n` +
    `Use the menu below to get started.`,

  error: {
    generic: '❌ An error occurred. Please try again later.',
    notFound: '❌ Resource not found.',
    unauthorized: '❌ You are not authorized to perform this action.',
    kycRequired: '❌ KYC verification is required to perform this action. Please complete your KYC first.',
    userBlocked: '❌ Your account has been blocked. Please contact support.',
    networkError: '❌ Network error. Please check your connection and try again.',
  },
};

