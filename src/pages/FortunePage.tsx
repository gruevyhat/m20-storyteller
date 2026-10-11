import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CardBack, CardFace } from '../components/TarotCard';
import { CharacterEditor } from './CharactersPage';
import { ALL_POSITIONS, EXTRA_POSITIONS, MAX_EXTRA, POSITIONS, newSeed, readFortune, type Drawn, type PositionKey, type Reading } from '../fortune/build';
import { SUITS } from '../fortune/deck';
import { newId, type Character } from '../model/types';
import { useChronicle } from '../store/chronicle';

/** Cards grouped by the part of the character they decide. */
const GROUPS: { title: string; note: string; keys: PositionKey[] }[] = [
  { title: 'Who you are', note: 'Nature and Demeanor', keys: ['heart', 'mask'] },
  { title: 'What woke you', note: 'Essence, affinity Sphere, Arete and freebies', keys: ['avatar', 'crown'] },
  { title: 'Where you stand', note: 'Affiliation, focus, the life before, and what blocks the way', keys: ['path', 'root', 'crossing'] },
  { title: 'Gifts & burdens', note: 'Optional: each card brings a Merit and a Flaw of equal points', keys: ['witness', 'omen'] },
];

const pos = (k: PositionKey) => ALL_POSITIONS.find((p) => p.key === k)!;
const DISPLAY_ORDER = GROUPS.flatMap((g) => g.keys);

