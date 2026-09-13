import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, createAdminSessionToken, timingSafeEqual } from "@/lib/adminSession";

export const runtime = "edge";

const ADMIN_EMAIL = "admin@lifequest.realm";
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  let body: { email?: unknown; passkey?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const passkey = typeof body.passkey === "string" ? body.passkey.trim() : "";

  if (!email || !passkey) {
    return NextResponse.json({ error: "Email and passkey are required." }, { status: 400 });
  }
  if (passkey.length > 256 || email.length > 256) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const configuredPasskey = process.env.ADMIN_PASSKEY;
  if (!configuredPasskey) {
    return NextResponse.json({ error: "Admin access is not configured on this deployment." }, { status: 503 });
  }

  const emailOk = timingSafeEqual(email, ADMIN_EMAIL);
  const passkeyOk = timingSafeEqual(passkey, configuredPasskey);
  if (!emailOk || !passkeyOk) {
    return NextResponse.json({ error: "Invalid admin email or passkey." }, { status: 401 });
  }

  const token = await createAdminSessionToken({
    sub: "admin-master",
    role: "super_admin",
    name: "Master Realm Architect",
  });

  const res = NextResponse.json({
    admin: { id: "admin-master", email, role: "super_admin", name: "Master Realm Architect" },
  });

  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return res;
}

