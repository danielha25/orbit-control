import { NextResponse } from "next/server";

import { UnauthorizedError, requireUser } from "@/lib/auth";
import { deleteWatchlistItem } from "@/server/services/watchlist-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const result = await deleteWatchlistItem(user.id, id);

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
      { data: null, error: "Failed to remove watchlist item" },
      { status: 500 }
    );
  }
}
