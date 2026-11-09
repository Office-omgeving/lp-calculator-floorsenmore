// Zet een richtprijsaanvraag van de Floors & More-landingspagina om naar het JSON-formaat van een
// generieke Strilio inbound-lead-webhook (tenant-floors-more).
//   provider "floorsandmore" + source "website" -> merkherkenning via de bronclassificatie van de webhook
//   tag "floorsenmore" (contact + opportunity) -> workflow "NURTURE FLOORS & MORE" (requiredTags)
//   GEEN tag "calculator": die start "NURTURE ABBI CALCULATOR" (ABBI-mail) en hoort hier niet.
//   utm_* en fbclid op het hoogste niveau -> Strilio vult lead_utm_* en lead_fbclid
// Antwoorden zonder vaste mapping komen in de notities van de opportunity.

const MAX = 500;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,199}$/;
const TRACKING_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'fbclid', 'gclid'];
export const LEAD_TAGS = ['floorsenmore', 'gietvloer', 'lp-richtprijs'];

const str = (v, max = MAX) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export function validateLeadRequest(body) {
  if (!body || typeof body !== 'object') return 'INVALID_BODY';
  if (!ID_RE.test(str(body.submissionId, 200))) return 'SUBMISSION_ID_INVALID';
  const c = body.contact || {};
  if (!str(c.firstName) || !str(c.lastName)) return 'NAME_MISSING';
  if (!EMAIL_RE.test(str(c.email))) return 'EMAIL_INVALID';
  const digits = str(c.phone).replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) return 'PHONE_INVALID';
  if (!/^\d{4}$/.test(str(c.postalCode))) return 'POSTAL_CODE_INVALID';
  if (c.consent !== true) return 'CONSENT_MISSING';
  const k = body.calculator || {};
  if (!str(k.location) || !str(k.product) || !str(k.timing)) return 'CALCULATOR_INCOMPLETE';
  return null;
}

export function buildStrilioPayload(body, { sourceLabel = 'Meta - Floors & More' } = {}) {
  const c = body.contact;
  const k = body.calculator;
  const t = body.tracking && typeof body.tracking === 'object' ? body.tracking : {};
  const params = t.params && typeof t.params === 'object' ? t.params : {};
  const id = str(body.submissionId, 200);

  const summary = [
    'Aanvraag via de richtprijs-landingspagina van Floors & More (gietvloer).',
    `Ruimte: ${str(k.locationLabel) || str(k.location)}`,
    `Vloer: ${str(k.productLabel) || str(k.product)}`,
    `Ondervloer: ${str(k.subfloor)}`,
    `Oppervlakte: ${str(k.area)} m²`,
    `Timing: ${str(k.timingLabel) || str(k.timing)}`,
    `Richtprijs getoond: ${str(k.priceText)}`,
    str(c.message, 1000) ? `Bericht: ${str(c.message, 1000)}` : '',
  ].filter(Boolean).join('\n');

  const payload = {
    provider_lead_id: `floorsandmore-lp:${id}`,
    request_id: id,
    source: 'website',
    provider: 'floorsandmore',
    source_label: sourceLabel,
    form_name: 'Richtprijs gietvloer (LP)',
    lead_type: 'offerte',
    first_name: str(c.firstName),
    last_name: str(c.lastName),
    name: `${str(c.firstName)} ${str(c.lastName)}`.trim(),
    email: str(c.email).toLowerCase(),
    phone: str(c.phone),
    postal_code: str(c.postalCode) || undefined,
    message: summary,
    contact_tags: LEAD_TAGS,
    opportunity_tags: LEAD_TAGS,
    landing_page: str(t.landingPage, 1000) || undefined,
    'Ruimte': str(k.locationLabel) || str(k.location),
    'Vloer': str(k.productLabel) || str(k.product),
    'Ondervloer': str(k.subfloor),
    'Oppervlakte (m²)': str(k.area),
    'Timing': str(k.timingLabel) || str(k.timing),
    'Richtprijs min (EUR)': num(k.priceLow) ?? undefined,
    'Richtprijs max (EUR)': num(k.priceHigh) ?? undefined,
    'Richtprijs getoond': str(k.priceText),
    'Toestemming contact': str(body.consentText, 1000),
    'Meta event_id': str(body.eventId, 200) || undefined,
    'Meta fbp': str(t.fbp) || undefined,
    'Meta fbc': str(t.fbc) || undefined,
    'Referrer': str(t.referrer, 1000) || undefined,
  };
  for (const key of TRACKING_KEYS) {
    const v = str(params[key]);
    if (v) payload[key] = v;
  }
  for (const key of Object.keys(payload)) if (payload[key] === undefined || payload[key] === '') delete payload[key];
  return payload;
}
