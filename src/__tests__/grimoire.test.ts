import { describe, expect, it } from 'vitest';
import { SPHERES, type Sphere } from '../model/types';
import { EFFECTS, MODIFIERS } from '../grimoire/effects';
import { INFLUENCES } from '../grimoire/influences';
import { CATALOG_SIZE, buildCatalog, castableBy, conjure, makeRote, mergeReqs, roteText } from '../grimoire/generate';

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

describe('building blocks', () => {
  it('keeps every Sphere rank between 1 and 5', () => {
    for (const x of [...EFFECTS, ...MODIFIERS]) for (const n of Object.values(x.spheres)) expect(n).toBeGreaterThanOrEqual(1), expect(n).toBeLessThanOrEqual(5);
    expect(new Set(EFFECTS.map((e) => e.id)).size).toBe(EFFECTS.length);
  });

  it('never uses a denied name or line anywhere in its word lists', () => {
    const text = JSON.stringify([EFFECTS, MODIFIERS, INFLUENCES]).toLowerCase();
    for (const d of DENY) expect(text, d).not.toContain(d);
  });
});

describe('catalog', () => {
  it('has the full size, unique names and stable ids', () => {
    expect(catalog).toHaveLength(CATALOG_SIZE);
    expect(new Set(catalog.map((r) => r.name)).size).toBe(CATALOG_SIZE);
    expect(buildCatalog().map((r) => r.id + r.name)).toEqual(catalog.map((r) => r.id + r.name));
  });

  it('follows M20 casting rules', () => {
    for (const r of catalog) {
      const eff = EFFECTS.find((e) => e.id === r.effect)!;
      const mods = r.modifiers.map((id) => MODIFIERS.find((m) => m.id === id)!);
      expect(r.spheres).toEqual(mergeReqs(eff.spheres, ...mods.map((m) => m.spheres)));
      const hi = Math.max(...Object.values(r.spheres).map((n) => n ?? 0));
      expect(r.highest).toBe(hi);
      expect(hi).toBeLessThanOrEqual(5);
      expect(r.successes).toBeGreaterThanOrEqual(1);
      if (r.mode !== 'vulgar') expect(r.difficulty.coincidental).toBe(hi + 3);
      if (r.mode !== 'coincidental') expect(r.difficulty.vulgar).toBe(hi + 4);
      for (const d of Object.values(r.difficulty).filter((v) => v !== undefined)) expect(d).toBeGreaterThanOrEqual(3), expect(d).toBeLessThanOrEqual(10);
      for (const m of mods) {
        expect(m.allows).toContain(eff.target);
        if (m.harmOnly) expect(eff.harm).toBe(true);
      }
    }
  });

  it('spreads across influences and lets every Sphere lead', () => {
    for (const inf of INFLUENCES) expect(catalog.filter((r) => r.influence === inf.key).length).toBe(CATALOG_SIZE / INFLUENCES.length);
    for (const s of SPHERES) {
      expect(catalog.some((r) => (r.spheres[s] ?? 0) === r.highest), s).toBe(true);
    }
    expect(catalog.some((r) => r.modifiers.length === 2)).toBe(true);
  });

  it('never uses a denied name or line in generated text', () => {
    const text = catalog.map((r) => `${r.name} ${roteText(r)} ${r.quote}`).join('\n').toLowerCase();
    for (const d of DENY) expect(text, d).not.toContain(d);
  });

  it('reads cleanly', () => {
    for (const r of catalog) {
      const t = `${r.name}. ${roteText(r)} ${r.quote}`;
      expect(t, r.id).not.toMatch(/ {2}|\.\.(?!\.)|,,|\s[,.]|\{|\}|undefined|\ba [aeiou]\w|\ban (?!hour|honest)[b-df-hj-np-tv-z]\w/i);
      expect(r.description, r.id).toMatch(/^[A-Z]/);
      expect(r.name, r.id).toMatch(/^[A-Z]/);
      expect(r.name, r.id).not.toMatch(/s's\b/);
      expect(r.description, r.id).not.toMatch(/\b(his|her|she|he)\b/);
      for (const s of r.system) expect(s, r.id).toMatch(/^[A-Z][\s\S]*[.)]$/);
    }
  });
});

describe('helpers', () => {
  it('conjures fresh, reproducible handfuls', () => {
    expect(conjure('abc').map((r) => r.name)).toEqual(conjure('abc').map((r) => r.name));
    expect(conjure('abc')).toHaveLength(12);
    expect(makeRote('x', { influence: 'outer' }).influence).toBe('outer');
  });

  it('checks castability against a character', () => {
    const r = catalog.find((x) => x.spheres.Life === 3 && Object.keys(x.spheres).length === 1)!;
    expect(castableBy(r, { Life: 3 } as Partial<Record<Sphere, number>>)).toBe(true);
    expect(castableBy(r, { Life: 2 })).toBe(false);
  });
});
