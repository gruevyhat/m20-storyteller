// Factions, backgrounds and flavour lists for fortune-built characters.
// Affinity Spheres follow the M20 faction summary; everything descriptive here is original.
import { SPHERES, type Sphere } from '../model/types';
import type { Concept, Practice, Suit } from './deck';

export type Camp = 'Tradition' | 'Technocracy' | 'Craft' | 'Orphan';

export interface Faction {
  name: string;
  camp: Camp;
  affinity: readonly Sphere[];
}

const ANY = SPHERES;

export const FACTIONS: Faction[] = [
  { name: 'Akashic Brotherhood', camp: 'Tradition', affinity: ['Mind', 'Life'] },
  { name: 'Celestial Chorus', camp: 'Tradition', affinity: ['Prime', 'Forces', 'Spirit'] },
  { name: 'Cult of Ecstasy', camp: 'Tradition', affinity: ['Time', 'Life', 'Mind'] },
  { name: 'Dreamspeakers', camp: 'Tradition', affinity: ['Spirit', 'Forces', 'Life', 'Matter'] },
  { name: 'Euthanatoi', camp: 'Tradition', affinity: ['Entropy', 'Life', 'Spirit'] },
  { name: 'Order of Hermes', camp: 'Tradition', affinity: ['Forces'] },
  { name: 'Society of Ether', camp: 'Tradition', affinity: ['Matter', 'Forces', 'Prime'] },
  { name: 'Verbena', camp: 'Tradition', affinity: ['Life', 'Forces'] },
  { name: 'Virtual Adepts', camp: 'Tradition', affinity: ['Correspondence', 'Forces'] },
  { name: 'Iteration X', camp: 'Technocracy', affinity: ['Forces', 'Matter', 'Time'] },
  { name: 'New World Order', camp: 'Technocracy', affinity: ['Mind', 'Correspondence'] },
  { name: 'Progenitors', camp: 'Technocracy', affinity: ['Life', 'Prime'] },
  { name: 'Syndicate', camp: 'Technocracy', affinity: ['Entropy', 'Mind', 'Prime'] },
  { name: 'Void Engineers', camp: 'Technocracy', affinity: ['Spirit', 'Correspondence', 'Forces'] },
  { name: 'Ahl-i-Batin', camp: 'Craft', affinity: ['Correspondence', 'Mind'] },
  { name: "Bata'a", camp: 'Craft', affinity: ['Life', 'Spirit'] },
  { name: 'Children of Knowledge', camp: 'Craft', affinity: ['Forces', 'Matter', 'Prime', 'Entropy'] },
  { name: 'Hollow Ones', camp: 'Craft', affinity: ANY },
  { name: 'Kopa Loei', camp: 'Craft', affinity: ANY },
  { name: 'Ngoma', camp: 'Craft', affinity: ['Life', 'Mind', 'Prime', 'Spirit'] },
  { name: 'Orphans', camp: 'Orphan', affinity: ANY },
];

export const faction = (name: string) => FACTIONS.find((f) => f.name === name)!;

/** Where an upright Major on the Path points. */
export const MAJOR_FACTIONS: string[][] = [
  ['Orphans', 'Cult of Ecstasy', 'Hollow Ones'], // Fool
  ['Order of Hermes', 'Society of Ether', 'Virtual Adepts'], // Magician
  ['Ahl-i-Batin', 'Akashic Brotherhood', 'Dreamspeakers'], // High Priestess
  ['Verbena', 'Kopa Loei', 'Progenitors'], // Empress
  ['New World Order', 'Order of Hermes', 'Iteration X'], // Emperor
  ['Celestial Chorus', 'Order of Hermes', 'Akashic Brotherhood'], // Hierophant
  ['Cult of Ecstasy', 'Syndicate', 'Verbena'], // Lovers
  ['Iteration X', 'Akashic Brotherhood', 'Order of Hermes'], // Chariot
  ['Verbena', 'Dreamspeakers', 'Akashic Brotherhood'], // Strength
  ['Akashic Brotherhood', 'Ahl-i-Batin', 'Orphans'], // Hermit
  ['Euthanatoi', 'Syndicate', 'Hollow Ones'], // Wheel
  ['Euthanatoi', 'New World Order', 'Celestial Chorus'], // Justice
  ['Dreamspeakers', 'Euthanatoi', 'Celestial Chorus'], // Hanged Man
  ['Euthanatoi', "Bata'a", 'Hollow Ones'], // Death
  ['Children of Knowledge', 'Society of Ether', 'Progenitors'], // Temperance
  ['Syndicate', 'Hollow Ones', 'Orphans'], // Devil
  ['Virtual Adepts', 'Hollow Ones', 'Orphans'], // Tower
  ['Celestial Chorus', 'Void Engineers', 'Ngoma'], // Star
  ['Dreamspeakers', 'Verbena', 'Kopa Loei'], // Moon
  ['Celestial Chorus', 'Society of Ether', 'Ngoma'], // Sun
  ['Celestial Chorus', 'Ngoma', 'Euthanatoi'], // Judgement
  ['Void Engineers', 'Ahl-i-Batin', 'Cult of Ecstasy'], // World
];

