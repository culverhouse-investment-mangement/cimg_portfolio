import { NextResponse } from "next/server";
import { z } from "zod";
import { isConfigured as resendConfigured, sendEmail } from "@/lib/email/resend";

// Public self-serve sign-in. Replaces Supabase's default-SMTP magic-link
// flow (which is rate-limited, routinely blocked by .edu MX, and gives
// no delivery signal). We generate the link server-side with the
// service-role key, then either:
//   - mail it via Resend (preferred), or
//   - hand it back to the submitter so they can open it in their browser.
//
// Returning the URL to the same client that just typed its own email is
// equivalent to the existing /admin/team invite UX — the link is
// exactly what the person would have received over email. New accounts
// land as viewers via the `on_auth_user_created` trigger; role upgrades
// are an explicit admin action elsewhere.

const BodySchema = z.object({
  email: z.string().email().trim().toLowerCase(),
});

type GenerateLinkResponse = {
  hashed_token?: unknown;
  action_link?: unknown;
  properties?: {
    hashed_token?: unknown;
    action_link?: unknown;
  };
  user?: { id?: unknown };
  id?: unknown;
};

export async function POST(request: Request) {
  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(await request.json());
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
    // Don't echo the raw Supabase error body — could leak internals.
    return NextResponse.json(
      { error: `generate_link failed with ${linkRes.status}` },
      { status: 502 },
    );
  }

  const body = (await linkRes.json()) as GenerateLinkResponse;
  const hashedToken = extractHashedToken(body);
  const userId = extractUserId(body);

  if (!hashedToken || !userId) {
    return NextResponse.json(
      { error: "unexpected generate_link response" },
      { status: 502 },
    );
  }

  const confirmUrl = new URL(`${appOrigin}/auth/confirm`);
  confirmUrl.searchParams.set("token_hash", hashedToken);
  confirmUrl.searchParams.set("type", "magiclink");
  confirmUrl.searchParams.set("next", "/admin");
  const url = confirmUrl.toString();

  if (!resendConfigured()) {
    return NextResponse.json({ ok: true, delivery: "manual", url });
  }

  try {
    await sendEmail({
      to: parsed.email,
      subject: "Your CIMG Portfolio sign-in link",
      text: textBody(url),
      html: htmlBody(url),
    });
  } catch (err) {
    // Fall back to manual so the user isn't stranded. Don't leak the
    // provider error string — log it server-side instead.
    console.error("resend send failed:", err);
    return NextResponse.json({ ok: true, delivery: "manual", url });
  }

  return NextResponse.json({ ok: true, delivery: "email" });
}

function extractHashedToken(body: GenerateLinkResponse): string | null {
  if (typeof body.hashed_token === "string") return body.hashed_token;
  if (typeof body.properties?.hashed_token === "string") {
    return body.properties.hashed_token;
  }
  const rawLink =
    typeof body.action_link === "string"
      ? body.action_link
      : typeof body.properties?.action_link === "string"
        ? body.properties.action_link
        : null;
  if (!rawLink) return null;
  try {
    return new URL(rawLink).searchParams.get("token");
  } catch {
    return null;
  }
}

function extractUserId(body: GenerateLinkResponse): string | null {
  if (typeof body.user?.id === "string") return body.user.id;
  if (typeof body.id === "string") return body.id;
  return null;
}

function textBody(url: string): string {
  return [
    "Click the link below to sign in to CIMG Portfolio:",
    "",
    url,
    "",
    "This link expires in 1 hour. If you didn't request it, ignore this email.",
  ].join("\n");
}

function htmlBody(url: string): string {
  const safeUrl = escapeHtml(url);
  return `<!doctype html>
<html>
  <body style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; color: #111; line-height: 1.5;">
    <p>Click the link below to sign in to <strong>CIMG Portfolio</strong>:</p>
    <p><a href="${safeUrl}" style="display: inline-block; padding: 10px 16px; background: #111; color: #fff; text-decoration: none; border-radius: 6px;">Sign in</a></p>
    <p style="font-size: 12px; color: #555;">Or paste this URL into your browser:<br><code style="word-break: break-all;">${safeUrl}</code></p>
    <p style="font-size: 12px; color: #555;">This link expires in 1 hour. If you didn&apos;t request it, ignore this email.</p>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
