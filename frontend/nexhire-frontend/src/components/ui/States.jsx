import { AlertCircle, Loader2 } from "lucide-react";

export function Loading({ label = "Loading..." }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-20 text-sm text-muted">
      <Loader2 size={16} className="animate-spin" />
      {label}
    </div>
  );
}

export function ErrorNotice({ message, onRetry }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="font-semibold underline">
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="card py-14 text-center">
      <h2 className="text-xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
