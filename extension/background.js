// Background service worker.
// - Receives usage snapshots from content_scrape.js
// - Persists to chrome.storage.local
// - Pushes to any open calc tabs (content_bridge.js)
// - Alarm-driven: every 30 min, opens claude.ai/settings/usage in a background
//   tab if no fresh snapshot exists, lets the content script scrape, closes it.

const STORAGE_KEY = 'latest_snapshot';
const REFRESH_MIN = 30; // minutes
const STALE_MS = 30 * 60 * 1000; // 30 min

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('refresh_usage', {
    delayInMinutes: 1,
    periodInMinutes: REFRESH_MIN,
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'refresh_usage') maybeRefresh();
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'usage_snapshot' && msg.snap) {
    persistSnapshot(msg.snap).then(() => sendResponse({ ok: true }));
    return true; // async response
  }
  if (msg?.type === 'request_snapshot') {
    chrome.storage.local.get(STORAGE_KEY).then((r) => {
      sendResponse({ snap: r[STORAGE_KEY] || null });
    });
    return true;
  }
  if (msg?.type === 'force_refresh') {
    openScrapeTab().then(() => sendResponse({ ok: true }));
    return true;
  }
});

async function persistSnapshot(snap) {
  await chrome.storage.local.set({ [STORAGE_KEY]: snap });
  // Push to any open calc tabs.
  const tabs = await chrome.tabs.query({
    url: ['https://*.github.io/claude-usage-calc/*', 'https://jeffbai996.github.io/*'],
  });
  for (const t of tabs) {
    try {
      await chrome.tabs.sendMessage(t.id, { type: 'snapshot_update', snap });
    } catch (_) {
      // Tab might not have the bridge script ready yet — fine.
    }
  }
}

async function maybeRefresh() {
  const r = await chrome.storage.local.get(STORAGE_KEY);
  const snap = r[STORAGE_KEY];
  const fresh = snap && Date.now() - snap.capturedAt < STALE_MS;
  if (fresh) return;

  // If user already has the usage page open, the content script will
  // re-snapshot on its 60s interval — no need to open a new tab.
  const existing = await chrome.tabs.query({
    url: 'https://claude.ai/settings/usage*',
  });
  if (existing.length > 0) return;

  await openScrapeTab();
}

async function openScrapeTab() {
  // Open in background, let content script scrape, close after 8s.
  const tab = await chrome.tabs.create({
    url: 'https://claude.ai/settings/usage',
    active: false,
  });
  setTimeout(() => {
    chrome.tabs.remove(tab.id).catch(() => {});
  }, 8000);
}
