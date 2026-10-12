// Working out how many successes an Effect needs: the Magickal Feats chart for the base, the Base
// Damage or Duration and Correspondence Sphere Ranges charts (p. 504), and the optional Dividing
// Successes rule from Chapter Ten. The damage column is as printed: two successes give two levels.
import { SPHERES, type Sphere } from '../model/types';

export const FEATS = [
  { key: 'simple', label: 'Simple', successes: 1, examples: 'sharpen your senses, light a candle, shield your mind' },
  { key: 'standard', label: 'Standard', successes: 2, examples: 'heal yourself, a small fire, nudge someone’s mood' },
  { key: 'difficult', label: 'Difficult', successes: 3, examples: 'heal aggravated damage, a fireball, read another mind' },
  { key: 'impressive', label: 'Impressive', successes: 4, examples: 'regrow a limb, a firestorm, control another mind' },
  { key: 'mighty', label: 'Mighty (5–10)', successes: 5, examples: 'simple life, blow down walls, command a mob' },
  { key: 'outlandish', label: 'Outlandish (10–20)', successes: 10, examples: 'complex life, level a building, summon Otherworldly beings' },
  { key: 'godlike', label: 'Godlike (20+)', successes: 20, examples: 'rewrite your own Pattern, burn a city' },
] as const;
export type FeatKey = (typeof FEATS)[number]['key'];

/** Base Damage or Duration chart, rows for one to five successes. Six or more: successes × 2 levels. */
const DAMAGE_BY_SUCCESSES = [0, 0, 2, 6, 8, 10];
export const DURATIONS = ['One turn', 'One scene', 'One day', 'One story', 'Six months', 'Storyteller’s option'] as const;

/** Health levels (or levels healed, or Quintessence channelled) from a number of successes. */
export function chartDamage(successes: number) {
  if (successes <= 0) return 0;
  return successes < DAMAGE_BY_SUCCESSES.length ? DAMAGE_BY_SUCCESSES[successes] : successes * 2;
}

export const chartDuration = (successes: number) => (successes <= 0 ? '' : DURATIONS[Math.min(successes, DURATIONS.length) - 1]);

/** Fewest successes whose chart damage reaches `levels`. */
export function successesForDamage(levels: number) {
  if (levels <= 0) return 0;
  let s = 1;
  while (chartDamage(s) < levels) s++;
  return s;
}

/** Correspondence Sphere Ranges: successes 1–6. */
export const RANGES = [
  'Line of sight · body sample',
  'Very familiar · close possession or companion',
  'Familiar · possession or casual friend',
  'Visited once · casual acquaintance',
  'Described · briefly touched or met',
  'Anywhere on Earth · no connection',
] as const;

/** Dividing successes: levels of Duration beyond the default one turn. */
export const DIVIDED_DURATIONS = ['One turn', 'One scene', 'One day', 'One story', 'Six months', 'Storyteller’s option', 'Permanent (Storyteller’s option)'] as const;

export interface EffectPlan {
  spheres: Partial<Record<Sphere, number>>;
  feat: FeatKey;
  /** Damage, healing or Quintessence channelled, in levels/points. */
  damage: number;
  /** Forces adds one automatic success to Damage. */
  forces: boolean;
  /** Index into DURATIONS (chart) or DIVIDED_DURATIONS (divided); 0 means one turn. */
  duration: number;
  /** Total subjects, for the dividing rule. */
  targets: number;
  /** 0 = within the senses; 1–6 = row of the Correspondence chart. */
  range: number;
  /** Optional Dividing Successes rule. */
  divided: boolean;
  /** Storyteller's adjustment. */
  extra: number;
}

export const blankPlan = (): EffectPlan => ({ spheres: {}, feat: 'standard', damage: 0, forces: false, duration: 0, targets: 1, range: 0, divided: false, extra: 0 });

export interface PlanLine {
  label: string;
  successes: number;
}

export interface PlanResult {
  lines: PlanLine[];
  need: number;
  highestSphere: number;
  spheresUsed: Sphere[];
  warnings: string[];
}

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

export function planEffect(p: EffectPlan): PlanResult {
  const feat = FEATS.find((f) => f.key === p.feat) ?? FEATS[1];
  const lines: PlanLine[] = [];
  const warnings: string[] = [];
  const forcesBonus = p.forces && p.damage > 0 ? 1 : 0;
  let need: number;

  if (!p.divided) {
    // One roll sets Damage or Duration, never both; the bigger requirement wins.
    lines.push({ label: `${feat.label} feat`, successes: feat.successes });
    if (p.damage > 0 && p.duration > 0) warnings.push('On the chart, an Effect gets Damage or Duration, not both. Use the dividing rule for both.');
    const forDamage = Math.max(0, successesForDamage(p.damage) - forcesBonus);
    if (p.damage > 0) lines.push({ label: `${plural(p.damage, 'level')} of damage${forcesBonus ? ' (Forces adds 1)' : ''}`, successes: forDamage });
    const forDuration = p.duration > 0 ? Math.min(p.duration, DURATIONS.length - 1) + 1 : 0;
    if (p.duration > 0) lines.push({ label: `Lasts ${DURATIONS[forDuration - 1].toLowerCase()}`, successes: forDuration });
    need = Math.max(feat.successes, forDamage, forDuration);
    if (p.targets > 1) warnings.push('Extra targets need the dividing rule, or an area Effect.');
  } else {
    lines.push({ label: `Base: ${feat.label.toLowerCase()} feat`, successes: feat.successes });
    if (p.targets > 1) lines.push({ label: `${plural(p.targets - 1, 'extra target')}`, successes: p.targets - 1 });
    const forDamage = Math.max(0, Math.ceil(p.damage / 2) - forcesBonus);
    if (p.damage > 0) lines.push({ label: `${plural(p.damage, 'level')} of damage, 2 per success${forcesBonus ? ' (Forces adds 1)' : ''}`, successes: forDamage });
    const duration = Math.min(p.duration, DIVIDED_DURATIONS.length - 1);
    if (duration > 0) lines.push({ label: `Lasts ${DIVIDED_DURATIONS[duration].toLowerCase()}`, successes: duration });
    need = lines.reduce((t, l) => t + l.successes, 0);
  }

  if (p.range > 0) {
    const r = Math.min(p.range, RANGES.length);
    lines.push({ label: `Range: ${RANGES[r - 1].split(' · ')[0].toLowerCase()}`, successes: r });
    need += r;
    if (!(p.spheres.Correspondence ?? 0)) warnings.push('Reaching beyond the senses needs Correspondence.');
  }
  if (p.extra) {
    lines.push({ label: 'Storyteller’s adjustment', successes: p.extra });
    need += p.extra;
  }

  const spheresUsed = SPHERES.filter((s) => (p.spheres[s] ?? 0) > 0);
  const highestSphere = Math.max(0, ...spheresUsed.map((s) => p.spheres[s]!));
  if (!spheresUsed.length) warnings.push('Pick the Spheres the Effect uses.');
  return { lines, need: Math.max(1, need), highestSphere, spheresUsed, warnings };
}

/** What a casting roll achieves on the Base Damage or Duration chart. */
export function chartOutcome(successes: number, forces = false) {
  const s = successes + (forces && successes > 0 ? 1 : 0);
  return { damage: chartDamage(s), duration: chartDuration(successes) };
}
