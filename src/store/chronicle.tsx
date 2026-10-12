import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { get, set } from 'idb-keyval';
import { blankChronicle, chronicleTitle, newId, type Character, type Chronicle, type Clock, type Handout, type Initiative, type LogEntry, type Scene, type ScreenOptions } from '../model/types';
import { redact } from '../handouts/templates';
import { openChannel, type PublicState } from '../sync/channel';
import { createCheckpointer, historyReducer, startHistory } from './history';

const KEY = 'chronicle';
const LOG_LIMIT = 300;

export type Action =
  /** `fresh` marks the startup load from storage, which starts undo history over. */
  | { type: 'load'; chronicle: Chronicle; fresh?: boolean }
  | { type: 'rename'; name: string }
  | { type: 'settings'; settings: Partial<Chronicle['settings']> }
  | { type: 'addCharacters'; characters: Character[] }
  | { type: 'updateCharacter'; id: string; patch: Partial<Character> | ((c: Character) => Character) }
  | { type: 'removeCharacter'; id: string }
  | { type: 'log'; entry: Omit<LogEntry, 'id' | 'at'> }
  | { type: 'clearLog' }
  | { type: 'clock'; clock: Clock | null }
  | { type: 'addHandout'; handout: Handout }
  | { type: 'updateHandout'; id: string; patch: Partial<Handout> }
  | { type: 'removeHandout'; id: string }
  | { type: 'showHandout'; id: string | null }
  | { type: 'scene'; scene: Scene | null }
  | { type: 'initiative'; initiative: Initiative | null }
  | { type: 'screen'; screen: Partial<ScreenOptions> };

export function reducer(state: Chronicle, a: Action): Chronicle {
  switch (a.type) {
    case 'load':
      return { ...blankChronicle(), ...a.chronicle };
    case 'rename':
      return { ...state, name: a.name };
    case 'settings':
      return { ...state, settings: { ...state.settings, ...a.settings } };
    case 'addCharacters':
      return { ...state, characters: [...state.characters, ...a.characters] };
    case 'updateCharacter':
      return {
        ...state,
        characters: state.characters.map((c) =>
          c.id !== a.id ? c : typeof a.patch === 'function' ? a.patch(c) : { ...c, ...a.patch },
        ),
      };
    case 'removeCharacter':
      return { ...state, characters: state.characters.filter((c) => c.id !== a.id) };
    case 'log':
      return { ...state, log: [{ ...a.entry, id: newId(), at: Date.now() }, ...state.log].slice(0, LOG_LIMIT) };
    case 'clearLog':
      return { ...state, log: [] };
    case 'clock':
      return { ...state, clock: a.clock };
    case 'addHandout':
      return { ...state, handouts: [...state.handouts, a.handout] };
    case 'updateHandout':
      return { ...state, handouts: state.handouts.map((h) => (h.id === a.id ? { ...h, ...a.patch } : h)) };
    case 'removeHandout':
      return {
        ...state,
        handouts: state.handouts.filter((h) => h.id !== a.id),
        shownHandout: state.shownHandout === a.id ? null : state.shownHandout,
      };
    case 'showHandout':
      return { ...state, shownHandout: a.id };
    case 'scene':
      return { ...state, scene: a.scene };
    case 'initiative':
      return { ...state, initiative: a.initiative };
    case 'screen':
      return { ...state, screen: { ...screenOptions(state), ...a.screen } };
  }
}

export const screenOptions = (c: Chronicle): ScreenOptions => ({ showParty: true, showRolls: true, ...c.screen });

/** The shown handout as players may receive it: [[secrets]] are blacked out before it leaves this window. */
function publicHandout(c: Chronicle): Handout | null {
  const h = c.handouts.find((x) => x.id === c.shownHandout);
  if (!h) return null;
  return { ...h, title: redact(h.title), ...(h.text !== undefined && { text: redact(h.text) }) };
}

