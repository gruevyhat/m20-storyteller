import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BESTIARY, BESTIARY_ORIGIN, CATEGORIES, HABITATS, beastImage, beastToCharacter, filterBestiary, hasPhysicalSheet, type Beast } from '../bestiary/catalog';
import { useChronicle } from '../store/chronicle';
import { beastPortrait } from '../bestiary/portrait';

const PAGE_SIZE = 24;

export default function BestiaryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [shown, setShown] = useState(PAGE_SIZE);
  const query = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const habitat = params.get('habitat') ?? '';
  const filtered = filterBestiary(query, category, habitat);
  const search = params.toString() ? `?${params}` : '';
  const selected = BESTIARY.find((beast) => beast.id === id);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
    setShown(PAGE_SIZE);
  }

  if (id) return (
    <div className="flex flex-col gap-3">
      <Link className="btn w-fit" to={`/bestiary${search}`}>← Back to Bestiary</Link>
      {selected ? <BeastDetail key={selected.id} beast={selected} /> : (
        <section className="panel"><h1 className="text-2xl">Creature not found</h1><p className="text-muted">Return to the catalog to choose an entry.</p></section>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <section className="panel">
        <h1 className="font-display text-3xl text-brass">Bestiary</h1>
        <p className="max-w-3xl text-sm text-muted">{BESTIARY.length} original homebrew creatures: strange wildlife, restless machines, uncanny visitors and a few hungrier things that should not be found. Find a creature for your scene and add it to your chronicle as an editable NPC.</p>
        <details className="mt-2 text-xs text-muted">
          <summary className="cursor-pointer">About these templates</summary>
          <p className="mt-1 max-w-3xl">These concepts, stat blocks and encounter rules were created for this app. They are homebrew suggestions for M20 play; adjust them to your chronicle. Resolve armor, damage and special actions manually. Unlisted Social Attributes remain unset. A rating range lets you choose lower or upper values when adding an NPC. Illustrations were generated locally with mflux and Z-Image Turbo.</p>
        </details>
      </section>

      <section className="panel flex flex-col gap-3" aria-label="Bestiary filters">
        <label className="flex flex-col gap-1">
          <span className="label">Search creatures</span>
          <input type="search" placeholder="Name, ability or feature: hushpelt, tracking, glass…" value={query} onChange={(e) => filter('q', e.target.value)} />
        </label>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="label">Creature type</span>
            <select value={category} onChange={(e) => filter('category', e.target.value)}>
              <option value="">All creatures</option>
              {CATEGORIES.map((type) => <option key={type} value={type}>{type} ({BESTIARY.filter((beast) => beast.category === type).length})</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="label">Habitat</span>
            <select value={habitat} onChange={(e) => filter('habitat', e.target.value)}>
              <option value="">All habitats</option>
              {HABITATS.map((place) => <option key={place} value={place}>{place}</option>)}
            </select>
          </label>
          <button className="btn" onClick={() => { setParams({}); setShown(PAGE_SIZE); }} disabled={!query && !category && !habitat}>Clear filters</button>
          <button className="btn" disabled={!filtered.length} onClick={() => navigate(`/bestiary/${filtered[Math.floor(Math.random() * filtered.length)].id}${search}`)}>Random creature</button>
          <span className="ml-auto text-sm text-muted" role="status">{filtered.length} {filtered.length === 1 ? 'creature' : 'creatures'}</span>
        </div>
      </section>

      {filtered.length ? <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.slice(0, shown).map((beast) => <li key={beast.id}>
          <Link className="panel flex h-full items-start gap-3 transition-colors hover:border-brass-dim" to={`/bestiary/${beast.id}${search}`}>
            <img src={beastImage(beast)} alt={beast.appearance} width={768} height={512} loading="lazy" decoding="async" className="aspect-[3/2] w-28 shrink-0 rounded border border-line object-cover" />
            <div className="flex min-w-0 flex-1 flex-col gap-2 self-stretch">
              <div className="flex flex-wrap gap-1"><span className="chip text-verdigris">{beast.category}</span><span className="chip text-muted">{beast.habitat}</span></div>
              <h2 className="font-display text-xl leading-tight text-brass">{beast.name}</h2>
              <p className="text-sm text-muted">{beast.description}</p>
              <p className="mt-auto pt-1 text-xs">Willpower {beast.willpower} · {beast.health.length ? `${beast.health.length} health levels · Armor ${beast.armor}` : 'Reference only'}</p>
              <span className="text-xs text-brass">View stat block →</span>
            </div>
          </Link>
        </li>)}
      </ul> : <div className="panel py-8 text-center"><h2 className="text-xl">No creatures match</h2><p className="text-muted">Try a different name or clear the filters.</p></div>}
      {shown < filtered.length && <button className="btn mx-auto" onClick={() => setShown(shown + PAGE_SIZE)}>Show {Math.min(PAGE_SIZE, filtered.length - shown)} more</button>}
    </div>
  );
}

function BeastDetail({ beast }: { beast: Beast }) {
  const { chronicle, dispatch, ready } = useChronicle();
  const [range, setRange] = useState<'low' | 'high'>('low');
  const [addedId, setAddedId] = useState('');
  const [adding, setAdding] = useState(false);
  const [imageNotice, setImageNotice] = useState('');
  const added = chronicle.characters.find((c) => c.id === addedId);
  const hasRanges = Object.values(beast.attributes).some((values) => values.length > 1);

  async function add() {
    if (adding) return;
    setAdding(true);
    setImageNotice('');
    const c = beastToCharacter(beast, range);
    try {
      c.image = await beastPortrait(beast);
    } catch {
      setImageNotice('NPC added without its portrait because the image could not be loaded. You can add a portrait on its sheet.');
    }
    dispatch({ type: 'addCharacters', characters: [c] });
    setAddedId(c.id);
    setAdding(false);
  }

  return (
    <article className="panel flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <div><span className="chip text-verdigris">{beast.category}</span></div>
        <h1 className="font-display text-3xl text-brass">{beast.name}</h1>
        <p className="max-w-3xl font-display text-lg">{beast.description}</p>
        <p className="text-xs text-muted">{BESTIARY_ORIGIN} · {beast.habitat}</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <figure className="max-w-xs">
          <img src={beastImage(beast)} alt={beast.appearance} width={768} height={512} className="aspect-[3/2] w-full rounded border border-line object-cover" />
          <figcaption className="mt-1 text-xs text-muted">Original creature illustration · mflux / Z-Image Turbo</figcaption>
        </figure>
        <div className="flex min-w-0 flex-col gap-5">
          <section className="flex flex-col gap-3" aria-label="Creature traits">
            <h2 className="h-section">Attributes</h2>
            {Object.keys(beast.attributes).length ? <dl className="grid grid-cols-2 gap-x-5 gap-y-1 sm:grid-cols-3">
              {Object.entries(beast.attributes).map(([name, values]) => <div className="flex justify-between gap-2 border-b border-line py-1" key={name}><dt className="text-muted">{name}</dt><dd className="font-mono text-brass-bright">{values.join('–')}</dd></div>)}
            </dl> : <p className="text-muted">Not applicable to this entity.</p>}
            <h2 className="h-section mt-1">Abilities</h2>
            <div className="flex flex-wrap gap-1.5">{beast.abilities.map((t) => <span className="chip" key={t.name}>{t.name}{t.specialty ? ` (${t.specialty})` : ''} <b className="text-brass-bright">{t.rating}</b></span>)}</div>
          </section>
          <section className="flex flex-col gap-3" aria-label="Combat reference">
            <div className="flex flex-wrap gap-5"><p><span className="label">Willpower</span> <b>{beast.willpower}</b></p><p><span className="label">Armor rating</span> <b>{beast.armor ?? 'N/A'}</b></p></div>
            <div>
              <h2 className="h-section mb-2">Health</h2>
              {beast.health.length ? <ol className="flex flex-wrap gap-1" aria-label="Health levels">{beast.health.map((level, i) => <li key={i} className={`rounded border border-line px-2 py-1 font-mono text-xs ${level.penalty <= -99 ? 'text-wound' : ''}`}>{level.name}</li>)}</ol> : <p className="text-muted">No physical health track.</p>}
            </div>
            <div><h2 className="h-section mb-2">Attacks & damage</h2><p>{beast.attacks}</p></div>
            {beast.notes && <div><h2 className="h-section mb-2">Powers & notes</h2><p className="text-sm leading-relaxed">{beast.notes}</p></div>}
            <p className="text-xs text-muted">Damage pools are separate from attack rolls. Resolve these homebrew actions manually using your chronicle’s combat rules.</p>
          </section>
        </div>
      </div>

      {hasPhysicalSheet(beast) ? <div className="flex flex-wrap items-end gap-3 border-t border-line pt-3">
        {hasRanges && <label className="flex flex-col gap-1"><span className="label">Attribute ranges</span><select value={range} onChange={(e) => setRange(e.target.value as 'low' | 'high')}><option value="low">Use lower ratings</option><option value="high">Use upper ratings</option></select></label>}
        <button className="btn-primary" disabled={!ready || adding} onClick={add}>{adding ? 'Adding NPC…' : added ? 'Add another NPC' : 'Add NPC to chronicle'}</button>
        <p className="text-xs text-muted">Creates an independent copy with its portrait, health and Willpower.</p>
        <div role="status">{added && <Link className="text-brass underline" to={`/characters/${added.id}`}>Added {added.name} · Open sheet →</Link>}{imageNotice && <p className="mt-1 text-xs text-muted">{imageNotice}</p>}</div>
      </div> : <p className="border-t border-line pt-3 text-sm text-muted">Reference only. This creature does not have the physical traits required by the NPC sheet.</p>}
    </article>
  );
}
