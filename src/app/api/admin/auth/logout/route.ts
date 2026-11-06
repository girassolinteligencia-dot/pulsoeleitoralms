import { NextRequest, NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/adminAuth";
import { cookieSessao } from "@/server/adminSession";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req))
    return NextResponse.json(
      { error: "Origem não permitida" },
      { status: 403 },
    );
  return NextResponse.json(
    { ok: true },
    { headers: { "Set-Cookie": cookieSessao("", 0) } },
  );
}
