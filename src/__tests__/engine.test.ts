import { describe, expect, it } from 'vitest';
import { backlashTier, magickSetup, paradoxAfterBacklash, paradoxFor, rollPool, scoreFaces, type Rng } from '../engine/dice';
import { acceptBotch, nextTarget, rollRitual, saveBotch, startRitual, type RitualConfig } from '../engine/ritual';

const seq = (...faces: number[]): Rng => {
  let i = 0;
  return () => faces[i++ % faces.length];
};

describe('scoreFaces', () => {
  it('counts hits at or above difficulty and lets 1s cancel', () => {
    const r = scoreFaces([8, 3, 10, 6, 1, 7], { difficulty: 6 });
    expect(r.raw).toBe(4);
    expect(r.ones).toBe(1);
    expect(r.net).toBe(3);
    expect(r.success).toBe(true);
    expect(r.botch).toBe(false);
  });

  it('botches only with no successes and at least one 1', () => {
    expect(scoreFaces([1, 2, 3], { difficulty: 6 }).botch).toBe(true);
    expect(scoreFaces([2, 3, 4], { difficulty: 6 }).botch).toBe(false);
    // One success cancelled by two 1s is a failure, not a botch.
    const r = scoreFaces([7, 1, 1], { difficulty: 6 });
    expect(r.botch).toBe(false);
    expect(r.net).toBe(0);
    expect(r.success).toBe(false);
  });

  it('counts 10s twice with a specialty', () => {
    expect(scoreFaces([10, 10, 2], { difficulty: 6, specialty: true }).net).toBe(4);
    expect(scoreFaces([10, 10, 2], { difficulty: 6 }).net).toBe(2);
  });

  it('gives Willpower an uncancellable success and prevents botches', () => {
    const r = scoreFaces([1, 1, 2], { difficulty: 6, willpower: true });
    expect(r.botch).toBe(false);
    expect(r.net).toBe(1);
    expect(r.success).toBe(true);
  });

  it('turns difficulty above 10 into extra required successes', () => {
    const r = scoreFaces([10, 10, 10], { difficulty: 12 });
    expect(r.difficulty).toBe(10);
    expect(r.need).toBe(3);
    expect(r.success).toBe(true);
  });
});

describe('rollPool', () => {
  it('rolls the requested number of dice', () => {
    expect(rollPool({ pool: 9, difficulty: 7 }).faces).toHaveLength(9);
    expect(rollPool({ pool: 5, difficulty: 6 }, seq(6)).net).toBe(5);
  });
});

describe('magickSetup', () => {
  it('uses highest Sphere + 3 / 4 / 5', () => {
    expect(magickSetup({ arete: 3, highestSphere: 2, effect: 'coincidental' }).difficulty).toBe(5);
    expect(magickSetup({ arete: 3, highestSphere: 3, effect: 'vulgar' }).difficulty).toBe(7);
    expect(magickSetup({ arete: 3, highestSphere: 3, effect: 'witnessed' }).difficulty).toBe(8);
  });

  it('caps the net modifier at ±3 and floors difficulty at 3', () => {
    const s = magickSetup({ arete: 3, highestSphere: 1, effect: 'coincidental', mods: { quintessence: 3, time: 3, instruments: -2 } });
    expect(s.rawModifier).toBe(-8);
    expect(s.modifier).toBe(-3);
    expect(s.difficulty).toBe(3);
  });

  it('adds required successes above difficulty 10', () => {
    const s = magickSetup({ arete: 5, highestSphere: 5, effect: 'witnessed', need: 2, mods: { instruments: 3 } });
    expect(s.difficulty).toBe(10);
    expect(s.need).toBe(5);
  });

  it('caps the casting pool at permanent Willpower', () => {
    const s = magickSetup({ arete: 4, permanentWillpower: 3, highestSphere: 2, effect: 'coincidental' });
    expect(s.pool).toBe(3);
    expect(s.limitedByWillpower).toBe(true);
  });

  it('matches the Wakeful House presets', () => {
    // Dacanay: hold the group together (Mind 3), vulgar, need 2
    expect(magickSetup({ arete: 3, highestSphere: 3, effect: 'vulgar', need: 2 })).toMatchObject({ pool: 3, difficulty: 7, need: 2 });
    // Prentiss: redirect the debts (Entropy 2 + Mind 2), coincidental, need 3
    expect(magickSetup({ arete: 3, highestSphere: 2, effect: 'coincidental', need: 3 })).toMatchObject({ pool: 3, difficulty: 5, need: 3 });
  });
});

