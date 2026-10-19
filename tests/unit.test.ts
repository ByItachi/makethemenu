import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, needsRehash } from "../server/auth/password";
import { slugify, validateSlug, RESERVED_SLUGS } from "../shared/slug";

test("password: hash verifies and wrong password fails", async () => {
  const h = await hashPassword("correct-horse");
  assert.ok(h.startsWith("scrypt$"));
  assert.equal(await verifyPassword("correct-horse", h), true);
  assert.equal(await verifyPassword("wrong-horse", h), false);
  assert.equal(needsRehash(h), false);
});

test("password: hashes are salted (same input, different output)", async () => {
  assert.notEqual(await hashPassword("same-password"), await hashPassword("same-password"));
});

test("password: legacy plaintext is accepted once and flagged for rehash", async () => {
  assert.equal(await verifyPassword("admin123", "admin123"), true);
  assert.equal(await verifyPassword("admin124", "admin123"), false);
  assert.equal(needsRehash("admin123"), true);
});

test("password: malformed hash never verifies", async () => {
  assert.equal(await verifyPassword("x", "scrypt$broken"), false);
});

test("slugify: Turkish characters and symbols become ascii slugs", () => {
  assert.equal(slugify("Nilüfer Pastane & Kafe"), "nilufer-pastane-kafe");
  assert.equal(slugify("ÇİĞÖŞÜ ığ"), "cigosu-ig");
  assert.equal(slugify("  --  "), "");
});

test("validateSlug: accepts good slugs, rejects bad and reserved ones", () => {
  assert.equal(validateSlug("cafeadi"), null);
  assert.equal(validateSlug("cafe-adi-2"), null);
  assert.notEqual(validateSlug("ab"), null, "too short");
  assert.notEqual(validateSlug("Cafe"), null, "uppercase");
  assert.notEqual(validateSlug("-cafe"), null, "leading dash");
  assert.notEqual(validateSlug("cafe-"), null, "trailing dash");
  assert.notEqual(validateSlug("cafe--adi"), null, "double dash");
  assert.notEqual(validateSlug("cafe_adi"), null, "underscore");
  assert.notEqual(validateSlug("a".repeat(64)), null, "too long");
  for (const r of ["admin", "api", "p", "dashboard", "login"]) {
    assert.ok(RESERVED_SLUGS.has(r));
    assert.notEqual(validateSlug(r), null, `reserved: ${r}`);
  }
});
