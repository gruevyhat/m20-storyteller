import { describe, expect, it } from 'vitest';
import { SPHERES, type Sphere } from '../model/types';
import { INFLUENCES } from '../grimoire/influences';
import { HAND_ROTES } from '../grimoire/rotes';
import { CATALOG_SIZE, buildCatalog, castableBy, conjure, roteText } from '../grimoire/generate';

const catalog = buildCatalog();

// Names, products and famous lines the public site must never contain.
const DENY = [
  'pinhead', 'cenobite', 'lament configuration', 'leviathan', 'hellraiser', 'hellbound',
  'constantine', 'hellblazer', 'chas ', 'papa midnite',
  'agent smith', 'morpheus', 'trinity', 'neo ', 'zion', 'nebuchadnezzar', 'the matrix', 'red pill', 'blue pill', 'white rabbit', 'no spoon', 'free your mind',
  'skynet', 'cyberdyne', 't-800', 't-1000', 't-x', 'terminator', 'sarah connor', 'john connor', "i'll be back", 'judgment day', 'no fate',
  'xenomorph', 'facehugger', 'chestburster', 'weyland', 'yutani', 'nostromo', 'ripley', 'sulaco', 'special order', 'perfect organism', 'hear you scream',
  'cthulhu', "r'lyeh", 'yog-sothoth', 'azathoth', 'nyarlathotep', 'shub-niggurath', 'dagon', 'necronomicon', 'innsmouth', 'arkham', 'miskatonic',
  'jesus wept',
];

