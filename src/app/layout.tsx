import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// §4.1: Inter is the locked headline + body family for the web build,
// self-hosted via next/font. Exposed as --font-inter → --font-sans in the theme.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MUSE — Your personal museum curator",
  description:
    "An AI-curated audio guide that turns any museum visit into a personal tour matched to your time and your interests.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
