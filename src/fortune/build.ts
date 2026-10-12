// Turn a seven-card spread into a legal starting M20 character (core rules, Step One–Five)
// and a reading that explains where every choice came from.
import { ATTRIBUTES, SPHERES, blankCharacter, type AbilityCategory, type Character, type Sphere } from '../model/types';
import { DECK, SUITS, type Card, type Essence } from './deck';
import {
  ABILITY_LEANINGS,
  ARTICLE,
  ATTRIBUTE_LEANINGS,
  BACKGROUND_LEANINGS,
  INSTRUMENTS,
  KNOWLEDGES,
  MAJOR_FACTIONS,
  OCCUPATIONS,
  REVERSED_PATH,
  SKILLS,
  SUIT_FACTIONS,
  TALENTS,
  TECHNOCRACY_ONLY,
  faction,
  type Faction,
  type SuitOrMajor,
} from './lore';
import { rngFromSeed, type Random } from './random';
import { syncWonderBackground } from '../wonders/background';
import { MERITS_FLAWS, type MFCategory } from './meritsFlaws';
import { MF_SUMMARY } from './meritsFlawsText';
import { randomName } from '../names/markov';
import { buildCatalog, castableBy, roteText, sphereLabel, type Rote } from '../grimoire/generate';
import { INFLUENCES } from '../grimoire/influences';

export const POSITIONS = [
  { key: 'heart', title: 'The Heart', gloss: 'who you are when no one is watching' },
  { key: 'mask', title: 'The Mask', gloss: 'the face you show the world' },
  { key: 'avatar', title: 'The Avatar', gloss: 'the spark that woke you' },
  { key: 'path', title: 'The Path', gloss: 'the company and creed you keep' },
  { key: 'root', title: 'The Root', gloss: 'the life you lived before' },
  { key: 'crossing', title: 'The Crossing', gloss: 'what stands in your way' },
  { key: 'crown', title: 'The Crown', gloss: 'what the Seeking asks of you' },
] as const;

/** Up to two more cards the seeker may choose to draw after the seven. */
export const EXTRA_POSITIONS = [
  { key: 'witness', title: 'The Witness', gloss: 'who saw you Awaken, and what they left you' },
  { key: 'omen', title: 'The Omen', gloss: 'a sign of what is coming, and its price' },
] as const;
export const MAX_EXTRA = EXTRA_POSITIONS.length;
export const ALL_POSITIONS = [...POSITIONS, ...EXTRA_POSITIONS];
export type PositionKey = (typeof ALL_POSITIONS)[number]['key'];

export interface Drawn {
  position: PositionKey;
  card: Card;
  reversed: boolean;
}

export interface LedgerEntry {
  trait: string;
  from: number;
  to: number;
  cost: number;
}

export interface Reading {
  seed: string;
  spread: Drawn[];
  /** One paragraph per position, in spread order, with what that card alone decided. */
  lines: { position: PositionKey; text: string; effects: string[] }[];
  /** What the spread decided as a whole, and why. */
  combined: { label: string; value: string; because: string }[];
  tally: Record<SuitOrMajor, number>;
  summary: string[];
  character: Character;
  faction: Faction;
  priorities: { attributes: string[]; abilities: AbilityCategory[] };
  /** The scores behind those priorities. */
  scores: { attributes: Record<string, number>; abilities: Record<string, number> };
  arete: { value: number; reason: 'crown' | 'majors' | 'default' };
  freebies: LedgerEntry[];
  /** One starting rote per Sphere the character has, each castable with their ratings. */
  rotes: { sphere: Sphere; rote: Rote }[];
}

/** How the whole spread scores each priority group: [suit or Major, weight]. */
export const SCORE_RECIPES: Record<string, [SuitOrMajor, number][]> = {
  physical: [['pentacles', 2], ['wands', 1]],
  social: [['cups', 2], ['wands', 1]],
  mental: [['swords', 2], ['major', 1]],
  talents: [['wands', 2], ['cups', 1]],
  skills: [['pentacles', 2], ['wands', 1]],
  knowledges: [['swords', 2], ['major', 1], ['cups', 1]],
};

const meaning = (d: Drawn) => (d.reversed ? d.card.reversed : d.card.upright);
const title = (d: Drawn) => `${d.card.name}${d.reversed ? ' (reversed)' : ''}`;
const kindOf = (c: Card): SuitOrMajor => (c.arcana === 'major' ? 'major' : c.suit!);

/**
 * Shuffle the whole deck, deal seven, and decide which come up reversed (about one in three).
 * Extra cards come off the same deck afterwards, so drawing them never changes the first seven.
 */
/** Which optional cards count: a number (first n of Witness, Omen) or an explicit pick. */
export type ExtraPick = number | { witness?: boolean; omen?: boolean };

