import { NextRequest, NextResponse } from "next/server";
import { getEvents, type EventFilters } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const filters: EventFilters = {
    city: p.get("city") ?? undefined,
    source: p.get("source") ?? undefined,
    category: p.get("category") ?? undefined,
    minScore: p.get("minScore") ? Number(p.get("minScore")) : undefined,
    from: p.get("from") ?? undefined,
    to: p.get("to") ?? undefined,
    online: (p.get("online") as EventFilters["online"]) ?? undefined,
    q: p.get("q") ?? undefined,
    sort: (p.get("sort") as EventFilters["sort"]) ?? "score",
  };
  const events = await getEvents(filters, Number(p.get("limit") ?? 200));
  return NextResponse.json({ events });
}
