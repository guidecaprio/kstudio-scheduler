import { NextResponse } from "next/server";
import { getCalendarClient, CALENDAR_ID } from "../../../../../lib/google";

export async function GET() {
  try {
    const calendar = getCalendarClient();
    const now = new Date().toISOString();
    const res = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: now,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 25,
    });
    return NextResponse.json(res.data.items ?? []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
