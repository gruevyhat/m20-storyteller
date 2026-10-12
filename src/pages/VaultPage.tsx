import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { SPHERES } from '../model/types';
import { logXp, xpTotals } from '../model/experience';
import { useChronicle } from '../store/chronicle';
import { Dots } from '../components/ui';
import { VAULT, VAULT_KINDS, KIND_RULES, MODE_LABEL, costText, filterVault, sphereText, toSheetWonder, type VaultWonder } from '../wonders/catalog';

const PAGE_SIZE = 24;
const PARADIGM_LABEL = { mystic: 'Mystic', tech: 'Technological', either: 'Mystic or tech' };

export default function VaultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [shown, setShown] = useState(PAGE_SIZE);
  const query = params.get('q') ?? '';
  const kind = params.get('kind') ?? '';
  const paradigm = params.get('paradigm') ?? '';
  const sphere = params.get('sphere') ?? '';
  const maxRating = Number(params.get('dots')) || 0;
  const filtered = filterVault({ query, kind, paradigm, sphere, maxRating });
  const search = params.toString() ? `?${params}` : '';
  const selected = VAULT.find((w) => w.id === id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
    setShown(PAGE_SIZE);
  }

  if (id)
    return (
      <div className="flex flex-col gap-3">
        <Link className="btn w-fit" to={`/vault${search}`}>
          ← Back to the Vault
        </Link>
        {selected ? (
          <WonderDetail key={selected.id} w={selected} />
        ) : (
          <section className="panel">
            <h1 className="text-2xl">Wonder not found</h1>
            <p className="text-muted">Return to the Vault to choose another.</p>
          </section>
        )}
      </div>
    );

  return (
    <div className="flex flex-col gap-3">
      <section className="panel">
        <h1 className="font-display text-3xl text-brass">Vault</h1>
        <p className="max-w-3xl text-sm text-muted">
          {VAULT.length} original Wonders, from a keyring that can’t lose its keys to a watch that steps back through time. Each one has its rating,
          point cost, Spheres, and a history worth a story. Give one to a character, or let them buy it with experience.
        </p>
        <details className="mt-2 text-xs text-muted">
          <summary className="cursor-pointer">How Wonders work</summary>
          <ul className="mt-1 grid max-w-4xl gap-x-6 gap-y-0.5 md:grid-cols-2">
            {VAULT_KINDS.map((k) => (
              <li key={k}>
                <b className="text-parchment">{k}</b>: {KIND_RULES[k]}
              </li>
            ))}
          </ul>
          <p className="mt-1 max-w-3xl">
            A Wonder’s dots equal its strongest Sphere rank, with up to one power per dot. It costs 3 points per dot, give or take two; Charms and Gadgets cost half
            per batch of ten, and Trinkets cost their highest Sphere rank. A mage pays nothing for a Wonder they crafted themselves. These items are homebrew written to
            the M20 and Book of Secrets rules.
          </p>
        </details>
      </section>

      <section className="panel flex flex-col gap-3" aria-label="Vault filters">
        <label className="flex flex-col gap-1">
          <span className="label">Search the Vault</span>
          <input type="search" placeholder="Name, power or history: lantern, healing, Etherite…" value={query} onChange={(e) => filter('q', e.target.value)} />
        </label>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="label">Kind</span>
            <select value={kind} onChange={(e) => filter('kind', e.target.value)}>
              <option value="">All kinds</option>
              {VAULT_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k} ({VAULT.filter((w) => w.kind === k).length})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="label">Paradigm</span>
            <select value={paradigm} onChange={(e) => filter('paradigm', e.target.value)}>
              <option value="">Mystic and tech</option>
              <option value="mystic">Mystic</option>
              <option value="tech">Technological</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="label">Uses Sphere</span>
            <select value={sphere} onChange={(e) => filter('sphere', e.target.value)}>
              <option value="">Any Sphere</option>
              {SPHERES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="label">Rating up to</span>
            <select value={maxRating || ''} onChange={(e) => filter('dots', e.target.value)}>
              <option value="">Any</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {'●'.repeat(n)}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn"
            onClick={() => {
              setParams({});
              setShown(PAGE_SIZE);
            }}
            disabled={!params.toString()}
          >
            Clear filters
          </button>
          <button className="btn" disabled={!filtered.length} onClick={() => navigate(`/vault/${filtered[Math.floor(Math.random() * filtered.length)].id}${search}`)}>
            Random Wonder
          </button>
          <span className="ml-auto text-sm text-muted" role="status">
            {filtered.length} {filtered.length === 1 ? 'Wonder' : 'Wonders'}
          </span>
        </div>
      </section>

      {filtered.length ? (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.slice(0, shown).map((w) => (
            <li key={w.id}>
              <Link className="panel flex h-full flex-col gap-2 transition-colors hover:border-brass-dim" to={`/vault/${w.id}${search}`}>
                <div className="flex flex-wrap items-center gap-1">
                  <span className="chip text-verdigris">{w.kind}</span>
                  <span className="chip text-muted">{PARADIGM_LABEL[w.paradigm]}</span>
                  <span className="ml-auto">
                    <Dots label={`${w.name} rating`} value={w.rating} />
                  </span>
                </div>
                <h2 className="font-display text-xl leading-tight text-brass">{w.name}</h2>
                <p className="text-sm text-muted">{w.look}</p>
                <p className="mt-auto pt-1 text-xs">
                  {w.powers.length ? w.powers.map((p) => sphereText(p.spheres)).join(' · ') : `Holds ${w.quintessence} Quintessence`} · {costText(w)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="panel py-8 text-center">
          <h2 className="text-xl">No Wonders match</h2>
          <p className="text-muted">Try a different search or clear the filters.</p>
        </div>
      )}
      {shown < filtered.length && (
        <button className="btn mx-auto" onClick={() => setShown(shown + PAGE_SIZE)}>
          Show {Math.min(PAGE_SIZE, filtered.length - shown)} more
        </button>
      )}
    </div>
  );
}

function WonderDetail({ w }: { w: VaultWonder }) {
  const { chronicle, dispatch } = useChronicle();
  const [ownerId, setOwnerId] = useState('');
  const [done, setDone] = useState('');
  const owner = chronicle.characters.find((c) => c.id === ownerId);
  const available = owner ? xpTotals(owner).available : 0;

  function give(buy: boolean) {
    if (!owner) return;
    dispatch({
      type: 'updateCharacter',
      id: owner.id,
      patch: (c) => {
        const withWonder = { ...c, wonders: [...(c.wonders ?? []), toSheetWonder(w)] };
        return buy ? logXp(withWonder, -w.points, `Wonder: ${w.name}`) : withWonder;
      },
    });
    setDone(buy ? `${owner.name} bought it for ${w.points} XP.` : `Given to ${owner.name}.`);
  }

  return (
    <article className="panel flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip text-verdigris">{w.kind}</span>
          <span className="chip text-muted">{PARADIGM_LABEL[w.paradigm]}</span>
          <Dots label={`${w.name} rating`} value={w.rating} />
        </div>
        <h1 className="font-display text-3xl text-brass">{w.name}</h1>
        <p className="max-w-3xl font-display text-lg">{w.look}</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <section>
            <h2 className="h-section mb-2">{w.powers.length === 1 ? 'Power' : 'Powers'}</h2>
            {w.powers.length ? (
              <ul className="flex flex-col gap-2">
                {w.powers.map((p, i) => (
                  <li key={i}>
                    <span className="label">{sphereText(p.spheres)}</span>
                    <p>{p.text}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Stores up to {w.quintessence} Quintessence for its owner.</p>
            )}
          </section>
          <section>
            <h2 className="h-section mb-2">Using it</h2>
            <p className="text-sm">{KIND_RULES[w.kind]}</p>
            <p className="mt-1 text-sm text-muted">{MODE_LABEL[w.mode]}.</p>
          </section>
          <section>
            <h2 className="h-section mb-2">History</h2>
            <p className="text-sm leading-relaxed">{w.origin}</p>
          </section>
          <section>
            <h2 className="h-section mb-2">Quirk</h2>
            <p className="text-sm leading-relaxed">{w.quirk}</p>
          </section>
        </div>
        <dl className="grid h-fit grid-cols-2 gap-x-4 gap-y-2 rounded border border-line p-3 text-sm">
          <div>
            <dt className="label">Rating</dt>
            <dd>{w.rating} dots</dd>
          </div>
          <div>
            <dt className="label">Cost</dt>
            <dd>{costText(w)}</dd>
          </div>
          {w.arete !== undefined && (
            <div>
              <dt className="label">{w.paradigm === 'tech' ? 'Enlightenment' : 'Arete'}</dt>
              <dd>{w.arete}</dd>
            </div>
          )}
          {w.gnosis !== undefined && (
            <div>
              <dt className="label">Gnosis</dt>
              <dd>{w.gnosis}</dd>
            </div>
          )}
          {w.quintessence !== undefined && (
            <div>
              <dt className="label">Quintessence</dt>
              <dd>{w.quintessence}</dd>
            </div>
          )}
          {w.spirit && (
            <div className="col-span-2">
              <dt className="label">Bound spirit</dt>
              <dd>{w.spirit}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-line pt-3">
        <label className="flex flex-col gap-1">
          <span className="label">Give it to</span>
          <select
            value={ownerId}
            onChange={(e) => {
              setOwnerId(e.target.value);
              setDone('');
            }}
          >
            <option value="">Choose a character…</option>
            {chronicle.characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button className="btn" disabled={!owner} onClick={() => give(false)} title="As a Background, a story reward, or something they crafted themselves">
          Give
        </button>
        {owner?.kind === 'pc' && (
          <button className="btn" disabled={available < w.points} onClick={() => give(true)}>
            Buy for {w.points} XP <span className="text-muted">({available} available)</span>
          </button>
        )}
        <div role="status" className="text-sm">
          {done && owner && (
            <Link className="text-brass underline" to={`/characters/${owner.id}`}>
              {done} Open sheet →
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
