import type { HandoutStyle } from '../handouts/templates';
export const ATTRIBUTES = {
  physical: ['Strength', 'Dexterity', 'Stamina'],
  social: ['Charisma', 'Manipulation', 'Appearance'],
  mental: ['Perception', 'Intelligence', 'Wits'],
} as const;
export const ATTRIBUTE_NAMES = [...ATTRIBUTES.physical, ...ATTRIBUTES.social, ...ATTRIBUTES.mental];

export const SPHERES = ['Correspondence', 'Entropy', 'Forces', 'Life', 'Matter', 'Mind', 'Prime', 'Spirit', 'Time'] as const;
export type Sphere = (typeof SPHERES)[number];

export type AbilityCategory = 'talents' | 'skills' | 'knowledges' | 'backgrounds';

export interface Trait {
  name: string;
  rating: number;
  specialty?: string;
}

export interface HealthLevel {
  name: string;
  penalty: number; // dice removed from pools; -99 for Incapacitated
}

export type Damage = 'B' | 'L' | 'A';

export interface MeritFlaw {
  name: string;
  kind: 'merit' | 'flaw';
  points: number;
  note?: string;
}

export interface Character {
  id: string;
  kind: 'pc' | 'npc';
  name: string;
  concept?: string;
  affiliation?: string;
  image?: string; // data URL
  nature?: string;
  demeanor?: string;
  essence?: string;
  paradigm?: string;
  practice?: string;
  instruments?: string;
  attributes: Record<string, Trait>;
  abilities: Record<AbilityCategory, Trait[]>;
  spheres: Partial<Record<Sphere, number>>;
  arete: number;
  willpower: { permanent: number; temporary: number };
  quintessence: number;
  paradox: number;
  permanentParadox: number;
  health: { levels: HealthLevel[]; damage: Damage[] }; // damage fills levels from the top, worst first
  /** Paradox Flaws (from backlashes). */
  flaws: string[];
  /** Character-creation Merits and Flaws (Book of Secrets). Older saves may lack this. */
  meritsFlaws?: MeritFlaw[];
  rotes: { name: string; desc: string }[];
  notes: string;
  extra: Record<string, string>; // unmapped statblock fields, shown read-only
}

export const STANDARD_HEALTH: HealthLevel[] = [
  { name: 'Bruised', penalty: 0 },
  { name: 'Hurt', penalty: -1 },
  { name: 'Injured', penalty: -1 },
  { name: 'Wounded', penalty: -2 },
  { name: 'Mauled', penalty: -2 },
  { name: 'Crippled', penalty: -5 },
  { name: 'Incapacitated', penalty: -99 },
];

export const WHEEL_SIZE = 20; // Quintessence and Paradox share one 20-point wheel

export function newId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function blankCharacter(kind: Character['kind'] = 'pc'): Character {
  return {
    id: newId(),
    kind,
    name: 'New character',
    attributes: Object.fromEntries(ATTRIBUTE_NAMES.map((n) => [n, { name: n, rating: 1 }])),
    abilities: { talents: [], skills: [], knowledges: [], backgrounds: [] },
    spheres: {},
    arete: 1,
    willpower: { permanent: 5, temporary: 5 },
    quintessence: 0,
    paradox: 0,
    permanentParadox: 0,
    health: { levels: STANDARD_HEALTH.map((l) => ({ ...l })), damage: [] },
    flaws: [],
    meritsFlaws: [],
    rotes: [],
    notes: '',
    extra: {},
  };
}

export function highestSphere(c: Character) {
  return Math.max(0, ...Object.values(c.spheres).map((v) => v ?? 0));
}

/** Current wound penalty: the level of the last damaged box. */
export function woundPenalty(c: Character) {
  const n = c.health.damage.length;
  if (n === 0) return 0;
  const level = c.health.levels[Math.min(n, c.health.levels.length) - 1];
  return level?.penalty ?? 0;
}

export function allTraits(c: Character): Trait[] {
  return [
    ...Object.values(c.attributes),
    ...c.abilities.talents,
    ...c.abilities.skills,
    ...c.abilities.knowledges,
    ...c.abilities.backgrounds,
  ];
}

// ---------------------------------------------------------------------------

export interface Handout {
  id: string;
  title: string;
  image?: string; // data URL
  text?: string;
  /** Template look for a text handout; plain parchment when absent. */
  style?: HandoutStyle;
}

export interface LogEntry {
  id: string;
  at: number;
  who?: string;
  label: string;
  summary: string;
  faces: number[];
  difficulty: number;
  outcome: 'success' | 'failure' | 'botch' | 'info';
  paradox?: number;
  public: boolean;
}

export interface Clock {
  label: string;
  /** Epoch ms when a countdown ends, or undefined for a plain label. */
  endsAt?: number;
  segments?: { total: number; filled: number };
}

export interface Scene {
  title: string;
  subtitle: string;
}

export interface InitiativeEntry {
  id: string;
  name: string;
  /** Final initiative: one die + Dexterity + Wits (M20 p. 399). */
  score: number;
  characterId?: string;
}

export interface Initiative {
  entries: InitiativeEntry[]; // sorted, highest first
  current: number;
  round: number;
}

/** What the player screen shows. */
export interface ScreenOptions {
  showParty: boolean;
  showRolls: boolean;
}

export interface ChronicleSettings {
  era: string; // e.g. "1990"
  place: string;
  notes: string;
}

export interface Chronicle {
  version: 1;
  name: string;
  settings: ChronicleSettings;
  characters: Character[];
  handouts: Handout[];
  log: LogEntry[];
  clock: Clock | null;
  shownHandout: string | null;
  scene?: Scene | null;
  initiative?: Initiative | null;
  screen?: ScreenOptions;
}

export const UNTITLED_CHRONICLE = 'Untitled chronicle';

/** The chronicle's name if the Storyteller has given it one, otherwise ''. */
export function chronicleTitle(c: Pick<Chronicle, 'name'>) {
  const name = c.name.trim();
  return name === UNTITLED_CHRONICLE ? '' : name;
}

export function blankChronicle(): Chronicle {
  return {
    version: 1,
    name: UNTITLED_CHRONICLE,
    settings: { era: '', place: '', notes: '' },
    characters: [],
    handouts: [],
    log: [],
    clock: null,
    shownHandout: null,
  };
}
