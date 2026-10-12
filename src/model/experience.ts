// Experience: what a character has earned and spent, and what the next dot of each trait costs.
// Costs follow the M20 experience chart: new Ability 3, new Sphere 10, Attribute ×4, Ability ×2,
// Background ×3, affinity Sphere ×7, other Sphere ×8, Arete ×8, Willpower ×1 (current rating).
import { ATTRIBUTE_NAMES, SPHERES, type AbilityCategory, type Character, type Sphere, type Trait, type XpEntry } from './types';

export const XP_COST = {
  newAbility: 3,
  newBackground: 3,
  newSphere: 10,
  attribute: 4,
  ability: 2,
  background: 3,
  affinitySphere: 7,
  sphere: 8,
  arete: 8,
  willpower: 1,
} as const;

export type XpTarget =
  | { kind: 'attribute'; name: string }
  | { kind: 'ability'; category: Exclude<AbilityCategory, 'backgrounds'>; name: string }
  | { kind: 'background'; name: string }
  | { kind: 'sphere'; sphere: Sphere }
  | { kind: 'arete' }
  | { kind: 'willpower' };

/** Experience to raise a trait one dot from `current`. */
export function xpCost(t: XpTarget['kind'], current: number, affinity = false): number {
  switch (t) {
    case 'attribute':
      return current * XP_COST.attribute;
    case 'ability':
      return current === 0 ? XP_COST.newAbility : current * XP_COST.ability;
    case 'background':
      return current === 0 ? XP_COST.newBackground : current * XP_COST.background;
    case 'sphere':
      return current === 0 ? XP_COST.newSphere : current * (affinity ? XP_COST.affinitySphere : XP_COST.sphere);
    case 'arete':
      return current * XP_COST.arete;
    case 'willpower':
      return current * XP_COST.willpower;
  }
}

const sum = (log: XpEntry[], sign: 1 | -1) => log.reduce((t, e) => t + (Math.sign(e.xp) === sign ? Math.abs(e.xp) : 0), 0);

export function xpTotals(c: Character) {
  const log = c.experience?.log ?? [];
  const earned = sum(log, 1);
  const spent = sum(log, -1);
  return { earned, spent, available: earned - spent };
}

export interface XpOption {
  target: XpTarget;
  label: string;
  current: number;
  cost: number;
  /** Why it can't be bought yet, if it can't. */
  blocked?: string;
}

const MAX_TRAIT = 5;

/** Everything on the sheet that experience can raise, with the next dot's cost. */
export function xpOptions(c: Character): XpOption[] {
  const out: XpOption[] = [];
  for (const name of ATTRIBUTE_NAMES) {
    const current = c.attributes[name]?.rating ?? 1;
    out.push({ target: { kind: 'attribute', name }, label: name, current, cost: xpCost('attribute', current), blocked: current >= MAX_TRAIT ? 'At 5' : undefined });
  }
  for (const category of ['talents', 'skills', 'knowledges'] as const) {
    for (const t of c.abilities[category]) {
      if (!t.name.trim()) continue;
      out.push({
        target: { kind: 'ability', category, name: t.name },
        label: t.name,
        current: t.rating,
        cost: xpCost('ability', t.rating),
        blocked: t.rating >= MAX_TRAIT ? 'At 5' : undefined,
      });
    }
  }
  for (const t of c.abilities.backgrounds) {
    if (!t.name.trim()) continue;
    out.push({
      target: { kind: 'background', name: t.name },
      label: t.name,
      current: t.rating,
      cost: xpCost('background', t.rating),
      blocked: t.rating >= MAX_TRAIT ? 'At 5' : undefined,
    });
  }
  for (const sphere of SPHERES) {
    const current = c.spheres[sphere] ?? 0;
    const affinity = c.affinity === sphere;
    out.push({
      target: { kind: 'sphere', sphere },
      label: affinity ? `${sphere} (affinity)` : sphere,
      current,
      cost: xpCost('sphere', current, affinity),
      blocked: current >= MAX_TRAIT ? 'At 5' : current >= c.arete ? 'Needs higher Arete' : undefined,
    });
  }
  out.push({ target: { kind: 'arete' }, label: 'Arete', current: c.arete, cost: xpCost('arete', c.arete), blocked: c.arete >= 10 ? 'At 10' : undefined });
  out.push({
    target: { kind: 'willpower' },
    label: 'Willpower',
    current: c.willpower.permanent,
    cost: xpCost('willpower', c.willpower.permanent),
    blocked: c.willpower.permanent >= 10 ? 'At 10' : undefined,
  });
  return out;
}

export const xpTargetKey = (t: XpTarget) =>
  t.kind === 'attribute' || t.kind === 'background' ? `${t.kind}:${t.name}` : t.kind === 'ability' ? `ability:${t.category}:${t.name}` : t.kind === 'sphere' ? `sphere:${t.sphere}` : t.kind;

/** Raise the trait one dot and log the cost. Throws if it can't be bought. */
export function spendXp(c: Character, o: XpOption, at = Date.now()): Character {
  if (o.blocked) throw new Error(`${o.label}: ${o.blocked}`);
  if (o.cost > xpTotals(c).available) throw new Error(`${o.label} costs ${o.cost} experience.`);
  const t = o.target;
  const next = o.current + 1;
  let raised: Character;
  switch (t.kind) {
    case 'attribute':
      raised = { ...c, attributes: { ...c.attributes, [t.name]: { ...(c.attributes[t.name] ?? { name: t.name }), rating: next } } };
      break;
    case 'ability':
      raised = { ...c, abilities: { ...c.abilities, [t.category]: raiseTrait(c.abilities[t.category], t.name, next) } };
      break;
    case 'background':
      raised = { ...c, abilities: { ...c.abilities, backgrounds: raiseTrait(c.abilities.backgrounds, t.name, next) } };
      break;
    case 'sphere':
      raised = { ...c, spheres: { ...c.spheres, [t.sphere]: next } };
      break;
    case 'arete':
      raised = { ...c, arete: next };
      break;
    case 'willpower':
      raised = { ...c, willpower: { permanent: next, temporary: c.willpower.temporary + 1 } };
      break;
  }
  return logXp(raised, -o.cost, `${o.label} ${o.current} → ${next}`, at);
}

/** Set a trait's rating, adding it if the character doesn't have it yet. */
function raiseTrait(ts: Trait[], name: string, rating: number): Trait[] {
  return ts.some((x) => x.name === name) ? ts.map((x) => (x.name === name ? { ...x, rating } : x)) : [...ts, { name, rating }];
}

/** A new Ability or Background the character doesn't have yet. */
export function newTraitOption(category: AbilityCategory, name: string): XpOption {
  const target: XpTarget = category === 'backgrounds' ? { kind: 'background', name } : { kind: 'ability', category, name };
  return { target, label: name, current: 0, cost: xpCost(target.kind, 0) };
}

export function logXp(c: Character, xp: number, note: string, at = Date.now()): Character {
  return { ...c, experience: { log: [...(c.experience?.log ?? []), { at, xp, note }] } };
}
