// Guided character creation, following the M20 process (p. 250) and freebie chart (p. 253).
// Pure functions: a Build in, a Character and a list of problems out.
import { rngFromSeed } from '../fortune/random';
import { syncWonderBackground } from '../wonders/background';
import { ATTRIBUTES, SPHERES, STANDARD_HEALTH, blankCharacter, type AbilityCategory, type Character, type Sphere } from './types';
import { KNOWLEDGES, SKILLS, TALENTS, faction } from '../fortune/lore';

export type AttrGroup = keyof typeof ATTRIBUTES;
export type AbilityGroup = Exclude<AbilityCategory, 'backgrounds'>;

export const ABILITY_LISTS: Record<AbilityGroup, string[]> = { talents: TALENTS, skills: SKILLS, knowledges: KNOWLEDGES };

export const BACKGROUNDS = [
  'Allies', 'Alternate Identity', 'Arcane', 'Avatar', 'Backup', 'Blessing', 'Certification', 'Chantry', 'Contacts', 'Cult', 'Demesne',
  'Destiny', 'Dream', 'Enhancement', 'Fame', 'Familiar', 'Influence', 'Legend', 'Library', 'Mentor', 'Node', 'Past Lives', 'Patron',
  'Rank', 'Requisitions', 'Resources', 'Retainers', 'Sanctum', 'Secret Weapons', 'Spies', 'Status', 'Totem', 'Wonder',
];
/** Marked in M20 as Technocracy-only. */
export const TECHNOCRACY_BACKGROUNDS = ['Requisitions', 'Secret Weapons'];

export const ATTRIBUTE_DOTS = [7, 5, 3];
export const ABILITY_DOTS = [13, 9, 5];
export const BACKGROUND_DOTS = 7;
export const SPHERE_DOTS = 6;
export const FREEBIES = 15;
export const MAX_FLAW_POINTS = 7;
export const COST = { attribute: 5, ability: 2, background: 1, sphere: 7, arete: 4, willpower: 1, quintessence: 1 } as const;

export interface Build {
  name: string;
  concept: string;
  faction: string;
  essence: string;
  nature: string;
  demeanor: string;
  paradigm: string;
  practice: string;
  instruments: string;
  attrPriority: AttrGroup[];
  attrs: Record<string, number>; // dots above the free 1
  abilityPriority: AbilityGroup[];
  abilities: Record<string, number>;
  backgrounds: Record<string, number>;
  arete: number; // 1–3; dots above 1 are bought with freebies
  affinity: Sphere | '';
  spheres: Partial<Record<Sphere, number>>; // includes the affinity dot
  freebie: {
    attrs: Record<string, number>;
    abilities: Record<string, number>;
    backgrounds: Record<string, number>;
    spheres: Partial<Record<Sphere, number>>;
    willpower: number;
    quintessence: number; // freebie points spent; each buys 4 Quintessence
  };
  merits: { name: string; points: number }[];
  flaws: { name: string; points: number }[];
  notes: string;
}

export function blankBuild(): Build {
  return {
    name: '',
    concept: '',
    faction: '',
    essence: '',
    nature: '',
    demeanor: '',
    paradigm: '',
    practice: '',
    instruments: '',
    attrPriority: ['physical', 'social', 'mental'],
    attrs: {},
    abilityPriority: ['talents', 'skills', 'knowledges'],
    abilities: {},
    backgrounds: {},
    arete: 1,
    affinity: '',
    spheres: {},
    freebie: { attrs: {}, abilities: {}, backgrounds: {}, spheres: {}, willpower: 0, quintessence: 0 },
    merits: [],
    flaws: [],
    notes: '',
  };
}

const sum = (r: Record<string, number | undefined>, keys?: string[]) => (keys ?? Object.keys(r)).reduce((t, k) => t + (r[k] ?? 0), 0);

/** Dots each Attribute group may spend, by its place in the priority order. */
export function attrAllowance(b: Build, g: AttrGroup) {
  return ATTRIBUTE_DOTS[b.attrPriority.indexOf(g)];
}
export function abilityAllowance(b: Build, g: AbilityGroup) {
  return ABILITY_DOTS[b.abilityPriority.indexOf(g)];
}
export const attrSpent = (b: Build, g: AttrGroup) => sum(b.attrs, [...ATTRIBUTES[g]]);
export const abilitySpent = (b: Build, g: AbilityGroup) => sum(b.abilities, ABILITY_LISTS[g]);
export const backgroundSpent = (b: Build) => sum(b.backgrounds);
export const sphereSpent = (b: Build) => sum(b.spheres as Record<string, number>);

export const flawPoints = (b: Build) => b.flaws.reduce((t, f) => t + f.points, 0);
export const meritPoints = (b: Build) => b.merits.reduce((t, m) => t + m.points, 0);

