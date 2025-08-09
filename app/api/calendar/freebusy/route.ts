import { NextResponse } from "next/server";
import { getCalendarClient, CALENDAR_ID } from "../../../../lib/google";
/** GET /api/calendar/freebusy?start=YYYY-MM-DDTHH:mm:ssZ&end=YYYY-MM-DDTHH:mm:ssZ */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const timeMin = url.searchParams.get("start");
    const timeMax = url.searchParams.get("end");
    if (!timeMin || !timeMax) {
      return NextResponse.json({ error: "start and end required (ISO)" }, { status: 400 });
    }

    const calendar = getCalendarClient();
    const fb = await calendar.freebusy.query({
      requestBody: { timeMin, timeMax, items: [{ id: CALENDAR_ID }] },
    });

    const busy = fb.data.calendars?.[CALENDAR_ID]?.busy ?? [];
    return NextResponse.json({ busy });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

