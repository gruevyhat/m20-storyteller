import creatures from './creatures.json';
import { blankCharacter, type Character, type HealthLevel, type Trait } from '../model/types';
import { categorize } from '../importers/statblock';

export interface Beast {
  id: string;
  name: string;
  category: string;
  habitat: string;
  description: string;
  ecology: string;
  attacks: string;
  notes: string;
  appearance: string;
  imageSeed: number;
  attributes: Record<string, number[]>;
  abilities: Trait[];
  willpower: number;
  health: HealthLevel[];
  armor: number | null;
}

export const BESTIARY_ORIGIN = 'Original homebrew · M20 Storyteller';

export const BESTIARY: Beast[] = creatures.map((entry) => ({
  ...entry,
  // The nonphysical manifestation intentionally has no Attributes.
  attributes: Object.fromEntries(Object.entries(entry.attributes).filter((pair): pair is [string, number[]] => pair[1] !== undefined)),
})).sort((a, b) => a.name.localeCompare(b.name));

export const CATEGORIES = [...new Set(BESTIARY.map((beast) => beast.category))].sort();
export const HABITATS = [...new Set(BESTIARY.map((beast) => beast.habitat))].sort();

export function beastImage(beast: Beast) {
  return `${import.meta.env.BASE_URL}bestiary/${beast.id}.webp`;
}

export function filterBestiary(query: string, category = '', habitat = '') {
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return BESTIARY.filter((beast) => {
    if (category && beast.category !== category) return false;
    if (habitat && beast.habitat !== habitat) return false;
    const text = [beast.name, beast.category, beast.description, beast.ecology, beast.attacks, beast.notes,
      beast.habitat, beast.appearance, ...beast.abilities.map((t) => `${t.name} ${t.specialty ?? ''}`)].join(' ').toLocaleLowerCase();
    return words.every((word) => text.includes(word));
  });
}

export function hasPhysicalSheet(beast: Beast) {
  return beast.health.length > 0 && Object.keys(beast.attributes).length > 0;
}

/** Copy a physical template into the existing chronicle model, never giving an animal mage defaults. */
export function beastToCharacter(beast: Beast, range: 'low' | 'high' = 'low'): Character {
  if (!hasPhysicalSheet(beast)) throw new Error(`${beast.name} has no physical NPC sheet.`);
  const c = blankCharacter('npc');
  c.name = beast.name;
  c.concept = `${beast.category} · ${beast.description}`;
  c.arete = 0;
  c.attributes = Object.fromEntries(Object.entries(beast.attributes).map(([name, values]) => [name, {
    name, rating: range === 'high' ? values[values.length - 1] : values[0],
  }]));
  for (const trait of beast.abilities) {
    c.abilities[categorize(trait)].push({ ...trait });
  }
  c.willpower = { permanent: beast.willpower, temporary: beast.willpower };
  c.health = { levels: beast.health.map((level) => ({ ...level })), damage: [] };
  const ranges = Object.entries(beast.attributes).filter(([, values]) => values.length > 1);
  c.notes = [beast.description, `Ecology: ${beast.ecology}`, `Attacks: ${beast.attacks}`, beast.notes,
    'Attack damage, armor and supernatural powers are reference notes; resolve their special rules manually.',
    ranges.length ? `Template ranges: ${ranges.map(([name, values]) => `${name} ${values.join('–')}`).join(', ')}. Created using ${range === 'low' ? 'lower' : 'upper'} ratings.` : '',
    `Origin: ${BESTIARY_ORIGIN}. Habitat: ${beast.habitat}.`].filter(Boolean).join('\n\n');
  c.extra = {
    'Bestiary origin': BESTIARY_ORIGIN,
    'Habitat': beast.habitat,
    'Ecology': beast.ecology,
    'Armor rating': String(beast.armor ?? 'N/A'),
    'Attacks': beast.attacks,
    ...(beast.notes ? { 'Creature notes': beast.notes } : {}),
  };
  return c;
}
