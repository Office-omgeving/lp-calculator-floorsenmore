// Meta Pixel van Floors & More ("Pixel van Floors&More", dataset 2474496069532591), met toestemming.
// De pixel laadt pas na "Accepteren" in de cookiemelding. Zonder toestemming geen pixel en geen CAPI;
// de lead komt dan wel in Strilio (met UTM/fbclid), alleen niet als event in Meta.

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

export const PIXEL_ID = "2474496069532591";
const CONSENT_KEY = "fm_cookie_consent_v1";

export type ConsentState = "granted" | "denied" | null;

export function readConsent(): ConsentState {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function saveConsent(v: Exclude<ConsentState, null>) {
  try {
    window.localStorage.setItem(CONSENT_KEY, v);
  } catch {
    /* opslag geblokkeerd: vraag volgende keer opnieuw */
  }
}

let loaded = false;

export function loadPixel() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  if (!window.fbq) {
    const n: Fbq = function (...args: unknown[]) {
      if (n.callMethod) n.callMethod(...args);
      else n.queue!.push(args);
    } as Fbq;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    window.fbq = n;
    window._fbq = n;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
  }
  window.fbq("init", PIXEL_ID);
  window.fbq("track", "PageView");
}

export function trackLead(eventId: string, data: { value?: number | null; content_name: string; content_category?: string }) {
  if (!loaded || !window.fbq) return;
  window.fbq(
    "track",
    "Lead",
    {
      content_name: data.content_name,
      currency: "EUR",
      ...(data.content_category ? { content_category: data.content_category } : {}),
      ...(data.value ? { value: data.value } : {}),
    },
    { eventID: eventId },
  );
}
