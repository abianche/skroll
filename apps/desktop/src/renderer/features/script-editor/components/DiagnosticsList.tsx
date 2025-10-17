import { Badge } from "@components/ui/badge";
import type { Diagnostic } from "@skroll/ipc-contracts";

function formatLocation(diagnostic: Diagnostic): string {
  const { start } = diagnostic.range;
  return `Line ${start.line}, Col ${start.column}`;
}

function severityColor(severity: Diagnostic["severity"]): string {
  switch (severity) {
    case "error":
      return "destructive";
    case "warning":
      return "secondary";
    case "info":
    default:
      return "secondary";
  }
}

export function DiagnosticsList({ diagnostics }: Readonly<{ diagnostics: Diagnostic[] }>) {
  if (diagnostics.length === 0) return <p className="text-secondary">No diagnostics reported.</p>;
  return (
    <div className="space-y-2">
      {diagnostics.map((diagnostic) => (
        <div
          key={`${diagnostic.code}-${diagnostic.range.start.offset}`}
          className="rounded-md border text-primary p-3"
        >
          <div className="flex items-start justify-between">
            <Badge variant={severityColor(diagnostic.severity) as any}>{diagnostic.severity}</Badge>
            <span className="text-sm text-secondary">{formatLocation(diagnostic)}</span>
          </div>
          <div className="mt-1 text-sm font-medium">{diagnostic.code}</div>
          <div className="text-sm">{diagnostic.message}</div>
        </div>
      ))}
    </div>
  );
}
