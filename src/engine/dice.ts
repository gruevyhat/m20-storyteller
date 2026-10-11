// M20 dice rules. Page references are to the M20 core rulebook (printed page numbers).

export type Rng = () => number; // returns an integer 1–10

export const cryptoD10: Rng = () => {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return (a[0] % 10) + 1;
};

export interface PoolInput {
  pool: number;
  difficulty: number;
  /** Successes required (before any threshold added for difficulty above 10). */
  need?: number;
  /** Specialty: each 10 counts as two successes. */
  specialty?: boolean;
  /** Spend Willpower: one automatic success that 1s can't cancel (pp. 330, 388). */
  willpower?: boolean;
  /** Automatic successes from other sources (assistants etc.); they do not prevent a botch. */
  bonusSuccesses?: number;
}

export interface PoolResult {
  faces: number[];
  difficulty: number; // effective, after clamping to 10
  need: number; // effective, including threshold from difficulty above 10
  raw: number; // successes before 1s cancel
  ones: number;
  net: number;
  botch: boolean;
  success: boolean;
  specialty: boolean;
  willpower: boolean;
}

/** Difficulty above 10 becomes 10, and each point over adds a required success (p. 393). */
export function applyThreshold(difficulty: number, need: number) {
  if (difficulty > 10) return { difficulty: 10, need: need + (difficulty - 10) };
  return { difficulty, need };
}

export function scoreFaces(faces: number[], input: Omit<PoolInput, 'pool'>): PoolResult {
  const { difficulty, need } = applyThreshold(input.difficulty, input.need ?? 1);
  const specialty = !!input.specialty;
  const willpower = !!input.willpower;
  let raw = 0;
  for (const f of faces) if (f >= difficulty) raw += specialty && f === 10 ? 2 : 1;
  const ones = faces.filter((f) => f === 1).length;
  // Botch: no successes at all and at least one 1. Willpower's success makes a botch impossible.
  const botch = !willpower && raw === 0 && ones > 0;
  const net = botch ? 0 : Math.max(0, raw - ones) + (willpower ? 1 : 0) + (input.bonusSuccesses ?? 0);
  return { faces, difficulty, need, raw, ones, net, botch, success: !botch && net >= need, specialty, willpower };
}

export function rollPool(input: PoolInput, rng: Rng = cryptoD10): PoolResult {
  const faces = Array.from({ length: Math.max(0, input.pool) }, rng);
  return scoreFaces(faces, input);
}

export const DEGREES = ['', 'Marginal', 'Moderate', 'Complete', 'Exceptional', 'Phenomenal'];
export const degreeOf = (net: number) => DEGREES[Math.min(5, net)] ?? '';

// ---------------------------------------------------------------------------
// Magick (pp. 502–503, 547)

export type EffectKind = 'coincidental' | 'vulgar' | 'witnessed';

export const EFFECT_LABEL: Record<EffectKind, string> = {
  coincidental: 'Coincidental',
  vulgar: 'Vulgar, no witnesses',
  witnessed: 'Vulgar, with witnesses',
};

const EFFECT_OFFSET: Record<EffectKind, number> = { coincidental: 3, vulgar: 4, witnessed: 5 };

export interface MagickModifiers {
  /** Instruments: personalized −1, unique −1, both −2, none +3. */
  instruments?: number;
  /** Quintessence spent, −1 each, max 3. */
  quintessence?: number;
  /** Extra time or research, −1 each, max 3. */
  time?: number;
  /** Anything else: Resonance ±1, fast-casting +1, mundane-ability roll, etc. */
  other?: number;
}

export interface MagickInput {
  arete: number;
  /** Permanent Willpower. Casting rolls are capped at this if it is below Arete (p. 329). */
  permanentWillpower?: number;
  highestSphere: number;
  effect: EffectKind;
  need?: number;
  mods?: MagickModifiers;
}

export interface MagickSetup {
  pool: number;
  baseDifficulty: number;
  rawModifier: number;
  modifier: number; // after ±3 cap
  difficulty: number; // 3–10
  need: number;
  limitedByWillpower: boolean;
}

export function magickSetup(m: MagickInput): MagickSetup {
  const mods = m.mods ?? {};
  const baseDifficulty = m.highestSphere + EFFECT_OFFSET[m.effect];
  const rawModifier =
    (mods.instruments ?? 0) - Math.min(3, mods.quintessence ?? 0) - Math.min(3, mods.time ?? 0) + (mods.other ?? 0);
  const modifier = Math.max(-3, Math.min(3, rawModifier));
  let difficulty = baseDifficulty + modifier;
  let need = m.need ?? 1;
  if (difficulty > 10) {
    need += difficulty - 10;
    difficulty = 10;
  }
  difficulty = Math.max(3, difficulty);
  const wp = m.permanentWillpower;
  const limitedByWillpower = wp !== undefined && wp < m.arete;
  const pool = limitedByWillpower ? wp! : m.arete;
  return { pool, baseDifficulty, rawModifier, modifier, difficulty, need, limitedByWillpower };
}

/** Paradox from one casting roll (p. 547). */
export function paradoxFor(effect: EffectKind, highestSphere: number, result: Pick<PoolResult, 'botch' | 'success'>) {
  if (result.botch) {
    if (effect === 'coincidental') return highestSphere;
    if (effect === 'vulgar') return 1 + highestSphere;
    return 2 + 2 * highestSphere;
  }
  if (effect !== 'coincidental' && result.success) return 1;
  return 0;
}

/** Gaining this much Paradox at once lets the Storyteller call for a backlash (p. 548). */
export const BACKLASH_THRESHOLD = 5;

/**
 * Backlash roll: one die per non-permanent and permanent point on the Paradox side of the wheel,
 * difficulty 6. Each success discharges one (non-permanent) point (p. 548). Tier summaries paraphrase p. 549.
 */
export function backlashTier(result: Pick<PoolResult, 'botch' | 'net'>): string {
  if (result.botch) return 'All Paradox discharges harmlessly.';
  const s = result.net;
  if (s === 0) return 'Nothing happens, and nothing discharges.';
  if (s <= 5) return `${s} dice of bashing damage and a trivial Paradox Flaw.`;
  if (s <= 10) return `A Burn of ${s} dice of bashing damage, or a minor Paradox Flaw.`;
  if (s <= 15) return 'A lethal Burn, or one of: a significant Flaw, a Paradox spirit, a mild Quiet.';
  if (s <= 20) return 'A lethal Burn and 1 permanent Paradox, or two of: severe Flaw, Paradox spirit, moderate Quiet, a Paradox Realm.';
  return 'An aggravated Burn, plus one of: 2 permanent Paradox, a drastic Flaw, a Paradox spirit, a severe Quiet, a Paradox Realm.';
}

/** Paradox left on the wheel after a backlash. Permanent points never discharge. */
export function paradoxAfterBacklash(paradox: number, permanent: number, result: Pick<PoolResult, 'botch' | 'net'>) {
  const temporary = Math.max(0, paradox - permanent);
  if (result.botch) return permanent;
  return permanent + Math.max(0, temporary - result.net);
}
