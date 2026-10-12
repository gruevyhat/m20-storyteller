import { describe, expect, it } from 'vitest';
import { blankCharacter, blankChronicle } from '../model/types';
import { HISTORY_LIMIT, createCheckpointer, historyReducer, startHistory, type History } from '../store/history';
import type { Action } from '../store/chronicle';

const apply = (h: History, action: Action, checkpoint = true) => historyReducer(h, { type: 'do', action, checkpoint });

describe('undo history', () => {
  it('undoes and redoes a change', () => {
    let h = startHistory(blankChronicle());
    h = apply(h, { type: 'rename', name: 'Ash and Brass' });
    expect(h.present.name).toBe('Ash and Brass');
    h = historyReducer(h, { type: 'undo' });
    expect(h.present.name).toBe(blankChronicle().name);
    h = historyReducer(h, { type: 'redo' });
    expect(h.present.name).toBe('Ash and Brass');
  });

  it('folds non-checkpoint changes into the step before', () => {
    const c = blankCharacter();
    let h = startHistory({ ...blankChronicle(), characters: [c] });
    h = apply(h, { type: 'updateCharacter', id: c.id, patch: { paradox: 3 } });
    h = apply(h, { type: 'log', entry: { label: 'Cast', summary: '', faces: [], difficulty: 6, outcome: 'success', public: false } }, false);
    h = historyReducer(h, { type: 'undo' });
    expect(h.present.characters[0].paradox).toBe(0);
    expect(h.present.log).toEqual([]);
  });

  it('clears history on the startup load only, and drops redo after a new change', () => {
    let h = startHistory(blankChronicle());
    h = apply(h, { type: 'rename', name: 'A' });
    h = apply(h, { type: 'rename', name: 'B' });
    h = historyReducer(h, { type: 'undo' });
    expect(h.future).toHaveLength(1);
    h = apply(h, { type: 'rename', name: 'C' });
    expect(h.future).toEqual([]);
    h = apply(h, { type: 'load', chronicle: blankChronicle() });
    expect(historyReducer(h, { type: 'undo' }).present.name).toBe('C');
    h = apply(h, { type: 'load', chronicle: blankChronicle(), fresh: true });
    expect(h.past).toEqual([]);
  });

  it(`keeps at most ${HISTORY_LIMIT} steps`, () => {
    let h = startHistory(blankChronicle());
    for (let i = 0; i < HISTORY_LIMIT + 10; i++) h = apply(h, { type: 'rename', name: `n${i}` });
    expect(h.past).toHaveLength(HISTORY_LIMIT);
  });
});

describe('checkpoints', () => {
  const rename = (name: string): Action => ({ type: 'rename', name });

  it('groups dispatches made in the same tick', () => {
    const queued: (() => void)[] = [];
    const cp = createCheckpointer(() => 0, (fn) => queued.push(fn), () => false);
    expect(cp(rename('a'))).toBe(true);
    expect(cp({ type: 'clearLog' })).toBe(false);
    queued.splice(0).forEach((f) => f());
    expect(cp(rename('b'))).toBe(true);
  });

  it('merges typing into one field, but not clicks', () => {
    let now = 0;
    let typing = true;
    const cp = createCheckpointer(() => now, (fn) => fn(), () => typing);
    expect(cp(rename('a'))).toBe(true);
    now = 300;
    expect(cp(rename('ab'))).toBe(false);
    now = 2000;
    expect(cp(rename('abc'))).toBe(true);
    typing = false;
    now = 2100;
    expect(cp({ type: 'updateCharacter', id: 'x', patch: { arete: 2 } })).toBe(true);
    now = 2200;
    expect(cp({ type: 'updateCharacter', id: 'x', patch: { arete: 3 } })).toBe(true);
  });
});
