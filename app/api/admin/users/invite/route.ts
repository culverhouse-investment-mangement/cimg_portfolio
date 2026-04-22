import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

// Wraps scripts/admin-link.mjs in an API route so an already-signed-in
// admin can invite teammates from the UI. Returns a sign-in URL the
// caller can copy and send over any channel. No SMTP dependency.

const InviteSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  role: z.enum(["admin", "viewer"]).default("viewer"),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch (res) {
    return res as Response;
  }

  let parsed;
  try {
    parsed = InviteSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "invalid body" },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const appOrigin = process.env.APP_URL ?? new URL(request.url).origin;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "server not configured" },
      { status: 500 },
    );
  }

  const linkRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "magiclink",
      email: parsed.email,
      redirect_to: `${appOrigin}/auth/confirm?next=/admin`,
    }),
  });
  if (!linkRes.ok) {
    return NextResponse.json(
      { error: `generate_link failed: ${await linkRes.text()}` },
      { status: 502 },
    );
  }

  const body = await linkRes.json();
  const hashedToken =
    body.hashed_token ??
    body.properties?.hashed_token ??
    (() => {
      const rawLink = body.action_link ?? body.properties?.action_link;
      return rawLink
        ? new URL(rawLink as string).searchParams.get("token")
        : null;
    })();
  const userId = body.user?.id ?? body.id;

  if (!hashedToken || !userId) {
    return NextResponse.json(
      { error: "unexpected generate_link response" },
      { status: 502 },
    );
  }

  // Trigger seeded a viewer row; upsert to apply the invited role.
  const admin = createAdminClient();
  const { error: upsertError } = await admin
    .from("profiles")
    .upsert(
      { user_id: userId, role: parsed.role },
      { onConflict: "user_id" },
    );
  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  const confirmUrl = new URL(`${appOrigin}/auth/confirm`);
  confirmUrl.searchParams.set("token_hash", hashedToken);
  confirmUrl.searchParams.set("type", "magiclink");
  confirmUrl.searchParams.set("next", "/admin");

  return NextResponse.json({
    url: confirmUrl.toString(),
    email: parsed.email,
    role: parsed.role,
    user_id: userId,
  });
}
