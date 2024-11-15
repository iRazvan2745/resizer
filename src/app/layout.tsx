import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "resize.irazz.lol",
  description: "Discover a seamless image resizing experience with our cutting-edge technology, designed to help you achieve professional-grade results with ease and precision.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en">
        <ToastProvider>
        <body>{children}</body>
        </ToastProvider>
      </html>
  );
}
