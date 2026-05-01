import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const bodyFont = localFont({
  variable: "--font-body",
  src: "../../public/fonts/NunitoSans10ptCondensedMedium.ttf",
  weight: "500",
  style: "normal",
});

const displayFont = localFont({
  variable: "--font-display",
  src: [
    {
      path: "../../public/fonts/RefrigeratorDeluxeBold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/RefrigeratorDeluxeExtrabold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/fonts/RefrigeratorDeluxeHeavy.ttf",
      weight: "900",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  title: "HZU18 Final Round Scoreboard",
  description:
    "Standalone broadcast scoreboard shell for scoreboard.haruulzangi.mn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
