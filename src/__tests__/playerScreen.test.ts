import { describe, expect, it } from 'vitest';
import { blankCharacter, blankChronicle, type Chronicle } from '../model/types';
import { publicState, reducer } from '../store/chronicle';

function chronicle(): Chronicle {
  const c = blankChronicle();
  const pc = { ...blankCharacter('pc'), name: 'Hester', notes: 'secret: she is the Almoner\'s daughter', paradox: 2 };
  const npc = { ...blankCharacter('npc'), name: 'The Almoner' };
  c.characters = [pc, npc];
  c.log = Array.from({ length: 8 }, (_, i) => ({
    id: `r${i}`,
    at: i,
    label: `Roll ${i}`,
    summary: '3 successes (6 dice at 6)',
    faces: [6, 7, 8],
    difficulty: 6,
    outcome: 'success' as const,
    public: i !== 1,
  }));
  return c;
}

describe('player screen state', () => {
  it('shows only player characters, and only what players may see', () => {
    const pub = publicState(chronicle());
    expect(pub.party!.map((p) => p.name)).toEqual(['Hester']);
    expect(JSON.stringify(pub)).not.toContain('secret');
    expect(JSON.stringify(pub)).not.toContain('Almoner');
    expect(pub.party![0].paradox).toBe(2);
  });

  it('shows up to five public rolls, newest first, and never hidden ones', () => {
    const pub = publicState(chronicle());
    expect(pub.rolls.map((r) => r.id)).toEqual(['r0', 'r2', 'r3', 'r4', 'r5']);
  });

  it('respects the show/hide switches', () => {
    let c = chronicle();
    c = reducer(c, { type: 'screen', screen: { showParty: false } });
    c = reducer(c, { type: 'screen', screen: { showRolls: false } });
    const pub = publicState(c);
    expect(pub.party).toBeNull();
    expect(pub.rolls).toEqual([]);
  });

  it('carries the scene and initiative', () => {
    let c = chronicle();
    c = reducer(c, { type: 'scene', scene: { title: 'Prague', subtitle: '2 a.m.' } });
    c = reducer(c, { type: 'initiative', initiative: { entries: [{ id: 'a', name: 'Hester', score: 12 }], current: 0, round: 1 } });
    const pub = publicState(c);
    expect(pub.scene).toEqual({ title: 'Prague', subtitle: '2 a.m.' });
    expect(pub.initiative!.entries[0].score).toBe(12);
  });
});
