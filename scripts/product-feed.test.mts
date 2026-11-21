import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { COLUMNS, productFeed, productRows, startingPrice, tsvCell } from "./product-feed.mts";

test("starting prices use the catalog amount", () => {
  assert.equal(startingPrice("Free"), "0.00 AUD");
  assert.equal(startingPrice("$12 AU"), "12.00 AUD");
  assert.equal(startingPrice("A$129"), "129.00 AUD");
  assert.equal(startingPrice("from A$650 → A$5,500"), "650.00 AUD");
  assert.equal(startingPrice("from A$1,350 → A$4,500"), "1350.00 AUD");
});

test("cells are quoted only when required", () => {
  assert.equal(tsvCell("Sales Engine"), "Sales Engine");
  assert.equal(tsvCell('say "hi"'), '"say ""hi"""');
  assert.equal(tsvCell("a\tb"), '"a\tb"');
  assert.equal(tsvCell('["AU"]'), '"[""AU""]"');
});

test("the feed has one row per catalog product and a header", () => {
  const rows = productRows();
  assert.equal(rows.length, 4 + 8 + 8);
  assert.equal(new Set(rows.map((row) => row.item_id)).size, rows.length);
  for (const row of rows) {
    assert.equal(row.availability, "in_stock");
    assert.equal(row.store_country, "AU");
    assert.equal(row.target_countries, '["AU"]');
    assert.match(row.price, /^\d+\.\d{2} AUD$/);
    assert.match(row.url, /^https:\/\//);
    assert.match(row.image_url, /^https:\/\/camdouglas\.com\//);
    assert.equal(row.item_id.includes(row.title), false);
  }
  const body = productFeed();
  assert.equal(body.charCodeAt(0), COLUMNS[0].charCodeAt(0));
  assert.equal(body.startsWith(COLUMNS.join("\t")), true);
  assert.equal(body.endsWith("\n"), true);
  assert.equal(body.includes("\uFEFF"), false);
  const lines = body.trimEnd().split("\n");
  assert.equal(lines.length, rows.length + 1);
  assert.ok(existsSync("public/og.png"));
  assert.ok(existsSync("public/icons/engine-labs.png"));
});
