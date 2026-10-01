import Link from "next/link";
import { APP_CONFIG } from "@/lib/constants";
import { GraduationCap, ShieldCheck, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-8 text-sm text-slate-600">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-teal-800 text-white">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="font-semibold text-slate-800">{APP_CONFIG.name}</span>
            <span className="text-xs text-slate-500">
              — Navodaya Vidyalaya Class 6 Selection Exam Prep
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
              Parent & Guardian First Security
            </span>
            <span>•</span>
            <span>Local ₹500 Mock Sandbox</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} ABCD of JNVST. Dedicated to 500 aspiring rural &
            semi-urban students.
          </p>
          <p className="flex items-center gap-1">
            Built for structured education with{" "}
            <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
