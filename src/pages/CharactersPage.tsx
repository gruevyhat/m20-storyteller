import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BoxTrack, DieButton, DotTrack, Dots, Field, HealthTrack, QPWheel, Stepper, readImageScaled } from '../components/ui';
import { RollDialog, type RollPreset } from '../components/RollDialog';
import { guessKind, importMarkdown } from '../importers/statblock';
import { ATTRIBUTES, SPHERES, WHEEL_SIZE, blankCharacter, type AbilityCategory, type Character, type MeritFlaw, type Sphere, type Trait } from '../model/types';
import { useChronicle } from '../store/chronicle';
import { ExportMenu } from '../components/ExportMenu';
import { NAME_STYLES, freshName } from '../names/markov';
import { MF_SUMMARY } from '../fortune/meritsFlawsText';
import { ExperiencePanel, ResonanceList, WonderList } from '../components/SheetExtras';
import { redrawBackgroundWonder, syncWonderBackground, wonderBackgroundRating } from '../wonders/background';

export default function CharactersPage() {
  const { id } = useParams();
  const { chronicle } = useChronicle();
  const selected = chronicle.characters.find((c) => c.id === id);
  return (
    <div className="grid gap-3 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <Roster />
      {selected ? <Editor key={selected.id} c={selected} /> : <Empty />}
    </div>
  );
}

function Empty() {
  return (
    <section className="panel text-sm text-muted">
      <p>Pick a character, make a new one, or import Obsidian notes that contain an M20 <code>statblock</code> (Fantasy Statblocks format).</p>
      <p className="mt-2">Import reads names, Attributes, Abilities, Backgrounds, Spheres, Arete, Willpower, the wheel, health track and rotes. Portraits aren't imported; add them here.</p>
    </section>
  );
}

