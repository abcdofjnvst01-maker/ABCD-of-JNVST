"use client";

import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { signInAction } from "@/features/auth/actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { LogIn, Sparkles } from "lucide-react";

export function SignInForm() {
  const [state, formAction, isPending] = useActionState(signInAction, null);
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");

  useEffect(() => {
    if (state?.success && state?.redirectUrl) {
      window.location.href = state.redirectUrl;
    }
  }, [state]);

  const handleFillDemo = (type: "guardian" | "admin") => {
    if (type === "guardian") {
      setEmailValue("guardian@example.com");
      setPasswordValue("Guardian@123456");
    } else {
      setEmailValue("admin@abcdjnvst.in");
      setPasswordValue("Admin@123456");
    }
  };

  return (
    <div className="space-y-6">
      {state && !state.success && state.error && (
        <Alert variant="error" title="Sign In Error">
          {state.error}
        </Alert>
      )}

      <form action={formAction} className="space-y-4">
        <Input
          label="Guardian / Admin Email Address"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="e.g. parent@example.com"
          value={emailValue}
          onChange={(e) => setEmailValue(e.target.value)}
          error={state?.fieldErrors?.email?.[0]}
        />

        <div className="space-y-1">
          <Input
            label="Password"
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={passwordValue}
            onChange={(e) => setPasswordValue(e.target.value)}
            error={state?.fieldErrors?.password?.[0]}
          />
          <div className="flex justify-end pt-1">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-teal-800 hover:text-teal-900 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full text-base"
          isLoading={isPending}
        >
          <LogIn className="mr-2 h-4 w-4" />
          Sign In to Account
        </Button>
      </form>

      {/* Local Dev Demo Quick-Fill (Development Only) */}
      {process.env.NODE_ENV === "development" && (
        <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3.5 text-xs text-slate-600">
          <div className="mb-2 flex items-center gap-1.5 font-semibold text-slate-800">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>Local Development Credentials:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo("guardian")}
              className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-teal-800 hover:bg-teal-50"
            >
              Fill Guardian (guardian@example.com)
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo("admin")}
              className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-50"
            >
              Fill Admin (admin@abcdjnvst.in)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
