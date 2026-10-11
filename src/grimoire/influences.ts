// The aesthetic "hands" the Grimoire's rotes are written in. They shape tone and imagery only: every name,
// phrase and entity here is original, and no film, comic, character or product is named.

export interface Influence {
  key: string;
  label: string;
  blurb: string;
  practices: string[];
  factions: string[];
}

export const INFLUENCES: Influence[] = [
  {
    key: 'flesh',
    label: 'The Flesh Engine',
    blurb: 'After Clive Barker: flesh and desire, bodies written like books, worlds woven into carpets, carnival masks, monsters who are the real innocents.',
    practices: ['Maleficia', 'High Ritual Magick', 'Medicine Work', 'Alchemy'],
    factions: ['Hollow Ones', 'Euthanatoi', 'Cult of Ecstasy'],
  },
  {
    key: 'gutter',
    label: 'Gutter Exorcism',
    blurb: 'Occult noir: chain-smoking exorcists, bad bargains, pub floors, London rain and the friends it costs you.',
    practices: ['Gutter Magick', 'Chaos Magick', 'Faith', 'Crazy Wisdom'],
    factions: ['Orphans', 'Celestial Chorus', 'Hollow Ones'],
  },
  {
    key: 'code',
    label: 'Green Rain',
    blurb: 'Reality as code: mirrored lenses, dial tones, the world as a simulation you can read and rewrite.',
    practices: ['Reality Hacking', 'Hypertech', 'Martial Arts', 'Cybernetics'],
    factions: ['Virtual Adepts', 'New World Order', 'Orphans'],
  },
  {
    key: 'chrome',
    label: 'Chrome Tomorrow',
    blurb: 'Relentless machines from a burning future, assassins sent back through time, flesh over steel.',
    practices: ['Cybernetics', 'Hypertech', 'Weird Science', 'Martial Arts'],
    factions: ['Iteration X', 'Void Engineers', 'Society of Ether'],
  },
  {
    key: 'outer',
    label: 'The Outer Dark',
    blurb: 'After H. P. Lovecraft: drowned cities, wrong geometry, vast indifferent things beyond the stars.',
    practices: ['High Ritual Magick', 'Alchemy', 'Maleficia', 'Weird Science'],
    factions: ['Order of Hermes', 'Ahl-i-Batin', 'Void Engineers'],
  },
  {
    key: 'hive',
    label: 'Hostile Biology',
    blurb: 'Perfect predators, derelict ships, corporate cargo, cold sleep and blood that eats through steel.',
    practices: ['Weird Science', 'Hypertech', 'Medicine Work', 'Cybernetics'],
    factions: ['Progenitors', 'Void Engineers', 'Syndicate'],
  },
  {
    key: 'blood',
    label: 'The Red Covenant',
    blurb: 'Blood as currency and covenant: sacrifice, kinship, ancestral rites, and what you owe the family.',
    practices: ['Maleficia', 'Witchcraft', 'Voudoun', 'Shamanism'],
    factions: ['Verbena', "Bata'a", 'Euthanatoi'],
  },
  {
    key: 'number',
    label: 'The Golden Proof',
    blurb: 'Reality as mathematics: sacred geometry, probability, perfect ratios and the equation under everything.',
    practices: ['High Ritual Magick', 'Hypertech', 'Weird Science', 'Alchemy'],
    factions: ['Order of Hermes', 'Virtual Adepts', 'Syndicate'],
  },
  {
    key: 'mesmer',
    label: 'The Mesmerist',
    blurb: 'Stage mentalism made real: cold reading, mesmerism, the swinging watch, and the voice that tells you what you were thinking.',
    practices: ['Crazy Wisdom', 'The Art of Desire', 'Yoga', 'Hypertech'],
    factions: ['Cult of Ecstasy', 'Akashic Brotherhood', 'New World Order', 'Orphans'],
  },
];

export const influence = (key: string) => INFLUENCES.find((i) => i.key === key)!;
