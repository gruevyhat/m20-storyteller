// Storyteller ↔ player-window sync. Both windows must be open in the same browser;
// BroadcastChannel never leaves this device.
import type { Clock, Handout, LogEntry } from '../model/types';

export interface PublicState {
  chronicle: string;
  roll: LogEntry | null;
  handout: Handout | null;
  clock: Clock | null;
}

export type Message = { type: 'state'; state: PublicState } | { type: 'hello' };

const NAME = 'm20-storyteller';

export function openChannel(onMessage: (m: Message) => void) {
  if (typeof BroadcastChannel === 'undefined') return { post: () => {}, close: () => {} };
  const ch = new BroadcastChannel(NAME);
  ch.onmessage = (e) => onMessage(e.data as Message);
  return { post: (m: Message) => ch.postMessage(m), close: () => ch.close() };
}
