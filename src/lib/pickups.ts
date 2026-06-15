import { foldTr } from "./data";
import { PICKUPS, type Pickup } from "./pickups.data";

export type { Pickup };
export { PICKUPS };

/**
 * Autocomplete over car pickup locations. With no query it returns the full
 * list (so focusing the field shows every airport); otherwise it ranks
 * exact > prefix > word-prefix/substring, diacritic-insensitively.
 */
export function searchPickups(query: string, limit = 8): Pickup[] {
  const q = foldTr(query);
  if (!q) return PICKUPS.slice(0, limit);
  const scored: { p: Pickup; score: number }[] = [];
  for (const p of PICKUPS) {
    const name = foldTr(p.name);
    let score = -1;
    if (name === q) score = 3;
    else if (name.startsWith(q)) score = 2;
    else if (name.split(/\s+/).some((w) => w.startsWith(q)) || name.includes(q))
      score = 1;
    if (score >= 0) scored.push({ p, score });
  }
  // No match (e.g. the pre-filled default) → show the full list so the field
  // is never a dead end.
  if (!scored.length) return PICKUPS.slice(0, limit);
  scored.sort((a, b) => b.score - a.score || b.p.count - a.p.count);
  return scored.slice(0, limit).map((x) => x.p);
}
