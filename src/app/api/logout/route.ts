import { NextResponse } from "next/server";

function clearCookie(res: NextResponse) {
  res.cookies.set("commission_auth", "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function GET(req: Request) {
  const url = new URL("/", req.url); // redirect on same origin (no hardcoded port)
  const res = NextResponse.redirect(url);
  clearCookie(res);
  return res;
}

export function POST(req: Request) {
  const url = new URL("/", req.url);
  const res = NextResponse.redirect(url);
  clearCookie(res);
  return res;
}