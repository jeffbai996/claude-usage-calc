# Claude Max Usage Calculator

**Track your weekly Claude Max token budget in real time — no install, no build step, no account required.**

![Version](https://img.shields.io/badge/version-v0.9-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Zero deps](https://img.shields.io/badge/dependencies-none-lightgrey)

---

## What it does

Claude Max plans reset weekly (default: Thursday 12pm PT, configurable in settings). Between resets, you have a finite token budget (~250M tokens/week on Max 20x, ~62.5M on Max 5x — community estimates). The calculator tells you:

- Whether you're ahead or behind linear pace
- Your projected end-of-week quota consumption at current burn rate
- How many hours until you'd theoretically hit the limit
- Your daily token budget for the remaining days
- Surplus or deficit vs. time elapsed
- A daily burn chart — one bar per day of the cycle, persisted across reloads

It syncs to your system clock automatically, so the "hours elapsed since reset" stays current without any input from you. AUTO mode is remembered across page reloads.

---

## Live demo

**[jeffbai996.github.io/claude-max-usage-calculator](https://jeffbai996.github.io/claude-usage-calc/)**

Or clone and open `index.html` locally — no server needed.

---

## Usage

### Step 1 — Find your current usage percentage
In [claude.ai](https://claude.ai), your usage percentage is shown in the account/settings area or directly in the chat interface. Set the **"usage so far"** slider to that number.

**Tip:** Install the [Chrome extension](#chrome-extension) to have usage auto-synced from claude.ai — no manual entry needed.

### Step 2 — Sync the clock
Click **AUTO** to lock the hours-elapsed slider to your system clock. It polls every 15 seconds. The clock hint shows the current day/time. AUTO mode is saved to `localStorage` so it restores on next visit.

Or stay in **MAN** mode and drag the **"hours elapsed"** slider manually to model hypothetical scenarios (e.g., "what if I have 40% left at hour 120?").

### Step 3 — Select your plan
Toggle between **20x** (~250M tokens/week) and **5x** (~62.5M tokens/week) in the token section. Token totals are overridable in settings.

### Step 4 — Read the metrics

| Metric | What it means |
|---|---|
| **quota used** | Linear projection of end-of-week consumption at current burn rate |
| **surplus / deficit** | How far ahead or behind linear pace you are, in % |
| **daily budget** | % of your limit you can use per remaining day |
| **hours left** | At current burn rate, how many hours until you'd exhaust the limit |
| **burn rate — avg** | MTok/hr since reset |
| **burn rate — recent** | MTok/hr computed from the last ~2h of tracked history |
| **daily equivalent** | Your current hourly burn scaled to a 24h day |
| **resume-in** *(only when projected > 100%)* | How long to pause to get back on linear pace |

### Daily burn chart

The **PACE** section includes a bar chart showing how much of your quota you burned on each day of the current cycle. Each bar's height is that day's usage consumption (% of weekly quota); the dashed line marks the daily pace target (1/7th of the week). Green/amber/red coloring matches the rest of the app. Today's bar is dimmed to mark it as in-progress; days not yet reached show empty.

History snapshots are written to `localStorage` after you stop dragging the slider, at most one entry per 10 minutes when usage is unchanged. They auto-clear at the start of each new cycle.

### Settings (gear icon, top right)

- **Reset cycle**: day of week, hour, and timezone — adjust when Anthropic shifts the reset (new model launches sometimes change it).
- **Plan tokens**: override the 20x / 5x weekly estimates if you've measured your own limit or Anthropic publishes actual numbers.
- **History**: enable/disable snapshot tracking, clear the log manually.

### Keyboard shortcuts

`←` / `→` decrement/increment usage (hold `Shift` for ±5), `A` auto, `P` plan, `S` settings, `C` copy status, `Esc` close drawer.

### URL state sync

The URL hash (`#u=13&h=23&p=20x`) mirrors current state. Share or bookmark a specific scenario — pasting a URL loads those values. The `a=1` parameter in the hash means AUTO mode.

### Reading the status bar

| Color | Meaning |
|---|---|
| Green | Projected consumption ≤ 90% — comfortably under pace |
| Yellow | Projected 90–100% — close to the wire, watch usage |
| Red | Projected >100% — over pace, likely to get throttled |

---

## Chrome Extension

The `extension/` directory contains a Chrome extension that scrapes your usage percentage directly from claude.ai and writes it into `localStorage` so the calculator auto-fills it. When active, a small **"via extension · synced Xm ago"** hint appears below the usage slider.

### Install (developer mode)
1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select the `extension/` folder
4. Visit [claude.ai](https://claude.ai) — usage syncs automatically

The extension only reads the usage percentage shown on claude.ai. It does not make any network requests and cannot see your conversations.

---

## Deploying to GitHub Pages

1. Fork or clone this repo
2. Push `index.html` to your repo root (or `/docs` folder)
3. Go to **Settings → Pages → Deploy from branch**
4. Select your branch and folder, click Save
5. Your URL will be `https://<username>.github.io/<repo-name>/`

No Jekyll, no config files, no build pipeline — GitHub Pages serves static HTML directly.

---

## Architecture

Single file. No dependencies. No build.

```
index.html
├── <style>       CSS custom properties, dark mode via prefers-color-scheme
├── <body>        Slider controls, metric cards, history chart, token section
└── <script>      All logic — vanilla JS, no bundler

extension/
├── manifest.json
├── content.js    Scrapes usage % from claude.ai
└── background.js Bridges content → calculator via localStorage
```

### Key design decisions

**Why a single file?**
Zero-friction deployment. Drop it anywhere — local filesystem, CDN, Gist, email attachment. No dependency on npm, bundlers, or a server.

**Why vanilla JS with `requestAnimationFrame` for animations?**
The rolling number animations (`rollingSet()`) use a cubic-out easing curve over 350ms. `animateSlider()` uses the same curve at 900ms for the slider thumb. Both are cancellable so rapid updates don't stack.

**Why two separate polling intervals?**
The global 15s `setInterval` snaps the slider value and refreshes all metrics. The `autoTick` 30s interval inside `toggleAuto()` uses `animateSlider()` for smooth animated drift — better UX than a sudden jump. Separating them means the silent poll doesn't fight the animation.

**Why `localStorage` with silent try/catch?**
If `localStorage` is unavailable (private browsing, certain iframe contexts), the app degrades gracefully — no error, no data loss, just no persistence.

**Why `_usedDragging` to gate history logging?**
Logging on every `input` event during a slider drag would write dozens of entries at the same timestamp, creating vertical artifacts in the history chart. The `pointerdown`/`pointerup` guard skips logging while the thumb is being dragged and commits the final value on release.

**Why CSS custom properties for everything?**
All colors are defined in `:root` and overridden in `@media (prefers-color-scheme: dark)`. No JavaScript theme switching — the OS handles it.

---

## The math

**Linear pace**: at hour `H` of a 168h cycle you "should" have used `H/168 × 100%` of your budget.

**Projected quota**: `(usage% / hoursElapsed) × 168` — end-of-week consumption if burn rate is constant.

**Surplus/deficit**: `timePct − usagePct` — positive = under pace, negative = burning faster than linear.

**Hours to limit**: `(100 − used%) / (used% / hoursElapsed)` — hours at current burn until 100%.

**Burn rate**: `(planTokens × usage% / 100) / hoursElapsed` — MTok/hr.

---

## Caveats

- **Token totals are not official.** ~250M/week for Max 20x and ~62.5M for Max 5x are reverse-engineered community estimates. Anthropic does not publish these figures. Override in settings if you have better numbers.
- **Reset time can drift.** Anthropic has shifted the weekly reset hour on model launches. Default is Thu 12pm PT; adjust in settings if it changes.
- **Usage % must be read manually** unless you use the Chrome extension. There is no public API to read claude.ai usage programmatically.
- **Projections assume constant burn rate.** The calculator is a snapshot, not a forecast. The "recent" burn rate (last 2h from history) is closer to real-time.
- **History is local-only.** Usage snapshots live in `localStorage`. No server sync, no cross-device history.

---

## Contributing

Bug reports and PRs welcome. Given the zero-dependency, single-file design, contributions should stay in that spirit:

- Bug fixes and accuracy improvements: always welcome
- New metrics or UI improvements: welcome, keep the file size reasonable
- External dependencies (npm packages, CDN frameworks): not in scope for `index.html`

Please open an issue before large changes to discuss scope.

---

## License

MIT — see [LICENSE](LICENSE).