function Roster() {
  const { chronicle, dispatch } = useChronicle();
  const navigate = useNavigate();
  const { id } = useParams();
  const [report, setReport] = useState<string[]>([]);

  async function onImport(files: FileList | null) {
    if (!files) return;
    const lines: string[] = [];
    const added: Character[] = [];
    for (const f of Array.from(files)) {
      const text = await f.text();
      const r = importMarkdown(text, f.name, guessKind(text, f.name));
      added.push(...r.characters);
      for (const c of r.characters) lines.push(`Imported ${c.name} (${c.kind.toUpperCase()})`);
      for (const s of r.skipped) lines.push(`Skipped ${s.file}: ${s.reason}`);
    }
    if (added.length) dispatch({ type: 'addCharacters', characters: added });
    setReport(lines);
  }

  function create(kind: Character['kind']) {
    const c = blankCharacter(kind);
    c.name = freshName();
    dispatch({ type: 'addCharacters', characters: [c] });
    navigate(`/characters/${c.id}`);
  }

  const group = (kind: Character['kind'], title: string) => (
    <div>
      <h3 className="label mb-1">{title}</h3>
      <ul className="flex flex-col">
        {chronicle.characters
          .filter((c) => c.kind === kind)
          .map((c) => (
            <li key={c.id}>
              <Link
                to={`/characters/${c.id}`}
                className={`flex items-center gap-2 rounded px-2 py-1 ${c.id === id ? 'bg-raised text-brass-bright' : 'hover:bg-raised'}`}
              >
                {c.image ? <img src={c.image} alt="" className="h-6 w-6 rounded-full object-cover" /> : <span className="h-6 w-6 rounded-full bg-line" />}
                <span className="truncate">{c.name}</span>
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );

  return (
    <aside className="panel flex h-fit flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button className="btn" onClick={() => create('pc')}>New PC</button>
        <button className="btn" onClick={() => create('npc')}>New NPC</button>
        <Link className="btn" to="/create">
          Guided…
        </Link>
        <label className="btn cursor-pointer">
          Import notes…
          <input type="file" accept=".md,.markdown,.txt" multiple className="sr-only" onChange={(e) => onImport(e.target.files)} />
        </label>
      </div>
      {report.length > 0 && (
        <ul className="rounded bg-raised p-2 text-xs">
          {report.map((l, i) => (
            <li key={i} className={l.startsWith('Skipped') ? 'text-wound' : ''}>
              {l}
            </li>
          ))}
        </ul>
      )}
      {group('pc', 'Player characters')}
      {group('npc', 'Storyteller characters')}
    </aside>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-1.5 border-t border-line pt-2">
      <h3 className="h-section text-lg text-brass">{title}</h3>
      {children}
    </section>
  );
}

function Editor({ c }: { c: Character }) {
  const { dispatch } = useChronicle();
  const navigate = useNavigate();
  return (
    <CharacterEditor
      c={c}
      onPatch={(p) => dispatch({ type: 'updateCharacter', id: c.id, patch: p })}
      onDelete={() => {
        dispatch({ type: 'removeCharacter', id: c.id });
        navigate('/characters');
      }}
    />
  );
}

/** The full sheet editor. Works on a chronicle character or on an unsaved draft. */
export function CharacterEditor({ c, onPatch, onDelete }: { c: Character; onPatch: (p: Partial<Character>) => void; onDelete?: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [rollPreset, setRollPreset] = useState<RollPreset | null>(null);
  const [nameStyle, setNameStyle] = useState('any');
  // Any change to Backgrounds keeps the Wonder Background's drawn Wonder in step.
  const patch = (p: Partial<Character>) => {
    if (!p.abilities) return onPatch(p);
    const next = { ...c, ...p };
    const synced = syncWonderBackground(c, next);
    onPatch(synced.wonders === next.wonders ? p : { ...p, wonders: synced.wonders });
  };
  const text = (key: keyof Character, label: string, area = false) => (
    <Field label={label}>
      {area ? (
        <textarea rows={2} value={(c[key] as string) ?? ''} onChange={(e) => patch({ [key]: e.target.value })} />
      ) : (
        <input value={(c[key] as string) ?? ''} onChange={(e) => patch({ [key]: e.target.value })} />
      )}
    </Field>
  );

  return (
    <article className="panel flex flex-col gap-2.5">
      <header className="flex flex-wrap items-center gap-3">
        <label className="group relative cursor-pointer" title="Change portrait">
          {c.image ? (
            <img src={c.image} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <span className="grid h-12 w-12 place-items-center rounded-full border border-dashed border-line text-[10px] text-muted">Portrait</span>
          )}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) patch({ image: await readImageScaled(f, 384) });
            }}
          />
        </label>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <input className="min-w-[12rem] flex-1 font-display text-2xl" value={c.name} placeholder="Name" onChange={(e) => patch({ name: e.target.value })} aria-label="Name" />
          <span className="flex items-center gap-1">
            <select value={nameStyle} onChange={(e) => setNameStyle(e.target.value)} aria-label="Naming tradition" title="Naming tradition">
              <option value="any">Onomastics</option>
              {NAME_STYLES.map((n) => (
                <option key={n.key} value={n.key}>
                  {n.label}
                </option>
              ))}
            </select>
            <button className="btn" onClick={() => patch({ name: freshName(nameStyle) })} title="Generate a name with a Markov model">
              Random name
            </button>
          </span>
          <div className="flex flex-wrap gap-2">
            <select value={c.kind} onChange={(e) => patch({ kind: e.target.value as Character['kind'] })} aria-label="Kind">
              <option value="pc">Player character</option>
              <option value="npc">Storyteller character</option>
            </select>
            {c.image && (
              <button className="btn-ghost" onClick={() => patch({ image: undefined })}>
                Remove portrait
              </button>
            )}
            <button className="btn" onClick={() => setRollPreset({})}>
              Roll…
            </button>
            <ExportMenu c={c} />
            {!onDelete ? null : confirmDelete ? (
              <span className="flex items-center gap-2 text-sm">
                Delete {c.name}?
                <button className="btn border-wound text-wound" onClick={onDelete}>
                  Delete
                </button>
                <button className="btn" onClick={() => setConfirmDelete(false)}>
                  Keep
                </button>
              </span>
            ) : (
              <button className="btn-ghost ml-auto" onClick={() => setConfirmDelete(true)}>
                Delete…
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="grid gap-2 sm:grid-cols-3">
        {text('concept', 'Concept')}
        {text('affiliation', 'Affiliation')}
        {text('nature', 'Nature')}
        {text('demeanor', 'Demeanor')}
        {text('essence', 'Essence')}
        {text('practice', 'Practice')}
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {text('paradigm', 'Paradigm')}
        {text('instruments', 'Instruments')}
      </div>

      <Section title="Attributes">
        <div className="grid gap-x-8 gap-y-2 sm:grid-cols-3">
          {(Object.keys(ATTRIBUTES) as (keyof typeof ATTRIBUTES)[]).map((g) => (
            <div key={g} className="flex flex-col gap-0.5">
              <span className="label">{g}</span>
              {ATTRIBUTES[g].map((n) => {
                const t = c.attributes[n] ?? { name: n, rating: 0 };
                return (
                  <div key={n} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-1">
                      <DieButton label={`Roll ${n}`} onClick={() => setRollPreset({ attribute: n })} />
                      {n}
                      {t.specialty && <span className="text-muted"> ({t.specialty})</span>}
                    </span>
                    {c.kind === 'npc' ? (
                      <input className="w-16 text-right font-mono" type="number" min={0} max={30} aria-label={`${n} rating`} value={t.rating}
                        onChange={(e) => patch({ attributes: { ...c.attributes, [n]: { ...t, rating: Math.max(0, Math.min(30, Math.trunc(Number(e.target.value) || 0))) } } })} />
                    ) : <Dots label={n} value={t.rating} onChange={(v) => patch({ attributes: { ...c.attributes, [n]: { ...t, rating: v } } })} />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Abilities & Backgrounds">
        <div className="grid gap-x-5 gap-y-2 md:grid-cols-2 xl:grid-cols-4">
          {(['talents', 'skills', 'knowledges', 'backgrounds'] as AbilityCategory[]).map((cat) => (
            <TraitList
              key={cat}
              title={cat}
              traits={c.abilities[cat]}
              onChange={(traits) => patch({ abilities: { ...c.abilities, [cat]: traits } })}
              onRoll={cat === 'backgrounds' ? undefined : (name) => setRollPreset({ ability: name })}
            />
          ))}
        </div>
      </Section>

      <Section title="Spheres">
        <label className="flex w-fit items-center gap-2 text-sm">
          <span className="label">Affinity</span>
          <select className="py-0" value={c.affinity ?? ''} onChange={(e) => patch({ affinity: (e.target.value || undefined) as Sphere | undefined })}>
            <option value="">None set</option>
            {SPHERES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-x-8 gap-y-0.5 sm:grid-cols-3">
          {SPHERES.map((s) => (
            <div key={s} className="flex items-center justify-between gap-2">
              <span className={(c.spheres[s] ?? 0) > c.arete ? 'text-wound' : s === c.affinity ? 'text-brass-bright' : ''}>
                {s}
                {s === c.affinity && <span className="text-[10px] text-muted"> affinity</span>}
              </span>
              <Dots label={s} value={c.spheres[s] ?? 0} onChange={(v) => patch({ spheres: { ...c.spheres, [s]: v } })} />
            </div>
          ))}
        </div>
      </Section>

      <div className="grid gap-x-8 md:grid-cols-[auto_auto] xl:grid-cols-[auto_auto_minmax(0,1fr)]">
        <Section title="Arete & Willpower">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1">
              <span className="label">Arete</span>
              <DieButton label="Roll Arete" onClick={() => setRollPreset({ attribute: 'Arete' })} />
            </span>
            <DotTrack label="Arete" value={c.arete} onChange={(v) => patch({ arete: v })} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1">
              <span className="label">Willpower</span>
              <DieButton label="Roll Willpower" onClick={() => setRollPreset({ attribute: 'Willpower' })} />
            </span>
            <DotTrack label="Willpower" value={c.willpower.permanent} min={1} onChange={(v) => patch({ willpower: { permanent: v, temporary: Math.min(v, c.willpower.temporary) } })} />
            <BoxTrack
              label="Temporary Willpower"
              value={c.willpower.temporary}
              limit={c.willpower.permanent}
              onChange={(v) => patch({ willpower: { ...c.willpower, temporary: v } })}
            />
          </div>
          {c.willpower.permanent < c.arete && (
            <p className="max-w-[12rem] text-xs text-wound">Willpower below Arete caps casting rolls and Spheres at {c.willpower.permanent} (M20 p. 329).</p>
          )}
        </Section>
        <Section title="Quintessence · Paradox">
          <div className="flex items-end gap-4">
            <QPWheel
              quintessence={c.quintessence}
              paradox={c.paradox}
              permanentParadox={c.permanentParadox}
              onChange={(quintessence, paradox) => patch({ quintessence, paradox })}
            />
            <Stepper label="Permanent" value={c.permanentParadox} onChange={(v) => patch({ permanentParadox: v, paradox: Math.max(v, c.paradox) })} min={0} max={WHEEL_SIZE} />
          </div>
        </Section>
        <div className="flex min-w-0 flex-col gap-2.5 md:col-span-2 xl:col-span-1 xl:row-span-2">
          <Section title="Merits & Flaws">
            <MeritFlawList items={c.meritsFlaws ?? []} onChange={(meritsFlaws) => patch({ meritsFlaws })} />
          </Section>
          <Section title="Paradox Flaws">
            <StringList title="" items={c.flaws} onChange={(flaws) => patch({ flaws })} placeholder="e.g. Clocks stop when she enters (until dawn)" />
          </Section>
        </div>
        <div className="min-w-0 md:col-span-2">
          <Section title="Health">
            <HealthTrack levels={c.health.levels} damage={c.health.damage} onChange={(damage) => patch({ health: { ...c.health, damage } })} />
            <p className="text-[11px] text-muted">{c.health.levels.map((l) => `${l.name}${l.penalty < 0 && l.penalty > -99 ? ` ${l.penalty}` : ''}`).join(' · ')}</p>
          </Section>
        </div>
      </div>

      <Section title="Rotes">
        <div className="grid gap-2 xl:grid-cols-2">
        {c.rotes.map((r, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex gap-1">
              <input className="flex-1 font-medium" value={r.name} onChange={(e) => patch({ rotes: c.rotes.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
              <button className="btn-ghost" onClick={() => patch({ rotes: c.rotes.filter((_, j) => j !== i) })} aria-label="Remove rote">
                ✕
              </button>
            </div>
            <textarea rows={3} className="text-xs" value={r.desc} onChange={(e) => patch({ rotes: c.rotes.map((x, j) => (j === i ? { ...x, desc: e.target.value } : x)) })} />
          </div>
        ))}
        </div>
        <button className="btn w-fit" onClick={() => patch({ rotes: [...c.rotes, { name: 'New rote', desc: '' }] })}>
          Add rote
        </button>
      </Section>

      <div className="grid gap-x-8 lg:grid-cols-2">
        <Section title="Avatar & Resonance">
          <textarea
            rows={2}
            className="text-xs"
            value={c.avatar ?? ''}
            placeholder="How the Avatar appears and speaks; Seekings set and passed"
            onChange={(e) => patch({ avatar: e.target.value })}
            aria-label="Avatar"
          />
          <ResonanceList items={c.resonance ?? []} onChange={(resonance) => patch({ resonance })} />
        </Section>
        <Section title="Wonders">
          <WonderList
            items={c.wonders ?? []}
            onChange={(wonders) => patch({ wonders })}
            backgroundRating={wonderBackgroundRating(c)}
            onDraw={() => patch({ wonders: redrawBackgroundWonder(c).wonders })}
          />
        </Section>
      </div>

      {c.kind === 'pc' && (
        <Section title="Experience">
          <ExperiencePanel c={c} onPatch={patch} />
        </Section>
      )}

      <Section title="Notes">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <textarea rows={6} className="text-xs" value={c.notes} onChange={(e) => patch({ notes: e.target.value })} />
        {Object.keys(c.extra).length > 0 && (
          <dl className="grid content-start gap-1.5 text-xs">
            {Object.entries(c.extra).map(([k, v]) => (
              <div key={k}>
                <dt className="label">{k.replace(/_/g, ' ')}</dt>
                <dd className="whitespace-pre-wrap text-parchment/80">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        </div>
      </Section>
      {rollPreset && <RollDialog c={c} preset={rollPreset} onPatch={patch} onClose={() => setRollPreset(null)} />}
    </article>
  );
}

function TraitList({ title, traits, onChange, onRoll }: { title: string; traits: Trait[]; onChange: (t: Trait[]) => void; onRoll?: (name: string) => void }) {
  const set = (i: number, t: Partial<Trait>) => onChange(traits.map((x, j) => (j === i ? { ...x, ...t } : x)));
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="label">{title}</span>
      {traits.map((t, i) => (
        <div key={i} className="flex items-center gap-1">
          {onRoll && <DieButton label={`Roll ${t.name || 'this ability'}`} onClick={() => onRoll(t.name)} />}
          <input className="w-24 min-w-0 flex-[3] py-0" value={t.name} onChange={(e) => set(i, { name: e.target.value })} aria-label={`${title} name`} />
          <input className="w-16 min-w-0 flex-[2] py-0 text-xs" placeholder="specialty" value={t.specialty ?? ''} onChange={(e) => set(i, { specialty: e.target.value || undefined })} />
          <Dots label={t.name} value={t.rating} onChange={(v) => set(i, { rating: v })} />
          <button className="btn-ghost px-1" onClick={() => onChange(traits.filter((_, j) => j !== i))} aria-label={`Remove ${t.name}`}>
            ✕
          </button>
        </div>
      ))}
      <button className="btn-ghost w-fit" onClick={() => onChange([...traits, { name: '', rating: 1 }])}>
        + Add
      </button>
    </div>
  );
}

function MeritFlawList({ items, onChange }: { items: MeritFlaw[]; onChange: (v: MeritFlaw[]) => void }) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<MeritFlaw['kind']>('merit');
  const [points, setPoints] = useState(1);
  const total = (k: MeritFlaw['kind']) => items.filter((m) => m.kind === k).reduce((t, m) => t + m.points, 0);
  const merits = total('merit');
  const flaws = total('flaw');
  return (
    <div className="flex flex-col gap-1">
      {items.map((m, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className={`mt-0.5 w-12 shrink-0 text-[10px] uppercase tracking-widest ${m.kind === 'merit' ? 'text-verdigris' : 'text-wound'}`}>{m.kind}</span>
          <span className="flex-1 leading-snug">
            {m.name}
            {m.note && <span className="text-xs text-muted"> · {m.note}</span>}
            {MF_SUMMARY[m.name] && <span className="block text-xs text-parchment/70">{MF_SUMMARY[m.name]}</span>}
          </span>
          <span className="font-mono text-xs">{m.points} pt.</span>
          <button className="btn-ghost px-1" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={`Remove ${m.name}`}>
            ✕
          </button>
        </div>
      ))}
      {items.length > 0 && (
        <p className={`text-xs ${merits === flaws ? 'text-muted' : 'text-wound'}`}>
          Merits {merits} pt. · Flaws {flaws} pt.{merits === flaws ? ' (balanced)' : flaws > merits ? ` · ${flaws - merits} freebies gained` : ` · ${merits - flaws} freebies spent`}
          {flaws > 7 && ' · over the 7-point Flaw limit'}
        </p>
      )}
      <form
        className="flex flex-wrap gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onChange([...items, { name: name.trim(), kind, points }]);
          setName('');
        }}
      >
        <select value={kind} onChange={(e) => setKind(e.target.value as MeritFlaw['kind'])} aria-label="Merit or Flaw">
          <option value="merit">Merit</option>
          <option value="flaw">Flaw</option>
        </select>
        <input className="min-w-0 flex-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lucky" aria-label="Merit or Flaw name" />
        <input type="number" min={1} max={10} className="w-14" value={points} onChange={(e) => setPoints(Number(e.target.value) || 1)} aria-label="Points" />
        <button className="btn" type="submit">
          Add
        </button>
      </form>
    </div>
  );
}

function StringList({ title, items, onChange, placeholder }: { title: string; items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState('');
  return (
    <div className="flex flex-col gap-1">
      {title && <span className="label">{title}</span>}
      {items.map((s, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="flex-1 text-paradox">{s}</span>
          <button className="btn-ghost" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove">
            ✕
          </button>
        </div>
      ))}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) onChange([...items, draft.trim()]);
          setDraft('');
        }}
      >
        <input className="flex-1" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} />
        <button className="btn" type="submit">
          Add
        </button>
      </form>
    </div>
  );
}
