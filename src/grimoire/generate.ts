// Combine an effect, up to two modifiers and an influence into a rote. Deterministic per seed.
import { SPHERES, type Sphere } from '../model/types';
import { rngFromSeed, type Random } from '../fortune/random';
import { EFFECTS, MODIFIERS, type Effect, type Modifier, type Reqs } from './effects';
import { INFLUENCES, influence, type Influence } from './influences';

export interface Rote {
  id: string;
  name: string;
  influence: string;
  effect: string;
  modifiers: string[];
  spheres: Reqs;
  highest: number;
  successes: number;
  mode: 'coincidental' | 'vulgar' | 'either';
  /** Coincidental and vulgar difficulties (vulgar with witnesses is +1 more). */
  difficulty: { coincidental?: number; vulgar?: number };
  practice: string;
  ability: string;
  description: string;
  system: string[];
  cover?: string;
  backlash: string;
  quote: string;
  factions: string[];
  harm: boolean;
}


export function mergeReqs(...rs: Reqs[]): Reqs {
  const out: Reqs = {};
  for (const r of rs) for (const [s, n] of Object.entries(r) as [Sphere, number][]) out[s] = Math.max(out[s] ?? 0, n);
  return out;
}

export const sphereLabel = (r: Reqs) =>
  SPHERES.filter((s) => r[s])
    .sort((a, b) => (r[b] ?? 0) - (r[a] ?? 0))
    .map((s) => `${s} ${r[s]}`)
    .join(', ');

function compatible(e: Effect, m: Modifier, chosen: Modifier[]) {
  if (!m.allows.includes(e.target)) return false;
  if (m.harmOnly && !e.harm) return false;
  if (m.notVulgar && e.mode === 'vulgar') return false;
  if (m.excludeIf?.some((s) => e.spheres[s])) return false;
  if (chosen.some((c) => c.id === m.id || Object.keys(c.spheres).some((s) => (m.spheres as Reqs)[s as Sphere]))) return false;
  return true;
}

function fill(template: string, rng: Random, inf: Influence, noun: string, name: string) {
  const out = template
    .replace('{A}', rng.pick(inf.adjectives))
    .replace('{E}', noun)
    .replace('{X}', rng.pick(inf.abstracts))
    .replace(/\{N\}/g, name)
    .replace(/s's\b/g, "s'");
  return out.charAt(0).toUpperCase() + out.slice(1);
}

export function makeRote(seed: string, opts: { influence?: string } = {}): Rote {
  const rng = rngFromSeed(seed);
  const inf = opts.influence ? influence(opts.influence) : rng.pick(INFLUENCES);
  // Effects lean toward the influence's favourite Spheres.
  const effect = rng.weighted(EFFECTS, (e) =>
    Object.keys(e.spheres).reduce((w, s) => w + (inf.sphereBias[s as Sphere] ?? 0), 0.6),
  );
  const mods: Modifier[] = [];
  const want = rng.next() < 0.45 ? 0 : rng.next() < 0.7 ? 1 : 2;
  for (let k = 0; k < want; k++) {
    const options = MODIFIERS.filter((m) => compatible(effect, m, mods));
    if (!options.length) break;
    mods.push(rng.pick(options));
  }
  const spheres = mergeReqs(effect.spheres, ...mods.map((m) => m.spheres));
  const highest = Math.max(...Object.values(spheres).map((n) => n ?? 0));
  const successes = effect.successes + mods.reduce((s, m) => s + m.extraSuccesses, 0);
  const mode = effect.mode;
  const difficulty = {
    coincidental: mode === 'vulgar' ? undefined : highest + 3,
    vulgar: mode === 'coincidental' ? undefined : highest + 4,
  };
  const entity = inf.names ? rng.pick(inf.names) : '';
  const noun = rng.pick(effect.nouns);
  const name = fill(rng.pick(inf.templates), rng, inf, noun, entity);
  const instrument = rng.pick(inf.instruments);
  const sense = rng.pick(inf.senses).replace(/\{N\}/g, entity);
  const clauses = mods.map((m) => m.clause);
  const opener = rng.pick(['With', 'Using', 'Working through', 'By way of']);
  const description = [`${opener} ${instrument}, the mage ${effect.act}.`, ...clauses, sense].join(' ');
  const living = effect.target === 'self' || effect.target === 'other';
  const cover = mode === 'vulgar' ? undefined : rng.pick(living ? inf.covers.body : inf.covers.world);
  const system = [
    effect.system,
    ...mods.map((m) => m.system),
    mode === 'coincidental'
      ? `Coincidental: it passes for ${cover}.`
      : mode === 'either'
        ? `Coincidental when it can pass for ${cover}; otherwise vulgar.`
        : 'Vulgar.',
  ];
  return {
    id: seed,
    name,
    influence: inf.key,
    effect: effect.id,
    modifiers: mods.map((m) => m.id),
    spheres,
    highest,
    successes,
    mode,
    difficulty,
    practice: rng.pick(inf.practices),
    ability: rng.pick(inf.abilities),
    description,
    system,
    cover,
    backlash: rng.pick(inf.backlash).replace(/\{N\}/g, entity),
    quote: rng.pick(inf.quotes).replace(/\{N\}/g, entity),
    factions: inf.factions,
    harm: !!effect.harm,
  };
}

export const CATALOG_SEED = 'grimoire-v1';
export const CATALOG_SIZE = 720;

/** The standing catalog: the same rotes, ids and names on every load. Each influence gets an equal share. */
export function buildCatalog(seed = CATALOG_SEED, size = CATALOG_SIZE): Rote[] {
  const out: Rote[] = [];
  const names = new Set<string>();
  for (let i = 0; out.length < size && i < size * 4; i++) {
    const inf = INFLUENCES[out.length % INFLUENCES.length].key;
    const r = makeRote(`${seed}:${i}`, { influence: inf });
    if (names.has(r.name)) continue;
    names.add(r.name);
    out.push(r);
  }
  return out;
}

/** A fresh handful for the Randomize button. */
export function conjure(seed: string, n = 12, hand?: string): Rote[] {
  const out: Rote[] = [];
  const names = new Set<string>();
  for (let i = 0; out.length < n && i < n * 4; i++) {
    const r = makeRote(`${seed}:${i}`, { influence: hand || undefined });
    if (names.has(r.name)) continue;
    names.add(r.name);
    out.push(r);
  }
  return out;
}

/** Can this character cast the rote? Every required Sphere at or below their rating. */
export function castableBy(r: Rote, spheres: Partial<Record<Sphere, number>>) {
  return (Object.entries(r.spheres) as [Sphere, number][]).every(([s, n]) => (spheres[s] ?? 0) >= n);
}

export function roteText(r: Rote) {
  const diff = [
    r.difficulty.coincidental !== undefined ? `coincidental ${r.difficulty.coincidental}` : '',
    r.difficulty.vulgar !== undefined ? `vulgar ${r.difficulty.vulgar} (${r.difficulty.vulgar + 1} with witnesses)` : '',
  ]
    .filter(Boolean)
    .join(', ');
  return `${r.description} Difficulty ${diff}; ${r.successes} success${r.successes === 1 ? '' : 'es'} for the standard result. ${r.system.join(' ')} Focus: ${r.practice}; ${r.ability} for any mundane focus roll. ${r.backlash}`;
}
