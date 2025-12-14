const STORAGE_KEY = "planilha_financeira_mes";

// Estrutura: { [yearMonth]: { rows: [...] } }

function safeParse(json, fallback) {
  try {
    const value = JSON.parse(json);
    return value && typeof value === "object" ? value : fallback;
  } catch {
    return fallback;
  }
}

function loadAll() {
  if (typeof localStorage === "undefined") {
    return {};
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  return safeParse(raw, {});
}

function saveAll(data) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadMonthData(yearMonth) {
  const all = loadAll();
  return all[yearMonth] || { rows: [] };
}

export function saveMonthData(yearMonth, data) {
  const all = loadAll();
  all[yearMonth] = data;
  saveAll(all);
}

export function clearMonthData(yearMonth) {
  const all = loadAll();
  delete all[yearMonth];
  saveAll(all);
}

