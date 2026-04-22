#!/usr/bin/env node
// Trigger a live price fetch against a running app. Reads CRON_SECRET
// and APP_URL from .env.local via node's --env-file flag.
//
//   npm run fetch-now                # intraday tick, force outside hours
//   npm run fetch-now -- daily       # end-of-day snapshot + fundamentals
//
// For production the GitHub Actions workflows under .github/workflows
// call the same endpoints on a schedule. This script is only for
// manual runs — seeding prices during setup, backfilling after an
// outage, or testing without waiting 15 minutes.

const which = (process.argv[2] ?? "tick").toLowerCase();
if (which !== "tick" && which !== "daily") {
  console.error("usage: npm run fetch-now [-- tick|daily]");
  process.exit(1);
}

const appUrl = process.env.APP_URL ?? "http://localhost:3000";
const secret = process.env.CRON_SECRET;

if (!secret) {
  console.error(
    "Missing CRON_SECRET in .env.local. Generate one with:\n" +
    "  openssl rand -hex 32",
  );
  process.exit(1);
}

const url =
  which === "tick"
    ? `${appUrl}/api/cron/tick?force=1`
    : `${appUrl}/api/cron/daily`;

const res = await fetch(url, {
  method: "POST",
  headers: { Authorization: `Bearer ${secret}` },
});

const text = await res.text();
let body;
try {
  body = JSON.parse(text);
} catch {
  body = text;
}

console.log(`${which} → ${res.status}`);
console.log(typeof body === "string" ? body : JSON.stringify(body, null, 2));

if (!res.ok) process.exit(1);
