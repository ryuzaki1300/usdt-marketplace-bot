const jalaali = require("jalaali-js");

export const defaultDateTime = () => {
  const tehranTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Tehran",
  });
  const tehranDate = new Date(tehranTime);

  const jDate = jalaali.toJalaali(tehranDate);
  const year = jDate.jy;
  const month = jDate.jm.toString().padStart(2, "0");
  const day = jDate.jd.toString().padStart(2, "0");

  const weekDays = [
    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنجشنبه",
    "جمعه",
    "شنبه",
  ];
  const dayOfWeek = weekDays[tehranDate.getDay()];

  const hours = tehranDate.getHours().toString().padStart(2, "0");
  const minutes = tehranDate.getMinutes().toString().padStart(2, "0");

  return `📆 ${dayOfWeek} ${year}/${month}/${day} 🕒 ${hours}:${minutes}`;
};