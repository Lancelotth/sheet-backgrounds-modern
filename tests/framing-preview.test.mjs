import assert from "node:assert/strict";
import test from "node:test";

const hooks = new Map();
globalThis.Hooks = { once(name, fn) { hooks.set(name, fn); }, on(name, fn) { hooks.set(name, fn); } };
let playersAllowed = true;
globalThis.game = {
  system: { id: "dnd5e" }, user: { isGM: true },
  settings: { register() {}, get() { return playersAllowed; } },
  i18n: { localize(key) { return key; } }
};
globalThis.ui = { notifications: { info() {}, error() {} } };
globalThis.window = { location: { href: "https://foundry.example/game" } };
globalThis.foundry = { applications: { apps: {}, instances: new Map() } };
globalThis.requestAnimationFrame = fn => fn();

class Classes {
  values = new Set();
  add(...args) { args.forEach(x => this.values.add(x)); }
  remove(...args) { args.forEach(x => this.values.delete(x)); }
  contains(key) { return this.values.has(key); }
  toggle(key, enabled) { enabled ? this.values.add(key) : this.values.delete(key); }
}
class Styles {
  values = new Map();
  setProperty(key, value) { this.values.set(key, value); }
  getPropertyValue(key) { return this.values.get(key) ?? ""; }
  removeProperty(key) { this.values.delete(key); }
}
class Element {
  classList = new Classes();
  style = new Styles();
  dataset = {};
  children = [];
  handlers = {};
  setAttribute() {}
  append(el) { el.parent = this; this.children.push(el); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); }
  addEventListener(type, fn) { this.handlers[type] = fn; }
  querySelector(sel) {
    if (sel === "[data-sheet-backgrounds-modern]") return this.children.find(el => Object.hasOwn(el.dataset, "sheetBackgroundsModern")) ?? null;
    return null;
  }
}
globalThis.document = { createElement() { return new Element(); } };
const { backgroundPathFor, getLayout, isSupportedSheet, syncBackground, decorate, openLayoutDialog } =
  await import("../scripts/main-preview-v3.mjs");

function fixture({ path = "assets/hero.webp", legacy, isOwner = true, isEditMode = true } = {}) {
  const actor = {
    id: "actor-1", documentName: "Actor", type: "character", isOwner,
    flags: {
      ...(path === undefined ? {} : { "sheet-backgrounds-modern": { path } }),
      ...(legacy === undefined ? {} : { "background-images": { "background-image": { "actor-1": { path: legacy } } } })
    },
    async setFlag(id, key, value) { this.flags[id] ??= {}; this.flags[id][key] = value; }
  };
  const root = new Element();
  const header = new Element();
  root.querySelector = selector => selector === ".window-header" ? header : null;
  return {
    actor, root, header,
    app: { constructor: { name: "CharacterActorSheet" }, document: actor, element: root, isEditable: true, isEditMode }
  };
}
const btn = header => header.querySelector("[data-sheet-backgrounds-modern]");

test("banner is the safe legacy-inspired default", () => {
  assert.deepEqual(getLayout(fixture().actor), { mode: "banner", fit: "cover", x: 50, y: 0, darkness: 20 });
});
test("invalid configuration is normalized and percentages clamped", () => {
  const { actor } = fixture();
  actor.flags["sheet-backgrounds-modern"].layout = { mode: "bad", fit: "contain", x: -20, y: 123, darkness: 950 };
  assert.deepEqual(getLayout(actor), { mode: "banner", fit: "contain", x: 0, y: 100, darkness: 90 });
});
test("full mode adds only scoped classes and variables", () => {
  const { app, actor, root } = fixture();
  actor.flags["sheet-backgrounds-modern"].layout = { mode: "full", fit: "contain", x: 75, y: 25, darkness: 65 };
  root.style.setProperty("color", "purple");
  syncBackground(app);
  assert.equal(root.classList.contains("sbm-mode-full"), true);
  assert.equal(root.classList.contains("sbm-mode-banner"), false);
  assert.equal(root.style.getPropertyValue("--sbm-position-x"), "75%");
  assert.equal(root.style.getPropertyValue("--sbm-fit"), "contain");
  assert.equal(root.style.getPropertyValue("--sbm-darkness"), "0.65");
  assert.equal(root.style.getPropertyValue("color"), "purple");
});
test("an explicit reset overrides legacy, without touching other styles", () => {
  const { app, actor, root } = fixture({ path: "", legacy: "old.webp" });
  root.style.setProperty("color", "purple");
  assert.equal(backgroundPathFor(actor), "");
  syncBackground(app);
  assert.equal(root.classList.contains("sbm-custom-background"), false);
  assert.equal(root.style.getPropertyValue("color"), "purple");
  assert.equal(root.style.getPropertyValue("--sbm-darkness"), "");
});
test("the button appears only on editable native character sheets", () => {
  const { app, header } = fixture();
  assert.equal(isSupportedSheet(app), true);
  decorate(app);
  assert.ok(btn(header));
  app.isEditMode = false;
  decorate(app);
  assert.equal(btn(header), null);
  app.document.type = "npc";
  assert.equal(isSupportedSheet(app), false);
});
test("layout dialog preserves the image path and saves a separate actor flag", async () => {
  const { app, actor } = fixture();
  foundry.applications.api = { DialogV2: { async input() {
    return { mode: "full", fit: "contain", x: "18", y: "60", darkness: "75" };
  } } };
  await openLayoutDialog(app);
  assert.deepEqual(actor.flags["sheet-backgrounds-modern"].layout, { mode: "full", fit: "contain", x: 18, y: 60, darkness: 75 });
  assert.equal(actor.flags["sheet-backgrounds-modern"].path, "assets/hero.webp");
});
test("shift-click opens the layout editor; normal click still opens FilePicker", async () => {
  const { app, header } = fixture();
  let dialogs = 0, pickers = 0;
  foundry.applications.api = { DialogV2: { async input() { dialogs++; return null; } } };
  foundry.applications.apps.FilePicker = { implementation: class {
    render() { pickers++; }
  } };
  decorate(app);
  btn(header).handlers.click({ preventDefault() {}, shiftKey: true });
  await new Promise(resolve => setImmediate(resolve));
  btn(header).handlers.click({ preventDefault() {}, shiftKey: false });
  assert.equal(dialogs, 1);
  assert.equal(pickers, 1);
});
test("nonowners and restricted players cannot change the layout", async () => {
  const { app, header } = fixture({ isOwner: false });
  decorate(app);
  assert.equal(btn(header), null);
  app.document.isOwner = true;
  game.user.isGM = false;
  playersAllowed = false;
  decorate(app);
  assert.equal(btn(header), null);
  await openLayoutDialog(app);
  assert.equal(app.document.flags["sheet-backgrounds-modern"].layout, undefined);
  // Restore shared Foundry user mocks for subsequent tests.
  game.user.isGM = true;
  playersAllowed = true;
});

