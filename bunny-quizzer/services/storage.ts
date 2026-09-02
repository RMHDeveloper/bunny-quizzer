import { PlayerStats, HistoryEntry } from "../types";

const KEY = "bunny-quizzer-v1";

interface Store {
  xp: number;
  history: HistoryEntry[];
  qotd: Record<string, number>; // date (YYYY-MM-DD) -> best score %
}

const EMPTY: Store = { xp: 0, history: [], qotd: {} };

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    return {
      xp: typeof parsed.xp === "number" ? parsed.xp : 0,
      history: Array.isArray(parsed.history) ? parsed.history : [],
      qotd: parsed.qotd && typeof parsed.qotd === "object" ? parsed.qotd : {},
    };
  } catch {
    return { ...EMPTY };
  }
}

function write(store: Store): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* private mode / quota / disabled - ignore */
  }
}

const TITLES = [
  "Baby Bunny",
  "Curious Bunny",
  "Smart Bunny",
  "Clever Bunny",
  "Quick Bunny",
  "Wise Bunny",
  "Brainy Bunny",
  "Genius Bunny",
  "Professor Bunny",
  "Legend Bunny",
];

export function levelFromXp(xp: number): PlayerStats {
  let level = 1;
  let need = 100;
  let acc = 0;
  while (xp >= acc + need) {
    acc += need;
    level += 1;
    need += 50;
  }
  return {
    xp,
    level,
    title: TITLES[Math.min(level - 1, TITLES.length - 1)],
    levelXp: xp - acc,
    levelNeed: need,
  };
}

export function getStats(): PlayerStats {
  return levelFromXp(read().xp);
}

export function addXp(amount: number): PlayerStats {
  const store = read();
  store.xp = Math.max(0, store.xp + Math.round(amount));
  write(store);
  return levelFromXp(store.xp);
}

export function addHistory(entry: Omit<HistoryEntry, "date">): void {
  const store = read();
  store.history.unshift({ ...entry, date: new Date().toISOString() });
  store.history = store.history.slice(0, 50);
  write(store);
}

export function getHistory(): HistoryEntry[] {
  return read().history;
}

export function getQotdBest(dateKey: string): number | null {
  const value = read().qotd[dateKey];
  return typeof value === "number" ? value : null;
}

export function setQotdBest(dateKey: string, scorePct: number): void {
  const store = read();
  const current = store.qotd[dateKey];
  if (typeof current !== "number" || scorePct > current) {
    store.qotd[dateKey] = scorePct;
    write(store);
  }
}
