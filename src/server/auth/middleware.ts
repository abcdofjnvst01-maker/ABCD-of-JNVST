import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/server/db/types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock-jnvst-project.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-anon-key-middleware";

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Check user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const isDashboardRoute = url.pathname.startsWith("/dashboard");
  const isAdminRoute = url.pathname.startsWith("/admin");
  const isAuthRoute =
    url.pathname === "/signin" ||
    url.pathname === "/signup" ||
    url.pathname === "/forgot-password";

  // If unauthenticated and trying to access protected routes
  if (!user && (isDashboardRoute || isAdminRoute)) {
    // Check if dev bypass / local mock cookie is present
    const devSession = request.cookies.get("dev_auth_session")?.value;
    if (!devSession) {
      url.pathname = "/signin";
      url.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  // If user is authenticated and trying to visit login/signup
  if (user && isAuthRoute) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
