# Claude Max Usage Sync — Chrome Extension

Auto-syncs your Claude Max usage % from `claude.ai/settings/usage` into the [Claude Max Usage Calculator](../). No more manual entry.

## What it does

- Scrapes the rendered text on `claude.ai/settings/usage` every time you visit it (and every 30 min in the background if you don't).
- Stores a snapshot in `chrome.storage.local` with: 5h session %, weekly all-models %, weekly Sonnet-only %, plan tier, capture timestamp.
- Pushes the snapshot to any open calc page (`*.github.io/claude-usage-calc/*`) by writing to its `localStorage['cmuc_extension_snap']`. The calc reads that on boot and on a `cmuc-extension-snap` event for live updates.
- Popup shows current state at a glance with a manual refresh button.

## Install (unpacked)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select this `extension/` folder

The icon appears in your toolbar. Click it to see the latest snapshot. Open `claude.ai/settings/usage` once to seed the data — after that, the background worker keeps it fresh.

## Files

| File | Purpose |
|---|---|
| `manifest.json` | MV3 manifest, permissions: `storage`, `alarms`, `scripting`; host: `claude.ai`, `*.github.io` |
| `background.js` | Service worker — receives snapshots, persists, fans out to bridge tabs, alarm-driven refresh |
| `content_scrape.js` | Runs on `claude.ai/settings/usage`, parses `document.body.innerText`, ships to background |
| `content_bridge.js` | Runs on the calc page, writes snapshot to its `localStorage`, dispatches `CustomEvent` |
| `popup.html` / `popup.js` | Toolbar popup UI |
| `parse.js` | Reference parser (the content script inlines the same logic — manifest content scripts can't import modules) |
| `icons/` | Placeholder 16/48/128 PNGs |

## Parse format

The page renders sections like:

```
Current session

Resets in 2 hr 8 min

11% used
```

The parser splits on `Plan usage limits` (page header), then runs one regex per section label (`Current session`, `All models`, `Sonnet only`, `Claude Design`). If Anthropic relabels a section, edit `parse.js` and the inlined parser in `content_scrape.js`.

## Privacy

Everything stays local — the extension never sends data anywhere. The only network requests are the ones `claude.ai` makes when you visit it (or when the background worker opens it to refresh).

## Caveats

- **Read-only.** It does not interact with claude.ai beyond reading the usage page.
- **The page must render fully** before the scraper runs (1.5s delay built in). If your connection is slow, the first snapshot might miss; visit the page again or click "refresh" in the popup.
- **Background refresh opens a tab.** Every 30 min, if no fresh snapshot exists, a background tab opens to `claude.ai/settings/usage`, scrapes, and closes after 8s. You'll see it briefly in your tab list.
