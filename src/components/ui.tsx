import { useState, type ReactNode } from 'react';
import type { Damage, HealthLevel } from '../model/types';
import { WHEEL_SIZE } from '../model/types';

export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 20,
  signed = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  signed?: boolean;
}) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, v)));
  return (
    <div className="flex flex-col gap-0.5">
      <span className="label">{label}</span>
      <div className="flex w-fit items-center overflow-hidden rounded border border-line" role="group" aria-label={label}>
        <button className="px-2 py-0.5 text-muted hover:bg-raised hover:text-parchment" onClick={() => set(value - 1)} aria-label={`Lower ${label}`}>
          −
        </button>
        <output className="min-w-[1.75rem] text-center font-mono">{signed && value > 0 ? `+${value}` : value}</output>
        <button className="px-2 py-0.5 text-muted hover:bg-raised hover:text-parchment" onClick={() => set(value + 1)} aria-label={`Raise ${label}`}>
          +
        </button>
      </div>
    </div>
  );
}

export function Dots({ value, max = 5, onChange, label }: { value: number; max?: number; onChange?: (v: number) => void; label?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={label ? `${label}: ${value}` : `${value}`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < value;
        const cls = `h-2.5 w-2.5 rounded-full border ${filled ? 'border-brass bg-brass' : 'border-line'}`;
        return onChange ? (
          <button key={i} className={cls} onClick={() => onChange(value === i + 1 ? i : i + 1)} aria-label={`Set ${label ?? ''} to ${i + 1}`} />
        ) : (
          <span key={i} className={cls} />
        );
      })}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  children,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-start gap-1.5 text-sm ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <input type="checkbox" className="mt-1 accent-[#c9a227]" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

export function Tabs<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded border border-line p-0.5" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          className={`rounded px-2.5 py-0.5 text-sm ${value === o.value ? 'bg-raised text-brass-bright' : 'text-muted hover:text-parchment'}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** The shared Quintessence / Paradox wheel: Quintessence fills from one side, Paradox from the other. */
export function Wheel({ quintessence, paradox, permanentParadox = 0 }: { quintessence: number; paradox: number; permanentParadox?: number }) {
  return (
    <div className="flex gap-[2px]" aria-label={`Quintessence ${quintessence}, Paradox ${paradox}`}>
      {Array.from({ length: WHEEL_SIZE }, (_, i) => {
        const fromRight = WHEEL_SIZE - 1 - i;
        const cls =
          i < quintessence
            ? 'bg-quint'
            : fromRight < permanentParadox
              ? 'bg-paradox ring-1 ring-parchment/60'
              : fromRight < paradox
                ? 'bg-paradox'
                : 'bg-raised';
        return <span key={i} className={`h-2.5 flex-1 rounded-sm ${cls}`} />;
      })}
    </div>
  );
}

const DAMAGE_LABEL: Record<Damage, string> = { B: '/', L: 'X', A: '✱' };
const SEVERITY: Record<Damage, number> = { A: 0, L: 1, B: 2 };

export function sortDamage(d: Damage[]) {
  return [...d].sort((a, b) => SEVERITY[a] - SEVERITY[b]);
}