describe('paradoxFor', () => {
  it('follows the casting table', () => {
    expect(paradoxFor('coincidental', 3, { botch: false, success: true })).toBe(0);
    expect(paradoxFor('vulgar', 3, { botch: false, success: true })).toBe(1);
    expect(paradoxFor('vulgar', 3, { botch: false, success: false })).toBe(0);
    expect(paradoxFor('coincidental', 3, { botch: true, success: false })).toBe(3);
    expect(paradoxFor('vulgar', 3, { botch: true, success: false })).toBe(4);
    expect(paradoxFor('witnessed', 3, { botch: true, success: false })).toBe(8);
  });
});

describe('backlashTier', () => {
  it('maps successes to tiers', () => {
    expect(backlashTier({ botch: true, net: 0 })).toMatch(/harmlessly/);
    expect(backlashTier({ botch: false, net: 3 })).toMatch(/trivial/);
    expect(backlashTier({ botch: false, net: 12 })).toMatch(/significant/);
  });

  it('discharges one point per success, never permanent points', () => {
    expect(paradoxAfterBacklash(8, 1, { botch: false, net: 3 })).toBe(5);
    expect(paradoxAfterBacklash(8, 1, { botch: false, net: 0 })).toBe(8);
    expect(paradoxAfterBacklash(8, 1, { botch: true, net: 0 })).toBe(1);
    expect(paradoxAfterBacklash(4, 1, { botch: false, net: 9 })).toBe(1);
  });
});

describe('ritual', () => {
  const config = (need: number, effect: RitualConfig['effect'] = 'coincidental'): RitualConfig => ({
    setup: magickSetup({ arete: 3, highestSphere: 2, effect, need }),
    effect,
    highestSphere: 2,
    arete: 3,
    permanentWillpower: 5,
  });

  it('allows Willpower + Arete rolls', () => {
    expect(startRitual(config(5)).maxRolls).toBe(8);
  });

  it('accumulates successes and cancels accrued Paradox on success', () => {
    let s = startRitual(config(4, 'vulgar'));
    s = rollRitual(s, {}, seq(9, 9, 2)); // 2 successes
    s = rollRitual(s, {}, seq(9, 9, 2)); // 4 total
    expect(s.status).toBe('succeeded');
    expect(s.accruedParadox).toBe(1);
    expect(s.paradoxTaken).toBe(1); // vulgar costs 1; the accrued point goes away
  });

  it('adds +1 difficulty for each failed roll', () => {
    let s = startRitual(config(5));
    expect(nextTarget(s).difficulty).toBe(5);
    s = rollRitual(s, {}, seq(2, 3, 4));
    expect(s.failures).toBe(1);
    expect(nextTarget(s).difficulty).toBe(6);
  });

  it('turns failure penalties past 9 into thresholds', () => {
    let s = startRitual(config(1));
    s = { ...s, failures: 6 }; // 5 + 6 = 11
    expect(nextTarget(s)).toEqual({ difficulty: 9, need: 3 });
  });

  it('lets a botch be saved once, then collapses on the second', () => {
    let s = startRitual(config(10));
    s = rollRitual(s, {}, seq(9, 9, 9)); // 3 successes
    s = rollRitual(s, {}, seq(1, 2, 3)); // botch
    expect(s.status).toBe('botched');
    s = saveBotch(s);
    expect(s.status).toBe('running');
    expect(s.successes).toBe(2);
    expect(nextTarget(s).difficulty).toBe(6);
    s = rollRitual(s, {}, seq(1, 2, 3)); // second botch
    expect(s.status).toBe('disaster');
    // Coincidental botch at Sphere 2 = 2, plus 2 accrued (rolls 2 and 3)
    expect(s.paradoxTaken).toBe(4);
  });

  it('adds the accrued Paradox when a botch is accepted', () => {
    let s = startRitual(config(10, 'vulgar'));
    s = rollRitual(s, {}, seq(9, 2, 2));
    s = rollRitual(s, {}, seq(1, 2, 2));
    s = acceptBotch(s);
    expect(s.status).toBe('disaster');
    expect(s.paradoxTaken).toBe(3 + 1);
  });

  it('keeps accrued Paradox when it runs out of rolls', () => {
    let s = startRitual({ ...config(20), permanentWillpower: 1, arete: 1 });
    s = rollRitual(s, {}, seq(9, 2, 2));
    s = rollRitual(s, {}, seq(9, 2, 2));
    expect(s.status).toBe('exhausted');
    expect(s.paradoxTaken).toBe(1);
  });
});
