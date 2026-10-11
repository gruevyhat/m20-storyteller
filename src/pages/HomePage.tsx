// The front door: what the app is, where to start, and a way back into the current chronicle.
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { openPlayerWindow } from '../App';
import { BESTIARY, beastImage } from '../bestiary/catalog';
import { HandoutView } from '../components/HandoutView';
import { CardFace } from '../components/TarotCard';
import { DECK } from '../fortune/deck';
import { CATALOG_SIZE } from '../grimoire/generate';
import { INFLUENCES } from '../grimoire/influences';
import { HANDOUT_TEMPLATES } from '../handouts/templates';
import { chronicleTitle } from '../model/types';
import { NAME_STYLES } from '../names/markov';
import { useChronicle } from '../store/chronicle';

const card = (id: string) => DECK.find((c) => c.id === id)!;
const FAN = [
  { id: 'major-1', className: '-rotate-[14deg] translate-x-10 translate-y-4' },
  { id: 'major-17', className: 'z-10 -translate-y-2' },
  { id: 'major-13', className: 'rotate-[14deg] -translate-x-10 translate-y-4' },
];

export default function HomePage() {
  const { chronicle } = useChronicle();
  const name = chronicleTitle(chronicle);
  const pcs = chronicle.characters.filter((c) => c.kind === 'pc').length;
  const npcs = chronicle.characters.length - pcs;
  const begun = chronicle.characters.length > 0 || chronicle.handouts.length > 0 || chronicle.log.length > 0 || !!name;
  const featured = BESTIARY.find((b) => b.id === 'reliquary-engine') ?? BESTIARY[0];
  const telegram = HANDOUT_TEMPLATES.find((t) => t.style === 'telegram')!;

  return (
    <div className="flex flex-col gap-6 pb-4">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-lg border border-line bg-panel">
        <Lattice />
        <div className="pointer-events-none absolute -right-24 top-1/2 h-[36rem] w-[36rem] -translate-y-1/2 rounded-full bg-brass/10 blur-3xl" />
        <div className="relative grid grid-cols-[minmax(0,1fr)] items-center gap-8 px-6 py-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:px-10 md:py-14">
          <div className="flex flex-col gap-5">
            <p className="label text-brass">A free Storyteller’s console for M20</p>
            <h1 className="font-display text-5xl font-semibold leading-[1.02] text-parchment md:text-6xl">
              The table, the cabal <br className="hidden md:inline" />
              and the <span className="italic text-brass-bright">Unseen</span>, <br className="hidden md:inline" />
              in one window.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted">
              Roll magick and track Paradox at the table, deal a tarot reading that becomes a mage, pull a rote or a horror from the stacks, and push handouts to a second
              screen for your players. Everything stays in your browser.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link className="btn-primary px-4 py-2 text-base" to="/table">
                {begun ? 'Return to the table' : 'Open the table'}
              </Link>
              <Link className="btn px-4 py-2 text-base" to="/fortune">
                Draw a mage
              </Link>
              <button className="btn px-4 py-2 text-base" onClick={openPlayerWindow}>
                Player screen ↗
              </button>
            </div>
          </div>
          <div className="relative mx-auto flex h-56 w-full max-w-md sm:h-72 items-center justify-center md:h-96" aria-hidden="true">
            {FAN.map((f) => (
              <div
                key={f.id}
                className={`w-24 shrink-0 drop-shadow-[0_18px_30px_rgba(0,0,0,0.65)] transition-transform duration-500 hover:-translate-y-4 sm:w-32 md:w-40 ${f.className}`}
                style={{ aspectRatio: '120 / 200' }}
              >
                <CardFace card={card(f.id)} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Current chronicle */}
      {begun && (
        <section className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-brass-dim/60 bg-raised/60 px-5 py-3">
          <span className="label">Your chronicle</span>
          <span className="font-display text-2xl text-brass">{name || 'Unnamed chronicle'}</span>
          <span className="text-sm text-muted">
            {pcs} {pcs === 1 ? 'player character' : 'player characters'} · {npcs} NPC{npcs === 1 ? '' : 's'} · {chronicle.handouts.length} handout
            {chronicle.handouts.length === 1 ? '' : 's'}
            {chronicle.settings.place && ` · ${chronicle.settings.place}`}
            {chronicle.settings.era && `, ${chronicle.settings.era}`}
          </span>
          <span className="ml-auto flex gap-2">
            <Link className="btn" to="/characters">
              Characters
            </Link>
            <Link className="btn" to="/chronicle">
              Chronicle
            </Link>
          </span>
        </section>
      )}

      {/* What's inside */}
      <Group title="At the table" blurb="The live session: dice, wounds, initiative and what the players see.">
        <Feature to="/table" title="Table" text="Dice pools and magick difficulty, Paradox, initiative, a session log and a clock, with the whole cabal at a glance.">
          <DiceRow />
        </Feature>
        <Feature to="/handouts" title="Handouts" text={`${HANDOUT_TEMPLATES.length} paper looks, from telegrams to police reports, with secrets that stay secret.`}>
          <div className="h-28 overflow-hidden rounded-sm">
            <HandoutView style={telegram.style} text={telegram.text} size="0.5rem" />
          </div>
        </Feature>
        <Feature
          title="Player screen"
          text="A second window for a TV or monitor: scene title, fresh rolls, party health and initiative, and the handout you reveal."
          onClick={openPlayerWindow}
          cta="Open ↗"
        >
          <ScreenSketch />
        </Feature>
      </Group>

      <Group title="Characters" blurb="Three ways to make a mage, and a sheet that rolls its own dice.">
        <Feature to="/fortune" title="Fortune" text="Nine tarot cards, dealt face down. Turn them and the reading becomes a legal starting mage, Merits and Flaws included.">
          <div className="flex h-28 items-center justify-center gap-2">
            {['cups-3', 'swords-14'].map((id) => (
              <div key={id} className="h-28 shrink-0" style={{ aspectRatio: '120 / 200' }}>
                <CardFace card={card(id)} />
              </div>
            ))}
          </div>
        </Feature>
        <Feature to="/create" title="Create" text={`Guided creation that follows the M20 steps, with live checks, a freebie budget and Markov-chain names from ${NAME_STYLES.length} traditions.`}>
          <StepsSketch />
        </Feature>
        <Feature to="/characters" title="Characters" text="Sheet-style trackers, a dice popup on every trait, and Markdown and PDF export.">
          <SheetSketch />
        </Feature>
      </Group>

      <Group title="Reference" blurb="Things to reach for mid-scene.">
        <Feature to="/grimoire" title="Grimoire" text={`${CATALOG_SIZE.toLocaleString()} generated rotes across ${INFLUENCES.length} hands, filtered by what a character can actually cast.`}>
          <RoteSketch />
        </Feature>
        <Feature to="/bestiary" title="Bestiary" text={`${BESTIARY.length} original creatures, from odd wildlife to things that watch from between the stars. Add any as an NPC.`}>
          <img src={beastImage(featured)} alt={featured.appearance} className="h-28 w-full rounded-sm object-cover" loading="lazy" />
        </Feature>
        <Feature to="/rules" title="Rules" text="Search rulebooks you own. Your files are read locally and never leave the browser.">
          <SearchSketch />
        </Feature>
      </Group>

      <a
        href={`${import.meta.env.BASE_URL}tutorial.html`}
        className="group flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg border border-line bg-panel px-5 py-4 transition-colors hover:border-brass-dim"
      >
        <span className="label text-brass">Guide</span>
        <span className="font-display text-2xl text-parchment group-hover:text-brass-bright">Building RPG tools with a coding assistant</span>
        <span className="text-sm text-muted">How this app was made, with the actual requests and corrections, and what to check along the way.</span>
        <span className="ml-auto text-sm text-brass">Read the guide →</span>
      </a>

      <p className="text-center text-xs text-muted">
        No account, no server. Your chronicle saves in this browser; export it from{' '}
        <Link className="underline" to="/chronicle">
          Chronicle
        </Link>{' '}
        to back it up or move it.
      </p>
    </div>
  );
}

function Group({ title, blurb, children }: { title: string; blurb: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3 border-b border-line pb-1.5">
        <h2 className="font-display text-2xl text-parchment">{title}</h2>
        <p className="text-sm text-muted">{blurb}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">{children}</div>
    </section>
  );
}

function Feature({ to, onClick, title, text, cta = 'Open →', children }: { to?: string; onClick?: () => void; title: string; text: string; cta?: string; children?: ReactNode }) {
  const body = (
    <>
      {children && <div className="overflow-hidden rounded-sm">{children}</div>}
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="font-display text-xl text-brass group-hover:text-brass-bright">{title}</h3>
        <p className="text-sm leading-relaxed text-muted">{text}</p>
      </div>
      <span className="text-xs text-brass opacity-70 transition-opacity group-hover:opacity-100">{cta}</span>
    </>
  );
  const cls = 'group panel flex h-full flex-col gap-3 text-left transition-colors hover:border-brass-dim';
  return to ? (
    <Link to={to} className={cls}>
      {body}
    </Link>
  ) : (
    <button className={cls} onClick={onClick}>
      {body}
    </button>
  );
}

/** A faint sacred-geometry lattice behind the hero. */
function Lattice() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full text-brass opacity-[0.07]" aria-hidden="true">
      <defs>
        <pattern id="home-lattice" width="64" height="64" patternUnits="userSpaceOnUse">
          <circle cx="32" cy="32" r="31" fill="none" stroke="currentColor" />
          <circle cx="0" cy="0" r="31" fill="none" stroke="currentColor" />
          <circle cx="64" cy="0" r="31" fill="none" stroke="currentColor" />
          <circle cx="0" cy="64" r="31" fill="none" stroke="currentColor" />
          <circle cx="64" cy="64" r="31" fill="none" stroke="currentColor" />
        </pattern>
        <linearGradient id="home-fade" x1="0" x2="1">
          <stop offset="0" stopColor="white" stopOpacity="0.25" />
          <stop offset="1" stopColor="white" stopOpacity="1" />
        </linearGradient>
        <mask id="home-mask">
          <rect width="100%" height="100%" fill="url(#home-fade)" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#home-lattice)" mask="url(#home-mask)" />
    </svg>
  );
}

