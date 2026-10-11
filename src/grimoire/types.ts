// Shapes for the written rote catalog. Sphere ranks follow the book (pp. 513–523); damage, healing
// and duration use the Base Damage or Duration chart, Magickal Damage types, the Correspondence
// connection table and the teleport chart (all p. 504). Per-rote numbers beyond those (weights,
// Willpower difficulties, per-success penalties) are suggested homebrew.
import type { Sphere } from '../model/types';

export type Reqs = Partial<Record<Sphere, number>>;
export type Mode = 'coincidental' | 'vulgar' | 'either';

/** One written rote. Every rote is its own effect; nothing is shared or recombined. */
export interface RoteSource {
  name: string;
  spheres: Reqs;
  /** Successes for the standard result. */
  successes: number;
  mode: Mode;
  harm?: boolean;
  /** What the working looks like and does. */
  text: string;
  /** Rules text, using M20 mechanics. */
  system: string;
  /** What it passes for when coincidental. Omit for vulgar-only rotes. */
  cover?: string;
  practice: string;
  ability: string;
  /** What Paradox does to this rote's caster. */
  backlash: string;
  quote: string;
}
