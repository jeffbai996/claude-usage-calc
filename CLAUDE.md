# CLAUDE.md — Claude Max Usage Calculator

## What this is
Single-file static HTML/CSS/JS app. No build step, no framework, no dependencies.
Deploy by dropping `index.html` anywhere — GitHub Pages, Netlify, local open.

## Architecture
- All logic in one file: HTML + CSS custom properties + vanilla JS (~1050 lines as of v0.7)
- Dark mode: `prefers-color-scheme` via CSS variables
- State: `localStorage` (try/catch — silent fallback if unavailable)
- History: `localStorage['cmuc_history']` = JSON array of `{ts, used, hrs}`, pruned to 500 entries and cycle-bounded
- Settings: `localStorage['cmuc_settings']` = JSON blob, merged over `DEFAULT_SETTINGS` on boot
- URL hash sync: `#u=13&h=23&p=20x[&a=1]` mirrors state via `history.replaceState`
- No bundler, no npm, no config files, no external JS

## Key constants
- `CYCLE = 168` — weekly cycle in hours
- `DEFAULT_SETTINGS.tokens20x = 250`, `tokens5x = 62.5` — MTok estimates (community-derived, overridable)
- `DEFAULT_SETTINGS.resetDay = 4` (Thursday), `resetHour = 12`, `resetTz = 'America/Los_Angeles'` — Anthropic sometimes shifts reset hour on model launches, so this is user-configurable via settings drawer

## Core functions
| Function | Purpose |
|---|---|
| `getCycleStartDate()` | TZ-aware most-recent reset instant based on settings. Uses `Intl.DateTimeFormat` parts + `tzOffsetMin()` for DST-correct anchoring. |
| `tzOffsetMin(date, tz)` | Returns minutes offset of an IANA zone at a given UTC instant. Formats to zone parts, reconstructs as UTC, takes diff. DST-correct by construction. |
| `getAutoHours()` | Hours elapsed since last reset from system clock |
| `getResetHrs()` | Hours until next reset |
| `update()` | Master render — reads sliders/settings, recomputes all metrics, updates DOM, logs history, redraws sparkline |
| `logUsage(used, hrs)` | Appends to history if `used` changed or >10min since last entry. While dragging, throttled to one log per 300ms (`DRAG_LOG_THROTTLE_MS`) instead of skipped entirely — a fast drag still leaves real intermediate points. Prunes cross-cycle entries. |
| `recentBurn(hoursBack, TOK)` | MTok/hr computed from history delta over last N hours. Returns null if <2 entries or <0.05h span. |
| `renderSparkline()` | Draws inline SVG: dotted linear pace line + solid blue actual usage curve. Uses `createElementNS` (no innerHTML). |
| `rollingSet(id, val)` | Animated number transition via rAF, cubic-out 350ms |
| `animateSlider(target)` | Smooth slider thumb animation, cubic-out 900ms |
| `applyPlanBtn()` | Applies correct color to 20x/5x toggle |
| `saveState()` / `loadState()` | localStorage persistence (used, hrs, plan) + URL hash sync |
| `applyHash()` / `syncUrlHash()` | URL hash state encode/decode. URL beats localStorage on load. |
| `copyStatus()` | Formats snapshot to multi-line string, writes via `navigator.clipboard.writeText` (falls back to hidden textarea). |
| `openSettings()` / `closeSettings()` / `onSettingChange()` | Drawer toggle + live-apply on any input change |

## Inputs
- **usage so far** slider: 0–100%, user-entered weekly usage %
- **hours elapsed** slider: 0–168h, manual or AUTO-synced to system clock
- **time sync toggle**: AUTO (locked to real clock, 15s poll) | MAN (free drag)
- **plan toggle**: 20x | 5x (persisted)
- **Settings drawer** (gear icon): reset day/hour/timezone, plan token overrides, history toggle/clear
- **Keyboard**: ←/→ usage (Shift = ±5), A auto, P plan, S settings, C copy, Esc close

## Polling
- Global 15s interval always runs; updates `sl.value` from `getAutoHours()` when in AUTO, then calls `update()`
- A separate 30s `autoTick` interval fires `animateSlider()` for animated clock drift when AUTO is active
- `update()` logs usage to history on every call (no-op if unchanged / <10min since last)

## Edit conventions
- Use targeted inline edits — rewrite only if >8 scattered locations or file is broken
- CSS custom properties for all colors — never hardcode outside `:root`
- `var(--font-sans)` for labels, numbers render as plain values with unit in subtitle
- `rollingSet()` for any numeric value that changes — do not use `.textContent =` directly on animated fields
- **Never use `innerHTML`** — always `createElement` / `createElementNS` + `appendChild` + `textContent`. The repo has a security hook that blocks innerHTML writes.
- SVG elements require `createElementNS('http://www.w3.org/2000/svg', ...)`

## Known limitations
- Token totals are community estimates, not Anthropic-official
- Usage % must be read from claude.ai and entered manually — no API
- History is local-only, no cross-device sync
- `animateSlider` has 0.01h threshold — intentional, prevents micro-jitter on poll ticks
- 5-hour session tracker deferred — weekly-only for now