export function HealthTrack({
  levels,
  damage,
  onChange,
  compact,
}: {
  levels: HealthLevel[];
  damage: Damage[];
  onChange?: (d: Damage[]) => void;
  compact?: boolean;
}) {
  const add = (t: Damage) => onChange?.(sortDamage([...damage, t]).slice(0, levels.length));
  const heal = () => {
    // Heal the least severe wound first.
    const sorted = sortDamage(damage);
    onChange?.(sorted.slice(0, -1));
  };
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <div className="flex flex-wrap gap-[3px]">
        {levels.map((l, i) => (
          <span
            key={i}
            title={`${l.name}${l.penalty < 0 && l.penalty > -99 ? ` ${l.penalty}` : ''}`}
            className={`grid ${compact ? 'h-4 w-4 text-[10px]' : 'h-6 w-6'} place-items-center rounded border font-mono ${
              damage[i] ? 'border-wound text-wound' : 'border-line text-muted'
            }`}
          >
            {damage[i] ? DAMAGE_LABEL[damage[i]] : ''}
          </span>
        ))}
      </div>
      {onChange && (
        <div className="flex gap-0.5">
          <button className="btn-ghost" onClick={() => add('B')} title="Bashing">+B</button>
          <button className="btn-ghost" onClick={() => add('L')} title="Lethal">+L</button>
          <button className="btn-ghost" onClick={() => add('A')} title="Aggravated">+A</button>
          <button className="btn-ghost" onClick={heal} disabled={!damage.length}>Heal 1</button>
        </div>
      )}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function readFileAsText(file: File) {
  return file.text();
}

/**
 * Read an image, scaled so its longest side is at most `maxSide`, as a WebP data URL.
 * Keeps the chronicle small enough to autosave and sync quickly. Falls back to the original file.
 */
export async function readImageScaled(file: File, maxSide: number, quality = 0.85): Promise<string> {
  const original = await readFileAsDataUrl(file);
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const scaled = canvas.toDataURL('image/webp', quality);
    return scaled.startsWith('data:image/webp') && scaled.length < original.length ? scaled : original;
  } catch {
    return original;
  }
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------------------
// Sheet-style trackers, drawn like the printed M20 character sheet.

/** A row of dots, like Arete or permanent Willpower. Click a dot to set the rating; click the last filled dot to lower it by one. */
export function DotTrack({
  label,
  value,
  max = 10,
  min = 0,
  onChange,
  size = 'md',
}: {
  label: string;
  value: number;
  max?: number;
  min?: number;
  onChange?: (v: number) => void;
  size?: 'sm' | 'md';
}) {
  const d = size === 'sm' ? 'h-3 w-3' : 'h-[15px] w-[15px]';
  return (
    <div className="flex items-center gap-[3px]" role="group" aria-label={`${label}: ${value} of ${max}`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < value;
        const cls = `${d} rounded-full border-[1.5px] ${filled ? 'border-brass bg-brass' : 'border-muted/70'} ${onChange ? 'hover:border-brass-bright' : ''}`;
        return onChange ? (
          <button
            key={i}
            className={cls}
            onClick={() => onChange(Math.max(min, value === i + 1 ? i : i + 1))}
            aria-label={`Set ${label} to ${value === i + 1 ? i : i + 1}`}
          />
        ) : (
          <span key={i} className={cls} />
        );
      })}
    </div>
  );
}

/** A row of boxes, like temporary Willpower. Boxes beyond `limit` are shown but can't be filled. */
export function BoxTrack({
  label,
  value,
  max = 10,
  limit = max,
  onChange,
  size = 'md',
}: {
  label: string;
  value: number;
  max?: number;
  limit?: number;
  onChange?: (v: number) => void;
  size?: 'sm' | 'md';
}) {
  const d = size === 'sm' ? 'h-3 w-3 text-[9px]' : 'h-[15px] w-[15px] text-[11px]';
  return (
    <div className="flex items-center gap-[3px]" role="group" aria-label={`${label}: ${value} of ${limit}`}>
      {Array.from({ length: max }, (_, i) => {
        const usable = i < limit;
        const filled = i < value;
        const cls = `grid ${d} place-items-center border-[1.5px] font-bold leading-none ${usable ? 'border-muted/70' : 'border-line opacity-40'} ${
          filled ? 'border-brass text-brass-bright' : ''
        }`;
        return onChange && usable ? (
          <button key={i} className={`${cls} hover:border-brass-bright`} onClick={() => onChange(value === i + 1 ? i : i + 1)} aria-label={`Set ${label} to ${value === i + 1 ? i : i + 1}`}>
            {filled ? '✕' : ''}
          </button>
        ) : (
          <span key={i} className={cls}>
            {filled ? '✕' : ''}
          </span>
        );
      })}
    </div>
  );
}

/**
 * The Quintessence / Paradox wheel: twenty boxes round a circle. Quintessence fills clockwise from the
 * top, Paradox counter-clockwise. Pick which one you're marking in the middle, then click a box.
 */
