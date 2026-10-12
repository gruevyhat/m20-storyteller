// The Wonder Background: a character with Wonder ●●● owns a three-dot Wonder (M20, Wonder
// Background). This draws one from the Vault to match, and keeps it in step when the rating changes.
import type { Character, Wonder } from '../model/types';
import { VAULT, toSheetWonder } from './catalog';

export const WONDER_BACKGROUND = 'Wonder';

export function wonderBackgroundRating(c: Pick<Character, 'abilities'>) {
  return c.abilities.backgrounds.find((b) => b.name.trim().toLowerCase() === 'wonder')?.rating ?? 0;
}

/** Technocrats, Etherites and Virtual Adepts get technology; everyone else gets mystic Wonders. Trinkets suit anyone. */
export function paradigmFor(c: Pick<Character, 'affiliation'>): 'mystic' | 'tech' {
  return /technocra|iteration x|new world order|progenitor|syndicate|void engineer|ether|virtual adept/i.test(c.affiliation ?? '') ? 'tech' : 'mystic';
}

/**
 * Vault Wonders a Background of this rating can be. Charms and Gadgets are used up, so a
 * standing Background never draws them.
 */
export function backgroundCandidates(rating: number, paradigm: 'mystic' | 'tech') {
  const lasting = VAULT.filter((w) => w.rating === rating && w.kind !== 'Charm' && w.kind !== 'Gadget');
  const fitting = lasting.filter((w) => w.paradigm === paradigm || w.paradigm === 'either');
  return fitting.length ? fitting : lasting;
}

export function drawBackgroundWonder(rating: number, paradigm: 'mystic' | 'tech', random: () => number = Math.random, avoid?: string): Wonder | null {
  const all = backgroundCandidates(rating, paradigm);
  const pool = all.length > 1 && avoid ? all.filter((w) => w.name !== avoid) : all;
  if (!pool.length) return null;
  return { ...toSheetWonder(pool[Math.floor(random() * pool.length)]), fromBackground: true };
}

/**
 * Keep the Background's Wonder in step with its rating. A new rating draws a new Wonder; zero
 * removes it. A character who already has Wonders of their own, but none drawn for the
 * Background, is left alone: those may be what the Background stands for.
 */
export function syncWonderBackground(prev: Character | null, next: Character, random: () => number = Math.random): Character {
  const rating = wonderBackgroundRating(next);
  if (prev && wonderBackgroundRating(prev) === rating) return next;
  const wonders = next.wonders ?? [];
  const drawn = wonders.find((w) => w.fromBackground);
  if (!rating) return drawn ? { ...next, wonders: wonders.filter((w) => w !== drawn) } : next;
  if (drawn?.rating === rating) return next;
  if (!drawn && wonders.length) return next;
  const fresh = drawBackgroundWonder(rating, paradigmFor(next), random);
  if (!fresh) return next;
  return { ...next, wonders: [...wonders.filter((w) => w !== drawn), fresh] };
}

/** Swap the Background's Wonder for a different one of the same rating. */
export function redrawBackgroundWonder(c: Character, random: () => number = Math.random): Character {
  const rating = wonderBackgroundRating(c);
  const wonders = c.wonders ?? [];
  const drawn = wonders.find((w) => w.fromBackground);
  const fresh = rating ? drawBackgroundWonder(rating, paradigmFor(c), random, drawn?.name) : null;
  if (!fresh) return c;
  return { ...c, wonders: drawn ? wonders.map((w) => (w === drawn ? fresh : w)) : [...wonders, fresh] };
}
