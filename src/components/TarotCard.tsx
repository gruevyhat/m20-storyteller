// Card faces drawn as SVG: no image assets, works offline. The look is Clive Barker's flesh and gilt —
// vellum faces scarred with script, stitched seams, surgical steel — rather than stars and sigils.
import { useId, type ReactNode } from 'react';
import type { Card, Suit } from '../fortune/deck';
import { rankLabel } from '../fortune/deck';
import { rngFromSeed } from '../fortune/random';

const BLOOD = '#7a1714';
const CLOT = '#2a0b0a';
const SINEW = '#5a1a16';
const BONE = '#e9dcc3';
const STEEL = '#b9b4ab';
const GILT = '#b8913f';
const SERIF = 'Cormorant Garamond, Georgia, serif';
const LINING = { fontVariantNumeric: 'lining-nums' } as const;

// ---------------------------------------------------------------------------
// Suit emblems, centred on 0,0 within roughly ±34.

function Heart() {
  return (
    <g strokeLinecap="round">
      <path d="M-3 -16 C-6 -24 -4 -30 1 -33" stroke={BLOOD} strokeWidth={5} fill="none" />
      <path d="M5 -15 C9 -22 15 -24 18 -20" stroke={SINEW} strokeWidth={4} fill="none" />
      <path d="M-9 -12 C-13 -18 -17 -18 -19 -15" stroke={SINEW} strokeWidth={3} fill="none" />
      <path d="M-6 -15 C-21 -16 -24 4 -10 18 C-3 25 4 24 9 16 C21 1 16 -16 4 -15 C1 -13 -2 -13 -6 -15Z" fill={BLOOD} stroke={CLOT} strokeWidth={1.4} />
      <path d="M-4 -9 C-8 -1 -6 8 0 16 M6 -10 C10 -4 10 4 6 10" stroke={CLOT} strokeWidth={0.9} fill="none" opacity={0.7} />
      <path d="M-12 -6 C-14 0 -13 6 -10 10" stroke={BONE} strokeWidth={1} fill="none" opacity={0.35} />
    </g>
  );
}

