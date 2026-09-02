import { NextResponse } from "next/server";
import {
  deleteSchedule,
  findJobForSchedule,
  getDataStore,
  ScheduleConflictError,
  updateSchedule,
} from "@/lib/dataStore";
import { scheduleInputSchema } from "@/lib/scheduleSchema";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const body = (await request.json()) as Record<string, unknown>;
  const parsed = scheduleInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "日程内容有误" },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  let schedule;
  try {
    schedule = await updateSchedule(
      id,
      parsed.data,
      typeof body.expectedUpdatedAt === "string" ? body.expectedUpdatedAt : undefined,
    );
  } catch (error) {
    if (error instanceof ScheduleConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
  if (!schedule) {
    return NextResponse.json({ error: "没有找到这条日程" }, { status: 404 });
  }
  const store = await getDataStore();
  return NextResponse.json({ schedule, job: findJobForSchedule(store, schedule), jobs: store.jobs });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const expectedUpdatedAt = new URL(request.url).searchParams.get("expectedUpdatedAt") || undefined;
  let deleted: boolean;
  try {
    deleted = await deleteSchedule(id, expectedUpdatedAt);
  } catch (error) {
    if (error instanceof ScheduleConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
  if (!deleted) {
    return NextResponse.json({ error: "没有找到这条日程" }, { status: 404 });
  }
  const store = await getDataStore();
  return NextResponse.json({ jobs: store.jobs });
}
