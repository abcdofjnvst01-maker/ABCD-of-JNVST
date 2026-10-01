import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ShieldAlert, ArrowLeft, Home, UserCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Access Restricted | ABCD of JNVST",
  description: "Unauthorized access or insufficient permissions.",
};

interface UnauthorizedPageProps {
  searchParams: Promise<{ reason?: string }>;
}

export default async function UnauthorizedPage({ searchParams }: UnauthorizedPageProps) {
  const { reason } = await searchParams;

  const messages: Record<string, { title: string; desc: string }> = {
    admin_required: {
      title: "Administrator Access Required",
      desc: "This area is restricted to system administrators only. Your current account does not have administrative privileges.",
    },
    guardian_required: {
      title: "Guardian Account Required",
      desc: "Please sign in with a registered guardian account to access this section.",
    },
    student_access_denied: {
      title: "Student Profile Restricted",
      desc: "You can only view and manage student profiles that are linked to your guardian account.",
    },
    default: {
      title: "Access Forbidden",
      desc: "You do not have permission to access the requested resource.",
    },
  };

  const info = (reason && messages[reason]) || messages.default;

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <Card className="border-slate-200 p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h1 className="mb-2 text-xl font-bold text-slate-900">{info.title}</h1>
        <p className="mb-6 text-xs leading-relaxed text-slate-600">{info.desc}</p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full">
              <UserCheck className="mr-1.5 h-4 w-4" /> Guardian Dashboard
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" size="md" className="w-full">
              <Home className="mr-1.5 h-4 w-4" /> Home Page
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
