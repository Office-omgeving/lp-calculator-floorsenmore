// Meta Conversions API (server-side) voor het Lead-event van de calculator.
// - Zelfde event_id als de browserpixel (fbq ... {eventID}) -> Meta ontdubbelt automatisch.
// - Alleen als de bezoeker cookies/tracking accepteerde (metaConsent === true).
// - Persoonsgegevens worden SHA-256 gehasht volgens Meta's normalisatieregels.
// Omgevingsvariabelen: META_CAPI_TOKEN (verplicht om te versturen), META_PIXEL_ID (standaard
// 2474496069532591 = "Pixel van Floors&More"), META_TEST_EVENT_CODE (optioneel, voor Test Events).
import { createHash } from 'node:crypto';

const GRAPH_VERSION = 'v21.0';
export const DEFAULT_PIXEL_ID = '2474496069532591';

export const sha256 = (v) => createHash('sha256').update(v).digest('hex');
const norm = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : '');
const hashIf = (v) => (v ? [sha256(v)] : undefined);

export function buildCapiEvent(body, { clientIp, userAgent, now = Date.now() } = {}) {
  const c = body.contact || {};
  const k = body.calculator || {};
  const t = body.tracking || {};
  const phoneDigits = String(c.phone || '').replace(/\D/g, ''); // E.164 zonder +, bv. 32468332292
  const user_data = {
    em: hashIf(norm(c.email)),
    ph: hashIf(phoneDigits),
    fn: hashIf(norm(c.firstName)),
    ln: hashIf(norm(c.lastName)),
    zp: hashIf(norm(c.postalCode)),
    country: [sha256('be')],
    external_id: hashIf(String(body.submissionId || '')),
    client_ip_address: clientIp || undefined,
    client_user_agent: userAgent || undefined,
    fbc: t.fbc || undefined,
    fbp: t.fbp || undefined,
  };
  for (const key of Object.keys(user_data)) if (user_data[key] === undefined) delete user_data[key];
  const custom_data = {
    currency: 'EUR',
    content_name: 'Floors & More richtprijs gietvloer',
    content_category: k.productLabel || undefined,
    ...(typeof k.priceLow === 'number' && k.priceLow > 0 ? { value: k.priceLow } : {}),
  };
  if (!custom_data.content_category) delete custom_data.content_category;
  return {
    event_name: 'Lead',
    event_time: Math.floor(now / 1000),
    event_id: body.eventId,
    action_source: 'website',
    event_source_url: t.landingPage || undefined,
    user_data,
    custom_data,
  };
}

export async function sendCapiLead(body, env, ctx, fetchImpl = fetch) {
  if (!env.META_CAPI_TOKEN) return { sent: false, reason: 'NOT_CONFIGURED' };
  if (body.metaConsent !== true) return { sent: false, reason: 'NO_CONSENT' };
  const pixelId = env.META_PIXEL_ID || DEFAULT_PIXEL_ID;
  const payload = {
    data: [buildCapiEvent(body, ctx)],
    ...(env.META_TEST_EVENT_CODE ? { test_event_code: env.META_TEST_EVENT_CODE } : {}),
    access_token: env.META_CAPI_TOKEN,
  };
  try {
    const res = await fetchImpl(`https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      console.error('[fm-lead] CAPI weigerde', res.status);
      return { sent: false, reason: `HTTP_${res.status}` };
    }
    return { sent: true };
  } catch (e) {
    console.error('[fm-lead] CAPI onbereikbaar', e instanceof Error ? e.message : e);
    return { sent: false, reason: 'UNREACHABLE' };
  }
}
