// The tarot deck and its M20 correspondences. All meanings and glosses are original to this app;
// only game-term names (Archetypes, Spheres, factions, practices, paradigms) come from M20.
import type { Sphere } from '../model/types';

export type Suit = 'wands' | 'cups' | 'swords' | 'pentacles';
export type Essence = 'Dynamic' | 'Pattern' | 'Primordial' | 'Questing';

export const ARCHETYPES = [
  'Activist', 'Benefactor', 'Contrary', 'Crusader', 'Hacker', 'Idealist', 'Innovator', 'Kid', 'Loner', 'Machine',
  'Mad Scientist', 'Martyr', 'Monster', 'Prophet', 'Rogue', 'Sensualist', 'Survivor', 'Traditionalist', 'Trickster', 'Visionary',
] as const;
export type Archetype = (typeof ARCHETYPES)[number];

export const CONCEPTS = [
  'Activist', 'Artist', 'Athlete', 'Caretaker', 'Criminal', 'Executive', 'Guardian', 'Intellectual', 'Kid', 'Laborer',
  'Mystic', 'Night-Owl', 'Rebel', 'Technician', 'Warrior',
] as const;
export type Concept = (typeof CONCEPTS)[number];

export const PARADIGMS = [
  'A Mechanistic Cosmos',
  'A World of Gods and Monsters',
  'Bring Back the Golden Age!',
  'Creation is Innately Divine and Alive',
  'Divine Order and Earthly Chaos',
  'Everything is Chaos – You Only Think it Makes Sense',
  'Everything is Data',
  'Everything is an Illusion, Prison, or Mistake',
  "It's All Good – Have Faith!",
  'Might is Right',
  'One-Way Trip to Oblivion',
  'Tech Holds All Answers',
] as const;
export type Paradigm = (typeof PARADIGMS)[number];

export type Practice =
  | 'Alchemy' | 'The Art of Desire' | 'Chaos Magick' | 'Craftwork' | 'Crazy Wisdom' | 'Cybernetics' | 'Dominion' | 'Faith'
  | 'Gutter Magick' | 'High Ritual Magick' | 'Hypertech' | 'Maleficia' | 'Martial Arts' | 'Medicine Work' | 'Reality Hacking'
  | 'Shamanism' | 'Voudoun' | 'Weird Science' | 'Witchcraft' | 'Yoga';

export interface Card {
  id: string; // e.g. "major-13", "cups-3"
  name: string;
  arcana: 'major' | 'minor';
  suit?: Suit;
  rank: number; // majors 0–21; minors 1–14 (Ace 1 … 10, Page 11, Knight 12, Queen 13, King 14)
  upright: string;
  reversed: string;
  nature: Archetype; // drawn upright
  shadow: Archetype; // drawn reversed
  essence: Essence;
  spheres: Sphere[];
  practice: Practice;
  paradigm: Paradigm;
  concept: Concept;
}

// ---------------------------------------------------------------------------
// Major Arcana

type MajorRow = [string, string, string, Archetype, Archetype, Essence, Sphere[], Practice, Paradigm, Concept];

