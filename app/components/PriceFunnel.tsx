"use client";

import { FormEvent, useMemo, useState } from "react";

type Timing = "asap" | "1-3m" | "3-6m" | "6m+";

const timings: Array<{ key: Timing; label: string }> = [
  { key: "asap", label: "Zo snel mogelijk" },
  { key: "1-3m", label: "Binnen 1–3 maanden" },
  { key: "3-6m", label: "Binnen 3–6 maanden" },
  { key: "6m+", label: "Meer dan 6 maanden" },
];

const products = [
  { key: "comfort-pu", label: "Comfort + PU", location: "binnen", image: "/assets/floors-more-hero.png", description: "Effen, warm, elastisch en volledig naadloos." },
  { key: "betonlook", label: "Betonlook", location: "binnen", image: "/assets/betonlook.jpg", description: "Strak karakter met comfortabel loopgevoel." },
  { key: "mineral-touch", label: "Mineral Touch", location: "binnen", image: "/assets/mineral-touch.jpg", description: "Natuurlijke nuance, krasbestendig en elastisch." },
  { key: "sand-touch", label: "Sand Touch", location: "binnen", image: "/assets/sand-touch.jpg", description: "Robuust, slijtvast en fijn gestructureerd." },
  { key: "terradec-terras", label: "Terradec terras", location: "terras", image: "/assets/terradec-terras.jpg", description: "UV-bestendige buitenvloer voor terras of wandelpad." },
  { key: "terradec-oprit", label: "Terradec oprit", location: "oprit", image: "/assets/terradec-oprit.jpg", description: "Sterke harsvloer voor intensief buitengebruik." },
];

type PriceBand = { min: number; max: number | null; low?: number; high?: number; start?: number };
const floorPrices: Record<string, PriceBand[]> = {
  "comfort-pu": [
    { min: 0, max: 10, start: 2500 }, { min: 10, max: 20, low: 170, high: 250 },
    { min: 20, max: 50, low: 145, high: 170 }, { min: 50, max: 100, low: 95, high: 145 },
    { min: 100, max: 150, low: 90, high: 110 }, { min: 150, max: 200, low: 90, high: 95 },
    { min: 200, max: null, low: 85, high: 90 },
  ],
  betonlook: [
    { min: 0, max: 10, start: 2500 }, { min: 10, max: 20, low: 170, high: 250 },
    { min: 20, max: 50, low: 145, high: 170 }, { min: 50, max: 100, low: 95, high: 145 },
    { min: 100, max: 150, low: 90, high: 110 }, { min: 150, max: 200, low: 90, high: 95 },
    { min: 200, max: null, low: 85, high: 90 },
  ],
  "mineral-touch": [
    { min: 0, max: 10, start: 3500 }, { min: 10, max: 20, low: 250, high: 400 },
    { min: 20, max: 50, low: 190, high: 250 }, { min: 50, max: 100, low: 135, high: 190 },
    { min: 100, max: 150, low: 120, high: 135 }, { min: 150, max: 200, low: 110, high: 120 },
    { min: 200, max: null, low: 100, high: 110 },
  ],
  "sand-touch": [
    { min: 0, max: 10, start: 2000 }, { min: 10, max: 20, low: 165, high: 190 },
    { min: 20, max: 50, low: 145, high: 165 }, { min: 50, max: 100, low: 115, high: 145 },
    { min: 100, max: 150, low: 115, high: 115 }, { min: 150, max: 200, low: 115, high: 115 },
    { min: 200, max: null, low: 105, high: 115 },
  ],
  "terradec-terras": [
    { min: 0, max: 10, start: 2000 }, { min: 10, max: 20, low: 145, high: 160 },
    { min: 20, max: 50, low: 130, high: 145 }, { min: 50, max: 100, low: 125, high: 130 },
    { min: 100, max: 150, low: 120, high: 125 }, { min: 150, max: 200, low: 115, high: 120 },
    { min: 200, max: null, low: 110, high: 120 },
  ],
  "terradec-oprit": [
    { min: 0, max: 10, start: 2500 }, { min: 10, max: 20, low: 175, high: 200 },
    { min: 20, max: 50, low: 160, high: 175 }, { min: 50, max: 100, low: 150, high: 160 },
    { min: 100, max: 150, low: 150, high: 160 }, { min: 150, max: 200, low: 150, high: 150 },
    { min: 200, max: null, low: 145, high: 150 },
  ],
};