function includes(pick: ExtraPick, key: PositionKey) {
  if (typeof pick === 'number') return EXTRA_POSITIONS.findIndex((p) => p.key === key) < Math.max(0, Math.min(MAX_EXTRA, pick));
  return !!pick[key as 'witness' | 'omen'];
}

/** All nine cards in a fixed order: the same cards and reversals whichever extras end up counting. */
export function dealAll(seed: string): Drawn[] {
  const rng = rngFromSeed(`deal:${seed}`);
  const deck = rng.shuffle(DECK);
  const seven: Drawn[] = POSITIONS.map((p, i) => ({ position: p.key, card: deck[i], reversed: rng.next() < 0.33 }));
  const extras: Drawn[] = EXTRA_POSITIONS.map((p, k) => ({ position: p.key, card: deck[POSITIONS.length + k], reversed: rng.next() < 0.33 }));
  return [...seven, ...extras];
}

/** The seven core cards plus whichever optional cards are picked. */
export function deal(seed: string, pick: ExtraPick = 0): Drawn[] {
  return dealAll(seed).filter((d) => POSITIONS.some((p) => p.key === d.position) || includes(pick, d.position));
}

export function readFortune(seed: string, extra: ExtraPick = 0): Reading {
  const spread = deal(seed, extra);
  const rng = rngFromSeed(`build:${seed}`);
  const at = (k: PositionKey) => spread.find((d) => d.position === k)!;
  const heart = at('heart');
  const mask = at('mask');
  const avatar = at('avatar');
  const path = at('path');
  const root = at('root');
  const crossing = at('crossing');
  const crown = at('crown');
  const witness = spread.find((d) => d.position === 'witness');
  const omen = spread.find((d) => d.position === 'omen');

  const c = blankCharacter('pc');
  // A separate stream, so naming never changes what the cards decide.
  c.name = randomName(rngFromSeed(`name:${seed}`));
  const effects: Record<PositionKey, string[]> = { heart: [], mask: [], avatar: [], path: [], root: [], crossing: [], crown: [], witness: [], omen: [] };
  const combined: Reading['combined'] = [];
  const majors = spread.filter((d) => d.card.arcana === 'major').length;
  const tally = { wands: 0, cups: 0, swords: 0, pentacles: 0, major: majors };
  for (const d of spread) if (d.card.suit) tally[d.card.suit]++;

  // ---- Step One: concept, Nature, Demeanor, Essence, Affiliation --------------------------
  c.nature = heart.reversed ? heart.card.shadow : heart.card.nature;
  effects.heart.push(`Nature: ${c.nature}`);
  let demeanor = mask.reversed ? mask.card.shadow : mask.card.nature;
  if (demeanor === c.nature) demeanor = mask.reversed ? mask.card.nature : mask.card.shadow;
  c.demeanor = demeanor;
  effects.mask.push(`Demeanor: ${c.demeanor}`);

  const essence: Essence = avatar.card.essence;
  c.essence = essence;
  effects.avatar.push(`Essence: ${essence}`);

  // Affiliation: the Path card names candidates; the Avatar's Sphere breaks the tie.
  // Only a reversed Major turns you away from the established camps.
  const candidates = path.reversed && path.card.arcana === 'major'
    ? REVERSED_PATH
    : path.card.arcana === 'major'
      ? MAJOR_FACTIONS[path.card.rank]
      : SUIT_FACTIONS[path.card.suit!];
  const avatarSpheres = avatar.card.spheres;
  const fitting = candidates.filter((n) => faction(n).affinity.some((s) => avatarSpheres.includes(s)));
  const f = faction(fitting.length ? rng.pick(fitting) : rng.pick(candidates));
  c.affiliation = f.camp === 'Orphan' ? 'Orphan (self-Awakened)' : f.camp === 'Craft' ? `${f.name} (Disparate Craft)` : `${f.name} (${f.camp})`;
  effects.path.push(`Affiliation: ${f.name}`);

  // Affinity Sphere: the Avatar's first legal Sphere for this faction.
  const affinity: Sphere =
    avatarSpheres.find((s) => f.affinity.includes(s)) ?? spread.flatMap((d) => d.card.spheres).find((s) => f.affinity.includes(s)) ?? f.affinity[0];
  effects.avatar.push(`Affinity Sphere: ${affinity}`);

  c.paradigm = path.card.paradigm;
  c.practice = path.card.practice;
  c.instruments = rng.sample(INSTRUMENTS[path.card.practice], 3).join(', ');
  effects.path.push(`Paradigm: ${c.paradigm}`, `Practice: ${c.practice}`, `Instruments: ${c.instruments}`);

  const concept = root.card.concept;
  const occupation = rng.pick(OCCUPATIONS[concept]);
  c.concept = `${concept}: ${occupation}`;
  effects.root.push(`Concept: ${concept} (${occupation})`);

  // ---- Step Two: Attributes (1 each, then 7/5/3) -----------------------------------------
  const groupScore = {
    physical: tally.pentacles * 2 + tally.wands,
    social: tally.cups * 2 + tally.wands,
    mental: tally.swords * 2 + tally.major,
  };
  const attrOrder = (Object.keys(groupScore) as (keyof typeof groupScore)[]).sort((a, b) => groupScore[b] - groupScore[a] || rng.next() - 0.5);
  const attrWeights: Record<string, number> = {};
  for (const d of spread) {
    const w = d.position === 'heart' || d.position === 'root' ? 2 : 1;
    for (const [k, v] of Object.entries(ATTRIBUTE_LEANINGS[kindOf(d.card)])) attrWeights[k] = (attrWeights[k] ?? 0) + v * w;
  }
  [7, 5, 3].forEach((dots, i) => {
    const names = ATTRIBUTES[attrOrder[i]];
    const ratings = Object.fromEntries(names.map((n) => [n, 1]));
    for (let k = 0; k < dots; k++) {
      // Dividing by the current rating keeps any one Attribute from soaking up every dot.
      const n = rng.weighted(names.filter((x) => ratings[x] < 5), (x) => (1 + (attrWeights[x] ?? 0)) / ratings[x] ** 1.5);
      ratings[n]++;
    }
    for (const n of names) c.attributes[n] = { name: n, rating: ratings[n] };
  });
  combined.push({
    label: 'Attributes',
    value: attrOrder.map((g, i) => `${cap(g)} ${[7, 5, 3][i]}`).join(' · '),
    because: `Physical ${groupScore.physical} (Pentacles ×2 + Wands), Social ${groupScore.social} (Cups ×2 + Wands), Mental ${groupScore.mental} (Swords ×2 + Majors)`,
  });

  // ---- Step Three: Abilities (13/9/5, none above 3) ---------------------------------------
  const abilityScore: Record<'talents' | 'skills' | 'knowledges', number> = {
    talents: tally.wands * 2 + tally.cups,
    skills: tally.pentacles * 2 + tally.wands,
    knowledges: tally.swords * 2 + tally.major + tally.cups,
  };
  const abilityOrder = (Object.keys(abilityScore) as (keyof typeof abilityScore)[]).sort(
    (a, b) => abilityScore[b] - abilityScore[a] || rng.next() - 0.5,
  );
  const wish: Record<string, number> = {};
  for (const d of spread) {
    const w = d.position === 'root' ? 3 : d.position === 'heart' || d.position === 'path' ? 2 : 1;
    ABILITY_LEANINGS[kindOf(d.card)].forEach((a, i) => (wish[a] = (wish[a] ?? 0) + w * (1 - i * 0.04)));
  }
  const LISTS = { talents: TALENTS, skills: SKILLS, knowledges: KNOWLEDGES };
  [13, 9, 5].forEach((dots, i) => {
    const cat = abilityOrder[i];
    const ratings: Record<string, number> = {};
    for (let k = 0; k < dots; k++) {
      const open = LISTS[cat].filter((a) => (ratings[a] ?? 0) < 3);
      const a = rng.weighted(open, (x) => 0.15 + (wish[x] ?? 0) * ((ratings[x] ?? 0) === 0 ? 1 : 0.6));
      ratings[a] = (ratings[a] ?? 0) + 1;
    }
    c.abilities[cat] = LISTS[cat].filter((a) => ratings[a]).map((a) => ({ name: a, rating: ratings[a] }));
  });
  combined.push({
    label: 'Abilities',
    value: abilityOrder.map((g, i) => `${cap(g)} ${[13, 9, 5][i]}`).join(' · '),
    because: `Talents ${abilityScore.talents} (Wands ×2 + Cups), Skills ${abilityScore.skills} (Pentacles ×2 + Wands), Knowledges ${abilityScore.knowledges} (Swords ×2 + Majors + Cups)`,
  });

  // ---- Step Four: Backgrounds (7; Avatar at least 1) --------------------------------------
  const bg: Record<string, number> = { Avatar: Math.min(4, 1 + majors) };
  combined.push({ label: 'Avatar', value: `${bg.Avatar}`, because: `1 + ${majors} Major Arcana in the spread (max 4)` });
  const bgWish: Record<string, number> = {};
  const addBg = (list: string[], w: number) => list.forEach((b, i) => (bgWish[b] = (bgWish[b] ?? 0) + w * (1 - i * 0.1)));
  addBg(BACKGROUND_LEANINGS[kindOf(root.card)], 3);
  addBg(BACKGROUND_LEANINGS[f.camp], 2);
  if (witness) addBg(BACKGROUND_LEANINGS[kindOf(witness.card)], 2.5);
  for (const d of spread) addBg(BACKGROUND_LEANINGS[kindOf(d.card)], 0.5);
  const legalBg = Object.keys(bgWish).filter((b) => f.camp === 'Technocracy' || !TECHNOCRACY_ONLY.includes(b));
  let bgLeft = 7 - bg.Avatar;
  while (bgLeft > 0) {
    const b = rng.weighted(legalBg.filter((x) => (bg[x] ?? 0) < 5), (x) => bgWish[x] * ((bg[x] ?? 0) === 0 ? 1 : 0.7));
    bg[b] = (bg[b] ?? 0) + 1;
    bgLeft--;
  }

  // ---- Step Five: Arete, Spheres, Willpower, Quintessence, freebies -----------------------
  // Arete is bought first so Spheres can rise to it (no Sphere above Arete).
  const freebies: LedgerEntry[] = [];
  let points = 15;
  const buy = (trait: string, from: number, to: number, cost: number) => {
    freebies.push({ trait, from, to, cost });
    points -= cost;
  };
  const arete = crown.card.arcana === 'major' || majors >= 3 ? 3 : 2;
  buy('Arete', 1, arete, (arete - 1) * 4);
  c.arete = arete;
  if (crown.card.arcana === 'major') effects.crown.push(`Arete: ${arete}`);
  combined.push({
    label: 'Arete',
    value: `${arete}`,
    because: crown.card.arcana === 'major' ? 'a Major Arcana at the Crown' : majors >= 3 ? `${majors} Major Arcana in the spread` : 'no Major at the Crown and fewer than three Majors',
  });

  const sphereWish: Partial<Record<Sphere, number>> = {};
  for (const d of spread) {
    const w = d.position === 'avatar' ? 3 : d.position === 'path' || d.position === 'crown' ? 2 : 1;
    d.card.spheres.forEach((s, i) => (sphereWish[s] = (sphereWish[s] ?? 0) + w * (i === 0 ? 1 : 0.6)));
  }
  const spheres: Partial<Record<Sphere, number>> = { [affinity]: 1 };
  for (let k = 1; k < 6; k++) {
    const s = rng.weighted(
      SPHERES.filter((x) => (spheres[x] ?? 0) < arete),
      (x) => 0.1 + (sphereWish[x] ?? 0) * ((spheres[x] ?? 0) === 0 ? 1 : 0.8),
    );
    spheres[s] = (spheres[s] ?? 0) + 1;
  }

  let willpower = 5;
  let quintessenceBonus = 0;
  const allAbilities = () => [...c.abilities.talents, ...c.abilities.skills, ...c.abilities.knowledges];
  const spendOn: Record<string, () => boolean> = {
    sphere: () => {
      if (points < 7) return false;
      const open = SPHERES.filter((s) => (spheres[s] ?? 0) > 0 && (spheres[s] ?? 0) < arete);
      if (!open.length) return false;
      const s = rng.weighted(open, (x) => 0.1 + (sphereWish[x] ?? 0));
      buy(s, spheres[s]!, spheres[s]! + 1, 7);
      spheres[s]!++;
      return true;
    },
    ability: () => {
      if (points < 2) return false;
      const open = allAbilities().filter((t) => t.rating < 5);
      if (!open.length) return false;
      const t = rng.weighted(open, (x) => 0.1 + (wish[x.name] ?? 0));
      buy(t.name, t.rating, t.rating + 1, 2);
      t.rating++;
      return true;
    },
    willpower: () => {
      if (points < 1 || willpower >= 10) return false;
      buy('Willpower', willpower, willpower + 1, 1);
      willpower++;
      return true;
    },
    background: () => {
      if (points < 1) return false;
      const open = legalBg.filter((b) => (bg[b] ?? 0) < 5);
      const b = rng.weighted(open, (x) => bgWish[x] ?? 0.1);
      buy(b, bg[b] ?? 0, (bg[b] ?? 0) + 1, 1);
      bg[b] = (bg[b] ?? 0) + 1;
      return true;
    },
    quintessence: () => {
      if (points < 1) return false;
      buy('Quintessence', quintessenceBonus, quintessenceBonus + 4, 1);
      quintessenceBonus += 4;
      return true;
    },
  };
  const PLAN: Record<SuitOrMajor, string[]> = {
    major: ['sphere', 'willpower', 'ability', 'background'],
    wands: ['willpower', 'willpower', 'ability', 'background'],
    cups: ['ability', 'background', 'quintessence', 'willpower'],
    swords: ['ability', 'ability', 'willpower', 'background'],
    pentacles: ['background', 'background', 'quintessence', 'ability'],
  };
  const plan = PLAN[kindOf(crown.card)];
  for (let guard = 0; points > 0 && guard < 50; guard++) {
    const step = plan[guard % plan.length];
    if (!spendOn[step]()) spendOn.background() || spendOn.willpower();
  }
  effects.crown.push(`Freebies: ${summarizeFreebies(freebies)}`);

  // ---- Merits and Flaws from the extra cards ---------------------------------------------
  // Each extra card brings a Merit (its upright gift) and a Flaw (its reversed cost) of equal
  // points, so they always balance and leave the freebie budget alone. Flaws stay within 7.
  c.meritsFlaws = [];
  let flawBudget = MAX_FLAW_POINTS;
  for (const d of spread.filter((x) => x.position === 'witness' || x.position === 'omen')) {
    // Each card has its own stream, so its Merit and Flaw don't change when the other card is turned.
    const taken = new Set(c.meritsFlaws.map((m) => m.name));
    const pair = pickMeritFlaw(d.card, Math.min(mfValue(d.card), flawBudget), rngFromSeed(`mf:${seed}:${d.position}`), taken);
    if (!pair) continue;
    flawBudget -= pair.points;
    const from = d.position === 'witness' ? 'the Witness' : 'the Omen';
    c.meritsFlaws.push({ name: pair.merit, kind: 'merit', points: pair.points, note: `from ${from}` });
    c.meritsFlaws.push({ name: pair.flaw, kind: 'flaw', points: pair.points, note: `from ${from}` });
    const say = (n: string) => (MF_SUMMARY[n] ? ` ${MF_SUMMARY[n]}` : '');
    effects[d.position].push(`Merit: ${pair.merit} (${pair.points} pt.).${say(pair.merit)}`, `Flaw: ${pair.flaw} (${pair.points} pt.).${say(pair.flaw)}`);
  }

  c.spheres = spheres;
  c.affinity = affinity;

  // ---- Starting rotes: one per Sphere, drawn from the Grimoire, all castable -----------------
  // Rotes lean toward the hands whose practices match the character's own.
  const rotes = startingRotes(spheres, seed, handsForPractice(c.practice ?? ''));
  c.rotes = rotes.map(({ rote }) => ({ name: `${rote.name} (${sphereLabel(rote.spheres)})`, desc: roteText(rote) }));
  c.willpower = { permanent: willpower, temporary: willpower };
  c.abilities.backgrounds = Object.entries(bg)
    .filter(([, v]) => v > 0)
    .map(([name, rating]) => ({ name, rating }));
  c.quintessence = bg.Avatar + quintessenceBonus;
  c.paradox = 0;
  // Its own stream, so the draw never shifts anything else the seed decides.
  const wonderRng = rngFromSeed(`wonder:${seed}`);
  Object.assign(c, syncWonderBackground(null, c, () => wonderRng.next()));

  const topBg = c.abilities.backgrounds
    .filter((b) => b.name !== 'Avatar')
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 2)
    .map((b) => b.name);
  effects.root.push(`Backgrounds lean to ${topBg.join(' and ')}`);
  const wonder = c.wonders?.find((w) => w.fromBackground);
  if (wonder) effects.root.push(`Wonder: ${wonder.name} (${wonder.kind}, ${wonder.rating} ${wonder.rating === 1 ? 'dot' : 'dots'})`);
  if (witness) effects.witness.push(`Backgrounds: ${BACKGROUND_LEANINGS[kindOf(witness.card)].slice(0, 2).join(' or ')} weigh more`);
  if (omen) effects.omen.push('Story hook for the Storyteller');

  // ---- The reading -------------------------------------------------------------------------
  const lines: Reading['lines'] = [
    {
      position: 'heart',
      text: `At your heart lies ${title(heart)}: ${meaning(heart)}. Beneath every role you play, you are ${ARTICLE(c.nature)} ${c.nature}.`,
      effects: effects.heart,
    },
    {
      position: 'mask',
      text: `Over it you wear ${title(mask)}: ${meaning(mask)}. The world meets ${ARTICLE(c.demeanor)} ${c.demeanor}.`,
      effects: effects.mask,
    },
    {
      position: 'avatar',
      text: `Your Avatar comes as ${title(avatar)}: ${meaning(avatar)}. Its Essence is ${essence}, and it reaches first for ${affinity}.`,
      effects: effects.avatar,
    },
    {
      position: 'path',
      text: `${title(path)} lies across your Path: ${meaning(path)}. ${pathSentence(f)} Your paradigm is “${c.paradigm}”, and you work through ${c.practice}: ${c.instruments}.`,
      effects: effects.path,
    },
    {
      position: 'root',
      text: `At the root is ${title(root)}: ${meaning(root)}. Before the Awakening you were ${ARTICLE(occupation)} ${occupation}, and that life still feeds you through ${topBg.join(' and ')}.`,
      effects: effects.root,
    },
    {
      position: 'crossing',
      text: `${title(crossing)} crosses you: ${meaning(crossing)}. ${crossingQuestion(crossing)}`,
      effects: effects.crossing,
    },
    {
      position: 'crown',
      text: `${title(crown)} crowns the spread: ${meaning(crown)}. That is what the Seeking will ask of you.`,
      effects: effects.crown,
    },
  ];
  effects.crossing.push('Story hook for the Storyteller');
  if (witness) {
    lines.push({
      position: 'witness',
      text: `${title(witness)} witnessed your Awakening: ${meaning(witness)}. ${witnessSentence(witness)}`,
      effects: effects.witness,
    });
  }
  if (omen) {
    lines.push({ position: 'omen', text: `${title(omen)} is your omen: ${meaning(omen)}. ${crossingQuestion(omen)}`, effects: effects.omen });
  }
  combined.push({
    label: 'Rotes',
    value: rotes.map((r) => r.sphere).join(', '),
    because: 'one rote from the Grimoire for each Sphere, all within the character\'s ratings',
  });
  if (c.meritsFlaws.length) {
    const pts = c.meritsFlaws.filter((m) => m.kind === 'merit').reduce((t, m) => t + m.points, 0);
    combined.push({
      label: 'Merits & Flaws',
      value: `${pts} pt. of Merits, ${pts} pt. of Flaws`,
      because: 'each extra card brings a Merit and a Flaw of equal points, so they cost no freebies',
    });
  }
  for (const d of spread.filter((x) => x.position === 'witness' || x.position === 'omen')) {
    combined.push({ label: `${ALL_POSITIONS.find((p) => p.key === d.position)!.title}`, value: d.card.arcana === 'major' ? 'Major Arcana' : SUITS[d.card.suit!].label, because: 'counts toward the suit and Major totals above' });
  }

  const dominant = (Object.entries(tally) as [SuitOrMajor, number][]).sort((a, b) => b[1] - a[1])[0];
  const summary = [
    dominant[1] >= 3
      ? dominant[0] === 'major'
        ? `${dominant[1]} Major Arcana: fate has its eye on you. A strong Avatar, and a story larger than you.`
        : `${SUITS[dominant[0] as keyof typeof SUITS].label} dominate the spread (${dominant[1]} of ${spread.length}): a life of ${SUITS[dominant[0] as keyof typeof SUITS].theme}.`
      : 'No suit rules the spread: a life pulled in several directions.',
    `${spread.filter((d) => d.reversed).length} of ${spread.length} cards came up reversed.`,
  ];

  c.notes = [...lines.map((l) => `${ALL_POSITIONS.find((p) => p.key === l.position)!.title}. ${l.text}`), '', ...summary].join('\n\n');
  c.extra = {
    fortune: `Seed ${seed}${(() => {
      const extras = spread.filter((d) => !POSITIONS.some((p) => p.key === d.position)).map((d) => (d.position === 'witness' ? 'Witness' : 'Omen'));
      return extras.length ? `, with the ${extras.join(' and ')}` : '';
    })()}`,
    'build ledger': [
      `Attributes: ${attrOrder.map((g, i) => `${cap(g)} ${[7, 5, 3][i]}`).join(', ')}`,
      `Abilities: ${abilityOrder.map((g, i) => `${cap(g)} ${[13, 9, 5][i]}`).join(', ')}`,
      'Backgrounds 7, Spheres 6 (affinity first), Arete 1, Willpower 5',
      ...freebies.map((e) => `Freebie: ${e.trait} ${e.from} → ${e.to} (${e.cost})`),
    ].join('\n'),
    'the crossing': `${crossing.card.name}${crossing.reversed ? ' (reversed)' : ''}: ${meaning(crossing)}. ${crossingQuestion(crossing)}`,
  };

  return {
    seed,
    spread,
    lines,
    combined,
    tally,
    summary,
    character: c,
    faction: f,
    priorities: { attributes: attrOrder, abilities: abilityOrder },
    scores: { attributes: groupScore, abilities: abilityScore },
    arete: { value: arete, reason: crown.card.arcana === 'major' ? 'crown' : majors >= 3 ? 'majors' : 'default' },
    freebies,
    rotes,
  };
}

