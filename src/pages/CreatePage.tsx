import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExportMenu } from '../components/ExportMenu';
import { Dots } from '../components/ui';
import { ARCHETYPES, CONCEPTS, PARADIGMS } from '../fortune/deck';
import { FACTIONS, INSTRUMENTS, OCCUPATIONS, faction, type Camp } from '../fortune/lore';
import { MERITS_FLAWS } from '../fortune/meritsFlaws';
import { MF_SUMMARY } from '../fortune/meritsFlawsText';
import { startingRotes } from '../fortune/build';
import { roteText, sphereLabel } from '../grimoire/generate';
import { DEFAULT_USE } from '../model/abilityDefaults';
import {
  ABILITY_LISTS,
  BACKGROUNDS,
  BACKGROUND_DOTS,
  COST,
  FREEBIES,
  SPHERE_DOTS,
  STEPS,
  TECHNOCRACY_BACKGROUNDS,
  abilityAllowance,
  abilitySpent,
  attrAllowance,
  attrSpent,
  backgroundSpent,
  blankBuild,
  buildCharacter,
  finalAbility,
  finalAttr,
  finalBackground,
  finalSphere,
  flawPoints,
  freebiesLeft,
  meritPoints,
  problems,
  sphereSpent,
  type AbilityGroup,
  type AttrGroup,
  type Build,
  type StepKey,
} from '../model/creation';
import { ARCHETYPE_GLOSS, ESSENCE_GLOSS, STEP_GUIDE } from '../model/glosses';
import { ATTRIBUTES, SPHERES, newId, type Sphere } from '../model/types';
import { NAME_STYLES, freshName } from '../names/markov';
import { useChronicle } from '../store/chronicle';

const STORE = 'm20-guided-build';
const PRACTICES = Object.keys(INSTRUMENTS).sort();
const CAMPS: { camp: Camp; label: string }[] = [
  { camp: 'Tradition', label: 'Council of Nine Traditions' },
  { camp: 'Technocracy', label: 'Technocratic Union' },
  { camp: 'Craft', label: 'Disparate Crafts' },
  { camp: 'Orphan', label: 'Unaffiliated' },
];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function loadBuild(): Build {
  try {
    const raw = sessionStorage.getItem(STORE);
    if (raw) return { ...blankBuild(), ...JSON.parse(raw) };
  } catch {
    /* storage unavailable */
  }
  return blankBuild();
}

