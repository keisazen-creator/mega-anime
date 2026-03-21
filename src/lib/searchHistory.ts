const HISTORY_KEY = "otaku_search_history";
const MAX_ITEMS = 12;

export function getSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addSearchHistory(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  const list = getSearchHistory().filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
  list.unshift(trimmed);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
}

export function removeSearchHistoryItem(query: string) {
  const list = getSearchHistory().filter((q) => q !== query);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

export function clearSearchHistory() {
  localStorage.removeItem(HISTORY_KEY);
}
