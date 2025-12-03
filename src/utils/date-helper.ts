import moment from "moment-timezone";

export function toTehranUnix(pubDate: string): number {
  const KNOWN_FORMATS = [
    moment.ISO_8601,
    "ddd, D MMM YYYY HH:mm:ss ZZ",
    "ddd, D MMM YYYY HH:mm:ss Z",
    "MMM D, YYYY - H:mm",
    "MMM D, YYYY h:mm A",
    "YYYY/MM/DD HH:mm",
  ];

  for (const format of KNOWN_FORMATS) {
    const parsed = moment.tz(pubDate, format, "Asia/Tehran");
    if (parsed.isValid()) {
      return parsed.unix();
    }
  }

  const fallbackParsed = moment(pubDate).tz("Asia/Tehran");
  if (fallbackParsed.isValid()) {
    return fallbackParsed.unix();
  }

  return 0;
}
