import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CIMG Portfolio",
  description: "Live portfolio dashboard for CIMG.",
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
    <html lang="en" className={theme}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
