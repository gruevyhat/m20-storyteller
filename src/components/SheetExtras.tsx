// Sheet sections for Resonance, Wonders and experience.
import { useState } from 'react';
import { WONDER_KINDS, type AbilityCategory, type Character, type Resonance, type ResonanceKind, type Wonder } from '../model/types';
import { newTraitOption, logXp, spendXp, xpOptions, xpTargetKey, xpTotals, type XpOption } from '../model/experience';
import { Dots, Stepper } from './ui';
import { VAULT, VAULT_KINDS, costText, toSheetWonder } from '../wonders/catalog';

const RESONANCE_KINDS: ResonanceKind[] = ['dynamic', 'entropic', 'static'];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export function ResonanceList({ items, onChange }: { items: Resonance[]; onChange: (v: Resonance[]) => void }) {
  const [trait, setTrait] = useState('');
  const [kind, setKind] = useState<ResonanceKind>('dynamic');
  const set = (i: number, r: Partial<Resonance>) => onChange(items.map((x, j) => (j === i ? { ...x, ...r } : x)));
  return (
    <div className="flex flex-col gap-1">
      {items.map((r, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <input className="min-w-0 flex-1 py-0" value={r.trait} onChange={(e) => set(i, { trait: e.target.value })} aria-label="Resonance trait" />
          <select className="py-0 text-xs" value={r.kind} onChange={(e) => set(i, { kind: e.target.value as ResonanceKind })} aria-label={`${r.trait} kind`}>
            {RESONANCE_KINDS.map((k) => (
              <option key={k} value={k}>
                {cap(k)}
              </option>
            ))}
          </select>
          <Dots label={r.trait} value={r.rating} onChange={(v) => set(i, { rating: Math.max(1, v) })} />
          <button className="btn-ghost px-1" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={`Remove ${r.trait}`}>
            ✕
          </button>
        </div>
      ))}
      <form
        className="flex flex-wrap gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          if (!trait.trim()) return;
          onChange([...items, { trait: trait.trim(), kind, rating: 1 }]);
          setTrait('');
        }}
      >
        <input className="min-w-0 flex-1" value={trait} onChange={(e) => setTrait(e.target.value)} placeholder="e.g. Crackling, Patient, Hungry" aria-label="New Resonance trait" />
        <select value={kind} onChange={(e) => setKind(e.target.value as ResonanceKind)} aria-label="Resonance kind">
          {RESONANCE_KINDS.map((k) => (
            <option key={k} value={k}>
              {cap(k)}
            </option>
          ))}
        </select>
        <button className="btn" type="submit">
          Add
        </button>
      </form>
      <p className="text-xs text-muted">Resonance that suits an Effect can lower its difficulty by 1; Resonance that clashes can raise it.</p>
    </div>
  );
}

const holdsQuintessence = (w: Wonder) => w.quintessenceMax !== undefined;

