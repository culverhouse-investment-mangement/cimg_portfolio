import { createAdminClient } from "@/lib/supabase/admin";

// Append-only audit trail. Called from admin API routes after the
// mutation succeeds. Failures to write the audit row are logged and
// swallowed — we never want to abort a user-facing write because
// the observability layer is temporarily unhappy.

export type AuditEntry = {
  actorUserId: string;
  actorEmail: string | null;
  action: string;            // dotted, e.g. "cash.delete", "users.promote"
  resourceType?: string | null;
  resourceId?: string | null;
  changes?: unknown;         // JSON-able diff / payload
};

export async function recordAuditEvent(entry: AuditEntry): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("audit_log").insert({
      actor_user_id: entry.actorUserId,
      actor_email: entry.actorEmail,
      action: entry.action,
      resource_type: entry.resourceType ?? null,
      resource_id: entry.resourceId ?? null,
      changes: entry.changes ?? null,
    });
    if (error) {
      console.error("audit_log insert failed:", error.message, {
        action: entry.action,
      });
    }
  } catch (err) {
    console.error("audit_log exception:", err);
  }
}