const MAJORS: MajorRow[] = [
  ['The Fool', 'a leap taken before the ground appears', 'recklessness that calls itself freedom', 'Kid', 'Rogue', 'Questing', ['Correspondence', 'Spirit'], 'Crazy Wisdom', 'Everything is Chaos – You Only Think it Makes Sense', 'Rebel'],
  ['The Magician', 'will made into tools, and tools into will', 'a gifted hand that cannot stop performing', 'Innovator', 'Trickster', 'Dynamic', ['Forces', 'Prime'], 'High Ritual Magick', 'Divine Order and Earthly Chaos', 'Mystic'],
  ['The High Priestess', 'a door that opens only to silence', 'secrets kept until they rot', 'Visionary', 'Loner', 'Primordial', ['Mind', 'Spirit'], 'Yoga', 'Everything is an Illusion, Prison, or Mistake', 'Mystic'],
  ['The Empress', 'abundance that grows whether or not it is tended', 'a love that smothers what it feeds', 'Sensualist', 'Benefactor', 'Primordial', ['Life', 'Matter'], 'Witchcraft', 'Creation is Innately Divine and Alive', 'Caretaker'],
  ['The Emperor', 'a structure strong enough to shelter others', 'rule kept for its own sake', 'Traditionalist', 'Machine', 'Pattern', ['Matter', 'Mind'], 'Dominion', 'Might is Right', 'Executive'],
  ['The Hierophant', 'a teaching handed down intact', 'a creed that has forgotten its god', 'Traditionalist', 'Contrary', 'Pattern', ['Prime', 'Spirit'], 'Faith', "It's All Good – Have Faith!", 'Intellectual'],
  ['The Lovers', 'a choice made with the whole heart', 'a bond that asks you to be less', 'Sensualist', 'Loner', 'Dynamic', ['Mind', 'Life'], 'The Art of Desire', 'Creation is Innately Divine and Alive', 'Night-Owl'],
  ['The Chariot', 'opposing forces driven in one direction', 'momentum with no one at the reins', 'Crusader', 'Monster', 'Dynamic', ['Forces', 'Correspondence'], 'Martial Arts', 'Might is Right', 'Warrior'],
  ['Strength', 'the beast befriended rather than chained', 'a gentleness that has run out', 'Survivor', 'Monster', 'Primordial', ['Life', 'Spirit'], 'Shamanism', 'A World of Gods and Monsters', 'Athlete'],
  ['The Hermit', 'a lantern carried up the mountain alone', 'a solitude that has curdled into exile', 'Loner', 'Mad Scientist', 'Questing', ['Time', 'Mind'], 'Yoga', 'Everything is an Illusion, Prison, or Mistake', 'Intellectual'],
  ['Wheel of Fortune', 'the turn nobody can stop', 'a run of luck that is starting to sour', 'Rogue', 'Survivor', 'Questing', ['Entropy', 'Time'], 'Chaos Magick', 'Divine Order and Earthly Chaos', 'Criminal'],
  ['Justice', 'a scale that weighs you too', 'a verdict reached before the evidence', 'Activist', 'Machine', 'Pattern', ['Entropy', 'Mind'], 'Dominion', 'Divine Order and Earthly Chaos', 'Guardian'],
  ['The Hanged Man', 'surrender that turns the world over', 'a sacrifice nobody asked for', 'Martyr', 'Contrary', 'Questing', ['Spirit', 'Time'], 'Shamanism', 'Everything is an Illusion, Prison, or Mistake', 'Mystic'],
  ['Death', 'an ending that clears the ground', 'a door held shut against what must pass', 'Hacker', 'Monster', 'Dynamic', ['Entropy', 'Life'], 'Medicine Work', 'One-Way Trip to Oblivion', 'Caretaker'],
  ['Temperance', 'two waters poured until they become one', 'a balance kept by never choosing', 'Benefactor', 'Sensualist', 'Pattern', ['Prime', 'Life'], 'Alchemy', 'Bring Back the Golden Age!', 'Technician'],
  ['The Devil', 'an appetite you finally admit to', 'a chain you could slip any time you liked', 'Monster', 'Rogue', 'Primordial', ['Mind', 'Entropy'], 'Maleficia', 'Might is Right', 'Criminal'],
  ['The Tower', 'the lightning that frees the prisoner', 'a ruin you keep rebuilding the same way', 'Contrary', 'Survivor', 'Dynamic', ['Forces', 'Entropy'], 'Reality Hacking', 'Everything is Chaos – You Only Think it Makes Sense', 'Rebel'],
  ['The Star', 'hope that survives the storm intact', 'a wish too precious to risk acting on', 'Idealist', 'Martyr', 'Questing', ['Prime', 'Spirit'], 'Faith', "It's All Good – Have Faith!", 'Artist'],
  ['The Moon', 'the road you can only walk by dream-light', 'fears wearing the faces of friends', 'Trickster', 'Loner', 'Primordial', ['Mind', 'Spirit'], 'Witchcraft', 'A World of Gods and Monsters', 'Night-Owl'],
  ['The Sun', 'joy with nothing to hide', 'a brightness that blinds instead of warms', 'Kid', 'Idealist', 'Dynamic', ['Forces', 'Life'], 'Faith', 'Creation is Innately Divine and Alive', 'Kid'],
  ['Judgement', 'the call you can no longer pretend not to hear', 'a reckoning postponed one more time', 'Prophet', 'Crusader', 'Questing', ['Spirit', 'Time'], 'Faith', 'Divine Order and Earthly Chaos', 'Activist'],
  ['The World', 'the circle closed, and opening again', 'a journey that ends one step short', 'Visionary', 'Traditionalist', 'Questing', ['Correspondence', 'Prime'], 'Crazy Wisdom', 'Creation is Innately Divine and Alive', 'Mystic'],
];

// ---------------------------------------------------------------------------
// Minor Arcana

const RANK_NAMES = ['', 'Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'];

interface SuitInfo {
  label: string;
  element: string;
  theme: string;
  essence: Essence;
  spheres: Sphere[];
  practices: Practice[];
  paradigms: Paradigm[];
  concepts: Concept[];
  archetypes: Archetype[]; // indexed by (rank - 1) % length
  shadows: Archetype[];
  meanings: [string, string][]; // [upright, reversed] for ranks 1–14
}

