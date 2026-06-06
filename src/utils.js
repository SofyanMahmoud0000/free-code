export function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const storage = {
  get: (key, fallback = null) => {
    const val = localStorage.getItem(key);
    return val !== null ? val : fallback;
  },
  getJSON: (key, fallback = null) => {
    const val = localStorage.getItem(key);
    if (val === null) return fallback;
    try { return JSON.parse(val); } catch { return fallback; }
  },
  set: (key, value) => localStorage.setItem(key, String(value)),
  setJSON: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  remove: (key) => localStorage.removeItem(key),
};
