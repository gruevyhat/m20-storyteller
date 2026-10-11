import { useState } from 'react';
import { Link } from 'react-router-dom';
import Roller from '../components/Roller';
import { BoxTrack, DotTrack, HealthTrack, QPWheel } from '../components/ui';
import type { Character } from '../model/types';
import { useChronicle } from '../store/chronicle';

export default function TablePage() {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Roller />
        {/* On wide screens the sidebar takes the roller's height and the log scrolls inside it. */}
        <div className="relative min-w-0 xl:min-h-[14rem]">
          <div className="flex flex-col gap-3 xl:absolute xl:inset-0">
            <ClockControl />
            <Log />
          </div>
        </div>
      </div>
      <Party />
    </div>
  );
}

function Party() {
  const { chronicle } = useChronicle();
  const pcs = chronicle.characters.filter((c) => c.kind === 'pc');
  return (
    <section className="panel flex flex-col gap-2" aria-label="Party">
      <h2 className="h-section">Cabal</h2>
      {pcs.length === 0 && (
        <p className="text-sm text-muted">
          No player characters yet. <Link className="text-brass underline" to="/characters">Add or import some.</Link>
        </p>
      )}
      <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(19rem,1fr))]">
        {pcs.map((c) => (
          <PartyCard key={c.id} c={c} />
        ))}
      </div>
    </section>
  );
}

function PartyCard({ c }: { c: Character }) {
  const { dispatch } = useChronicle();
  const patch = (p: Partial<Character>) => dispatch({ type: 'updateCharacter', id: c.id, patch: p });
  return (
    <article className="flex flex-col gap-1.5 rounded border border-line bg-raised/40 p-2">
      <div className="flex items-center gap-2">
        {c.image && <img src={c.image} alt="" className="h-9 w-9 rounded-full object-cover" />}
        <div className="min-w-0">
          <Link to={`/characters/${c.id}`} className="font-display text-lg leading-tight hover:text-brass-bright">
            {c.name}
          </Link>
          <div className="truncate text-xs text-muted">{c.concept}</div>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-col gap-0.5">
            <span className="label">Arete</span>
            <DotTrack size="sm" label="Arete" value={c.arete} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="label">Willpower</span>
            <DotTrack size="sm" label="Willpower" value={c.willpower.permanent} />
            <BoxTrack
              size="sm"
              label="Temporary Willpower"
              value={c.willpower.temporary}
              limit={c.willpower.permanent}
              onChange={(v) => patch({ willpower: { ...c.willpower, temporary: v } })}
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="label">Health</span>
            <HealthTrack compact levels={c.health.levels} damage={c.health.damage} onChange={(damage) => patch({ health: { ...c.health, damage } })} />
          </div>
        </div>
        <QPWheel
          size={100}
          quintessence={c.quintessence}
          paradox={c.paradox}
          permanentParadox={c.permanentParadox}
          onChange={(quintessence, paradox) => patch({ quintessence, paradox })}
        />
      </div>
      {c.flaws.length > 0 && <div className="text-xs text-paradox">Flaws: {c.flaws.join('; ')}</div>}
    </article>
  );
}

function ClockControl() {
  const { chronicle, dispatch } = useChronicle();
  const clock = chronicle.clock;
  const [label, setLabel] = useState(clock?.label ?? '');
  const [minutes, setMinutes] = useState(0);
  const [segments, setSegments] = useState(0);
  return (
    <section className="panel flex flex-col gap-2" aria-label="Player screen clock">
      <h2 className="h-section" title="Shown on the player screen: a countdown, a segmented clock, or just a caption.">Clock</h2>
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Caption, e.g. Dawn in Prague" />
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-0.5">
          <span className="label">Minutes</span>
          <input type="number" min={0} className="w-16" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="label">Segments</span>
          <input type="number" min={0} max={12} className="w-16" value={segments} onChange={(e) => setSegments(Number(e.target.value))} />
        </label>
        <button
          className="btn-primary"
          onClick={() =>
            dispatch({
              type: 'clock',
              clock: {
                label,
                endsAt: minutes > 0 ? Date.now() + minutes * 60_000 : undefined,
                segments: segments > 0 ? { total: segments, filled: 0 } : undefined,
              },
            })
          }
        >
          Show
        </button>
        <button className="btn" onClick={() => dispatch({ type: 'clock', clock: null })} disabled={!clock}>
          Hide
        </button>
      </div>
      {clock?.segments && (
        <div className="flex items-center gap-2 text-sm">
          <span>
            {clock.segments.filled}/{clock.segments.total}
          </span>
          <button
            className="btn"
            onClick={() => dispatch({ type: 'clock', clock: { ...clock, segments: { ...clock.segments!, filled: Math.max(0, clock.segments!.filled - 1) } } })}
          >
            −
          </button>
          <button
            className="btn"
            onClick={() =>
              dispatch({
                type: 'clock',
                clock: { ...clock, segments: { ...clock.segments!, filled: Math.min(clock.segments!.total, clock.segments!.filled + 1) } },
              })
            }
          >
            Tick
          </button>
        </div>
      )}
    </section>
  );
}

function Log() {
  const { chronicle, dispatch } = useChronicle();
  return (
    <section className="panel flex min-h-0 flex-1 flex-col gap-1.5" aria-label="Roll log">
      <div className="flex items-center justify-between">
        <h2 className="h-section">Log</h2>
        <button className="btn-ghost" onClick={() => dispatch({ type: 'clearLog' })} disabled={!chronicle.log.length}>
          Clear
        </button>
      </div>
      <ol className="flex max-h-[24rem] min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1 xl:max-h-none">
        {chronicle.log.map((e) => (
          <li key={e.id} className="border-b border-line pb-1.5 text-xs last:border-0">
            <div className="flex justify-between gap-2">
              <span className="font-medium">
                {e.who && <span className="text-muted">{e.who} · </span>}
                {e.label}
              </span>
              <span className="shrink-0 text-xs text-muted">
                {e.public ? '' : 'hidden · '}
                {new Date(e.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className={e.outcome === 'botch' ? 'text-wound' : e.outcome === 'success' ? 'text-brass-bright' : 'text-parchment/80'}>{e.summary}</div>
            {e.faces.length > 0 && <div className="font-mono text-xs text-muted">{e.faces.join(' ')}</div>}
          </li>
        ))}
        {!chronicle.log.length && <li className="text-sm text-muted">Nothing rolled yet.</li>}
      </ol>
    </section>
  );
}