function DiceRow() {
  const faces = [10, 7, 3, 8, 1, 6];
  return (
    <div className="flex h-28 flex-col items-center justify-center gap-2 rounded-sm bg-ink/60">
      <div className="flex gap-1.5">
        {faces.map((f, i) => (
          <span key={i} className={`die ${f >= 6 ? 'die-hit' : ''} ${f === 1 ? 'die-one' : ''} ${f === 10 ? 'die-double' : ''}`}>
            {f}
          </span>
        ))}
      </div>
      <span className="font-display text-lg text-brass-bright">3 successes</span>
    </div>
  );
}

function ScreenSketch() {
  return (
    <div className="flex h-28 items-center justify-center rounded-sm bg-ink/60">
      <div className="flex h-20 w-36 flex-col justify-between rounded border-2 border-line bg-ink p-1.5 shadow-inner">
        <div className="h-1.5 w-14 rounded-sm bg-brass/70" />
        <div className="self-center font-display text-lg leading-none text-brass-bright">Success</div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-3 flex-1 rounded-sm border border-line" />
          ))}
        </div>
      </div>
    </div>
  );
}

function RoteSketch() {
  return (
    <div className="flex h-28 flex-col justify-center gap-1 rounded-sm bg-ink/60 px-4">
      <span className="label text-verdigris">Correspondence ●● · Mind ●</span>
      <span className="font-display text-lg leading-tight text-parchment">The Second Witness</span>
      <span className="text-xs text-muted">Sees a room through the eyes of the last person to leave it.</span>
    </div>
  );
}