const euro = (value: number) => new Intl.NumberFormat("nl-BE", {
  style: "currency", currency: "EUR", maximumFractionDigits: 0,
}).format(value).replace(/\s/g, "");

function PriceValue({ value }: { value: string }) {
  const range = value.split(" – ");

  if (range.length === 2) {
    return (
      <strong className="price-value">
        <span>{range[0]}</span>
        <span className="price-value__separator" aria-hidden="true">–</span>
        <span>{range[1]}</span>
      </strong>
    );
  }

  return <strong className="price-value">{value}</strong>;
}

function CheckIcon() {
  return <span className="check-icon" aria-hidden="true">✓</span>;
}

function Field({ label, name, type = "text", placeholder, required = true, autoComplete, inputMode }: { label: string; name: string; type?: string; placeholder?: string; required?: boolean; autoComplete?: string; inputMode?: "text" | "tel" | "email" | "numeric" | "decimal" }) {
  return (
    <label className="field">
      <span>{label}{required && " *"}</span>
      <input name={name} type={type} placeholder={placeholder} required={required} autoComplete={autoComplete} inputMode={inputMode} />
    </label>
  );
}

export default function PriceFunnel() {
  const [step, setStep] = useState(0);
  const [location, setLocation] = useState("");
  const [product, setProduct] = useState("");
  const [subfloor, setSubfloor] = useState("");
  const [area, setArea] = useState("");
  const [timing, setTiming] = useState<Timing | "">("");
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const maxSteps = 5;
  const resultStep = maxSteps;
  const filteredProducts = products.filter((item) => item.location === location);

  const floorResult = useMemo(() => {
    const sqm = Number(area);
    if (!product || !sqm) return null;
    const band = floorPrices[product]?.find((item) => sqm >= item.min && (item.max === null || sqm < item.max));
    if (!band) return null;
    if (band.start) return { text: `vanaf ${euro(band.start)}`, detail: "vaste startprijs voor kleine projecten" };
    const low = Math.round((band.low ?? 0) * sqm);
    const high = Math.round((band.high ?? 0) * sqm);
    return { text: low === high ? euro(low) : `${euro(low)} – ${euro(high)}`, detail: `${euro(band.low ?? 0)} – ${euro(band.high ?? 0)} per m² × ${sqm} m²` };
  }, [area, product]);

  const priceText = floorResult?.text ?? "—";

  const back = () => setStep((current) => Math.max(0, current - 1));
  const restart = () => {
    setStep(0); setLocation(""); setProduct(""); setSubfloor(""); setArea("");
    setTiming(""); setShowQuoteForm(false); setSubmitted(false);
  };

  const openQuoteForm = () => {
    setShowQuoteForm(true);
    requestAnimationFrame(() => {
      document.getElementById("offerteformulier")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const submitLead = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  const chooseLocation = (value: string) => {
    setLocation(value);
    const directProduct = value === "terras" ? "terradec-terras" : value === "oprit" ? "terradec-oprit" : "";
    setProduct(directProduct);
    setStep(value === "binnen" ? 1 : 2);
  };

  return (
    <section className="calculator" id="calculator" aria-labelledby="calculator-title">
      <div className="calculator__topline">
        <span className="calculator__kicker">Vrijblijvende prijsindicatie</span>
        {step < resultStep && <span className="calculator__count">{step + 1} / {maxSteps}</span>}
      </div>
      {step < resultStep && (
        <div className="progress" aria-label={`Stap ${step + 1} van ${maxSteps}`}>
          <span style={{ width: `${((step + 1) / maxSteps) * 100}%` }} />
        </div>
      )}

      {step === 0 && (
        <div className="question-panel">
          <p className="step-label">Stap 1</p>
          <h2 id="calculator-title">Waar komt je nieuwe vloer?</h2>
          <p>We starten met het type ruimte.</p>
          <div className="option-grid option-grid--three">
            {[
              ["binnen", "Binnen", "Woning of commerciële ruimte"],
              ["terras", "Terras of wandelpad", "Buiten en UV-bestendig"],
              ["oprit", "Oprit", "Geschikt voor intensieve belasting"],
            ].map(([key, label, detail]) => (
              <button className="option" key={key} onClick={() => chooseLocation(key)}>
                <span className="option__symbol" aria-hidden="true">{key === "binnen" ? "⌂" : key === "terras" ? "☀" : "↗"}</span>
                <strong>{label}</strong><small>{detail}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="question-panel">
          <p className="step-label">Stap 2</p>
          <h2>Welke vloer past bij je?</h2>
          <p>Kies je favoriete uitstraling. Je kunt dit later nog aanpassen.</p>
          <div className="product-grid">
            {filteredProducts.map((item) => (
              <button className={`product-option ${product === item.key ? "is-selected" : ""}`} key={item.key} onClick={() => setProduct(item.key)} aria-pressed={product === item.key}>
                <span className="product-option__image" style={{ backgroundImage: `url(${item.image})` }} />
                <span><strong>{item.label}</strong><small>{item.description}</small></span>
              </button>
            ))}
          </div>
          <div className="calculator__actions"><button className="back-button" onClick={back}>← Terug</button><button className="primary-button" disabled={!product} onClick={() => setStep(2)}>Volgende →</button></div>
        </div>
      )}

      {step === 2 && (
        <div className="question-panel">
          <p className="step-label">Stap 3</p>
          <h2>Wat is de huidige ondervloer?</h2>
          <p>De richtprijs hieronder vertrekt van een nieuwe chape.</p>
          <div className="option-grid option-grid--three">
            {["Nieuwe chape", "Bestaande chape", "Andere / weet ik niet"].map((label) => (
              <button className={`option option--compact ${subfloor === label ? "is-selected" : ""}`} key={label} onClick={() => setSubfloor(label)} aria-pressed={subfloor === label}><strong>{label}</strong></button>
            ))}
          </div>
          <div className="calculator__actions"><button className="back-button" onClick={back}>← Terug</button><button className="primary-button" disabled={!subfloor} onClick={() => setStep(3)}>Volgende →</button></div>
        </div>
      )}

      {step === 3 && (
        <div className="question-panel">
          <p className="step-label">Stap 4</p>
          <h2>Hoeveel m² wil je laten plaatsen?</h2>
          <p>Een goede schatting is voldoende.</p>
          <label className="area-input"><input autoFocus inputMode="decimal" min="1" max="2000" type="number" value={area} onChange={(event) => setArea(event.target.value)} aria-label="Oppervlakte in vierkante meter" placeholder="80" /><span>m²</span></label>
          <div className="calculator__actions"><button className="back-button" onClick={back}>← Terug</button><button className="primary-button" disabled={!area || Number(area) <= 0} onClick={() => setStep(4)}>Volgende →</button></div>
        </div>
      )}

      {step === 4 && (
        <div className="question-panel">
          <p className="step-label">Stap {maxSteps}</p>
          <h2>Wanneer wil je starten?</h2>
          <p>Zo kunnen we je aanvraag meteen juist inschatten.</p>
          <div className="option-grid option-grid--timing">
            {timings.map((item) => (
              <button className={`option option--compact ${timing === item.key ? "is-selected" : ""}`} key={item.key} onClick={() => setTiming(item.key)} aria-pressed={timing === item.key}><strong>{item.label}</strong></button>
            ))}
          </div>
          <div className="calculator__actions"><button className="back-button" onClick={back}>← Terug</button><button className="primary-button" disabled={!timing} onClick={() => setStep(resultStep)}>Bekijk mijn richtprijs →</button></div>
        </div>
      )}

      {step === resultStep && (
        <div className="result-panel" aria-live="polite">
          <div className="lead-panel" id="offerte">
            {!submitted ? (
              <>
                <div className="price-result-card">
                  <span>Jouw richtprijs</span>
                  <PriceValue value={priceText} />
                  <small>Indicatieve prijs · gratis en vrijblijvend berekend</small>
                </div>

                {!showQuoteForm ? (
                  <div className="quote-choice">
                    <span className="contact-kicker">Wil je een exacte prijs?</span>
                    <h3>Vraag vrijblijvend een offerte op maat aan.</h3>
                    <p>Een specialist bekijkt je project en neemt contact met je op. Alleen als jij dat wilt.</p>
                    <button className="quote-choice__button" type="button" onClick={openQuoteForm}>
                      Ja, ik wil een offerte op maat <span aria-hidden="true">→</span>
                    </button>
                    <small className="quote-choice__note">Liever niet? Geen probleem — je richtprijs staat hierboven.</small>
                    <button className="edit-link" type="button" onClick={restart}>Richtprijs opnieuw berekenen</button>
                  </div>
                ) : (
                  <div className="quote-form" id="offerteformulier">
                    <span className="contact-kicker">Offerte op maat</span>
                    <h3>Vul je gegevens in.</h3>
                    <p>Een vloerspecialist bekijkt je aanvraag en neemt persoonlijk contact op voor een exacte offerte.</p>
                    <form onSubmit={submitLead}>
                      <div className="form-grid">
                        <Field label="Voornaam" name="firstName" autoComplete="given-name" />
                        <Field label="Achternaam" name="lastName" autoComplete="family-name" />
                        <Field label="Postcode" name="postalCode" inputMode="numeric" placeholder="2800" />
                        <Field label="E-mail" name="email" type="email" placeholder="naam@voorbeeld.be" />
                        <Field label="Telefoon" name="phone" type="tel" placeholder="04xx xx xx xx" />
                      </div>
                      <label className="field field--full"><span>Vertel kort over je project <em>(optioneel)</em></span><textarea name="message" rows={3} placeholder="Nieuwbouw, renovatie, gewenste kleur…" /></label>
                      <label className="consent"><input type="checkbox" required /><span><strong>Ja, ik wil gecontacteerd worden voor een exacte offerte</strong> voor mijn project.</span></label>
                      <label className="consent consent--small"><input type="checkbox" required /><span>Ik heb de <a href="https://www.floorsandmore.be/privacy/" target="_blank" rel="noreferrer">privacyverklaring</a> gelezen en ga akkoord met de verwerking van mijn gegevens.</span></label>
                      <input type="hidden" name="estimate" value={priceText} />
                      <button className="submit-button" type="submit">Vraag mijn exacte offerte aan <span aria-hidden="true">→</span></button>
                      <small className="form-assurance">Gratis en vrijblijvend · Geen spam · Persoonlijk advies</small>
                    </form>
                  </div>
                )}
              </>
            ) : (
              <div className="success-card">
                <span className="success-card__icon" aria-hidden="true">✓</span>
                <p className="step-label">Aanvraag klaar</p>
                <h3>Bedankt voor je interesse.</h3>
                <p>Dit is het bedankbericht van de funnel. Na koppeling met jullie leadplatform komt de aanvraag rechtstreeks bij het juiste team terecht.</p>
                <button className="back-button" onClick={() => setSubmitted(false)}>Formulier opnieuw bekijken</button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