export const SUIT_FACTIONS: Record<Suit, string[]> = {
  wands: ['Order of Hermes', 'Verbena', 'Iteration X', 'Celestial Chorus', 'Akashic Brotherhood'],
  cups: ['Cult of Ecstasy', 'Dreamspeakers', "Bata'a", 'Verbena', 'Ngoma'],
  swords: ['Virtual Adepts', 'New World Order', 'Order of Hermes', 'Ahl-i-Batin', 'Void Engineers'],
  pentacles: ['Society of Ether', 'Syndicate', 'Progenitors', 'Children of Knowledge', 'Iteration X'],
};

/** A reversed Path card points outside the big three camps. */
export const REVERSED_PATH: string[] = ['Orphans', 'Hollow Ones', 'Orphans', 'Kopa Loei', "Bata'a", 'Orphans'];

// ---------------------------------------------------------------------------
// Abilities (M20 primary lists) and what each suit leans toward.

export const TALENTS = ['Alertness', 'Art', 'Athletics', 'Awareness', 'Brawl', 'Empathy', 'Expression', 'Intimidation', 'Leadership', 'Streetwise', 'Subterfuge'];
export const SKILLS = ['Crafts', 'Drive', 'Etiquette', 'Firearms', 'Martial Arts', 'Meditation', 'Melee', 'Research', 'Stealth', 'Survival', 'Technology'];
export const KNOWLEDGES = ['Academics', 'Computer', 'Cosmology', 'Enigmas', 'Esoterica', 'Investigation', 'Law', 'Medicine', 'Occult', 'Politics', 'Science'];

export type SuitOrMajor = Suit | 'major';

export const ABILITY_LEANINGS: Record<SuitOrMajor, string[]> = {
  wands: ['Athletics', 'Brawl', 'Leadership', 'Intimidation', 'Expression', 'Firearms', 'Martial Arts', 'Melee', 'Drive', 'Survival', 'Politics'],
  cups: ['Empathy', 'Art', 'Expression', 'Awareness', 'Subterfuge', 'Etiquette', 'Meditation', 'Occult', 'Medicine', 'Esoterica'],
  swords: ['Alertness', 'Subterfuge', 'Investigation', 'Academics', 'Law', 'Enigmas', 'Computer', 'Science', 'Research', 'Stealth', 'Politics'],
  pentacles: ['Crafts', 'Technology', 'Drive', 'Survival', 'Streetwise', 'Medicine', 'Science', 'Computer', 'Research', 'Athletics', 'Stealth'],
  major: ['Awareness', 'Cosmology', 'Occult', 'Esoterica', 'Enigmas', 'Meditation', 'Empathy', 'Academics'],
};

export const ATTRIBUTE_LEANINGS: Record<SuitOrMajor, Record<string, number>> = {
  wands: { Strength: 1, Dexterity: 2, Charisma: 2, Wits: 1 },
  cups: { Charisma: 1, Appearance: 2, Manipulation: 1, Perception: 2 },
  swords: { Intelligence: 2, Wits: 2, Manipulation: 2, Perception: 1, Dexterity: 1 },
  pentacles: { Strength: 2, Stamina: 2, Dexterity: 1, Intelligence: 1 },
  major: { Perception: 2, Wits: 1, Charisma: 1, Intelligence: 1 },
};

export const BACKGROUND_LEANINGS: Record<SuitOrMajor | Camp, string[]> = {
  wands: ['Allies', 'Fame', 'Influence', 'Mentor'],
  cups: ['Contacts', 'Allies', 'Dream', 'Familiar'],
  swords: ['Library', 'Contacts', 'Mentor', 'Influence'],
  pentacles: ['Resources', 'Sanctum', 'Wonder', 'Node'],
  major: ['Destiny', 'Past Lives', 'Dream', 'Arcane'],
  Tradition: ['Mentor', 'Chantry', 'Library', 'Node'],
  Technocracy: ['Requisitions', 'Backup', 'Certification', 'Resources'],
  Craft: ['Allies', 'Cult', 'Past Lives', 'Sanctum'],
  Orphan: ['Contacts', 'Resources', 'Arcane', 'Allies'],
};

