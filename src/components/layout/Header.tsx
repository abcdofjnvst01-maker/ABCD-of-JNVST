import Link from "next/link";
import { getCurrentUser } from "@/server/authorization";
import { signOutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/Button";
import { GraduationCap, Shield, User, LogOut } from "lucide-react";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand / Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-800 text-white shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              ABCD of <span className="text-amber-600">JNVST</span>
            </span>
            <span className="ml-2 hidden rounded border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-800 sm:inline-block">
              Class 6 Prep
            </span>
          </div>
        </Link>

        {/* Navigation & User actions */}
        <nav className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/tests"
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 transition-colors sm:text-sm"
          >
            Mock Tests (टेस्ट)
          </Link>

          {!user ? (
            <>
              <Link
                href="/signin"
                className="px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:text-teal-800"
              >
                Sign In
              </Link>
              <Link href="/signup">
                <Button variant="primary" size="sm">
                  Enroll Guardian
                </Button>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              {user.role === "admin" ? (
                <>
                  <Link
                    href="/admin/questions"
                    className="flex items-center gap-1.5 rounded-md border border-teal-300 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-900 transition-colors hover:bg-teal-100"
                  >
                    Question Bank
                  </Link>
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100"
                  >
                    <Shield className="h-3.5 w-3.5 text-amber-700" />
                    Admin Console
                  </Link>
                </>
              ) : null}

              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:text-teal-800 sm:text-sm"
              >
                <User className="h-4 w-4 text-teal-700" />
                <span className="hidden md:inline">
                  {user.profile?.full_name || "Dashboard"}
                </span>
                <span className="md:hidden">Dashboard</span>
              </Link>

              <form action={signOutAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="px-2 text-slate-600 hover:text-rose-600"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="ml-1 hidden sm:inline">Sign Out</span>
                </Button>
              </form>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
