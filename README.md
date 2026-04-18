# Claude Max Usage Calculator

**Track your weekly Claude Max token budget in real time — no install, no build step, no account required.**

![Version](https://img.shields.io/badge/version-v0.7-blue)
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

It syncs to your system clock automatically, so the "hours elapsed since reset" stays current without any input from you.

---

## Live demo

**[jeffbai996.github.io/claude-max-usage-calculator](https://jeffbai996.github.io/claude-usage-calc/)**

Or clone and open `index.html` locally — no server needed.

---

## Usage

### Step 1 — Find your current usage percentage
In [claude.ai](https://claude.ai), your usage percentage is shown in the account/settings area or directly in the chat interface. Set the **"usage so far"** slider to that number.

### Step 2 — Sync the clock
Click **AUTO** to lock the hours-elapsed slider to your system clock. It polls every 15 seconds. The clock hint shows the current day/time being used.

Or stay in **MAN** mode and drag the **"hours elapsed"** slider manually if you want to model hypothetical scenarios (e.g., "what if I have 40% left at hour 120?").

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
| **resume-in** (only when projected > 100%) | How long to pause to get back on linear pace |
| **history sparkline** | Actual usage curve vs. linear pace, persisted across reloads |

### Settings (gear icon, top right)

- **Reset cycle**: day of week, hour, and timezone — adjust when Anthropic shifts the reset (new model launches sometimes change it).
- **Plan tokens**: override the 20x / 5x weekly estimates if you've measured your own limit or Anthropic publishes actual numbers.
- **History**: enable/disable snapshot tracking, clear the log manually.

### Keyboard shortcuts

`←` / `→` decrement/increment usage (hold Shift for ±5), `A` auto, `P` plan, `S` settings, `C` copy status, `Esc` close drawer.

### URL state sync

The URL hash (`#u=13&h=23&p=20x`) mirrors current state. Share or bookmark a specific scenario; pasting a URL loads those values.

### Reading the status bar

| Color | Meaning |
|---|---|
| Green | Projected consumption ≤ 90% — you're comfortably under |
| Yellow | Projected 90–100% — close to the wire, monitor usage |
| Red | Projected >100% — exceeding pace, likely to get throttled |

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
├── <body>        Slider controls, metric cards, token section
└── <script>      All logic — ~250 lines of vanilla JS
```

### Key design decisions

**Why a single file?**
Zero friction deployment. Drop it anywhere — local filesystem, CDN, Gist, email attachment. No dependency on npm, bundlers, or a server.

**Why vanilla JS with `requestAnimationFrame` for animations?**
The rolling number animations (`rollingSet()`) use a cubic-out easing curve over 350ms. This is smooth without any animation library. `animateSlider()` uses the same curve at 900ms for the slider thumb. Both are cancellable so rapid updates don't stack.

**Why two separate polling intervals?**
The global 15s `setInterval` silently snaps the slider value and refreshes all metrics (including the reset countdown badge). The `autoTick` 30s interval inside `toggleAuto()` uses `animateSlider()` for a smooth animated drift when the clock ticks over — better UX when AUTO mode is first enabled. Separating them means the silent poll doesn't fight the animation.

**Why `localStorage` with silent try/catch?**
Persisting usage % and hours across refreshes is pure convenience. If `localStorage` is unavailable (private browsing, certain iframe contexts), the app degrades gracefully — no error, no data loss, just no persistence.

**Why CSS custom properties for everything?**
All colors are defined in `:root` and overridden in `@media (prefers-color-scheme: dark)`. No JavaScript theme switching — the OS handles it. Adding a third theme or adjusting a color is a one-line change.

---

## The math

**Linear pace**: if your cycle is 168 hours and you're at hour `H`, you "should" have used `H/168 * 100%` of your budget.

**Projected quota**: `(usage% / hoursElapsed) * 168` — what you'd consume if you maintain current burn rate for the full week.

**Surplus/deficit**: `timePct - usagePct` — positive means you're under pace, negative means you're burning faster than linear.

**Hours to limit**: `(100 - used%) / (used% / hoursElapsed)` — how many more hours at current burn until 100%.

**Burn rate**: `(planTokens * usage% / 100) / hoursElapsed` — tokens consumed per hour.

---

## Caveats

- **Token totals are not official.** ~250M tokens/week for Max 20x and ~62.5M for Max 5x are reverse-engineered community estimates. Anthropic does not publish these numbers. The actual limits may differ, change without notice, or vary by account. Override in settings if you have better numbers.
- **Reset time can drift.** Anthropic has shifted the weekly reset hour on at least one model launch. The default is Thu 12pm PT; adjust via settings if it changes.
- **Usage % must be entered manually.** There's no API to read your usage from claude.ai — you read the number from your account and enter it here.
- **Projections assume constant burn rate.** If you have a heavy session tomorrow, the "hours to limit" estimate will be wrong. The calculator is a snapshot, not a forecast. The "recent" burn rate (last 2h, from history) is closer to real-time.
- **History is local-only.** Usage snapshots live in `localStorage` on the current browser. No server sync, no cross-device history.

---

## Contributing

Bug reports and PRs welcome. Given the zero-dependency, single-file design, contributions should stay in that spirit:

- Bug fixes and accuracy improvements: always welcome
- New metrics or UI improvements: welcome, keep the file size reasonable
- External dependencies (npm packages, CDN frameworks): not in scope for `index.html`; a separate build target could be a reasonable addition

Please open an issue before large changes to discuss scope.

---

## License

MIT — see [LICENSE](LICENSE).
