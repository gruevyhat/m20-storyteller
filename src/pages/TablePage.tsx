import { useState } from 'react';
import { Link } from 'react-router-dom';
import Roller from '../components/Roller';
import { BoxTrack, DotTrack, HealthTrack, QPWheel, Toggle } from '../components/ui';
import { newId, type Character, type Initiative, type InitiativeEntry } from '../model/types';
import { cryptoD10 } from '../engine/dice';
import { openPlayerWindow } from '../App';
import { screenOptions, useChronicle } from '../store/chronicle';

export default function TablePage() {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Roller />
        {/* On wide screens the sidebar takes the roller's height and the log scrolls inside it. */}
        <div className="relative min-w-0 xl:min-h-[14rem]">
          <div className="flex flex-col gap-3 xl:absolute xl:inset-0">
            <Log />
          </div>
        </div>
      </div>
      <Party />
      <div className="grid items-start gap-3 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-3">
          <ScreenControl />
          <ClockControl />
        </div>
        <InitiativeControl />
      </div>
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

function ScreenControl() {
  const { chronicle, dispatch } = useChronicle();
  const opts = screenOptions(chronicle);
  const [title, setTitle] = useState(chronicle.scene?.title ?? '');
  const [subtitle, setSubtitle] = useState(chronicle.scene?.subtitle ?? '');
  const shown = chronicle.handouts.find((h) => h.id === chronicle.shownHandout);
  return (
    <section className="panel flex flex-col gap-2" aria-label="Player screen">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="h-section">Player screen</h2>
        <button className="btn-ghost text-xs" onClick={openPlayerWindow}>
          Open ↗
        </button>
      </div>
      <form
        className="flex flex-col gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          dispatch({ type: 'scene', scene: title.trim() || subtitle.trim() ? { title: title.trim(), subtitle: subtitle.trim() } : null });
        }}
      >
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Scene, e.g. Prague: Žižkov" aria-label="Scene title" />
        <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle, e.g. 2:14 a.m., the morning after" aria-label="Scene subtitle" />
        <div className="flex gap-2">
          <button className="btn-primary" type="submit">
            Show scene
          </button>
          <button
            className="btn"
            type="button"
            disabled={!chronicle.scene}
            onClick={() => {
              dispatch({ type: 'scene', scene: null });
              setTitle('');
              setSubtitle('');
            }}
          >
            Clear
          </button>
        </div>
      </form>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <Toggle checked={opts.showParty} onChange={(v) => dispatch({ type: 'screen', screen: { showParty: v } })}>
          Show the cabal's health, Willpower and wheel
        </Toggle>
        <Toggle checked={opts.showRolls} onChange={(v) => dispatch({ type: 'screen', screen: { showRolls: v } })}>
          Show public rolls
        </Toggle>
      </div>
      <p className="text-xs text-muted">
        {shown ? (
          <>
            Showing handout <b className="text-parchment">{shown.title}</b>.{' '}
            <button className="underline" onClick={() => dispatch({ type: 'showHandout', id: null })}>
              Hide it
            </button>
          </>
        ) : (
          <>
            No handout showing. <Link className="underline" to="/chronicle">Pick one from the chronicle.</Link>
          </>
        )}
      </p>
    </section>
  );
}

/** M20 initiative: one die plus Dexterity + Wits (p. 399). */
const initiativeRating = (c: Character) => (c.attributes.Dexterity?.rating ?? 0) + (c.attributes.Wits?.rating ?? 0);

function sortEntries(entries: InitiativeEntry[]) {
  return [...entries].sort((a, b) => b.score - a.score);
}

