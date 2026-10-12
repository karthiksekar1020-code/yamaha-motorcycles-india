/** Edit distance, capped: returns early once it is clear the words differ by more than `max`. */
function within(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (Math.min(...cur) > max) return false;
    prev = cur;
  }
  return prev[b.length]! <= max;
}

/**
 * City match that forgives typos and spelling variants (so "pondicerry" finds "Pondicherry"):
 * a substring match, or any word of the city within 2 edits for terms of 5+ letters.
 */
export function cityMatches(city: string, term: string): boolean {
  const c = city.toLowerCase(), t = term.trim().toLowerCase();
  if (!t) return true;
  if (c.includes(t)) return true;
  if (t.length < 5) return false;
  return c.split(/[^a-z]+/).some((w) => w.length >= 4 && within(w, t, 2));
}