function cap(s: string) {
  return s[0].toUpperCase() + s.slice(1);
}

function pathSentence(f: Faction) {
  if (f.camp === 'Orphan') return 'No Tradition claims you; you Awakened alone and taught yourself.';
  if (f.camp === 'Craft') return `You keep company with the ${f.name}, outside both Council and Union.`;
  if (f.camp === 'Technocracy') return `The ${f.name} recruited you, and the Union expects results.`;
  return `The ${f.name} took you in.`;
}

function crossingQuestion(d: Drawn) {
  const q: Record<SuitOrMajor, string> = {
    wands: 'Who would you fight to keep from losing, and who are you already fighting?',
    cups: 'Whose love, or whose grief, is holding you back?',
    swords: 'What truth have you been refusing to look at?',
    pentacles: 'What do you owe, and to whom?',
    major: 'Something larger than you has taken an interest. What does it want?',
  };
  return q[kindOf(d.card)];
}

/** Hands (Grimoire styles) that share a practice with the character. */
export function handsForPractice(practice: string) {
  return INFLUENCES.filter((i) => i.practices.includes(practice)).map((i) => i.key);
}

let catalogCache: Rote[] | null = null;
const catalog = () => (catalogCache ??= buildCatalog());

/**
 * For each Sphere the character has, pick a Grimoire rote that uses that Sphere and whose every
 * requirement is within the character's ratings. Rotes that use
 * the full rating in that Sphere are favoured. A separate random stream keeps the rest of the
 * reading unchanged.
 */
