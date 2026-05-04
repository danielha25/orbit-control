import { NextResponse } from "next/server";

import { UnauthorizedError, requireUser } from "@/lib/auth";
import { validateWatchlistInput } from "@/lib/validators";
import { addWatchlistItem, listWatchlistItems } from "@/server/services/watchlist-service";

export async function GET() {
  try {
    const user = await requireUser();
    const data = await listWatchlistItems(user.id);

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
      { data: null, error: "Failed to load watchlist" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => null);
    const validation = validateWatchlistInput(body);

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

    const result = await addWatchlistItem(user.id, validation.data.objectId);

    if (result.error) {
      return NextResponse.json(
        { data: null, error: result.error },
        { status: result.code === "not_found" ? 404 : 400 }
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
      { data: null, error: "Failed to add watchlist item" },
      { status: 500 }
    );
  }
}
