// Profile-related messages
export const profileMessages = {
  profile: (data: {
    fullName?: string;
    phoneNumber?: string;
    kycStatus: string;
  }) => {
    let message = "👤 پروفایل من\n\n";

    if (data.fullName) {
      message += `📝 نام کامل: ${data.fullName}\n`;
    }

    if (data.phoneNumber) {
      message += `📱 شماره تلفن: \`${data.phoneNumber}\`\n`;
    }

    // KYC status
    let kycStatusText = "نامشخص";
    if (data.kycStatus === "none") kycStatusText = "❌ ثبت نشده";
    else if (data.kycStatus === "pending") kycStatusText = "⏳ در انتظار بررسی";
    else if (data.kycStatus === "approved") kycStatusText = "✅ تایید شده";
    else if (data.kycStatus === "rejected") kycStatusText = "❌ رد شده";

    message += `🔐 سطح احراز هویت: ${kycStatusText}\n`;

    return message;
  },
};
