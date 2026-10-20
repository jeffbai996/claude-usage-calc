# Claude Max Usage Calculator

Static page that projects weekly Claude Max usage against linear pace. Live: <https://jeffbai996.github.io/claude-usage-calc/>

## Install

No build, no dependencies. Open `index.html` locally, or serve the repository root from any static host (GitHub Pages: Settings → Pages → deploy from branch). `fonts/` must sit next to `index.html`.

Optional Chrome extension: `chrome://extensions` → Developer mode → Load unpacked → `extension/`. See `extension/README.md`.

## Usage

- **usage so far** slider: weekly usage % from claude.ai, or filled by the extension.
- **hours elapsed**: AUTO locks it to the system clock; MAN allows hypothetical values.
- **plan**: 20x or 5x.
- Metrics and status colors (green ≤ 90% projected, yellow 90–100%, red > 100%) are labeled in the page. The PACE card has a per-day burn chart.
- Keys: `←`/`→` usage (`Shift` ±5), `A` auto, `P` plan, `S` settings, `C` copy status, `Esc` close drawer.
- The URL hash mirrors state (`#u=13&h=23&p=20x`, `a=1` = AUTO). The hash wins over `localStorage` on load.

Math (cycle = 168 h):

- projected quota = `usage% / hoursElapsed × 168`
- surplus/deficit = `hoursElapsed/168 × 100 − usage%`
- hours to limit = `(100 − usage%) / (usage% / hoursElapsed)`
- burn rate = `planTokens × usage% / 100 / hoursElapsed` (MTok/h)

## Configuration

Settings drawer (gear icon), stored in `localStorage['cmuc_settings']`; defaults in `DEFAULT_SETTINGS` in `index.html`:

- reset day, hour, timezone (default Thu 12:00 `America/Los_Angeles`)
- weekly token totals for 20x and 5x
- history tracking on/off, clear history

Other `localStorage` keys: `cmuc_history`, `cmuc_used`, `cmuc_hrs`, `cmuc_plan`, `cmuc_auto`, `cmuc_fable`, `cmuc_extension_snap`, `cmuc_live_url`.

### Live feed

A `live.json` served next to `index.html` (or the URL in `cmuc_live_url`) supplies usage, plan and reset instant, and hides the manual controls. Without it the fetch 404s and the sliders stay in charge.

```json
{
  "ok": true,
  "plan": "20x",
  "capturedAt": 1786019258210,
  "weeklyAll": { "pct": 26.0, "resetsAt": "2026-08-11T22:59:59Z" },
  "fable":     { "pct": 28.0, "resetsAt": "2026-08-11T23:00:00Z" }
}
```

`weeklyAll` is required. `fable` is optional and enables the FABLE toggle (per-model window). If the feed stops responding, the page falls back to clock-driven sync.

## Notes

- Token totals (250M/week for 20x, 62.5M for 5x) are community estimates; Anthropic does not publish them.
- The reset time can change on model launches; adjust it in settings.
- Projections assume a constant burn rate. History is local to the browser.
- No `innerHTML`; build DOM with `createElement` and `textContent`. Other conventions and the function map are in `CLAUDE.md`.

MIT, see `LICENSE`.
