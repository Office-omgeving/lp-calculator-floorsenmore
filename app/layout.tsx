import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bereken je richtprijs | Floors & More",
  description: "Bereken in enkele stappen een indicatieve richtprijs voor jouw gietvloer.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Bereken je richtprijs | Floors & More",
    description: "Ontvang meteen een transparante budgetindicatie voor jouw gietvloer.",
    images: [{ url: "/assets/floors-more-hero.png", alt: "Floors & More gietvloer" }],
    type: "website",
  },
  twitter: { card: "summary_large_image", images: ["/assets/floors-more-hero.png"] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
