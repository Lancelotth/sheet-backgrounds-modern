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
  const content = app.element?.querySelector(".window-content");
  if (!content) return;
  const path = currentPath(app.document);
  if (!path) {
    for (const key of STYLE_KEYS) content.style.removeProperty(key);
    return;
  }
  // FilePicker supplies relative Foundry paths as used by the proven console test.
  const url = new URL(path, new URL("./", window.location.href)).href;
  content.style.setProperty("background-image", `url(${JSON.stringify(url)})`, "important");
  content.style.setProperty("background-size", "cover", "important");
  content.style.setProperty("background-position", "center top", "important");
  content.style.setProperty("background-repeat", "no-repeat", "important");
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
    if (existing) return;
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
      if (mayEdit(app.document)) openImagePicker(app);
    });
    button.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      void saveBackground(app, "");
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
