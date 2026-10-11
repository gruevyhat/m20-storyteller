import { describe, expect, it } from 'vitest';
import { blankBuild, buildCharacter, freebiesLeft, freebiesSpent, problems, type Build } from '../model/creation';

/** A complete, legal Verbena healer. */
function sample(): Build {
  const b = blankBuild();
  Object.assign(b, {
    name: 'Ines Calloway', concept: 'Caretaker: night-shift nurse', faction: 'Verbena', essence: 'Primordial', nature: 'Benefactor', demeanor: 'Survivor',
    paradigm: 'Creation is Innately Divine and Alive', practice: 'Witchcraft', instruments: 'herbs, cords, moon-water',
    attrPriority: ['social', 'mental', 'physical'],
    attrs: { Charisma: 3, Manipulation: 1, Appearance: 3, Perception: 2, Intelligence: 2, Wits: 1, Strength: 1, Dexterity: 1, Stamina: 1 },
    abilityPriority: ['talents', 'knowledges', 'skills'],
    abilities: { Empathy: 3, Awareness: 3, Alertness: 2, Expression: 2, Subterfuge: 3, Medicine: 3, Occult: 3, Esoterica: 2, Academics: 1, Meditation: 2, Crafts: 2, Survival: 1 },
    backgrounds: { Avatar: 3, Mentor: 2, Contacts: 2 },
    arete: 2,
    affinity: 'Life',
    spheres: { Life: 2, Mind: 2, Spirit: 1, Prime: 1 },
  });
  b.freebie = { attrs: {}, abilities: { Medicine: 1 }, backgrounds: { Resources: 1 }, spheres: {}, willpower: 2, quintessence: 0 };
  b.merits = [{ name: 'Green Thumb', points: 1 }];
  b.flaws = [{ name: 'Soft-Hearted', points: 1 }];
  return b;
}

describe('guided creation', () => {
  it('accepts a complete legal build', () => {
    const b = sample();
    expect(freebiesSpent(b)).toBe(4 + 2 + 1 + 2 + 1 - 1 + 0); // Arete, Medicine, Resources, Willpower, merit − flaw
    // Spend the remaining 6: Willpower to 10, then Backgrounds.
    b.freebie.willpower += 3;
    b.freebie.backgrounds = { Resources: 2, Contacts: 2 };
    expect(freebiesLeft(b)).toBe(0);
    const p = problems(b);
    for (const k of Object.keys(p) as (keyof typeof p)[]) expect(p[k], k).toEqual([]);
  });

  it('builds the character with free dots and freebies included', () => {
    const b = sample();
    const c = buildCharacter(b);
    expect(c.attributes.Charisma.rating).toBe(4);
    expect(c.abilities.knowledges.find((t) => t.name === 'Medicine')!.rating).toBe(4);
    expect(c.abilities.backgrounds.map((t) => t.name)).toEqual(['Avatar', 'Contacts', 'Mentor', 'Resources']);
    expect(c.spheres).toEqual({ Life: 2, Mind: 2, Prime: 1, Spirit: 1 });
    expect(c.quintessence).toBe(3);
    expect(c.willpower.permanent).toBe(7);
    expect(c.affiliation).toBe('Verbena (Tradition)');
    expect(c.meritsFlaws!.map((m) => m.kind)).toEqual(['merit', 'flaw']);
  });

  it('catches the common mistakes', () => {
    const b = sample();
    b.attrs.Charisma = 5; // 6 dots, and too many in Social
    b.abilities.Empathy = 4;
    b.backgrounds = { Mentor: 7 };
    b.spheres = { Life: 3, Mind: 3 };
    b.affinity = 'Time';
    b.flaws = [{ name: 'Debts', points: 5 }, { name: 'Enemy', points: 5 }];
    const p = problems(b);
    expect(p.attributes.join(' ')).toMatch(/Social: 2 dots too many/);
    expect(p.attributes.join(' ')).toMatch(/Charisma can't go above 5/);
    expect(p.abilities.join(' ')).toMatch(/Empathy can't go above 3/);
    expect(p.advantages.join(' ')).toMatch(/Avatar/);
    expect(p.magick.join(' ')).toMatch(/Time isn't an affinity Sphere for the Verbena/);
    expect(p.magick.join(' ')).toMatch(/can't be higher than Arete/);
    expect(p.freebies.join(' ')).toMatch(/Flaws over 7/);
    expect(p.finish[0]).toMatch(/Unfinished/);
  });

  it('caps the freebies Flaws can give at 7', () => {
    const b = sample();
    const before = freebiesSpent(b);
    b.flaws.push({ name: 'Debts', points: 5 }, { name: 'Enemy', points: 5 });
    expect(freebiesSpent(b)).toBe(before - 6); // already had 1 point; only 6 more count
  });

  it('keeps Technocracy-only Backgrounds for Technocrats', () => {
    const b = sample();
    b.backgrounds = { Avatar: 3, Requisitions: 4 };
    expect(problems(b).advantages.join(' ')).toMatch(/Requisitions is for Technocrats only/);
    b.faction = 'Iteration X';
    expect(problems(b).advantages.join(' ')).not.toMatch(/Requisitions/);
  });
});
