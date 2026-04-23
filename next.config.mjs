// Content Security Policy. Tight enough to block injection-flavored
// attacks, loose enough that Next.js (which needs inline scripts for
// hydration + theme FOUC prevention) and Recharts (inline style attrs
// on SVG elements) still work. No 'unsafe-eval' in production —
// Recharts doesn't need it.
//
// Connect-src allowlist covers only the hosts the browser actually
// reaches: the Supabase project API (for auth + the read-only PostgREST
// calls that happen client-side when the CSV-export clicks or theme-
// toggle cookie writes happen). SendGrid is server-side only so not
// listed. Add 'https:' to img-src just in case favicons or user-added
// images land in the admin UI later.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Baseline security headers for every response.
        source: "/:path*",
        headers: [
          // Defense-in-depth against MIME sniffing.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Disallow framing — we don't embed this anywhere.
          { key: "X-Frame-Options", value: "DENY" },
          // Don't leak full referrer URLs to third parties.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Turn off features the app never uses.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // Force HTTPS for a year on every browser that's already
          // loaded the site once. Includes subdomains so any future
          // preview URLs under the same apex are covered.
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // Layered resource allowlist; see csp definition above for
          // why each directive is what it is.
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
