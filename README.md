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
   | `volume_ml`, `alcohol_pct`, `batch` | Bottle/batch details. **`alcohol_pct` must be the *actual/effective* alcoholic strength ("vorhandener Alkohol"), not the total/potential alcohol** — check your lab report for both figures. |
   | `ingredients_de` | Ingredients list, German (required) |
   | `ingredients_en` | Ingredients list, English. Optional — if left blank, the English view falls back to the German text |
   | `allergens_de` | Allergen statement, German (required) |
   | `allergens_en` | Allergen statement, English. Optional — falls back to German if blank |
   | `energy_kj`, `energy_kcal`, `fat_g`, `saturates_g`, `carbohydrate_g`, `sugars_g`, `protein_g`, `salt_g` | Nutrition declaration, all **per 100 ml** |

   The generated page defaults to **German**, with an EN/DE toggle button
   (top-right) that switches instantly — no page reload, choice remembered
   per browser via `localStorage`.

   > **Note on lab reports:** if your lab's nutrition line is only a generic
   > line like *"BEISPIEL: Enthält geringfügige Mengen von Fett, ..."*
   > ("EXAMPLE: contains minor amounts of..."), that's boilerplate the lab
   > prints when it hasn't individually measured fat/saturates/protein/salt —
   > common for wine since they're consistently negligible — not a real
   > result for your batch. Using conservative values like `<0.5` (escaped
   > as `&lt;0.5` in the CSV so it doesn't get parsed as an HTML tag) is
   > common practice, but confirm with your compliance advisor that relying
   > on generally-recognized data (rather than a per-batch lab result) for
   > those specific nutrients is acceptable for your labeling.

2. Add one row per product (or per vintage/batch, if the nutrition values
   change year to year).
3. Run the generator:

   ```bash
   node generate.js
   ```

   This reads every row in `products.csv` and writes one page per row to
   `e-label/<slug>.html`, using [`e-label/template.html`](e-label/template.html)
   as the layout, plus a landing page at `index.html` from
   [`index-template.html`](index-template.html). Re-run it any time you edit
   the spreadsheet — it always regenerates every page from scratch.
4. Commit and push. Once GitHub Pages is enabled for this repo, each page
   is live at `https://<username>.github.io/eu-elabel-qr/e-label/<slug>.html`
   — that's the URL to encode into that product's QR code.

Requires only [Node.js](https://nodejs.org) (no other dependencies) to run
the generator.

## Files

- [`products.csv`](products.csv) — the spreadsheet: one row per product/batch.
- [`generate.js`](generate.js) — reads `products.csv`, writes the HTML pages.
- [`e-label/template.html`](e-label/template.html) — the product page layout,
  with `$placeholder` fields filled in from each CSV row.
- [`index-template.html`](index-template.html) — the landing page layout.
  Winery name, address and intro text are edited **here** (not in the CSV);
  `$products` is replaced with the generated product list.
- `e-label/<slug>.html` and `index.html` — generated output. Don't hand-edit
  these; edit the CSV/templates and re-run `generate.js` instead.

## Keeping the landing page compliant

The "mandatory information must not be mixed with marketing" rule applies to
the **product e-label pages** that QR codes point to — keep those exactly as
the template produces them. The landing page (`index.html`) is navigation,
so brief factual information is fine there. Two hard limits apply anywhere on
the site:

- **No health claims of any kind.** Prohibited outright on beverages over
  1.2% ABV (Regulation (EC) 1924/2006 Art. 4(3)) — no "healthy", "good for
  you", antioxidant/wellbeing references, etc.
- **No nutrition claims** other than the narrow permitted set for alcohol
  ("low alcohol", "reduced alcohol content", "reduced energy").

Keep landing-page copy descriptive and factual rather than promotional, and
keep any webshop or marketing site on a separate page from these.

## Generating the actual QR code image

Once a page is live at its final URL, generate the QR image with any QR
generator (e.g. a local CLI tool, or a QR library in your language of
choice) pointed at that exact URL. This repo doesn't include a QR image
generator itself — it's just the target pages and the URL convention.
