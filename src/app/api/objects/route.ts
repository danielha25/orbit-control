import { NextResponse } from "next/server";

import { UnauthorizedError, requireUser } from "@/lib/auth";
import { getDashboardObjects } from "@/server/services/dashboard-service";

export async function GET() {
  try {
    await requireUser();

    const data = await getDashboardObjects();

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
      { data: null, error: "Failed to load space objects" },
      { status: 500 }
    );
  }
}
