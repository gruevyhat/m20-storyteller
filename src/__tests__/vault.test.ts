import { describe, expect, it } from 'vitest';
import { VAULT, VAULT_KINDS, filterVault, toSheetWonder } from '../wonders/catalog';
import { checkWonder, pointRange } from '../wonders/types';

describe('Vault', () => {
  it('follows the Wonder rules for every entry', () => {
    const problems = VAULT.flatMap((w) => checkWonder(w).map((p) => `${w.name}: ${p}`));
    expect(problems).toEqual([]);
  });

  it('has unique ids and every kind', () => {
    expect(new Set(VAULT.map((w) => w.id)).size).toBe(VAULT.length);
    for (const k of VAULT_KINDS) expect(VAULT.some((w) => w.kind === k), k).toBe(true);
    expect(VAULT.length).toBeGreaterThanOrEqual(50);
  });

  it('has no two Wonders doing the same thing', () => {
    const words = (s: string) => new Set(s.toLowerCase().match(/[a-z]{4,}/g) ?? []);
    const texts = VAULT.map((w) => ({ name: w.name, words: words(w.powers.map((p) => p.text).join(' ')) })).filter((t) => t.words.size);
    const close: string[] = [];
    for (let i = 0; i < texts.length; i++)
      for (let j = i + 1; j < texts.length; j++) {
        const [a, b] = [texts[i].words, texts[j].words];
        const shared = [...a].filter((x) => b.has(x)).length;
        if (shared / Math.min(a.size, b.size) > 0.5) close.push(`${texts[i].name} ~ ${texts[j].name}`);
      }
    expect(close).toEqual([]);
  });

  it('borrows no sample Wonder or example item from the M20 books', () => {
    // Named sample Wonders in M20, Book of Secrets and Technocracy Reloaded, and the example items
    // the Wonder rules text uses to illustrate each kind.
    const fromBooks = [
      /bafflejack|trushades|hoodie|falconi|vdas|hardsuit|ddgr|thunderglove|madness grenade|rebooter|kismet|bindi|ginger|wolf-paw|totem tattoo|specm/,
      /omni-?badge|black suit|parkour|pocket drone|taser|fun house|mimetic|sleepteacher|zipper|finger guns|primium/,
      /sleep-?dust|silent (shoes|sneakers)|flaming sword|hunger drum|tornado|gourd|grave-?dust|wolf-?(skin|pelt)|microfusion|jetpack|bulletproof|consecrated dagger/,
    ];
    const hits = VAULT.filter((w) => fromBooks.some((re) => re.test(`${w.name} ${w.look} ${w.powers.map((p) => p.text).join(' ')}`.toLowerCase())));
    expect(hits.map((w) => w.name)).toEqual([]);
  });

  it('prices by the book', () => {
    expect(pointRange('Talisman', 3)).toEqual([7, 9]);
    expect(pointRange('Talisman', 4, 5)).toEqual([11, 13]);
    expect(pointRange('Charm', 3)).toEqual([4, 5]);
    expect(pointRange('Trinket', 3)).toEqual([3, 3]);
  });

  it('catches broken entries', () => {
    const bad = { ...VAULT.find((w) => w.kind === 'Talisman')!, rating: 5, arete: 9, quintessence: 99 };
    expect(checkWonder(bad).length).toBeGreaterThan(1);
  });

  it('filters by kind, paradigm, Sphere and text', () => {
    expect(filterVault({ kind: 'Fetish' }).every((w) => w.kind === 'Fetish')).toBe(true);
    expect(filterVault({ paradigm: 'tech' }).every((w) => w.paradigm !== 'mystic')).toBe(true);
    expect(filterVault({ sphere: 'Time' }).every((w) => w.spheres.includes('Time'))).toBe(true);
    expect(filterVault({ query: 'astrolabe' }).map((w) => w.id)).toEqual(['the-starwright-s-astrolabe']);
  });

  it('turns into a sheet Wonder', () => {
    const w = toSheetWonder(VAULT.find((x) => x.id === 'the-starwright-s-astrolabe')!);
    expect(w).toMatchObject({ kind: 'Talisman', rating: 3, arete: 4, quintessence: 15, quintessenceMax: 15 });
    expect(w.powers).toContain('Correspondence 3');
  });
});
