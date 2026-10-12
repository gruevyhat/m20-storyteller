// Export a character as an Obsidian note with an M20 Fantasy Statblocks block, the same format the
// importer reads, followed by readable sections for everything the statblock doesn't hold.
import { stringify } from 'yaml';
import { ATTRIBUTES, SPHERES, WHEEL_SIZE, type Character, type Trait } from '../model/types';
import { MF_SUMMARY } from '../fortune/meritsFlawsText';
import { xpTotals } from '../model/experience';

export function dots(rating: number, max = 5) {
  const n = Math.max(0, Math.min(max, rating));
  return '●'.repeat(n) + '○'.repeat(Math.max(0, max - n));
}

const traitDots = (t: Trait) => `${dots(t.rating, Math.max(5, t.rating))}${t.specialty ? ` (${t.specialty})` : ''}`;
const traitList = (ts: Trait[]) => ts.map((t) => `${t.name} ${traitDots(t)}`).join(', ');

export function healthTrack(c: Character) {
  // Collapse runs of the same level ("Bruised ×4").
  const out: string[] = [];
  const levels = c.health.levels;
  for (let i = 0; i < levels.length; ) {
    let j = i;
    while (j + 1 < levels.length && levels[j + 1].name === levels[i].name && levels[j + 1].penalty === levels[i].penalty) j++;
    const l = levels[i];
    const pen = l.penalty < 0 && l.penalty > -99 && l.name.replace('−', '-') !== String(l.penalty) ? ` −${-l.penalty}` : '';
    out.push(`${l.name}${j > i ? ` ×${j - i + 1}` : ''}${pen}`);
    i = j + 1;
  }
  return out.join(' · ');
}

export function toStatblock(c: Character): Record<string, unknown> {
  const block: Record<string, unknown> = { layout: 'M20 Mage', name: c.name || 'Unnamed' };
  const put = (k: string, v: unknown) => {
    if (v !== undefined && v !== '' && !(Array.isArray(v) && !v.length)) block[k] = v;
  };
  put('concept', c.concept);
  put('affiliation', c.affiliation);
  put('nature', c.nature);
  put('demeanor', c.demeanor);
  put('essence', c.essence);
  put('paradigm', c.paradigm);
  put('practice', c.practice);
  put('instruments', c.instruments);
  for (const g of ['physical', 'social', 'mental'] as const) put(g, ATTRIBUTES[g].map((n) => traitDots(c.attributes[n] ?? { name: n, rating: 0 })));
  put('talents', traitList(c.abilities.talents));
  put('skills', traitList(c.abilities.skills));
  put('knowledges', traitList(c.abilities.knowledges));
  put('backgrounds', traitList(c.abilities.backgrounds));
  put(
    'spheres',
    SPHERES.filter((s) => c.spheres[s])
      .map((s) => `${s} ${dots(c.spheres[s]!)}`)
      .join(', '),
  );
  put('affinity', c.affinity);
  put('resonance', (c.resonance ?? []).map((r) => `${r.kind[0].toUpperCase()}${r.kind.slice(1)} (${r.trait}) ${r.rating}`).join(', '));
  put('arete', c.arete);
  put('willpower', c.willpower.permanent);
  put('quintessence', `${c.quintessence}/${WHEEL_SIZE}`);
  put('paradox', `${c.paradox}/${WHEEL_SIZE}`);
  put('health', c.health.levels.length);
  put('health_track', healthTrack(c));
  const mf = c.meritsFlaws ?? [];
  put('merits', mf.filter((m) => m.kind === 'merit').map((m) => `${m.name} ${m.points}`).join(', '));
  put('flaws', mf.filter((m) => m.kind === 'flaw').map((m) => `${m.name} ${m.points}`).join(', '));
  put('rotes', c.rotes.map((r) => ({ name: r.name, desc: r.desc })));
  put('wonders', (c.wonders ?? []).map((w) => ({ ...w })));
  put('avatar_notes', c.avatar?.trim());
  if (c.experience?.log.length) {
    const xp = xpTotals(c);
    put('experience', `${xp.earned} earned, ${xp.spent} spent`);
  }
  for (const [k, v] of Object.entries(c.extra)) if (!(k in block) && !v.includes('\n')) put(k, v);
  return block;
}

export function characterMarkdown(c: Character) {
  const lines: string[] = [];
  lines.push('---', `tags: [m20, ${c.kind}]`, '---', '', `# ${c.name || 'Unnamed'}`, '');
  if (c.concept) lines.push(`*${c.concept}*`, '');
  lines.push('```statblock', stringify(toStatblock(c), { lineWidth: 0 }).trimEnd(), '```', '');
  if (c.willpower.temporary !== c.willpower.permanent || c.health.damage.length || c.permanentParadox) {
    lines.push('## Current state', '');
    lines.push(`- Willpower ${c.willpower.temporary}/${c.willpower.permanent}`);
    if (c.health.damage.length) lines.push(`- Damage: ${c.health.damage.join(' ')}`);
    if (c.permanentParadox) lines.push(`- Permanent Paradox: ${c.permanentParadox}`);
    lines.push('');
  }
  const mf = c.meritsFlaws ?? [];
  if (mf.length) {
    lines.push('## Merits & Flaws', '');
    for (const m of mf) lines.push(`- **${m.name}** (${m.points} pt. ${m.kind})${MF_SUMMARY[m.name] ? `: ${MF_SUMMARY[m.name]}` : ''}${m.note ? ` _${m.note}_` : ''}`);
    lines.push('');
  }
  if (c.flaws.length) lines.push('## Paradox Flaws', '', ...c.flaws.map((f) => `- ${f}`), '');
  if (c.experience?.log.length) {
    const xp = xpTotals(c);
    lines.push('## Experience', '', `${xp.available} available · ${xp.earned} earned · ${xp.spent} spent`, '');
    for (const e of c.experience.log) lines.push(`- ${e.xp > 0 ? '+' : ''}${e.xp} ${e.note}`);
    lines.push('');
  }
  if (c.notes.trim()) lines.push('## Notes', '', c.notes.trim(), '');
  for (const [k, v] of Object.entries(c.extra)) {
    if (v.includes('\n')) lines.push(`## ${k[0].toUpperCase()}${k.slice(1)}`, '', ...v.split('\n').map((l) => `- ${l}`), '');
  }
  return lines.join('\n');
}

export function fileSlug(c: Character) {
  return (c.name || 'character').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase() || 'character';
}

export function download(filename: string, data: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
