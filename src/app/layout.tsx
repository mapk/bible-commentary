import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { HeaderWrapper } from "../components/HeaderWrapper";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChiasmProvider } from "@/contexts/ChiasmContext";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <ChiasmProvider>
              <HeaderWrapper />
              <main className="container mx-auto p-4 mt-4 mb-12 max-w-screen-xl">
                {children}
              </main>
              <Toaster />
            </ChiasmProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
