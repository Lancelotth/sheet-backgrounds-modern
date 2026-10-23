/**
 * Sheet Backgrounds Modern - Foundry VTT 13 / D&D 5e 5.3.3.
 * Independent implementation, inspired by Background Image Customization (kaybird / kckoch).
 * No prototype patches, no core data changes, and no dependencies on other modules.
 */

const MODULE_ID = "sheet-backgrounds-modern";
const LEGACY_ID = "background-images";
const ROOT_CLASS = "sbm-custom-background";
const IMAGE_PROPERTY = "--sbm-custom-background-url";
const BUTTON_SELECTOR = "[data-sheet-backgrounds-modern]";

export function backgroundPathFor(actor) {
  // Read stored flags directly: Foundry 13 rejects getFlag for inactive module namespaces.
  // An explicitly reset background (empty string) must take precedence over legacy data.
  const selected = actor?.flags?.[MODULE_ID]?.path;
  if (typeof selected === "string") return selected;
  const legacy = actor?.flags?.[LEGACY_ID]?.["background-image"]?.[actor?.id]?.path;
  return typeof legacy === "string" ? legacy : "";
}

export function isSupportedSheet(app) {
  return game.system.id === "dnd5e"
    && app?.document?.documentName === "Actor"
    && app.document.type === "character"
    && app.constructor?.name === "CharacterActorSheet";
}

function canManageBackground(app) {
  // The official D&D 5e mode is authoritative; do not infer it from CSS classes.
  if (!app?.isEditable || !app?.isEditMode || !app.document?.isOwner) return false;
  return game.user.isGM || game.settings.get(MODULE_ID, "allowPlayers");
}

export function syncBackground(app) {
  const root = app.element;
  if (!root) return;
  const path = backgroundPathFor(app.document);
  if (!path) {
    root.classList.remove(ROOT_CLASS);
    root.style.removeProperty(IMAGE_PROPERTY);
    return;
  }

  try {
    // FilePicker paths are server-relative; this base works with Foundry subpaths.
    const url = new URL(path, new URL("./", window.location.href));
    if (!(["http:", "https:"].includes(url.protocol))) throw new Error("Unsupported image URL protocol");
    root.style.setProperty(IMAGE_PROPERTY, `url(${JSON.stringify(url.href)})`);
    root.classList.add(ROOT_CLASS);
  } catch (error) {
    // Invalid legacy paths must not prevent the character sheet from rendering.
    root.classList.remove(ROOT_CLASS);
    root.style.removeProperty(IMAGE_PROPERTY);
    console.warn(`${MODULE_ID} | Invalid background path`, error);
  }
}

async function saveBackground(app, path) {
  try {
    if (!canManageBackground(app)) return;
    await app.document.setFlag(MODULE_ID, "path", path);
    syncBackground(app);
    ui.notifications.info(game.i18n.localize(`${MODULE_ID}.${path ? "changed" : "cleared"}`));
  } catch (error) {
    console.error(`${MODULE_ID} | Unable to save the selected background`, error);
    ui.notifications.error(game.i18n.localize(`${MODULE_ID}.error`));
  }
}

function openPicker(app) {
  try {
    if (!canManageBackground(app)) return;
    const Picker = foundry.applications.apps.FilePicker.implementation;
    new Picker({
      type: "image",
      callback: (path) => { void saveBackground(app, path); }
    }).render(true);
  } catch (error) {
    console.error(`${MODULE_ID} | Unable to open the image picker`, error);
    ui.notifications.error(game.i18n.localize(`${MODULE_ID}.error`));
  }
}

export function decorate(app) {
  if (!isSupportedSheet(app)) return;
  try {
    syncBackground(app);
    const header = app.element?.querySelector(".window-header");
    if (!header) return;

    const existing = header.querySelector(BUTTON_SELECTOR);
    if (!canManageBackground(app)) {
      existing?.remove();
      return;
    }
    if (existing) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "header-control icon sbm-background-button";
    button.dataset.sheetBackgroundsModern = "";
    button.title = game.i18n.localize(`${MODULE_ID}.button`);
    button.setAttribute("aria-label", button.title);
    const icon = document.createElement("i");
    icon.className = "fas fa-image";
    icon.setAttribute("aria-hidden", "true");
    button.append(icon);
    button.addEventListener("click", (event) => {
      event.preventDefault();
      if (canManageBackground(app)) openPicker(app);
    });
    button.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      if (canManageBackground(app)) void saveBackground(app, "");
    });
    header.append(button);
  } catch (error) {
    console.error(`${MODULE_ID} | Unable to update the character sheet`, error);
  }
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "allowPlayers", {
    name: `${MODULE_ID}.allowPlayers.name`,
    hint: `${MODULE_ID}.allowPlayers.hint`,
    scope: "world",
    config: true,
    restricted: true,
    type: Boolean,
    default: true
  });
});

Hooks.on("renderApplicationV2", (app) => {
  if (!isSupportedSheet(app)) return;
  // D&D 5e sets its mode state during render; defer the header update to the next frame.
  requestAnimationFrame(() => decorate(app));
});

Hooks.on("updateActor", (actor, changed) => {
  // Only flags can affect our selected background. Ordinary actor edits are ignored.
  if (!changed?.flags) return;
  for (const app of foundry.applications.instances.values()) {
    if (isSupportedSheet(app) && app.document.id === actor.id) syncBackground(app);
  }
});

Hooks.once("ready", () => {
  for (const app of foundry.applications.instances.values()) decorate(app);
});
