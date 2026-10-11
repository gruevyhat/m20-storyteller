// The Attribute most often paired with each Ability. These are sensible defaults for a quick roll;
// the Storyteller can always pick a different pairing (Strength + Intimidation to loom, Charisma +
// Art to perform, and so on).
import type { AbilityCategory } from './types';

export const DEFAULT_ATTRIBUTE: Record<string, string> = {
  // Talents
  Alertness: 'Perception',
  Art: 'Dexterity',
  Athletics: 'Dexterity',
  Awareness: 'Perception',
  Brawl: 'Dexterity',
  Empathy: 'Perception',
  Expression: 'Charisma',
  Intimidation: 'Manipulation',
  Leadership: 'Charisma',
  Streetwise: 'Wits',
  Subterfuge: 'Manipulation',
  // Skills
  Crafts: 'Dexterity',
  Drive: 'Dexterity',
  Etiquette: 'Charisma',
  Firearms: 'Dexterity',
  'Martial Arts': 'Dexterity',
  Meditation: 'Wits',
  Melee: 'Dexterity',
  Research: 'Intelligence',
  Stealth: 'Dexterity',
  Survival: 'Wits',
  Technology: 'Intelligence',
  // Knowledges
  Academics: 'Intelligence',
  Computer: 'Intelligence',
  Cosmology: 'Intelligence',
  Enigmas: 'Wits',
  Esoterica: 'Intelligence',
  Investigation: 'Perception',
  Law: 'Intelligence',
  Medicine: 'Intelligence',
  Occult: 'Intelligence',
  Politics: 'Manipulation',
  Science: 'Intelligence',
};

/** Fallbacks for secondary or homebrew Abilities, by category. */
const BY_CATEGORY: Record<AbilityCategory, string> = {
  talents: 'Wits',
  skills: 'Dexterity',
  knowledges: 'Intelligence',
  backgrounds: 'Charisma',
};

export function defaultAttributeFor(ability: string, category?: AbilityCategory) {
  return DEFAULT_ATTRIBUTE[ability] ?? (category ? BY_CATEGORY[category] : 'Wits');
}

/** A typical use, shown in the roller so the pairing makes sense. */
export const DEFAULT_USE: Record<string, string> = {
  Alertness: 'notice danger',
  Art: 'paint, draw or sculpt',
  Athletics: 'run, climb, jump',
  Awareness: 'sense the uncanny',
  Brawl: 'land a punch',
  Empathy: 'read a mood',
  Expression: 'move an audience',
  Intimidation: 'make them back down',
  Leadership: 'rally people',
  Streetwise: 'find the right person',
  Subterfuge: 'lie convincingly',
  Crafts: 'build or repair',
  Drive: 'handle a car under pressure',
  Etiquette: 'fit in with the right people',
  Firearms: 'shoot',
  'Martial Arts': 'strike or throw',
  Meditation: 'centre yourself',
  Melee: 'swing a blade',
  Research: 'dig through records',
  Stealth: 'move unseen',
  Survival: 'find shelter or a trail',
  Technology: 'jury-rig a device',
  Academics: 'recall history or theory',
  Computer: 'get into a system',
  Cosmology: 'know the Otherworlds',
  Enigmas: 'solve a riddle',
  Esoterica: 'know a mystic practice',
  Investigation: 'search a scene',
  Law: 'know the statute',
  Medicine: 'treat a wound',
  Occult: 'know the lore',
  Politics: 'work the system',
  Science: 'apply the theory',
};
