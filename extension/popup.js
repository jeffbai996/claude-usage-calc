// Popup logic — read latest snapshot, render, wire refresh button.
// All DOM construction uses createElement (no innerHTML — XSS-safe).

const $ = (id) => document.getElementById(id);

function bucket(pct) {
  if (pct == null) return '';
  if (pct >= 90) return 'high';
  if (pct >= 70) return 'mid';
  return 'low';
}

function makeRow(label, metric) {
  const row = document.createElement('div');
  row.className = 'row';

  const left = document.createElement('span');
  left.className = 'label';
  left.appendChild(document.createTextNode(label));
  if (metric.resets) {
    const reset = document.createElement('span');
    reset.className = 'reset';
    reset.textContent = metric.resets;
    left.appendChild(reset);
  }

  const right = document.createElement('span');
  right.className = 'val pct ' + bucket(metric.pct);
  right.textContent = metric.pct + '%';

  row.appendChild(left);
  row.appendChild(right);
  return row;
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function relTime(ts) {
  if (!ts) return 'no data yet';
  const sec = Math.round((Date.now() - ts) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  return `${hr}h ago`;
}

function renderEmpty() {
  const c = $('content');
  clear(c);
  const div = document.createElement('div');
  div.className = 'empty';
  div.appendChild(document.createTextNode('No data yet — open '));
  const a = document.createElement('a');
  a.href = 'https://claude.ai/settings/usage';
  a.target = '_blank';
  a.textContent = 'claude.ai/settings/usage';
  div.appendChild(a);
  div.appendChild(document.createTextNode(' once.'));
  c.appendChild(div);
  $('plan').textContent = '—';
  $('updated').textContent = '';
}

function render(snap) {
  if (!snap) return renderEmpty();
  $('plan').textContent = snap.plan || '—';

  const c = $('content');
  clear(c);
  if (snap.session) c.appendChild(makeRow('Session', snap.session));
  if (snap.weeklyAll) c.appendChild(makeRow('Weekly · all', snap.weeklyAll));
  if (snap.weeklySonnet) c.appendChild(makeRow('Weekly · Sonnet', snap.weeklySonnet));
  if (snap.design && snap.design.pct > 0) c.appendChild(makeRow('Design', snap.design));

  $('updated').textContent = relTime(snap.capturedAt);
}

function load() {
  chrome.runtime.sendMessage({ type: 'request_snapshot' }, (resp) => {
    render(resp?.snap || null);
  });
}

$('refresh').addEventListener('click', () => {
  $('refresh').textContent = 'opening...';
  chrome.runtime.sendMessage({ type: 'force_refresh' }, () => {
    setTimeout(() => {
      $('refresh').textContent = 'refresh';
      load();
    }, 4000);
  });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'snapshot_update') render(msg.snap);
});

load();
