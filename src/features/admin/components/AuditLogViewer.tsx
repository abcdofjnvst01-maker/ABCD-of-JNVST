import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { AuditLogRecord } from "@/server/db/types";
import { ShieldCheck, Terminal, Clock } from "lucide-react";

interface AuditLogViewerProps {
  logs: AuditLogRecord[];
}

export function AuditLogViewer({ logs }: AuditLogViewerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-teal-800" />
          System Security & Audit Trail
        </CardTitle>
        <CardDescription>
          Immutable log of administrative events, profile changes, and authentication
          actions.
        </CardDescription>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2.5">Timestamp</th>
              <th className="px-3 py-2.5">Actor & Role</th>
              <th className="px-3 py-2.5">Action</th>
              <th className="px-3 py-2.5">Resource</th>
              <th className="px-3 py-2.5">Metadata Context</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center font-sans text-slate-500">
                  No audit logs recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="transition-colors hover:bg-slate-50/75">
                  <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {new Date(log.created_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={log.actor_role === "admin" ? "accent" : "brand"}>
                      {log.actor_role}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 font-semibold text-slate-900">{log.action}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {log.resource_type}
                    {log.resource_id ? `:${log.resource_id.substring(0, 8)}...` : ""}
                  </td>
                  <td className="max-w-xs truncate px-3 py-2 text-slate-500">
                    {JSON.stringify(log.metadata)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
