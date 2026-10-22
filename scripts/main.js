/**
 * Independent implementation for the ApplicationV2 D&D 5e character sheet.
 * Legacy flag data is read for migration without copying code from the old module.
 */
const ID = "sheet-backgrounds-modern";
const FLAG = "path";
const OLD_ID = "background-images";
const OLD_FLAG = "background-image";
const SHEET_CLASS = "CharacterActorSheet";

function supported(app) {
  return game.system.id === "dnd5e" &&
    app?.document?.documentName === "Actor" &&
    app.document.type === "character" &&
    app.constructor?.name === SHEET_CLASS;
}

function pathFor(actor) {
  const own = actor.getFlag(ID, FLAG);
  if (typeof own === "string") return own;
  const old = actor.getFlag(OLD_ID, OLD_FLAG);
  return old?.[actor.id]?.path ?? "";
}

function canChange(actor) {
  return actor.isOwner && (game.user.isGM || game.settings.get(ID, "allowPlayers"));
}

function applyBackground(app) {
  const content = app.element?.querySelector(".window-content");
  if (!content) return;
  const path = pathFor(app.document);
  if (!path) {
    for (const key of ["background-image", "background-size", "background-position", "background-repeat"])
      content.style.removeProperty(key);
    return;
  }
  const url = new URL(path, new URL("./", window.location.href)).href;
  content.style.setProperty("background-image", `url(${JSON.stringify(url)})`, "important");
  content.style.setProperty("background-size", "cover", "important");
  content.style.setProperty("background-position", "center top", "important");
  content.style.setProperty("background-repeat", "no-repeat", "important");
}

async function savePath(app, path) {
  try {
    if (!canChange(app.document)) throw new Error("Permission denied");
    await app.document.setFlag(ID, FLAG, path);
    applyBackground(app);
    ui.notifications.info(game.i18n.localize(path ? `${ID}.changed` : `${ID}.cleared`));
  } catch (err) {
    console.error(`${ID} | Could not update background`, err);
    ui.notifications.error(game.i18n.localize(`${ID}.error`));
  }
}

function openPicker(app) {
  if (!canChange(app.document)) return;
  const Picker = foundry.applications.apps.FilePicker.implementation;
  new Picker({
    type: "image",
    callback: (path) => { void savePath(app, path); }
  }).render(true);
}

function decorate(app) {
  if (!supported(app)) return;
  const header = app.element?.querySelector(".window-header");
  applyBackground(app);
  if (!header) return;
  const existing = header.querySelector(`[data-${ID}]`);
  if (!canChange(app.document)) {
    existing?.remove();
    return;
  }
  if (existing) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "header-control icon";
  button.setAttribute(`data-${ID}`, "");
  button.title = game.i18n.localize(`${ID}.button`);
  button.setAttribute("aria-label", button.title);
  const icon = document.createElement("i");
  icon.className = "fa-solid fa-image";
  button.append(icon);
  button.addEventListener("click", (event) => {
    event.preventDefault();
    openPicker(app);
  });
  button.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    void savePath(app, "");
  });
  header.append(button);
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
  if (!supported(app)) return;
  requestAnimationFrame(() => decorate(app));
});

Hooks.on("updateActor", (actor) => {
  for (const app of foundry.applications.instances.values()) {
    if (supported(app) && app.document.id === actor.id) applyBackground(app);
  }
});

Hooks.once("ready", () => {
  for (const app of foundry.applications.instances.values()) decorate(app);
});
