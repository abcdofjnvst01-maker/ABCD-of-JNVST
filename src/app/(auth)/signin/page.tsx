import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { SignInForm } from "@/features/auth/components/SignInForm";
import { GraduationCap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guardian Sign In | ABCD of JNVST",
  description: "Sign in to your guardian portal to manage registered student profiles.",
};

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <div className="mb-8 space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-800 text-white shadow-sm">
          <GraduationCap className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome Back</h1>
        <p className="text-xs text-slate-600">
          Sign in to manage your JNVST Class 6 student profiles
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <SignInForm />
      </Card>
    </div>
  );
}
