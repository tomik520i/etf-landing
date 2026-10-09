// First-party měření: bez cookies, bez IP. session_id jen v sessionStorage.
export const API_BASE = location.hostname.endsWith('github.io') ? 'https://aijunior.opicebot.cz' : '';

const store = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* ignorovat */ } },
};

function uuid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 3) | 8).toString(16);
  });
}

let sid = store.get('lp_sid');
if (!sid) { sid = uuid(); store.set('lp_sid', sid); }

const params = new URLSearchParams(location.search);
for (const [param, key] of [['ad', 'lp_ad'], ['utm_source', 'lp_utm_source'], ['utm_campaign', 'lp_utm_campaign']]) {
  const v = params.get(param);
  if (v) store.set(key, v.slice(0, 100));
}

/** Kontext návštěvy (varianta reklamy, UTM) – použije i formulář. */
export function getContext() {
  const ad = store.get('lp_ad');
  return {
    ad_variant: ad === 'a' || ad === 'b' ? ad : null,
    utm_source: store.get('lp_utm_source'),
    utm_campaign: store.get('lp_utm_campaign'),
  };
}

export function track(event, props = {}) {
  try {
    const payload = { session_id: sid, event, ad_variant: getContext().ad_variant, props };
    const body = new Blob([JSON.stringify(payload)], { type: 'text/plain' });
    if (navigator.sendBeacon) navigator.sendBeacon(API_BASE + '/api/event.php', body);
    else fetch(API_BASE + '/api/event.php', { method: 'POST', body, keepalive: true }).catch(() => {});
  } catch { /* měření nesmí rozbít stránku */ }
}

window.track = track;
