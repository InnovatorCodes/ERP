"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { useState } from "react";
import { UserProvider } from "@/context/user-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-gray-50 dark:bg-zinc-900 overflow-hidden text-sm sm:text-base`}
      >
        <UserProvider>
          <div className="flex h-screen w-full overflow-hidden">
            {/* Sidebar Wrapper - Fixed Height */}
            <div className="h-full shrink-0">
              <Sidebar
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
              />
            </div>

            {/* Main Content Area - Scrollable */}
            <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative flex flex-col">
              {children}
            </main>
          </div>
          <Toaster position="top-right" />
        </UserProvider>
      </body>
    </html>
  );
}
