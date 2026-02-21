import { NextResponse } from "next/server";

export function ensureSameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return null;
  }

  const host = request.headers.get("host");
  if (!host) {
    return NextResponse.json({ error: "Invalid host." }, { status: 400 });
  }

  const expected = `${request.nextUrl.protocol}//${host}`;
  if (origin !== expected) {
    return NextResponse.json({ error: "CSRF check failed." }, { status: 403 });
  }

  return null;
}
