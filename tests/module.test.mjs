import assert from "node:assert/strict";
import test from "node:test";

const hooks = new Map();
globalThis.Hooks = {
  once(name, fn) { hooks.set(name, fn); },
  on(name, fn) { hooks.set(name, fn); }
};
globalThis.game = {
  system: { id: "dnd5e" },
  user: { isGM: true },
  settings: {
    register(_id, _key, spec) { this.registered = spec; },
    get() { return true; }
  },
  i18n: { localize(key) { return key; } }
};
globalThis.ui = { notifications: { info() {}, error() {} } };
globalThis.window = { location: { href: "https://foundry.example/game" } };
globalThis.foundry = { applications: { instances: new Map(), apps: {} } };
globalThis.requestAnimationFrame = (callback) => callback();

class FakeStyle {
  data = new Map();
  setProperty(key, value) { this.data.set(key, value); }
  removeProperty(key) { this.data.delete(key); }
  getPropertyValue(key) { return this.data.get(key) ?? ""; }
}
class FakeClassList {
  data = new Set();
  add(value) { this.data.add(value); }
  remove(value) { this.data.delete(value); }
  contains(value) { return this.data.has(value); }
}
class FakeElement {
  style = new FakeStyle();
  classList = new FakeClassList();
  dataset = {};
  children = [];
  listeners = {};
  attributes = {};
  append(child) { this.children.push(child); child.parent = this; }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  setAttribute(name, value) { this.attributes[name] = value; }
  querySelector(selector) {
    if (selector === "[data-sheet-backgrounds-modern]")
      return this.children.find(child => Object.hasOwn(child.dataset, "sheetBackgroundsModern")) ?? null;
    return null;
  }
}
globalThis.document = { createElement() { return new FakeElement(); } };

const { backgroundPathFor, isSupportedSheet, syncBackground, decorate } = await import("../scripts/main-v015.mjs");

function fixture({ own, legacy, editable=true, mode=true, isOwner=true }={}) {
  const actor = {
    id: "actor123",
    documentName: "Actor",
    type: "character",
    isOwner,
    flags: {
      ...(own === undefined ? {} : { "sheet-backgrounds-modern": { path: own } }),
      ...(legacy === undefined ? {} : { "background-images": { "background-image": { actor123: { path: legacy } } } })
    },
    async setFlag(id, key, value) {
      this.flags[id] ??= {};
      this.flags[id][key] = value;
    }
  };
  const header = new FakeElement();
  const content = new FakeElement();
  const root = new FakeElement();
  root.querySelector = (selector) => selector === ".window-header" ? header
    : selector === ".window-content" ? content : null;
  const app = {
    constructor: { name: "CharacterActorSheet" },
    document: actor,
    element: root,
    isEditable: editable,
    isEditMode: mode
  };
  return { app, actor, root, header, content };
}

const bgKey = "--sbm-custom-background-url";
const btn = header => header.querySelector("[data-sheet-backgrounds-modern]");

test("D&D 5e render hooks and Foundry setting are registered", () => {
  for (const key of ["init", "renderApplicationV2", "updateActor", "ready"])
    assert.equal(typeof hooks.get(key), "function");
  hooks.get("init")();
  assert.equal(game.settings.registered.scope, "world");
  assert.equal(game.settings.registered.restricted, true);
});

test("new actor flag wins; empty string intentionally blocks the legacy flag", () => {
  assert.equal(backgroundPathFor(fixture({own: "new.webp", legacy: "old.webp"}).actor), "new.webp");
  assert.equal(backgroundPathFor(fixture({own: "", legacy: "old.webp"}).actor), "");
  assert.equal(backgroundPathFor(fixture({legacy: "old.webp"}).actor), "old.webp");
  assert.equal(backgroundPathFor(fixture().actor), "");
});

test("only standard dnd5e character ApplicationV2 sheets are targeted", () => {
  const {app} = fixture();
  assert.equal(isSupportedSheet(app), true);
  assert.equal(isSupportedSheet({...app, constructor: {name: "NpcActorSheet"}}), false);
  assert.equal(isSupportedSheet({...app, document: {...app.document, type: "npc"}}), false);
});

test("custom background is scoped to root and does not mutate window-content inline styles", () => {
  const {app, root, content} = fixture({own: "tokenizer/My Image.webp"});
  content.style.setProperty("background-image", "url(other-mod.webp)");
  syncBackground(app);
  assert.equal(root.classList.contains("sbm-custom-background"), true);
  assert.match(root.style.getPropertyValue(bgKey), /^url\("https:\/\/foundry.example\/tokenizer\/My%20Image.webp"\)$/);
  assert.equal(content.style.getPropertyValue("background-image"), "url(other-mod.webp)");
});

test("reset restores native stylesheet without erasing unrelated styles", async () => {
  const {app, root, header, content} = fixture({own: "new.webp", legacy: "legacy.webp"});
  content.style.setProperty("background-color", "purple");
  decorate(app);
  assert.ok(btn(header));
  btn(header).listeners.contextmenu({preventDefault() {}});
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.document.flags["sheet-backgrounds-modern"].path, "");
  assert.equal(root.classList.contains("sbm-custom-background"), false);
  assert.equal(root.style.getPropertyValue(bgKey), "");
  assert.equal(content.style.getPropertyValue("background-color"), "purple");
});

test("button exists only in Edit mode; it is removed when Play mode is enabled", () => {
  const {app, header} = fixture();
  hooks.get("renderApplicationV2")(app);
  assert.ok(btn(header));
  app.isEditMode = false;
  hooks.get("renderApplicationV2")(app);
  assert.equal(btn(header), null);
  app.isEditMode = true;
  hooks.get("renderApplicationV2")(app);
  assert.ok(btn(header));
  app.isEditable = false;
  decorate(app);
  assert.equal(btn(header), null);
});

test("nonowners and players restricted by GM settings cannot use the picker", () => {
  const {app, header} = fixture({isOwner: false});
  decorate(app);
  assert.equal(btn(header), null);
  app.document.isOwner = true;
  game.user.isGM = false;
  const get = game.settings.get;
  game.settings.get = () => false;
  decorate(app);
  assert.equal(btn(header), null);
  game.settings.get = get;
  game.user.isGM = true;
});

test("FilePicker selection saves a distinct flag and updates the sheet", async () => {
  let config;
  foundry.applications.apps.FilePicker = {
    implementation: class {
      constructor(options) { config = options; }
      render() { return this; }
    }
  };
  const {app, header, root} = fixture();
  decorate(app);
  btn(header).listeners.click({preventDefault() {}});
  assert.equal(config.type, "image");
  config.callback("test.webp");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.document.flags["sheet-backgrounds-modern"].path, "test.webp");
  assert.equal(root.classList.contains("sbm-custom-background"), true);
});
