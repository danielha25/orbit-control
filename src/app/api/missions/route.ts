import { NextResponse } from "next/server";

import { UnauthorizedError, requireUser } from "@/lib/auth";
import {
  missionPriorityOptions,
  missionStatusOptions,
  validateMissionCreateInput
} from "@/lib/validators";
import { createMission, listMissions, type MissionFilters } from "@/server/services/mission-service";

function parseMissionFilters(request: Request): MissionFilters {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const statusParam = searchParams.get("status");
  const priorityParam = searchParams.get("priority");

  return {
    search: search || undefined,
    status: statusParam && missionStatusOptions.includes(statusParam as typeof missionStatusOptions[number])
      ? statusParam as typeof missionStatusOptions[number]
      : undefined,
    priority: priorityParam && missionPriorityOptions.includes(priorityParam as typeof missionPriorityOptions[number])
      ? priorityParam as typeof missionPriorityOptions[number]
      : undefined
  };
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const data = await listMissions(user.id, parseMissionFilters(request));

    return NextResponse.json(
      { data, error: null },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { data: null, error: "Failed to load missions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => null);
    const validation = validateMissionCreateInput(body);

    if (validation.error) {
      return NextResponse.json(
        { data: null, error: validation.error },
        { status: 400 }
      );
    }

    if (!validation.data) {
      return NextResponse.json(
        { data: null, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const result = await createMission(user.id, validation.data);

    if (result.error) {
      return NextResponse.json(
        { data: null, error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { data: result.data, error: null },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { data: null, error: "Failed to create mission" },
      { status: 500 }
    );
  }
}
