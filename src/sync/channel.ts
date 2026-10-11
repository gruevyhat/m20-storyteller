// Storyteller ↔ player-window sync. Both windows must be open in the same browser;
// BroadcastChannel never leaves this device.
import type { Clock, Damage, Handout, HealthLevel, Initiative, LogEntry, Scene } from '../model/types';

/** What players may see of a character: no notes, secrets or full stats. */
export interface PublicCharacter {
  id: string;
  name: string;
  image?: string;
  concept?: string;
  health: { levels: HealthLevel[]; damage: Damage[] };
  willpower: { permanent: number; temporary: number };
  quintessence: number;
  paradox: number;
}

export interface PublicState {
  chronicle: string;
  /** Most recent public roll first, up to five. */
  rolls: LogEntry[];
  handout: Handout | null;
  clock: Clock | null;
  scene: Scene | null;
  party: PublicCharacter[] | null;
  initiative: Initiative | null;
}

export type Message = { type: 'state'; state: PublicState } | { type: 'hello' };

const NAME = 'm20-storyteller';

export function openChannel(onMessage: (m: Message) => void) {
  if (typeof BroadcastChannel === 'undefined') return { post: () => {}, close: () => {} };
  const ch = new BroadcastChannel(NAME);
  ch.onmessage = (e) => onMessage(e.data as Message);
  return { post: (m: Message) => ch.postMessage(m), close: () => ch.close() };
}
