import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/server/auth/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  if (code) {
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch {
      // Return redirect to fallback
    }
  }

  // Return user to an error page with instructions
  return NextResponse.redirect(`${origin}/signin?error=auth_callback_failed`);
}
