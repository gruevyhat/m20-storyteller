import { describe, expect, it } from 'vitest';
import { importMarkdown, parseHealthTrack, parseTraitList } from '../importers/statblock';
import { highestSphere } from '../model/types';

const NOTE = `---
tags: [pc]
---
# Someone

\`\`\`statblock
layout: M20 Mage
name: Test Mage
concept: Night-shift chaplain
physical:
  - "●●○○○"
  - "●●●○○"
  - "●●○○○"
social:
  - "●●●●○ (quiet presence)"
  - "●●○○○"
  - "●●○○○"
mental:
  - "●●●●○"
  - "●●●○○"
  - "●●●○○"
talents: "Alertness ●●○○○, Awareness ●●●●○ (ghosts, mostly), Empathy ●●●●● (the dying)"
spheres: "Entropy ●○○○○, Spirit ●●●○○ ⚠ at risk (affinity), Time ●●"
arete: 3
willpower: 7
quintessence: 3/20
paradox: 0/20
health: 7
health_track: Bruised · Hurt −1 · Injured −1 · Wounded −2 · Mauled −2 · Crippled −5 · Incapacitated
question: "Who was I before?"
rotes:
  - name: "Last Rites (Spirit 2)"
    desc: "Speak with a shade."
\`\`\`
`;

describe('statblock importer', () => {
  it('reads an M20 statblock', () => {
    const { characters, skipped } = importMarkdown(NOTE, 'Test.md', 'pc');
    expect(skipped).toEqual([]);
    const c = characters[0];
    expect(c.name).toBe('Test Mage');
    expect(c.attributes.Charisma).toEqual({ name: 'Charisma', rating: 4, specialty: 'quiet presence' });
    expect(c.attributes.Dexterity.rating).toBe(3);
    expect(c.abilities.talents.map((t) => [t.name, t.rating])).toEqual([
      ['Alertness', 2],
      ['Awareness', 4],
      ['Empathy', 5],
    ]);
    expect(c.spheres).toEqual({ Entropy: 1, Spirit: 3, Time: 2 });
    expect(highestSphere(c)).toBe(3);
    expect(c.arete).toBe(3);
    expect(c.willpower).toEqual({ permanent: 7, temporary: 7 });
    expect(c.quintessence).toBe(3);
    expect(c.health.levels).toHaveLength(7);
    expect(c.health.levels[5]).toEqual({ name: 'Crippled', penalty: -5 });
    expect(c.rotes[0].name).toBe('Last Rites (Spirit 2)');
    expect(c.extra.question).toBe('Who was I before?');
  });

  it('keeps commas inside specialties out of trait names', () => {
    const t = parseTraitList('Awareness ●●●●○ (ghosts, mostly), Empathy ●●●●●');
    expect(t.map((x) => x.name)).toEqual(['Awareness', 'Empathy']);
  });

  it('expands repeated health levels', () => {
    const levels = parseHealthTrack('Bruised ×4 · Hurt −1 · Injured −1 · Wounded −2 · Mauled −2 · Crippled −5 · Incapacitated (scar)', 10);
    expect(levels).toHaveLength(10);
    expect(levels.slice(0, 4).every((l) => l.name === 'Bruised')).toBe(true);
  });

  it('sorts a combined abilities field and formats extra lists', () => {
    const md = '```statblock\nname: Agent\nabilities: "Alertness ●●●, Firearms ●●●, Law ●●"\nattacks:\n  - name: Sidearm\n    desc: 6 dice, 4 lethal\n```';
    const c = importMarkdown(md, 'a.md', 'npc').characters[0];
    expect(c.abilities.talents.map((t) => t.name)).toEqual(['Alertness']);
    expect(c.abilities.skills.map((t) => t.name)).toEqual(['Firearms']);
    expect(c.abilities.knowledges.map((t) => t.name)).toEqual(['Law']);
    expect(c.extra.attacks).toBe('Sidearm: 6 dice, 4 lethal');
  });

  it('reports files without statblocks', () => {
    expect(importMarkdown('# nothing here', 'x.md', 'npc').skipped[0].reason).toMatch(/no statblock/);
  });
});