describe('catalog', () => {
  it('has a hand for every set of rotes, unique names and stable ids', () => {
    expect(Object.keys(HAND_ROTES).sort()).toEqual(INFLUENCES.map((i) => i.key).sort());
    expect(catalog).toHaveLength(CATALOG_SIZE);
    expect(new Set(catalog.map((r) => r.name)).size).toBe(CATALOG_SIZE);
    expect(new Set(catalog.map((r) => r.id)).size).toBe(CATALOG_SIZE);
    expect(buildCatalog().map((r) => r.id)).toEqual(catalog.map((r) => r.id));
  });

  it('follows M20 casting rules', () => {
    for (const r of catalog) {
      for (const n of Object.values(r.spheres)) expect(n, r.id).toBeGreaterThanOrEqual(1), expect(n, r.id).toBeLessThanOrEqual(5);
      expect(r.highest).toBe(Math.max(...Object.values(r.spheres).map((n) => n ?? 0)));
      expect(r.successes, r.id).toBeGreaterThanOrEqual(1);
      if (r.mode !== 'vulgar') expect(r.difficulty.coincidental).toBe(r.highest + 3), expect(r.cover, r.id).toBeTruthy();
      if (r.mode !== 'coincidental') expect(r.difficulty.vulgar).toBe(r.highest + 4);
      const inf = INFLUENCES.find((i) => i.key === r.influence)!;
      expect(inf.practices, r.id).toContain(r.practice);
    }
  });

  it('gives every hand an equal share and every Sphere rotes at each low rank', () => {
    for (const inf of INFLUENCES) expect(catalog.filter((r) => r.influence === inf.key).length, inf.key).toBe(CATALOG_SIZE / INFLUENCES.length);
    for (const s of SPHERES) {
      expect(catalog.some((r) => (r.spheres[s] ?? 0) === 5), s).toBe(true);
      // A starting mage with one or two dots in a Sphere must have rotes to choose from.
      for (const n of [1, 2, 3]) expect(catalog.filter((r) => Object.keys(r.spheres).length === 1 && r.spheres[s] === n).length, `${s} ${n}`).toBeGreaterThanOrEqual(3);
    }
    expect(catalog.some((r) => Object.keys(r.spheres).length >= 3)).toBe(true);
  });

  it('never uses a denied name or line', () => {
    const text = catalog.map((r) => `${r.name} ${roteText(r)} ${r.quote}`).join('\n').toLowerCase();
    for (const d of DENY) expect(text, d).not.toContain(d);
  });

  it('reads cleanly', () => {
    for (const r of catalog) {
      const t = `${r.name}. ${roteText(r)} ${r.quote}`;
      expect(t, r.id).not.toMatch(/ {2}|\.\.(?!\.)|,,|\s[,.]|\{|\}|undefined|\ba [aeiou]\w|\ban (?!hour|honest)[b-df-hj-np-tv-z]\w/i);
      expect(r.description, r.id).toMatch(/^[A-Z][\s\S]*[.!?]$/);
      expect(r.backlash, r.id).toMatch(/^[A-Z][\s\S]*[.!?]$/);
      expect(r.name, r.id).toMatch(/^[A-Z]/);
      expect(r.name, r.id).not.toMatch(/s's\b/);
      expect(`${r.description} ${r.backlash}`, r.id).not.toMatch(/\b(his|her|she|he|him)\b/);
      for (const s of r.system) expect(s, r.id).toMatch(/^[A-Z][\s\S]*[.)]$/);
    }
  });

  it('never repeats itself', () => {
    const fields = ['description', 'backlash', 'quote', 'cover'] as const;
    for (const f of fields) {
      const vals = catalog.map((r) => r[f]).filter(Boolean);
      expect(vals.length - new Set(vals).size, f).toBe(0);
    }
    expect(new Set(catalog.map((r) => r.system[0])).size).toBe(CATALOG_SIZE);
    // No six-word run shared between any two rotes' prose.
    const seen = new Map<string, string>();
    for (const r of catalog) {
      const words = `${r.description} ${r.backlash} ${r.quote}`.toLowerCase().replace(/[^a-z' ]+/g, ' ').split(/\s+/).filter(Boolean);
      const mine = new Set<string>();
      for (let i = 0; i + 6 <= words.length; i++) mine.add(words.slice(i, i + 6).join(' '));
      for (const g of mine) {
        const other = seen.get(g);
        expect(other, `${r.id} shares "${g}" with ${other}`).toBeUndefined();
        seen.set(g, r.id);
      }
    }
    // No stock opening: at most three descriptions or backlashes begin with the same two words.
    for (const f of ['description', 'backlash'] as const) {
      const starts = new Map<string, number>();
      for (const r of catalog) {
        const k = r[f].split(/\s+/).slice(0, 2).join(' ').toLowerCase();
        starts.set(k, (starts.get(k) ?? 0) + 1);
      }
      for (const [k, n] of starts) expect(n, `${f} "${k}"`).toBeLessThanOrEqual(3);
    }
  });
});

describe('starting rotes', () => {
  it('lean toward the hands that share the character\'s practice', async () => {
    const { startingRotes, handsForPractice } = await import('../fortune/build');
    expect(handsForPractice('Voudoun')).toContain('blood');
    expect(handsForPractice('Hypertech')).toEqual(expect.arrayContaining(['code', 'chrome', 'hive', 'number', 'mesmer']));
    const spheres = { Life: 2, Mind: 2, Entropy: 1, Prime: 1, Correspondence: 2 } as const;
    let preferred = 0;
    let total = 0;
    for (let i = 0; i < 100; i++) {
      for (const { rote } of startingRotes(spheres, `pref${i}`, ['blood'])) {
        total++;
        if (rote.influence === 'blood') preferred++;
      }
    }
    // One hand in nine would be about 11% by chance.
    expect(preferred / total).toBeGreaterThan(0.3);
  });

  it('reach every new hand in character generation', async () => {
    const { readFortune } = await import('../fortune/build');
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) for (const { rote } of readFortune(`hands${i}`).rotes) seen.add(rote.influence);
    for (const k of ['blood', 'number', 'mesmer']) expect(seen, k).toContain(k);
  });
});

describe('helpers', () => {
  it('conjures fresh, reproducible handfuls', () => {
    expect(conjure('abc').map((r) => r.name)).toEqual(conjure('abc').map((r) => r.name));
    expect(conjure('abc')).toHaveLength(12);
    expect(new Set(conjure('abc').map((r) => r.id)).size).toBe(12);
    expect(conjure('abc', 12, 'outer').every((r) => r.influence === 'outer')).toBe(true);
  });

  it('checks castability against a character', () => {
    const r = catalog.find((x) => x.spheres.Life === 3 && Object.keys(x.spheres).length === 1)!;
    expect(castableBy(r, { Life: 3 } as Partial<Record<Sphere, number>>)).toBe(true);
    expect(castableBy(r, { Life: 2 })).toBe(false);
  });
});
