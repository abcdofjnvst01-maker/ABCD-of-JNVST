import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
}

export function Alert({
  className,
  variant = "info",
  title,
  children,
  ...props
}: AlertProps) {
  const icons = {
    info: <Info className="h-5 w-5 flex-shrink-0 text-teal-700" />,
    success: <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-700" />,
    warning: <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-700" />,
    error: <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-700" />,
  };

  const variants = {
    info: "bg-teal-50/70 border-teal-200 text-teal-950",
    success: "bg-emerald-50/70 border-emerald-200 text-emerald-950",
    warning: "bg-amber-50/80 border-amber-200 text-amber-950",
    error: "bg-rose-50/70 border-rose-200 text-rose-950",
  };

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 text-sm",
        variants[variant],
        className
      )}
      {...props}
    >
      {icons[variant]}
      <div className="space-y-1">
        {title && <h5 className="font-semibold leading-tight">{title}</h5>}
        <div className="text-sm leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  );
}
