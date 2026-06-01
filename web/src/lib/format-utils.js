export function formatDistance(km) {
  if (km == null) return "—";
  return `${km.toFixed(1)} km`;
}

export function formatElevation(m) {
  if (m == null) return "—";
  return `${Math.round(m).toLocaleString()} m`;
}

export function formatDuration(seconds) {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatCalories(cal) {
  if (!cal) return "—";
  return `${Math.round(cal).toLocaleString()} kcal`;
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