export function startingRotes(spheres: Partial<Record<Sphere, number>>, seed: string, preferredHands: string[] = []) {
  const rng = rngFromSeed(`rotes:${seed}`);
  const used = new Set<string>();
  const out: { sphere: Sphere; rote: Rote }[] = [];
  for (const s of SPHERES) {
    const rating = spheres[s] ?? 0;
    if (!rating) continue;
    const options = catalog().filter((r) => !used.has(r.id) && r.spheres[s] && castableBy(r, spheres));
    if (!options.length) continue;
    const rote = rng.weighted(options, (r) => (1 + 3 * ((r.spheres[s] ?? 0) === rating ? 1 : 0)) * (preferredHands.includes(r.influence) ? 8 : 1));
    used.add(rote.id);
    out.push({ sphere: s, rote });
  }
  return out;
}

const MAX_FLAW_POINTS = 7;

/** Traits that don't fit a starting mage or need a whole chronicle built around them. */
const MF_EXCLUDE = new Set([
  'Child', 'Aging', 'Mayfly Curse', 'Degeneration', 'Ghoul', 'Fae Blood', 'Shapechanger Kin', 'Sterile', 'Bigot',
  'Extreme Kink', 'Noble Blood', 'Huge Size', 'Officially Dead', 'Phylactery', 'Taint of Corruption',
]);

