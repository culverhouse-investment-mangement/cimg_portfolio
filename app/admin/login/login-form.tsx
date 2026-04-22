"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

type SendResult =
  | { delivery: "email"; email: string }
  | { delivery: "manual"; email: string; url: string };

export function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const [result, setResult] = useState<SendResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const unauthorized = params.get("unauthorized") === "1";
  const callbackFailed = params.get("error") === "1";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg(null);
    setResult(null);

    const res = await fetch("/api/auth/email-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      delivery?: "email" | "manual";
      url?: string;
      error?: string;
    };

    if (!res.ok || !body.ok || !body.delivery) {
      setErrorMsg(body.error ?? "Something went wrong. Try again.");
      setStatus("idle");
      return;
    }

    if (body.delivery === "manual") {
      if (!body.url) {
        setErrorMsg("Server returned a manual fallback without a link.");
        setStatus("idle");
        return;
      }
      setResult({ delivery: "manual", email, url: body.url });
    } else {
      setResult({ delivery: "email", email });
    }
    setStatus("idle");
  }

  return (
    <main className="mx-auto mt-16 max-w-md p-6">
      <h1 className="text-2xl font-semibold">Admin Sign In</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Magic-link sign-in for the CIMG Portfolio Manager.
      </p>

      {unauthorized && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Your account isn&apos;t marked as an admin. Ask an existing admin to promote you.
        </div>
      )}
      {callbackFailed && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          That magic link didn&apos;t work — it may have expired. Request a new one below.
        </div>
      )}

      {result?.delivery === "email" ? (
        <div className="mt-6 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          Check <strong>{result.email}</strong> for a sign-in link. You can close this tab.
        </div>
      ) : result?.delivery === "manual" ? (
        <ManualLinkPanel email={result.email} url={result.url} />
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none"
              placeholder="pm@example.com"
              autoComplete="email"
            />
          </label>
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-md bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50"
          >
            {status === "sending" ? "Sending…" : "Send Magic Link"}
          </button>
          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
        </form>
      )}
    </main>
  );
}

function ManualLinkPanel({ email, url }: { email: string; url: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm">
      <div className="mb-1 font-medium text-amber-900">
        Email isn&apos;t configured yet — copy this link and open it.
      </div>
      <div className="mb-3 text-xs text-amber-800">
        We generated a sign-in link for <strong>{email}</strong>. Paste it into your
        browser to finish signing in.
      </div>
      <div className="flex items-start gap-2">
        <code className="block flex-1 break-all rounded bg-white px-2 py-1 text-xs text-gray-800">
          {url}
        </code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="mt-2 text-xs text-amber-800">
        Valid for ~1 hour. You&apos;ll land on /admin signed in.
      </div>
    </div>
  );
}
