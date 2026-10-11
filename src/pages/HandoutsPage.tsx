import { useState } from 'react';
import { readImageScaled } from '../components/ui';
import { newId } from '../model/types';
import { useChronicle } from '../store/chronicle';

export default function HandoutsPage() {
  const { chronicle, dispatch } = useChronicle();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');

  async function addImages(files: FileList | null) {
    if (!files) return;
    for (const f of Array.from(files)) {
      dispatch({ type: 'addHandout', handout: { id: newId(), title: f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '), image: await readImageScaled(f, 2000) } });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="panel flex flex-col gap-3">
        <h2 className="h-section">Handouts</h2>
        <p className="text-sm text-muted">Images or text you can reveal on the player screen. They're stored in this chronicle, so export it to keep them.</p>
        <div className="flex flex-wrap items-start gap-3">
          <label className="btn cursor-pointer">
            Add images…
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addImages(e.target.files)} />
          </label>
          <form
            className="flex flex-1 flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim() && !text.trim()) return;
              dispatch({ type: 'addHandout', handout: { id: newId(), title: title.trim() || 'Untitled', text } });
              setTitle('');
              setText('');
            }}
          >
            <input placeholder="Text handout title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea rows={3} placeholder="Text the players see" value={text} onChange={(e) => setText(e.target.value)} />
            <button className="btn w-fit" type="submit">
              Add text handout
            </button>
          </form>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {chronicle.handouts.map((h) => {
          const shown = chronicle.shownHandout === h.id;
          return (
            <article key={h.id} className={`panel flex flex-col gap-2 ${shown ? 'border-brass' : ''}`}>
              {h.image ? (
                <img src={h.image} alt={h.title} className="max-h-56 w-full rounded object-contain" />
              ) : (
                <p className="line-clamp-6 whitespace-pre-wrap font-display text-lg">{h.text}</p>
              )}
              <div className="flex items-center justify-between gap-2">
                <input
                  className="min-w-0 flex-1 font-medium"
                  value={h.title}
                  onChange={(e) => dispatch({ type: 'updateHandout', id: h.id, patch: { title: e.target.value } })}
                  aria-label="Handout title (players see this)"
                />
                <span className="flex gap-1">
                  <button className={shown ? 'btn-primary' : 'btn'} onClick={() => dispatch({ type: 'showHandout', id: shown ? null : h.id })}>
                    {shown ? 'Showing' : 'Show'}
                  </button>
                  <button className="btn-ghost" onClick={() => dispatch({ type: 'removeHandout', id: h.id })} aria-label={`Remove ${h.title}`}>
                    ✕
                  </button>
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
