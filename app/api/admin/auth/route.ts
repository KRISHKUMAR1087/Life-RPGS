import { NextResponse } from "next/server";

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

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(serverAdminPass),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

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

