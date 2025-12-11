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
  editProfile: {
    enterFullName: (currentFullName?: string) => {
      let message = "📝 لطفاً نام کامل خود را وارد کنید:\n";
      if (currentFullName) {
        message += `\nنام فعلی: ${currentFullName}`;
      }
      return message;
    },
    enterPhoneNumber: (currentPhoneNumber?: string) => {
      let message = "📱 لطفاً شماره تلفن خود را وارد کنید:\n";
      if (currentPhoneNumber) {
        message += `\nشماره فعلی: \`${currentPhoneNumber}\``;
      }
      return message;
    },
    invalidPhoneNumber: "❌ شماره تلفن وارد شده نامعتبر است. لطفاً شماره را به فرمت صحیح وارد کنید (مثال: +989123456789 یا 09123456789)",
    success: "✅ پروفایل شما با موفقیت به‌روزرسانی شد.",
    cancelled: "❌ ویرایش پروفایل لغو شد.",
  },
};
