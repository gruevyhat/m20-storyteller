import { describe, expect, it } from 'vitest';
import { characterMarkdown, healthTrack } from '../export/markdown';
import { characterPdf, pdfSafe, splitAffiliation } from '../export/pdf';
import { readFortune } from '../fortune/build';
import { importMarkdown } from '../importers/statblock';
import { parseHealthTrack } from '../importers/statblock';

const c = { ...readFortune('export', 2).character, name: 'Teodoro Saldívar' };
c.abilities.talents[0] = { ...c.abilities.talents[0], specialty: 'ghosts, mostly' };
c.rotes = [{ name: 'Last Rites (Spirit 2)', desc: 'Speak with a shade: "who were you?"' }];

describe('markdown export', () => {
  it('round-trips affinity, Resonance, Wonders, Avatar and experience', () => {
    const m = {
      ...c,
      affinity: 'Spirit' as const,
      resonance: [{ trait: 'Hushed', kind: 'static' as const, rating: 2 }],
      wonders: [{ name: 'Grandmother’s rosary', kind: 'Periapt' as const, rating: 2, quintessence: 4, quintessenceMax: 10, powers: 'Holds Quintessence.' }],
      avatar: 'A drowned saint who speaks in hymns.',
      experience: { log: [{ at: 1, xp: 12, note: 'Story one' }, { at: 2, xp: -5, note: 'Occult 2 → 3' }] },
    };
    const md = characterMarkdown(m);
    expect(md).toContain('## Experience');
    const back = importMarkdown(md, 'x.md', 'pc').characters[0];
    expect(back.affinity).toBe('Spirit');
    expect(back.resonance).toEqual(m.resonance);
    expect(back.wonders).toEqual([{ ...m.wonders[0], arete: undefined }]);
    expect(back.avatar).toBe(m.avatar);
    expect(back.experience!.log.map((e) => e.xp)).toEqual([12, -5]);
    expect(Object.keys(back.extra)).not.toContain('wonders');
  });

  it('round-trips through the statblock importer', () => {
    const md = characterMarkdown(c);
    expect(md).toContain('```statblock');
    const { characters, skipped } = importMarkdown(md, 'x.md', 'pc');
    expect(skipped).toEqual([]);
    const back = characters[0];
    expect(back.name).toBe(c.name);
    expect(back.nature).toBe(c.nature);
    expect(back.paradigm).toBe(c.paradigm);
    for (const n of Object.keys(c.attributes)) expect(back.attributes[n].rating).toBe(c.attributes[n].rating);
    expect(back.abilities.talents).toEqual(c.abilities.talents);
    expect(back.abilities.knowledges).toEqual(c.abilities.knowledges);
    expect(back.abilities.backgrounds).toEqual(c.abilities.backgrounds);
    expect(back.spheres).toEqual(c.spheres);
    expect(back.arete).toBe(c.arete);
    expect(back.willpower.permanent).toBe(c.willpower.permanent);
    expect(back.quintessence).toBe(c.quintessence);
    expect(back.rotes).toEqual(c.rotes);
    const key = (m: { name: string; kind: string; points: number }) => `${m.kind}:${m.name}:${m.points}`;
    expect(back.meritsFlaws!.map(key).sort()).toEqual(c.meritsFlaws!.map(key).sort());
    expect(c.meritsFlaws).toHaveLength(4);
    expect(md).toContain('## Notes');
  });

  it('writes a health track the importer reads back', () => {
    const levels = parseHealthTrack('Bruised ×4 · Hurt −1 · Injured −1 · Wounded −2 · Mauled −2 · Crippled −5 · Incapacitated', 10);
    const t = healthTrack({ ...c, health: { levels, damage: [] } });
    expect(t).toBe('Bruised ×4 · Hurt −1 · Injured −1 · Wounded −2 · Mauled −2 · Crippled −5 · Incapacitated');
    expect(parseHealthTrack(t, 10)).toEqual(levels);
  });
});

describe('pdf export', () => {
  it('folds characters the built-in fonts lack', () => {
    expect(pdfSafe('Saldívar – “ok” Hurt −1 → Řehoř')).toBe('Saldívar – “ok” Hurt -1 -> Rehor');
  });

  it('puts the camp in Affiliation and the group in Sect', () => {
    expect(splitAffiliation('Cult of Ecstasy (Tradition)')).toEqual({ affiliation: 'Traditions', sect: 'Cult of Ecstasy' });
    expect(splitAffiliation('Hollow Ones (Disparate Craft)')).toEqual({ affiliation: 'Disparates', sect: 'Hollow Ones' });
    expect(splitAffiliation('Orphan (self-Awakened)')).toEqual({ affiliation: 'Orphan', sect: 'self-Awakened' });
  });

  it('never drops a Background that does not fit the sheet', async () => {
    const many = { ...c, abilities: { ...c.abilities, backgrounds: Array.from({ length: 15 }, (_, i) => ({ name: `Bg${i}`, rating: 1 })) } };
    const out = (await characterPdf(many)).output();
    for (let i = 0; i < 15; i++) expect(out).toContain(`Bg${i}`);
  });

  it('draws a two-page sheet', async () => {
    const doc = await characterPdf(c);
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(2);
    const out = doc.output();
    expect(out.startsWith('%PDF')).toBe(true);
    expect(out).toContain('Saldvar'.slice(0, 3));
  });
});