function InitiativeControl() {
  const { chronicle, dispatch } = useChronicle();
  const init = chronicle.initiative ?? null;
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [npcId, setNpcId] = useState('');
  const npcs = chronicle.characters.filter((c) => c.kind === 'npc');
  const save = (next: Initiative | null) => dispatch({ type: 'initiative', initiative: next });
  const withEntries = (entries: InitiativeEntry[]) => {
    const current = init?.entries[init.current];
    const sorted = sortEntries(entries);
    // Keep the turn marker on whoever was acting.
    const idx = current ? Math.max(0, sorted.findIndex((e) => e.id === current.id)) : 0;
    save({ entries: sorted, current: idx, round: init?.round ?? 1 });
  };
  const roll = (n: string, r: number, characterId?: string): InitiativeEntry => ({ id: newId(), name: n, score: cryptoD10() + r, characterId });

  return (
    <section className="panel flex flex-col gap-2" aria-label="Initiative">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="h-section">Initiative</h2>
        {init && <span className="text-xs text-muted">Round {init.round}</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          className="btn-primary"
          onClick={() => {
            const pcs = chronicle.characters.filter((c) => c.kind === 'pc');
            const others = (init?.entries ?? []).filter((e) => !pcs.some((p) => p.id === e.characterId));
            save({ entries: sortEntries([...others, ...pcs.map((c) => roll(c.name, initiativeRating(c), c.id))]), current: 0, round: init?.round ?? 1 });
          }}
        >
          Roll the cabal
        </button>
        {npcs.length > 0 && (
          <span className="flex gap-1">
            <select value={npcId} onChange={(e) => setNpcId(e.target.value)} aria-label="Storyteller character">
              <option value="">Add an NPC…</option>
              {npcs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({initiativeRating(c)})
                </option>
              ))}
            </select>
            <button
              className="btn"
              disabled={!npcId}
              onClick={() => {
                const c = npcs.find((x) => x.id === npcId)!;
                withEntries([...(init?.entries ?? []), roll(c.name, initiativeRating(c), c.id)]);
                setNpcId('');
              }}
            >
              Add
            </button>
          </span>
        )}
      </div>
      <form
        className="flex flex-wrap items-end gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          withEntries([...(init?.entries ?? []), roll(name.trim(), rating)]);
          setName('');
        }}
      >
        <input className="min-w-0 flex-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Opponent, e.g. Grey Suit 1" aria-label="Opponent name" />
        <label className="flex items-center gap-1 text-xs text-muted">
          Dex + Wits
          <input type="number" className="w-14" min={0} max={20} value={rating} onChange={(e) => setRating(Number(e.target.value) || 0)} aria-label="Initiative rating" />
        </label>
        <button className="btn" type="submit">
          Roll in
        </button>
      </form>
      {init && init.entries.length > 0 && (
        <>
          <ol className="flex flex-col gap-0.5">
            {init.entries.map((e, i) => (
              <li key={e.id} className={`flex items-center gap-2 rounded px-2 py-0.5 ${i === init.current ? 'bg-brass/20 text-brass-bright' : ''}`}>
                <span className="w-4 text-xs text-muted">{i === init.current ? '▶' : ''}</span>
                <span className="flex-1 truncate">{e.name}</span>
                <input
                  type="number"
                  className="w-14 py-0 text-right font-mono"
                  value={e.score}
                  onChange={(ev) => withEntries(init.entries.map((x) => (x.id === e.id ? { ...x, score: Number(ev.target.value) || 0 } : x)))}
                  aria-label={`${e.name} initiative`}
                />
                <button className="btn-ghost px-1" onClick={() => withEntries(init.entries.filter((x) => x.id !== e.id))} aria-label={`Remove ${e.name}`}>
                  ✕
                </button>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-1.5">
            <button
              className="btn"
              onClick={() => save({ ...init, current: (init.current - 1 + init.entries.length) % init.entries.length, round: init.current === 0 ? Math.max(1, init.round - 1) : init.round })}
            >
              ← Previous
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                const last = init.current >= init.entries.length - 1;
                save({ ...init, current: last ? 0 : init.current + 1, round: last ? init.round + 1 : init.round });
              }}
            >
              Next turn →
            </button>
            <button className="btn-ghost" onClick={() => save(null)}>
              End combat
            </button>
          </div>
        </>
      )}
    </section>
  );
}