function StepsSketch() {
  const steps = ['Concept', 'Attributes', 'Abilities', 'Advantages', 'Magick', 'Freebies'];
  return (
    <div className="flex h-28 flex-col justify-center gap-2 rounded-sm bg-ink/60 px-4">
      <div className="flex items-center gap-1">
        {steps.map((st, i) => (
          <span key={st} className={`h-1.5 flex-1 rounded-full ${i < 4 ? 'bg-brass' : i === 4 ? 'bg-brass/40' : 'bg-line'}`} />
        ))}
      </div>
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted">
        <span>Concept</span>
        <span className="text-brass-bright">Magick</span>
        <span>Freebies</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="font-display text-lg text-parchment">Sphere dots</span>
        <span className="font-mono text-sm text-brass-bright">5 / 6</span>
      </div>
    </div>
  );
}

function SheetSketch() {
  const dots = (n: number, of = 5) =>
    Array.from({ length: of }, (_, i) => <span key={i} className={`h-2.5 w-2.5 rounded-full border ${i < n ? 'border-brass bg-brass' : 'border-line'}`} />);
  return (
    <div className="flex h-28 flex-col justify-center gap-1.5 rounded-sm bg-ink/60 px-4 text-sm">
      {[
        ['Arete', 3],
        ['Willpower', 6, 10],
      ].map(([label, n, of]) => (
        <div key={label as string} className="flex items-center justify-between gap-2">
          <span className="text-muted">{label}</span>
          <span className="flex gap-1">{dots(n as number, (of as number) ?? 5)}</span>
        </div>
      ))}
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted">Health</span>
        <span className="flex gap-1">
          {['/', '✕', '', '', '', '', ''].map((m, i) => (
            <span key={i} className={`grid h-3.5 w-3.5 place-items-center rounded-sm border font-mono text-[9px] ${m ? 'border-wound text-wound' : 'border-line'}`}>
              {m}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

function SearchSketch() {
  return (
    <div className="flex h-28 flex-col justify-center gap-2 rounded-sm bg-ink/60 px-4">
      <div className="rounded border border-line bg-panel px-2 py-1 text-sm text-parchment">
        paradox backlash<span className="ml-0.5 animate-pulse text-brass">|</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="h-1.5 w-11/12 rounded-full bg-line" />
        <span className="h-1.5 w-3/4 rounded-full bg-brass/40" />
        <span className="h-1.5 w-5/6 rounded-full bg-line" />
      </div>
    </div>
  );
}
