// A character-level Markov chain for names. Order 3 with back-off to shorter contexts, so it stays
// plausible on small lists without just repeating them; generated names that already exist in the
// training list are rejected.
import { rngFromSeed, type Random } from '../fortune/random';
import { CORPORA, type Corpus } from './corpora';

const START = '\u0002';
const END = '\u0003';

export class MarkovNames {
  private tables: Map<string, Map<string, number>>[] = [];
  private known: Set<string>;
  private minLen: number;
  private maxLen: number;

  constructor(
    words: string[],
    private order = 3,
    private gaelic = false,
  ) {
    this.known = new Set(words.map((w) => w.toLowerCase()));
    const lens = words.map((w) => w.length);
    // Very short outputs are usually fragments, so ask for at least four letters.
    this.minLen = Math.max(4, Math.min(...lens));
    this.maxLen = Math.max(...lens) + 1;
    for (let k = 1; k <= order; k++) {
      const table = new Map<string, Map<string, number>>();
      for (const w of words) {
        const s = START.repeat(k) + w.toLowerCase() + END;
        for (let i = k; i < s.length; i++) {
          const ctx = s.slice(i - k, i);
          const next = s[i];
          const row = table.get(ctx) ?? new Map<string, number>();
          row.set(next, (row.get(next) ?? 0) + 1);
          table.set(ctx, row);
        }
      }
      this.tables[k] = table;
    }
  }

  private nextChar(history: string, rng: Random) {
    // Now and then use a shorter context, which mixes the training names more freely.
    const top = this.order > 2 && rng.next() < 0.3 ? this.order - 1 : this.order;
    for (let k = top; k >= 1; k--) {
      const ctx = (START.repeat(k) + history).slice(-k);
      const row = this.tables[k].get(ctx);
      if (row) {
        const entries = [...row.entries()];
        return rng.weighted(entries, ([, n]) => n)[0];
      }
    }
    return END;
  }

  /** One new name, or null if nothing new turned up in `tries` attempts. */
  generate(rng: Random, tries = 40): string | null {
    for (let t = 0; t < tries; t++) {
      let out = '';
      while (out.length <= this.maxLen) {
        const ch = this.nextChar(out, rng);
        if (ch === END) break;
        out += ch;
      }
      if (out.length < this.minLen || out.length > this.maxLen) continue;
      if (this.known.has(out)) continue;
      if (/['\s-]$|^['\s-]|['\s-]{2}/.test(out)) continue;
      // Reject stutters like "mamama" or "kkk".
      if (/(\p{L})\1\1|(\p{L}{2})\2\2/u.test(out)) continue;
      return titleCase(out, this.gaelic);
    }
    return null;
  }
}

function titleCase(s: string, gaelic: boolean) {
  // Capitalize each part, the letter after O'/D', and (in Scots names) the letter after Mc/Mac.
  return s
    .split(/([\s-])/)
    .map((part) => {
      let p = part.replace(/^(\p{L})/u, (c) => c.toUpperCase()).replace(/^([OD]')(\p{L})/u, (_, a, c) => a + c.toUpperCase());
      if (gaelic) p = p.replace(/^(Ma?c)(\p{L})/u, (_, a, c) => a + c.toUpperCase());
      return p;
    })
    .join('');
}

const models = new Map<string, { given: MarkovNames; family: MarkovNames }>();
function modelFor(c: Corpus) {
  let m = models.get(c.key);
  if (!m) {
    m = { given: new MarkovNames(c.given), family: new MarkovNames(c.family, 3, c.key === 'british' || c.key === 'irish') };
    models.set(c.key, m);
  }
  return m;
}

export const NAME_STYLES = CORPORA.map((c) => ({ key: c.key, label: c.label }));

/** "Any tradition" favours English-language names: together about 40% of picks. */
const ANY_WEIGHT: Record<string, number> = { british: 4, american: 3, irish: 2 };

/** A full name in one tradition ("any" picks one at random). Deterministic for a given Random. */
export function randomName(rng: Random, style = 'any'): string {
  const corpus = CORPORA.find((c) => c.key === style) ?? rng.weighted(CORPORA, (c) => ANY_WEIGHT[c.key] ?? 1);
  const m = modelFor(corpus);
  const given = m.given.generate(rng) ?? rng.pick(corpus.given);
  let family = m.family.generate(rng) ?? rng.pick(corpus.family);
  if (corpus.particles && rng.next() < corpus.particles.chance) family = `${rng.pick(corpus.particles.list)} ${family}`;
  // Japanese names are written family name first.
  return corpus.key === 'japanese' ? `${family} ${given}` : `${given} ${family}`;
}

/** A name from crypto randomness, for the "random name" button. */
export function freshName(style = 'any') {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return randomName(rngFromSeed(`name:${a[0]}`), style);
}
