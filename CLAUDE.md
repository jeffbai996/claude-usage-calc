# CLAUDE.md — Claude Max Usage Calculator

## What this is
Single-file static HTML/CSS/JS app. No build step, no framework, no dependencies.
Deploy by dropping `index.html` anywhere — GitHub Pages, Netlify, local open.

## Architecture
- All logic in one file: HTML + CSS custom properties + vanilla JS
- Dark mode: `prefers-color-scheme` via CSS variables
- State: `localStorage` (try/catch — silent fallback if unavailable)
- No bundler, no npm, no config files needed

## Key constants
- `CYCLE = 168` — weekly cycle in hours (Thu 10pm PT reset)
- `PLAN_TOKENS = { '20x': 250, '5x': 62.5 }` — MTok estimates (community-derived)
- Reset time: hardcoded Thu 10pm PT — does not account for DST edge cases

## Core functions
| Function | Purpose |
|---|---|
| `getAutoHours()` | Hours elapsed since last Thu 10pm from system clock |
| `getResetHrs()` | Hours until next Thu 10pm reset |
| `update()` | Master render — reads sliders, recomputes all metrics, updates DOM |
| `rollingSet(id, val)` | Animated number transition via rAF, cubic-out 350ms |
| `animateSlider(target)` | Smooth slider thumb animation, cubic-out 900ms |
| `applyPlanBtn()` | Applies correct color to 20x/5x toggle on load and switch |
| `saveState()` / `loadState()` | localStorage persistence with silent try/catch |

## Inputs
- **usage so far** slider: 0–100%, user-entered weekly usage %
- **hours elapsed** slider: 0–168h, manual or AUTO-synced to system clock
- **time sync toggle**: AUTO (locked to real clock, 15s poll) | MAN (free drag)
- **plan toggle**: 20x = 250 MTok (orange) | 5x = 62.5 MTok (green)

## Polling
- Global 15s interval always runs
- In AUTO mode: directly sets `sl.value` from `getAutoHours()` then calls `update()`
- A separate 30s `autoTick` interval fires `animateSlider()` for animated clock drift
- In MAN mode: just calls `update()` (refreshes reset badge, no slider change)

## Known limitations / future work
- Token totals are community estimates, not Anthropic-official
- DST edge cases not handled for Thu 10pm reset
- `animateSlider` has 0.01h threshold — intentional, prevents micro-jitter on poll ticks
- No mobile touch tuning on range inputs
- Plan preference (5x/20x) not persisted to localStorage

## Edit conventions
- Use targeted inline edits — rewrite only if >8 scattered locations or file is broken
- CSS custom properties for all colors — never hardcode outside `:root`
- `var(--font-sans)` for labels, numbers render as plain values with unit in subtitle
- `rollingSet()` for any numeric value that changes — do not use `.textContent =` directly on animated fields
