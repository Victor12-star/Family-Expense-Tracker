import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCurrency, shoppingLineEstimate } from "../src/utils/finance.js";

test("shoppingLineEstimate multiplies decimal quantity and price", () => {
  assert.equal(shoppingLineEstimate({ quantity: "2.5", estimatedUnitPrice: "12.40" }), 31);
});

test("shoppingLineEstimate rejects unsafe stored values", () => {
  assert.equal(shoppingLineEstimate({ quantity: -1, estimatedUnitPrice: 10 }), 0);
  assert.equal(shoppingLineEstimate({ quantity: 2, estimatedUnitPrice: "invalid" }), 0);
});

test("normalizeCurrency accepts ISO-like codes and safely falls back", () => {
  assert.equal(normalizeCurrency("sek"), "SEK");
  assert.equal(normalizeCurrency("not-a-code"), "SEK");
});
