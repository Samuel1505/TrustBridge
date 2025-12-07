import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "./providers/Web3Provider";
import { headers } from "next/headers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrustBridge - Verified Donations on Blockchain",
  description: "Connect with verified NGOs and make transparent donations using cUSD on Celo blockchain. Every NGO founder is identity-verified through Self Protocol.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookies = (await headers()).get('cookie');

  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}