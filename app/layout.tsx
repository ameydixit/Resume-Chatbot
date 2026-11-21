import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Folio — Interview practice",
  description:
    "Practice interviews with an AI candidate grounded in your resume.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
