export default function getDateString(input) {
  const date = new Date(input);
  if (isNaN(date.getTime())) return "Invalid Date";
  return date.toISOString().slice(0, 10);
}

export function getDate(input) {
  const date = new Date(input);
  if (isNaN(date.getTime())) return "Invalid Date";
  return date;
}

export function getDayOfWeekFromDate(date) {
  const daysOfWeek = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayName = daysOfWeek[date.getDay()];
  return dayName;
}

export function minutesToTime(minutes) {
  minutes = (minutes + 12) * 30;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const formattedHours = String(hours).padStart(2, "0");
  const formattedMins = String(mins).padStart(2, "0");
  return `${formattedHours}:${formattedMins}`;
}
