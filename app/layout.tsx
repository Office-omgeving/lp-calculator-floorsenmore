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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-M5TLD7X5');`,
          }}
        />
      </head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-M5TLD7X5"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}
