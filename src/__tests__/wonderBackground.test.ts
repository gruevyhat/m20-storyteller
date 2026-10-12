import { describe, expect, it } from 'vitest';
import { blankBuild, buildCharacter } from '../model/creation';
import { readFortune } from '../fortune/build';
import { blankCharacter, type Character } from '../model/types';
import { VAULT } from '../wonders/catalog';
import { backgroundCandidates, paradigmFor, redrawBackgroundWonder, syncWonderBackground, wonderBackgroundRating } from '../wonders/background';

const withWonder = (rating: number, affiliation = 'Verbena (Traditions)'): Character => {
  const c = blankCharacter();
  c.affiliation = affiliation;
  c.abilities.backgrounds = rating ? [{ name: 'Wonder', rating }] : [];
  return c;
};
const drawn = (c: Character) => (c.wonders ?? []).filter((w) => w.fromBackground);

describe('Wonder Background', () => {
  it('has lasting Wonders of every rating for mystic and technological characters', () => {
    for (const p of ['mystic', 'tech'] as const)
      for (let r = 1; r <= 5; r++) {
        const pool = backgroundCandidates(r, p);
        expect(pool.length, `${p} ${r}`).toBeGreaterThan(0);
        expect(pool.every((w) => w.rating === r && w.kind !== 'Charm' && w.kind !== 'Gadget')).toBe(true);
      }
  });

  it('draws a Wonder of the Background’s rating, in the character’s paradigm', () => {
    for (let r = 1; r <= 5; r++) {
      const c = syncWonderBackground(null, withWonder(r, 'Iteration X (Technocracy)'));
      expect(drawn(c)).toHaveLength(1);
      expect(drawn(c)[0].rating).toBe(r);
      const source = VAULT.find((w) => w.name === drawn(c)[0].name)!;
      expect(source.paradigm).not.toBe('mystic');
    }
    expect(paradigmFor({ affiliation: 'Society of Ether (Traditions)' })).toBe('tech');
    expect(paradigmFor({ affiliation: 'Dreamspeakers (Traditions)' })).toBe('mystic');
  });

  it('follows the rating up and down, and leaves it alone otherwise', () => {
    const one = syncWonderBackground(null, withWonder(2));
    const same = syncWonderBackground(one, { ...one, notes: 'edited' });
    expect(same.wonders).toBe(one.wonders);
    const raised = syncWonderBackground(one, { ...one, abilities: { ...one.abilities, backgrounds: [{ name: 'Wonder', rating: 4 }] } });
    expect(drawn(raised).map((w) => w.rating)).toEqual([4]);
    const dropped = syncWonderBackground(raised, { ...raised, abilities: { ...raised.abilities, backgrounds: [] } });
    expect(drawn(dropped)).toEqual([]);
    expect(wonderBackgroundRating(dropped)).toBe(0);
  });

  it('keeps Wonders the player wrote themselves and draws none over them', () => {
    const own = { ...withWonder(0), wonders: [{ name: 'Grandad’s Compass', kind: 'Talisman' as const, rating: 3, powers: '' }] };
    const c = syncWonderBackground(own, { ...own, abilities: { ...own.abilities, backgrounds: [{ name: 'Wonder', rating: 3 }] } });
    expect(c.wonders).toEqual(own.wonders);
    const raised = syncWonderBackground(withWonder(2), withWonder(3));
    expect(drawn(raised)).toHaveLength(1);
  });

  it('redraws a different Wonder of the same rating', () => {
    const c = syncWonderBackground(null, withWonder(3));
    const again = redrawBackgroundWonder(c);
    expect(drawn(again)).toHaveLength(1);
    expect(drawn(again)[0].rating).toBe(3);
    expect(drawn(again)[0].name).not.toBe(drawn(c)[0].name);
  });

  it('gives guided creation a Wonder that stays put while the build is edited', () => {
    const b = { ...blankBuild(), name: 'Ines', faction: 'Verbena', backgrounds: { Wonder: 2 } };
    const first = buildCharacter(b);
    expect(drawn(first).map((w) => w.rating)).toEqual([2]);
    expect(drawn(buildCharacter({ ...b, concept: 'Nurse' }))[0].name).toBe(drawn(first)[0].name);
  });

  it('gives Fortune readings a Wonder that the seed reproduces', () => {
    const seeds = Array.from({ length: 300 }, (_, i) => `w${i}`);
    const seed = seeds.find((s) => wonderBackgroundRating(readFortune(s).character) > 0)!;
    expect(seed).toBeDefined();
    const a = readFortune(seed).character;
    expect(drawn(a)).toHaveLength(1);
    expect(drawn(a)[0].rating).toBe(wonderBackgroundRating(a));
    expect(drawn(readFortune(seed).character)[0].name).toBe(drawn(a)[0].name);
    expect(readFortune(seed).lines.flatMap((l) => l.effects).join(' ')).toContain(`Wonder: ${drawn(a)[0].name}`);
  });
});
