import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { email, passkey } = await req.json();

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPass = (passkey || "").trim();

    const serverAdminPass = process.env.ADMIN_PASSKEY || process.env.NEXT_PUBLIC_ADMIN_PASSKEY;
    const serverAdminEmail = process.env.ADMIN_EMAIL || "admin@xpwin.realm";

    if (!serverAdminPass) {
      return NextResponse.json(
        { error: "Admin authentication is unconfigured on the server." },
        { status: 500 }
      );
    }

    if (cleanEmail !== serverAdminEmail.toLowerCase() || cleanPass !== serverAdminPass) {
      return NextResponse.json(
        { error: "Invalid admin email or passkey. Access denied." },
        { status: 401 }
      );
    }

    const timestamp = Date.now();
    const payload = `${cleanEmail}:${timestamp}`;
    const signature = crypto
      .createHmac("sha256", serverAdminPass)
      .update(payload)
      .digest("hex");

    const token = `${payload}:${signature}`;

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: "admin-master",
        email: cleanEmail,
        role: "super_admin",
        name: "Master Realm Architect",
        loggedInAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

