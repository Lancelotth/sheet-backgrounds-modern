# Compatibility and regression test checklist

Target: Foundry VTT **13.351**, D&D 5e **5.3.3**, native `CharacterActorSheet`.

These manual checks have **not** been completed automatically by GitHub Actions. Node.js tests cover isolated module logic only.

1. Install from the released manifest and verify the displayed module version.
2. Open a native character sheet in Play mode: no custom image button should be visible.
3. Enable Edit mode: the image button should appear in the window header.
4. Disable Edit mode: the button should disappear; the custom background must stay visible.
5. Select two different images in succession: only the latest image should be visible.
6. **Shift + click** the image button and verify both Banner (native 300px fade) and Full Background (full wallpaper).
7. Adjust horizontal/vertical focus and Cover/Contain; the visual result must update during the dialog.
8. Adjust **Background Darkness** from 0% to 90%; the image should change live while text, portraits, and UI panels retain their original opacity.
9. Cancel the layout dialog after changing the slider: its previous saved value should return. Save a different value and reopen to verify it persisted.
10. Close and reopen the character sheet, then reload Foundry: image should persist.
11. Right-click the image button in Edit mode: default background returns without deleting any legacy flags.
12. Test characters with old `background-images` flags while the original module is **disabled**.
13. Test a player who owns the actor with allowPlayers on and off, plus a non-owner.
14. Confirm NPC, vehicle, and nonstandard/third-party sheets are unaffected.
15. Verify behavior with both light and dark D&D 5e themes.
16. Test PopOut!, TouchVTT, and Mobile Improvements where applicable; check header controls and image picker.
17. Export a sheet using Markdown Sheet Exporter or GG Sheet Export; check the exported data is unchanged.
18. Verify other third-party modules' inline styles and actor flags are not altered by this module.
19. On world startup, distinguish independent validation errors from disabled modules (e.g. auraeffects.aura, fxmaster.particleEffectsRegion) from this module's own console warnings.

For compatibility reports, include Foundry version, D&D 5e version, module version, whether the stock character sheet is used, and the complete browser-console error and stack trace.
