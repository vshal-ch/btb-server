import axios from "axios";
import { minutesToTime, getDate } from "./dateFormatter.js";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export const sendTelegramMessage = (booking, user) => {
  let formattedDate = getDate(booking.date);
  if (formattedDate === "Invalid Date") {
    formattedDate = booking.date;
  } else {
    formattedDate = formattedDate.toDateString();
  }
  const text = `
🔥 <b>New Booking</b>

Sport: ${booking.sport}
Box: ${booking.box}

Date: ${formattedDate}
Time: ${minutesToTime(booking.start_time)} - ${minutesToTime(booking.end_time)}

User: ${user?.name ?? "-"}
Phone: ${user?.phone_no ?? "-"}

Amount: ₹${booking.total_amount}
`;
  send(text);
};

const send = async (text) => {
  await axios.post(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      chat_id: CHAT_ID,
      text: text,
      parse_mode: "HTML",
    },
  );
};
