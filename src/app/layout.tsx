import type { Metadata } from "next";
import { AskAkrithos } from "@/components/ask-akrithos";
import { BookingProvider } from "@/components/booking-provider";
import { integrations } from "@/config/integrations";
import "@/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(integrations.siteUrl),
  title: {
    default: "Akrithos | Secure Enterprise AI Agents & Automation",
    template: "%s | Akrithos",
  },
  description:
    "Secure, outcome-linked AI agents, knowledge systems, and automation designed around your workflows, data boundaries, and business goals.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Akrithos | Secure Enterprise AI Agents & Automation",
    description:
      "Enterprise AI systems, illustrative workflow controls, and live practitioner training from Akrithos.",
    url: "/",
    siteName: "Akrithos",
    locale: "en_US",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <BookingProvider>
          {children}
          <AskAkrithos />
        </BookingProvider>
      </body>
    </html>
  );
}
