import Image from "next/image";
import PriceFunnel from "./PriceFunnel";

export default function LandingPage() {
  return (
    <main className="calculator-page theme-floors">
      <header className="funnel-header">
        <Image
          src="/assets/floors-more-logo.svg"
          alt="Floors & More"
          width={104}
          height={96}
          priority
        />
        <div className="funnel-header__assurance"><span aria-hidden="true">✓</span> Gratis en vrijblijvend</div>
      </header>

      <section className="funnel-stage">
        <h1 className="sr-only">Bereken de richtprijs van je gietvloer</h1>
        <PriceFunnel />
      </section>

      <footer className="funnel-footer">
        <span>© {new Date().getFullYear()} Floors & More</span>
        <a href="https://www.floorsandmore.be/privacy/">Privacy</a>
      </footer>
    </main>
  );
}
