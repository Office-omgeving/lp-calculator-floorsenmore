"use client";

import { useEffect, useState } from "react";
import { loadPixel, readConsent, saveConsent } from "../lib/pixel";

export default function CookieNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const c = readConsent();
    if (c === "granted") loadPixel();
    if (c !== null) return;
    // Pas na de eerste render tonen (localStorage bestaat niet bij het voorrenderen).
    const id = window.setTimeout(() => setOpen(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  if (!open) return null;

  return (
    <div className="cookie-notice" role="dialog" aria-label="Cookies">
      <div className="cookie-notice__box">
        <p>
          We gebruiken cookies van Meta om te meten welke advertenties werken. Dat gebeurt alleen als je dat toelaat.{" "}
          <a href="https://www.floorsandmore.be/privacy/" target="_blank" rel="noreferrer">Privacyverklaring</a>
        </p>
        <div className="cookie-notice__actions">
          <button type="button" className="back-button" onClick={() => { saveConsent("denied"); setOpen(false); }}>Weigeren</button>
          <button type="button" className="primary-button" onClick={() => { saveConsent("granted"); loadPixel(); setOpen(false); }}>Accepteren</button>
        </div>
      </div>
    </div>
  );
}
