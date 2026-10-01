import { Card } from "@/components/ui/Card";
import { SignUpForm } from "@/features/auth/components/SignUpForm";
import { GraduationCap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Guardian Account | ABCD of JNVST",
  description:
    "Register a guardian account to enroll students for JNVST Class 6 preparation.",
};

export default function SignUpPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-14">
      <div className="mb-6 space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-800 text-white shadow-sm">
          <GraduationCap className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Create Guardian Account
        </h1>
        <p className="text-xs text-slate-600">
          Register as parent or guardian to enroll students into ABCD of JNVST
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <SignUpForm />
      </Card>
    </div>
  );
}
