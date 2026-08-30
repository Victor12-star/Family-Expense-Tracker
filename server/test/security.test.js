import test from "node:test";
import assert from "node:assert/strict";
import { isAllowedOrigin } from "../src/middleware/security.js";

test("Capacitor origins are allowed without trusting arbitrary websites", () => {
  assert.equal(isAllowedOrigin("https://localhost"), true);
  assert.equal(isAllowedOrigin("capacitor://localhost"), true);
  assert.equal(isAllowedOrigin("https://localhost.example.com"), false);
  assert.equal(isAllowedOrigin("https://untrusted.example"), false);
});
