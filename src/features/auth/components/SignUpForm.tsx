"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { signUpAction } from "@/features/auth/actions";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { INDIAN_STATES_AND_UTS } from "@/lib/constants";
import { UserPlus, Sparkles } from "lucide-react";

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(signUpAction, null);

  useEffect(() => {
    if (state?.success && state?.redirectUrl) {
      window.location.href = state.redirectUrl;
    }
  }, [state]);

  const stateOptions = INDIAN_STATES_AND_UTS.map((s) => ({ value: s, label: s }));

  return (
    <div className="space-y-6">
      {state && !state.success && state.error && (
        <Alert variant="error" title="Registration Error">
          {state.error}
        </Alert>
      )}

      <div className="flex items-start gap-2.5 rounded-lg border border-teal-200 bg-teal-50/70 p-3.5 text-xs text-teal-950">
        <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-800" />
        <p>
          <strong>Direct Student Account:</strong> Register once to access all JNVST Class
          6 mock test series, bilingual question bank (English/Hindi), and virtual OMR
          simulation.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <Input
          label="Student Full Name (परीक्षार्थी का पूरा नाम)"
          id="fullName"
          name="fullName"
          type="text"
          required
          placeholder="e.g. Aarav Sharma"
          error={state?.fieldErrors?.fullName?.[0]}
        />

        <Input
          label="Email Address (Login ID)"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="e.g. student@example.com"
          error={state?.fieldErrors?.email?.[0]}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Mobile Number (Optional)"
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            placeholder="10-digit Indian Mobile"
            hint="For test notifications & OTPs"
            error={state?.fieldErrors?.phoneNumber?.[0]}
          />

          <Select
            label="State / Union Territory (राज्य)"
            id="state"
            name="state"
            required
            placeholder="Select State"
            options={stateOptions}
            error={state?.fieldErrors?.state?.[0]}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Password"
            id="password"
            name="password"
            type="password"
            required
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            error={state?.fieldErrors?.password?.[0]}
          />

          <Input
            label="Confirm Password"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            placeholder="Re-enter password"
            error={state?.fieldErrors?.confirmPassword?.[0]}
          />
        </div>

        <p className="text-xs text-slate-500">
          * Password must be at least 8 characters and include uppercase and numeric
          characters.
        </p>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full text-base bg-teal-800 hover:bg-teal-900 text-white font-bold"
          isLoading={isPending}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Create Student Account
        </Button>
      </form>

      <div className="text-center text-xs text-slate-600">
        Already have an account?{" "}
        <Link href="/signin" className="font-semibold text-teal-800 hover:underline">
          Sign in here
        </Link>
      </div>
    </div>
  );
}
