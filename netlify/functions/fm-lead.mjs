// POST /.netlify/functions/fm-lead
// Ontvangt de calculatoraanvraag uit de browser en stuurt ze server-side door naar Strilio.
// Het webhooktoken staat alleen in de Netlify-omgevingsvariabelen, nooit in de browser.
//
// Vereiste omgevingsvariabelen (Netlify > Site configuration > Environment variables):
//   STRILIO_WEBHOOK_URL    de URL van Strilio-webhook voor deze landingspagina (tenant-floors-more) zoals Strilio ze toont via
//                          Instellingen > webhooks > "Kopieer URL" (bevat ?token=…). Dat volstaat.
//   STRILIO_WEBHOOK_TOKEN  alleen nodig als de URL hierboven geen ?token= bevat
// Optioneel:
//   STRILIO_SOURCE_LABEL   standaard "Meta - Floors & More"
//   META_CAPI_TOKEN        Conversions API-token van "Pixel van Floors&More" (Events Manager). Zonder token
//                          wordt alleen de browserpixel gebruikt.
//   META_TEST_EVENT_CODE   optioneel: code uit Events Manager > Test Events
//   LEAD_TEST_ALLOWLIST    komma-lijst van telefoonnummers; indien gezet worden ALLE andere
//                          nummers geweigerd (handig voor deploy-previews met testnummer).
import { buildStrilioPayload, validateLeadRequest } from './lib/strilio-payload.mjs';
import { sendCapiLead } from './lib/meta-capi.mjs';

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export async function handleLead(req, env, fetchImpl = fetch) {
  if (req.method !== 'POST') return json(405, { status: 'METHOD_NOT_ALLOWED' });
  let body;
  try {
    const text = await req.text();
    if (text.length > 20_000) return json(413, { status: 'TOO_LARGE' });
    body = JSON.parse(text);
  } catch {
    return json(400, { status: 'INVALID_JSON' });
  }
  // Honeypot: bots vullen dit veld in. Doe alsof het gelukt is, stuur niets door.
  if (typeof body?.website === 'string' && body.website.trim()) return json(200, { status: 'ACCEPTED' });

  const error = validateLeadRequest(body);
  if (error) return json(400, { status: error });

  const allow = (env.LEAD_TEST_ALLOWLIST || '').split(',').map((s) => s.replace(/\D/g, '')).filter(Boolean);
  if (allow.length && !allow.includes(String(body.contact.phone).replace(/\D/g, ''))) {
    return json(403, { status: 'NOT_ON_TEST_ALLOWLIST' });
  }

  let tokenInUrl = false;
  try {
    tokenInUrl = !!new URL(env.STRILIO_WEBHOOK_URL || '').searchParams.get('token');
  } catch {
    /* ongeldige of lege URL */
  }
  if (!env.STRILIO_WEBHOOK_URL || (!tokenInUrl && !env.STRILIO_WEBHOOK_TOKEN)) {
    return json(503, { status: 'NOT_CONFIGURED' });
  }

  const payload = buildStrilioPayload(body, { sourceLabel: env.STRILIO_SOURCE_LABEL || undefined });
  try {
    const upstream = await fetchImpl(env.STRILIO_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(env.STRILIO_WEBHOOK_TOKEN ? { 'x-webhook-token': env.STRILIO_WEBHOOK_TOKEN } : {}),
        'x-idempotency-key': payload.provider_lead_id,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });
    const result = await upstream.json().catch(() => ({}));
    // Zelfde controle als Strilio's eigen website-form-intake: alleen success === true telt.
    if (upstream.ok && result && result.success === true) {
      // Pas na een bevestigde lead in Strilio naar Meta sturen; een CAPI-fout blokkeert de lead nooit.
      const capi = await sendCapiLead(body, env, {
        clientIp: (req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || '').split(',')[0].trim(),
        userAgent: req.headers.get('user-agent') || '',
      }, fetchImpl);
      return json(200, { status: 'ACCEPTED', capi: capi.sent ? 'SENT' : capi.reason });
    }
    if (upstream.status === 429) return json(429, { status: 'RETRY_LATER' });
    console.error('[fm-lead] Strilio weigerde', upstream.status);
    return json(502, { status: 'UPSTREAM_ERROR' });
  } catch (e) {
    console.error('[fm-lead] Strilio onbereikbaar', e instanceof Error ? e.message : e);
    return json(502, { status: 'UPSTREAM_UNREACHABLE' });
  }
}

export default async (req) => handleLead(req, process.env);
