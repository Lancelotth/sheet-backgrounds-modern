/**
 * Sheet Backgrounds Modern
 * Independent adaptation for D&D 5e's ApplicationV2 character sheet.
 * Inspired by Background Image Customization by kckoch.
 */
const ID = "sheet-backgrounds-modern";
const OLD_ID = "background-images";
const STYLE_KEYS = ["background-image", "background-size", "background-position", "background-repeat"];

function isCharacterSheet(app) {
  return game.system.id === "dnd5e"
    && app?.document?.documentName === "Actor"
    && app.document.type === "character"
    && app.constructor?.name === "CharacterActorSheet";
}

function currentPath(actor) {
  // Reading raw actor flags works even when the original module is disabled.
  // An explicit empty string means "reset" and overrides any legacy background.
  const own = actor.flags?.[ID]?.path;
  if (typeof own === "string") return own;
  const legacy = actor.flags?.[OLD_ID]?.["background-image"];
  return legacy?.[actor.id]?.path ?? "";
}

function mayEdit(actor) {
  return actor.isOwner && (game.user.isGM || game.settings.get(ID, "allowPlayers"));
}

function applyBackground(app) {
  const root = app.element;
  if (!root) return;
  const path = currentPath(app.document);
  const properties = [
    "--dnd5e-character-background-image",
    "--dnd5e-character-background-content",
    "--dnd5e-character-header-image",
    "--dnd5e-character-body-image"
  ];
  if (!path) {
    for (const property of properties) root.style.removeProperty(property);
  } else {
    const url = new URL(path, new URL("./", window.location.href)).href;
    const image = `url(${JSON.stringify(url)})`;
    // Replace the D&D 5e sheet's native layers instead of stacking another background.
    root.style.setProperty("--dnd5e-character-background-image", image);
    root.style.setProperty("--dnd5e-character-background-content", '""');
    root.style.setProperty("--dnd5e-character-header-image", image);
    root.style.setProperty("--dnd5e-character-body-image", `${image} top center / cover no-repeat`);
  }
  // Clean up inline styles from older module versions if the sheet stayed open.
  const content = root.querySelector(".window-content");
  if (content) for (const key of STYLE_KEYS) content.style.removeProperty(key);
}

function inEditMode(app) {
  // D&D 5e 5.3.3 adds .editable to the sheet when its Edit toggle is enabled.
  return app.element?.classList.contains("editable") === true;
}

async function saveBackground(app, path) {
  try {
    if (!mayEdit(app.document)) return;
    await app.document.setFlag(ID, "path", path);
    applyBackground(app);
    ui.notifications.info(game.i18n.localize(`${ID}.${path ? "changed" : "cleared"}`));
  } catch (error) {
    console.error(`${ID} | Failed to save background`, error);
    ui.notifications.error(game.i18n.localize(`${ID}.error`));
  }
}

function openImagePicker(app) {
  try {
    const Picker = foundry.applications.apps.FilePicker.implementation;
    new Picker({
      type: "image",
      callback: (path) => { void saveBackground(app, path); }
    }).render(true);
  } catch (error) {
    console.error(`${ID} | Failed to open image picker`, error);
    ui.notifications.error(game.i18n.localize(`${ID}.error`));
  }
}

function decorate(app) {
  if (!isCharacterSheet(app)) return;
  try {
    applyBackground(app);
    const header = app.element?.querySelector(".window-header");
    if (!header) return;
    const existing = header.querySelector(`[data-sheet-backgrounds-modern]`);
    if (!mayEdit(app.document)) {
      existing?.remove();
      return;
    }
    if (!inEditMode(app)) {\n      existing?.remove();\n      return;\n    }\n    if (existing) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "background-image-button";
    button.dataset.sheetBackgroundsModern = "";
    button.title = game.i18n.localize(`${ID}.button`);
    button.setAttribute("aria-label", button.title);
    const icon = document.createElement("i");
    icon.className = "fas fa-image";
    button.append(icon);
    button.addEventListener("click", (event) => {
      event.preventDefault();
      if (mayEdit(app.document) && inEditMode(app)) openImagePicker(app);
    });
    button.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      if (inEditMode(app)) void saveBackground(app, "");
    });
    header.append(button);
  } catch (error) {
    console.error(`${ID} | Could not decorate character sheet`, error);
  }
}

Hooks.once("init", () => {
  game.settings.register(ID, "allowPlayers", {
    name: `${ID}.allowPlayers.name`,
    hint: `${ID}.allowPlayers.hint`,
    scope: "world",
    config: true,
    restricted: true,
    type: Boolean,
    default: true
  });
});

Hooks.on("renderApplicationV2", (app) => {
  if (!isCharacterSheet(app)) return;
  // The header may be replaced by an ApplicationV2 render.
  requestAnimationFrame(() => decorate(app));
});

Hooks.on("updateActor", (actor) => {
  for (const app of foundry.applications.instances.values()) {
    if (isCharacterSheet(app) && app.document.id === actor.id) decorate(app);
  }
});

Hooks.once("ready", () => {
  for (const app of foundry.applications.instances.values()) decorate(app);
});
