import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../styles/sheet-backgrounds-modern.css", import.meta.url), "utf8");

test("the darkening gradient is layered over the image in both modes", () => {
  const matches = css.match(/background-image:\s*linear-gradient\([\s\S]*?var\(--sbm-custom-background-url\)/g) ?? [];
  assert.equal(matches.length, 2, "banner and full should each have a gradient+image pair");
});

test("the module does not darken the entire sheet or its child controls", () => {
  assert.doesNotMatch(css, /(?:^|\n)\s*(?:opacity|filter|backdrop-filter)\s*:/m);
  assert.match(css, /\.sbm-mode-full \.window-content\s*\{/);
  assert.match(css, /\.sbm-mode-banner:not\(\.minimized\) \.window-content::before/);
  assert.doesNotMatch(css, /\s!important\s*;/);
});

test("the darkness control stays scoped and uses per-sheet CSS variables", () => {
  assert.ok(css.includes("var(--sbm-darkness, 0.20)"));
  assert.match(css, /\.dnd5e2\.sheet\.actor\.character\.sbm-custom-background/);
});
