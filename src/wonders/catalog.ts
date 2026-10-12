// The Vault catalog: lookup, filtering, and turning an entry into a sheet Wonder.
import { SPHERES, type Sphere, type Wonder } from '../model/types';
import { MYSTIC } from './mystic';
import { SMALL } from './small';
import { TECH } from './tech';
import { KIND_RULES, MODE_LABEL, highestRank, paradigmOf, type VaultKind, type WonderSource } from './types';

export interface VaultWonder extends WonderSource {
  id: string;
  paradigm: 'mystic' | 'tech' | 'either';
  spheres: Sphere[];
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const VAULT: VaultWonder[] = [...MYSTIC, ...TECH, ...SMALL]
  .map((w) => ({
    ...w,
    id: slug(w.name),
    paradigm: paradigmOf(w.kind),
    spheres: SPHERES.filter((s) => w.powers.some((p) => p.spheres[s])),
  }))
  .sort((a, b) => a.rating - b.rating || a.name.localeCompare(b.name));

export const VAULT_KINDS: VaultKind[] = ['Talisman', 'Device', 'Artifact', 'Invention', 'Fetish', 'Periapt', 'Matrix', 'Charm', 'Gadget', 'Trinket'];

export interface VaultFilter {
  query?: string;
  kind?: string;
  paradigm?: string;
  sphere?: string;
  maxRating?: number;
}

export function filterVault(f: VaultFilter): VaultWonder[] {
  const q = (f.query ?? '').trim().toLowerCase();
  return VAULT.filter((w) => {
    if (f.kind && w.kind !== f.kind) return false;
    if (f.paradigm && w.paradigm !== f.paradigm && w.paradigm !== 'either') return false;
    if (f.sphere && !w.spheres.includes(f.sphere as Sphere)) return false;
    if (f.maxRating && w.rating > f.maxRating) return false;
    if (q && !`${w.name} ${w.kind} ${w.look} ${w.origin} ${w.quirk} ${w.powers.map((p) => p.text).join(' ')}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

export const sphereText = (spheres: WonderSource['powers'][number]['spheres']) =>
  SPHERES.filter((s) => spheres[s])
    .map((s) => `${s} ${spheres[s]}`)
    .join(', ');

/** Cost line: points, and what they buy. */
export function costText(w: WonderSource) {
  const pts = `${w.points} pt.`;
  if (w.kind === 'Charm' || w.kind === 'Gadget') return `${pts} per batch of ten`;
  return pts;
}

/** The Wonder as it goes on a character sheet. */
export function toSheetWonder(w: WonderSource): Wonder {
  const stats = [
    w.gnosis ? `Gnosis ${w.gnosis} (${w.spirit})` : '',
    w.kind === 'Charm' || w.kind === 'Gadget' ? 'Ten uses' : '',
    MODE_LABEL[w.mode],
  ].filter(Boolean);
  const powers = w.powers.map((p) => `${sphereText(p.spheres)}: ${p.text}`);
  return {
    name: w.name,
    kind: w.kind,
    rating: w.rating,
    ...(w.arete !== undefined && { arete: w.arete }),
    ...(w.quintessence !== undefined && { quintessence: w.quintessence, quintessenceMax: w.quintessence }),
    powers: [...powers, KIND_RULES[w.kind], stats.join('. ') + '.', `Quirk: ${w.quirk}`].join('\n'),
  };
}

export { highestRank, KIND_RULES, MODE_LABEL };