test("0% darkness is preserved and missing darkness defaults safely to 20%", () => {
  const { actor, app, root } = fixture();
  actor.flags["sheet-backgrounds-modern"].layout = { mode: "full", darkness: 0 };
  assert.equal(getLayout(actor).darkness, 0);
  syncBackground(app);
  assert.equal(root.style.getPropertyValue("--sbm-darkness"), "0");
  delete actor.flags["sheet-backgrounds-modern"].layout.darkness;
  assert.equal(getLayout(actor).darkness, 20);
});
test("only our CSS properties are changed when swapping full/banner modes", () => {
  const { actor, app, root } = fixture();
  root.style.setProperty("--third-party-theme", "preserve");
  actor.flags["sheet-backgrounds-modern"].layout = { mode: "full", darkness: 40 };
  syncBackground(app);
  assert.equal(root.style.getPropertyValue("--sbm-darkness"), "0.4");
  actor.flags["sheet-backgrounds-modern"].layout.mode = "banner";
  syncBackground(app);
  assert.equal(root.classList.contains("sbm-mode-banner"), true);
  assert.equal(root.classList.contains("sbm-mode-full"), false);
  assert.equal(root.style.getPropertyValue("--third-party-theme"), "preserve");
  actor.flags["sheet-backgrounds-modern"].path = "";
  syncBackground(app);
  assert.equal(root.style.getPropertyValue("--sbm-darkness"), "");
  assert.equal(root.style.getPropertyValue("--third-party-theme"), "preserve");
});

test("darkness slider previews instantly, without saving flags, and Cancel reverts", async () => {
  const { app, actor, root } = fixture();
  const controls = new Map();
  for (const [key, value] of Object.entries({ mode: "full", fit: "cover", x: "50", y: "0", darkness: "20" })) {
    controls.set("#sbm-" + key, { value, listeners: new Map(), addEventListener(type, callback) { this.listeners.set(type, callback); } });
  }
  for (const key of ["x", "y", "darkness"]) {
    controls.set('output[for="sbm-' + key + '"]', { textContent: "" });
  }
  const form = { querySelector: selector => controls.get(selector) ?? null };
  let previewed = false;
  foundry.applications.api = { DialogV2: { async input(options) {
    options.render(null, { element: { querySelector: selector => selector === "form" ? form : null } });
    controls.get("#sbm-darkness").value = "80";
    controls.get("#sbm-darkness").listeners.get("input")();
    assert.equal(root.style.getPropertyValue("--sbm-darkness"), "0.8");
    assert.equal(controls.get('output[for="sbm-darkness"]').textContent, "80%");
    assert.equal(actor.flags["sheet-backgrounds-modern"].layout, undefined);
    previewed = true;
    return null;
  } } };
  await openLayoutDialog(app);
  assert.equal(previewed, true);
  assert.equal(root.style.getPropertyValue("--sbm-darkness"), "0.2");
  assert.equal(root.classList.contains("sbm-mode-banner"), true);
});
test("saving the darkness slider persists independently and survives reload", async () => {
  const { app, actor, root } = fixture();
  foundry.applications.api = { DialogV2: { async input() {
    return { mode: "full", fit: "cover", x: "50", y: "0", darkness: "90" };
  } } };
  await openLayoutDialog(app);
  assert.equal(actor.flags["sheet-backgrounds-modern"].layout.darkness, 90);
  assert.equal(root.style.getPropertyValue("--sbm-darkness"), "0.9");
  syncBackground(app);
  assert.equal(root.style.getPropertyValue("--sbm-darkness"), "0.9");
});
