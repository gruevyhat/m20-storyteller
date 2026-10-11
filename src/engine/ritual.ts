// Rituals as extended Arete rolls (M20 pp. 540–541).
import { cryptoD10, paradoxFor, rollPool, type EffectKind, type MagickSetup, type PoolResult, type Rng } from './dice';

export type RitualStatus = 'running' | 'botched' | 'succeeded' | 'exhausted' | 'disaster' | 'abandoned';

export interface RitualConfig {
  setup: MagickSetup; // from magickSetup(); difficulty already includes capped modifiers
  effect: EffectKind;
  highestSphere: number;
  arete: number;
  permanentWillpower: number;
  /** A second, different Effect held during the ritual adds +1 difficulty (p. 540). */
  secondEffect?: boolean;
  /** Enlightened assistants add one automatic success each, max 5, never cancelling a botch (p. 542). */
  assistants?: number;
}

export interface RitualRoll {
  result: PoolResult;
  difficulty: number;
  need: number;
  note: string;
}

export interface RitualState {
  config: RitualConfig;
  maxRolls: number;
  rolls: RitualRoll[];
  successes: number;
  failures: number; // each adds +1 difficulty to later rolls
  botchSaves: number; // each saved botch adds +1 difficulty
  status: RitualStatus;
  /** Paradox accrued by rolls after the first; cancelled on success, added to the backlash on a botch. */
  accruedParadox: number;
  /** Paradox the caster actually takes when the ritual ends. */
  paradoxTaken: number;
}

export function startRitual(config: RitualConfig): RitualState {
  return {
    config,
    // Maximum rolls: permanent Willpower + Arete (p. 540).
    maxRolls: config.permanentWillpower + config.arete,
    rolls: [],
    successes: 0,
    failures: 0,
    botchSaves: 0,
    status: 'running',
    accruedParadox: 0,
    paradoxTaken: 0,
  };
}

/** Difficulty and successes needed for the next roll. */
export function nextTarget(s: RitualState) {
  const base = s.config.setup.difficulty + (s.config.secondEffect ? 1 : 0);
  let difficulty = base + s.failures + s.botchSaves;
  let extraNeed = 0;
  // Once failure penalties push past 9, further penalties become thresholds (p. 540).
  const cap = Math.max(9, base);
  if (difficulty > cap) {
    extraNeed += difficulty - cap;
    difficulty = cap;
  }
  if (difficulty > 10) {
    extraNeed += difficulty - 10;
    difficulty = 10;
  }
  return { difficulty, need: s.config.setup.need + extraNeed };
}

export function rollRitual(s: RitualState, opts: { willpower?: boolean; specialty?: boolean } = {}, rng: Rng = cryptoD10): RitualState {
  if (s.status !== 'running') return s;
  const { difficulty, need } = nextTarget(s);
  const result = rollPool({ pool: s.config.setup.pool, difficulty, need: 1, willpower: opts.willpower, specialty: opts.specialty }, rng);
  const rollIndex = s.rolls.length; // 0-based
  const accruedParadox = s.accruedParadox + (rollIndex > 0 ? 1 : 0);
  const next: RitualState = { ...s, rolls: [...s.rolls], accruedParadox };
  let note: string;

  if (result.botch) {
    if (s.status === 'running' && s.botchSaves === 0 && s.successes > 0) {
      next.status = 'botched';
      note = 'Botch. Spend a turn, a Willpower point and one success to hold it together, or let it fail.';
    } else {
      next.status = 'disaster';
      note = s.botchSaves > 0 ? 'Second botch: the ritual collapses.' : 'Botch with nothing to sacrifice: the ritual collapses.';
      next.paradoxTaken = paradoxFor(s.config.effect, s.config.highestSphere, { botch: true, success: false }) + accruedParadox;
    }
  } else if (result.net === 0) {
    next.failures = s.failures + 1;
    note = 'No progress. Later rolls are +1 difficulty.';
  } else {
    next.successes = s.successes + result.net;
    note = `+${result.net} toward the goal.`;
  }

  next.rolls.push({ result, difficulty, need, note });

  if (next.status === 'running') {
    const assisted = next.successes + Math.min(5, s.config.assistants ?? 0);
    if (assisted >= need) {
      next.status = 'succeeded';
      // Accrued ritual Paradox goes away on success; normal vulgar cost still applies.
      next.paradoxTaken = paradoxFor(s.config.effect, s.config.highestSphere, { botch: false, success: true });
    } else if (next.rolls.length >= next.maxRolls) {
      next.status = 'exhausted';
      // Only a successful ritual cancels the accrued points; they stay otherwise.
      next.paradoxTaken = next.accruedParadox;
    }
  }
  return next;
}

/** Save a botched ritual: one Willpower and one prior success, then continue at +1 difficulty (p. 540). */
export function saveBotch(s: RitualState): RitualState {
  if (s.status !== 'botched') return s;
  const next: RitualState = { ...s, status: 'running', successes: s.successes - 1, botchSaves: s.botchSaves + 1 };
  if (next.rolls.length >= next.maxRolls) {
    next.status = 'exhausted';
    next.paradoxTaken = next.accruedParadox;
  }
  return next;
}

/** Let a botch stand: the ritual fails and the accrued Paradox lands with the botch. */
export function acceptBotch(s: RitualState): RitualState {
  if (s.status !== 'botched') return s;
  return {
    ...s,
    status: 'disaster',
    paradoxTaken: paradoxFor(s.config.effect, s.config.highestSphere, { botch: true, success: false }) + s.accruedParadox,
  };
}

export function abandonRitual(s: RitualState): RitualState {
  if (s.status !== 'running') return s;
  return { ...s, status: 'abandoned', paradoxTaken: s.accruedParadox };
}