function star(r: number) {
  const pts = Array.from({ length: 5 }, (_, i) => {
    const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5;
    return `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
  });
  return `M${pts.join(' L')}Z`;
}

/** Pentacles: a gilt coin with a knot woven through it, like a figure in a carpet. */
function WovenCoin() {
  const knot = star(14);
  return (
    <g>
      <circle r={21} fill={GILT} stroke={CLOT} strokeWidth={1.3} />
      <circle r={17.5} fill="#8a6a2a" stroke={CLOT} strokeWidth={0.8} />
      <path d={knot} fill="none" stroke={CLOT} strokeWidth={3.6} strokeLinejoin="round" />
      <path d={knot} fill="none" stroke="#f1d98c" strokeWidth={1.5} strokeLinejoin="round" />
      {/* Over-under breaks so the band reads as woven */}
      {Array.from({ length: 5 }, (_, i) => {
        const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 5 + Math.PI / 5;
        const x = Math.cos(ang) * 5.4;
        const y = Math.sin(ang) * 5.4;
        return <circle key={i} cx={x} cy={y} r={1.6} fill="#8a6a2a" />;
      })}
      {Array.from({ length: 16 }, (_, i) => {
        const ang = (i / 16) * Math.PI * 2;
        return (
          <path
            key={i}
            d={`M${(Math.cos(ang) * 19).toFixed(1)} ${(Math.sin(ang) * 19).toFixed(1)} L${(Math.cos(ang) * 22.6).toFixed(1)} ${(Math.sin(ang) * 22.6).toFixed(1)}`}
            stroke={CLOT}
            strokeWidth={0.9}
          />
        );
      })}
    </g>
  );
}

/** Wands: a carved bone wand, tapering to a bleeding point, bound in wire and crowned with a flame. */
function BoneWand() {
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      {/* Shaft */}
      <path d="M-3.6 -23 C-3.8 -4 -2.8 16 0 31 C2.8 16 3.8 -4 3.6 -23Z" fill={BONE} stroke={CLOT} strokeWidth={1.2} />
      <path d="M-0.8 -20 C-1.2 -6 -0.8 10 0 24" stroke={SINEW} strokeWidth={0.6} fill="none" opacity={0.45} />
      {/* Spiral binding: front turns solid, back turns faint */}
      {[-15, -10.5, -6, -1.5].map((y) => (
        <g key={y}>
          <path d={`M3 ${y - 2.2} C1 ${y - 3.4} -1 ${y - 3.4} -3 ${y - 2}`} stroke="#6f6a62" strokeWidth={0.7} fill="none" opacity={0.45} />
          <path d={`M-3.1 ${y} C-1 ${y + 0.6} 1 ${y - 0.8} 3.1 ${y - 2.2}`} stroke="#8c877e" strokeWidth={1.3} fill="none" />
        </g>
      ))}
      {/* Gilt collars */}
      <rect x={-4} y={-25.5} width={8} height={3} rx={1} fill={GILT} stroke={CLOT} strokeWidth={0.8} />
      <rect x={-3.6} y={3} width={7.2} height={2.2} rx={1} fill={GILT} stroke={CLOT} strokeWidth={0.7} />
      {/* Thorns */}
      <path d="M2.6 -19 C6 -20 8.5 -23 9.4 -26.5 C7.6 -22.5 5.4 -19.6 2.8 -16.8Z" fill={CLOT} />
      <path d="M-2.5 9 C-6 8.4 -8.4 6 -9.4 2.6 C-7.4 6.2 -5.2 8.6 -2.4 11.4Z" fill={CLOT} />
      <path d="M2.2 15 C4.8 14.6 6.6 13 7.4 10.6 C5.8 13.2 4.2 15 2 17.2Z" fill={CLOT} />
      {/* Flame finial */}
      <path d="M0 -40 C4.6 -35.5 5.6 -31 3.4 -27.6 C2 -25.6 -2 -25.6 -3.4 -27.6 C-5.6 -31 -4.6 -35.5 0 -40Z" fill={BLOOD} stroke={GILT} strokeWidth={1.1} />
      <path d="M0 -35.5 C1.8 -33 1.8 -30.4 0 -28.6 C-1.4 -30.2 -1.2 -33 0 -35.5Z" fill="#e8b04a" opacity={0.85} />
      {/* The point bleeds */}
      <path d="M0 31 C0.8 33 0.9 34.5 0 36" stroke={BLOOD} strokeWidth={1.3} fill="none" />
      <circle cx={0} cy={37.6} r={1.5} fill={BLOOD} />
    </g>
  );
}

/** Swords: a long blade, pitted with rust, its edge wet. */
function Sword() {
  return (
    <g strokeLinejoin="round">
      <path d="M0 -38 L4 -30 V12 H-4 V-30Z" fill={STEEL} stroke={CLOT} strokeWidth={1.1} />
      <path d="M0 -32 V10" stroke="#8a857c" strokeWidth={1} />
      {[
        [-1.6, -18, 1.8],
        [1.5, -4, 1.3],
        [-1, 5, 1.1],
      ].map(([x, y, r]) => (
        <circle key={y} cx={x} cy={y} r={r} fill="#7a3b1e" opacity={0.65} />
      ))}
      <path d="M4 -30 V-14" stroke={BLOOD} strokeWidth={1.4} />
      <path d="M-13 12 C-13 9 -10 9 -9 11 H9 C10 9 13 9 13 12 C13 15 10 15 9 13 H-9 C-10 15 -13 15 -13 12Z" fill={GILT} stroke={CLOT} strokeWidth={1} />
      <rect x={-2.4} y={14} width={4.8} height={13} fill={SINEW} stroke={CLOT} strokeWidth={0.9} />
      {[16.5, 19.5, 22.5, 25.5].map((y) => (
        <path key={y} d={`M-2.4 ${y} L2.4 ${y - 1.6}`} stroke={GILT} strokeWidth={0.6} />
      ))}
      <circle cx={0} cy={30} r={3.2} fill={GILT} stroke={CLOT} strokeWidth={1} />
    </g>
  );
}

function SuitEmblem({ suit }: { suit: Suit }) {
  if (suit === 'wands') return <BoneWand />;
  if (suit === 'cups') return <Heart />;
  if (suit === 'swords') return <Sword />;
  return <WovenCoin />;
}

// ---------------------------------------------------------------------------
// Major Arcana: one emblem each.

const stroke = { fill: 'none', stroke: CLOT, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function Eye({ sewn = false, open = 1 }: { sewn?: boolean; open?: number }) {
  const h = 12 * open;
  return (
    <g>
      <path d={`M-24 0 C-12 ${-h} 12 ${-h} 24 0 C12 ${h} -12 ${h} -24 0Z`} fill={BONE} stroke={CLOT} strokeWidth={1.6} />
      {!sewn && <circle r={7 * open + 1} fill={SINEW} stroke={CLOT} />}
      {!sewn && <circle r={2.6} fill={CLOT} />}
      {sewn && <path d="M-22 0 C-10 4 10 4 22 0" {...stroke} />}
      {sewn &&
        [-15, -7, 1, 9, 17].map((x) => <path key={x} d={`M${x - 2} -4 L${x + 2} 6`} stroke={CLOT} strokeWidth={1.2} />)}
      {[-18, -9, 0, 9, 18].map((x) => (
        <path key={x} d={`M${x} ${-h + 2} l${x / 6} -6`} stroke={CLOT} strokeWidth={1} opacity={0.8} />
      ))}
    </g>
  );
}

function Mouth({ sewn }: { sewn: boolean }) {
  return (
    <g>
      <path d="M-24 0 C-12 -12 12 -12 24 0 C12 14 -12 14 -24 0Z" fill={BLOOD} stroke={CLOT} strokeWidth={1.6} />
      {sewn ? (
        <>
          <path d="M-22 0 C-10 3 10 3 22 0" {...stroke} />
          {[-15, -8, -1, 6, 13].map((x) => (
            <path key={x} d={`M${x} -7 L${x + 3} 8`} stroke={BONE} strokeWidth={1.3} />
          ))}
        </>
      ) : (
        <>
          <path d="M-18 0 C-8 10 8 10 18 0 C8 -6 -8 -6 -18 0Z" fill={CLOT} />
          {[-10, -4, 2, 8].map((x) => (
            <rect key={x} x={x} y={-5} width={4} height={4} fill={BONE} />
          ))}
        </>
      )}
    </g>
  );
}

function Hand({ flip = false, nail = true }: { flip?: boolean; nail?: boolean }) {
  return (
    <g transform={flip ? 'scale(-1 1)' : undefined}>
      <path
        d="M-10 26 L-12 4 C-14 -2 -18 -8 -20 -12 C-21 -15 -17 -16 -15 -13 L-10 -5 L-10 -26 C-10 -29 -6 -29 -6 -26 L-5 -8 L-4 -30 C-4 -33 0 -33 0 -30 L1 -8 L3 -27 C3 -30 7 -30 7 -27 L6 -6 L9 -21 C9 -24 13 -24 13 -21 L10 2 L8 26Z"
        fill={BONE}
        stroke={CLOT}
        strokeWidth={1.4}
      />
      {nail && (
        <>
          <circle cx={-1} cy={6} r={2.6} fill={CLOT} />
          <path d="M-1 8 c0 6 1 10 0 16" stroke={BLOOD} strokeWidth={1.8} fill="none" strokeLinecap="round" />
        </>
      )}
    </g>
  );
}

function Spine() {
  return (
    <g>
      {[-30, -20, -10, 0, 10, 20].map((y, i) => (
        <g key={y}>
          <path d={`M-9 ${y} C-14 ${y - 3} -14 ${y + 4} -9 ${y + 5} H9 C14 ${y + 4} 14 ${y - 3} 9 ${y}Z`} fill={BONE} stroke={CLOT} strokeWidth={1.2} />
          <path d={`M-5 ${y + 6} H5`} stroke={BLOOD} strokeWidth={2} opacity={i % 2 ? 0.8 : 0.5} />
        </g>
      ))}
      <path d="M0 26 C2 30 0 34 -2 36" stroke={BLOOD} strokeWidth={2} fill="none" strokeLinecap="round" />
    </g>
  );
}

function Ribcage() {
  return (
    <g {...stroke}>
      <path d="M0 -30 V26" stroke={CLOT} strokeWidth={4} />
      {[CLOT, BONE].map((color, layer) =>
        [-22, -12, -2, 8].map((y, i) => (
          <g key={`${layer}${y}`} stroke={color} strokeWidth={layer ? 2.4 : 4.4}>
            <path d={`M0 ${y} C-14 ${y - 2} -${24 - i * 2} ${y + 6} -${20 - i * 2} ${y + 16}`} />
            <path d={`M0 ${y} C14 ${y - 2} ${24 - i * 2} ${y + 6} ${20 - i * 2} ${y + 16}`} />
          </g>
        )),
      )}
      <circle cx={0} cy={0} r={6} fill={BLOOD} stroke={CLOT} strokeWidth={1.2} />
    </g>
  );
}

function Key() {
  return (
    <g>
      <circle cx={0} cy={-20} r={10} fill="none" stroke={GILT} strokeWidth={3} />
      <circle cx={0} cy={-20} r={4} fill={CLOT} />
      <path d="M0 -10 V26 M0 16 H8 M0 22 H6" stroke={GILT} strokeWidth={3} fill="none" />
      <path d="M-14 -2 L14 6" stroke={STEEL} strokeWidth={2} />
      <path d="M-4 1 c0 5 1 8 0 12" stroke={BLOOD} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </g>
  );
}

function Door({ torn = false }: { torn?: boolean }) {
  return (
    <g>
      <path d="M-18 30 V-20 C-18 -34 18 -34 18 -20 V30Z" fill={CLOT} stroke={SINEW} strokeWidth={1.6} />
      {torn ? (
        <path d="M-6 30 L-10 8 L-2 -6 L-8 -22 L2 -31 L6 -10 L-1 4 L8 30Z" fill="#f1e2c4" opacity={0.9} />
      ) : (
        <path d="M-2 -6 h4 v8 h-4z" fill={GILT} />
      )}
      {[-12, 12].map((x) => (
        <path key={x} d={`M${x} 32 v4`} stroke={BLOOD} strokeWidth={2} strokeLinecap="round" />
      ))}
    </g>
  );
}

function Moth() {
  return (
    <g stroke={CLOT} strokeWidth={1.2}>
      <path d="M0 -4 C-10 -26 -30 -24 -28 -8 C-26 4 -10 4 0 0Z" fill="#b7a58a" />
      <path d="M0 -4 C10 -26 30 -24 28 -8 C26 4 10 4 0 0Z" fill="#b7a58a" />
      <path d="M0 2 C-8 6 -20 18 -12 22 C-6 24 -2 12 0 6Z" fill="#9c8a70" />
      <path d="M0 2 C8 6 20 18 12 22 C6 24 2 12 0 6Z" fill="#9c8a70" />
      <circle cx={-16} cy={-12} r={4} fill={BONE} />
      <circle cx={16} cy={-12} r={4} fill={BONE} />
      <circle cx={-16} cy={-12} r={1.6} fill={CLOT} />
      <circle cx={16} cy={-12} r={1.6} fill={CLOT} />
      <path d="M0 -10 V18" strokeWidth={3} />
      <path d="M0 -10 C-3 -18 -7 -22 -10 -24 M0 -10 C3 -18 7 -22 10 -24" fill="none" />
    </g>
  );
}

function Vials() {
  return (
    <g>
      {[-10, 10].map((x, i) => (
        <g key={x} transform={`translate(${x} 0) rotate(${i ? 14 : -14})`}>
          <rect x={-5} y={-24} width={10} height={40} rx={5} fill="#f1e2c433" stroke={CLOT} strokeWidth={1.4} />
          <rect x={-4} y={-2 - i * 6} width={8} height={17 + i * 6} rx={4} fill={BLOOD} />
          <rect x={-6} y={-28} width={12} height={5} fill={SINEW} />
        </g>
      ))}
      <path d="M-4 -10 C0 -18 4 -18 6 -12" stroke={BLOOD} strokeWidth={1.6} fill="none" strokeDasharray="2 2" />
    </g>
  );
}

function Scales() {
  return (
    <g {...stroke}>
      <path d="M0 -30 V26 M-12 26 H12" strokeWidth={2.4} />
      <path d="M-24 -18 H24" strokeWidth={2.4} />
      <path d="M-24 -18 L-30 4 H-18Z M24 -18 L18 4 H30Z" strokeWidth={1.2} />
      <path d="M-30 4 C-30 10 -18 10 -18 4" fill={BLOOD} strokeWidth={1.2} />
      <path d="M18 4 C18 8 30 8 30 4" fill={BONE} strokeWidth={1.2} />
      <g transform="translate(0 -6) scale(0.62)">
        <Sword />
      </g>
    </g>
  );
}

function ScriptRing({ seed }: { seed: string }) {
  const rng = rngFromSeed(seed);
  const marks: string[] = [];
  for (let i = 0; i < 42; i++) {
    const a = (i / 42) * Math.PI * 2;
    const x = Math.cos(a) * 26;
    const y = Math.sin(a) * 26;
    marks.push(`M${(x - 1.5).toFixed(1)} ${(y - 2).toFixed(1)} l${(rng.next() * 3).toFixed(1)} ${(rng.next() * 4).toFixed(1)}`);
  }
  return (
    <g>
      <circle r={30} fill={BONE} stroke={CLOT} strokeWidth={1.4} />
      <circle r={20} fill={BLOOD} stroke={CLOT} strokeWidth={1.2} opacity={0.85} />
      <path d={marks.join(' ')} stroke={SINEW} strokeWidth={1.1} fill="none" strokeLinecap="round" />
      <circle r={7} fill={CLOT} />
    </g>
  );
}

function Flame({ scale = 1 }: { scale?: number }) {
  return (
    <g transform={`scale(${scale})`}>
      <path d="M0 -14 C5 -9 6 -4 3.6 -0.6 C2 1.4 -2 1.4 -3.6 -0.6 C-6 -4 -5 -9 0 -14Z" fill={BLOOD} stroke={GILT} strokeWidth={1} />
      <path d="M0 -9.5 C2 -7 2 -4.2 0 -2.4 C-1.6 -4 -1.4 -7 0 -9.5Z" fill="#e8b04a" />
    </g>
  );
}

/** Emperor: a crown of bone. */
function BoneCrown() {
  const spikes = [
    [-18, 16],
    [-9, 24],
    [0, 30],
    [9, 24],
    [18, 16],
  ];
  return (
    <g strokeLinejoin="round">
      {spikes.map(([x, h]) => (
        <g key={x}>
          <rect x={x - 2} y={10 - h} width={4} height={h} fill={BONE} stroke={CLOT} strokeWidth={1} />
          <circle cx={x - 1.8} cy={10 - h} r={2.4} fill={BONE} stroke={CLOT} strokeWidth={1} />
          <circle cx={x + 1.8} cy={10 - h} r={2.4} fill={BONE} stroke={CLOT} strokeWidth={1} />
        </g>
      ))}
      <path d="M-25 10 H25 V20 C12 23 -12 23 -25 20Z" fill={GILT} stroke={CLOT} strokeWidth={1.2} />
      {[-14, 0, 14].map((x) => (
        <circle key={x} cx={x} cy={15} r={2.4} fill={BLOOD} stroke={CLOT} strokeWidth={0.7} />
      ))}
    </g>
  );
}

/** Chariot and Devil: a carnival mask; the Devil's is pale, horned and sewn at the mouth. */
function Mask({ horned = false }: { horned?: boolean }) {
  const face = horned ? BONE : GILT;
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      {horned && (
        <>
          <path d="M-13 -16 C-22 -28 -17 -40 -6 -40 C-13 -34 -13 -27 -8 -18Z" fill={SINEW} stroke={CLOT} strokeWidth={1.1} />
          <path d="M13 -16 C22 -28 17 -40 6 -40 C13 -34 13 -27 8 -18Z" fill={SINEW} stroke={CLOT} strokeWidth={1.1} />
        </>
      )}
      <path d="M-23 -8 C-23 -24 23 -24 23 -8 C23 6 13 13 7 11 C3.5 10 2 5 0 5 C-2 5 -3.5 10 -7 11 C-13 13 -23 6 -23 -8Z" fill={face} stroke={CLOT} strokeWidth={1.3} />
      <path d="M-15 -14 C-11 -17 -6 -16 -3 -12 M15 -14 C11 -17 6 -16 3 -12" stroke={CLOT} strokeWidth={1.2} fill="none" />
      <ellipse cx={-9} cy={-6} rx={5.4} ry={3.4} fill={CLOT} />
      <ellipse cx={9} cy={-6} rx={5.4} ry={3.4} fill={CLOT} />
      {horned ? (
        <>
          <circle cx={-9} cy={-6} r={1.4} fill={BLOOD} />
          <circle cx={9} cy={-6} r={1.4} fill={BLOOD} />
          <path d="M-10 20 C-4 23 4 23 10 20" stroke={CLOT} strokeWidth={1.3} fill="none" />
          {[-7, -3.5, 0, 3.5, 7].map((x) => (
            <path key={x} d={`M${x} 18.6 L${x + 0.8} 24`} stroke={CLOT} strokeWidth={0.9} />
          ))}
        </>
      ) : (
        <>
          <path d="M-20 -4 C-24 2 -28 6 -32 6 M20 -4 C24 2 28 6 32 6" stroke={BLOOD} strokeWidth={1.6} fill="none" />
          <path d="M-18 2 C-12 0 -8 4 -4 2 M18 2 C12 0 8 4 4 2" stroke={CLOT} strokeWidth={0.8} fill="none" opacity={0.7} />
        </>
      )}
    </g>
  );
}

/** Wheel of Fortune: a clock with one hour too many. */
function Clock25() {
  return (
    <g>
      <circle r={27} fill={BONE} stroke={CLOT} strokeWidth={1.5} />
      <circle r={23} fill="none" stroke={CLOT} strokeWidth={0.6} />
      {Array.from({ length: 25 }, (_, i) => {
        const ang = -Math.PI / 2 + (i / 25) * Math.PI * 2;
        const extra = i === 24;
        const r0 = extra ? 15 : 19.5;
        return (
          <path
            key={i}
            d={`M${(Math.cos(ang) * r0).toFixed(1)} ${(Math.sin(ang) * r0).toFixed(1)} L${(Math.cos(ang) * 23).toFixed(1)} ${(Math.sin(ang) * 23).toFixed(1)}`}
            stroke={extra ? BLOOD : CLOT}
            strokeWidth={extra ? 2.2 : i % 5 === 0 ? 1.6 : 0.8}
          />
        );
      })}
      <path d="M0 0 L-1.6 -15 L0 -17 L1.6 -15Z" fill={CLOT} transform="rotate(-14)" />
      <path d="M0 0 L-1.2 -10 L0 -12 L1.2 -10Z" fill={CLOT} transform="rotate(130)" />
      <circle r={3} fill={GILT} stroke={CLOT} />
    </g>
  );
}

/** Hanged Man: a cocoon hanging by a thread, something shifting inside. */
function Cocoon() {
  return (
    <g strokeLinecap="round">
      <path d="M0 -40 V-22" stroke={CLOT} strokeWidth={1} />
      <path d="M0 -22 C10 -18 12 6 6 20 C3 26 -3 26 -6 20 C-12 6 -10 -18 0 -22Z" fill="#d9c9a8" stroke={CLOT} strokeWidth={1.3} />
      {[-14, -8, -2, 4, 10, 16].map((y, i) => (
        <path key={y} d={`M${-9 + Math.abs(y) / 6} ${y} C-3 ${y + 3} 3 ${y - 1} ${9 - Math.abs(y) / 6} ${y + 2}`} stroke={CLOT} strokeWidth={0.7} fill="none" opacity={0.55 + (i % 2) * 0.2} />
      ))}
      <path d="M-2 -6 C-4 -2 -3 4 0 6 C3 4 4 -2 2 -6 C1 -8 -1 -8 -2 -6Z" fill={SINEW} opacity={0.35} />
      <path d="M0 25 C0.6 28 0.6 30 0 32" stroke={BLOOD} strokeWidth={1.4} />
      <circle cx={0} cy={33.4} r={1.4} fill={BLOOD} />
    </g>
  );
}

/** Star: a seven-pointed star stitched into skin. */
function StitchedStar() {
  const pts = Array.from({ length: 14 }, (_, i) => {
    const ang = -Math.PI / 2 + (i * Math.PI) / 7;
    const r = i % 2 ? 12 : 29;
    return `${(Math.cos(ang) * r).toFixed(1)} ${(Math.sin(ang) * r).toFixed(1)}`;
  });
  const d = `M${pts.join(' L')}Z`;
  return (
    <g strokeLinejoin="round">
      <path d={d} fill={BLOOD} fillOpacity={0.12} stroke={BLOOD} strokeWidth={1.2} />
      <path d={d} fill="none" stroke={CLOT} strokeWidth={4.4} strokeDasharray="0.9 3.4" />
      <circle r={3.6} fill={BLOOD} stroke={CLOT} strokeWidth={0.8} />
    </g>
  );
}

function SunEye() {
  return (
    <g>
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} d={`M0 -26 L0 ${i % 2 ? -32 : -38}`} transform={`rotate(${i * 22.5})`} stroke={GILT} strokeWidth={i % 2 ? 1.4 : 2.2} strokeLinecap="round" />
      ))}
      <Eye />
    </g>
  );
}

const MAJOR_EMBLEMS: (() => ReactNode)[] = [
  () => <Moth />, // Fool
  () => (
    <g>
      <g transform="translate(0 8)">
        <Hand nail={false} />
      </g>
      <g transform="translate(0 4)">
        <Flame scale={1.3} />
      </g>
    </g>
  ), // Magician
  () => <Mouth sewn />, // High Priestess
  () => <Heart />, // Empress
  () => <BoneCrown />, // Emperor
  () => <Key />, // Hierophant
  () => (
    <g>
      <g transform="translate(-8 0) rotate(-10)">
        <Hand nail={false} />
      </g>
      <g transform="translate(8 0) rotate(10)">
        <Hand flip nail={false} />
      </g>
      <path d="M-4 0 H4 M-4 6 H4 M-4 12 H4" stroke={BLOOD} strokeWidth={1.4} />
    </g>
  ), // Lovers
  () => <Mask />, // Chariot
  () => <Ribcage />, // Strength
  () => <Door />, // Hermit
  () => <Clock25 />, // Wheel of Fortune
  () => <Scales />, // Justice
  () => <Cocoon />, // Hanged Man
  () => <Spine />, // Death
  () => <Vials />, // Temperance
  () => <Mask horned />, // Devil
  () => <Door torn />, // Tower
  () => <StitchedStar />, // Star
  () => <Eye sewn open={0.7} />, // Moon
  () => <SunEye />, // Sun
  () => <Mouth sewn={false} />, // Judgement
  () => <ScriptRing seed="world" />, // World
];

// ---------------------------------------------------------------------------
// The face

/** Lines of scar-script down the margins: a different hand for every card. */
function ScarScript({ seed, x, y0, y1 }: { seed: string; x: number; y0: number; y1: number }) {
  const rng = rngFromSeed(seed);
  const d: string[] = [];
  for (let y = y0; y < y1; y += 4.2 + rng.next() * 1.6) {
    const n = 1 + rng.int(3);
    for (let k = 0; k < n; k++) {
      const dx = (rng.next() - 0.5) * 4;
      const dy = rng.next() * 3;
      d.push(`M${(x + (rng.next() - 0.5) * 2).toFixed(1)} ${(y + k).toFixed(1)} l${dx.toFixed(1)} ${dy.toFixed(1)}`);
    }
  }
  const path = d.join(' ');
  return (
    <g fill="none" strokeLinecap="round">
      <path d={path} stroke={SINEW} strokeWidth={1.1} opacity={0.55} />
      <path d={path} stroke="#f6ead4" strokeWidth={0.5} opacity={0.6} transform="translate(-0.4 -0.4)" />
    </g>
  );
}

function Veins({ seed }: { seed: string }) {
  const rng = rngFromSeed(`veins:${seed}`);
  const paths = Array.from({ length: 4 }, () => {
    let x = 14 + rng.next() * 92;
    let y = 12 + rng.next() * 30;
    let d = `M${x.toFixed(0)} ${y.toFixed(0)}`;
    for (let i = 0; i < 5; i++) {
      x += (rng.next() - 0.5) * 22;
      y += 14 + rng.next() * 14;
      d += ` Q${(x + (rng.next() - 0.5) * 10).toFixed(0)} ${(y - 8).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)}`;
    }
    return d;
  });
  return (
    <g fill="none" stroke="#7d3a33" strokeWidth={0.7} opacity={0.22}>
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
}

function Stitches({ inset, color, gap = 6 }: { inset: number; color: string; gap?: number }) {
  const w = 120 - inset * 2;
  const h = 200 - inset * 2;
  const ticks: string[] = [];
  for (let x = inset + 4; x < inset + w - 2; x += gap) ticks.push(`M${x} ${inset - 1.6} l1.6 3.2 M${x} ${inset + h - 1.6} l1.6 3.2`);
  for (let y = inset + 4; y < inset + h - 2; y += gap) ticks.push(`M${inset - 1.6} ${y} l3.2 1.6 M${inset + w - 1.6} ${y} l3.2 1.6`);
  return (
    <g>
      <rect x={inset} y={inset} width={w} height={h} rx={4} fill="none" stroke={color} strokeWidth={0.7} opacity={0.6} />
      <path d={ticks.join(' ')} stroke={color} strokeWidth={0.9} strokeLinecap="round" />
    </g>
  );
}

const COURT: Record<number, string> = { 11: 'PAGE', 12: 'KNIGHT', 13: 'QUEEN', 14: 'KING' };

export function CardFace({ card }: { card: Card }) {
  const id = useId().replace(/:/g, '');
  const words = card.name.split(' ');
  const mid = Math.ceil(words.length / 2);
  const lines = card.name.length > 15 ? [words.slice(0, mid).join(' '), words.slice(mid).join(' ')] : [card.name];
  return (
    <svg viewBox="0 0 120 200" className="h-full w-full" role="img" aria-label={card.name}>
      <defs>
        <radialGradient id={`skin-${id}`} cx="50%" cy="45%" r="75%">
          <stop offset="0%" stopColor="#ead6b8" />
          <stop offset="55%" stopColor="#cfae8a" />
          <stop offset="88%" stopColor="#8e5a44" />
          <stop offset="100%" stopColor="#4a1f19" />
        </radialGradient>
      </defs>
      <rect x={0.5} y={0.5} width={119} height={199} rx={7} fill={`url(#skin-${id})`} stroke={CLOT} />
      <Veins seed={card.id} />
      <ScarScript seed={`l:${card.id}`} x={11} y0={18} y1={150} />
      <ScarScript seed={`r:${card.id}`} x={109} y0={18} y1={150} />
      <Stitches inset={5} color={CLOT} />
      <text x={60} y={27} textAnchor="middle" fill={CLOT} fontFamily={SERIF} fontSize={17} fontWeight={700} letterSpacing={1} style={LINING}>
        {rankLabel(card)}
      </text>
      <g transform="translate(60 92)">
        {card.arcana === 'major' ? (
          <g transform="scale(1.22)">{MAJOR_EMBLEMS[card.rank]()}</g>
        ) : card.rank === 1 ? (
          <g transform="scale(1.35)">
            <SuitEmblem suit={card.suit!} />
          </g>
        ) : card.rank > 10 ? (
          <>
            <g transform="translate(0 -4) scale(1.05)">
              <SuitEmblem suit={card.suit!} />
            </g>
            {/* One gilt lozenge for a Page, up to four for a King */}
            {Array.from({ length: card.rank - 10 }, (_, i) => (
              <path key={i} d="M0 -3 L2.4 0 L0 3 L-2.4 0Z" transform={`translate(${(i - (card.rank - 11) / 2) * 8} 45)`} fill={GILT} stroke={CLOT} strokeWidth={0.7} />
            ))}
            <text y={57} textAnchor="middle" fill={CLOT} fontFamily={SERIF} fontSize={8} fontWeight={700} letterSpacing={3}>
              {COURT[card.rank]}
            </text>
          </>
        ) : (
          <Pips suit={card.suit!} n={card.rank} />
        )}
      </g>
      {/* The name on a stitched leather tag */}
      <g>
        <rect x={14} y={lines.length === 1 ? 162 : 156} width={92} height={lines.length === 1 ? 22 : 32} rx={2} fill={CLOT} />
        <rect x={16.5} y={lines.length === 1 ? 164.5 : 158.5} width={87} height={lines.length === 1 ? 17 : 27} rx={1.5} fill="none" stroke={BONE} strokeWidth={0.5} strokeDasharray="2 1.6" opacity={0.6} />
        {lines.map((l, i) => (
          <text key={i} x={60} y={lines.length === 1 ? 177 : 170 + i * 12} textAnchor="middle" fill={BONE} fontFamily={SERIF} fontSize={11.5} fontWeight={600} letterSpacing={0.6}>
            {l}
          </text>
        ))}
      </g>
    </svg>
  );
}

function Pips({ suit, n }: { suit: Suit; n: number }) {
  if (suit === 'wands') return <Bundles n={n} />;
  if (suit === 'swords') return <Fan n={n} />;
  const cols = n <= 3 ? 1 : 2;
  const rows = Math.ceil(n / cols);
  const span = 96;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols);
    const last = cols === 2 && i === n - 1 && n % 2 === 1;
    const x = cols === 1 || last ? 0 : i % 2 === 0 ? -20 : 20;
    pts.push([x, -span / 2 + ((r + 0.5) * span) / rows]);
  }
  const s = Math.min(0.55, 1.45 / rows);
  return (
    <>
      {pts.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <SuitEmblem suit={suit} />
        </g>
      ))}
    </>
  );
}

