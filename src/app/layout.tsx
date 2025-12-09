/* eslint-disable @typescript-eslint/no-unused-vars */

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { HeaderWrapper } from "../components/HeaderWrapper";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChiasmProvider } from "@/contexts/ChiasmContext";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Tолкование",
  description: "A place for thoughtful commentary on the Bible",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ChiasmProvider>
            <HeaderWrapper />
            <main className="container mx-auto p-4 mt-4 mb-12 max-w-screen-xl">
              {children}
            </main>
            <Toaster />
          </ChiasmProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
