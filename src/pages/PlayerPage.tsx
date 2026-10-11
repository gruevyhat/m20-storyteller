// The player-facing window, meant for a TV or second monitor at the table. It only ever receives
// the public slice of the chronicle: scene, clock, handout, party status, recent public rolls and
// initiative.
import { useEffect, useState } from 'react';
import { openChannel, type PublicCharacter, type PublicState } from '../sync/channel';
import type { Clock, Initiative, LogEntry } from '../model/types';
import { WHEEL_SIZE } from '../model/types';
import { HandoutView } from '../components/HandoutView';
import { redact } from '../handouts/templates';

function useNow(active: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

export default function PlayerPage() {
  const [state, setState] = useState<PublicState | null>(null);

  useEffect(() => {
    document.title = 'Player screen';
    const ch = openChannel((m) => m.type === 'state' && setState(m.state));
    ch.post({ type: 'hello' });
    return () => ch.close();
  }, []);

  if (!state) {
    return (
      <div className="grid min-h-screen place-items-center p-8 text-center text-muted">
        <div>
          <p className="font-display text-3xl text-brass">Player screen</p>
          <p className="mt-2">Waiting for the Storyteller. Open the app in this same browser and leave this window on the table screen.</p>
        </div>
      </div>
    );
  }

  const init = state.initiative && state.initiative.entries.length ? state.initiative : null;
  // A fresh roll shows big in the middle; the feed then lists the ones before it.
  const bigRoll = !state.handout && state.rolls[0] && Date.now() - state.rolls[0].at < 2 * 60_000 ? state.rolls[0] : null;
  const feed = bigRoll ? state.rolls.slice(1) : state.rolls;
  return (
    <div className="flex min-h-screen flex-col gap-4 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm uppercase tracking-[0.3em] text-muted">{state.chronicle}</div>
          {state.scene?.title && <h1 className="font-display text-5xl leading-tight text-brass">{state.scene.title}</h1>}
          {state.scene?.subtitle && <p className="font-display text-2xl text-parchment/80">{state.scene.subtitle}</p>}
        </div>
        {state.clock && <ClockView clock={state.clock} />}
      </header>

      <main className={`grid flex-1 gap-6 ${init ? 'lg:grid-cols-[minmax(0,1fr)_20rem]' : ''}`}>
        <div className="grid min-h-[40vh] place-items-center">
          {state.handout ? (
            <figure className="flex max-h-full flex-col items-center gap-3">
              {state.handout.image ? (
                <img src={state.handout.image} alt={state.handout.title} className="max-h-[60vh] max-w-full rounded shadow-2xl" />
              ) : state.handout.style ? (
                <HandoutView style={state.handout.style} text={state.handout.text ?? ''} size="clamp(1rem, 1.9vw, 1.75rem)" className="w-[min(56em,90vw)] shadow-2xl" />
              ) : (
                <blockquote className="max-w-3xl whitespace-pre-wrap rounded bg-parchment p-10 font-display text-3xl leading-snug text-ink shadow-2xl">
                  {redact(state.handout.text ?? '')}
                </blockquote>
              )}
              <figcaption className="font-display text-xl text-muted">{state.handout.title}</figcaption>
            </figure>
          ) : bigRoll ? (
            <BigRoll roll={bigRoll} />
          ) : (
            <span className="font-display text-7xl text-line">✦</span>
          )}
        </div>
        {init && <InitiativeView init={init} />}
      </main>

      {(feed.length > 0 || (state.party && state.party.length > 0)) && (
        <footer className="flex flex-col gap-3">
          {feed.length > 0 && <RollFeed rolls={feed} />}
          {state.party && state.party.length > 0 && (
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))]">
              {state.party.map((c) => (
                <PartyMember key={c.id} c={c} />
              ))}
            </div>
          )}
        </footer>
      )}
    </div>
  );
}