/** Wands: a sheaf of wands crossed and bound at the middle with a gilt band. */
function Bundles({ n }: { n: number }) {
  // Wands pivot on a binding low on the shaft, so the flames fan out above it.
  const spread = Math.min(112, 15 * (n - 1));
  const scale = n > 6 ? 0.78 : n > 3 ? 0.86 : 0.95;
  const pivot = 16;
  return (
    <g transform={`translate(0 ${4})`}>
      {Array.from({ length: n }, (_, i) => {
        const a = n === 1 ? 0 : -spread / 2 + (spread * i) / (n - 1);
        return (
          <g key={i} transform={`rotate(${a} 0 ${pivot}) scale(${scale})`}>
            <BoneWand />
          </g>
        );
      })}
      {n > 1 && (
        <g>
          <ellipse cx={0} cy={pivot} rx={3.5 + n * 0.5} ry={4.5} fill={GILT} stroke={CLOT} strokeWidth={1} />
          <path d={`M${-(2.5 + n * 0.5)} ${pivot - 1.5} H${2.5 + n * 0.5} M${-(2.5 + n * 0.5)} ${pivot + 1.5} H${2.5 + n * 0.5}`} stroke={CLOT} strokeWidth={0.6} opacity={0.6} />
        </g>
      )}
    </g>
  );
}

