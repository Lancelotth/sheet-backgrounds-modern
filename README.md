# Sheet Backgrounds Modern

Per-character background images for the modern **D&D 5e character sheet** in **Foundry VTT v13**.

> **AI-assisted project:** This module was developed with ChatGPT assistance to solve a practical need. Its maintainer did not personally write all the code.

## Features

- Change the background of an individual character sheet using Foundry's image picker.
- The image button is visible **only in Edit mode**, and only to permitted users.
- Right-click the image button to restore the original sheet background.
- A single custom wallpaper replaces the sheet's native background layers while enabled.
- Does not patch Foundry or D&D 5e classes, modify other modules' flags, or erase third-party inline styles.
- Supports legacy background paths saved by Background Image Customization (best effort).
- English interface; GM-controlled player permissions.

## Requirements

Designed for **Foundry 13.351** and **D&D 5e 5.3.3** using `CharacterActorSheet`. Other system versions and third-party replacement character sheets are untested. **Experimental** until verified in a complete Foundry session.

## Installation

Use this manifest URL in **Foundry Setup → Add-on Modules → Install Module → Manifest URL** after a release is published:

```text
https://github.com/Lancelotth/sheet-backgrounds-modern/releases/latest/download/module.json
```

Disable the original Background Image Customization module before enabling this one. Back up your world before changing modules.

## Usage

Open a modern character sheet, enable **Edit** mode, and click the image icon in the window header to choose a background. Right-click it to reset to the native background, even if a legacy image is stored. This module does not change item, actor portrait, token, or scene images.

## Compatibility and testing

The custom background is scoped to native D&D 5e character sheets and applied only when an image is selected. No prototype monkey-patching, global stylesheet overrides, or dependencies on other add-on modules are used. UI interactions with third-party modules still require testing. See [the compatibility test checklist](docs/TESTING.md).

## Credits

Inspired by [Background Image Customization](https://github.com/kckoch/foundryvtt-change-background-image), authored as **kaybird** and hosted by **kckoch**. This independent implementation is not an official continuation and does not include the original module's code.

Created with **ChatGPT (OpenAI)** assistance and maintained by the repository owner.

## License

[MIT](LICENSE), provided as-is without warranty.
