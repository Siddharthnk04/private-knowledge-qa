import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Private Knowledge Q&A",
  description: "RAG Application with TF-IDF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-background text-text-main flex flex-col items-center p-8">
          <div className="w-full max-w-4xl mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
