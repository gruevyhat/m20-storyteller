// The Vault: original Wonders written to the M20 Wonder rules (core book, Wonder
// Background and Rules for Wonders; Book of Secrets, Wonders: Objects of Enchantment). Ratings,
// point costs, Arete and Quintessence follow those rules; the items themselves are homebrew.
import type { Sphere, WonderKind } from '../model/types';

export type VaultKind = Exclude<WonderKind, 'Other'>;
export type Reqs = Partial<Record<Sphere, number>>;

export interface WonderPower {
  spheres: Reqs;
  /** What it does, in M20 terms. */
  text: string;
}

export interface WonderSource {
  name: string;
  kind: VaultKind;
  /** Background dots. Equals the highest Sphere rank among its powers (Periapts and Matrices: capacity ÷ 5). */
  rating: number;
  /** Freebie or experience points. Charms and Gadgets: per batch of ten. */
  points: number;
  /** Talismans, Devices, Charms and Gadgets roll their own Arete (Enlightenment for tech). */
  arete?: number;
  /** Fetishes roll the bound spirit's Gnosis. */
  gnosis?: number;
  /** The spirit bound into a Fetish. */
  spirit?: string;
  /** Quintessence it holds when full. */
  quintessence?: number;
  powers: WonderPower[];
  /** Silent Wonders show nothing a Sleeper would notice. */
  mode: 'silent' | 'coincidental' | 'vulgar' | 'either';
  /** What it looks like. */
  look: string;
  /** Who made it and where it has been. */
  origin: string;
  /** Its signature effect, usually inconvenient. */
  quirk: string;
}

export const TECH_KINDS: VaultKind[] = ['Device', 'Invention', 'Matrix', 'Gadget'];
export const paradigmOf = (k: VaultKind): 'mystic' | 'tech' | 'either' => (k === 'Trinket' ? 'either' : TECH_KINDS.includes(k) ? 'tech' : 'mystic');

/** How each kind is used (paraphrasing the Book of Secrets). */
export const KIND_RULES: Record<VaultKind, string> = {
  Talisman: 'Rolls its own Arete, difficulty 7. Anyone who believes in it and knows how can use it.',
  Device: 'Rolls its own Enlightenment, difficulty 7. Anyone who can work out how it operates can use it, often with Wits or Intelligence + Technology.',
  Artifact: 'One reliable function. The user rolls their own Arete, difficulty 7; one success wakes it. Inert in a Sleeper’s hands.',
  Invention: 'A technological Artifact. The user rolls their own Enlightenment, difficulty 7; the Masses can’t get it to work properly.',
  Fetish: 'Convince the spirit: a Willpower roll, difficulty 7, resisted by its Gnosis. Then roll the Gnosis for the power.',
  Periapt: 'Holds 5 Quintessence per dot. Touch it and concentrate for a turn to draw on it; Prime 2 reaches it nearby.',
  Matrix: 'A technological Periapt: 5 Quintessence per dot, no concentration needed, and it swaps into Devices built for it. Arcane methods can’t recharge it.',
  Charm: 'One use, then spent. Roll the Charm’s Arete, difficulty 7. Comes in batches of ten; the user takes any Paradox.',
  Gadget: 'A technological Charm: one use, roll its Enlightenment at difficulty 7, batches of ten.',
  Trinket: 'Always on. No roll, no Arete, no Quintessence, no Paradox. Anyone can use it until it breaks.',
};

export const MODE_LABEL: Record<WonderSource['mode'], string> = {
  silent: 'Silent: nothing a Sleeper would notice',
  coincidental: 'Usually coincidental',
  vulgar: 'Vulgar',
  either: 'Coincidental or vulgar, depending on use',
};

export const highestRank = (w: Pick<WonderSource, 'powers'>) => Math.max(0, ...w.powers.flatMap((p) => Object.values(p.spheres).map((n) => n ?? 0)));

/** The point range the rules give for a Wonder of this kind and rating. */
export function pointRange(kind: VaultKind, rating: number, arete?: number): [number, number] {
  if (kind === 'Trinket') return [rating, rating];
  // One extra point buys Arete one above the rating (optional rule).
  const bonus = arete !== undefined && arete > rating ? 1 : 0;
  const lo = 3 * rating - 2 + bonus;
  const hi = 3 * rating + bonus;
  if (kind === 'Charm' || kind === 'Gadget') return [Math.ceil(lo / 2), Math.ceil(hi / 2)];
  return [lo, hi];
}

/** Rule checks; returns the problems with one entry. */
export function checkWonder(w: WonderSource): string[] {
  const out: string[] = [];
  const top = highestRank(w);
  const stores = w.kind === 'Periapt' || w.kind === 'Matrix';
  if (stores) {
    if (w.quintessence !== 5 * w.rating) out.push('holds 5 Quintessence per dot');
  } else {
    if (top !== w.rating) out.push(`rating ${w.rating} but highest Sphere ${top}`);
    if (!w.powers.length) out.push('has no powers');
  }
  if (w.powers.length > Math.max(1, w.rating)) out.push('more powers than dots');
  const ownArete = ['Talisman', 'Device', 'Charm', 'Gadget'].includes(w.kind);
  if (ownArete) {
    if (!w.arete || w.arete < 1 || w.arete > w.rating + 1) out.push('needs its own Arete, at most rating + 1');
  } else if (w.arete !== undefined) out.push('uses someone else’s Arete');
  if (w.kind === 'Fetish' ? !w.gnosis || !w.spirit : w.gnosis !== undefined) out.push('Gnosis and a spirit belong to Fetishes only');
  if ((w.kind === 'Talisman' || w.kind === 'Device') && (w.quintessence ?? 0) > 5 * (w.arete ?? 0)) out.push('holds more than 5 Quintessence per Arete');
  if (['Trinket', 'Charm', 'Gadget', 'Artifact', 'Invention'].includes(w.kind) && w.powers.length !== 1) out.push('has exactly one function');
  if (w.kind === 'Trinket' && w.quintessence) out.push('Trinkets hold no Quintessence');
  const [lo, hi] = pointRange(w.kind, w.rating, w.arete);
  if (w.points < lo || w.points > hi) out.push(`points ${w.points} outside ${lo}–${hi}`);
  return out;
}
