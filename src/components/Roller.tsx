import { useMemo, useState } from 'react';
import {
  BACKLASH_THRESHOLD,
  EFFECT_LABEL,
  backlashTier,
  degreeOf,
  magickSetup,
  paradoxAfterBacklash,
  paradoxFor,
  rollPool,
  type EffectKind,
  type MagickModifiers,
  type PoolResult,
} from '../engine/dice';
import { abandonRitual, acceptBotch, nextTarget, rollRitual, saveBotch, startRitual, type RitualState } from '../engine/ritual';
import { ATTRIBUTE_NAMES, WHEEL_SIZE, allTraits, highestSphere, woundPenalty, type Character } from '../model/types';
import { useChronicle } from '../store/chronicle';
import { Stepper, Tabs, Toggle } from './ui';

type Mode = 'pool' | 'magick' | 'ritual';

interface Shown {
  title: string;
  result: PoolResult;
  detail: string;
  paradox?: number;
  backlashFor?: { id: string; name: string; dice: number };
}

export default function Roller() {
  const { chronicle, dispatch } = useChronicle();
  const [mode, setMode] = useState<Mode>('pool');
  const [whoId, setWhoId] = useState('');
  const who = chronicle.characters.find((c) => c.id === whoId);

  // Pool
  const [attr, setAttr] = useState('');
  const [ability, setAbility] = useState('');
  const [manualPool, setManualPool] = useState(6);
  const [difficulty, setDifficulty] = useState(6);
  const [need, setNeed] = useState(1);
  const [specialty, setSpecialty] = useState(false);
  const [willpower, setWillpower] = useState(false);
  const [applyWounds, setApplyWounds] = useState(true);
  // Rolls for player characters show on the table screen by default; NPC and anonymous rolls stay hidden.
  const [isPublic, setIsPublic] = useState(false);
  const [label, setLabel] = useState('');

  // Magick
  const [arete, setArete] = useState(3);
  const [sphere, setSphere] = useState(2);
  const [effect, setEffect] = useState<EffectKind>('coincidental');
  const [mods, setMods] = useState<Required<MagickModifiers>>({ instruments: 0, quintessence: 0, time: 0, other: 0 });
  const [ritual, setRitual] = useState<RitualState | null>(null);

  const [shown, setShown] = useState<Shown | null>(null);

  const traits = who ? allTraits(who) : [];
  const attrRating = !who || !attr ? null : attr === 'Willpower' ? who.willpower.permanent : (who.attributes[attr]?.rating ?? null);
  const abilityTrait = traits.find((t) => t.name === ability && !ATTRIBUTE_NAMES.includes(t.name as never));
  const fromSheet = attrRating === null ? null : attrRating + (abilityTrait?.rating ?? 0);
  const wounds = who && applyWounds ? woundPenalty(who) : 0;
  const incapacitated = wounds <= -99;
  const basePool = fromSheet ?? manualPool;
  const pool = Math.max(0, basePool + (incapacitated ? -basePool : wounds));

  const permanentWillpower = who?.willpower.permanent;
  const setup = useMemo(
    () => magickSetup({ arete, permanentWillpower, highestSphere: sphere, effect, need, mods }),
    [arete, permanentWillpower, sphere, effect, need, mods],
  );

  function pickWho(id: string) {
    setWhoId(id);
    setAttr('');
    setAbility('');
    setRitual(null);
    const c = chronicle.characters.find((x) => x.id === id);
    setIsPublic(c?.kind === 'pc');
    if (c) {
      setArete(c.arete || 1);
      setSphere(Math.max(1, highestSphere(c)));
    }
  }

  const autoLabel = [attr, ability].filter(Boolean).join(' + ');

  function pickTraits(a: string, b: string) {
    setAttr(a);
    setAbility(b);
    const ts = [who?.attributes[a], traits.find((t) => t.name === b)];
    setSpecialty(ts.some((t) => t && t.rating >= 4 && t.specialty));
    // Keep a label the Storyteller typed; replace one we generated.
    if (!label || label === autoLabel) setLabel([a, b].filter(Boolean).join(' + '));
  }

  const patchWho = (fn: (c: Character) => Character) => who && dispatch({ type: 'updateCharacter', id: who.id, patch: fn });

  const canSpendWillpower = !who || who.willpower.temporary > 0;
  const useWillpower = willpower && canSpendWillpower;

  function spendWillpower() {
    patchWho((c) => ({ ...c, willpower: { ...c.willpower, temporary: Math.max(0, c.willpower.temporary - 1) } }));
  }

  function addParadox(points: number) {
    if (!points) return;
    patchWho((c) => {
      const paradox = Math.min(WHEEL_SIZE, c.paradox + points);
      // Paradox pushes Quintessence off the shared wheel.
      return { ...c, paradox, quintessence: Math.min(c.quintessence, WHEEL_SIZE - paradox) };
    });
  }

  function log(r: PoolResult, title: string, summary: string, paradox?: number) {
    dispatch({
      type: 'log',
      entry: {
        who: who?.name,
        label: title,
        summary,
        faces: r.faces,
        difficulty: r.difficulty,
        outcome: r.botch ? 'botch' : r.success ? 'success' : 'failure',
        paradox,
        public: isPublic,
      },
    });
  }

  function verdict(r: PoolResult) {
    if (r.botch) return r.ones > 1 ? `Botch ×${r.ones}` : 'Botch';
    if (r.success) return `${r.net} success${r.net === 1 ? '' : 'es'} · ${degreeOf(r.net)}`;
    return r.net > 0 ? `${r.net} of ${r.need} needed` : 'Failure';
  }

  function rollMundane() {
    const r = rollPool({ pool, difficulty, need, specialty, willpower: useWillpower });
    if (useWillpower) spendWillpower();
    const title = label || `${pool} dice`;
    const detail = `${pool} dice at ${difficulty}${specialty ? ' · specialty' : ''}${useWillpower ? ' · Willpower' : ''}${wounds && !incapacitated ? ` · wounds ${wounds}` : ''}`;
    log(r, title, `${verdict(r)} (${detail})`);
    setShown({ title, result: r, detail });
  }

  function rollMagick() {
    const r = rollPool({ pool: setup.pool, difficulty: setup.difficulty, need: setup.need, willpower: useWillpower });
    const paradox = paradoxFor(effect, sphere, r);
    if (useWillpower) spendWillpower();
    if (who && mods.quintessence) patchWho((c) => ({ ...c, quintessence: Math.max(0, c.quintessence - mods.quintessence) }));
    addParadox(paradox);
    const title = label || `Magick (${EFFECT_LABEL[effect].toLowerCase()})`;
    const detail = `Arete ${setup.pool} at ${setup.difficulty}, need ${setup.need} · ${EFFECT_LABEL[effect]}`;
    log(r, title, `${verdict(r)} (${detail})${paradox ? ` · +${paradox} Paradox` : ''}`, paradox);
    setShown({
      title,
      result: r,
      detail,
      paradox,
      backlashFor: who && paradox >= BACKLASH_THRESHOLD ? { id: who.id, name: who.name, dice: Math.min(WHEEL_SIZE, who.paradox + paradox) } : undefined,
    });
  }

  function rollBacklash(target: { id: string; name: string }) {
    const c = chronicle.characters.find((x) => x.id === target.id);
    if (!c) return;
    const r = rollPool({ pool: c.paradox, difficulty: 6 });
    const tier = backlashTier(r);
    const left = paradoxAfterBacklash(c.paradox, c.permanentParadox, r);
    dispatch({ type: 'updateCharacter', id: c.id, patch: { paradox: left } });
    dispatch({
      type: 'log',
      entry: {
        who: c.name,
        label: 'Paradox backlash',
        summary: `${r.botch ? 'Botch' : `${r.net} successes`}: ${tier} Paradox ${c.paradox} → ${left}.`,
        faces: r.faces,
        difficulty: 6,
        outcome: r.botch ? 'botch' : r.net ? 'failure' : 'info',
        public: false,
      },
    });
    setShown({ title: `Backlash: ${c.name}`, result: r, detail: `${tier} Paradox ${c.paradox} → ${left}.` });
  }

  function ritualStep(next: RitualState, extra?: string) {
    setRitual(next);
    const last = next.rolls[next.rolls.length - 1];
    if (last && next.rolls.length !== ritual?.rolls.length) {
      const title = `${label || 'Ritual'}: roll ${next.rolls.length}/${next.maxRolls}`;
      log(last.result, title, `${verdict(last.result)} at ${last.difficulty}. ${last.note} Total ${next.successes}/${last.need}.`);
      setShown({ title, result: last.result, detail: `${last.note} Total ${next.successes} of ${last.need}.` });
    }
    if (next.status !== 'running' && next.status !== 'botched') {
      addParadox(next.paradoxTaken);
      dispatch({
        type: 'log',
        entry: {
          who: who?.name,
          label: label || 'Ritual',
          summary: `Ritual ${next.status} after ${next.rolls.length} roll${next.rolls.length === 1 ? '' : 's'}${next.paradoxTaken ? ` · +${next.paradoxTaken} Paradox` : ''}.${extra ? ` ${extra}` : ''}`,
          faces: [],
          difficulty: 0,
          outcome: next.status === 'succeeded' ? 'success' : next.status === 'disaster' ? 'botch' : 'failure',
          paradox: next.paradoxTaken,
          public: isPublic,
        },
      });
    }
  }

  const ritualTarget = ritual ? nextTarget(ritual) : null;

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="panel flex flex-col gap-2.5" aria-label="Roll setup">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Tabs
            value={mode}
            onChange={(m) => {
              setMode(m);
              setRitual(null);
              if (label === autoLabel) setLabel('');
            }}
            options={[
              { value: 'pool', label: 'Dice pool' },
              { value: 'magick', label: 'Magick' },
              { value: 'ritual', label: 'Ritual' },
            ]}
          />
          <select value={whoId} onChange={(e) => pickWho(e.target.value)} aria-label="Rolling for">
            <option value="">Rolling for nobody in particular</option>
            {chronicle.characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="What's the roll for? (shown in the log)" />

        {mode === 'pool' && (
          <>
            {who && (
              <div className="grid grid-cols-2 gap-2">
                <select value={attr} onChange={(e) => pickTraits(e.target.value, ability)} aria-label="Attribute">
                  <option value="">Attribute…</option>
                  {ATTRIBUTE_NAMES.map((n) => (
                    <option key={n} value={n}>
                      {n} {who.attributes[n]?.rating ?? 0}
                    </option>
                  ))}
                  <option value="Willpower">Willpower {who.willpower.permanent}</option>
                </select>
                <select value={ability} onChange={(e) => pickTraits(attr, e.target.value)} aria-label="Ability">
                  <option value="">+ Ability…</option>
                  {(['talents', 'skills', 'knowledges', 'backgrounds'] as const).map((cat) => (
                    <optgroup key={cat} label={cat[0].toUpperCase() + cat.slice(1)}>
                      {who.abilities[cat].map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.name} {t.rating}
                          {t.specialty ? ` (${t.specialty})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              {fromSheet === null ? (
                <Stepper label="Dice" value={manualPool} onChange={setManualPool} min={0} max={30} />
              ) : (
                <div className="flex flex-col gap-1">
                  <span className="label">Dice</span>
                  <span className="py-0.5 font-mono">{pool}</span>
                </div>
              )}
              <Stepper label="Difficulty" value={difficulty} onChange={setDifficulty} min={2} max={12} />
              <Stepper label="Successes needed" value={need} onChange={setNeed} min={1} max={20} />
            </div>
          </>
        )}

        {mode !== 'pool' && (
          <>
            <div className="flex flex-wrap gap-3">
              <Stepper label="Arete" value={arete} onChange={setArete} min={1} max={10} />
              <Stepper label="Highest Sphere used" value={sphere} onChange={setSphere} min={1} max={5} />
              <Stepper label="Successes needed" value={need} onChange={setNeed} min={1} max={40} />
            </div>
            {who && sphere > (who.arete || 0) && <p className="text-sm text-wound">A Sphere can't be rated above Arete.</p>}
            {who && sphere > highestSphere(who) && <p className="text-sm text-wound">{who.name}'s highest Sphere is {highestSphere(who)}.</p>}
            <label className="flex flex-col gap-1">
              <span className="label">The Effect is</span>
              <select value={effect} onChange={(e) => setEffect(e.target.value as EffectKind)}>
                <option value="coincidental">Coincidental: Sphere + 3</option>
                <option value="vulgar">Vulgar, no witnesses: Sphere + 4</option>
                <option value="witnessed">Vulgar, with witnesses: Sphere + 5</option>
              </select>
            </label>
            <div className="flex flex-wrap gap-3">
              <Stepper label="Instruments" value={mods.instruments} onChange={(v) => setMods({ ...mods, instruments: v })} min={-2} max={3} signed />
              <Stepper
                label="Quintessence"
                value={mods.quintessence}
                onChange={(v) => setMods({ ...mods, quintessence: v })}
                min={0}
                max={who ? Math.min(3, who.quintessence) : 3}
              />
              <Stepper label="Time / research" value={mods.time} onChange={(v) => setMods({ ...mods, time: v })} min={0} max={3} />
              <Stepper label="Other" value={mods.other} onChange={(v) => setMods({ ...mods, other: v })} min={-3} max={3} signed />
            </div>
            <p className="text-xs text-muted">
              Instruments: personalized −1, unique −1, both −2, none +3. Other: Resonance ±1, fast-casting +1, a mundane-ability roll −1 per success (max −3).
            </p>
            <p className="rounded bg-raised px-2 py-1 text-sm">
              Base {setup.baseDifficulty}, modifiers {setup.modifier >= 0 ? '+' : ''}
              {setup.modifier}
              {setup.rawModifier !== setup.modifier && ` (capped from ${setup.rawModifier >= 0 ? '+' : ''}${setup.rawModifier})`} → roll{' '}
              <b>{setup.pool}</b> dice at <b>{setup.difficulty}</b>, need <b>{setup.need}</b>.
              {setup.limitedByWillpower && <span className="text-wound"> Pool capped at permanent Willpower.</span>}
            </p>
          </>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {mode === 'pool' && (
            <Toggle checked={specialty} onChange={setSpecialty}>
              Specialty <span className="text-muted">— each 10 counts twice</span>
            </Toggle>
          )}
          <Toggle checked={willpower && !(who && who.willpower.temporary === 0)} onChange={setWillpower} disabled={!!who && who.willpower.temporary === 0}>
            Spend Willpower <span className="text-muted">— one success 1s can't cancel{who ? `; ${who.name} has ${who.willpower.temporary}` : ''}</span>
          </Toggle>
          {who && mode === 'pool' && (
            <Toggle checked={applyWounds} onChange={setApplyWounds}>
              Apply wound penalty <span className="text-muted">({incapacitated ? 'incapacitated' : woundPenalty(who) || 'none'})</span>
            </Toggle>
          )}
          <Toggle checked={isPublic} onChange={setIsPublic}>
            Show on the player screen
          </Toggle>
        </div>

        {mode === 'pool' && (
          <button className="btn-primary py-1.5" onClick={rollMundane}>
            Roll {pool} {pool === 1 ? 'die' : 'dice'}
          </button>
        )}
        {mode === 'magick' && (
          <button className="btn-primary py-1.5" onClick={rollMagick}>
            Cast
          </button>
        )}
        {mode === 'ritual' && !ritual && (
          <button
            className="btn-primary py-1.5"
            onClick={() =>
              setRitual(
                startRitual({
                  setup,
                  effect,
                  highestSphere: sphere,
                  arete,
                  permanentWillpower: permanentWillpower ?? 5,
                }),
              )
            }
          >
            Begin ritual ({(permanentWillpower ?? 5) + arete} rolls max)
          </button>
        )}
        {mode === 'ritual' && ritual && (
          <div className="flex flex-col gap-1.5 rounded border border-line p-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-display text-xl">
                {ritual.successes} / {ritualTarget!.need} successes
              </span>
              <span className="text-sm text-muted">
                roll {ritual.rolls.length} of {ritual.maxRolls} · next at {ritualTarget!.difficulty} · accrued Paradox {ritual.accruedParadox}
              </span>
            </div>
            {ritual.status === 'running' && (
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (useWillpower) spendWillpower();
                    ritualStep(rollRitual(ritual, { willpower: useWillpower }));
                  }}
                >
                  Roll next turn
                </button>
                <button className="btn" onClick={() => ritualStep(abandonRitual(ritual))}>
                  Stop here
                </button>
              </div>
            )}
            {ritual.status === 'botched' && (
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn-primary"
                  onClick={() => {
                    spendWillpower();
                    ritualStep(saveBotch(ritual));
                  }}
                >
                  Hold it together (1 Willpower, 1 success, +1 difficulty)
                </button>
                <button className="btn" onClick={() => ritualStep(acceptBotch(ritual))}>
                  Let it fail
                </button>
              </div>
            )}
            {ritual.status !== 'running' && ritual.status !== 'botched' && (
              <div className="flex flex-wrap items-center gap-2">
                <span className={ritual.status === 'succeeded' ? 'text-brass-bright' : 'text-wound'}>
                  Ritual {ritual.status}. {ritual.paradoxTaken ? `+${ritual.paradoxTaken} Paradox.` : 'No Paradox.'}
                </span>
                <button className="btn" onClick={() => setRitual(null)}>
                  New ritual
                </button>
              </div>
            )}
            <p className="text-xs text-muted">
              Each failed roll adds +1 difficulty. Each roll after the first adds 1 Paradox, cancelled if the ritual succeeds (M20 p. 540). Stamina checks for
              long rituals aren't tracked.
            </p>
          </div>
        )}
      </section>

      <ResultCard shown={shown} onBacklash={rollBacklash} />
    </div>
  );
}

function ResultCard({ shown, onBacklash }: { shown: Shown | null; onBacklash: (t: { id: string; name: string }) => void }) {
  if (!shown) {
    return (
      <section className="panel grid min-h-[4rem] place-items-center text-center text-sm text-muted" aria-live="polite">
        <p>
          Roll something. Results show here and go into the log.
        </p>
      </section>
    );
  }
  const r = shown.result;
  const tone = r.botch ? 'text-wound' : r.success ? 'text-brass-bright' : 'text-parchment';
  return (
    <section className="panel flex flex-col gap-2" aria-live="polite">
      <div className="label">{shown.title}</div>
      <div className={`font-display text-3xl font-bold leading-none ${tone}`}>
        {r.botch ? (r.ones > 1 ? `Botch ×${r.ones}` : 'Botch') : r.success ? `${r.net} success${r.net === 1 ? '' : 'es'}` : r.net ? `${r.net} of ${r.need}` : 'Failure'}
      </div>
      <div className="text-sm text-muted">{r.success && !r.botch ? `${degreeOf(r.net)} success` : ''}</div>
      <div className="flex flex-wrap gap-2">
        {r.faces.map((f, i) => (
          <span
            key={i}
            className={`die animate-settle ${f >= r.difficulty ? 'die-hit' : ''} ${f === 1 ? 'die-one' : ''} ${r.specialty && f === 10 && f >= r.difficulty ? 'die-double' : ''}`}
            style={{ animationDelay: `${i * 30}ms` }}
          >
            {f}
          </span>
        ))}
        {r.willpower && <span className="die die-hit text-sm">WP</span>}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
        <div>
          <dt className="label">Difficulty</dt>
          <dd>{r.difficulty}</dd>
        </div>
        <div>
          <dt className="label">Hits</dt>
          <dd>{r.raw}</dd>
        </div>
        <div>
          <dt className="label">1s</dt>
          <dd>{r.ones}</dd>
        </div>
        <div>
          <dt className="label">Net</dt>
          <dd>{r.net}</dd>
        </div>
        {shown.paradox !== undefined && (
          <div>
            <dt className="label">Paradox</dt>
            <dd className="text-paradox">+{shown.paradox}</dd>
          </div>
        )}
      </dl>
      <p className="text-sm text-muted">{shown.detail}</p>
      {shown.backlashFor && (
        <div className="rounded border border-paradox/60 bg-paradox/10 p-3 text-sm">
          <p>
            {shown.backlashFor.name} took {shown.paradox} Paradox in one go. You may call for a backlash: {shown.backlashFor.dice} dice at difficulty 6. They can spend
            Willpower to put it off until the end of the scene.
          </p>
          <button className="btn mt-2" onClick={() => onBacklash(shown.backlashFor!)}>
            Roll backlash
          </button>
        </div>
      )}
    </section>
  );
}
