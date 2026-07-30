#!/usr/bin/env node
// Generate e-label HTML pages from products.csv.
//
// Usage:
//     node generate.js
//
// Reads products.csv (one row per product/batch) and writes one HTML page
// per row to e-label/<slug>.html, plus an e-label/index.html listing all of
// them. Edit products.csv in Excel/Google Sheets/any spreadsheet app, save
// as CSV, then re-run this script.

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const CSV_PATH = path.join(ROOT, "products.csv");
const TEMPLATE_PATH = path.join(ROOT, "e-label", "template.html");
const OUTPUT_DIR = path.join(ROOT, "e-label");

const REQUIRED_COLUMNS = [
  "slug", "name", "vintage", "producer", "region", "country",
  "volume_ml", "alcohol_pct", "batch", "ingredients", "allergens",
  "energy_kj", "energy_kcal", "fat_g", "saturates_g",
  "carbohydrate_g", "sugars_g", "protein_g", "salt_g",
];

function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      field = "";
      row = [];
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

function loadRows() {
  const text = fs.readFileSync(CSV_PATH, "utf8");
  const table = parseCsv(text);
  const header = table[0];
  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length > 0) {
    console.error(`products.csv is missing required columns: ${missing.join(", ")}`);
    process.exit(1);
  }
  return table.slice(1).map((cols) => {
    const obj = {};
    header.forEach((key, idx) => {
      obj[key] = cols[idx] !== undefined ? cols[idx] : "";
    });
    return obj;
  });
}

function render(template, row) {
  return template.replace(/\$(\w+)/g, (match, key) => {
    if (!(key in row)) {
      console.error(`Missing value for placeholder $${key}`);
      process.exit(1);
    }
    return row[key];
  });
}

function main() {
  const template = fs.readFileSync(TEMPLATE_PATH, "utf8");
  const rows = loadRows();

  if (rows.length === 0) {
    console.error("products.csv has no data rows.");
    process.exit(1);
  }

  const indexItems = [];
  for (const row of rows) {
    const slug = (row.slug || "").trim();
    if (!slug) {
      console.error(`Row for '${row.name}' has an empty slug.`);
      process.exit(1);
    }
    const page = render(template, row);
    const outPath = path.join(OUTPUT_DIR, `${slug}.html`);
    fs.writeFileSync(outPath, page, "utf8");
    console.log(`wrote e-label/${slug}.html`);
    indexItems.push({ slug, title: `${row.name} ${row.vintage}` });
  }

  const indexHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>E-Labels</title></head><body>
<h1>E-Labels</h1>
<ul>
${indexItems.map(({ slug, title }) => `  <li><a href="${slug}.html">${title}</a></li>`).join("\n")}
</ul>
</body></html>
`;
  fs.writeFileSync(path.join(OUTPUT_DIR, "index.html"), indexHtml, "utf8");
  console.log("wrote e-label/index.html");
}

main();
