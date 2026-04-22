// Tiny Resend wrapper. Posts to https://api.resend.com/emails over fetch
// — no SDK, no extra deps. Server-only: reads RESEND_API_KEY and
// RESEND_FROM from the environment and will throw if either is missing.
// Call isConfigured() first if you want a soft check.

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type RawResendResponse = {
  id?: unknown;
  message?: unknown;
  name?: unknown;
};

export function isConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

export async function sendEmail(input: SendEmailInput): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
    throw new Error(
      "Resend is not configured — set RESEND_API_KEY and RESEND_FROM in the server env.",
    );
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  const bodyText = await res.text();
  let body: RawResendResponse = {};
  try {
    body = bodyText ? (JSON.parse(bodyText) as RawResendResponse) : {};
  } catch {
    // Leave body empty; we'll surface the raw text in the error below.
  }

  if (!res.ok) {
    const message =
      typeof body.message === "string" ? body.message : bodyText || res.statusText;
    throw new Error(`Resend send failed (${res.status}): ${message}`);
  }

  if (typeof body.id !== "string") {
    throw new Error("Resend send succeeded but response was missing an id.");
  }
  return { id: body.id };
}