export const SUITS: Record<Suit, SuitInfo> = {
  wands: {
    label: 'Wands',
    element: 'fire',
    theme: 'will, drive and daring',
    essence: 'Dynamic',
    spheres: ['Forces', 'Prime', 'Life'],
    practices: ['Martial Arts', 'High Ritual Magick', 'Faith', 'Weird Science'],
    paradigms: ['Might is Right', 'Divine Order and Earthly Chaos', 'Bring Back the Golden Age!'],
    concepts: ['Warrior', 'Athlete', 'Activist', 'Rebel'],
    archetypes: ['Innovator', 'Crusader', 'Activist', 'Rogue', 'Survivor', 'Visionary', 'Prophet'],
    shadows: ['Monster', 'Machine', 'Contrary', 'Loner', 'Trickster', 'Rogue', 'Mad Scientist'],
    meanings: [
      ['a spark struck in dry grass', 'a fire that will not catch'],
      ['the whole map held in one hand', 'plans that never leave the table'],
      ['ships sighted on the horizon', 'waiting on the dock too long'],
      ['a threshold worth celebrating', 'a home that no longer fits'],
      ['a brawl that sharpens everyone', 'a fight kept going out of habit'],
      ['the victor carried through the crowd', 'applause that arrives too late'],
      ['holding the high ground against many', 'defending a hill no one wants'],
      ['news travelling faster than it should', 'a message delivered to the wrong door'],
      ['the last guard still standing', 'vigilance that has become paranoia'],
      ['a burden carried the final mile', 'a load you were never meant to bear'],
      ['a messenger eager for the road', 'enthusiasm without a destination'],
      ['the charge that cannot be recalled', 'haste that leaves friends behind'],
      ['warmth that draws others in', 'a temper hidden behind charm'],
      ['the leader who lights the way', 'a vision imposed on the unwilling'],
    ],
  },
  cups: {
    label: 'Cups',
    element: 'water',
    theme: 'feeling, dreams and bonds',
    essence: 'Primordial',
    spheres: ['Mind', 'Life', 'Spirit'],
    practices: ['Witchcraft', 'Shamanism', 'Crazy Wisdom', 'Voudoun'],
    paradigms: ['Creation is Innately Divine and Alive', 'A World of Gods and Monsters', 'Everything is an Illusion, Prison, or Mistake'],
    concepts: ['Artist', 'Caretaker', 'Night-Owl', 'Mystic'],
    archetypes: ['Sensualist', 'Benefactor', 'Kid', 'Idealist', 'Martyr', 'Visionary', 'Trickster'],
    shadows: ['Loner', 'Martyr', 'Monster', 'Contrary', 'Survivor', 'Sensualist', 'Rogue'],
    meanings: [
      ['a cup that refills itself', 'a gift you will not let yourself take'],
      ['two people seeing each other clearly', 'a mirror mistaken for a partner'],
      ['friends dancing in the kitchen', 'a party that keeps you from going home'],
      ['an offer ignored out of weariness', 'boredom finally broken'],
      ['grief over what spilled', 'the cups still standing behind you'],
      ['a memory that warms instead of binds', 'a childhood you keep returning to'],
      ['too many dreams to choose from', 'a fantasy finally put down'],
      ['walking away from a full table', 'leaving before anything was said'],
      ['a wish granted, mostly', 'contentment that has turned smug'],
      ['the whole family under one rainbow', 'harmony kept by not talking'],
      ['a strange idea surfacing like a fish', 'a sensitivity that bruises easily'],
      ['the romantic riding toward trouble', 'charm that promises more than it holds'],
      ['the intuitive who listens beneath words', 'a kindness that drowns its object'],
      ['calm above deep water', 'feelings held so long they set like stone'],
    ],
  },
  swords: {
    label: 'Swords',
    element: 'air',
    theme: 'thought, truth and conflict',
    essence: 'Questing',
    spheres: ['Mind', 'Correspondence', 'Entropy', 'Time'],
    practices: ['Reality Hacking', 'Hypertech', 'High Ritual Magick', 'Cybernetics', 'Gutter Magick'],
    paradigms: ['Everything is Data', 'A Mechanistic Cosmos', 'Everything is Chaos – You Only Think it Makes Sense'],
    concepts: ['Intellectual', 'Guardian', 'Criminal', 'Activist'],
    archetypes: ['Hacker', 'Contrary', 'Loner', 'Prophet', 'Rogue', 'Survivor', 'Trickster'],
    shadows: ['Machine', 'Mad Scientist', 'Monster', 'Crusader', 'Contrary', 'Loner', 'Martyr'],
    meanings: [
      ['a truth that cuts clean', 'an argument won and a friend lost'],
      ['a blindfold worn by choice', 'a decision that can no longer wait'],
      ['the wound that tells you where you are', 'a heartbreak finally healing'],
      ['rest taken in the middle of a war', 'stillness that has become hiding'],
      ['a victory nobody wants to share', 'walking away from a rigged game'],
      ['crossing to a quieter shore', 'baggage that comes along anyway'],
      ['taking what was not offered', 'a scheme about to be found out'],
      ['a cage made of your own reasons', 'the ropes were never tied'],
      ['the three-in-the-morning thought', 'the dread that turns out smaller'],
      ['the worst has already happened', 'getting up off the floor'],
      ['a watcher who notices everything', 'gossip passed off as insight'],
      ['an argument at full gallop', 'a crusade that forgets its cause'],
      ['clarity that does not flinch', 'honesty used as a blade'],
      ['the judge who knows the law cold', 'a mind that cannot be moved by anything'],
    ],
  },
  pentacles: {
    label: 'Pentacles',
    element: 'earth',
    theme: 'craft, body and wealth',
    essence: 'Pattern',
    spheres: ['Matter', 'Life', 'Prime', 'Entropy'],
    practices: ['Craftwork', 'Alchemy', 'Weird Science', 'The Art of Desire', 'Medicine Work'],
    paradigms: ['Tech Holds All Answers', 'A Mechanistic Cosmos', 'Bring Back the Golden Age!'],
    concepts: ['Technician', 'Laborer', 'Executive', 'Caretaker'],
    archetypes: ['Traditionalist', 'Innovator', 'Machine', 'Survivor', 'Benefactor', 'Mad Scientist', 'Hacker'],
    shadows: ['Machine', 'Monster', 'Loner', 'Sensualist', 'Traditionalist', 'Rogue', 'Survivor'],
    meanings: [
      ['a seed in good soil', 'an opportunity spent before it grew'],
      ['juggling two lives and dropping neither', 'one ball too many'],
      ['the apprentice whose work is noticed', 'skill nobody pays for'],
      ['holding tight to what is yours', 'a grip that strangles what it keeps'],
      ['out in the cold, together', 'a door that was open all along'],
      ['the scales of giving and receiving', 'charity with strings attached'],
      ['patience while the harvest ripens', 'labour poured into barren ground'],
      ['the craftsman at the bench', 'perfection that never ships'],
      ['the garden walled and flourishing', 'comfort bought with someone else\'s work'],
      ['the house that will outlast you', 'an inheritance that comes with ghosts'],
      ['a student counting coins and stars', 'a lesson skipped'],
      ['the slow ride that always arrives', 'a routine mistaken for a life'],
      ['the healer with dirt under her nails', 'caring for everything but yourself'],
      ['the patron whose word is a contract', 'a fortune that owns its owner'],
    ],
  },
};

