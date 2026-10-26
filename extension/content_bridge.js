// Content script: runs on the calculator page.
// Writes the latest snapshot to window.localStorage under 'cmuc_extension_snap'
// so index.html can consume it. Also dispatches a 'cmuc-extension-snap'
// CustomEvent for live updates without page reload.

(function () {
  'use strict';

  const KEY = 'cmuc_extension_snap';

  function publish(snap) {
    if (!snap) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(snap));
      window.dispatchEvent(new CustomEvent('cmuc-extension-snap', { detail: snap }));
    } catch (_) {}
  }

  // Push current snapshot on load.
  chrome.runtime.sendMessage({ type: 'request_snapshot' }, (resp) => {
    if (resp?.snap) publish(resp.snap);
  });

  // Listen for live updates from background worker.
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === 'snapshot_update' && msg.snap) publish(msg.snap);
  });
})();