export default function FortunePage() {
  const [params, setParams] = useSearchParams();
  const seed = params.get('seed');
  const extra = Math.max(0, Math.min(MAX_EXTRA, Number(params.get('extra') ?? 0) || 0));
  const reading = useMemo(() => (seed ? readFortune(seed, extra) : null), [seed, extra]);
  const [turned, setTurned] = useState<Set<PositionKey>>(new Set());
  const [draft, setDraft] = useState<Character | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  const [confirmDraw, setConfirmDraw] = useState(false);
  const lastSeed = useRef<string | null>(null);
  const { dispatch } = useChronicle();
  const navigate = useNavigate();

  useEffect(() => {
    if (!reading) return;
    // A new deal turns everything face down. Drawn extra cards also arrive face down, to be turned like the rest.
    if (lastSeed.current !== reading.seed) {
      setTurned(new Set());
      lastSeed.current = reading.seed;
    }
    setAdded(null);
    setConfirmDraw(false);
    setDraft(structuredClone(reading.character));
  }, [reading]);

  const allSeven = reading ? POSITIONS.every((p) => turned.has(p.key)) : false;
  // The reading and character wait until every drawn card, extras included, is face up.
  const allTurned = reading ? reading.spread.every((d) => turned.has(d.position)) : false;
  const dirty = !!(draft && reading && JSON.stringify(draft) !== JSON.stringify(reading.character));

  const deal = () => setParams({ seed: newSeed() });
  const drawExtra = () => {
    if (!seed) return;
    if (dirty && !confirmDraw) {
      setConfirmDraw(true);
      return;
    }
    setParams({ seed, extra: String(extra + 1) });
  };

  function addToChronicle() {
    if (!draft) return;
    const c: Character = structuredClone(draft);
    c.id = newId();
    c.name = c.name.trim() || 'Unnamed seeker';
    dispatch({ type: 'addCharacters', characters: [c] });
    setAdded(c.id);
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="panel flex flex-col gap-1.5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl leading-tight text-brass">The Awakening Spread</h1>
            <p className="max-w-3xl text-sm text-muted">
              Seven cards tell a seeker's fortune, and the fortune becomes a starting M20 mage. Each card decides part of the character; hover over a turned card to see what. The suits
              and Major Arcana across the whole spread decide the rest. Once all seven are turned you may draw up to two more; each brings a Merit and a balancing Flaw, and can shift the totals.
            </p>
          </div>
          <button className="btn-primary px-3" onClick={deal}>
            {reading ? 'Shuffle and deal again' : 'Shuffle and deal'}
          </button>
        </div>
        {reading && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            <span>
              Seed <code className="text-parchment">{reading.seed}</code>
              {extra ? ` with ${extra} extra card${extra === 1 ? '' : 's'}` : ''}. Share this page's address to share the reading.
            </span>
            {!allSeven && (
              <button className="btn-ghost" onClick={() => setTurned(new Set(reading.spread.map((d) => d.position)))}>
                Reveal all
              </button>
            )}
          </div>
        )}
      </section>

      {reading && (
        <>
          <section className="panel" aria-label="The spread">
            <div className="flex flex-wrap items-start justify-center gap-x-5 gap-y-4">
              {GROUPS.map((g) => (
                <div key={g.title} className="flex flex-col gap-1.5">
                  <div className="border-t border-brass-dim pt-1 text-center" title={g.note}>
                    <span className="label text-brass">{g.title}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    {g.keys.map((k) => {
                      const d = reading.spread.find((x) => x.position === k);
                      const isExtra = EXTRA_POSITIONS.some((p) => p.key === k);
                      const column = DISPLAY_ORDER.indexOf(k);
                      const align = column < 2 ? 'left' : column > DISPLAY_ORDER.length - 4 ? 'right' : 'center';
                      if (!d) {
                        if (!isExtra) return null;
                        const next = EXTRA_POSITIONS[extra]?.key === k;
                        return (
                          <ExtraCard
                            key={k}
                            k={k}
                            canDraw={next && allSeven}
                            locked={!allSeven}
                            confirm={next && confirmDraw}
                            onDraw={drawExtra}
                            onCancel={() => setConfirmDraw(false)}
                          />
                        );
                      }
                      const line = reading.lines.find((l) => l.position === k)!;
                      return (
                        <RowCard
                          key={`${reading.seed}-${k}`}
                          d={d}
                          faceUp={turned.has(k)}
                          onTurn={() => setTurned(new Set([...turned, k]))}
                          effects={line.effects}
                          index={column}
                          align={align}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-muted">
              {allSeven ? 'Hover over a card, or tap it, to see what it decided.' : 'Click a card to turn it over. Hover over a turned card to read it.'}
            </p>
          </section>

          {allTurned && <WholeSpread reading={reading} />}

          {allTurned && (
            <section className="panel flex flex-col gap-1.5" aria-label="The reading">
              <h2 className="font-display text-2xl leading-tight">The reading</h2>
              <div className="gap-6 lg:columns-2">
              {reading.lines.map((l) => (
                <p key={l.position} className="mb-2 break-inside-avoid font-display text-lg leading-snug">
                  <span className="text-brass">{pos(l.position).title}.</span> {l.text}
                </p>
              ))}
              </div>
              <div className="border-t border-line pt-1.5 font-display text-lg text-parchment/80">
                {reading.summary.map((s) => (
                  <p key={s}>{s}</p>
                ))}
              </div>
            </section>
          )}

          {allTurned && draft && (
            <section className="flex flex-col gap-2" aria-label="The character">
              <div className="panel flex flex-wrap items-center gap-3 py-2">
                <p className="flex-1 text-sm text-muted">
                  This is the seeker the cards made. Change anything you like below. The build ledger records what the cards chose; your edits aren't checked against
                  the creation rules.
                </p>
                {added ? (
                  <button className="btn-primary" onClick={() => navigate(`/characters/${added}`)}>
                    Open in Characters →
                  </button>
                ) : (
                  <button className="btn-primary" onClick={addToChronicle}>
                    Add to chronicle
                  </button>
                )}
                {added && <span className="w-full text-sm text-brass">Added as a player character. Later edits here don't change the saved copy.</span>}
              </div>
              <CharacterEditor c={draft} onPatch={(p) => setDraft((d) => (d ? { ...d, ...p } : d))} />
            </section>
          )}
        </>
      )}
    </div>
  );
}

const CARD_W = 'w-[6.5rem] sm:w-[7.5rem] xl:w-[8.25rem]';

function TarotButton({ d, faceUp, onClick, index, describedBy }: { d: Drawn; faceUp: boolean; onClick: () => void; index: number; describedBy?: string }) {
  const p = pos(d.position);
  return (
    <button
      className={`tarot ${CARD_W} shrink-0 cursor-pointer ${faceUp ? 'is-up' : ''}`}
      onClick={onClick}
      aria-label={faceUp ? `${p.title}: ${d.card.name}${d.reversed ? ', reversed' : ''}` : `${p.title}: face down. Turn it over.`}
      aria-describedby={describedBy}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <span className="tarot-inner">
        <span className="tarot-back">
          <CardBack />
        </span>
        <span className={`tarot-front ${d.reversed ? 'is-reversed' : ''}`}>
          <CardFace card={d.card} />
        </span>
      </span>
    </button>
  );
}

/** One card in the row. Once turned, hovering, focusing or tapping it shows what it decided. */
function RowCard({
  d,
  faceUp,
  onTurn,
  effects,
  index,
  align,
}: {
  d: Drawn;
  faceUp: boolean;
  onTurn: () => void;
  effects: string[];
  index: number;
  align: 'left' | 'center' | 'right';
}) {
  const p = pos(d.position);
  const [pinned, setPinned] = useState(false);
  const tipId = `tip-${d.position}`;
  const meaning = d.reversed ? d.card.reversed : d.card.upright;
  const place = align === 'left' ? 'left-0' : align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2';
  return (
    <div className="group relative flex flex-col items-center gap-1" onMouseLeave={() => setPinned(false)}>
      <TarotButton d={d} faceUp={faceUp} index={index} onClick={() => (faceUp ? setPinned(!pinned) : onTurn())} describedBy={faceUp ? tipId : undefined} />
      <div className={`${CARD_W} text-center`}>
        <div className="font-display text-lg leading-tight">{p.title}</div>
        <div className="text-xs leading-tight text-muted">
          {faceUp ? (
            <>
              {d.card.name}
              {d.reversed && <span className="text-wound"> (rev.)</span>}
            </>
          ) : (
            p.gloss
          )}
        </div>
      </div>
      {faceUp && (
        <div
          id={tipId}
          role="tooltip"
          className={`absolute top-full z-30 mt-1 w-72 rounded-md border border-brass-dim bg-panel p-3 text-left shadow-2xl shadow-black/60 transition-opacity ${place} max-sm:fixed max-sm:inset-x-3 max-sm:bottom-3 max-sm:top-auto max-sm:left-3 max-sm:w-auto max-sm:translate-x-0 ${
            pinned ? 'visible opacity-100' : 'invisible opacity-0 group-hover:visible group-hover:opacity-100 group-has-[:focus-visible]:visible group-has-[:focus-visible]:opacity-100'
          }`}
        >
          <div className="font-display text-xl leading-tight text-brass">{p.title}</div>
          <div className="text-xs text-muted">{p.gloss}</div>
          <div className="mt-1 text-sm">
            <b>{d.card.name}</b>
            {d.reversed && <span className="text-wound"> reversed</span>}
          </div>
          <p className="font-display text-lg italic leading-snug text-parchment/90">{meaning}</p>
          <ul className="mt-1.5 flex flex-col gap-0.5 border-t border-line pt-1.5 text-sm leading-snug">
            {effects.map((e) => {
              const i = e.indexOf(': ');
              const [label, value] = i > 0 ? [e.slice(0, i), e.slice(i + 2)] : ['', e];
              return (
                <li key={e}>
                  {label && <span className="label mr-1.5">{label}</span>}
                  <span className="text-brass-bright">{value}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/** An optional card not yet drawn: a card-sized space with a Draw button. */
function ExtraCard({
  k,
  canDraw,
  locked,
  confirm,
  onDraw,
  onCancel,
}: {
  k: PositionKey;
  canDraw: boolean;
  locked: boolean;
  confirm: boolean;
  onDraw: () => void;
  onCancel: () => void;
}) {
  const p = pos(k);
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${CARD_W} flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line p-2 text-center`}
        style={{ aspectRatio: '120 / 200' }}
      >
        {confirm ? (
          <>
            <span className="text-xs text-wound">This rebuilds the character and discards your edits.</span>
            <button className="btn border-wound px-2 text-xs text-wound" onClick={onDraw}>
              Draw anyway
            </button>
            <button className="btn px-2 text-xs" onClick={onCancel}>
              Keep edits
            </button>
          </>
        ) : canDraw ? (
          <button className="btn-primary px-2" onClick={onDraw}>
            Draw
          </button>
        ) : (
          <span className="text-xs text-muted">{locked ? 'Turn all seven first' : 'Draw the Witness first'}</span>
        )}
        <span className="text-[11px] leading-tight text-muted">optional · a Merit and a Flaw</span>
      </div>
      <div className={`${CARD_W} text-center`}>
        <div className="font-display text-lg leading-tight text-parchment/80">{p.title}</div>
        <div className="text-xs leading-tight text-muted">{p.gloss}</div>
      </div>
    </div>
  );
}

function WholeSpread({ reading }: { reading: Reading }) {
  const kinds = [
    { key: 'wands', label: SUITS.wands.label, gloss: 'will · Physical, Social, Talents, Skills' },
    { key: 'cups', label: SUITS.cups.label, gloss: 'feeling · Social, Talents, Knowledges' },
    { key: 'swords', label: SUITS.swords.label, gloss: 'thought · Mental, Knowledges' },
    { key: 'pentacles', label: SUITS.pentacles.label, gloss: 'body and craft · Physical, Skills' },
    { key: 'major', label: 'Major Arcana', gloss: 'fate · Mental, Knowledges, Avatar, Arete' },
  ] as const;
  return (
    <section className="panel flex flex-col gap-2" aria-label="The whole spread">
      <header className="flex flex-wrap items-baseline gap-x-2">
        <h2 className="font-display text-2xl leading-tight text-brass">The whole spread</h2>
        <p className="text-xs text-muted">Every card counts here, wherever it fell. These totals decide the priorities and the strength of the Avatar.</p>
      </header>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {kinds.map((k) => {
          const cards = reading.spread.filter((d) => (k.key === 'major' ? d.card.arcana === 'major' : d.card.suit === k.key));
          return (
            <div key={k.key} className="rounded border border-line px-2 py-1">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-lg">{k.label}</span>
                <span className="font-mono text-2xl leading-none text-brass-bright">{reading.tally[k.key]}</span>
              </div>
              <p className="text-xs text-muted">{k.gloss}</p>
              <ul className="mt-0.5 text-xs text-parchment/80">
                {cards.map((d) => (
                  <li key={d.card.id}>
                    {d.card.name} <span className="text-muted">· {pos(d.position).title.replace('The ', '')}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {reading.combined.map((x) => (
          <div key={x.label} className="rounded bg-raised/40 px-2 py-1">
            <dt className="label">{x.label}</dt>
            <dd className="text-brass-bright">{x.value}</dd>
            <dd className="text-xs text-muted">{x.because}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
