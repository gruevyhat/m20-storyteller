// The player-facing window. It only ever receives the public slice of the chronicle.
import { useEffect, useState } from 'react';
import { openChannel, type PublicState } from '../sync/channel';

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

  const clock = state?.clock;
  const now = useNow(!!clock?.endsAt);
  const remaining = clock?.endsAt ? Math.max(0, clock.endsAt - now) : null;
  const roll = state?.roll;
  const recent = roll && Date.now() - roll.at < 10 * 60_000;

  if (!state) {
    return (
      <div className="grid min-h-screen place-items-center p-8 text-center text-muted">
        <p>Waiting for the Storyteller's window. Open it in this same browser.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col gap-6 p-8">
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-display text-4xl text-brass">{state.chronicle}</h1>
        {clock && (
          <div className="text-right">
            {clock.label && <div className="font-display text-2xl">{clock.label}</div>}
            {remaining !== null && (
              <div className={`font-mono text-4xl ${remaining < 60_000 ? 'text-wound' : ''}`}>
                {Math.floor(remaining / 60_000)}:{String(Math.floor((remaining % 60_000) / 1000)).padStart(2, '0')}
              </div>
            )}
            {clock.segments && (
              <div className="mt-2 flex justify-end gap-1">
                {Array.from({ length: clock.segments.total }, (_, i) => (
                  <span key={i} className={`h-5 w-5 rounded-sm border ${i < clock.segments!.filled ? 'border-wound bg-wound' : 'border-line'}`} />
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      <main className="grid flex-1 place-items-center">
        {state.handout ? (
          <figure className="flex max-h-full flex-col items-center gap-3">
            {state.handout.image ? (
              <img src={state.handout.image} alt={state.handout.title} className="max-h-[75vh] max-w-full rounded shadow-2xl" />
            ) : (
              <blockquote className="max-w-3xl whitespace-pre-wrap rounded bg-parchment p-10 font-display text-3xl leading-snug text-ink shadow-2xl">
                {state.handout.text}
              </blockquote>
            )}
            <figcaption className="font-display text-xl text-muted">{state.handout.title}</figcaption>
          </figure>
        ) : (
          <span className="font-display text-6xl text-line">✦</span>
        )}
      </main>

      {roll && recent && (
        <footer className="mx-auto flex w-full max-w-4xl flex-col items-center gap-2 rounded-lg border border-line bg-panel p-5 text-center">
          <div className="text-sm text-muted">
            {roll.who && `${roll.who} · `}
            {roll.label}
          </div>
          <div className={`font-display text-4xl ${roll.outcome === 'botch' ? 'text-wound' : roll.outcome === 'success' ? 'text-brass-bright' : ''}`}>
            {roll.summary.split(' (')[0]}
          </div>
          {roll.faces.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {roll.faces.map((f, i) => (
                <span key={`${roll.id}-${i}`} className={`die animate-settle ${f >= roll.difficulty ? 'die-hit' : ''} ${f === 1 ? 'die-one' : ''}`} style={{ animationDelay: `${i * 30}ms` }}>
                  {f}
                </span>
              ))}
            </div>
          )}
        </footer>
      )}
    </div>
  );
}
