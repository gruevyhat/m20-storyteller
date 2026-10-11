import { describe, expect, it } from 'vitest';
import { DEFAULT_ATTRIBUTE, DEFAULT_USE, defaultAttributeFor } from '../model/abilityDefaults';
import { ATTRIBUTE_NAMES } from '../model/types';
import { KNOWLEDGES, SKILLS, TALENTS } from '../fortune/lore';

describe('ability defaults', () => {
  it('pairs every primary Ability with a real Attribute and a typical use', () => {
    for (const a of [...TALENTS, ...SKILLS, ...KNOWLEDGES]) {
      expect(ATTRIBUTE_NAMES, a).toContain(DEFAULT_ATTRIBUTE[a]);
      expect(DEFAULT_USE[a], a).toBeTruthy();
    }
  });

  it('falls back by category for other Abilities', () => {
    expect(defaultAttributeFor('Firearms')).toBe('Dexterity');
    expect(defaultAttributeFor('Hypertech', 'knowledges')).toBe('Intelligence');
    expect(defaultAttributeFor('Carousing', 'talents')).toBe('Wits');
  });
});