export function publicState(c: Chronicle): PublicState {
  const opts = screenOptions(c);
  return {
    chronicle: chronicleTitle(c),
    rolls: opts.showRolls ? c.log.filter((e) => e.public).slice(0, 5) : [],
    handout: publicHandout(c),
    clock: c.clock,
    scene: c.scene ?? null,
    party: opts.showParty
      ? c.characters
          .filter((x) => x.kind === 'pc')
          .map((x) => ({
            id: x.id,
            name: x.name,
            image: x.image,
            concept: x.concept,
            health: x.health,
            willpower: x.willpower,
            quintessence: x.quintessence,
            paradox: x.paradox,
          }))
      : null,
    initiative: c.initiative ?? null,
  };
}

interface Ctx {
  chronicle: Chronicle;
  dispatch: (a: Action) => void;
  ready: boolean;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const ChronicleContext = createContext<Ctx | null>(null);

export function ChronicleProvider({ children }: { children: ReactNode }) {
  const [history, dispatchHistory] = useReducer(historyReducer, undefined, () => startHistory(blankChronicle()));
  const chronicle = history.present;
  const checkpoint = useRef(createCheckpointer());
  const dispatch = useCallback((action: Action) => dispatchHistory({ type: 'do', action, checkpoint: checkpoint.current(action) }), []);
  const undo = useCallback(() => dispatchHistory({ type: 'undo' }), []);
  const redo = useCallback(() => dispatchHistory({ type: 'redo' }), []);
  const [ready, setReady] = useState(false);
  const channel = useRef<ReturnType<typeof openChannel> | null>(null);
  const latest = useRef(chronicle);
  latest.current = chronicle;

  useEffect(() => {
    get<Chronicle>(KEY)
      .then((saved) => saved && dispatch({ type: 'load', chronicle: saved, fresh: true }))
      .catch(() => {})
      .finally(() => setReady(true));
    channel.current = openChannel((m) => {
      if (m.type === 'hello') channel.current?.post({ type: 'state', state: publicState(latest.current) });
    });
    return () => channel.current?.close();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => set(KEY, chronicle).catch(() => {}), 600);
    return () => clearTimeout(t);
  }, [chronicle, ready]);

  // Only message the player window when what it shows changes; handout images are large.
  const pub = publicState(chronicle);
  // Images are sent only when the handout or party list itself changes, not on every keystroke.
  const signature = JSON.stringify({
    ...pub,
    handout: pub.handout && { id: pub.handout.id, title: pub.handout.title, text: pub.handout.text, style: pub.handout.style },
    party: pub.party?.map((p) => ({ ...p, image: !!p.image })),
  });
  useEffect(() => {
    if (ready) channel.current?.post({ type: 'state', state: publicState(latest.current) });
  }, [signature, ready]);

  // Cmd/Ctrl+Z undoes chronicle changes, Shift+Cmd/Ctrl+Z or Ctrl+Y redoes. Text fields keep their own undo.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) undo();
      else if ((k === 'z' && e.shiftKey) || k === 'y') redo();
      else return;
      e.preventDefault();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  return (
    <ChronicleContext.Provider value={{ chronicle, dispatch, ready, undo, redo, canUndo: history.past.length > 0, canRedo: history.future.length > 0 }}>
      {children}
    </ChronicleContext.Provider>
  );
}

export function useChronicle() {
  const ctx = useContext(ChronicleContext);
  if (!ctx) throw new Error('useChronicle outside ChronicleProvider');
  return ctx;
}

export function exportChronicle(c: Chronicle) {
  const blob = new Blob([JSON.stringify(c, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${c.name.replace(/[^\w-]+/g, '-').toLowerCase() || 'chronicle'}.m20.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function parseChronicle(text: string): Chronicle {
  const data = JSON.parse(text);
  if (!data || data.version !== 1 || !Array.isArray(data.characters)) throw new Error('Not an M20 Storyteller chronicle file.');
  return data as Chronicle;
}
