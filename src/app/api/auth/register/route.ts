import { NextResponse } from "next/server";

import { validateAuthInput } from "@/lib/validators";
import { registerUser } from "@/server/services/auth-service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validation = validateAuthInput(body);

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

  const { email, password } = validation.data;
  const result = await registerUser(email, password);

  if (result.error) {
    return NextResponse.json(
      { data: null, error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { data: result.data, error: null },
    { status: 201 }
  );
}
