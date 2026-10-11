import { describe, expect, it } from 'vitest';
import { BESTIARY, beastToCharacter, filterBestiary, hasPhysicalSheet } from '../bestiary/catalog';
import { BESTIARY_ORIGIN, CATEGORIES, HABITATS } from '../bestiary/catalog';
import { characterMarkdown } from '../export/markdown';
import { importMarkdown } from '../importers/statblock';
import { blankChronicle, woundPenalty } from '../model/types';
import { parseChronicle, reducer } from '../store/chronicle';

const beast = (id: string) => BESTIARY.find((entry) => entry.id === id)!;

describe('bestiary catalog', () => {
  it('has complete original templates with distinct concepts and encounter rules', () => {
    expect(BESTIARY).toHaveLength(72);
    expect(new Set(BESTIARY.map((entry) => entry.id)).size).toBe(72);
    expect(CATEGORIES).toEqual(['Aberrations', 'Apparitions', 'Constructs', 'Wildlife']);
    expect(HABITATS).toHaveLength(6);
    for (const category of CATEGORIES) expect(filterBestiary('', category)).toHaveLength(18);
    expect(new Set(BESTIARY.map((entry) => entry.description)).size).toBe(72);
    expect(new Set(BESTIARY.map((entry) => entry.notes)).size).toBe(72);
    for (const entry of BESTIARY) {
      expect(entry).not.toHaveProperty('source');
      expect(entry.appearance).toBeTruthy();
      expect(HABITATS).toContain(entry.habitat);
      expect(entry.description).toBeTruthy();
      expect(entry.attacks).toBeTruthy();
      expect(entry.abilities.length).toBeGreaterThan(0);
      expect(new Set(entry.abilities.map((t) => t.name)).size).toBe(entry.abilities.length);
      for (const range of Object.values(entry.attributes)) {
        expect(range.length).toBeGreaterThanOrEqual(1);
        expect(range.length).toBeLessThanOrEqual(2);
        expect(range.every(Number.isInteger)).toBe(true);
        expect(range[0]).toBeGreaterThanOrEqual(0);
        expect(range[range.length - 1]).toBeGreaterThanOrEqual(range[0]);
      }
      if (hasPhysicalSheet(entry)) {
        expect([6, 9]).toContain(Object.keys(entry.attributes).length);
        expect(entry.health[entry.health.length - 1].penalty).toBe(-99);
      }
    }
  });

  it('combines case-insensitive words, features, category and habitat filters', () => {
    expect(filterBestiary('  HUSHPELT  tracking ').map((entry) => entry.id)).toEqual(['hushpelt-tracker']);
    expect(filterBestiary('glass', 'Aberrations').map((entry) => entry.id)).toContain('windowreef');
    expect(filterBestiary('hushpelt', '', 'City')).toEqual([]);
    expect(filterBestiary('no such creature')).toEqual([]);
    expect(filterBestiary('', 'Unknown type', 'City')).toEqual([]);
  });
});

describe('creature NPCs', () => {
  it('copies ranges, specialties and resources without adding mage defaults', () => {
    const low = beastToCharacter(beast('hushpelt-tracker'));
    const high = beastToCharacter(beast('hushpelt-tracker'), 'high');
    expect([low.attributes.Strength.rating, high.attributes.Strength.rating]).toEqual([2, 4]);
    expect([low.attributes.Stamina.rating, high.attributes.Stamina.rating]).toEqual([2, 3]);
    expect(low.attributes.Charisma).toBeUndefined();
    expect(low.kind).toBe('npc');
    expect(low.arete).toBe(0);
    expect(low.spheres).toEqual({});
    expect(low.quintessence).toBe(0);
    expect(low.willpower).toEqual({ permanent: 4, temporary: 4 });
    expect(low.abilities.skills.find((t) => t.name === 'Survival')).toEqual({ name: 'Survival', rating: 3, specialty: 'Tracking' });
    expect(low.extra.Attacks).toContain('lethal');
    expect(low.notes).toContain(BESTIARY_ORIGIN);
  });

  it('retains large ratings and uses the creature health track for wounds', () => {
    const cradle = beastToCharacter(beast('quarry-cradle'));
    expect(cradle.attributes.Strength.rating).toBe(12);
    expect(cradle.attributes.Stamina.rating).toBe(11);
    expect(cradle.health.levels).toHaveLength(12);
    cradle.health.damage = ['L', 'L', 'L', 'L'];
    expect(woundPenalty(cradle)).toBe(0);
    cradle.health.damage.push('L');
    expect(woundPenalty(cradle)).toBe(-1);
    cradle.health.damage = cradle.health.levels.map(() => 'L');
    expect(woundPenalty(cradle)).toBe(-99);
  });

  it('makes isolated copies and persists them through chronicle JSON', () => {
    const template = beast('hushpelt-tracker');
    const before = JSON.stringify(template);
    const a = beastToCharacter(template);
    const b = beastToCharacter(template);
    expect(a.id).not.toBe(b.id);
    a.attributes.Strength.rating = 9;
    a.abilities.talents[0].rating = 0;
    a.health.levels[0].penalty = -3;
    a.health.damage.push('L');
    a.willpower.temporary = 1;
    expect(JSON.stringify(template)).toBe(before);
    expect(b.attributes.Strength.rating).toBe(2);
    expect(b.health.damage).toEqual([]);
    expect(b.health.levels[0].penalty).toBe(0);
    expect(b.willpower.temporary).toBe(4);
    const state = reducer(blankChronicle(), { type: 'addCharacters', characters: [a, b] });
    expect(parseChronicle(JSON.stringify(state)).characters).toEqual([a, b]);
  });

  it('does not invent a physical sheet for Unclaimed Applause', () => {
    expect(hasPhysicalSheet(beast('unclaimed-applause'))).toBe(false);
    expect(beast('unclaimed-applause').health).toEqual([]);
    expect(beast('unclaimed-applause').armor).toBeNull();
    expect(() => beastToCharacter(beast('unclaimed-applause'))).toThrow('no physical NPC sheet');
  });

  it('round-trips every physical creature through Markdown, including terminal health states', () => {
    for (const entry of BESTIARY.filter(hasPhysicalSheet)) {
      const c = beastToCharacter(entry, 'high');
      const { characters, skipped } = importMarkdown(characterMarkdown(c), 'creature.md', 'npc');
      expect(skipped, entry.name).toEqual([]);
      const back = characters[0];
      expect(back.health, entry.name).toEqual(c.health);
      expect(back.abilities, entry.name).toEqual(c.abilities);
      expect(back.arete).toBe(0);
      for (const [name, trait] of Object.entries(c.attributes)) expect(back.attributes[name], entry.name).toEqual(trait);
      if (!entry.attributes.Charisma) expect(back.attributes.Charisma.rating).toBe(0);
      expect(back.extra.Attacks).toBe(c.extra.Attacks);
    }
  });
});
