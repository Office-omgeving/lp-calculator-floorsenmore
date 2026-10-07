# Floors & More richtprijscalculator

Conversiegerichte landingspagina waarmee bezoekers eerst een indicatieve richtprijs voor hun gietvloer berekenen en daarna vrijblijvend een offerte op maat kunnen aanvragen.

## Vereisten

- Node.js `>=22.13.0`

## Lokaal starten

```bash
npm install
npm run dev
npm run build
```

This starter does not use `wrangler.jsonc`.

## Commando's

- `npm run dev`: start de lokale ontwikkelserver
- `npm run build`: maak de productieversie voor Netlify

De statische uitvoer komt in `dist/client`. De Netlify-instellingen staan in `netlify.toml`.

## Netlify Forms

- Build command: `npm run build`; publish directory: `dist/client` (vastgelegd in `netlify.toml`).
- Schakel in het Netlify-dashboard onder **Forms** de optie **Enable form detection** in en deploy daarna opnieuw.
- Netlify detecteert `offerte-aanvraag` via `public/netlify-forms.html`. Houd de veldnamen in deze statische definitie gelijk aan het interactieve formulier.
- Het formulier verstuurt contactgegevens, vloertype, ondervloer, oppervlakte, planning en richtprijs via een URL-encoded POST. De bedankmelding verschijnt alleen na een succesvolle HTTP-respons.
- Inzendingen verschijnen onder **Forms → offerte-aanvraag**. E-mailmeldingen stel je afzonderlijk in Netlify in.
- Test na deployment met een herkenbare testaanvraag en controleer de ontvangst in Netlify (ook de spamfolder). Gewone localhost biedt geen Netlify Forms-backend.
- `npm test` controleert de statische build en detecteerbare formuliervelden. Ontvangst door Netlify moet op de gedeployde site worden geverifieerd.

## Google Tag Manager

- De root-layout laadt webcontainer `GTM-M5TLD7X5` en bevat de bijbehorende noscript-code.
- Na een succesvolle Netlify Forms-response pusht het formulier `lp_lead_success` naar `window.dataLayer`. Bij een mislukte response wordt geen conversie-event verstuurd. Het event bevat geen contactgegevens.
- Configureer en publiceer in GTM de Meta Pixel `2474496069532591` en een `Lead`-tag met een Custom Event-trigger voor `lp_lead_success`. Alleen de GTM-installatie meet nog geen Meta-conversies.
- Controleer na deployment met GTM Preview en Meta Test Events dat een succesvolle aanvraag precies één Lead-event veroorzaakt en een mislukte aanvraag geen.