function ClockView({ clock }: { clock: Clock }) {
  const now = useNow(!!clock.endsAt);
  const remaining = clock.endsAt ? Math.max(0, clock.endsAt - now) : null;
  return (
    <div className="text-right">
      {clock.label && <div className="font-display text-2xl">{clock.label}</div>}
      {remaining !== null && (
        <div className={`font-mono text-5xl ${remaining < 60_000 ? 'text-wound' : ''}`}>
          {Math.floor(remaining / 60_000)}:{String(Math.floor((remaining % 60_000) / 1000)).padStart(2, '0')}
        </div>
      )}
      {clock.segments && (
        <div className="mt-2 flex justify-end gap-1">
          {Array.from({ length: clock.segments.total }, (_, i) => (
            <span key={i} className={`h-6 w-6 rounded-sm border ${i < clock.segments!.filled ? 'border-wound bg-wound' : 'border-line'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

const verdict = (r: LogEntry) => r.summary.split(' (')[0];
const tone = (r: LogEntry) => (r.outcome === 'botch' ? 'text-wound' : r.outcome === 'success' ? 'text-brass-bright' : 'text-parchment');

function BigRoll({ roll }: { roll: LogEntry }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="text-lg text-muted">
        {roll.who && `${roll.who} · `}
        {roll.label}
      </div>
      <div className={`font-display text-6xl ${tone(roll)}`}>{verdict(roll)}</div>
      {roll.faces.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {roll.faces.map((f, i) => (
            <span
              key={`${roll.id}-${i}`}
              className={`die h-14 w-14 animate-settle text-2xl ${f >= roll.difficulty ? 'die-hit' : ''} ${f === 1 ? 'die-one' : ''}`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function RollFeed({ rolls }: { rolls: LogEntry[] }) {
  return (
    <ol className="flex flex-wrap gap-2" aria-label="Recent rolls">
      {rolls.map((r, i) => (
        <li key={r.id} className={`rounded border border-line bg-panel px-3 py-1.5 ${i === 0 ? '' : 'opacity-70'}`}>
          <span className="text-sm text-muted">{r.who ? `${r.who} · ` : ''}{r.label} </span>
          <span className={`font-display text-lg ${tone(r)}`}>{verdict(r)}</span>
        </li>
      ))}
    </ol>
  );
}

function InitiativeView({ init }: { init: Initiative }) {
  return (
    <aside className="flex h-fit flex-col gap-2 rounded-lg border border-line bg-panel p-4" aria-label="Initiative">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-3xl text-brass">Initiative</h2>
        <span className="text-lg text-muted">Round {init.round}</span>
      </div>
      <ol className="flex flex-col gap-1">
        {init.entries.map((e, i) => (
          <li
            key={e.id}
            className={`flex items-center justify-between rounded px-3 py-1.5 text-xl ${i === init.current ? 'bg-brass text-ink' : 'text-parchment/85'}`}
            aria-current={i === init.current ? 'step' : undefined}
          >
            <span className="font-display">{e.name}</span>
            <span className="font-mono">{e.score}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}

function PartyMember({ c }: { c: PublicCharacter }) {
  const levels = c.health.levels;
  return (
    <article className="flex gap-3 rounded-lg border border-line bg-panel p-3">
      {c.image ? (
        <img src={c.image} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-raised font-display text-2xl text-muted">{c.name[0]}</span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="truncate font-display text-2xl leading-tight">{c.name}</div>
        <div className="flex gap-[3px]" aria-label={`Health: ${c.health.damage.length} of ${levels.length} levels taken`}>
          {levels.map((l, i) => (
            <span
              key={i}
              title={l.name}
              className={`grid h-5 w-5 place-items-center rounded-sm border font-mono text-xs ${c.health.damage[i] ? 'border-wound text-wound' : 'border-line'}`}
            >
              {c.health.damage[i] === 'B' ? '/' : c.health.damage[i] === 'L' ? '✕' : c.health.damage[i] === 'A' ? '✱' : ''}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-[3px]" aria-label={`Willpower ${c.willpower.temporary} of ${c.willpower.permanent}`}>
          <span className="mr-1 text-xs uppercase tracking-widest text-muted">WP</span>
          {Array.from({ length: c.willpower.permanent }, (_, i) => (
            <span key={i} className={`h-3 w-3 rounded-full border ${i < c.willpower.temporary ? 'border-brass bg-brass' : 'border-line'}`} />
          ))}
        </div>
        <div className="flex h-2 gap-px overflow-hidden rounded-sm" aria-label={`Quintessence ${c.quintessence}, Paradox ${c.paradox}`}>
          {Array.from({ length: WHEEL_SIZE }, (_, i) => (
            <span key={i} className={`flex-1 ${i < c.quintessence ? 'bg-quint' : WHEEL_SIZE - 1 - i < c.paradox ? 'bg-paradox' : 'bg-raised'}`} />
          ))}
        </div>
      </div>
    </article>
  );
}