/** Freebie points spent, with Flaws (up to 7) paying some back. */
export function freebiesSpent(b: Build) {
  const f = b.freebie;
  return (
    (b.arete - 1) * COST.arete +
    sum(f.attrs) * COST.attribute +
    sum(f.abilities) * COST.ability +
    sum(f.backgrounds) * COST.background +
    sum(f.spheres as Record<string, number>) * COST.sphere +
    f.willpower * COST.willpower +
    f.quintessence * COST.quintessence +
    meritPoints(b) -
    Math.min(MAX_FLAW_POINTS, flawPoints(b))
  );
}
export const freebiesLeft = (b: Build) => FREEBIES - freebiesSpent(b);

export const finalAttr = (b: Build, n: string) => 1 + (b.attrs[n] ?? 0) + (b.freebie.attrs[n] ?? 0);
export const finalAbility = (b: Build, n: string) => (b.abilities[n] ?? 0) + (b.freebie.abilities[n] ?? 0);
export const finalBackground = (b: Build, n: string) => (b.backgrounds[n] ?? 0) + (b.freebie.backgrounds[n] ?? 0);
export const finalSphere = (b: Build, s: Sphere) => (b.spheres[s] ?? 0) + (b.freebie.spheres[s] ?? 0);

export const STEPS = [
  { key: 'concept', title: 'Concept', gloss: 'Who your mage is' },
  { key: 'attributes', title: 'Attributes', gloss: '7 / 5 / 3' },
  { key: 'abilities', title: 'Abilities', gloss: '13 / 9 / 5' },
  { key: 'advantages', title: 'Advantages', gloss: 'Backgrounds and focus' },
  { key: 'magick', title: 'Arete & Spheres', gloss: 'Six Sphere dots' },
  { key: 'freebies', title: 'Freebies', gloss: '15 points' },
  { key: 'finish', title: 'Finish', gloss: 'Review and save' },
] as const;
export type StepKey = (typeof STEPS)[number]['key'];

/** Problems that stop a step being complete. An empty list means the step is done. */
export function problems(b: Build): Record<StepKey, string[]> {
  const out: Record<StepKey, string[]> = { concept: [], attributes: [], abilities: [], advantages: [], magick: [], freebies: [], finish: [] };
  if (!b.name.trim()) out.concept.push('Give your mage a name.');
  if (!b.concept.trim()) out.concept.push('Choose a concept.');
  if (!b.faction) out.concept.push('Choose an affiliation.');
  if (!b.essence) out.concept.push('Choose an Essence.');
  if (!b.nature) out.concept.push('Choose a Nature.');
  if (!b.demeanor) out.concept.push('Choose a Demeanor.');

  for (const g of Object.keys(ATTRIBUTES) as AttrGroup[]) {
    const left = attrAllowance(b, g) - attrSpent(b, g);
    if (left > 0) out.attributes.push(`${cap(g)}: ${left} dot${left === 1 ? '' : 's'} left to place.`);
    if (left < 0) out.attributes.push(`${cap(g)}: ${-left} dot${left === -1 ? '' : 's'} too many.`);
  }
  for (const n of Object.keys(b.attrs)) if (1 + (b.attrs[n] ?? 0) > 5) out.attributes.push(`${n} can't go above 5.`);

  for (const g of Object.keys(ABILITY_LISTS) as AbilityGroup[]) {
    const left = abilityAllowance(b, g) - abilitySpent(b, g);
    if (left > 0) out.abilities.push(`${cap(g)}: ${left} dot${left === 1 ? '' : 's'} left to place.`);
    if (left < 0) out.abilities.push(`${cap(g)}: ${-left} dot${left === -1 ? '' : 's'} too many.`);
  }
  for (const [n, v] of Object.entries(b.abilities)) if (v > 3) out.abilities.push(`${n} can't go above 3 before freebies.`);

  const bgLeft = BACKGROUND_DOTS - backgroundSpent(b);
  if (bgLeft > 0) out.advantages.push(`${bgLeft} Background dot${bgLeft === 1 ? '' : 's'} left to place.`);
  if (bgLeft < 0) out.advantages.push(`${-bgLeft} Background dot${bgLeft === -1 ? '' : 's'} too many.`);
  if (!(b.backgrounds.Avatar ?? 0)) out.advantages.push('Every mage needs at least one dot of Avatar.');
  const isTech = b.faction && faction(b.faction)?.camp === 'Technocracy';
  for (const bg of TECHNOCRACY_BACKGROUNDS) if ((b.backgrounds[bg] ?? 0) && !isTech) out.advantages.push(`${bg} is for Technocrats only.`);
  if (!b.paradigm.trim()) out.advantages.push('Choose or write a paradigm.');
  if (!b.practice.trim()) out.advantages.push('Choose a practice.');
  if (!b.instruments.trim()) out.advantages.push('List some instruments.');

  if (!b.affinity) out.magick.push('Choose an affinity Sphere.');
  else {
    const allowed = b.faction ? faction(b.faction).affinity : SPHERES;
    if (!allowed.includes(b.affinity)) out.magick.push(`${b.affinity} isn't an affinity Sphere for the ${b.faction}.`);
    if (!(b.spheres[b.affinity] ?? 0)) out.magick.push('The affinity Sphere gets the first dot.');
  }
  const sLeft = SPHERE_DOTS - sphereSpent(b);
  if (sLeft > 0) out.magick.push(`${sLeft} Sphere dot${sLeft === 1 ? '' : 's'} left to place.`);
  if (sLeft < 0) out.magick.push(`${-sLeft} Sphere dot${sLeft === -1 ? '' : 's'} too many.`);
  for (const s of SPHERES) if (finalSphere(b, s) > b.arete) out.magick.push(`${s} can't be higher than Arete (${b.arete}).`);
  if (b.arete < 1 || b.arete > 3) out.magick.push('Arete starts between 1 and 3.');

  const left = freebiesLeft(b);
  if (left > 0) out.freebies.push(`${left} freebie point${left === 1 ? '' : 's'} left to spend.`);
  if (left < 0) out.freebies.push(`${-left} freebie point${left === -1 ? '' : 's'} overspent.`);
  if (flawPoints(b) > MAX_FLAW_POINTS) out.freebies.push(`Flaws over ${MAX_FLAW_POINTS} points give no more freebies.`);
  for (const n of Object.keys(b.freebie.attrs)) if (finalAttr(b, n) > 5) out.freebies.push(`${n} can't go above 5.`);
  for (const n of Object.keys(b.freebie.abilities)) if (finalAbility(b, n) > 5) out.freebies.push(`${n} can't go above 5.`);
  for (const n of Object.keys(b.freebie.backgrounds)) if (finalBackground(b, n) > 5) out.freebies.push(`${n} can't go above 5.`);
  if (5 + b.freebie.willpower > 10) out.freebies.push('Willpower can\'t go above 10.');

  const earlier = (Object.keys(out) as StepKey[]).filter((k) => k !== 'finish' && out[k].length);
  if (earlier.length) out.finish.push(`Unfinished: ${earlier.map((k) => STEPS.find((s) => s.key === k)!.title).join(', ')}.`);
  return out;
}

