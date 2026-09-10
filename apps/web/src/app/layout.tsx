import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { AuthHeaderControls } from "@/components/auth-header-controls";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RediSetHack - Learn. Code. Level Up.",
  description:
    "Programming learning platform with lessons, quizzes, code practice, and progression rewards.",
};

const authLocalization = {
  unstable__errors: {
    form_identifier_not_found:
      "No account associated with this email, please sign up",
    external_account_not_found:
      "No account associated with this email, please sign up",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={authLocalization}>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
              <Link
                href="/"
                className="flex items-center gap-2 font-bold text-lg tracking-tight"
              >
                <span className="text-primary text-xl">⚡</span>
                <span>RediSetHack</span>
              </Link>
              <AuthHeaderControls />
            </div>
          </header>
          <main className="flex-1 flex flex-col">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
