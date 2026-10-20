import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Nunito, Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/y2k-dialog";

const pressStart = Press_Start_2P({
  weight: "400",
  variable: "--font-pixel",
  subsets: ["latin"],
});

const vt323 = VT323({
  weight: "400",
  variable: "--font-pixel-lg",
  subsets: ["latin"],
});

const nunito = Nunito({
  weight: ["400", "600", "700", "800"],
  variable: "--font-body",
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

const clerkAppearance = {
  variables: {
    colorPrimary: "#FFD84D",
    colorText: "#1A0A2E",
    colorTextSecondary: "#6B4C6B",
    colorBackground: "#FFF5DC",
    colorInputBackground: "#FFFFFF",
    colorInputText: "#1A0A2E",
    borderRadius: "0px",
  },
  elements: {
    card: {
      backgroundColor: "#FFF5DC",
      border: "2px solid #1A0A2E",
      boxShadow: "6px 6px 0 #1A0A2E",
      borderRadius: "0px",
    },
    headerTitle: {
      fontFamily: "var(--font-pixel)",
      fontSize: "12px",
      lineHeight: 1.8,
      color: "#1A0A2E",
    },
    headerSubtitle: {
      fontFamily: "var(--font-body)",
      fontWeight: 700,
      color: "#6B4C6B",
    },
    socialButtonsBlockButton: {
      fontFamily: "var(--font-body)",
      fontWeight: 800,
      textTransform: "uppercase",
      fontSize: "12px",
      border: "2px solid #1A0A2E",
      boxShadow: "3px 3px 0 #1A0A2E",
      borderRadius: "0px",
      color: "#1A0A2E",
    },
    formButtonPrimary: {
      fontFamily: "var(--font-pixel)",
      fontSize: "10px",
      textTransform: "uppercase",
      border: "2px solid #1A0A2E",
      boxShadow: "3px 3px 0 #1A0A2E",
      borderRadius: "0px",
      backgroundColor: "#FFD84D",
      color: "#1A0A2E",
      "&:hover": { filter: "brightness(1.08)" },
      "&:active": { transform: "translate(3px, 3px)", boxShadow: "none" },
    },
    formFieldInput: {
      fontFamily: "var(--font-body)",
      fontWeight: 700,
      border: "2px solid #1A0A2E",
      boxShadow: "2px 2px 0 #1A0A2E",
      borderRadius: "0px",
      backgroundColor: "#FFFFFF",
    },
    formFieldLabel: {
      fontFamily: "var(--font-body)",
      fontWeight: 600,
      textTransform: "uppercase",
      fontSize: "11px",
      color: "#6B4C6B",
    },
    footerActionLink: {
      fontFamily: "var(--font-body)",
      fontWeight: 700,
      color: "#1A0A2E",
    },
    identityPreviewEditButton: {
      fontFamily: "var(--font-body)",
      fontWeight: 700,
      borderRadius: "0px",
    },
    otpInput: {
      fontFamily: "var(--font-pixel-lg)",
      fontSize: "24px",
      border: "2px solid #1A0A2E",
      boxShadow: "2px 2px 0 #1A0A2E",
      borderRadius: "0px",
      backgroundColor: "#FFFFFF",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={authLocalization} appearance={clerkAppearance}>
      <html
        lang="en"
        className={`${pressStart.variable} ${vt323.variable} ${nunito.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col font-body">
          <ToastProvider>
            <main className="flex-1 flex flex-col">{children}</main>
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
