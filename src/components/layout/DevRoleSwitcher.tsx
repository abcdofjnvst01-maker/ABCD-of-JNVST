import { devSwitchUserRole } from "@/features/auth/actions";
import { Shield, User, RefreshCw } from "lucide-react";

export function DevRoleSwitcher({ currentRole }: { currentRole?: string }) {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <aside
      aria-label="Development Role Switcher"
      className="border-b border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-200"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-950">
            Phase 0 Dev Sandbox
          </span>
          <span className="text-slate-400">
            Active Role:{" "}
            <strong className="capitalize text-white">
              {currentRole || "Anonymous"}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <form
            action={async () => {
              "use server";
              await devSwitchUserRole("student");
            }}
          >
            <button
              type="submit"
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs transition-colors ${
                currentRole === "student" || currentRole === "guardian"
                  ? "bg-teal-700 font-semibold text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <User className="h-3 w-3" />
              Switch to Demo Student (Aarav)
            </button>
          </form>

          <form
            action={async () => {
              "use server";
              await devSwitchUserRole("admin");
            }}
          >
            <button
              type="submit"
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs transition-colors ${
                currentRole === "admin"
                  ? "bg-amber-600 font-semibold text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              Switch to Lead Admin
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
