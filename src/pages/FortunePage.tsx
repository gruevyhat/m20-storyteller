import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CardBack, CardFace } from '../components/TarotCard';
import { CharacterEditor } from './CharactersPage';
import { ALL_POSITIONS, EXTRA_POSITIONS, POSITIONS, SCORE_RECIPES, dealAll, newSeed, readFortune, type Drawn, type PositionKey, type Reading } from '../fortune/build';
import { newId, type Character } from '../model/types';
import { useChronicle } from '../store/chronicle';

/** Cards grouped by the part of the character they decide. */
const GROUPS: { title: string; note: string; keys: PositionKey[] }[] = [
  { title: 'Who you are', note: 'Nature and Demeanor', keys: ['heart', 'mask'] },
  { title: 'What woke you', note: 'Essence, affinity Sphere, Arete and freebies', keys: ['avatar', 'crown'] },
  { title: 'Where you stand', note: 'Affiliation, focus, the life before, and what blocks the way', keys: ['path', 'root', 'crossing'] },
  { title: 'Gifts & burdens', note: 'Optional: turn one to add a Merit and a Flaw of equal points', keys: ['witness', 'omen'] },
];

const pos = (k: PositionKey) => ALL_POSITIONS.find((p) => p.key === k)!;
const DISPLAY_ORDER = GROUPS.flatMap((g) => g.keys);

