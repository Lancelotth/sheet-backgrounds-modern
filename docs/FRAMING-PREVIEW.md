# Background framing preview — v0.1.6-preview.1

This is **experimental** and exists only on `feature/background-framing-preview`. Do not merge to `main` until the UI has been verified in Foundry VTT 13.351 with D&D 5e 5.3.3.

## Getting the test build

The branch's Preview workflow publishes a separate **GitHub prerelease** with a pinned manifest. It does not replace the `releases/latest/download/module.json` stable manifest.

Preview manifest:

```text
https://github.com/Lancelotth/sheet-backgrounds-modern/releases/download/preview-background-framing-1/module.json
```

**Back up Foundry and your world before testing.** This preview uses the same Foundry module ID as the stable module and therefore replaces that installed module during testing. Don't run both at once. For the safest comparison, test in a duplicate world or separate Foundry data folder. To roll back, install stable `v0.1.5` using its release manifest, restart Foundry, and re-enable the stable module.

## Test interaction

1. Open a native D&D 5e character sheet and turn on **Edit** mode.
2. Click the image button as usual to choose a background.
3. **Shift + click** the same button to open the layout settings.
4. Choose **Banner (original fade)** or **Full sheet wallpaper**.
5. Choose `Cover` / `Contain` and X/Y focus, then save.
6. Close/reopen the sheet. Verify that the selection persists.
7. Right-click the button to reset the image, leaving the original D&D 5e theme intact.
8. Re-select an image to confirm the stored framing preferences persist.

The preview's default is **Banner**, using the native D&D 5e 300px upper fade pseudo-element and preserving the system's normal header and body skins. **Full** preserves a full-sheet image while suppressing the native image layers. Preferences are stored per actor under this module's own flags.

## Compatibility checks

Test players who own a character, players without ownership, the world-level `allowPlayers` option, PopOut!, TouchVTT, alternate themes, and sheet exporters. These are **manual checks**, not claims of verified compatibility.

The original module's `background-images` flags are only read, never altered. The preview does not monkey-patch Foundry classes or modify other modules' data.
