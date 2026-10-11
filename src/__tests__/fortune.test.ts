import { describe, expect, it } from 'vitest';
import { DECK } from '../fortune/deck';
import { deal, readFortune, validate } from '../fortune/build';
import { FACTIONS } from '../fortune/lore';

describe('deck', () => {
  it('has 78 unique cards', () => {
    expect(DECK).toHaveLength(78);
    expect(new Set(DECK.map((c) => c.id)).size).toBe(78);
    expect(DECK.filter((c) => c.arcana === 'major')).toHaveLength(22);
  });
});

describe('deal', () => {
  it('is reproducible from the seed and never repeats a card', () => {
    const a = deal('alpha');
    expect(deal('alpha')).toEqual(a);
    expect(new Set(a.map((d) => d.card.id)).size).toBe(7);
    expect(deal('beta')).not.toEqual(a);
  });
});

describe('readFortune', () => {
  it('builds a legal M20 character for every seed', () => {
    const failures: string[] = [];
    const factions = new Set<string>();
    for (let i = 0; i < 10_000; i++) {
      const r = readFortune(`s${i}`);
      factions.add(r.faction.name);
      const errs = validate(r);
      if (errs.length) failures.push(`s${i}: ${errs.join('; ')}`);
      if (failures.length > 5) break;
    }
    expect(failures).toEqual([]);
    // The spread should reach every faction over enough readings.
    expect(factions.size).toBe(FACTIONS.length);
  });

  it('gives a stable character for a fixed seed', () => {
    const r = readFortune('wakeful');
    const c = r.character;
    expect({
      cards: r.spread.map((d) => `${d.card.name}${d.reversed ? ' (R)' : ''}`),
      affiliation: c.affiliation,
      nature: c.nature,
      demeanor: c.demeanor,
      essence: c.essence,
      arete: c.arete,
      spheres: c.spheres,
      willpower: c.willpower.permanent,
    }).toMatchSnapshot();
  });

  it('explains every position', () => {
    const r = readFortune('explain');
    expect(r.lines).toHaveLength(7);
    for (const l of r.lines) expect(l.text.length).toBeGreaterThan(30);
    expect(r.character.notes).toContain('The Heart.');
  });

  it('stays legal with one or two extra cards, and extras never change the first seven', () => {
    for (let i = 0; i < 3000; i++) {
      for (const extra of [1, 2]) {
        const r = readFortune(`x${i}`, extra);
        expect(validate(r), `x${i}+${extra}`).toEqual([]);
        expect(r.spread).toHaveLength(7 + extra);
      }
    }
    const base = deal('stable');
    expect(deal('stable', 2).slice(0, 7)).toEqual(base);
    expect(new Set(deal('stable', 2).map((d) => d.card.id)).size).toBe(9);
    expect(deal('stable', 5)).toHaveLength(9);
  });

  it('gives each extra card a Merit and a Flaw of equal points', () => {
    expect(readFortune('mf', 0).character.meritsFlaws).toEqual([]);
    const one = readFortune('mf', 1).character.meritsFlaws!;
    expect(one.map((m) => m.kind)).toEqual(['merit', 'flaw']);
    expect(one[0].points).toBe(one[1].points);
    for (let i = 0; i < 2000; i++) {
      const mf = readFortune(`mf${i}`, 2).character.meritsFlaws!;
      expect(mf).toHaveLength(4);
      const pts = (k: string) => mf.filter((m) => m.kind === k).reduce((t, m) => t + m.points, 0);
      expect(pts('merit')).toBe(pts('flaw'));
      expect(pts('flaw')).toBeLessThanOrEqual(7);
    }
  });

  it('explains what the whole spread decided', () => {
    const r = readFortune('combined', 2);
    expect(r.combined.map((x) => x.label)).toEqual(expect.arrayContaining(['Attributes', 'Abilities', 'Avatar', 'Arete', 'Merits & Flaws', 'The Witness', 'The Omen']));
    expect(r.lines.map((l) => l.position)).toContain('witness');
    expect(Object.values(r.tally).reduce((a, b) => a + b, 0)).toBe(9);
  });

  it('never gives a Nature and Demeanor that match', () => {
    for (let i = 0; i < 2000; i++) {
      const c = readFortune(`nd${i}`).character;
      expect(c.nature).not.toBe(c.demeanor);
    }
  });
});

describe('Merit and Flaw summaries', async () => {
  const { MERITS_FLAWS } = await import('../fortune/meritsFlaws');
  const { MF_SUMMARY } = await import('../fortune/meritsFlawsText');
  it('describes every Merit and Flaw in a short line', () => {
    for (const m of MERITS_FLAWS) {
      expect(MF_SUMMARY[m.name], m.name).toBeTruthy();
      expect(MF_SUMMARY[m.name].length, m.name).toBeLessThanOrEqual(90);
      expect(MF_SUMMARY[m.name], m.name).toMatch(/^[A-Z“].*\.$/);
    }
  });
});
