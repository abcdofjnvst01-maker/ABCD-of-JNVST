"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { signUpAction } from "@/features/auth/actions";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { INDIAN_STATES_AND_UTS } from "@/lib/constants";
import { UserPlus, ShieldCheck } from "lucide-react";

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
        <Alert variant="error" title="Sign Up Error">
          {state.error}
        </Alert>
      )}

      <div className="flex items-start gap-2.5 rounded-lg border border-teal-200 bg-teal-50/70 p-3.5 text-xs text-teal-950">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-800" />
        <p>
          <strong>Guardian Account First:</strong> This account belongs to the parent or
          guardian. You will be able to register and manage one or more student profiles
          inside your dashboard.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <Input
          label="Guardian Full Name"
          id="fullName"
          name="fullName"
          type="text"
          required
          placeholder="e.g. Ramesh Sharma"
          error={state?.fieldErrors?.fullName?.[0]}
        />

        <Input
          label="Email Address (Used for Login)"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="e.g. parent@example.com"
          error={state?.fieldErrors?.email?.[0]}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Mobile Number"
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            placeholder="10-digit Indian Mobile"
            hint="For important exam notifications"
            error={state?.fieldErrors?.phoneNumber?.[0]}
          />

          <Select
            label="State / Union Territory"
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
          characters. Mobile numbers are not permitted as passwords.
        </p>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full text-base"
          isLoading={isPending}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Create Guardian Account
        </Button>
      </form>

      <div className="text-center text-xs text-slate-600">
        Already have a guardian account?{" "}
        <Link href="/signin" className="font-semibold text-teal-800 hover:underline">
          Sign in here
        </Link>
      </div>
    </div>
  );
}
