import { NextResponse } from "next/server";
import { getCalendarClient, CALENDAR_ID, TZ } from "../../../../../lib/google";

/** POST body: { startIso, endIso, service, expiresAtIso, strategic?: boolean } */
export async function POST(req: Request) {
  try {
    const { startIso, endIso, service, expiresAtIso, strategic } = await req.json();
    if (!startIso || !endIso || !service || !expiresAtIso) {
      return NextResponse.json({ error: "startIso, endIso, service, expiresAtIso required" }, { status: 400 });
    }

    const calendar = getCalendarClient();
    const res = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: {
        summary: `Em Disputa — ${service}`,
        description: "Hold automático aguardando pagamento do sinal.",
        start: { dateTime: startIso, timeZone: TZ },
        end:   { dateTime: endIso,   timeZone: TZ },
        status: "tentative",
        extendedProperties: {
          private: {
            hold: "true",
            strategic: strategic ? "true" : "false",
            service,
            expiresAt: expiresAtIso
          }
        }
      }
    });

    return NextResponse.json({ id: res.data.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

