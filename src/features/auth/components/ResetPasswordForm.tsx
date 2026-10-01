"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPasswordAction } from "@/features/auth/actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export function ResetPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await resetPasswordAction(formData);

    if (result && !result.success) {
      setError(result.error || "Failed to process password reset.");
    } else {
      setSuccess(true);
    }
    setIsLoading(false);
  };

  if (success) {
    return (
      <div className="space-y-4 py-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Reset Instructions Sent</h3>
        <p className="text-sm text-slate-600">
          If an account exists with that email, instructions have been sent to reset your
          password.
        </p>
        <Link href="/signin">
          <Button variant="outline" size="md" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="error" title="Error">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Guardian Email Address"
          id="email"
          name="email"
          type="email"
          required
          placeholder="e.g. parent@example.com"
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isLoading}
        >
          <Mail className="mr-2 h-4 w-4" />
          Send Reset Link
        </Button>
      </form>

      <div className="text-center text-xs text-slate-600">
        <Link
          href="/signin"
          className="inline-flex items-center gap-1 font-semibold text-teal-800 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
        </Link>
      </div>
    </div>
  );
}