function minorCard(suit: Suit, rank: number): Card {
  const s = SUITS[suit];
  const [upright, reversed] = s.meanings[rank - 1];
  const i = rank - 1;
  return {
    id: `${suit}-${rank}`,
    name: `${RANK_NAMES[rank]} of ${s.label}`,
    arcana: 'minor',
    suit,
    rank,
    upright,
    reversed,
    nature: s.archetypes[i % s.archetypes.length],
    shadow: s.shadows[i % s.shadows.length],
    essence: s.essence,
    spheres: [s.spheres[i % s.spheres.length], s.spheres[(i + 1) % s.spheres.length]],
    practice: s.practices[i % s.practices.length],
    paradigm: s.paradigms[i % s.paradigms.length],
    concept: s.concepts[i % s.concepts.length],
  };
}

export const DECK: Card[] = [
  ...MAJORS.map(([name, upright, reversed, nature, shadow, essence, spheres, practice, paradigm, concept], rank) => ({
    id: `major-${rank}`,
    name,
    arcana: 'major' as const,
    rank,
    upright,
    reversed,
    nature,
    shadow,
    essence,
    spheres,
    practice,
    paradigm,
    concept,
  })),
  ...(['wands', 'cups', 'swords', 'pentacles'] as Suit[]).flatMap((suit) => Array.from({ length: 14 }, (_, i) => minorCard(suit, i + 1))),
];

export const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
const COURT_LABEL: Record<number, string> = { 11: 'P', 12: 'Kn', 13: 'Q', 14: 'K' };
export const rankLabel = (c: Card) => (c.arcana === 'major' ? ROMAN[c.rank] : c.rank === 1 ? 'A' : c.rank <= 10 ? String(c.rank) : COURT_LABEL[c.rank]);
