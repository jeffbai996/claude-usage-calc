# claude-usage-calc

![Version](https://img.shields.io/badge/version-v1.1-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Dependencies](https://img.shields.io/badge/dependencies-none-blue?style=flat-square)

A one-page calculator for your weekly Claude Max usage. Give it the percentage of your limit you have used and how far into the week you are, and it shows whether you are ahead of or behind a straight-line pace.

Try it at [jeffbai996.github.io/claude-usage-calc](https://jeffbai996.github.io/claude-usage-calc/), or open `index.html` in a browser. There is no server, build step or account.

## What it works out

The calculator assumes the plan resets once a week, on Thursday at 12:00 Pacific. You can change that in settings. Between resets there is a fixed token budget. The calculator turns your usage and the hours elapsed into these numbers:

| Metric | What it means |
|---|---|
| **quota used** | Where the week ends up if you keep burning at the current rate |
| **surplus / deficit** | How far ahead of or behind a straight-line pace you are, in % |
| **daily budget** | The share of your limit you can use on each remaining day |
| **hours left** | At the current rate, how long until you hit the limit |
| **burn rate** | Millions of tokens per hour, averaged since the reset and over the last two hours |
| **daily equivalent** | The current hourly rate scaled to a full day |
| **resume-in** | How long to pause to get back on pace. Shown only when the projection is over 100% |

The status bar is green when the projection is 90% or less, yellow from 90 to 100%, and red above 100%.

The weekly token totals are estimates: about 250M on Max 20x and 62.5M on Max 5x. They are community figures, not published ones. You can change them in settings.

The pace panel also draws one bar per day of the cycle. A bar's height is that day's usage as a share of the weekly quota, and the dashed line marks one seventh of the week. Today's bar is dimmed because the day is not over.

## Using it

1. Read your usage percentage from claude.ai/settings/usage and set the **usage so far** slider to it.
2. Set **hours elapsed**. **AUTO** ties that slider to your system clock and refreshes it every 15 seconds. It is remembered between visits. **MAN** lets you drag the slider to try a what-if, such as 60% used at hour 120.
3. Pick the plan, 20x or 5x.

The gear icon opens settings: the reset day, hour and timezone, the weekly token totals, and whether to keep history. History is a list of usage snapshots in `localStorage`. A new one is saved when the usage figure changes, or when the last one is ten minutes old. The list clears at the start of each cycle and is never synced between devices.

Keys: left and right arrows change usage by 1 (hold Shift for 5), `A` toggles AUTO, `P` switches plan, `S` opens settings, `C` copies a status summary and `Esc` closes the drawer.

The URL hash mirrors the state, as in `#u=13&p=20x&h=23`. Bookmark it or send it to someone to share a scenario. `a=1` replaces `h` when AUTO is on.

## Chrome extension

The extension in `extension/` reads your usage from claude.ai/settings/usage and passes it to the calculator, so you do not type it in. A hint beside the AUTO switch says when the last reading arrived. The calculator ignores a reading older than two hours.

To install it:

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and pick the `extension/` folder.
4. Open claude.ai/settings/usage once.

After that the extension checks every 30 minutes. If its last reading is stale, it opens the usage page in a background tab and closes the tab after 8 seconds.

It passes readings only to calculator pages on github.io, such as the demo above. A local copy of `index.html` does not receive them. If you host your own copy, name the repository `claude-usage-calc`.

The script that reads claude.ai runs only on the usage page, and the extension's code makes no network requests. It reads the session, weekly all-models, Sonnet-only and Claude Design percentages and your plan. The calculator uses the weekly all-models figure and the plan. If Anthropic relabels sections on that page, the parser breaks, and the fix is in `parse.js` and the copy inlined in `content_scrape.js`.

## Live feed

If a `live.json` sits next to `index.html`, the calculator reads usage, plan and reset time from it and runs itself. The sliders stay on screen but are locked, and elapsed time comes from the reset time in the feed instead of the settings. Without a feed, which is the case on GitHub Pages, the request 404s and the sliders stay in charge.

```json
{
  "ok": true,
  "plan": "20x",
  "capturedAt": 1786384800000,
  "weeklyAll": { "pct": 40.0, "resetsAt": "2026-08-13T19:00:00Z" },
  "fable":     { "pct": 35.0, "resetsAt": "2026-08-13T19:00:00Z" }
}
```

`ok` must be true and `weeklyAll` must carry a `pct`. `fable` is optional. When it is present, the FABLE switch measures against that window instead. To read a feed from another origin, set `localStorage.cmuc_live_url` to its address. If the feed misses two polls in a row, the page goes back to the system clock for elapsed time instead of freezing on the last reading.

## How it is built

Everything is in `index.html`: the markup, the styles and the script, with no framework or bundler. The only outside request is for two fonts from Google Fonts. The extension is a separate Manifest V3 folder. To host the page, publish `index.html` on GitHub Pages or any static host.

One file means it can sit on any static host or open from disk. Colours are CSS variables, and dark mode follows the operating system with no script involved. Every `localStorage` call is wrapped, so a browser that blocks storage, such as a private window, still runs the page. It just forgets things. A feed that misses one poll still counts as up, because a single blip should not throw away a good reading. It takes two misses in a row.

### The maths

```
linear pace      = hours elapsed / 168 x 100
projected use    = usage / hours elapsed x 168
surplus          = linear pace - usage
hours to limit   = (100 - usage) / (usage / hours elapsed)
burn rate        = plan tokens x usage / 100 / hours elapsed      (MTok per hour)
```

All of these assume the burn rate stays constant, so read them as a snapshot and not a forecast. The recent burn rate, from the last two hours of history, is closer to now.

## Contributing

Bug reports and pull requests are welcome. Please keep it a single file with no dependencies, and open an issue before anything large.

## License

MIT. See [LICENSE](LICENSE).
