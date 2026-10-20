import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Provider } from "./provider";
import { Toaster } from "sonner";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Client Dashboard | CoverPro",
    template: "%s | CoverPro",
  },
  description:
    "Post building and renovation projects, compare quotes from verified pros, and pay safely through milestone escrow.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-ZA" className={`${dmSans.variable} antialiased`}>
      <body>
        <ClerkProvider>
          <Provider>{children}</Provider>
          <Toaster />
        </ClerkProvider>
      </body>
    </html>
  );
}
