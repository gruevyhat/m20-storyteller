// Import characters from Obsidian Fantasy Statblocks blocks using an M20-style layout:
//   ```statblock
//   name: …
//   physical: ["●●○○○", …]
//   talents: "Alertness ●●○○○, Awareness ●●●●○ (ghosts), …"
//   ```
import { parse } from 'yaml';
import {
  ATTRIBUTES,
  SPHERES,
  STANDARD_HEALTH,
  WONDER_KINDS,
  blankCharacter,
  type AbilityCategory,
  type Character,
  type HealthLevel,
  type Resonance,
  type Trait,
  type Wonder,
} from '../model/types';

const BLOCK = /```statblock\s*\n([\s\S]*?)```/g;

const dots = (s: string) => (s.match(/●/g) ?? []).length;

/** "●●●●○ (quiet presence)" → { rating: 4, specialty: "quiet presence" } */
export function parseDots(value: unknown): { rating: number; specialty?: string } {
  const s = String(value ?? '');
  const spec = s.match(/[●○]+\s*\(([^)]*)\)/)?.[1];
  const digit = s.match(/^\s*(\d+)/)?.[1];
  return { rating: digit ? Number(digit) : dots(s), specialty: spec || undefined };
}

/** "Alertness ●●○○○, Awareness ●●●●○ (ghosts and presences)" → traits */
export function parseTraitList(value: unknown): Trait[] {
  const s = String(value ?? '');
  const out: Trait[] = [];
  const re = /([^,●○]+?)\s*([●○]+)(?:\s*\(([^)]*)\))?/g;
  for (const m of s.matchAll(re)) {
    const name = m[1].replace(/^[\s,]+/, '').trim();
    if (!name) continue;
    out.push({ name, rating: dots(m[2]), specialty: m[3] || undefined });
  }
  return out;
}

// Core M20 primary Abilities, used to sort a combined `abilities:` field. Anything else counts as a Skill.
const TALENTS = ['Alertness', 'Art', 'Athletics', 'Awareness', 'Brawl', 'Empathy', 'Expression', 'Intimidation', 'Leadership', 'Streetwise', 'Subterfuge'];
const KNOWLEDGES = ['Academics', 'Computer', 'Cosmology', 'Enigmas', 'Esoterica', 'Investigation', 'Law', 'Medicine', 'Occult', 'Politics', 'Science'];

export function categorize(t: Trait): AbilityCategory {
  if (TALENTS.includes(t.name)) return 'talents';
  if (KNOWLEDGES.includes(t.name)) return 'knowledges';
  return 'skills';
}

const firstNumber = (v: unknown) => Number(String(v ?? '').match(/\d+/)?.[0] ?? 0);

/** "Bruised ×4 · Hurt −1 · … · Incapacitated" → levels. Falls back to the standard seven. */
export function parseHealthTrack(track: unknown, count?: number): HealthLevel[] {
  const s = String(track ?? '').split('(')[0];
  const levels: HealthLevel[] = [];
  for (const part of s.split('·')) {
    const m = part.trim().match(/^([A-Za-z]+|[−-]\d+)\s*(?:×\s*(\d+))?\s*([−-]\s*\d+)?/);
    if (!m) continue;
    const name = m[1];
    const times = m[2] ? Number(m[2]) : 1;
    const terminal = ['incapacitated', 'dead', 'squished', 'dematerialized', 'dissolved'].includes(name.toLowerCase());
    const numericPenalty = m[3] ?? (/^[−-]\d+$/.test(name) ? name : undefined);
    const penalty = terminal ? -99 : numericPenalty ? -Number(numericPenalty.replace(/[\s−-]/g, '')) : 0;
    for (let i = 0; i < times; i++) levels.push({ name, penalty });
  }
  const base = levels.length ? levels : STANDARD_HEALTH.map((l) => ({ ...l }));
  // Pad with extra Bruised levels if the block says there are more levels than the track lists.
  while (count && base.length < count) base.unshift({ name: 'Bruised', penalty: 0 });
  return base;
}

