import { createClient } from "@/lib/supabase/server";

/**
 * For admin API route handlers. Resolves to the authenticated admin's
 * user id on success. On failure, throws a Response that the caller
 * should return directly — either 401 (no session) or 403 (session
 * exists but profile.role !== "admin").
 */
export async function requireAdmin(): Promise<{ userId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return { userId: user.id };
}
