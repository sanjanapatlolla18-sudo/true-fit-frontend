export function formatCreatedAt(value) {
  if (!value) return "Recently";

  let date = new Date(value);

  // Older API responses used a display string such as
  // "Sep 09, 2026, 10:07 AM" for a UTC database value. Since that string has
  // no timezone offset, browsers interpret it as local time. Parse it as UTC
  // so existing saved history is shown correctly in IST as well.
  const legacyMatch = String(value).match(
    /^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4}),\s+(\d{1,2}):(\d{2})\s+(AM|PM)$/i,
  );
  if (legacyMatch) {
    const [, monthName, day, year, hourText, minute, period] = legacyMatch;
    const month = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
      .indexOf(monthName.toLowerCase());
    let hour = Number(hourText) % 12;
    if (period.toUpperCase() === "PM") hour += 12;
    date = new Date(Date.UTC(Number(year), month, Number(day), hour, Number(minute)));
  }

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