const MAPPED = new Set([
  'layout', 'name', 'concept', 'affiliation', 'image', 'nature', 'demeanor', 'essence', 'paradigm', 'practice',
  'instruments', 'physical', 'social', 'mental', 'abilities', 'talents', 'skills', 'knowledges', 'backgrounds', 'spheres',
  'arete', 'willpower', 'quintessence', 'paradox', 'health', 'health_track', 'rotes', 'merits', 'flaws',
  'affinity', 'resonance', 'wonders', 'avatar_notes', 'experience',
]);

/** "Lucky 3, Cursed (2 pt.), Iron Will" → name and points. */
export function parsePointList(value: unknown, kind: 'merit' | 'flaw') {
  return String(value ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => {
      const m = x.match(/^(.*?)\s*\(?(\d+)\s*(?:pt\.?|points?)?\)?$/i);
      return m ? { name: m[1].trim(), kind, points: Number(m[2]) } : { name: x, kind, points: 1 };
    });
}

export function characterFromStatblock(data: Record<string, unknown>, kind: Character['kind']): Character {
  const c = blankCharacter(kind);
  const str = (k: string) => (data[k] == null ? undefined : String(data[k]));
  c.name = str('name') ?? c.name;
  c.concept = str('concept');
  c.affiliation = str('affiliation');
  c.nature = str('nature');
  c.demeanor = str('demeanor');
  c.essence = str('essence');
  c.paradigm = str('paradigm');
  c.practice = str('practice');
  c.instruments = str('instruments');

  for (const group of ['physical', 'social', 'mental'] as const) {
    const vals = Array.isArray(data[group]) ? (data[group] as unknown[]) : [];
    ATTRIBUTES[group].forEach((name, i) => {
      if (vals[i] !== undefined) c.attributes[name] = { name, ...parseDots(vals[i]) };
    });
  }
  for (const cat of ['talents', 'skills', 'knowledges', 'backgrounds'] as AbilityCategory[]) {
    c.abilities[cat] = parseTraitList(data[cat]);
  }
  for (const t of parseTraitList(data.abilities)) c.abilities[categorize(t)].push(t);
  for (const t of parseTraitList(data.spheres)) {
    const sphere = SPHERES.find((s) => s.toLowerCase() === t.name.toLowerCase());
    if (sphere) c.spheres[sphere] = t.rating;
  }
  c.arete = firstNumber(data.arete);
  const wp = firstNumber(data.willpower) || 5;
  c.willpower = { permanent: wp, temporary: wp };
  c.quintessence = firstNumber(data.quintessence);
  c.paradox = firstNumber(data.paradox);
  c.health = { levels: parseHealthTrack(data.health_track, firstNumber(data.health) || undefined), damage: [] };

  c.meritsFlaws = [...parsePointList(data.merits, 'merit'), ...parsePointList(data.flaws, 'flaw')];
  if (Array.isArray(data.rotes)) {
    c.rotes = (data.rotes as Record<string, unknown>[]).map((r) => ({ name: String(r?.name ?? ''), desc: String(r?.desc ?? '') }));
  }
  c.affinity = parseAffinity(data.affinity) ?? parseAffinity(String(data.spheres ?? '').match(/(\w+)\s*[●○]+[^,]*\(affinity\)/i)?.[1]);
  const resonance = parseResonance(data.resonance);
  if (resonance) c.resonance = resonance;
  if (Array.isArray(data.wonders)) c.wonders = (data.wonders as Record<string, unknown>[]).map(parseWonder);
  if (str('avatar_notes')) c.avatar = str('avatar_notes');
  // "12 earned, 8 spent": the log itself isn't in the statblock, so it comes back as two lines.
  const xp = str('experience')?.match(/(\d+)\s*earned\D+(\d+)\s*spent/i);
  if (xp) {
    const log = [{ at: 0, xp: Number(xp[1]), note: 'Earned before import' }];
    if (Number(xp[2])) log.push({ at: 0, xp: -Number(xp[2]), note: 'Spent before import' });
    c.experience = { log };
  }
  // Anything in a shape we couldn't read stays visible as an extra field rather than vanishing.
  const unread: Record<string, boolean> = {
    affinity: data.affinity != null && !parseAffinity(data.affinity),
    resonance: data.resonance != null && !resonance,
    wonders: data.wonders != null && !Array.isArray(data.wonders),
    experience: data.experience != null && !xp,
  };
  for (const [k, v] of Object.entries(unread)) if (v) c.extra[k] = formatExtra(data[k]);
  for (const [k, v] of Object.entries(data)) {
    if (!MAPPED.has(k) && v != null) c.extra[k] = formatExtra(v);
  }
  return c;
}

