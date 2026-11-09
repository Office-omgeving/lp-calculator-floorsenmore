import assert from "node:assert/strict";
import test from "node:test";
import { handleLead } from "../netlify/functions/fm-lead.mjs";
import { buildStrilioPayload, validateLeadRequest } from "../netlify/functions/lib/strilio-payload.mjs";
import { buildCapiEvent, sha256 } from "../netlify/functions/lib/meta-capi.mjs";

const body = () => ({
  submissionId: "11111111-2222-3333-4444-555555555555",
  eventId: "fm-lp-11111111-2222-3333-4444-555555555555",
  contact: { firstName: "Test", lastName: "Persoon", email: "Test@Voorbeeld.be", phone: "+32 468 33 22 92", postalCode: "2800", message: "", consent: true },
  calculator: { location: "binnen", locationLabel: "Binnen", product: "betonlook", productLabel: "Betonlook", subfloor: "Nieuwe chape", area: "80", timing: "1-3m", timingLabel: "Binnen 1–3 maanden", priceText: "€7.600 – €11.600", priceLow: 7600, priceHigh: 11600 },
  tracking: { params: { utm_source: "facebook", utm_campaign: "fm-gietvloer", fbclid: "abc" }, landingPage: "https://x/?utm_source=facebook", referrer: null, fbp: "fb.1.1.2", fbc: "fb.1.1.abc" },
  consentText: "akkoord",
  metaConsent: true,
});
const req = (b) => new Request("https://x/.netlify/functions/fm-lead", { method: "POST", body: JSON.stringify(b), headers: { "user-agent": "t", "x-nf-client-connection-ip": "1.2.3.4" } });
const ENV = { STRILIO_WEBHOOK_URL: "https://strilio.test/hook?token=t", META_CAPI_TOKEN: "x" };

test("validatie weigert ontbrekende contactgegevens en toestemming", () => {
  assert.equal(validateLeadRequest(body()), null);
  const b = body(); b.contact.phone = "12"; assert.equal(validateLeadRequest(b), "PHONE_INVALID");
  const c = body(); c.contact.consent = false; assert.equal(validateLeadRequest(c), "CONSENT_MISSING");
  const d = body(); d.contact.postalCode = "28"; assert.equal(validateLeadRequest(d), "POSTAL_CODE_INVALID");
});

test("payload heeft Floors & More-tags, geen calculator-tag, en UTM op hoofdniveau", () => {
  const p = buildStrilioPayload(body());
  assert.deepEqual(p.contact_tags, ["floorsenmore", "gietvloer", "lp-richtprijs"]);
  assert.deepEqual(p.opportunity_tags, p.contact_tags);
  assert.ok(!p.contact_tags.includes("calculator") && !p.contact_tags.includes("abbi"));
  assert.equal(p.provider, "floorsandmore");
  assert.equal(p.source_label, "Meta - Floors & More");
  assert.equal(p.utm_source, "facebook");
  assert.equal(p.utm_campaign, "fm-gietvloer");
  assert.equal(p.fbclid, "abc");
  assert.equal(p.email, "test@voorbeeld.be");
  assert.equal(p["Meta event_id"], body().eventId);
});

test("CAPI-event: Lead, zelfde event_id, gehashte gegevens", () => {
  const e = buildCapiEvent(body(), { clientIp: "1.2.3.4", userAgent: "t", now: 1_700_000_000_000 });
  assert.equal(e.event_name, "Lead");
  assert.equal(e.event_id, body().eventId);
  assert.deepEqual(e.user_data.ph, [sha256("32468332292")]);
  assert.deepEqual(e.user_data.em, [sha256("test@voorbeeld.be")]);
  assert.equal(e.custom_data.value, 7600);
});

test("lead naar Strilio, daarna CAPI naar de Floors & More-pixel", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify(String(url).includes("strilio") ? { success: true } : { events_received: 1 }), { status: 200 });
  };
  const res = await handleLead(req(body()), ENV, fetchImpl);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: "ACCEPTED", capi: "SENT" });
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /strilio\.test/);
  assert.equal(calls[0].init.headers["x-idempotency-key"], "floorsandmore-lp:11111111-2222-3333-4444-555555555555");
  assert.match(calls[1].url, /graph\.facebook\.com\/v\d+\.\d+\/2474496069532591\/events/);
});

test("geen CAPI zonder cookietoestemming; lead gaat wel naar Strilio", async () => {
  const calls = [];
  const fetchImpl = async (url) => { calls.push(String(url)); return new Response(JSON.stringify({ success: true }), { status: 200 }); };
  const b = body(); b.metaConsent = false;
  const res = await handleLead(req(b), ENV, fetchImpl);
  assert.deepEqual(await res.json(), { status: "ACCEPTED", capi: "NO_CONSENT" });
  assert.equal(calls.length, 1);
});

test("zonder webhook-URL: 503, en geen CAPI", async () => {
  let called = false;
  const res = await handleLead(req(body()), { META_CAPI_TOKEN: "x" }, async () => { called = true; });
  assert.equal(res.status, 503);
  assert.equal(called, false);
});

test("Strilio-fout -> 502, geen CAPI", async () => {
  const calls = [];
  const res = await handleLead(req(body()), ENV, async (url) => { calls.push(String(url)); return new Response(JSON.stringify({ success: false }), { status: 422 }); });
  assert.equal(res.status, 502);
  assert.equal(calls.length, 1);
});

test("honeypot ingevuld -> niets doorgestuurd", async () => {
  let called = false;
  const b = body(); b.website = "spam";
  const res = await handleLead(req(b), ENV, async () => { called = true; });
  assert.equal(res.status, 200);
  assert.equal(called, false);
});
