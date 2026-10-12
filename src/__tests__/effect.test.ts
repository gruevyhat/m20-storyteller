import { describe, expect, it } from 'vitest';
import { blankPlan, chartDamage, chartOutcome, planEffect, successesForDamage } from '../engine/effect';

describe('Base Damage or Duration chart', () => {
  it('reads the chart as printed, then 2 levels per success from six', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(chartDamage)).toEqual([0, 2, 6, 8, 10, 12, 14]);
    expect(successesForDamage(6)).toBe(3);
    expect(successesForDamage(7)).toBe(4);
    expect(chartOutcome(3).duration).toBe('One day');
  });

  it('gives Forces one free success to damage (M20 example: 2 + 1 = 6 levels)', () => {
    expect(chartOutcome(2, true).damage).toBe(6);
    const r = planEffect({ ...blankPlan(), spheres: { Forces: 3 }, damage: 6, forces: true });
    expect(r.need).toBe(2);
  });
});

describe('planning an Effect', () => {
  it('takes the biggest requirement on the chart, plus range', () => {
    const r = planEffect({ ...blankPlan(), spheres: { Forces: 3, Correspondence: 2 }, feat: 'difficult', duration: 3, range: 2 });
    expect(r.highestSphere).toBe(3);
    expect(r.need).toBe(4 + 2);
    expect(r.warnings).toEqual([]);
  });

  it('adds up divided successes (M20 example: three targets, six levels = 7)', () => {
    const r = planEffect({ ...blankPlan(), spheres: { Life: 3 }, feat: 'standard', divided: true, targets: 3, damage: 6 });
    expect(r.need).toBe(7);
  });

  it('flags range without Correspondence and missing Spheres', () => {
    expect(planEffect({ ...blankPlan(), range: 3 }).warnings.join(' ')).toMatch(/Correspondence.*|Spheres/);
    expect(planEffect(blankPlan()).warnings).toContain('Pick the Spheres the Effect uses.');
  });
});
