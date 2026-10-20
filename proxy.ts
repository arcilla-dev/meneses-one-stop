import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { homeFor, officeOfPath } from "@/lib/adminHome";

const isUnder = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const protectedPaths = [
    "/studentview",
    "/offices",
    "/requests",
    "/announcements",
    "/profile",
    "/admin",
    "/adminv2",
  ];

  const isProtectedPath = protectedPaths.some((path) => isUnder(pathname, path));

  // Not logged in and trying to reach a protected page → bounce to login
  if (isProtectedPath && !user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const isAdminArea = isUnder(pathname, "/admin") || isUnder(pathname, "/adminv2");

  if (user && isAdminArea) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, office")
      .eq("id", user.id)
      .single();

    const role = profile?.role;
    const office = profile?.office;

    // Students (or a failed profile read) never get into any admin area
    if (role !== "admin" && role !== "superadmin") {
      return NextResponse.redirect(new URL("/studentview", request.url));
    }

    // /admin/create-admin is superadmin-only
    if (isUnder(pathname, "/admin/create-admin") && role !== "superadmin") {
      return NextResponse.redirect(new URL(homeFor(role, office), request.url));
    }

    // An office admin may only open their own office's pages
    if (role === "admin" && isUnder(pathname, "/adminv2")) {
      const target = officeOfPath(pathname);
      if (target && target !== office) {
        return NextResponse.redirect(new URL(homeFor(role, office), request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/studentview/:path*",
    "/offices/:path*",
    "/requests/:path*",
    "/announcements/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/adminv2/:path*",
  ],
};