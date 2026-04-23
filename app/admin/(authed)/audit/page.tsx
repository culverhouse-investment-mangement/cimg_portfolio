import { createClient } from "@/lib/supabase/server";
import { AuditClient } from "./audit-client";

export const dynamic = "force-dynamic";

// The audit_log table is admin-read-only via RLS. The server
// component fetches the most recent 500 events and hands them off
// to the client component for filtering. 500 is an arbitrary cap
// chosen so the initial SSR stays snappy; paginate later if the
// group outgrows it.

export default async function AuditPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("id, actor_email, action, resource_type, resource_id, changes, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6 text-sm text-red-900 dark:text-red-200">
        Failed to load audit log: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit Log</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Every admin mutation, newest first. Actor emails are snapshotted at
          write time so events stay attributable after the user is removed.
        </p>
      </div>
      <AuditClient rows={data ?? []} />
    </div>
  );
}
