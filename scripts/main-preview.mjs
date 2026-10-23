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


const BANNER_CLASS = "sbm-mode-banner";
const FULL_CLASS = "sbm-mode-full";

export function getLayout(actor) {
  const saved = actor?.flags?.[MODULE_ID]?.layout;
  const mode = saved?.mode === "full" ? "full" : "banner";
  const fit = saved?.fit === "contain" ? "contain" : "cover";
  const bounded = (value, fallback) => {
    if (value === null || value === undefined || value === "") return fallback;
    const n = Number(value);
    return Number.isFinite(n) ? Math.round(Math.max(0, Math.min(100, n))) : fallback;
  };
  return { mode, fit, x: bounded(saved?.x, 50), y: bounded(saved?.y, 0) };
}

function clearCustomStyles(root) {
  root.classList.remove(ROOT_CLASS, BANNER_CLASS, FULL_CLASS);
  for (const name of ["--sbm-custom-background-url", "--sbm-position-x", "--sbm-position-y", "--sbm-fit"]) {
    root.style.removeProperty(name);
  }
}

export function syncBackground(app) {
  const root = app.element;
  if (!root) return;
  const path = backgroundPathFor(app.document);
  if (!path) {
    clearCustomStyles(root);
    return;
  }
  try {
    const url = new URL(path, new URL("./", window.location.href));
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Unsupported image URL protocol");
    const layout = getLayout(app.document);
    root.style.setProperty(IMAGE_PROPERTY, "url(" + JSON.stringify(url.href) + ")");
    root.style.setProperty("--sbm-position-x", layout.x + "%");
    root.style.setProperty("--sbm-position-y", layout.y + "%");
    root.style.setProperty("--sbm-fit", layout.fit);
    root.classList.add(ROOT_CLASS);
    root.classList.toggle(BANNER_CLASS, layout.mode === "banner");
    root.classList.toggle(FULL_CLASS, layout.mode === "full");
  } catch (error) {
    clearCustomStyles(root);
    console.warn(MODULE_ID + " | Invalid background path", error);
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


/**
 * Shift-click image button to adjust banner vs full wallpaper positioning.
 * DialogV2.input is supported by Foundry V13 and does not require overriding sheets.
 */
export async function openLayoutDialog(app) {
  if (!canManageBackground(app)) return;
  const layout = getLayout(app.document);
  const tr = key => game.i18n.localize(MODULE_ID + ".layout." + key);
  const content = [
    "<p>" + tr("hint") + "</p>",
    '<div class="form-group"><label for="sbm-mode">' + tr("mode") + '</label><div class="form-fields"><select name="mode" id="sbm-mode">' +
      '<option value="banner"' + (layout.mode === "banner" ? " selected" : "") + ">" + tr("banner") + "</option>" +
      '<option value="full"' + (layout.mode === "full" ? " selected" : "") + ">" + tr("full") + "</option></select></div></div>",
    '<div class="form-group"><label for="sbm-fit">' + tr("fit") + '</label><div class="form-fields"><select name="fit" id="sbm-fit">' +
      '<option value="cover"' + (layout.fit === "cover" ? " selected" : "") + ">" + tr("cover") + "</option>" +
      '<option value="contain"' + (layout.fit === "contain" ? " selected" : "") + ">" + tr("contain") + "</option></select></div></div>",
    '<div class="form-group"><label for="sbm-x">' + tr("x") + '</label><div class="form-fields"><input id="sbm-x" name="x" type="range" min="0" max="100" step="1" value="' + layout.x + '"><output for="sbm-x">' + layout.x + '%</output></div></div>',
    '<div class="form-group"><label for="sbm-y">' + tr("y") + '</label><div class="form-fields"><input id="sbm-y" name="y" type="range" min="0" max="100" step="1" value="' + layout.y + '"><output for="sbm-y">' + layout.y + '%</output></div></div>'
  ].join("");
  try {
    const input = await foundry.applications.api.DialogV2.input({
      window: { title: tr("title") },
      content,
      ok: { label: tr("save"), icon: "fas fa-save" },
      rejectClose: false,
      render: (_event, dialog) => {
        const form = dialog?.element?.querySelector?.("form");
        for (const key of ["x", "y"]) {
          const slider = form?.querySelector?.("#sbm-" + key);
          const output = form?.querySelector?.('output[for="sbm-' + key + '"]');
          slider?.addEventListener("input", () => {
            if (output) output.textContent = slider.value + "%";
          });
        }
      }
    });
    if (!input || !canManageBackground(app)) return;
    const field = key => input.get?.(key) ?? input[key];
    const draft = { mode: field("mode"), fit: field("fit"), x: field("x"), y: field("y") };
    const normalized = getLayout({ flags: { [MODULE_ID]: { layout: draft } } });
    await app.document.setFlag(MODULE_ID, "layout", normalized);
    syncBackground(app);
    ui.notifications.info(tr("saved"));
  } catch (error) {
    console.error(MODULE_ID + " | Failed to save layout", error);
    ui.notifications.error(game.i18n.localize(MODULE_ID + ".error"));
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
      if (!canManageBackground(app)) return;
      if (event.shiftKey) void openLayoutDialog(app);
      else openPicker(app);
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
