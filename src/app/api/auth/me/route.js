import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";

export async function GET(request) {
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  return NextResponse.json({
    user: {
      id: auth.user.id,
      name: auth.user.name,
      email: auth.user.email,
      role: auth.user.role,
    },
  });
}
