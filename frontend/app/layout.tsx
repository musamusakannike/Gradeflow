import type { Metadata } from "next";
import { Bricolage_Grotesque, Fraunces } from "next/font/google";
import { ToastProvider } from "./_components/toast-provider";
import "./globals.css";

const sans = Bricolage_Grotesque({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GradeFlow | School results, fees, and academic operations",
  description:
    "A calm, modern operating system for multi-school academic setup, fees, scores, results, parents, and dashboards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
