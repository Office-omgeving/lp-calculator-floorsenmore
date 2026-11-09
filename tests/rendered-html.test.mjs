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
  for (const name of ["firstName", "email", "phone", "location", "product", "subfloor", "area", "timing", "estimate"]) {
    assert.ok(names.includes(name), `Missing submission field: ${name}`);
  }
});

test("contactgegevens zijn verplicht vóór de richtprijs", async () => {
  const component = await readFile(new URL("../app/components/PriceFunnel.tsx", import.meta.url), "utf8");
  const contactAt = component.indexOf("{step === contactStep && (");
  const resultAt = component.indexOf("{step === resultStep && (");
  assert.ok(contactAt > 0 && resultAt > contactAt, "contactstap moet vóór het resultaat staan");
  const resultPanel = component.slice(resultAt);
  assert.match(resultPanel, /PriceValue/);
  assert.doesNotMatch(component.slice(0, resultAt), /<PriceValue value=\{priceText\}/, "gedetailleerde richtprijs mag niet vóór het contactformulier zichtbaar zijn");
  const contactPanel = component.slice(contactAt, resultAt);
  assert.match(contactPanel, /<PriceValue value=\{broadText\}/, "contactstap toont de ruime eerste inschatting");
  assert.match(resultPanel, /<PriceValue value=\{priceText\}/);
  assert.match(component, /setStep\(resultStep\)/);
  assert.match(component, /\/\.netlify\/functions\/fm-lead/);
  assert.match(component, /type="checkbox" name="consent" value="ja" required/);
});
