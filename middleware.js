import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  if (pathname === "/" || pathname === "/index.html") {
    return NextResponse.rewrite(new URL("/api/ssr", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/index.html"],
};