export default function CreatePage() {
  const [b, setB] = useState<Build>(loadBuild);
  const [step, setStep] = useState<StepKey>('concept');
  const p = useMemo(() => problems(b), [b]);
  const character = useMemo(() => buildCharacter(b), [b]);
  const up = (patch: Partial<Build> | ((x: Build) => Build)) => setB((x) => (typeof patch === 'function' ? patch(x) : { ...x, ...patch }));

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify(b));
    } catch {
      /* storage unavailable */
    }
  }, [b]);

  const index = STEPS.findIndex((s) => s.key === step);
  const go = (d: number) => {
    setStep(STEPS[Math.max(0, Math.min(STEPS.length - 1, index + d))].key);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)_19rem]">
      <nav className="panel flex h-fit flex-col gap-1 lg:sticky lg:top-14" aria-label="Steps">
        <h1 className="font-display text-2xl leading-tight text-brass">New mage</h1>
        <p className="mb-1 text-xs text-muted">Step by step, by the M20 rules.</p>
        <ol className="flex flex-wrap gap-1 lg:flex-col">
          {STEPS.map((s, i) => {
            const done = s.key !== 'finish' && p[s.key].length === 0;
            return (
              <li key={s.key}>
                <button
                  className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm ${step === s.key ? 'bg-raised text-brass-bright' : 'text-muted hover:text-parchment'}`}
                  onClick={() => setStep(s.key)}
                  aria-current={step === s.key ? 'step' : undefined}
                >
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] ${done ? 'border-verdigris bg-verdigris/20 text-verdigris' : 'border-line'}`}>
                    {done ? '✓' : i + 1}
                  </span>
                  <span className="leading-tight">
                    {s.title}
                    <span className="block text-[10px] text-muted">{s.gloss}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <button
          className="btn-ghost mt-2 w-fit text-xs"
          onClick={() => {
            setB(blankBuild());
            setStep('concept');
          }}
        >
          Start over
        </button>
      </nav>

      <section className="panel flex min-w-0 flex-col gap-3" aria-label={STEPS[index].title}>
        <header>
          <h2 className="font-display text-2xl leading-tight text-brass">
            {index + 1}. {STEPS[index].title}
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-parchment/85">{STEP_GUIDE[step]}</p>
        </header>

        {step === 'concept' && <ConceptStep b={b} up={up} />}
        {step === 'attributes' && <AttributesStep b={b} up={up} />}
        {step === 'abilities' && <AbilitiesStep b={b} up={up} />}
        {step === 'advantages' && <AdvantagesStep b={b} up={up} />}
        {step === 'magick' && <MagickStep b={b} up={up} />}
        {step === 'freebies' && <FreebiesStep b={b} up={up} />}
        {step === 'finish' && <FinishStep b={b} up={up} problems={p} />}

        {step !== 'finish' && p[step].length > 0 && (
          <ul className="rounded border border-line bg-raised/40 px-3 py-2 text-sm text-muted" aria-live="polite">
            {p[step].map((m) => (
              <li key={m}>· {m}</li>
            ))}
          </ul>
        )}
        <footer className="flex justify-between gap-2 border-t border-line pt-2">
          <button className="btn" onClick={() => go(-1)} disabled={index === 0}>
            ← Back
          </button>
          {index < STEPS.length - 1 && (
            <button className="btn-primary" onClick={() => go(1)}>
              Next: {STEPS[index + 1].title} →
            </button>
          )}
        </footer>
      </section>

      <aside className="panel h-fit text-sm lg:col-span-2 xl:sticky xl:top-14 xl:col-span-1" aria-label="Summary">
        <Summary b={b} name={character.name} />
      </aside>
    </div>
  );
}

type Up = (patch: Partial<Build> | ((x: Build) => Build)) => void;

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

function Counter({ left, of, label }: { left: number; of: number; label?: string }) {
  const tone = left === 0 ? 'text-verdigris' : left < 0 ? 'text-wound' : 'text-brass-bright';
  return (
    <span className={`font-mono text-xs ${tone}`}>
      {label && `${label} `}
      {of - left}/{of}
    </span>
  );
}

// ---------------------------------------------------------------------------

function ConceptStep({ b, up }: { b: Build; up: Up }) {
  const [style, setStyle] = useState('any');
  const f = b.faction ? faction(b.faction) : null;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Name">
        <div className="flex flex-wrap gap-1">
          <input className="min-w-[12rem] flex-1 basis-full font-display text-lg sm:basis-auto" value={b.name} onChange={(e) => up({ name: e.target.value })} placeholder="Who are they?" aria-label="Name" />
          <select value={style} onChange={(e) => setStyle(e.target.value)} aria-label="Naming tradition">
            <option value="any">Any tradition</option>
            {NAME_STYLES.map((n) => (
              <option key={n.key} value={n.key}>
                {n.label}
              </option>
            ))}
          </select>
          <button className="btn" onClick={() => up({ name: freshName(style) })}>
            Random name
          </button>
        </div>
      </Field>
      <Field label="Concept" hint="Who they were before they Awakened. Pick a type, then make it specific.">
        <div className="flex gap-1">
          <select
            value={CONCEPTS.find((c) => b.concept.startsWith(c)) ?? ''}
            onChange={(e) => {
              const c = e.target.value;
              up({ concept: c ? `${c}: ${OCCUPATIONS[c as keyof typeof OCCUPATIONS][0]}` : '' });
            }}
            aria-label="Concept type"
          >
            <option value="">Type…</option>
            {CONCEPTS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input className="min-w-0 flex-1" value={b.concept} onChange={(e) => up({ concept: e.target.value })} placeholder="e.g. Caretaker: night-shift nurse" aria-label="Concept" />
        </div>
      </Field>
      <Field label="Affiliation" hint={f ? `Affinity Spheres: ${f.affinity.length === SPHERES.length ? 'any' : f.affinity.join(', ')}` : 'The group that taught them, or none at all.'}>
        <select
          value={b.faction}
          onChange={(e) => {
            const name = e.target.value;
            // Drop an affinity the new group doesn't allow.
            up((x) => ({ ...x, faction: name, affinity: x.affinity && name && !faction(name).affinity.includes(x.affinity) ? '' : x.affinity }));
          }}
        >
          <option value="">Choose…</option>
          {CAMPS.map((c) => (
            <optgroup key={c.camp} label={c.label}>
              {FACTIONS.filter((x) => x.camp === c.camp).map((x) => (
                <option key={x.name}>{x.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>
      <div className="flex flex-col gap-0.5">
        <span className="label">Essence</span>
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(ESSENCE_GLOSS).map(([e, g]) => (
            <button
              key={e}
              className={`rounded border px-2 py-1 text-left ${b.essence === e ? 'border-brass bg-raised' : 'border-line hover:border-brass-dim'}`}
              onClick={() => up({ essence: e })}
              aria-pressed={b.essence === e}
            >
              <span className="font-display text-base">{e}</span>
              <span className="block text-[11px] leading-tight text-muted">{g}</span>
            </button>
          ))}
        </div>
      </div>
      {(['nature', 'demeanor'] as const).map((k) => (
        <Field key={k} label={k === 'nature' ? 'Nature (who they truly are)' : 'Demeanor (the face they show)'} hint={b[k] ? ARCHETYPE_GLOSS[b[k]] : undefined}>
          <select value={b[k]} onChange={(e) => up({ [k]: e.target.value })}>
            <option value="">Choose…</option>
            {ARCHETYPES.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </Field>
      ))}
    </div>
  );
}

function PriorityPicker<T extends string>({ order, options, sizes, onChange }: { order: T[]; options: T[]; sizes: number[]; onChange: (o: T[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((size, i) => (
        <label key={size} className="flex flex-col gap-0.5">
          <span className="label">{['Primary', 'Secondary', 'Tertiary'][i]} ({size})</span>
          <select
            value={order[i]}
            onChange={(e) => {
              const v = e.target.value as T;
              const next = [...order];
              const j = next.indexOf(v);
              [next[i], next[j]] = [next[j], next[i]]; // swap so each group is used once
              onChange(next);
            }}
          >
            {options.map((o) => (
              <option key={o} value={o}>
                {cap(o)}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}

function AttributesStep({ b, up }: { b: Build; up: Up }) {
  return (
    <div className="flex flex-col gap-3">
      <PriorityPicker order={b.attrPriority} options={['physical', 'social', 'mental'] as AttrGroup[]} sizes={[7, 5, 3]} onChange={(attrPriority) => up({ attrPriority })} />
      <div className="grid gap-4 sm:grid-cols-3">
        {(Object.keys(ATTRIBUTES) as AttrGroup[]).map((g) => (
          <div key={g} className="flex flex-col gap-1 rounded border border-line p-2">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-lg">{cap(g)}</span>
              <Counter left={attrAllowance(b, g) - attrSpent(b, g)} of={attrAllowance(b, g)} />
            </div>
            {ATTRIBUTES[g].map((n) => (
              <div key={n} className="flex items-center justify-between gap-2">
                <span>{n}</span>
                <Dots label={n} value={1 + (b.attrs[n] ?? 0)} onChange={(v) => up((x) => ({ ...x, attrs: { ...x.attrs, [n]: Math.max(0, v - 1) } }))} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function AbilitiesStep({ b, up }: { b: Build; up: Up }) {
  return (
    <div className="flex flex-col gap-3">
      <PriorityPicker order={b.abilityPriority} options={['talents', 'skills', 'knowledges'] as AbilityGroup[]} sizes={[13, 9, 5]} onChange={(abilityPriority) => up({ abilityPriority })} />
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(ABILITY_LISTS) as AbilityGroup[]).map((g) => (
          <div key={g} className="flex flex-col gap-0.5 rounded border border-line p-2">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-lg">{cap(g)}</span>
              <Counter left={abilityAllowance(b, g) - abilitySpent(b, g)} of={abilityAllowance(b, g)} />
            </div>
            {ABILITY_LISTS[g].map((n) => (
              <div key={n} className="flex items-center justify-between gap-2" title={DEFAULT_USE[n] ? `Used to ${DEFAULT_USE[n]}` : undefined}>
                <span>{n}</span>
                <Dots label={n} max={3} value={b.abilities[n] ?? 0} onChange={(v) => up((x) => ({ ...x, abilities: { ...x.abilities, [n]: v } }))} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdvantagesStep({ b, up }: { b: Build; up: Up }) {
  const isTech = b.faction && faction(b.faction).camp === 'Technocracy';
  const suggestions = INSTRUMENTS[b.practice as keyof typeof INSTRUMENTS] ?? [];
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-1 flex items-baseline gap-2">
          <span className="font-display text-lg">Backgrounds</span>
          <Counter left={BACKGROUND_DOTS - backgroundSpent(b)} of={BACKGROUND_DOTS} />
        </div>
        <div className="grid gap-x-6 gap-y-0.5 sm:grid-cols-2 xl:grid-cols-3">
          {BACKGROUNDS.map((n) => {
            const blocked = TECHNOCRACY_BACKGROUNDS.includes(n) && !isTech;
            return (
              <div key={n} className={`flex items-center justify-between gap-2 ${blocked ? 'opacity-40' : ''}`} title={blocked ? 'Technocracy only' : undefined}>
                <span className={n === 'Avatar' ? 'text-brass-bright' : ''}>{n}</span>
                <Dots label={n} value={b.backgrounds[n] ?? 0} onChange={blocked ? undefined : (v) => up((x) => ({ ...x, backgrounds: { ...x.backgrounds, [n]: v } }))} />
              </div>
            );
          })}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Paradigm" hint="What they believe reality is.">
          <input list="paradigms" value={b.paradigm} onChange={(e) => up({ paradigm: e.target.value })} placeholder="Choose or write your own" />
          <datalist id="paradigms">
            {PARADIGMS.map((x) => (
              <option key={x} value={x} />
            ))}
          </datalist>
        </Field>
        <Field label="Practice" hint="How they work magick.">
          <select value={b.practice} onChange={(e) => up({ practice: e.target.value })}>
            <option value="">Choose…</option>
            {PRACTICES.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Instruments" hint="The tools of their practice.">
        <input value={b.instruments} onChange={(e) => up({ instruments: e.target.value })} placeholder="e.g. candles, a worn rosary, prayer" />
      </Field>
      {suggestions.length > 0 && (
        <div className="-mt-2 flex flex-wrap gap-1">
          {suggestions.map((s) => (
            <button
              key={s}
              className="chip text-muted hover:border-brass-dim hover:text-parchment"
              onClick={() => up((x) => ({ ...x, instruments: x.instruments.includes(s) ? x.instruments : [x.instruments, s].filter(Boolean).join(', ') }))}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MagickStep({ b, up }: { b: Build; up: Up }) {
  const allowed = b.faction ? faction(b.faction).affinity : SPHERES;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Arete" hint={`Each dot above 1 costs ${COST.arete} freebies.`}>
          <div className="flex gap-1">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                className={`rounded border px-3 py-1 ${b.arete === n ? 'border-brass bg-raised text-brass-bright' : 'border-line'}`}
                onClick={() => up((x) => ({ ...x, arete: n }))}
                aria-pressed={b.arete === n}
              >
                {n}
                <span className="ml-1 text-[10px] text-muted">{(n - 1) * COST.arete} fp</span>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Affinity Sphere" hint={b.faction ? `From the ${b.faction}'s list.` : 'Choose an affiliation to narrow this.'}>
          <select
            value={b.affinity}
            onChange={(e) => {
              const s = e.target.value as Sphere;
              up((x) => ({ ...x, affinity: s, spheres: s ? { ...x.spheres, [s]: Math.max(1, x.spheres[s] ?? 0) } : x.spheres }));
            }}
          >
            <option value="">Choose…</option>
            {allowed.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <span className="pb-1">
          <Counter label="Sphere dots" left={SPHERE_DOTS - sphereSpent(b)} of={SPHERE_DOTS} />
        </span>
      </div>
      <div className="grid gap-x-8 gap-y-1 sm:grid-cols-3">
        {SPHERES.map((s) => (
          <div key={s} className="flex items-center justify-between gap-2">
            <span className={s === b.affinity ? 'text-brass-bright' : ''}>
              {s}
              {s === b.affinity && <span className="text-[10px] text-muted"> affinity</span>}
            </span>
            <Dots
              label={s}
              max={b.arete}
              value={Math.min(b.arete, b.spheres[s] ?? 0)}
              onChange={(v) => up((x) => ({ ...x, spheres: { ...x.spheres, [s]: s === x.affinity ? Math.max(1, v) : v } }))}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted">Willpower starts at 5 and Quintessence equals your Avatar rating; both can be raised with freebies.</p>
    </div>
  );
}

function Plus({ value, onChange, min = 0, max }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <span className="flex items-center rounded border border-line">
      <button className="px-1.5 text-muted hover:text-parchment disabled:opacity-30" disabled={value <= min} onClick={() => onChange(value - 1)} aria-label="Remove">
        −
      </button>
      <button className="px-1.5 text-muted hover:text-parchment disabled:opacity-30" disabled={max !== undefined && value >= max} onClick={() => onChange(value + 1)} aria-label="Add">
        +
      </button>
    </span>
  );
}

function FreebieRow({ name, rating, max, bought, onChange, cost }: { name: string; rating: number; max: number; bought: number; onChange: (v: number) => void; cost: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={bought ? 'text-brass-bright' : ''}>
        {name}
        {bought > 0 && <span className="text-[10px] text-muted"> +{bought} ({bought * cost} fp)</span>}
      </span>
      <span className="flex items-center gap-1.5">
        <Dots label={name} value={rating} max={Math.max(5, max)} />
        <Plus value={bought} onChange={onChange} max={bought + Math.max(0, max - rating)} />
      </span>
    </div>
  );
}

function FreebiesStep({ b, up }: { b: Build; up: Up }) {
  const left = freebiesLeft(b);
  const setF = (k: 'attrs' | 'abilities' | 'backgrounds' | 'spheres', n: string, v: number) =>
    up((x) => ({ ...x, freebie: { ...x.freebie, [k]: { ...x.freebie[k], [n]: Math.max(0, v) } } }));
  const isTech = b.faction && faction(b.faction).camp === 'Technocracy';
  return (
    <div className="flex flex-col gap-4">
      <div className={`sticky top-12 z-10 flex flex-wrap items-center gap-3 rounded border px-3 py-1.5 ${left < 0 ? 'border-wound bg-wound/10' : 'border-line bg-panel'}`}>
        <span className="font-display text-xl">
          {left} <span className="text-sm text-muted">of {FREEBIES} freebies left</span>
        </span>
        <span className="text-xs text-muted">Arete {(b.arete - 1) * COST.arete} · Merits {meritPoints(b)} · Flaws −{Math.min(7, flawPoints(b))}</span>
      </div>

      <Group title={`Attributes (${COST.attribute} each)`}>
        {(Object.keys(ATTRIBUTES) as AttrGroup[]).flatMap((g) =>
          ATTRIBUTES[g].map((n) => <FreebieRow key={n} name={n} rating={finalAttr(b, n)} max={5} bought={b.freebie.attrs[n] ?? 0} cost={COST.attribute} onChange={(v) => setF('attrs', n, v)} />),
        )}
      </Group>
      <Group title={`Abilities (${COST.ability} each, up to 5)`}>
        {(Object.keys(ABILITY_LISTS) as AbilityGroup[]).flatMap((g) =>
          ABILITY_LISTS[g].map((n) => <FreebieRow key={n} name={n} rating={finalAbility(b, n)} max={5} bought={b.freebie.abilities[n] ?? 0} cost={COST.ability} onChange={(v) => setF('abilities', n, v)} />),
        )}
      </Group>
      <Group title={`Backgrounds (${COST.background} each)`}>
        {BACKGROUNDS.filter((n) => isTech || !TECHNOCRACY_BACKGROUNDS.includes(n)).map((n) => (
          <FreebieRow key={n} name={n} rating={finalBackground(b, n)} max={5} bought={b.freebie.backgrounds[n] ?? 0} cost={COST.background} onChange={(v) => setF('backgrounds', n, v)} />
        ))}
      </Group>
      <Group title={`Spheres (${COST.sphere} each, no higher than Arete ${b.arete})`}>
        {SPHERES.map((s) => (
          <FreebieRow key={s} name={s} rating={finalSphere(b, s)} max={b.arete} bought={b.freebie.spheres[s] ?? 0} cost={COST.sphere} onChange={(v) => setF('spheres', s, v)} />
        ))}
      </Group>
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <span>Willpower {5 + b.freebie.willpower}</span>
          <Plus value={b.freebie.willpower} max={5} onChange={(v) => up((x) => ({ ...x, freebie: { ...x.freebie, willpower: v } }))} />
          <span className="text-xs text-muted">1 each</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Quintessence {finalBackground(b, 'Avatar') + b.freebie.quintessence * 4}</span>
          <Plus value={b.freebie.quintessence} max={4} onChange={(v) => up((x) => ({ ...x, freebie: { ...x.freebie, quintessence: v } }))} />
          <span className="text-xs text-muted">1 point buys 4</span>
        </div>
      </div>
      <MeritFlawPicker b={b} up={up} />
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="rounded border border-line px-2 py-1" open>
      <summary className="cursor-pointer font-display text-lg">{title}</summary>
      <div className="mt-1 grid gap-x-8 gap-y-0.5 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
    </details>
  );
}

function MeritFlawPicker({ b, up }: { b: Build; up: Up }) {
  const [kind, setKind] = useState<'merit' | 'flaw'>('merit');
  const [name, setName] = useState('');
  const def = MERITS_FLAWS.find((m) => m.kind === kind && m.name === name);
  const [points, setPoints] = useState(1);
  useEffect(() => {
    if (def) setPoints(def.costs[0]);
  }, [def]);
  const options = MERITS_FLAWS.filter((m) => m.kind === kind);
  const list = (k: 'merits' | 'flaws') =>
    b[k].map((m, i) => (
      <li key={`${m.name}${i}`} className="flex items-start justify-between gap-2">
        <span>
          {m.name} <span className="font-mono text-xs">{m.points} pt.</span>
          {MF_SUMMARY[m.name] && <span className="block text-xs text-muted">{MF_SUMMARY[m.name]}</span>}
        </span>
        <button className="btn-ghost px-1" onClick={() => up((x) => ({ ...x, [k]: x[k].filter((_, j) => j !== i) }))} aria-label={`Remove ${m.name}`}>
          ✕
        </button>
      </li>
    ));
  return (
    <details className="rounded border border-line px-2 py-1" open={b.merits.length + b.flaws.length > 0}>
      <summary className="cursor-pointer font-display text-lg">Merits & Flaws (optional)</summary>
      <p className="text-xs text-muted">Merits cost their points; Flaws give points back, up to 7. Full rules are in M20: The Book of Secrets.</p>
      <div className="mt-1 flex flex-wrap items-end gap-1">
        <select value={kind} onChange={(e) => (setKind(e.target.value as 'merit' | 'flaw'), setName(''))} aria-label="Merit or Flaw">
          <option value="merit">Merit</option>
          <option value="flaw">Flaw</option>
        </select>
        <select className="min-w-0 flex-1" value={name} onChange={(e) => setName(e.target.value)} aria-label={kind === 'merit' ? 'Merit' : 'Flaw'}>
          <option value="">Choose a {kind}…</option>
          {(['Physical', 'Mental', 'Social', 'Supernatural'] as const).map((cat) => (
            <optgroup key={cat} label={cat}>
              {options
                .filter((m) => m.category === cat)
                .map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.costs.join('/')})
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        {def && def.costs.length > 1 && (
          <select value={points} onChange={(e) => setPoints(Number(e.target.value))} aria-label="Points">
            {def.costs.map((c) => (
              <option key={c} value={c}>
                {c} pt.
              </option>
            ))}
          </select>
        )}
        <button
          className="btn"
          disabled={!def}
          onClick={() => {
            if (!def) return;
            up((x) => ({ ...x, [kind === 'merit' ? 'merits' : 'flaws']: [...x[kind === 'merit' ? 'merits' : 'flaws'], { name: def.name, points }] }));
            setName('');
          }}
        >
          Add
        </button>
      </div>
      {def && MF_SUMMARY[def.name] && <p className="mt-1 text-xs text-parchment/80">{MF_SUMMARY[def.name]}</p>}
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <div>
          <span className="label">Merits ({meritPoints(b)} pt.)</span>
          <ul className="flex flex-col gap-1 text-sm">{list('merits')}</ul>
        </div>
        <div>
          <span className="label">Flaws ({flawPoints(b)} pt.)</span>
          <ul className="flex flex-col gap-1 text-sm">{list('flaws')}</ul>
        </div>
      </div>
    </details>
  );
}

function FinishStep({ b, up, problems: p }: { b: Build; up: Up; problems: Record<StepKey, string[]> }) {
  const { dispatch } = useChronicle();
  const navigate = useNavigate();
  const [withRotes, setWithRotes] = useState(true);
  const unfinished = (Object.keys(p) as StepKey[]).filter((k) => k !== 'finish' && p[k].length);
  const character = useMemo(() => {
    const c = buildCharacter(b);
    if (withRotes) {
      const spheres = Object.fromEntries(SPHERES.map((s) => [s, finalSphere(b, s)]).filter(([, v]) => v)) as Partial<Record<Sphere, number>>;
      c.rotes = startingRotes(spheres, `${b.name}:${b.concept}`).map(({ rote }) => ({ name: `${rote.name} (${sphereLabel(rote.spheres)})`, desc: roteText(rote) }));
    }
    return c;
  }, [b, withRotes]);
  return (
    <div className="flex flex-col gap-3">
      {unfinished.length > 0 ? (
        <div className="rounded border border-wound/60 bg-wound/10 px-3 py-2 text-sm">
          <p className="font-medium">Not finished yet:</p>
          <ul>
            {unfinished.flatMap((k) =>
              p[k].map((m) => (
                <li key={k + m}>
                  · <b>{STEPS.find((s) => s.key === k)!.title}:</b> {m}
                </li>
              )),
            )}
          </ul>
        </div>
      ) : (
        <p className="rounded border border-verdigris/60 bg-verdigris/10 px-3 py-2 text-sm">Every step follows the creation rules.</p>
      )}
      <Field label="Notes" hint="Appearance, quirks, the Avatar, what they want.">
        <textarea rows={4} value={b.notes} onChange={(e) => up({ notes: e.target.value })} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="accent-[#c9a227]" checked={withRotes} onChange={(e) => setWithRotes(e.target.checked)} />
        Add a starting rote for each Sphere, from the Grimoire (all castable)
      </label>
      {withRotes && character.rotes.length > 0 && (
        <ul className="text-sm text-parchment/85">
          {character.rotes.map((r) => (
            <li key={r.name}>· {r.name}</li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="btn-primary"
          onClick={() => {
            const c = { ...character, id: newId() };
            dispatch({ type: 'addCharacters', characters: [c] });
            navigate(`/characters/${c.id}`);
          }}
        >
          {unfinished.length ? 'Add to chronicle anyway' : 'Add to chronicle'}
        </button>
        <ExportMenu c={character} />
      </div>
    </div>
  );
}

function Summary({ b, name }: { b: Build; name: string }) {
  const left = freebiesLeft(b);
  return (
    <div className="flex flex-col gap-2">
      <div>
        <div className="font-display text-xl leading-tight">{name}</div>
        <div className="text-xs text-muted">{[b.concept, b.faction, b.essence].filter(Boolean).join(' · ') || 'No concept yet'}</div>
        {(b.nature || b.demeanor) && (
          <div className="text-xs text-muted">
            {b.nature || '—'} / {b.demeanor || '—'}
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        {(Object.keys(ATTRIBUTES) as AttrGroup[]).map((g) => (
          <div key={g}>
            <span className="label">{g}</span>
            {ATTRIBUTES[g].map((n) => (
              <div key={n} className="flex items-center justify-between gap-1">
                <span>{n.slice(0, 3)}</span>
                <span className="font-mono">{finalAttr(b, n)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="text-xs">
        <span className="label">Abilities</span>
        <p className="leading-snug">
          {(Object.keys(ABILITY_LISTS) as AbilityGroup[])
            .flatMap((g) => ABILITY_LISTS[g].filter((n) => finalAbility(b, n)).map((n) => `${n} ${finalAbility(b, n)}`))
            .join(', ') || '—'}
        </p>
      </div>
      <div className="text-xs">
        <span className="label">Backgrounds</span>
        <p>{BACKGROUNDS.filter((n) => finalBackground(b, n)).map((n) => `${n} ${finalBackground(b, n)}`).join(', ') || '—'}</p>
      </div>
      <div className="text-xs">
        <span className="label">Magick</span>
        <p>
          Arete {b.arete} · {SPHERES.filter((s) => finalSphere(b, s)).map((s) => `${s} ${finalSphere(b, s)}`).join(', ') || 'no Spheres'}
        </p>
        <p>
          Willpower {5 + b.freebie.willpower} · Quintessence {finalBackground(b, 'Avatar') + b.freebie.quintessence * 4}
        </p>
      </div>
      <div className={`rounded px-2 py-1 text-xs ${left < 0 ? 'bg-wound/20 text-wound' : 'bg-raised'}`}>
        Freebies: {FREEBIES - left} of {FREEBIES} spent
      </div>
    </div>
  );
}
