export default function getDateString(input) {

  const date = new Date(input);

  if (isNaN(date.getTime())) return "Invalid Date";

  return date.toISOString().slice(0, 10);
}