/** Merit category, then Flaw category, by suit. */
const MF_CATEGORIES: Record<SuitOrMajor, [MFCategory[], MFCategory[]]> = {
  wands: [['Physical'], ['Physical', 'Social']],
  cups: [['Social'], ['Mental']],
  swords: [['Mental'], ['Social']],
  pentacles: [['Social', 'Physical'], ['Physical', 'Social']],
  major: [['Supernatural'], ['Supernatural']],
};

/** Points by rank: pips 1–3, courts 3–4, Majors 3–4. */
function mfValue(card: Card) {
  if (card.arcana === 'major') return card.rank <= 10 ? 3 : 4;
  if (card.rank <= 4) return 1;
  if (card.rank <= 7) return 2;
  if (card.rank <= 13) return 3;
  return 4;
}

function pickMeritFlaw(card: Card, value: number, rng: Random, taken: Set<string> = new Set()) {
  const [mc, fc] = MF_CATEGORIES[kindOf(card)];
  // Pick from the full list and re-pick only on a clash, so one card's choice never shifts
  // because of what the other card took.
  const pickFree = (pool: { name: string }[], avoid: Set<string>) => {
    for (let i = 0; i < 20; i++) {
      const m = rng.pick(pool);
      if (!avoid.has(m.name)) return m.name;
    }
    return pool.find((m) => !avoid.has(m.name))?.name ?? null;
  };
  for (let v = value; v >= 1; v--) {
    const ok = (kind: 'merit' | 'flaw', cats: MFCategory[]) =>
      MERITS_FLAWS.filter((m) => m.kind === kind && cats.includes(m.category) && m.costs.includes(v) && !MF_EXCLUDE.has(m.name));
    const merits = ok('merit', mc);
    const flaws = ok('flaw', fc);
    if (!merits.length || !flaws.length) continue;
    const merit = pickFree(merits, taken);
    if (!merit) continue;
    const flaw = pickFree(flaws, new Set([...taken, merit]));
    if (!flaw) continue;
    return { merit, flaw, points: v };
  }
  return null;
}

