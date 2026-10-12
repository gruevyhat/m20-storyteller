// Undo/redo over the chronicle reducer. History lives in memory only; the startup load clears it,
// while loading a file or starting a new chronicle can be undone like anything else.
import type { Chronicle } from '../model/types';
import { reducer, type Action } from './chronicle';

export const HISTORY_LIMIT = 50;
/** Text edits to the same field within this window share one undo step. */
export const MERGE_MS = 1000;

export interface History {
  present: Chronicle;
  past: Chronicle[];
  future: Chronicle[];
}

export type HistoryAction =
  | { type: 'do'; action: Action; checkpoint: boolean }
  | { type: 'undo' }
  | { type: 'redo' };

export const startHistory = (present: Chronicle): History => ({ present, past: [], future: [] });

export function historyReducer(h: History, a: HistoryAction): History {
  switch (a.type) {
    case 'do': {
      const present = reducer(h.present, a.action);
      if (present === h.present) return h;
      if (a.action.type === 'load' && a.action.fresh) return startHistory(present);
      const past = a.checkpoint ? [...h.past, h.present].slice(-HISTORY_LIMIT) : h.past;
      return { present, past, future: [] };
    }
    case 'undo': {
      const prev = h.past[h.past.length - 1];
      if (!prev) return h;
      return { present: prev, past: h.past.slice(0, -1), future: [h.present, ...h.future] };
    }
    case 'redo': {
      const [next, ...future] = h.future;
      if (!next) return h;
      return { present: next, past: [...h.past, h.present], future };
    }
  }
}

/** What an edit touches. Consecutive keystrokes into the same thing merge into one undo step. */
export function mergeKey(a: Action): string | null {
  switch (a.type) {
    case 'rename':
      return 'rename';
    case 'settings':
      return `settings:${Object.keys(a.settings).join()}`;
    case 'updateCharacter':
      return typeof a.patch === 'object' ? `character:${a.id}:${Object.keys(a.patch).join()}` : null;
    case 'updateHandout':
      return `handout:${a.id}:${Object.keys(a.patch).join()}`;
    default:
      return null;
  }
}

/** True while the keyboard is in a text field, so an edit is typing rather than a click. */
export function typingInField() {
  const el = typeof document === 'undefined' ? null : document.activeElement;
  if (!el) return false;
  if (el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable) return true;
  return el.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit', 'file', 'range', 'color'].includes((el as HTMLInputElement).type);
}

/**
 * Decides when a dispatch starts a new undo step. Dispatches made in the same tick (one click
 * that spends Willpower, adds Paradox and logs the roll) share a step, and so do runs of typing
 * into the same field.
 */
export function createCheckpointer(
  now: () => number = Date.now,
  defer: (fn: () => void) => void = queueMicrotask,
  typing: () => boolean = typingInField,
) {
  let grouping = false;
  let last: { key: string | null; at: number } = { key: null, at: 0 };
  return (a: Action) => {
    // Clicks (dots, boxes, rolls) never merge with each other.
    const key = typing() ? mergeKey(a) : null;
    const at = now();
    const merges = key !== null && key === last.key && at - last.at < MERGE_MS;
    const checkpoint = !grouping && !merges;
    last = { key, at };
    if (!grouping) {
      grouping = true;
      defer(() => {
        grouping = false;
      });
    }
    return checkpoint;
  };
}
