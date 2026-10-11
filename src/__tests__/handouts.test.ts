import { describe, expect, it } from 'vitest';
import { HANDOUT_TEMPLATES, parseLines, redact } from '../handouts/templates';
import { blankChronicle } from '../model/types';
import { publicState, reducer } from '../store/chronicle';

describe('handout templates', () => {
  it('offers one template per look, each with a title, a use and sample text', () => {
    expect(new Set(HANDOUT_TEMPLATES.map((t) => t.style)).size).toBe(HANDOUT_TEMPLATES.length);
    for (const t of HANDOUT_TEMPLATES) {
      expect(t.label && t.use && t.title && t.text.trim(), t.style).toBeTruthy();
    }
  });

  it('never lets a redacted secret through', () => {
    const out = redact('Signed, [[Marcus Vane]] of [[the Lodge]].');
    expect(out).not.toMatch(/Marcus|Lodge/);
    expect(out).toBe(`Signed, ${'█'.repeat(11)} of ${'█'.repeat(9)}.`);
    expect(parseLines('Officer: [[Sgt. Hale]]')).toEqual([{ kind: 'field', label: 'Officer', value: '█████████' }]);
    for (const t of HANDOUT_TEMPLATES) expect(JSON.stringify(parseLines(t.text)), t.style).not.toContain('[[');
  });

  it('reads headings, fields and rules', () => {
    const lines = parseLines('# Missing\nName: Elena\n---\nShe may seem confused.\nPlease call.\n\nThanks: all of you');
    expect(lines.map((l) => l.kind)).toEqual(['heading', 'field', 'rule', 'text', 'text', 'blank', 'field']);
    // Prose styles keep colons as plain text.
    expect(parseLines('Note: it moved', false)).toEqual([{ kind: 'text', text: 'Note: it moved' }]);
  });

  it('blacks out secrets before the handout is sent to the player screen', () => {
    let c = reducer(blankChronicle(), {
      type: 'addHandout',
      handout: { id: 'h', title: 'Report on [[Marsh Lane]]', text: 'Officer: [[Sgt. Hale]]\nThe soil was [[warm]].', style: 'report' },
    });
    c = reducer(c, { type: 'showHandout', id: 'h' });
    const sent = JSON.stringify(publicState(c));
    expect(sent).not.toMatch(/Marsh Lane|Hale|warm|\[\[/);
    expect(publicState(c).handout?.text).toContain('Officer: █');
    // The Storyteller's own copy is untouched.
    expect(c.handouts[0].text).toContain('[[Sgt. Hale]]');
  });

  it('sends the look to the player screen with the handout', () => {
    const t = HANDOUT_TEMPLATES.find((x) => x.style === 'telegram')!;
    let c = reducer(blankChronicle(), { type: 'addHandout', handout: { id: 'h', title: t.title, text: t.text, style: t.style } });
    c = reducer(c, { type: 'showHandout', id: 'h' });
    expect(publicState(c).handout?.style).toBe('telegram');
  });
});
