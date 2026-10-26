// Content script: runs on https://claude.ai/settings/usage*
// Reads document.body.innerText, parses, ships to background worker.
// Runs once on load + on a 60s interval (the page itself is mostly static
// once rendered; the background worker also handles periodic refresh by
// reopening this tab if needed).

(function () {
  'use strict';

  // Inline parser (manifest content_scripts can't import modules).
  function parseUsagePage(rawText) {
    const text = (rawText || '').replace(/\r/g, '');
    const after = text.split('Plan usage limits')[1] || text;

    const grab = (label) => {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(
        escaped + '\\s*\\n+([^\\n]*?)\\n+(\\d+(?:\\.\\d+)?)\\s*%\\s*used',
        'i'
      );
      const m = after.match(re);
      if (!m) return null;
      return { resets: m[1].trim(), pct: parseFloat(m[2]) };
    };

    const planMatch = after.match(/Max\s*\((\d+x)\)/i);

    return {
      capturedAt: Date.now(),
      plan: planMatch ? planMatch[1] : null,
      session: grab('Current session'),
      weeklyAll: grab('All models'),
      weeklySonnet: grab('Sonnet only'),
      design: grab('Claude Design'),
    };
  }

  function snapshot() {
    try {
      const snap = parseUsagePage(document.body.innerText);
      // Only ship if at least one weekly metric parsed — otherwise the page
      // is still loading or layout changed.
      if (!snap.weeklyAll && !snap.weeklySonnet && !snap.session) return;
      chrome.runtime.sendMessage({ type: 'usage_snapshot', snap });
    } catch (e) {
      // Silent — no point spamming console on a settings page.
    }
  }

  // Wait for the React tree to settle before first read.
  const initial = setTimeout(snapshot, 1500);

  // Re-read every 60s in case user leaves tab open.
  const poll = setInterval(snapshot, 60_000);

  // Re-read when tab regains focus.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') snapshot();
  });

  window.addEventListener('unload', () => {
    clearTimeout(initial);
    clearInterval(poll);
  });
})();
