const STORAGE_KEY = 'no-limits:selectedDateISO';

export function formatLocalISODate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getStoredSelectedDateISO(): string | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (!v) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
    return v;
  } catch {
    return null;
  }
}

export function setStoredSelectedDateISO(value: string) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

export function getEffectiveSelectedDateISO(fallbackISO?: string): string {
  return getStoredSelectedDateISO() ?? fallbackISO ?? formatLocalISODate();
}


