import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Sidebar, MobileNav } from "@/components/sidebar";
import { ToastProvider } from "@/components/ui";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pundi — Keuangan Keluarga",
  description:
    "Catat arus keluar masuk keuangan keluarga dan pantau aset dalam satu tempat yang tenang.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${jakarta.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased">
        <ToastProvider>
          <Sidebar />
          <main className="min-h-screen pb-28 lg:pb-10 lg:pl-[272px]">
            {children}
          </main>
          <MobileNav />
        </ToastProvider>
      </body>
    </html>
  );
}
