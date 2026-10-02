import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  const protectedPaths = [
    "/studentview",
    "/offices",
    "/requests",
    "/announcements",
    "/profile",
    "/admin",
  ];

  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Not logged in and trying to reach a protected page → bounce to login
  if (isProtectedPath && !user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (user && request.nextUrl.pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    // /admin/create-admin is superadmin-only
    if (request.nextUrl.pathname.startsWith("/admin/create-admin")) {
      if (role !== "superadmin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
    // everything else under /admin needs at least admin
    else if (role !== "admin" && role !== "superadmin") {
      return NextResponse.redirect(new URL("/studentview", request.url));
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
  ],
};