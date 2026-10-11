// A workshop for making handouts. The draft here is scratch work; "Add to chronicle" saves a copy,
// and the chronicle's handouts are kept and shown from the Chronicle page.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HandoutEditor } from '../components/HandoutEditor';
import { HandoutView } from '../components/HandoutView';
import { readImageScaled } from '../components/ui';
import { HANDOUT_TEMPLATES } from '../handouts/templates';
import { chronicleTitle, newId, type Handout } from '../model/types';
import { useChronicle } from '../store/chronicle';

type Draft = Omit<Handout, 'id'>;

export default function HandoutsPage() {
  const { chronicle, dispatch } = useChronicle();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [added, setAdded] = useState('');

  const start = (d: Draft) => {
    setDraft(d);
    setAdded('');
  };

  async function pickImage(file: File | undefined) {
    if (!file) return;
    start({ title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '), image: await readImageScaled(file, 2000) });
  }

  function addToChronicle(show = false) {
    if (!draft) return;
    const id = newId();
    dispatch({ type: 'addHandout', handout: { id, ...draft, title: draft.title.trim() || 'Untitled' } });
    if (show) dispatch({ type: 'showHandout', id });
    setAdded(draft.title.trim() || 'Untitled');
    setDraft(null);
  }

  const name = chronicleTitle(chronicle) || 'the chronicle';
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="panel flex flex-col gap-2" aria-labelledby="templates-heading">
        <h2 id="templates-heading" className="h-section">
          Make a handout
        </h2>
        <p className="text-sm text-muted">
          Start from a template, a blank page or an image, then add it to {name}. The chronicle’s handouts are on the{' '}
          <Link className="underline" to="/chronicle">
            Chronicle
          </Link>{' '}
          page ({chronicle.handouts.length}).
        </p>
        <div className="flex flex-wrap gap-2">
          <label className="btn cursor-pointer">
            From an image…
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => pickImage(e.target.files?.[0])} />
          </label>
          <button className="btn" onClick={() => start({ title: '', text: '' })}>
            Blank text
          </button>
        </div>
        <ul className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(10rem,1fr))]">
          {HANDOUT_TEMPLATES.map((t) => (
            <li key={t.style}>
              <button
                className={`group flex h-full w-full flex-col gap-1.5 rounded border bg-raised p-2 text-left hover:border-brass-dim ${draft?.style === t.style ? 'border-brass' : 'border-line'}`}
                onClick={() => start({ title: t.title, text: t.text, style: t.style })}
              >
                <div className="pointer-events-none relative h-24 overflow-hidden rounded-sm" aria-hidden="true">
                  <HandoutView style={t.style} text={t.text} size="0.38rem" />
                  <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-raised to-transparent" />
                </div>
                <span className="font-medium group-hover:text-brass-bright">{t.label}</span>
                <span className="text-xs leading-snug text-muted">{t.use}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel flex h-fit flex-col gap-3 lg:sticky lg:top-14" aria-label="Draft">
        <h2 className="h-section">Draft</h2>
        {draft ? (
          <>
            <input
              value={draft.title}
              placeholder="Title (players see this)"
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              aria-label="Handout title (players see this)"
            />
            {draft.image ? (
              <img src={draft.image} alt={draft.title} className="max-h-[50vh] w-full rounded object-contain" />
            ) : (
              <>
                {draft.style ? (
                  <HandoutView style={draft.style} text={draft.text ?? ''} size="0.8rem" />
                ) : (
                  <p className="whitespace-pre-wrap rounded bg-parchment p-4 font-display text-lg text-ink">{draft.text || ' '}</p>
                )}
                <HandoutEditor h={draft} onChange={(p) => setDraft({ ...draft, ...p })} rows={8} />
              </>
            )}
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" onClick={() => addToChronicle()}>
                Add to chronicle
              </button>
              <button className="btn" onClick={() => addToChronicle(true)}>
                Add and show
              </button>
              <button className="btn-ghost" onClick={() => setDraft(null)}>
                Discard
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">
            {added ? (
              <>
                Added <b className="text-parchment">{added}</b> to {name}.{' '}
                <Link className="underline" to="/chronicle">
                  See the chronicle’s handouts
                </Link>
                .
              </>
            ) : (
              'Pick a template, a blank page or an image to start a draft. Nothing is saved until you add it to the chronicle.'
            )}
          </p>
        )}
      </section>
    </div>
  );
}
