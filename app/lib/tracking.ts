// Attributie voor websiteleads: UTM-parameters, fbclid en de Meta-cookies (_fbp/_fbc).
// De eerste landing wordt bewaard in sessionStorage, zodat de waarden niet verloren gaan
// als de bezoeker tussen de stappen de URL verandert of de pagina herlaadt.

export const TRACKING_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
] as const;

export type TrackingKey = (typeof TRACKING_KEYS)[number];

export interface Tracking {
  params: Partial<Record<TrackingKey, string>>;
  landingPage: string | null;
  referrer: string | null;
  fbp: string | null;
  fbc: string | null;
}

const STORAGE_KEY = 'fm_tracking_v1';
const MAX_LEN = 500;

const clean = (v: string | null | undefined) => {
  const t = (v ?? '').trim();
  return t ? t.slice(0, MAX_LEN) : null;
};

export function readTrackingParams(search: string): Partial<Record<TrackingKey, string>> {
  const sp = new URLSearchParams(search);
  const out: Partial<Record<TrackingKey, string>> = {};
  for (const key of TRACKING_KEYS) {
    const v = clean(sp.get(key));
    if (v) out[key] = v;
  }
  return out;
}

export function readCookie(cookieString: string, name: string): string | null {
  for (const part of cookieString.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return clean(decodeURIComponent(rest.join('=')));
  }
  return null;
}

// Meta-formaat voor _fbc wanneer de cookie (nog) niet bestaat: fb.1.<ms>.<fbclid>
export function buildFbc(fbclid: string | undefined, now: number): string | null {
  return fbclid ? `fb.1.${now}.${fbclid}` : null;
}

function safeGet(): Tracking | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Tracking) : null;
  } catch {
    return null;
  }
}

function safeSet(t: Tracking) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(t));
  } catch {
    /* privé-venster of geblokkeerde opslag: dan alleen in geheugen */
  }
}

let memo: Tracking | null = null;

// Roep dit één keer op bij het laden. Nieuwe UTM/fbclid in de URL winnen van een eerdere sessie.
export function captureTracking(): Tracking {
  const fromUrl = readTrackingParams(window.location.search);
  const stored = safeGet();
  const hasNew = Object.keys(fromUrl).length > 0;
  const base: Tracking =
    stored && !hasNew
      ? stored
      : {
          params: fromUrl,
          landingPage: clean(window.location.href),
          referrer: clean(document.referrer),
          fbp: null,
          fbc: null,
        };
  memo = base;
  safeSet(base);
  return base;
}

// Haal de laatste stand op, inclusief de Meta-cookies die de pixel intussen gezet kan hebben.
export function currentTracking(now = Date.now()): Tracking {
  const t = memo ?? safeGet() ?? captureTracking();
  const cookies = typeof document !== 'undefined' ? document.cookie : '';
  return {
    ...t,
    fbp: readCookie(cookies, '_fbp') ?? t.fbp,
    fbc: readCookie(cookies, '_fbc') ?? t.fbc ?? buildFbc(t.params.fbclid, now),
  };
}
