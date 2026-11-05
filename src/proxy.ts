import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public static assets, auth API routes, and public market data unconditionally
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/stock-price") ||
    pathname.startsWith("/api/stock-chart") ||
    pathname.startsWith("/api/trending") ||
    pathname.startsWith("/api/search-assets") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".ico")
  ) {
    return NextResponse.next();
  }

  // 2. Read session cookie
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  // 3. User is already authenticated
  if (session.valid) {
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    const response = NextResponse.next();
    // Prevent browser bfcache (back-forward cache) from retaining private portfolio data
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  }

  // 4. User is NOT authenticated
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // If unauthenticated API call (other than auth), return 401 JSON
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }

  // Redirect to /login
  const loginUrl = new URL("/login", request.url);
  if (pathname !== "/") {
    loginUrl.searchParams.set("from", pathname);
  }
  return NextResponse.redirect(loginUrl);
}

export default proxy;
export const middleware = proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};

