import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
const GRAPH_URL = `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
export const formatMexicanPhone = (phone) => {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("52")) return digits;
  return `52${digits}`;
};
export const sendAppointmentConfirmationTemplate = async ({
  phone,
  customerName,
  serviceName,
  dateLabel,
  timeLabel,
}) => {
  const payload = {
    messaging_product: "whatsapp",
    to: formatMexicanPhone(phone),
    type: "template",
    template: {
      name: process.env.WHATSAPP_TEMPLATE_NAME,
      language: { code: "en_US" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: customerName },
            { type: "text", text: serviceName },
            { type: "text", text: dateLabel },
            { type: "text", text: timeLabel },
          ],
        },
      ],
    },
  };
  const response = await axios.post(GRAPH_URL, payload, {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
  return response.data.messages[0].id;
};
