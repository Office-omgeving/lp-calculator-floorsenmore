import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readOutput = (path) => readFile(new URL(`../dist/client/${path}`, import.meta.url), "utf8");

test("Netlify publish directory contains the prerendered landing page", async () => {
  const html = await readOutput("index.html");
  assert.match(html, /Waar komt je nieuwe vloer/);
  assert.match(html, /<script[^>]+src=/);
  assert.doesNotMatch(html, /Your site is taking shape/);
});

test("Netlify can detect every field submitted by the interactive form", async () => {
  const html = await readOutput("netlify-forms.html");
  const component = await readFile(new URL("../app/components/PriceFunnel.tsx", import.meta.url), "utf8");
  assert.match(html, /<form[^>]*name="offerte-aanvraag"[^>]*method="POST"[^>]*data-netlify="true"/);
  assert.match(html, /netlify-honeypot="bot-field"/);
  assert.match(html, /name="form-name" value="offerte-aanvraag"/);
  const form = component.slice(component.indexOf('<form name="offerte-aanvraag"'), component.indexOf("</form>"));
  const names = [...form.matchAll(/\bname="([^"]+)"/g)].map((match) => match[1]);
  const detectedNames = new Set([...html.matchAll(/\bname="([^"]+)"/g)].map((match) => match[1]));
  for (const name of names) {
    assert.ok(detectedNames.has(name), `Missing Netlify field: ${name}`);
  }
  for (const name of ["firstName", "email", "phone", "location", "product", "subfloor", "area", "timing", "estimate", "contactConsent", "privacyConsent"]) {
    assert.ok(names.includes(name), `Missing submission field: ${name}`);
  }
});
