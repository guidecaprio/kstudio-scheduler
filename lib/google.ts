import { google } from "googleapis";

export function getCalendarClient() {
  const client_email = process.env.GOOGLE_CLIENT_EMAIL!;
  let private_key = process.env.GOOGLE_PRIVATE_KEY!;
  // Se a Vercel salvar sem quebras de linha reais:
  private_key = private_key.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: client_email,
    key: private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
}

export const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID!;
export const TZ = process.env.GOOGLE_TIMEZONE || "Europe/Lisbon";
