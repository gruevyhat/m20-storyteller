// A pop-up dice roller opened from the character sheet. Builds the pool from the character's own
// Attribute + Ability, applies wounds, spends Willpower from the sheet and writes to the roll log.
import { useEffect, useRef, useState } from 'react';
import { degreeOf, rollPool, type PoolResult } from '../engine/dice';
import { DEFAULT_USE, defaultAttributeFor } from '../model/abilityDefaults';
import { ATTRIBUTE_NAMES, woundPenalty, type AbilityCategory, type Character, type Trait } from '../model/types';
import { useChronicle } from '../store/chronicle';
import { Stepper, Toggle } from './ui';

export interface RollPreset {
  attribute?: string; // an Attribute name, 'Willpower' or 'Arete'
  ability?: string;
}

const CATS: AbilityCategory[] = ['talents', 'skills', 'knowledges'];

export function RollDialog({ c, preset, onPatch, onClose }: { c: Character; preset: RollPreset; onPatch: (p: Partial<Character>) => void; onClose: () => void }) {
  const { dispatch } = useChronicle();
  const findAbility = (name?: string): { t: Trait; cat: AbilityCategory } | undefined => {
    for (const cat of CATS) {
      const t = c.abilities[cat].find((x) => x.name === name);
      if (t) return { t, cat };
    }
    return undefined;
  };
  const initialAbility = findAbility(preset.ability);
  const [ability, setAbility] = useState(preset.ability ?? '');
  const [attribute, setAttribute] = useState(preset.attribute ?? (preset.ability ? defaultAttributeFor(preset.ability, initialAbility?.cat) : 'Wits'));
  const [difficulty, setDifficulty] = useState(6);
  const [need, setNeed] = useState(1);
  const [willpower, setWillpower] = useState(false);
  const [wounds, setWounds] = useState(true);
  const [isPublic, setIsPublic] = useState(c.kind === 'pc');
  const [result, setResult] = useState<PoolResult | null>(null);
  const rollRef = useRef<HTMLButtonElement>(null);

  const ab = findAbility(ability);
  const attrRating = attribute === 'Willpower' ? c.willpower.permanent : attribute === 'Arete' ? c.arete : (c.attributes[attribute]?.rating ?? 0);
  const attrTrait = c.attributes[attribute];
  const autoSpecialty = !!((ab && ab.t.rating >= 4 && ab.t.specialty) || (attrTrait && attrTrait.rating >= 4 && attrTrait.specialty));
  const [specialty, setSpecialty] = useState(autoSpecialty);
  useEffect(() => setSpecialty(autoSpecialty), [autoSpecialty]);

  const penalty = woundPenalty(c);
  const incapacitated = penalty <= -99;
  const base = attrRating + (ab?.t.rating ?? 0);
  const pool = Math.max(0, wounds ? (incapacitated ? 0 : base + penalty) : base);
  const canSpend = c.willpower.temporary > 0;
  const label = [attribute, ab?.t.name].filter(Boolean).join(' + ');

  useEffect(() => {
    rollRef.current?.focus();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);

  function roll() {
    const wp = willpower && canSpend;
    const r = rollPool({ pool, difficulty, need, specialty, willpower: wp });
    if (wp) {
      onPatch({ willpower: { ...c.willpower, temporary: c.willpower.temporary - 1 } });
      setWillpower(false); // spending again should be a deliberate choice
    }
    setResult(r);
    const verdict = r.botch ? 'Botch' : r.success ? `${r.net} success${r.net === 1 ? '' : 'es'} · ${degreeOf(r.net)}` : r.net ? `${r.net} of ${r.need}` : 'Failure';
    dispatch({
      type: 'log',
      entry: {
        who: c.name || 'Unnamed',
        label,
        summary: `${verdict} (${pool} dice at ${difficulty}${specialty ? ' · specialty' : ''}${wp ? ' · Willpower' : ''}${wounds && penalty && !incapacitated ? ` · wounds ${penalty}` : ''})`,
        faces: r.faces,
        difficulty: r.difficulty,
        outcome: r.botch ? 'botch' : r.success ? 'success' : 'failure',
        public: isPublic,
      },
    });
  }

  const tone = result?.botch ? 'text-wound' : result?.success ? 'text-brass-bright' : 'text-parchment';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={`Roll for ${c.name || 'this character'}`} className="panel flex w-full max-w-md flex-col gap-3 shadow-2xl shadow-black">
        <header className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl leading-tight text-brass">Roll {c.name ? `for ${c.name}` : ''}</h2>
          <button className="btn-ghost" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-0.5">
            <span className="label">Attribute</span>
            <select value={attribute} onChange={(e) => setAttribute(e.target.value)}>
              {ATTRIBUTE_NAMES.map((n) => (
                <option key={n} value={n}>
                  {n} {c.attributes[n]?.rating ?? 0}
                </option>
              ))}
              <option value="Willpower">Willpower {c.willpower.permanent}</option>
              <option value="Arete">Arete {c.arete}</option>
            </select>
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="label">Ability</span>
            <select
              value={ability}
              onChange={(e) => {
                const name = e.target.value;
                setAbility(name);
                // Re-pair to the usual Attribute unless the roll is Willpower or Arete.
                if (name && attribute !== 'Willpower' && attribute !== 'Arete') setAttribute(defaultAttributeFor(name, findAbility(name)?.cat));
              }}
            >
              <option value="">None</option>
              {CATS.map((cat) => (
                <optgroup key={cat} label={cat[0].toUpperCase() + cat.slice(1)}>
                  {c.abilities[cat].map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name} {t.rating}
                      {t.specialty ? ` (${t.specialty})` : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        </div>
        {ab && DEFAULT_USE[ab.t.name] && <p className="-mt-1 text-xs text-muted">Usually rolled to {DEFAULT_USE[ab.t.name]}.</p>}

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="label">Dice</span>
            <span className="font-mono text-lg leading-tight">{pool}</span>
          </div>
          <Stepper label="Difficulty" value={difficulty} onChange={setDifficulty} min={2} max={12} />
          <Stepper label="Successes needed" value={need} onChange={setNeed} min={1} max={20} />
        </div>

        <div className="flex flex-col gap-1">
          <Toggle checked={specialty} onChange={setSpecialty}>
            Specialty <span className="text-muted">— each 10 counts twice</span>
          </Toggle>
          <Toggle checked={willpower && canSpend} onChange={setWillpower} disabled={!canSpend}>
            Spend Willpower <span className="text-muted">— one success 1s can't cancel ({c.willpower.temporary} left)</span>
          </Toggle>
          {penalty !== 0 && (
            <Toggle checked={wounds} onChange={setWounds}>
              Wound penalty <span className="text-muted">({incapacitated ? 'incapacitated' : penalty})</span>
            </Toggle>
          )}
          <Toggle checked={isPublic} onChange={setIsPublic}>
            Show on the player screen
          </Toggle>
        </div>

        <button ref={rollRef} className="btn-primary py-1.5" onClick={roll}>
          {result ? 'Roll again' : `Roll ${pool} ${pool === 1 ? 'die' : 'dice'}`}
        </button>

        {result && (
          <section className="flex flex-col gap-2 border-t border-line pt-2" aria-live="polite">
            <div className={`font-display text-3xl font-bold leading-none ${tone}`}>
              {result.botch
                ? result.ones > 1
                  ? `Botch ×${result.ones}`
                  : 'Botch'
                : result.success
                  ? `${result.net} success${result.net === 1 ? '' : 'es'}`
                  : result.net
                    ? `${result.net} of ${result.need}`
                    : 'Failure'}
              {result.success && !result.botch && <span className="ml-2 font-sans text-sm font-normal text-muted">{degreeOf(result.net)}</span>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.faces.map((f, i) => (
                <span
                  key={`${i}-${f}-${result.faces.length}`}
                  className={`die animate-settle ${f >= result.difficulty ? 'die-hit' : ''} ${f === 1 ? 'die-one' : ''} ${result.specialty && f === 10 ? 'die-double' : ''}`}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  {f}
                </span>
              ))}
              {result.willpower && <span className="die die-hit text-sm">WP</span>}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
