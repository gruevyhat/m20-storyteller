import { describe, expect, it } from 'vitest';
import { blankCharacter } from '../model/types';
import { logXp, newTraitOption, spendXp, xpCost, xpOptions, xpTotals } from '../model/experience';

describe('experience costs (M20 chart)', () => {
  it('prices each trait', () => {
    expect(xpCost('attribute', 3)).toBe(12);
    expect(xpCost('ability', 0)).toBe(3);
    expect(xpCost('ability', 2)).toBe(4);
    expect(xpCost('background', 2)).toBe(6);
    expect(xpCost('sphere', 0)).toBe(10);
    expect(xpCost('sphere', 2)).toBe(16);
    expect(xpCost('sphere', 2, true)).toBe(14);
    expect(xpCost('arete', 3)).toBe(24);
    expect(xpCost('willpower', 6)).toBe(6);
  });
});

describe('spending experience', () => {
  const mage = () => {
    const c = blankCharacter();
    c.arete = 3;
    c.affinity = 'Forces';
    c.spheres = { Forces: 2, Mind: 3 };
    c.abilities.talents = [{ name: 'Awareness', rating: 2 }];
    return logXp(c, 30, 'Session 1', 1);
  };
  const option = (c: ReturnType<typeof mage>, label: string) => xpOptions(c).find((o) => o.label === label)!;

  it('raises a trait and logs the cost', () => {
    const c = spendXp(mage(), option(mage(), 'Forces (affinity)'), 2);
    expect(c.spheres.Forces).toBe(3);
    expect(xpTotals(c)).toEqual({ earned: 30, spent: 14, available: 16 });
    expect(c.experience!.log.at(-1)!.note).toBe('Forces (affinity) 2 → 3');
  });

  it('blocks Spheres at Arete and purchases it can’t afford', () => {
    const c = mage();
    expect(option(c, 'Mind').blocked).toMatch(/Arete/);
    expect(() => spendXp(c, option(c, 'Mind'))).toThrow();
    expect(() => spendXp(c, option(c, 'Arete'))).not.toThrow();
    const poor = logXp(blankCharacter(), 2, 'x');
    expect(() => spendXp(poor, option(poor as never, 'Strength'))).toThrow(/costs 4/);
  });

  it('learns a new Ability at 1', () => {
    const c = spendXp(mage(), newTraitOption('skills', 'Firearms'));
    expect(c.abilities.skills).toEqual([{ name: 'Firearms', rating: 1 }]);
    expect(xpTotals(c).spent).toBe(3);
  });

  it('raises temporary Willpower with permanent', () => {
    const c = spendXp(mage(), option(mage(), 'Willpower'));
    expect(c.willpower).toEqual({ permanent: 6, temporary: 6 });
  });
});
