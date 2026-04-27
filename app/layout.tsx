import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Editorial serif used only for the dashboard wordmark and major
// section heads. Adds character without dragging the rest of the UI
// into "tech-blue grotesque" territory.
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CIMG Portfolio",
    template: "%s · CIMG Portfolio",
  },
  description: "Live portfolio dashboard for the Culverhouse Investment Management Group.",
  applicationName: "CIMG Portfolio",
  openGraph: {
    title: "CIMG Portfolio",
    description: "Live portfolio dashboard for the Culverhouse Investment Management Group.",
    type: "website",
    siteName: "CIMG Portfolio",
  },
  twitter: {
    card: "summary",
    title: "CIMG Portfolio",
    description: "Live portfolio dashboard for the Culverhouse Investment Management Group.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Default to dark; only switch to light if the user has explicitly
  // chosen it via the theme toggle (which sets the cookie).
  const theme = (await cookies()).get("theme")?.value === "light" ? "" : "dark";

  return (
    <html
      lang="en"
      className={`${theme} ${inter.variable} ${newsreader.variable}`}
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}
