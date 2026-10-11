// One of the chronicle's handouts: a preview, Show on the player screen, and in-place editing.
import { HandoutView } from './HandoutView';
import { HandoutEditor } from './HandoutEditor';
import type { Handout } from '../model/types';
import { useChronicle } from '../store/chronicle';

export function HandoutPreview({ h, size = '0.6rem' }: { h: Omit<Handout, 'id'>; size?: string }) {
  if (h.image) return <img src={h.image} alt={h.title} className="max-h-56 w-full rounded object-contain" />;
  if (h.style)
    return (
      <div className="relative max-h-64 overflow-hidden rounded-sm">
        <HandoutView style={h.style} text={h.text ?? ''} size={size} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-panel to-transparent" />
      </div>
    );
  return <p className="line-clamp-6 whitespace-pre-wrap font-display text-lg">{h.text}</p>;
}

export function HandoutCard({ h, editing, onEdit }: { h: Handout; editing: boolean; onEdit: () => void }) {
  const { chronicle, dispatch } = useChronicle();
  const shown = chronicle.shownHandout === h.id;
  const patch = (p: Partial<Handout>) => dispatch({ type: 'updateHandout', id: h.id, patch: p });
  return (
    <article className={`panel flex flex-col gap-2 ${shown ? 'border-brass' : ''}`}>
      <HandoutPreview h={h} />
      <div className="flex items-center justify-between gap-2">
        <input className="min-w-0 flex-1 font-medium" value={h.title} onChange={(e) => patch({ title: e.target.value })} aria-label="Handout title (players see this)" />
        <span className="flex gap-1">
          <button className={shown ? 'btn-primary' : 'btn'} onClick={() => dispatch({ type: 'showHandout', id: shown ? null : h.id })}>
            {shown ? 'Showing' : 'Show'}
          </button>
          {!h.image && (
            <button className={editing ? 'btn-primary' : 'btn'} onClick={onEdit} aria-expanded={editing}>
              {editing ? 'Done' : 'Edit'}
            </button>
          )}
          <button className="btn-ghost" onClick={() => dispatch({ type: 'removeHandout', id: h.id })} aria-label={`Remove ${h.title}`}>
            ✕
          </button>
        </span>
      </div>
      {editing && !h.image && <HandoutEditor h={h} onChange={patch} />}
    </article>
  );
}