export function WonderList({
  items,
  onChange,
  backgroundRating = 0,
  onDraw,
}: {
  items: Wonder[];
  onChange: (v: Wonder[]) => void;
  /** The character's Wonder Background, if any. */
  backgroundRating?: number;
  /** Draw (or redraw) the Background's Wonder from the Vault. */
  onDraw?: () => void;
}) {
  const set = (i: number, w: Partial<Wonder>) => onChange(items.map((x, j) => (j === i ? { ...x, ...w } : x)));
  const drawn = items.some((w) => w.fromBackground);
  return (
    <div className="flex flex-col gap-2">
      {backgroundRating > 0 && onDraw && !drawn && (
        <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
          Wonder Background {backgroundRating}, with no Wonder drawn for it.
          <button className="btn-ghost text-xs" onClick={onDraw}>
            Draw a {backgroundRating}-dot Wonder from the Vault
          </button>
        </p>
      )}
      {items.map((w, i) => (
        <div key={i} className="flex flex-col gap-1 rounded border border-line p-2">
          <div className="flex flex-wrap items-center gap-2">
            <input className="min-w-[8rem] flex-1 font-medium" value={w.name} onChange={(e) => set(i, { name: e.target.value })} aria-label="Wonder name" />
            <select value={w.kind} onChange={(e) => set(i, { kind: e.target.value as Wonder['kind'] })} aria-label={`${w.name} kind`}>
              {WONDER_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <span className="flex items-center gap-1 text-xs">
              <span className="label">Rating</span>
              <Dots label={`${w.name} rating`} value={w.rating} onChange={(v) => set(i, { rating: Math.max(1, v) })} />
            </span>
            {w.fromBackground && (
              <span className="chip text-[10px] text-verdigris" title="Drawn from the Vault for the Wonder Background. Changing that rating draws a new one.">
                Background
              </span>
            )}
            {w.fromBackground && onDraw && (
              <button className="btn-ghost text-xs" onClick={onDraw}>
                Draw another
              </button>
            )}
            <button className="btn-ghost ml-auto px-1" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={`Remove ${w.name}`}>
              ✕
            </button>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            {w.arete !== undefined ? (
              <Stepper label="Arete" value={w.arete} onChange={(v) => set(i, { arete: v })} min={1} max={10} />
            ) : (
              <button className="btn-ghost text-xs" onClick={() => set(i, { arete: Math.max(1, w.rating) })}>
                + Own Arete
              </button>
            )}
            {holdsQuintessence(w) ? (
              <>
                <Stepper label="Quintessence" value={w.quintessence ?? 0} onChange={(v) => set(i, { quintessence: v })} min={0} max={w.quintessenceMax} />
                <Stepper label="Holds" value={w.quintessenceMax!} onChange={(v) => set(i, { quintessenceMax: v, quintessence: Math.min(v, w.quintessence ?? 0) })} min={1} max={50} />
              </>
            ) : (
              <button className="btn-ghost text-xs" onClick={() => set(i, { quintessenceMax: Math.max(1, w.rating * 5), quintessence: 0 })}>
                + Stores Quintessence
              </button>
            )}
          </div>
          <textarea rows={2} className="text-xs" value={w.powers} placeholder="What it does, Spheres and successes, how it's activated" onChange={(e) => set(i, { powers: e.target.value })} aria-label={`${w.name} powers`} />
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <VaultPicker onPick={(w) => onChange([...items, w])} />
        <button className="btn w-fit" onClick={() => onChange([...items, { name: 'New Wonder', kind: 'Talisman', rating: 1, powers: '' }])}>
          Add a blank Wonder
        </button>
      </div>
    </div>
  );
}

/** Pick any Wonder from the Vault and add it to the sheet, ready to use. */
function VaultPicker({ onPick }: { onPick: (w: Wonder) => void }) {
  const [id, setId] = useState('');
  const chosen = VAULT.find((w) => w.id === id);
  return (
    <span className="flex min-w-0 flex-wrap gap-1">
      <select className="min-w-0 max-w-full" value={id} onChange={(e) => setId(e.target.value)} aria-label="Wonder from the Vault">
        <option value="">Choose from the Vault…</option>
        {VAULT_KINDS.map((k) => (
          <optgroup key={k} label={k}>
            {VAULT.filter((w) => w.kind === k).map((w) => (
              <option key={w.id} value={w.id}>
                {'●'.repeat(w.rating)} {w.name} · {costText(w)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <button
        className="btn"
        disabled={!chosen}
        aria-label="Add the chosen Wonder"
        onClick={() => {
          if (!chosen) return;
          onPick(toSheetWonder(chosen));
          setId('');
        }}
      >
        Add
      </button>
    </span>
  );
}

const NEW_CATEGORIES: AbilityCategory[] = ['talents', 'skills', 'knowledges', 'backgrounds'];

export function ExperiencePanel({ c, onPatch }: { c: Character; onPatch: (p: Partial<Character>) => void }) {
  const [award, setAward] = useState(3);
  const [awardNote, setAwardNote] = useState('');
  const [pick, setPick] = useState('');
  const [newCat, setNewCat] = useState<AbilityCategory>('talents');
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const { earned, spent, available } = xpTotals(c);
  const options = xpOptions(c);
  const chosen = options.find((o) => xpTargetKey(o.target) === pick);
  const log = c.experience?.log ?? [];

  function buy(o: XpOption) {
    try {
      onPatch(spendXp(c, o));
      setError('');
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }

  const groups: [string, (o: XpOption) => boolean][] = [
    ['Attributes', (o) => o.target.kind === 'attribute'],
    ['Abilities', (o) => o.target.kind === 'ability'],
    ['Backgrounds', (o) => o.target.kind === 'background'],
    ['Spheres', (o) => o.target.kind === 'sphere'],
    ['Arete & Willpower', (o) => o.target.kind === 'arete' || o.target.kind === 'willpower'],
  ];

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-2">
        <p className="font-display text-xl">
          {available} <span className="text-sm text-muted">available · {earned} earned · {spent} spent</span>
        </p>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!award) return;
            onPatch(logXp(c, award, awardNote.trim() || 'Award'));
            setAwardNote('');
          }}
        >
          <Stepper label="Award" value={award} onChange={setAward} min={1} max={30} />
          <input className="min-w-0 flex-1" value={awardNote} onChange={(e) => setAwardNote(e.target.value)} placeholder="What for? e.g. Session 4, closed the Node" aria-label="Award note" />
          <button className="btn" type="submit">
            Award
          </button>
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <select className="min-w-0 flex-1" value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Trait to raise">
            <option value="">Raise a trait…</option>
            {groups.map(([title, test]) => (
              <optgroup key={title} label={title}>
                {options.filter(test).map((o) => (
                  <option key={xpTargetKey(o.target)} value={xpTargetKey(o.target)} disabled={!!o.blocked}>
                    {o.label} {o.current} → {o.current + 1}: {o.blocked ?? `${o.cost} XP`}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button className="btn" disabled={!chosen || !!chosen.blocked || chosen.cost > available} onClick={() => chosen && buy(chosen) && setPick('')}>
            {chosen && !chosen.blocked ? `Spend ${chosen.cost}` : 'Spend'}
          </button>
        </div>
        {chosen?.target.kind === 'arete' && <p className="text-xs text-muted">Arete only rises after the mage completes a Seeking.</p>}
        {(chosen?.target.kind === 'background' || newCat === 'backgrounds') && (
          <p className="text-xs text-muted">
            Backgrounds may not be for sale with experience; that's the Storyteller's call. The chart has no price for a new Background, so this uses 3, like a new Ability.
          </p>
        )}
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const name = newName.trim();
            if (!name) return;
            if (c.abilities[newCat].some((t) => t.name.toLowerCase() === name.toLowerCase())) return setError(`${c.name} already has ${name}.`);
            if (buy(newTraitOption(newCat, name))) setNewName('');
          }}
        >
          <select value={newCat} onChange={(e) => setNewCat(e.target.value as AbilityCategory)} aria-label="New trait category">
            {NEW_CATEGORIES.map((k) => (
              <option key={k} value={k}>
                New {k === 'backgrounds' ? 'Background' : k.slice(0, -1)}
              </option>
            ))}
          </select>
          <input className="min-w-0 flex-1" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" aria-label="New trait name" />
          <button className="btn" type="submit" disabled={!newName.trim() || available < newTraitOption(newCat, '').cost}>
            Learn ({newTraitOption(newCat, '').cost} XP)
          </button>
        </form>
        {error && <p className="text-xs text-wound">{error}</p>}
      </div>
      <div className="flex flex-col gap-1">
        <span className="label">Log</span>
        {log.length === 0 ? (
          <p className="text-xs text-muted">Nothing earned or spent yet.</p>
        ) : (
          <ul className="max-h-48 overflow-y-auto text-xs">
            {[...log].reverse().map((e, i) => (
              <li key={log.length - i} className="flex justify-between gap-2 border-b border-line/50 py-0.5">
                <span>{e.note}</span>
                <span className={`shrink-0 font-mono ${e.xp > 0 ? 'text-verdigris' : 'text-muted'}`}>
                  {e.xp > 0 ? `+${e.xp}` : e.xp}
                </span>
              </li>
            ))}
          </ul>
        )}
        {log.length > 0 && <p className="text-[11px] text-muted">Made a mistake? Undo (⌘Z / Ctrl+Z) reverses the last award or purchase.</p>}
      </div>
    </div>
  );
}
