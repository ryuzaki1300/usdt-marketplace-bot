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
console.log(data.kycStatus)
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
  kyc: {
    checkData: (fullName: string, phoneNumber: string) => {
      return `📋 بررسی اطلاعات\n\nلطفاً اطلاعات زیر را بررسی کنید:\n\n📝 نام کامل: ${fullName}\n📱 شماره تلفن: \`${phoneNumber}\``;
    },
    submitted: "✅ درخواست احراز هویت شما با موفقیت ثبت شد. به زودی با شما تماس خواهیم گرفت.",
    cancelled: "❌ درخواست احراز هویت لغو شد.",
    missingData: "❌ برای ثبت درخواست احراز هویت، ابتدا باید نام کامل و شماره تلفن خود را در پروفایل ثبت کنید.",
    approved: "✅ درخواست احراز هویت شما تایید شد. اکنون می‌توانید از تمامی امکانات سیستم استفاده کنید.",
    rejected: "❌ متأسفانه درخواست احراز هویت شما رد شد. لطفاً با پشتیبانی تماس بگیرید.",
    adminNotification: (fullName: string, phoneNumber: string) => {
      return `🔔 درخواست احراز هویت جدید\n\n📝 نام کامل: ${fullName}\n📱 شماره تلفن: \`${phoneNumber}\``;
    },
  },
};
