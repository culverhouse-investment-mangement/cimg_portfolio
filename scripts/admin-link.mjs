#!/usr/bin/env node
// Generate a sign-in link for an admin, bypassing email entirely.
//
//   npm run admin-link -- you@example.com          # link only
//   npm run admin-link -- you@example.com --admin  # link + promote to admin
//
// Reads creds from .env.local via `node --env-file=`. Creates the auth
// user on first use (the schema trigger seeds a viewer profile), then
// calls Supabase's admin API for a hashed_token and prints a URL
// pointing at our own /auth/confirm route — which calls verifyOtp
// server-side, sets the session cookie, and redirects to /admin.

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const positional = args.filter((a) => !a.startsWith("--"));
const email = positional[0];
const promote = flags.has("--admin");

if (!email || !email.includes("@")) {
  console.error("usage: npm run admin-link -- <email> [--admin]");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const origin = process.env.APP_URL ?? "http://localhost:3000";

if (!supabaseUrl || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.",
  );
  process.exit(1);
}

const authHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

const linkRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
  method: "POST",
  headers: authHeaders,
  body: JSON.stringify({
    type: "magiclink",
    email,
    redirect_to: `${origin}/auth/confirm?next=/admin`,
  }),
});

if (!linkRes.ok) {
  console.error(`generate_link ${linkRes.status}: ${await linkRes.text()}`);
  process.exit(1);
}

const body = await linkRes.json();
// Response shape varies across Supabase versions; hashed_token is sometimes
// top-level and sometimes under `properties`. Pull it however it comes.
const hashedToken =
  body.hashed_token ??
  body.properties?.hashed_token ??
  (() => {
    const rawLink = body.action_link ?? body.properties?.action_link;
    return rawLink ? new URL(rawLink).searchParams.get("token") : null;
  })();
const userId = body.user?.id ?? body.id;

if (!hashedToken || !userId) {
  console.error("Unexpected response from generate_link:");
  console.error(JSON.stringify(body, null, 2));
  process.exit(1);
}

if (promote) {
  const upsertRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?on_conflict=user_id`,
    {
      method: "POST",
      headers: {
        ...authHeaders,
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({ user_id: userId, role: "admin" }),
    },
  );
  if (!upsertRes.ok) {
    console.error(`promote ${upsertRes.status}: ${await upsertRes.text()}`);
    process.exit(1);
  }
}

const confirmUrl = new URL(`${origin}/auth/confirm`);
confirmUrl.searchParams.set("token_hash", hashedToken);
confirmUrl.searchParams.set("type", "magiclink");
confirmUrl.searchParams.set("next", "/admin");

console.log(`\nSign-in link for ${email}${promote ? " (admin)" : ""}:\n`);
console.log(confirmUrl.toString());
console.log("\nPaste the URL above into a browser. Valid for ~1 hour.\n");
