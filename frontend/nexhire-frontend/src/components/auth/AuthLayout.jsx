import { Brain } from "lucide-react";

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600">
              <Brain className="h-7 w-7 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            NexHire
          </h1>

          <p className="mt-2 text-slate-500">
            AI Powered Interview Preparation
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">
            {title}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {subtitle}
          </p>

          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;