// Parses the rendered text of claude.ai/settings/usage into a structured snapshot.
// The page shows sections like:
//   "Current session\n\nResets in 2 hr 8 min\n\n11% used"
//   "All models\n\nResets Thu 12:00 PM\n\n29% used"
//   "Sonnet only\n\nResets Thu 1:00 PM\n\n4% used"
// Order and labels are stable as of v0.1; if Anthropic changes them, this is
// the only file that needs updating.

export function parseUsagePage(rawText) {
  const text = (rawText || '').replace(/\r/g, '');
  const after = text.split('Plan usage limits')[1] || text;

  const grab = (label) => {
    // Match: "<label>\n\n<resets line>\n\n<pct>% used"
    // Tolerant of one-or-more blank lines between fields.
    const re = new RegExp(
      escape(label) +
        '\\s*\\n+([^\\n]*?)\\n+(\\d+(?:\\.\\d+)?)\\s*%\\s*used',
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

function escape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
