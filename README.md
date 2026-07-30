# EU E-Label QR Code Example

An example HTML "e-label" page for wine/spirit bottles, showing ingredients and a
nutrition declaration as required by EU rules, plus notes on how to link a QR
code on the bottle to it.

## Background

Since **8 December 2023**, wine sold in the EU must disclose an ingredients
list and a nutrition declaration (Regulation (EU) 2021/2117, amending the CMO
Regulation; detailed rules in Delegated Regulation (EU) 2022/2379 and
Implementing Regulation (EU) 2022/2454). Producers may give this information
**electronically** ("e-label") instead of printing it on the physical label,
as long as:

- The QR code (or other code) on the bottle links to a page containing the
  mandatory information (ingredients + nutrition declaration; allergens must
  still also appear on the physical label).
- The page does **not** require login, account creation, or an app install.
- Accessing the page does **not** require giving up personal data (no forced
  data collection as a condition of access).
- The mandatory information is **not mixed with marketing content** on that
  page — it must be clearly identifiable and separate.

## What should the QR code link to?

There's no EU-mandated URL format. What matters is that the link is a
**stable HTTPS URL** that keeps working for as long as that product/batch is
on the market. A simple, readable convention works well:

```
https://<yourdomain>/e-label/<slug>.html
```

Where `<slug>` is a URL-safe identifier for the product (and vintage/batch if
it varies from year to year), e.g.:

```
https://yourdomain.com/e-label/gruener-veltliner-2024.html
```

A "slug" just means a short, URL-safe identifier — lowercase, hyphens instead
of spaces, no special characters (e.g. "Grüner Veltliner 2024" →
`gruener-veltliner-2024`).

If you host this repo on **GitHub Pages**, the real URL becomes:

```
https://<your-github-username>.github.io/eu-elabel-qr/e-label/gruener-veltliner-2024.html
```

That URL is what you'd encode into the QR code printed on the bottle.

### Optional: GS1 Digital Link format

If you want the same QR code to also be scannable by generic retailer/GS1
tools (not just a plain browser), you can instead use the **GS1 Digital
Link** structure, which embeds a GTIN and batch number in the path:

```
https://yourdomain.com/01/<GTIN>/10/<batch>
```

This is not required for EU compliance — it's purely for interoperability
with GS1-aware scanning systems. For a single example or small-scale
producer, the simple slug-based URL above is simpler and sufficient.

## Workflow: spreadsheet in, HTML pages out

1. Open [`products.csv`](products.csv) in Excel, Google Sheets, or any
   spreadsheet app. It's a plain CSV, so any app can edit and save it back
   in that format. One row = one product/batch. Columns:

   | Column | Meaning |
   |---|---|
   | `slug` | URL-safe id, becomes the filename (`e-label/<slug>.html`) |
   | `name`, `vintage`, `producer`, `region`, `country` | Product identity |
   | `volume_ml`, `alcohol_pct`, `batch` | Bottle/batch details |
   | `ingredients` | Free text ingredients list |
   | `allergens` | Free text allergen statement |
   | `energy_kj`, `energy_kcal`, `fat_g`, `saturates_g`, `carbohydrate_g`, `sugars_g`, `protein_g`, `salt_g` | Nutrition declaration, all **per 100 ml** |

2. Add one row per product (or per vintage/batch, if the nutrition values
   change year to year).
3. Run the generator:

   ```bash
   node generate.js
   ```

   This reads every row in `products.csv` and writes one page per row to
   `e-label/<slug>.html`, using [`e-label/template.html`](e-label/template.html)
   as the layout, plus an `e-label/index.html` listing all of them. Re-run
   it any time you edit the spreadsheet — it always regenerates every page
   from scratch.
4. Commit and push. Once GitHub Pages is enabled for this repo, each page
   is live at `https://<username>.github.io/eu-elabel-qr/e-label/<slug>.html`
   — that's the URL to encode into that product's QR code.

Requires only [Node.js](https://nodejs.org) (no other dependencies) to run
the generator.

## Files

- [`products.csv`](products.csv) — the spreadsheet: one row per product/batch.
- [`generate.js`](generate.js) — reads `products.csv`, writes the HTML pages.
- [`e-label/template.html`](e-label/template.html) — the page layout, with
  `$placeholder` fields filled in from each CSV row.
- `e-label/<slug>.html` — generated output, one per product. Don't hand-edit
  these; edit `products.csv` and re-run `generate.js` instead.

## Generating the actual QR code image

Once a page is live at its final URL, generate the QR image with any QR
generator (e.g. a local CLI tool, or a QR library in your language of
choice) pointed at that exact URL. This repo doesn't include a QR image
generator itself — it's just the target pages and the URL convention.
