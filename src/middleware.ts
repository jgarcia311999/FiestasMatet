import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge/Web Crypto helper
async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function expectedCookieValue(): Promise<string> {
    const pass = process.env.INTRANET_PASS || "";
    const secret = process.env.SESSION_SECRET || "";
    return await sha256Hex(pass + secret);
}

export async function middleware(req: NextRequest) {
    const url = req.nextUrl.clone();
    const isLogin = url.pathname.startsWith("/login");

    // Solo protegemos layoutComision
    const isPrivate = url.pathname.startsWith("/layoutComision");

    if (!isPrivate) return NextResponse.next();
    if (isLogin) return NextResponse.next();

    const cookie = req.cookies.get("commission_auth")?.value;
    const expected = await expectedCookieValue();
    if (cookie === expected) return NextResponse.next();

    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
}

export const config = {
    matcher: ["/layoutComision/:path*"],
};