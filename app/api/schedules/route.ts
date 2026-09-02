import { NextResponse } from "next/server";
import { createSchedule, findJobForSchedule, getDataStore } from "@/lib/dataStore";
import { scheduleInputSchema } from "@/lib/scheduleSchema";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = await getDataStore();
  return NextResponse.json({ schedules: store.schedules, jobs: store.jobs });
}

export async function POST(request: Request) {
  const parsed = scheduleInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "日程内容有误" },
      { status: 400 },
    );
  }

  const schedule = await createSchedule(parsed.data);
  const store = await getDataStore();
  return NextResponse.json(
    { schedule, job: findJobForSchedule(store, schedule), jobs: store.jobs },
    { status: 201 },
  );
}
