# my-vm-scripts

Personal [Violentmonkey](https://violentmonkey.github.io/) userscripts.

## Install

Install a script from its raw GitHub URL in Violentmonkey, or open the URL in your browser and confirm installation.

## Scripts

| Script | Matches | Description |
|--------|---------|-------------|
| [kde-store-carousel-enhancer.user.js](./kde-store-carousel-enhancer.user.js) | `store.kde.org` | Thumbnail strip, vim-style navigation, cinema mode for KDE Store previews |

### KDE Store Carousel Enhancer

```
https://raw.githubusercontent.com/margathon/my-vm-scripts/main/kde-store-carousel-enhancer.user.js
```

## Development

1. Clone this repo
2. Edit a `.user.js` file locally
3. Bump `@version` in the script header
4. Push to GitHub
5. In Violentmonkey: **Check for updates** (or enable auto-update)

For live editing on one machine, open the local file in Violentmonkey and enable **Track external edits**.

## Sync across devices

Each script includes `@updateURL` and `@downloadURL` pointing at this repo. Install once per browser, then pull updates after you push changes.
