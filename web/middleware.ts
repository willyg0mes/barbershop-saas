import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT || "dom-corte";
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost";

function extractSubdomain(host: string): string | null {
  const hostname = host.split(":")[0].toLowerCase();

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return null;
  }

  if (hostname.endsWith(".localhost")) {
    const [subdomain] = hostname.split(".");
    return subdomain || null;
  }

  const rootParts = ROOT_DOMAIN.split(".").length;
  const parts = hostname.split(".");

  if (parts.length <= rootParts) {
    return null;
  }

  return parts[0] === "www" ? parts[1] ?? null : parts[0];
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/backend") ||
    pathname.startsWith("/icons") ||
    pathname === "/offline" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0].toLowerCase();
  let tenantSlug: string | null = null;

  const pathMatch = pathname.match(/^\/([a-z0-9-]+)(?:\/|$)/);
  if (pathMatch && pathMatch[1] !== "offline") {
    tenantSlug = pathMatch[1];
  }

  if (!tenantSlug) {
    const subdomain = extractSubdomain(host);

    if (subdomain) {
      try {
        const apiBase = process.env.API_URL || "http://127.0.0.1:8080";
        const response = await fetch(
          `${apiBase}/api/v1/tenants/resolve?host=${encodeURIComponent(subdomain)}`,
          { next: { revalidate: 300 } },
        );

        if (response.ok) {
          const payload = await response.json();
          tenantSlug = payload.slug;
        }
      } catch {
        tenantSlug = subdomain;
      }
    } else if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      try {
        const apiBase = process.env.API_URL || "http://127.0.0.1:8080";
        const response = await fetch(
          `${apiBase}/api/v1/tenants/resolve?host=${encodeURIComponent(hostname)}`,
          { next: { revalidate: 300 } },
        );

        if (response.ok) {
          const payload = await response.json();
          tenantSlug = payload.slug;
        }
      } catch {
        tenantSlug = null;
      }
    }
  }

  if (!tenantSlug) {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = `/${DEFAULT_TENANT}`;
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  if (pathname === "/" || !pathname.startsWith(`/${tenantSlug}`)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${tenantSlug}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  const response = NextResponse.next();
  response.headers.set("x-tenant-slug", tenantSlug);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
