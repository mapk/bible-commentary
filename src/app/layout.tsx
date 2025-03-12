/* eslint-disable @typescript-eslint/no-unused-vars */

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "../components/Header";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Bible Commentary",
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
          <Header />
          <main className="container mx-auto p-4 mt-4 mb-12 max-w-screen-xl">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
