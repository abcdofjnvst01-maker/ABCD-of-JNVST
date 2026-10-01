import { Card } from "@/components/ui/Card";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { GraduationCap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | ABCD of JNVST",
  description: "Reset your guardian account password.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <div className="mb-8 space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-800 text-white shadow-sm">
          <GraduationCap className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Reset Guardian Password
        </h1>
        <p className="text-xs text-slate-600">
          We will send password reset instructions to your registered email
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <ResetPasswordForm />
      </Card>
    </div>
  );
}
