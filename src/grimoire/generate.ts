// The Grimoire catalog: written rotes, one effect each, grouped by hand. Derived numbers
// (highest rank, difficulties) are computed here so they always follow the casting rules.
import { SPHERES, type Sphere } from '../model/types';
import { rngFromSeed } from '../fortune/random';
import type { Mode, Reqs, RoteSource } from './types';
import { INFLUENCES, influence } from './influences';
import { HAND_ROTES } from './rotes';

export type { Reqs } from './types';

export interface Rote {
  id: string;
  name: string;
  influence: string;
  spheres: Reqs;
  highest: number;
  successes: number;
  mode: Mode;
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

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function toRote(hand: string, src: RoteSource): Rote {
  const highest = Math.max(...Object.values(src.spheres).map((n) => n ?? 0));
  const { mode, cover } = src;
  return {
    id: `${hand}:${slug(src.name)}`,
    name: src.name,
    influence: hand,
    spheres: src.spheres,
    highest,
    successes: src.successes,
    mode,
    difficulty: {
      coincidental: mode === 'vulgar' ? undefined : highest + 3,
      vulgar: mode === 'coincidental' ? undefined : highest + 4,
    },
    practice: src.practice,
    ability: src.ability,
    description: src.text,
    system: [
      src.system,
      mode === 'coincidental' ? `Coincidental: it passes for ${cover}.` : mode === 'either' ? `Coincidental when it can pass for ${cover}; otherwise vulgar.` : 'Vulgar.',
    ],
    cover: mode === 'vulgar' ? undefined : cover,
    backlash: src.backlash,
    quote: src.quote,
    factions: influence(hand).factions,
    harm: !!src.harm,
  };
}

let cache: Rote[] | null = null;

/** The whole catalog, dealt round-robin across the hands so any page of it shows a mix. */
export function buildCatalog(): Rote[] {
  if (cache) return cache;
  const hands = INFLUENCES.map((inf) => (HAND_ROTES[inf.key] ?? []).map((r) => toRote(inf.key, r)));
  const longest = Math.max(...hands.map((h) => h.length));
  cache = [];
  for (let i = 0; i < longest; i++) for (const h of hands) if (h[i]) cache.push(h[i]);
  return cache;
}

export const CATALOG_SIZE = buildCatalog().length;

/** A reproducible handful for the Conjure tab: a seeded draw from the catalog, optionally from one hand. */
export function conjure(seed: string, n = 12, hand?: string): Rote[] {
  const rng = rngFromSeed(seed);
  const pool = buildCatalog().filter((r) => !hand || r.influence === hand);
  const out: Rote[] = [];
  const left = [...pool];
  while (out.length < n && left.length) out.push(left.splice(Math.floor(rng.next() * left.length), 1)[0]);
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
