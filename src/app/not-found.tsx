import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <Card className="border-slate-200 p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-teal-800">
          <FileQuestion className="h-8 w-8" />
        </div>

        <h1 className="mb-2 text-xl font-bold text-slate-900">Page Not Found</h1>
        <p className="mb-6 text-xs text-slate-600">
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link href="/">
            <Button variant="primary" size="md">
              <Home className="mr-1.5 h-4 w-4" /> Go to Home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="md">
              Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
