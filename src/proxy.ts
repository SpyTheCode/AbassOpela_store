import { NextResponse } from "next/server";
import { ensureSeeded } from "@/lib/db";

/**
 * proxy.ts (Next 16's replacement for middleware.ts).
 * Runs the idempotent DB seed once per server boot before the first render,
 * and keeps security headers on every response.
 */
export async function proxy() {
  await ensureSeeded();

  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", "DENY");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|media).*)"],
};