function cap(s: string) {
  return s[0].toUpperCase() + s.slice(1);
}

/** The finished character. Works on incomplete builds too, so the preview stays live. */
export function buildCharacter(b: Build): Character {
  const c = blankCharacter('pc');
  c.name = b.name.trim() || 'Unnamed mage';
  c.concept = b.concept;
  const f = b.faction ? faction(b.faction) : null;
  c.affiliation = !f ? '' : f.camp === 'Orphan' ? 'Orphan (self-Awakened)' : f.camp === 'Craft' ? `${f.name} (Disparate Craft)` : `${f.name} (${f.camp})`;
  c.essence = b.essence;
  c.nature = b.nature;
  c.demeanor = b.demeanor;
  c.paradigm = b.paradigm;
  c.practice = b.practice;
  c.instruments = b.instruments;
  for (const g of Object.keys(ATTRIBUTES) as AttrGroup[]) for (const n of ATTRIBUTES[g]) c.attributes[n] = { name: n, rating: finalAttr(b, n) };
  for (const g of Object.keys(ABILITY_LISTS) as AbilityGroup[]) {
    c.abilities[g] = ABILITY_LISTS[g].filter((n) => finalAbility(b, n) > 0).map((n) => ({ name: n, rating: finalAbility(b, n) }));
  }
  c.abilities.backgrounds = BACKGROUNDS.filter((n) => finalBackground(b, n) > 0).map((n) => ({ name: n, rating: finalBackground(b, n) }));
  c.arete = b.arete;
  if (b.affinity) c.affinity = b.affinity;
  for (const s of SPHERES) if (finalSphere(b, s)) c.spheres[s] = finalSphere(b, s);
  const wp = 5 + b.freebie.willpower;
  c.willpower = { permanent: wp, temporary: wp };
  c.quintessence = finalBackground(b, 'Avatar') + b.freebie.quintessence * 4;
  c.health = { levels: STANDARD_HEALTH.map((l) => ({ ...l })), damage: [] };
  c.meritsFlaws = [...b.merits.map((m) => ({ ...m, kind: 'merit' as const })), ...b.flaws.map((m) => ({ ...m, kind: 'flaw' as const }))];
  c.notes = b.notes;
  c.extra = { created: 'Guided character creation (M20 pp. 250–253)' };
  // Seeded so the preview keeps the same Wonder while other choices change.
  const draw = rngFromSeed(`wonder:${c.name}:${b.faction}:${finalBackground(b, 'Wonder')}`);
  return syncWonderBackground(null, c, () => draw.next());
}
