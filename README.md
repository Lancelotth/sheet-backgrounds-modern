# Sheet Backgrounds Modern

Per-character background images for the modern **D&D 5e character sheet** in **Foundry VTT v13**.

> **AI-assisted project:** This module was developed with ChatGPT assistance to solve a practical need. Its maintainer did not personally write all the code.

## Features

- Choose a background for each character using Foundry's image picker.
- The image button is shown **only in Edit mode** and only for users permitted to edit the character.
- **Banner:** use the official D&D 5e character-sheet header artwork layer with its native fade.
- **Full Background:** replace the underlying default artwork with one full-sheet wallpaper.
- Position the artwork horizontally and vertically (0–100%), with **Cover** or **Contain**.
- Apply **Background Darkness** (0–90%) to the image only. Text, portraits, controls, and character information stay undimmed.
- See layout and darkness changes live while the settings window is open; **Cancel** restores the saved appearance.
- Right-click the image button to reset the selected background and restore the native sheet.
- GM setting to allow or restrict player background changes.
- Best-effort, read-only compatibility with background paths saved by the original Background Image Customization module.
- No prototype patches, global background overrides, or third-party module dependencies.

## Compatibility

Designed for **Foundry VTT 13.351** and **D&D 5e 5.3.3** using the stock `CharacterActorSheet`.

Third-party character-sheet replacements are not targeted. Different themes, PopOut!, TouchVTT, Mobile Improvements, and sheet export modules require individual testing. See [the test checklist](docs/TESTING.md).

## Installation

Install this manifest URL via **Foundry Setup → Add-on Modules → Install Module → Manifest URL**:

```text
https://github.com/Lancelotth/sheet-backgrounds-modern/releases/latest/download/module.json
```

Back up your world before changing modules. Disable the original Background Image Customization module to avoid conflicts. GitHub's `latest` manifest points only to the latest **stable** release, not experimental prereleases.

## Usage

Open a stock D&D 5e character sheet and enable **Edit** mode. Use the image button in the window header:

- **Click:** choose an image.
- **Shift + click:** open the layout settings. Choose Banner or Full Background, image fitting, horizontal/vertical focus, and background darkness. Changes appear immediately as a preview. Save or cancel to keep/revert the changes.
- **Right-click:** clear the custom image and restore the original character-sheet background.

Settings are stored in the actor's `flags.sheet-backgrounds-modern` namespace, independently of other modules' flags. Resetting a background does not remove old module flags.

## Credits

Inspired by [Background Image Customization](https://github.com/kckoch/foundryvtt-change-background-image), authored as **kaybird** and hosted by **kckoch**. This is an independent implementation, not an official continuation, and does not contain the original module's code.

Created with **ChatGPT (OpenAI)** assistance and maintained by the repository owner.

## License

[MIT](LICENSE), provided as-is without warranty.