const parseAffinity = (v: unknown) => SPHERES.find((s) => s.toLowerCase() === String(v ?? '').trim().toLowerCase());

const RESONANCE_KINDS = ['dynamic', 'entropic', 'static'] as const;

/**
 * "Entropic (Clinical) 3, Static (Patient) 2" or "Clinical ●●● (entropic)". Returns undefined
 * unless every entry reads cleanly, so the caller can keep the original text.
 */
export function parseResonance(value: unknown): Resonance[] | undefined {
  const parts = String(value ?? '').split(',').map((x) => x.trim()).filter(Boolean);
  if (!parts.length) return undefined;
  const kindOf = (k: string) => RESONANCE_KINDS.find((x) => x === k.toLowerCase());
  const out: Resonance[] = [];
  for (const part of parts) {
    const a = part.match(/^(\w+)\s*\(([^)]+)\)\s*(\d+|[●○]+)?$/);
    const b = part.match(/^(.+?)\s+(\d+|[●○]+)\s*\((\w+)\)$/);
    const kind = a ? kindOf(a[1]) : b ? kindOf(b[3]) : undefined;
    if (!kind) return undefined;
    const raw = (a ? a[3] : b![2]) ?? '1';
    out.push({ trait: (a ? a[2] : b![1]).trim(), kind, rating: Math.max(1, /\d/.test(raw) ? Number(raw) : dots(raw)) });
  }
  return out;
}

function parseWonder(w: Record<string, unknown>): Wonder {
  const num = (v: unknown) => (v == null || v === '' || Number.isNaN(Number(v)) ? undefined : Number(v));
  return {
    name: String(w?.name ?? 'Wonder'),
    kind: WONDER_KINDS.find((k) => k.toLowerCase() === String(w?.kind ?? '').toLowerCase()) ?? 'Other',
    rating: num(w?.rating) ?? 1,
    arete: num(w?.arete),
    quintessence: num(w?.quintessence),
    quintessenceMax: num(w?.quintessenceMax),
    powers: String(w?.powers ?? ''),
    ...(w?.fromBackground === true && { fromBackground: true }),
  };
}

function formatExtra(v: unknown): string {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) {
    return v
      .map((x) => (x && typeof x === 'object' && 'name' in x ? `${(x as { name: unknown }).name}: ${(x as { desc?: unknown }).desc ?? ''}` : String(x)))
      .join('\n');
  }
  return typeof v === 'object' ? JSON.stringify(v) : String(v);
}

export interface ImportReport {
  characters: Character[];
  skipped: { file: string; reason: string }[];
}

/** Pull every statblock out of a markdown file. Image paths are dropped; attach portraits in the app. */
export function importMarkdown(markdown: string, file: string, kind: Character['kind']): ImportReport {
  const report: ImportReport = { characters: [], skipped: [] };
  for (const m of markdown.matchAll(BLOCK)) {
    try {
      const data = parse(m[1]) as Record<string, unknown>;
      if (!data || typeof data !== 'object' || !data.name) {
        report.skipped.push({ file, reason: 'statblock has no name' });
        continue;
      }
      report.characters.push(characterFromStatblock(data, kind));
    } catch (e) {
      report.skipped.push({ file, reason: `YAML error: ${(e as Error).message.split('\n')[0]}` });
    }
  }
  if (!report.characters.length && !report.skipped.length) report.skipped.push({ file, reason: 'no statblock found' });
  return report;
}

/** Guess PC vs NPC from the note's tags or path. */
export function guessKind(markdown: string, file: string): Character['kind'] {
  if (/\bnpc\b/i.test(file) || /tags:.*\bnpc\b/i.test(markdown)) return 'npc';
  return 'pc';
}
