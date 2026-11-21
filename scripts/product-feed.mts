import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { engines } from "../config/engines.ts";
import { memberships, shopItems } from "../config/production.ts";
import { engineLabs, site } from "../config/site.ts";

export const FEED_PATH = "public/products.tsv";
export const COLUMNS = [
  "item_id",
  "title",
  "description",
  "url",
  "brand",
  "seller_name",
  "seller_url",
  "image_url",
  "availability",
  "price",
  "target_countries",
  "store_country",
] as const;

const STORE_COUNTRY = "AU";
const TARGET_COUNTRIES = '["AU"]';
const CAM_IMAGE = `${site.url}/og.png`;
const ENGINE_IMAGE = `${site.url}/icons/engine-labs.png`;

type Row = Record<(typeof COLUMNS)[number], string>;

// Quote only when the cell contains a tab, a newline, or a double quote.
export function tsvCell(value: string): string {
  if (!/["\t\n\r]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}

export function toTsv(rows: Row[]): string {
  const lines = [COLUMNS.join("\t")];
  for (const row of rows) lines.push(COLUMNS.map((key) => tsvCell(row[key])).join("\t"));
  return `${lines.join("\n")}\n`;
}

// The catalog stores a display price. The feed uses the customer-facing starting amount.
export function startingPrice(price: string): string {
  if (/^free$/i.test(price.trim())) return "0.00 AUD";
  const match = price.replaceAll(",", "").match(/(\d+(?:\.\d+)?)/);
  if (!match) throw new Error(`No amount in catalog price: ${price}`);
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) throw new Error(`Bad catalog price: ${price}`);
  return `${amount.toFixed(2)} AUD`;
}

function row(item: Omit<Row, "availability" | "target_countries" | "store_country">): Row {
  return {
    ...item,
    availability: "in_stock",
    target_countries: TARGET_COUNTRIES,
    store_country: STORE_COUNTRY,
  };
}

export function productRows(): Row[] {
  const rows: Row[] = [];

  for (const item of memberships) {
    const includes = item.includes.join("; ");
    const billing = item.period ? ` ${item.price}${item.period}.` : "";
    rows.push(
      row({
        item_id: `membership:${item.id}`,
        title: item.name,
        description: `${item.summary}.${billing} Includes: ${includes}.`,
        url: item.href,
        brand: site.name,
        seller_name: site.name,
        seller_url: site.url,
        image_url: CAM_IMAGE,
        price: startingPrice(item.price),
      }),
    );
  }

  for (const item of shopItems) {
    const access = item.memberOnly ? " Member-only add-on. Checkout stays on Patreon." : "";
    rows.push(
      row({
        item_id: `shop:${item.id}`,
        title: item.name,
        description: `${item.summary}${access}`,
        url: item.href,
        brand: site.name,
        seller_name: site.name,
        seller_url: site.url,
        image_url: CAM_IMAGE,
        price: startingPrice(item.price),
      }),
    );
  }

  for (const item of engines) {
    rows.push(
      row({
        item_id: `engine:${item.id}`,
        title: item.name,
        description: `${item.tagline} Replaces: ${item.replaces} Published price: ${item.price}.`,
        url: item.href,
        brand: engineLabs.headline,
        seller_name: engineLabs.headline,
        seller_url: engineLabs.siteHref,
        image_url: ENGINE_IMAGE,
        price: startingPrice(item.price),
      }),
    );
  }

  const ids = new Set(rows.map((item) => item.item_id));
  if (ids.size !== rows.length) throw new Error("Product feed ids are not unique");
  return rows;
}

export function productFeed(): string {
  return toTsv(productRows());
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const body = productFeed();
  if (body.charCodeAt(0) === 0xfeff) throw new Error("Feed must not start with a BOM");
  writeFileSync(FEED_PATH, body, { encoding: "utf8" });
}
