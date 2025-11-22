import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RedmineProvider } from "@/lib/context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Redmine Chat",
  description: "A chat interface for Redmine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RedmineProvider>
          {children}
        </RedmineProvider>
      </body>
    </html>
  );
}