export function QPWheel({
  quintessence,
  paradox,
  permanentParadox = 0,
  onChange,
  size = 132,
}: {
  quintessence: number;
  paradox: number;
  permanentParadox?: number;
  onChange?: (q: number, p: number) => void;
  size?: number;
}) {
  const [mode, setMode] = useState<'q' | 'p'>('q');
  const box = Math.max(10, Math.round(size / 11));
  const r = size / 2 - box / 2 - 1;
  const set = (i: number) => {
    if (!onChange) return;
    if (mode === 'q') {
      const want = quintessence === i + 1 ? i : i + 1;
      onChange(Math.min(want, WHEEL_SIZE - paradox), paradox);
    } else {
      const j = WHEEL_SIZE - 1 - i;
      const want = Math.max(permanentParadox, paradox === j + 1 ? j : j + 1);
      // Paradox pushes Quintessence off the wheel.
      onChange(Math.min(quintessence, WHEEL_SIZE - want), want);
    }
  };
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="group" aria-label={`Quintessence ${quintessence}, Paradox ${paradox}`}>
      {Array.from({ length: WHEEL_SIZE }, (_, i) => {
        const a = -Math.PI / 2 + (i / WHEEL_SIZE) * Math.PI * 2;
        const x = size / 2 + Math.cos(a) * r - box / 2;
        const y = size / 2 + Math.sin(a) * r - box / 2;
        const fromEnd = WHEEL_SIZE - 1 - i;
        const q = i < quintessence;
        const p = !q && fromEnd < paradox;
        const perm = p && fromEnd < permanentParadox;
        const cls = `absolute grid place-items-center border-[1.5px] text-[9px] font-bold leading-none ${
          q ? 'border-quint bg-quint/80' : p ? `border-paradox text-paradox ${perm ? 'bg-paradox/70 text-ink' : ''}` : 'border-muted/70'
        }`;
        const style = { left: x, top: y, width: box, height: box };
        return onChange ? (
          <button
            key={i}
            className={`${cls} hover:border-parchment`}
            style={style}
            onClick={() => set(i)}
            aria-label={mode === 'q' ? `Set Quintessence to ${quintessence === i + 1 ? i : i + 1}` : `Set Paradox to ${paradox === fromEnd + 1 ? fromEnd : fromEnd + 1}`}
          >
            {p ? '✕' : ''}
          </button>
        ) : (
          <span key={i} className={cls} style={style}>
            {p ? '✕' : ''}
          </span>
        );
      })}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center">
        <span className="font-mono text-xs leading-none">
          <span className="text-quint">{quintessence}</span>
          <span className="text-muted"> · </span>
          <span className="text-paradox">{paradox}</span>
        </span>
        {onChange && (
          <span className="pointer-events-auto flex overflow-hidden rounded border border-line text-[10px] leading-none">
            <button className={`px-1.5 py-0.5 ${mode === 'q' ? 'bg-quint/30 text-quint' : 'text-muted'}`} onClick={() => setMode('q')} aria-pressed={mode === 'q'} title="Mark Quintessence">
              Q
            </button>
            <button className={`px-1.5 py-0.5 ${mode === 'p' ? 'bg-paradox/30 text-paradox' : 'text-muted'}`} onClick={() => setMode('p')} aria-pressed={mode === 'p'} title="Mark Paradox">
              P
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

/** A small die icon button that opens the roller. */
export function DieButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="shrink-0 rounded p-0.5 text-muted hover:bg-raised hover:text-brass-bright" onClick={onClick} aria-label={label} title={label}>
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
        <rect x={1.5} y={1.5} width={13} height={13} rx={3} fill="none" stroke="currentColor" strokeWidth={1.4} />
        <circle cx={5.2} cy={5.2} r={1.2} fill="currentColor" />
        <circle cx={8} cy={8} r={1.2} fill="currentColor" />
        <circle cx={10.8} cy={10.8} r={1.2} fill="currentColor" />
      </svg>
    </button>
  );
}