/** Backgrounds only the Technocracy can hold. */
export const TECHNOCRACY_ONLY = ['Requisitions', 'Backup', 'Certification'];

// ---------------------------------------------------------------------------
// Flavour

export const OCCUPATIONS: Record<Concept, string[]> = {
  Activist: ["tenants' union organizer", 'pirate-radio host', 'street medic', 'investigative reporter'],
  Artist: ['session musician', 'tattoo artist', 'muralist', 'unpublished novelist'],
  Athlete: ['bicycle courier', 'boxing coach', 'free climber', 'minor-league pitcher'],
  Caretaker: ['night-shift nurse', 'kindergarten teacher', 'hospice volunteer', 'foster parent'],
  Criminal: ['card sharp', 'fence for stolen art', 'getaway driver', 'forger'],
  Executive: ['risk analyst', 'restaurant owner', 'union boss', 'record producer'],
  Guardian: ['transit cop', 'bodyguard', 'bail bondsman', 'park ranger'],
  Intellectual: ['adjunct professor of folklore', 'archivist', 'philosophy dropout', 'museum conservator'],
  Kid: ['runaway', 'honour student', 'skate punk', 'choir kid'],
  Laborer: ['longshore worker', 'line cook', 'roofer', 'night janitor'],
  Mystic: ['tarot reader', 'lapsed seminarian', 'street preacher', 'yoga teacher'],
  'Night-Owl': ['bartender', 'club DJ', 'all-night diner server', 'cab driver'],
  Rebel: ['squatter', 'drifter', 'zine publisher', 'army deserter'],
  Technician: ['radio repairer', 'lab tech', 'sound engineer', 'locksmith'],
  Warrior: ['ex-marine', 'prizefighter', 'private military contractor', 'self-appointed vigilante'],
};

export const INSTRUMENTS: Record<Practice, string[]> = {
  Alchemy: ['a battered retort', 'salts and mercury', 'a notebook of symbols', 'a slow fire', 'distilled tinctures'],
  'The Art of Desire': ['a tailored suit', 'contracts', 'a firm handshake', 'favours owed', 'a leather planner'],
  'Chaos Magick': ['sigils on sticky notes', 'pop-culture icons', 'dice', 'improvised ritual', 'a pack of cigarettes'],
  Craftwork: ['hand tools', 'a workbench', 'whittled charms', 'needle and thread', 'a kiln'],
  'Crazy Wisdom': ['riddles', 'deliberate absurdity', 'a borrowed hat', 'laughter at the wrong moment', 'holy nonsense'],
  Cybernetics: ['implants', 'a soldering iron', 'diagnostic readouts', 'prosthetics', 'wetware patches'],
  Dominion: ['a signet ring', 'commands spoken once', 'a gaze held too long', 'titles', 'the right to be obeyed'],
  Faith: ['prayer', 'a worn rosary', 'hymns', 'blessed water', 'a pocket scripture'],
  'Gutter Magick': ['graffiti', 'bus transfers', 'a lucky lighter', 'found objects', 'street slang'],
  'High Ritual Magick': ['a wand', 'Enochian script', 'a chalk circle', 'astrological tables', 'incense'],
  Hypertech: ['a modified calculator', 'schematics', 'impossible gadgets', 'a lab coat', 'a cassette of tones'],
  Maleficia: ['bone dice', 'a black candle', 'blood on paper', 'names written backward', 'a broken mirror'],
  'Martial Arts': ['forms and katas', 'breath control', 'a staff', 'bare hands', 'a training sash'],
  'Medicine Work': ['herbs', 'a doctor\'s bag', 'touch', 'bandages and stitches', 'a stethoscope'],
  'Reality Hacking': ['a modem', 'code', 'a pirated terminal', 'phone phreaking tones', 'a hacked pager'],
  Shamanism: ['a drum', 'trance', 'animal bones', 'fasting', 'smoke'],
  Voudoun: ['vévé drawn in cornmeal', 'rum', 'a calabash rattle', 'drums', 'offerings'],
  'Weird Science': ['a Tesla coil', 'goggles', 'a lab notebook', 'brass apparatus', 'a chalkboard of equations'],
  Witchcraft: ['herbs and cords', 'a cauldron', 'moon-water', 'a familiar\'s feather', 'candles'],
  Yoga: ['breath', 'asanas', 'a mala', 'stillness', 'mantras'],
};

export const ARTICLE = (word: string) => (/^[AEIOU]/i.test(word) ? 'an' : 'a');
