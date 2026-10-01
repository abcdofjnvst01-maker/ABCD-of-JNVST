"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error boundary caught:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <Card className="border-slate-200 p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <h1 className="mb-2 text-xl font-bold text-slate-900">Something went wrong</h1>
        <p className="mb-6 text-xs text-slate-600">
          An unexpected error occurred. Please try again or return to home.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button variant="primary" size="md" onClick={() => reset()}>
            <RefreshCw className="mr-1.5 h-4 w-4" /> Try Again
          </Button>
          <Link href="/">
            <Button variant="outline" size="md">
              <Home className="mr-1.5 h-4 w-4" /> Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