function witnessSentence(d: Drawn) {
  const who: Record<SuitOrMajor, string> = {
    wands: 'They were a rival, and they want what you found.',
    cups: 'They were a lover or a friend, and they still check on you.',
    swords: 'They were a cop, a scholar or a reporter, and they are still asking questions.',
    pentacles: 'They were an employer, a landlord or a patron, and they think you owe them.',
    major: 'It was not entirely a person, and it is still watching.',
  };
  return who[kindOf(d.card)];
}

function summarizeFreebies(entries: LedgerEntry[]) {
  const by = new Map<string, number>();
  for (const e of entries) by.set(e.trait, (by.get(e.trait) ?? 0) + e.cost);
  return [...by.entries()].map(([t, cost]) => `${t} ${cost}`).join(', ');
}

// ---------------------------------------------------------------------------
// Legality check: undo the freebie purchases and confirm the base allocation follows M20 creation.

export function validate(r: Reading): string[] {
  const errs: string[] = [];
  const c = r.character;
  const freebieCost = r.freebies.reduce((s, e) => s + e.cost, 0);
  if (freebieCost !== 15) errs.push(`freebies spent ${freebieCost}, expected 15`);
  const raised = (trait: string) => r.freebies.filter((e) => e.trait === trait).reduce((s, e) => s + (e.to - e.from), 0);

  const attrSums = r.priorities.attributes.map((g) => ATTRIBUTES[g as keyof typeof ATTRIBUTES].reduce((s, n) => s + c.attributes[n].rating - 1, 0));
  if (attrSums.join() !== '7,5,3') errs.push(`attribute dots ${attrSums.join('/')}`);
  for (const t of Object.values(c.attributes)) if (t.rating < 1 || t.rating > 5) errs.push(`${t.name} ${t.rating}`);

  r.priorities.abilities.forEach((cat, i) => {
    const base = c.abilities[cat].map((t) => ({ name: t.name, rating: t.rating - raised(t.name) }));
    const sum = base.reduce((s, t) => s + t.rating, 0);
    if (sum !== [13, 9, 5][i]) errs.push(`${cat} base ${sum}`);
    for (const t of base) if (t.rating > 3) errs.push(`${t.name} base ${t.rating} above 3`);
    const list = cat === 'talents' ? TALENTS : cat === 'skills' ? SKILLS : KNOWLEDGES;
    for (const t of c.abilities[cat]) if (!list.includes(t.name)) errs.push(`${t.name} not a primary ${cat}`);
    for (const t of c.abilities[cat]) if (t.rating > 5) errs.push(`${t.name} ${t.rating}`);
  });

  const bgBase = c.abilities.backgrounds.reduce((s, b) => s + b.rating - raised(b.name), 0);
  if (bgBase !== 7) errs.push(`backgrounds base ${bgBase}`);
  const avatar = c.abilities.backgrounds.find((b) => b.name === 'Avatar')?.rating ?? 0;
  if (avatar < 1) errs.push('no Avatar');
  for (const b of c.abilities.backgrounds) {
    if (b.rating > 5) errs.push(`${b.name} ${b.rating}`);
    if (r.faction.camp !== 'Technocracy' && TECHNOCRACY_ONLY.includes(b.name)) errs.push(`${b.name} outside the Technocracy`);
  }

  if (c.arete < 1 || c.arete > 3) errs.push(`Arete ${c.arete}`);
  if (raised('Arete') !== c.arete - 1) errs.push('Arete not bought with freebies');
  const sphereBase = SPHERES.reduce((s, x) => s + (c.spheres[x] ?? 0) - raised(x), 0);
  if (sphereBase !== 6) errs.push(`sphere base ${sphereBase}`);
  for (const x of SPHERES) if ((c.spheres[x] ?? 0) > c.arete) errs.push(`${x} above Arete`);
  const affinity = r.lines.find((l) => l.position === 'avatar')!.effects.find((e) => e.startsWith('Affinity'))!.split(': ')[1] as Sphere;
  if (!r.faction.affinity.includes(affinity)) errs.push(`${affinity} not an affinity for ${r.faction.name}`);
  if (!(c.spheres[affinity] ?? 0)) errs.push('affinity Sphere has no dot');

  if (c.willpower.permanent - raised('Willpower') !== 5) errs.push('Willpower base not 5');
  const mf = c.meritsFlaws ?? [];
  const meritPts = mf.filter((m) => m.kind === 'merit').reduce((t, m) => t + m.points, 0);
  const flawPts = mf.filter((m) => m.kind === 'flaw').reduce((t, m) => t + m.points, 0);
  if (meritPts !== flawPts) errs.push(`Merits ${meritPts} vs Flaws ${flawPts}`);
  if (flawPts > 7) errs.push(`Flaws ${flawPts} over 7`);
  const extras = r.spread.filter((d) => d.position === 'witness' || d.position === 'omen').length;
  if (mf.length !== extras * 2) errs.push(`${mf.length} Merits/Flaws for ${extras} extra cards`);
  const owned = SPHERES.filter((x) => (c.spheres[x] ?? 0) > 0);
  if (r.rotes.map((x) => x.sphere).join() !== owned.join()) errs.push(`rotes cover ${r.rotes.map((x) => x.sphere).join()} not ${owned.join()}`);
  for (const { sphere, rote } of r.rotes) {
    if (!castableBy(rote, c.spheres)) errs.push(`${rote.name} needs ${sphereLabel(rote.spheres)}`);
    if (!(rote.spheres[sphere] ?? 0)) errs.push(`${rote.name} doesn't use ${sphere}`);
  }
  if (c.rotes.length !== r.rotes.length) errs.push('rotes missing from sheet');
  if (c.quintessence - raised('Quintessence') !== avatar) errs.push('Quintessence base not Avatar');
  return errs;
}

export function newSeed(): string {
  const a = new Uint32Array(2);
  crypto.getRandomValues(a);
  return (a[0].toString(36) + a[1].toString(36)).slice(0, 10);
}

export type { Random };
