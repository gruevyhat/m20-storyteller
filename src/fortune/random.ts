// Seeded randomness so a reading can be shared as a short seed and reproduced exactly.

/** xmur3 string hash → 32-bit seed. */
function hash(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** mulberry32 */
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Random {
  next(): number;
  int(n: number): number;
  pick<T>(xs: readonly T[]): T;
  sample<T>(xs: readonly T[], n: number): T[];
  shuffle<T>(xs: readonly T[]): T[];
  weighted<T>(xs: readonly T[], weight: (x: T) => number): T;
}

export function rngFromSeed(seed: string): Random {
  const next = mulberry32(hash(seed));
  const int = (n: number) => Math.floor(next() * n);
  const shuffle = <T,>(xs: readonly T[]) => {
    const a = [...xs];
    for (let i = a.length - 1; i > 0; i--) {
      const j = int(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  return {
    next,
    int,
    pick: (xs) => xs[int(xs.length)],
    sample: (xs, n) => shuffle(xs).slice(0, n),
    shuffle,
    weighted: (xs, weight) => {
      const ws = xs.map((x) => Math.max(0, weight(x)));
      const total = ws.reduce((s, w) => s + w, 0);
      if (total <= 0) return xs[int(xs.length)];
      let r = next() * total;
      for (let i = 0; i < xs.length; i++) {
        r -= ws[i];
        if (r < 0) return xs[i];
      }
      return xs[xs.length - 1];
    },
  };
}
