// Works out an Effect's Spheres and successes, then hands them to the magick roller.
import { useState } from 'react';
import { DIVIDED_DURATIONS, DURATIONS, FEATS, RANGES, blankPlan, planEffect, type EffectPlan, type FeatKey } from '../engine/effect';
import { SPHERES, type Character } from '../model/types';
import { Dots, Stepper, Toggle } from './ui';

export interface BuiltEffect {
  name: string;
  need: number;
  highestSphere: number;
  summary: string;
}

export function EffectBuilder({ who, onUse, onSaveRote }: { who?: Character; onUse: (e: BuiltEffect) => void; onSaveRote?: (e: BuiltEffect) => void }) {
  const [plan, setPlan] = useState<EffectPlan>(blankPlan);
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  const up = (p: Partial<EffectPlan>) => {
    setPlan((x) => ({ ...x, ...p }));
    setSaved(false);
  };
  const r = planEffect(plan);
  const durations = plan.divided ? DIVIDED_DURATIONS : DURATIONS;
  const tooHigh = who ? r.spheresUsed.filter((s) => (plan.spheres[s] ?? 0) > (who.spheres[s] ?? 0)) : [];
  const built = (): BuiltEffect => ({
    name: name.trim() || 'Effect',
    need: r.need,
    highestSphere: r.highestSphere,
    summary: `${r.spheresUsed.map((s) => `${s} ${plan.spheres[s]}`).join(', ')}. ${r.lines.map((l) => `${l.label} (${l.successes})`).join('; ')}. Needs ${r.need} success${r.need === 1 ? '' : 'es'}${plan.divided ? ', dividing successes' : ''}.`,
  });

  return (
    <div className="flex flex-col gap-2 rounded border border-line p-2">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name the Effect, e.g. Lightning from a clear sky" aria-label="Effect name" />

      <div>
        <span className="label">Spheres used</span>
        <div className="grid gap-x-5 gap-y-0.5 text-sm sm:grid-cols-3">
          {SPHERES.map((s) => {
            const has = who?.spheres[s] ?? 0;
            const over = !!who && (plan.spheres[s] ?? 0) > has;
            return (
              <div key={s} className="flex items-center justify-between gap-2">
                <span className={over ? 'text-wound' : (plan.spheres[s] ?? 0) ? 'text-brass-bright' : ''}>
                  {s}
                  {who && <span className="text-[10px] text-muted"> ({has})</span>}
                </span>
                <Dots label={`${s} used`} value={plan.spheres[s] ?? 0} onChange={(v) => up({ spheres: { ...plan.spheres, [s]: v } })} />
              </div>
            );
          })}
        </div>
      </div>

      <label className="flex flex-col gap-0.5">
        <span className="label">How big a feat?</span>
        <select value={plan.feat} onChange={(e) => up({ feat: e.target.value as FeatKey })}>
          {FEATS.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}: {f.successes}+ — {f.examples}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap items-end gap-3">
        <Stepper label="Damage / healing" value={plan.damage} onChange={(v) => up({ damage: v })} min={0} max={40} />
        <label className="flex flex-col gap-0.5">
          <span className="label">Duration</span>
          <select value={Math.min(plan.duration, durations.length - 1)} onChange={(e) => up({ duration: Number(e.target.value) })}>
            {durations.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="label">Range</span>
          <select value={plan.range} onChange={(e) => up({ range: Number(e.target.value) })}>
            <option value={0}>Within the senses</option>
            {RANGES.map((x, i) => (
              <option key={x} value={i + 1}>
                {x}
              </option>
            ))}
          </select>
        </label>
        {plan.divided && <Stepper label="Targets" value={plan.targets} onChange={(v) => up({ targets: v })} min={1} max={30} />}
        <Stepper label="Adjust" value={plan.extra} onChange={(v) => up({ extra: v })} min={-5} max={20} signed />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <Toggle checked={plan.forces} onChange={(v) => up({ forces: v })}>
          Forces damage <span className="text-muted">— one free success to Damage</span>
        </Toggle>
        <Toggle checked={plan.divided} onChange={(v) => up({ divided: v })}>
          Dividing successes <span className="text-muted">— optional rule: buy targets, damage and duration separately</span>
        </Toggle>
      </div>

      <div className="rounded bg-raised px-2 py-1 text-sm">
        <ul>
          {r.lines.map((l, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span>{l.label}</span>
              <span className="font-mono">{l.successes}</span>
            </li>
          ))}
        </ul>
        <p className="mt-1 border-t border-line pt-1">
          Needs <b>{r.need}</b> success{r.need === 1 ? '' : 'es'}
          {!plan.divided && r.lines.length > 1 && <span className="text-muted"> (the largest requirement, plus range and adjustment)</span>}; highest Sphere{' '}
          <b>{r.highestSphere || '—'}</b>.
          {r.need >= 5 && <span className="text-muted"> That many successes usually means a ritual.</span>}
        </p>
        {r.warnings.map((w) => (
          <p key={w} className="text-xs text-wound">
            {w}
          </p>
        ))}
        {tooHigh.length > 0 && (
          <p className="text-xs text-wound">
            {who!.name} doesn't have {tooHigh.map((s) => `${s} ${plan.spheres[s]}`).join(', ')}.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="btn" disabled={!r.highestSphere} onClick={() => onUse(built())}>
          Use: Sphere {r.highestSphere || '—'}, need {r.need}
        </button>
        {onSaveRote && who && (
          <button
            className="btn-ghost"
            disabled={!r.highestSphere}
            onClick={() => {
              onSaveRote(built());
              setSaved(true);
            }}
          >
            {saved ? `Saved to ${who.name}'s rotes` : `Save as a rote for ${who.name}`}
          </button>
        )}
      </div>
    </div>
  );
}