/** Swords: blades fanned from a single point, hilts together. */
function Fan({ n }: { n: number }) {
  const spread = Math.min(136, 22 * (n - 1));
  const scale = n > 6 ? 0.55 : n > 3 ? 0.62 : 0.72;
  // Hilts sit on a small arc so the blades open like a fan without piling up.
  const radius = 6 + n * 1.6;
  return (
    <g transform={`translate(0 ${n > 4 ? 34 : 30})`}>
      {Array.from({ length: n }, (_, i) => {
        const a = n === 1 ? 0 : -spread / 2 + (spread * i) / (n - 1);
        return (
          <g key={i} transform={`rotate(${a}) translate(0 ${-radius - 30 * scale}) scale(${scale})`}>
            <Sword />
          </g>
        );
      })}
    </g>
  );
}

export function CardBack() {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 120 200" className="h-full w-full" aria-hidden="true">
      <defs>
        <pattern id={`grain-${id}`} width={6} height={6} patternUnits="userSpaceOnUse">
          <circle cx={1} cy={1} r={0.5} fill="#000" opacity={0.35} />
          <circle cx={4} cy={3.5} r={0.4} fill="#6b2a22" opacity={0.4} />
        </pattern>
        <pattern id={`lattice-${id}`} width={10} height={14} patternUnits="userSpaceOnUse" x={10} y={11}>
          <path d="M5 0 L10 7 L5 14 L0 7Z" fill="none" stroke={GILT} strokeWidth={0.45} opacity={0.45} />
          <circle cx={5} cy={7} r={0.7} fill={GILT} opacity={0.5} />
        </pattern>
        <radialGradient id={`hide-${id}`} cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#4a1a15" />
          <stop offset="100%" stopColor="#1a0807" />
        </radialGradient>
      </defs>
      <rect x={0.5} y={0.5} width={119} height={199} rx={7} fill={`url(#hide-${id})`} stroke="#000" />
      <rect x={0.5} y={0.5} width={119} height={199} rx={7} fill={`url(#grain-${id})`} />
      <Stitches inset={6} color={BONE} gap={7} />
      {/* A gilt geometric field: diamond lattice, nested lozenges, rings and corner triangles */}
      <rect x={11} y={11} width={98} height={178} rx={3} fill={`url(#lattice-${id})`} />
      <rect x={11} y={11} width={98} height={178} rx={3} fill="none" stroke={GILT} strokeWidth={1.1} />
      <rect x={14.5} y={14.5} width={91} height={171} rx={2} fill="none" stroke={GILT} strokeWidth={0.5} />
      {[
        [14.5, 14.5, 1, 1],
        [105.5, 14.5, -1, 1],
        [14.5, 185.5, 1, -1],
        [105.5, 185.5, -1, -1],
      ].map(([x, y, sx, sy], i) => (
        <path key={i} d={`M${x} ${y} h${14 * sx} L${x} ${y + 14 * sy}Z`} fill={GILT} opacity={0.85} />
      ))}
      <g transform="translate(60 100)">
        {[44, 34, 24].map((r, i) => (
          <path key={r} d={`M0 ${-r * 1.35} L${r} 0 L0 ${r * 1.35} L${-r} 0Z`} fill={i === 2 ? '#2a0f0d' : 'none'} stroke={GILT} strokeWidth={i === 0 ? 1.3 : 0.8} />
        ))}
        <path d="M0 -59 V59 M-44 0 H44" stroke={GILT} strokeWidth={0.5} opacity={0.6} />
        <circle r={14} fill="none" stroke={GILT} strokeWidth={0.9} />
        <circle r={9} fill="#2a0f0d" stroke={GILT} strokeWidth={0.7} />
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d="M0 -9 L2.2 -14 L0 -19 L-2.2 -14Z" transform={`rotate(${i * 45})`} fill={GILT} />
        ))}
        <path d="M0 -5 L5 0 L0 5 L-5 0Z" fill={GILT} />
      </g>
    </svg>
  );
}
