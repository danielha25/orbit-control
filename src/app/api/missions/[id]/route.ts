import { NextResponse } from "next/server";

import { UnauthorizedError, requireUser } from "@/lib/auth";
import { validateMissionUpdateInput } from "@/lib/validators";
import { deleteMission, getMissionById, updateMission } from "@/server/services/mission-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const result = await getMissionById(user.id, id);

    if (result.error) {
      return NextResponse.json(
        { data: null, error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { data: result.data, error: null },
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
      { data: null, error: "Failed to load mission" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const validation = validateMissionUpdateInput(body);

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

    const result = await updateMission(user.id, id, validation.data);

    if (result.error) {
      return NextResponse.json(
        { data: null, error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { data: result.data, error: null },
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
      { data: null, error: "Failed to update mission" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const result = await deleteMission(user.id, id);

    if (result.error) {
      return NextResponse.json(
        { data: null, error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { data: result.data, error: null },
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
      { data: null, error: "Failed to delete mission" },
      { status: 500 }
    );
  }
}
