import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs } from '../components/ui';
import { newSeed } from '../fortune/build';
import { CATALOG_SIZE, buildCatalog, castableBy, conjure, roteText, sphereLabel, type Rote } from '../grimoire/generate';
import { INFLUENCES, influence } from '../grimoire/influences';
import { SPHERES, type Sphere } from '../model/types';
import { useChronicle } from '../store/chronicle';

const PAGE = 24;

export default function GrimoirePage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('seed') ? 'conjure' : 'catalog';
  const seed = params.get('seed');
  const forced = params.get('hand') ?? '';
  const catalog = useMemo(() => buildCatalog(), []);
  const conjured = useMemo(() => (seed ? conjure(seed, 12, forced) : []), [seed, forced]);
  const { chronicle } = useChronicle();

  const [query, setQuery] = useState('');
  const [hands, setHands] = useState<string[]>([]);
  const [spheres, setSpheres] = useState<Sphere[]>([]);
  const [mode, setMode] = useState<'any' | 'coincidental' | 'vulgar'>('any');
  const [maxRank, setMaxRank] = useState(5);
  const [casterId, setCasterId] = useState('');
  const [shown, setShown] = useState(PAGE);
  const caster = chronicle.characters.find((c) => c.id === casterId);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((r) => {
      if (hands.length && !hands.includes(r.influence)) return false;
      if (spheres.length && !spheres.every((s) => r.spheres[s])) return false;
      if (mode === 'coincidental' && r.mode === 'vulgar') return false;
      if (mode === 'vulgar' && r.mode === 'coincidental') return false;
      if (r.highest > maxRank) return false;
      if (caster && !castableBy(r, caster.spheres)) return false;
      if (q && !`${r.name} ${r.description} ${r.system.join(' ')}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [catalog, query, hands, spheres, mode, maxRank, caster]);

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const reset = () => setShown(PAGE);

  return (
    <div className="flex flex-col gap-3">
      <section className="panel flex flex-col gap-1.5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl leading-tight text-brass">Grimoire</h1>
            <p className="max-w-3xl text-sm text-muted">
              {CATALOG_SIZE} rotes, each built by combining an M20 Sphere Effect, up to two modifiers and one of six hands. Every rote lists its Spheres, difficulty,
              successes and rules text, and you can add any of them to a character.
            </p>
          </div>
          <Tabs
            value={tab}
            onChange={(t) => setParams(t === 'conjure' ? { seed: newSeed() } : {})}
            options={[
              { value: 'catalog', label: 'Catalog' },
              { value: 'conjure', label: 'Conjure' },
            ]}
          />
        </div>
        <details className="text-xs text-muted">
          <summary className="cursor-pointer">The six hands</summary>
          <ul className="mt-1 grid gap-x-6 gap-y-0.5 md:grid-cols-2">
            {INFLUENCES.map((i) => (
              <li key={i.key}>
                <b className="text-parchment">{i.label}</b>: {i.blurb}
              </li>
            ))}
          </ul>
        </details>
      </section>

      {tab === 'catalog' ? (
        <>
          <section className="panel flex flex-col gap-2" aria-label="Filters">
            <input
              type="search"
              className="px-2 py-1"
              placeholder="Search names and text: fire, memory, spirit, phone line…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                reset();
              }}
            />
            <div className="flex flex-wrap gap-1" role="group" aria-label="Hands">
              {INFLUENCES.map((i) => (
                <button
                  key={i.key}
                  className={`chip ${hands.includes(i.key) ? 'border-brass text-brass-bright' : 'text-muted hover:text-parchment'}`}
                  aria-pressed={hands.includes(i.key)}
                  onClick={() => {
                    setHands(toggle(hands, i.key));
                    reset();
                  }}
                >
                  {i.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1" role="group" aria-label="Uses Spheres">
              {SPHERES.map((s) => (
                <button
                  key={s}
                  className={`chip ${spheres.includes(s) ? 'border-verdigris text-verdigris' : 'text-muted hover:text-parchment'}`}
                  aria-pressed={spheres.includes(s)}
                  onClick={() => {
                    setSpheres(toggle(spheres, s));
                    reset();
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-0.5">
                <span className="label">Coincidental or vulgar</span>
                <select
                  value={mode}
                  onChange={(e) => {
                    setMode(e.target.value as typeof mode);
                    reset();
                  }}
                >
                  <option value="any">Either</option>
                  <option value="coincidental">Can be coincidental</option>
                  <option value="vulgar">Can be vulgar</option>
                </select>
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="label">Highest Sphere</span>
                <select
                  value={maxRank}
                  onChange={(e) => {
                    setMaxRank(Number(e.target.value));
                    reset();
                  }}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n === 5 ? 'Any' : `${n} or less`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="label">Castable by</span>
                <select
                  value={casterId}
                  onChange={(e) => {
                    setCasterId(e.target.value);
                    reset();
                  }}
                >
                  <option value="">Anyone</option>
                  {chronicle.characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <span className="ml-auto text-sm text-muted">{filtered.length} rotes</span>
            </div>
          </section>

          <RoteList rotes={filtered.slice(0, shown)} defaultCharacter={casterId} />
          {shown < filtered.length && (
            <button className="btn mx-auto" onClick={() => setShown(shown + PAGE)}>
              Show {Math.min(PAGE, filtered.length - shown)} more
            </button>
          )}
        </>
      ) : (
        <>
          <section className="panel flex flex-wrap items-end gap-3 py-2">
            <label className="flex flex-col gap-1">
              <span className="label">Hand</span>
              <select value={forced} onChange={(e) => setParams(e.target.value ? { seed: seed!, hand: e.target.value } : { seed: seed! })}>
                <option value="">Any</option>
                {INFLUENCES.map((i) => (
                  <option key={i.key} value={i.key}>
                    {i.label}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn-primary" onClick={() => setParams(forced ? { seed: newSeed(), hand: forced } : { seed: newSeed() })}>
              Conjure twelve more
            </button>
            <span className="text-xs text-muted">
              Seed <code className="text-parchment">{seed}</code>. Share this page's address to share the same twelve.
            </span>
          </section>
          <RoteList rotes={conjured} defaultCharacter="" />
        </>
      )}
    </div>
  );
}

function RoteList({ rotes, defaultCharacter }: { rotes: Rote[]; defaultCharacter: string }) {
  if (!rotes.length) return <p className="text-center text-muted">No rotes match. Loosen a filter.</p>;
  return (
    <ol className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
      {rotes.map((r) => (
        <RoteCard key={r.id} r={r} defaultCharacter={defaultCharacter} />
      ))}
    </ol>
  );
}

function RoteCard({ r, defaultCharacter }: { r: Rote; defaultCharacter: string }) {
  const { chronicle, dispatch } = useChronicle();
  const [target, setTarget] = useState(defaultCharacter);
  const [note, setNote] = useState('');
  const inf = influence(r.influence);
  const who = chronicle.characters.find((c) => c.id === (target || defaultCharacter));

  function add() {
    if (!who) return;
    const stored = `${r.name} (${sphereLabel(r.spheres)})`;
    if (who.rotes.some((x) => x.name === stored)) {
      setNote(`${who.name} already knows it.`);
      return;
    }
    dispatch({
      type: 'updateCharacter',
      id: who.id,
      patch: (c) => ({ ...c, rotes: [...c.rotes, { name: stored, desc: roteText(r) }] }),
    });
    setNote(`Added to ${who.name}.`);
  }

  const diff = [
    r.difficulty.coincidental !== undefined && `coincidental ${r.difficulty.coincidental}`,
    r.difficulty.vulgar !== undefined && `vulgar ${r.difficulty.vulgar}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <li className="panel flex flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-2xl leading-tight">{r.name}</h3>
        <span className="chip text-muted" title={inf.blurb}>
          {inf.label}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {SPHERES.filter((s) => r.spheres[s])
          .sort((a, b) => (r.spheres[b] ?? 0) - (r.spheres[a] ?? 0))
          .map((s) => (
            <span key={s} className="chip border-verdigris/50 text-verdigris">
              {s} {'●'.repeat(r.spheres[s]!)}
            </span>
          ))}
        <span className={`chip ${r.mode === 'vulgar' ? 'border-wound/60 text-wound' : 'text-muted'}`}>{r.mode === 'either' ? 'coincidental or vulgar' : r.mode}</span>
        {r.harm && <span className="chip border-wound/60 text-wound">harm</span>}
      </div>
      <p className="font-display text-lg leading-snug">{r.description}</p>
      <p className="text-sm">
        <span className="label">Difficulty</span> {diff} · <span className="label">Successes</span> {r.successes}
      </p>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted">Rules, focus and backlash</summary>
        <p className="mt-2 text-xs text-muted">Suggested systems; the Storyteller has the final say.</p>
        <ul className="mt-1 flex list-disc flex-col gap-1 pl-5 text-parchment/90">
          {r.system.map((s) => (
            <li key={s}>{s}</li>
          ))}
          <li>
            Focus: {r.practice}; {r.ability} for any mundane focus roll.
          </li>
          <li>{r.backlash}</li>
          <li>Often found among: {r.factions.join(', ')}.</li>
        </ul>
      </details>
      <blockquote className="border-l-2 border-line pl-2 font-display italic text-muted">“{r.quote}”</blockquote>
      {chronicle.characters.length > 0 && (
        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          <select value={target || defaultCharacter} onChange={(e) => setTarget(e.target.value)} aria-label={`Add ${r.name} to`}>
            <option value="">Add to…</option>
            {chronicle.characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {castableBy(r, c.spheres) ? '' : ' (lacks the Spheres)'}
              </option>
            ))}
          </select>
          <button className="btn" onClick={add} disabled={!who}>
            Add rote
          </button>
          {note && <span className="text-sm text-brass">{note}</span>}
        </div>
      )}
    </li>
  );
}
