export default function getDateString(input) {
  const date = new Date(input);

  if (isNaN(date.getTime())) return "Invalid Date";

  return date.toISOString().slice(0, 10);
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