export default function FortunePage() {
  const [params, setParams] = useSearchParams();
  const seed = params.get('seed');
  const [turned, setTurned] = useState<Set<PositionKey>>(new Set());
  // All nine cards are dealt face down; the Witness and Omen count only once they're turned.
  const cards = useMemo(() => (seed ? dealAll(seed) : []), [seed]);
  const witness = turned.has('witness');
  const omen = turned.has('omen');
  const reading = useMemo(() => (seed ? readFortune(seed, { witness, omen }) : null), [seed, witness, omen]);
  const [draft, setDraft] = useState<Character | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  const [pendingTurn, setPendingTurn] = useState<PositionKey | null>(null);
  const lastSeed = useRef<string | null>(null);
  const { dispatch } = useChronicle();
  const navigate = useNavigate();

  useEffect(() => {
    if (!reading) return;
    if (lastSeed.current !== reading.seed) {
      // A new deal: every card face down again.
      setTurned(new Set());
      lastSeed.current = reading.seed;
    }
    setAdded(null);
    setPendingTurn(null);
    setDraft(structuredClone(reading.character));
  }, [reading]);

  const allSeven = POSITIONS.every((p) => turned.has(p.key));
  const dirty = !!(draft && reading && JSON.stringify(draft) !== JSON.stringify(reading.character));

  const deal = () => setParams({ seed: newSeed() });
  /** Turn a card. Turning an optional card changes the character, so ask first if the draft has been edited. */
  const turn = (k: PositionKey, confirmed = false) => {
    const optional = EXTRA_POSITIONS.some((p) => p.key === k);
    if (optional && allSeven && dirty && !confirmed) {
      setPendingTurn(k);
      return;
    }
    setPendingTurn(null);
    setTurned((t) => new Set([...t, k]));
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
              Nine cards tell a seeker's fortune, and the fortune becomes a starting M20 mage. Turn the cards in any order; hover over a turned card to see what it
              decided. Once the seven core cards are face up, the character appears. The two Gifts & burdens cards are optional: turn one to add its Merit and Flaw.
            </p>
          </div>
          <button className="btn-primary px-3" onClick={deal}>
            {reading ? 'Shuffle and deal again' : 'Shuffle and deal'}
          </button>
        </div>
        {reading && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            <span>
              Seed <code className="text-parchment">{reading.seed}</code>. Share this page's address to share the deal.
            </span>
            {!allSeven && (
              <button className="btn-ghost" onClick={() => setTurned((t) => new Set([...t, ...POSITIONS.map((p) => p.key)]))}>
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
                      const d = cards.find((x) => x.position === k)!;
                      const column = DISPLAY_ORDER.indexOf(k);
                      const align = column < 2 ? 'left' : column > DISPLAY_ORDER.length - 4 ? 'right' : 'center';
                      const line = reading.lines.find((l) => l.position === k);
                      return (
                        <RowCard
                          key={`${reading.seed}-${k}`}
                          d={d}
                          faceUp={turned.has(k)}
                          onTurn={() => turn(k)}
                          effects={line?.effects ?? []}
                          index={column}
                          align={align}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {pendingTurn && (
              <div className="mx-auto mt-3 flex max-w-2xl flex-wrap items-center justify-center gap-2 rounded border border-wound/60 bg-wound/10 px-3 py-2 text-sm" role="alert">
                <span>Turning {pos(pendingTurn).title} adds its Merit and Flaw and rebuilds the character, discarding your edits.</span>
                <button className="btn border-wound text-wound" onClick={() => turn(pendingTurn, true)}>
                  Turn it
                </button>
                <button className="btn" onClick={() => setPendingTurn(null)}>
                  Keep my edits
                </button>
              </div>
            )}
            <p className="mt-3 text-center text-xs text-muted">
              {allSeven
                ? 'Hover over a card, or tap it, to see what it decided. The Gifts & burdens cards stay optional.'
                : 'Click a card to turn it over, in any order. Hover over a turned card to read it.'}
            </p>
          </section>

          {allSeven && <WholeSpread reading={reading} />}

          {allSeven && (
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

          {allSeven && draft && (
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

type Kind = 'wands' | 'cups' | 'swords' | 'pentacles' | 'major';

const KINDS: { key: Kind; label: string; theme: string; color: string }[] = [
  { key: 'wands', label: 'Wands', theme: 'drive and daring', color: '#d9a43a' },
  { key: 'cups', label: 'Cups', theme: 'feeling and bonds', color: '#c0504d' },
  { key: 'swords', label: 'Swords', theme: 'thought and conflict', color: '#b9b4ab' },
  { key: 'pentacles', label: 'Pentacles', theme: 'body, craft and wealth', color: '#5fb3ad' },
  { key: 'major', label: 'Major Arcana', theme: 'fate', color: '#b678e0' },
];
const kindOf = (d: Drawn): Kind => (d.card.arcana === 'major' ? 'major' : (d.card.suit as Kind));

const RECIPES = SCORE_RECIPES as Record<string, [Kind, number][]>;
const RAISES: Record<Kind, string[]> = { wands: [], cups: [], swords: [], pentacles: [], major: [] };
for (const [cat, parts] of Object.entries(RECIPES)) for (const [k] of parts) RAISES[k].push(cat[0].toUpperCase() + cat.slice(1));

const kindLabel = (k: Kind, n: number) => {
  const l = KINDS.find((x) => x.key === k)!.label;
  return n === 1 ? l.replace(/s$/, '').replace('Major Arcana', 'Major Arcanum') : l;
};

function WholeSpread({ reading }: { reading: Reading }) {
  const t = reading.tally as Record<Kind, number>;
  const c = reading.character;
  const avatar = c.abilities.backgrounds.find((b) => b.name === 'Avatar')?.rating ?? 1;
  const crown = reading.spread.find((d) => d.position === 'crown')!;
  return (
    <section className="panel flex flex-col gap-4" aria-label="The whole spread">
      <header>
        <h2 className="font-display text-2xl leading-tight text-brass">How the whole spread shaped you</h2>
        <p className="max-w-3xl text-sm text-parchment/85">
          Besides its own position, every card counts toward its suit. The more cards of a suit you drew, the higher the traits that suit stands for come in your
          priorities. Where a card fell doesn't matter here, and neither does its number or whether it's reversed.
        </p>
      </header>

      <div>
        <h3 className="label mb-1">Your cards by suit</h3>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {KINDS.map((k) => {
            const cards = reading.spread.filter((d) => kindOf(d) === k.key);
            return (
              <div key={k.key} className={`rounded border border-line px-2 py-1.5 ${cards.length ? '' : 'opacity-50'}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-display text-lg">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: k.color }} />
                    {k.label}
                  </span>
                  <span className="font-mono text-2xl leading-none" style={{ color: k.color }}>
                    {cards.length}
                  </span>
                </div>
                <p className="text-xs text-muted">
                  {k.theme}; raises {RAISES[k.key].join(', ')}
                </p>
                <ul className="mt-0.5 text-xs text-parchment/80">
                  {cards.map((d) => (
                    <li key={d.card.id}>
                      {d.card.name} <span className="text-muted">({pos(d.position).title.replace('The ', '')})</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Ranking title="Attributes" order={reading.priorities.attributes} scores={reading.scores.attributes} dots={[7, 5, 3]} tally={t} />
        <Ranking title="Abilities" order={reading.priorities.abilities} scores={reading.scores.abilities} dots={[13, 9, 5]} tally={t} />
      </div>

      <div className="grid gap-2 text-sm md:grid-cols-2">
        <p className="rounded bg-raised/40 px-3 py-2">
          <b className="text-brass-bright">Avatar {avatar}.</b> Every mage starts with one dot, plus one for each Major Arcana in the spread (up to 4). You drew {t.major}.
        </p>
        <p className="rounded bg-raised/40 px-3 py-2">
          <b className="text-brass-bright">Arete {reading.arete.value}.</b>{' '}
          {reading.arete.reason === 'crown'
            ? `A Major Arcana, ${crown.card.name}, crowns the spread, so freebies raise Arete to 3.`
            : reading.arete.reason === 'majors'
              ? 'Three or more Major Arcana in the spread raise Arete to 3.'
              : 'Freebies raise Arete to 2. A Major Arcana at the Crown, or three anywhere in the spread, would have made it 3.'}
        </p>
        {reading.rotes.length > 0 && (
          <p className="rounded bg-raised/40 px-3 py-2">
            <b className="text-brass-bright">{reading.rotes.length} starting rotes,</b> one for each Sphere you have ({reading.rotes.map((r) => r.sphere).join(', ')}),
            all within your ratings.
          </p>
        )}
        {(c.meritsFlaws ?? []).length > 0 && (
          <p className="rounded bg-raised/40 px-3 py-2">
            <b className="text-brass-bright">Merits & Flaws.</b> Each Gifts & burdens card you turned gave a Merit and a Flaw worth the same points (
            {(c.meritsFlaws ?? [])
              .filter((m) => m.kind === 'merit')
              .reduce((n, m) => n + m.points, 0)}{' '}
            each in total), so they cancel out and cost no freebies.
          </p>
        )}
      </div>
    </section>
  );
}

function Ranking({ title, order, scores, dots, tally }: { title: string; order: string[]; scores: Record<string, number>; dots: number[]; tally: Record<Kind, number> }) {
  const max = Math.max(1, ...Object.values(scores));
  const top = order[0];
  const name = (g: string) => g[0].toUpperCase() + g.slice(1);
  const ties = order.filter((g, i) => i > 0 && scores[g] === scores[order[i - 1]]).map((g) => [order[order.indexOf(g) - 1], g]);
  const leaders = RECIPES[top].filter(([k]) => tally[k] > 0);
  return (
    <div className="flex flex-col gap-2 rounded border border-line p-3">
      <h3 className="font-display text-xl leading-tight">{title}</h3>
      {order.map((g, i) => {
        const parts = RECIPES[g];
        return (
          <div key={g} className="flex flex-col gap-0.5">
            <div className="flex items-baseline justify-between gap-2">
              <span>
                <span className="mr-2 inline-block w-8 font-mono text-xs text-muted">{['1st', '2nd', '3rd'][i]}</span>
                <b>{name(g)}</b>
              </span>
              <span className="text-sm text-brass-bright">{dots[i]} dots</span>
            </div>
            <div className="ml-10 flex h-3 overflow-hidden rounded-sm bg-raised" title={`Score ${scores[g]}`}>
              {parts.map(([k, w]) =>
                tally[k] * w > 0 ? (
                  <span key={k} style={{ width: `${(100 * tally[k] * w) / max}%`, background: KINDS.find((x) => x.key === k)!.color }} />
                ) : null,
              )}
            </div>
            <p className="ml-10 text-xs text-muted">
              Score {scores[g]} ={' '}
              {parts
                .map(([k, w]) => `${tally[k]} ${kindLabel(k, tally[k])}${w > 1 ? ` ×${w}` : ''}`)
                .join(' + ')}
            </p>
          </div>
        );
      })}
      <p className="text-sm text-parchment/85">
        {scores[top] === 0
          ? `None of your cards lean toward any ${title.toLowerCase()} group, so the shuffle set the order.`
          : `${name(top)} comes first mainly because of your ${leaders.map(([k]) => `${tally[k]} ${kindLabel(k, tally[k])}`).join(' and ')}.`}
        {ties.map(([a, b]) => ` ${name(a)} and ${name(b)} tied at ${scores[a]}; the shuffle put ${name(a)} first.`).join('')}
      </p>
    </div>
  );
}
