import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/admin/:path*"],
};

export async function middleware(req: NextRequest) {
  // Admin route is protected by client-side gate in AdminDashboard.tsx with ADMIN_PASSWORD
  return NextResponse.next();
}

