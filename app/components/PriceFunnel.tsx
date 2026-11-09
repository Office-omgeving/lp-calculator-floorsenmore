"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import CookieNotice from "./CookieNotice";
import { readConsent, trackLead } from "../lib/pixel";
import { captureTracking, currentTracking } from "../lib/tracking";
import { broadRange } from "../lib/broad-range.mjs";

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

function Field({ label, name, type = "text", placeholder, required = true, autoComplete, inputMode, pattern, title }: { label: string; name: string; type?: string; placeholder?: string; required?: boolean; autoComplete?: string; inputMode?: "text" | "tel" | "email" | "numeric" | "decimal"; pattern?: string; title?: string }) {
  return (
    <label className="field">
      <span>{label}{required && " *"}</span>
      <input name={name} type={type} placeholder={placeholder} required={required} autoComplete={autoComplete} inputMode={inputMode} pattern={pattern} title={title} />
    </label>
  );
}

const CONSENT_TEXT = "Ik ga akkoord dat Floors & More mij contacteert over mijn aanvraag en mijn gegevens verwerkt volgens de privacyverklaring.";

const newId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
};

export default function PriceFunnel() {
  const [step, setStep] = useState(0);
  const [location, setLocation] = useState("");
  const [product, setProduct] = useState("");
  const [subfloor, setSubfloor] = useState("");
  const [area, setArea] = useState("");
  const [timing, setTiming] = useState<Timing | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Eerst contactgegevens, dan pas de richtprijs: stap 6 is het contactformulier, daarna het resultaat.
  const maxSteps = 6;
  const contactStep = 5;
  const resultStep = maxSteps;
  const filteredProducts = products.filter((item) => item.location === location);

  // UTM-parameters en fbclid van de advertentieklik bewaren voor de lead.
  useEffect(() => { captureTracking(); }, []);

  const floorResult = useMemo(() => {
    const sqm = Number(area);
    if (!product || !sqm) return null;
    const band = floorPrices[product]?.find((item) => sqm >= item.min && (item.max === null || sqm < item.max));
    if (!band) return null;
    if (band.start) return { text: `vanaf ${euro(band.start)}`, detail: "vaste startprijs voor kleine projecten", low: band.start, high: null as number | null };
    const low = Math.round((band.low ?? 0) * sqm);
    const high = Math.round((band.high ?? 0) * sqm);
    return { text: low === high ? euro(low) : `${euro(low)} – ${euro(high)}`, detail: `${euro(band.low ?? 0)} – ${euro(band.high ?? 0)} per m² × ${sqm} m²`, low, high: high as number | null };
  }, [area, product]);

  const priceText = floorResult?.text ?? "—";
  // Eerste, ruimere inschatting vóór het contactformulier; de gedetailleerde richtprijs komt erna.
  const broadText = useMemo(() => {
    if (!floorResult) return "—";
    const range = broadRange(floorResult.low, floorResult.high ?? floorResult.low);
    return `${euro(range.low)} – ${euro(range.high)}`;
  }, [floorResult]);
  const productLabel = products.find((item) => item.key === product)?.label ?? product;
  const timingLabel = timings.find((item) => item.key === timing)?.label ?? timing;
  const locationLabel = location === "binnen" ? "Binnen" : location === "terras" ? "Terras of wandelpad" : location === "oprit" ? "Oprit" : location;

  const back = () => setStep((current) => Math.max(0, current - 1));
  const restart = () => {
    setStep(0); setLocation(""); setProduct(""); setSubfloor(""); setArea("");
    setTiming(""); setSubmitError("");
  };

  const submitLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const get = (key: string) => (typeof data.get(key) === "string" ? String(data.get(key)).trim() : "");
    const submissionId = newId();
    const eventId = `fm-lp-${submissionId}`;
    const metaConsent = readConsent() === "granted";

    setSubmitting(true);
    setSubmitError("");

    // Enige route: Strilio-webhook (via Netlify-functie fm-lead), daarna Meta Conversions API.
    // Bewust geen Netlify Forms meer: die voedde een Zapier-koppeling naar Strilio (dubbele leads zonder tags/UTM).
    const toStrilio = await fetch("/.netlify/functions/fm-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId,
        eventId,
        website: get("bot-field"),
        contact: {
          firstName: get("firstName"), lastName: get("lastName"), email: get("email"), phone: get("phone"),
          postalCode: get("postalCode"), message: get("message"), consent: data.get("consent") === "ja",
        },
        calculator: {
          location, locationLabel, product, productLabel, subfloor, area, timing, timingLabel,
          priceText, priceLow: floorResult?.low ?? null, priceHigh: floorResult?.high ?? null,
        },
        tracking: currentTracking(),
        consentText: CONSENT_TEXT,
        metaConsent,
      }),
    }).then((r) => r.ok).catch(() => false);

    setSubmitting(false);
    if (!toStrilio) {
      setSubmitError("Je gegevens konden niet worden verstuurd. Probeer het opnieuw; alles blijft ingevuld.");
      return;
    }
    trackLead(eventId, { content_name: "Floors & More richtprijs gietvloer", content_category: productLabel, value: floorResult?.low ?? null });
    setStep(resultStep);
    requestAnimationFrame(() => document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const chooseLocation = (value: string) => {
    setLocation(value);
    const directProduct = value === "terras" ? "terradec-terras" : value === "oprit" ? "terradec-oprit" : "";
    setProduct(directProduct);
    setStep(value === "binnen" ? 1 : 2);
  };

  return (
    <section className="calculator" id="calculator" aria-labelledby="calculator-title">
      <CookieNotice />
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
          <label className="area-input"><input inputMode="decimal" min="1" max="2000" type="number" value={area} onChange={(event) => setArea(event.target.value)} aria-label="Oppervlakte in vierkante meter" placeholder="80" /><span>m²</span></label>
          <div className="calculator__actions"><button className="back-button" onClick={back}>← Terug</button><button className="primary-button" disabled={!area || Number(area) <= 0} onClick={() => setStep(4)}>Volgende →</button></div>
        </div>
      )}

      {step === 4 && (
        <div className="question-panel">
          <p className="step-label">Stap 5</p>
          <h2>Wanneer wil je starten?</h2>
          <p>Zo kunnen we je aanvraag meteen juist inschatten.</p>
          <div className="option-grid option-grid--timing">
            {timings.map((item) => (
              <button className={`option option--compact ${timing === item.key ? "is-selected" : ""}`} key={item.key} onClick={() => setTiming(item.key)} aria-pressed={timing === item.key}><strong>{item.label}</strong></button>
            ))}
          </div>
          <div className="calculator__actions"><button className="back-button" onClick={back}>← Terug</button><button className="primary-button" disabled={!timing} onClick={() => setStep(contactStep)}>Volgende →</button></div>
        </div>
      )}

      {step === contactStep && (
        <div className="question-panel quote-form" id="offerteformulier">
          <p className="step-label">Stap {maxSteps}</p>
          <h2>Je eerste inschatting staat klaar.</h2>
          <div className="price-result-card price-result-card--broad">
            <span>Eerste inschatting</span>
            <PriceValue value={broadText} />
            <small>Ruime vork · {productLabel} · {area} m²</small>
          </div>
          <p>Vul je gegevens in voor je gedetailleerde richtprijs. Een vloerspecialist kan je daarna contacteren voor een exacte offerte.</p>
          <form name="offerte-aanvraag" onSubmit={submitLead} aria-busy={submitting}>
            <p hidden><label>Laat dit veld leeg: <input name="bot-field" tabIndex={-1} autoComplete="off" /></label></p>
            <input type="hidden" name="location" value={location} />
            <input type="hidden" name="product" value={productLabel} />
            <input type="hidden" name="subfloor" value={subfloor} />
            <input type="hidden" name="area" value={area} />
            <input type="hidden" name="timing" value={timingLabel} />
            <div className="form-grid">
              <Field label="Voornaam" name="firstName" autoComplete="given-name" />
              <Field label="Achternaam" name="lastName" autoComplete="family-name" />
              <Field label="Postcode" name="postalCode" inputMode="numeric" placeholder="2800" pattern="\d{4}" title="Vier cijfers, bv. 2800" autoComplete="postal-code" />
              <Field label="E-mail" name="email" type="email" placeholder="naam@voorbeeld.be" autoComplete="email" />
              <Field label="Telefoon" name="phone" type="tel" placeholder="04xx xx xx xx" autoComplete="tel" />
            </div>
            <label className="field field--full"><span>Vertel kort over je project <em>(optioneel)</em></span><textarea name="message" rows={3} placeholder="Nieuwbouw, renovatie, gewenste kleur…" /></label>
            <input type="hidden" name="estimate" value={priceText} />
            <label className="consent"><input type="checkbox" name="consent" value="ja" required /><span>Ik ga akkoord dat Floors &amp; More mij contacteert over mijn aanvraag en mijn gegevens verwerkt volgens de <a href="https://www.floorsandmore.be/privacy/" target="_blank" rel="noreferrer">privacyverklaring</a>. *</span></label>
            {submitError && <p className="lead-error" role="alert">{submitError}</p>}
            <div className="calculator__actions">
              <button className="back-button" type="button" onClick={back}>← Terug</button>
              <button className="submit-button" type="submit" disabled={submitting}>{submitting ? "Even geduld…" : "Toon mijn gedetailleerde richtprijs"} <span aria-hidden="true">→</span></button>
            </div>
          </form>
        </div>
      )}

      {step === resultStep && (
        <div className="result-panel" aria-live="polite">
          <div className="lead-panel" id="offerte">
            <div className="price-result-card">
              <span>Jouw gedetailleerde richtprijs</span>
              <PriceValue value={priceText} />
              <small>{floorResult?.detail ?? "Indicatieve prijs"} · {productLabel}</small>
            </div>
            <div className="success-card">
              <span className="success-card__icon" aria-hidden="true">✓</span>
              <p className="step-label">Aanvraag ontvangen</p>
              <h3>Bedankt, we nemen contact met je op.</h3>
              <p>Een vloerspecialist bekijkt je project en neemt persoonlijk contact op voor een exacte offerte.</p>
              <button className="edit-link" type="button" onClick={restart}>Nieuwe richtprijs berekenen</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
