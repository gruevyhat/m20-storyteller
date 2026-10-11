import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BestiaryPage from '../pages/BestiaryPage';
import CharactersPage from '../pages/CharactersPage';
import { ChronicleProvider, useChronicle } from '../store/chronicle';
import { beastPortrait } from '../bestiary/portrait';

vi.mock('idb-keyval', () => ({ get: vi.fn().mockResolvedValue(undefined), set: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../sync/channel', () => ({ openChannel: () => ({ post: () => {}, close: () => {} }) }));
vi.mock('../bestiary/portrait', () => ({ beastPortrait: vi.fn().mockResolvedValue('data:image/webp;base64,dGVzdA==') }));

let root: Root;
let host: HTMLDivElement;

function ChronicleProbe() {
  const { chronicle } = useChronicle();
  return <output data-testid="chronicle">{JSON.stringify(chronicle.characters)}</output>;
}

async function render(path = '/bestiary') {
  await act(async () => {
    root.render(<MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><ChronicleProvider>
      <Routes><Route path="/bestiary" element={<BestiaryPage />} /><Route path="/bestiary/:id" element={<BestiaryPage />} /><Route path="/characters/:id" element={<CharactersPage />} /></Routes>
      <ChronicleProbe />
    </ChronicleProvider></MemoryRouter>);
  });
}

async function click(text: string) {
  const element = [...host.querySelectorAll<HTMLElement>('button, a')].find((el) => el.textContent?.includes(text));
  expect(element, text).toBeTruthy();
  await act(async () => element!.click());
}

beforeEach(() => {
  vi.mocked(beastPortrait).mockResolvedValue('data:image/webp;base64,dGVzdA==');
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

describe('Bestiary workflow', () => {
  it('browses a filtered result, adds upper-range NPC copies and retains filters on return', async () => {
    await render('/bestiary?q=hushpelt&category=Wildlife');
    expect(host.querySelector('[role="status"]')?.textContent).toBe('1 creature');
    await click('View stat block');
    expect(host.querySelector('h1')?.textContent).toBe('Hushpelt Tracker');
    expect(host.querySelector('[aria-labelledby="beast-ecology-heading"]')?.textContent).toContain('windthrown roots');
    const range = host.querySelector('select')!;
    await act(async () => { range.value = 'high'; range.dispatchEvent(new Event('change', { bubbles: true })); });
    await click('Add NPC to chronicle');
    expect(host.textContent).toContain('Added Hushpelt Tracker');
    const characters = () => JSON.parse(host.querySelector('[data-testid="chronicle"]')!.textContent!);
    expect(characters()[0].attributes.Strength.rating).toBe(4);
    expect(characters()[0].image).toBe('data:image/webp;base64,dGVzdA==');
    await click('Add another NPC');
    expect(characters()).toHaveLength(2);
    expect(characters()[0].id).not.toBe(characters()[1].id);
    expect(host.querySelector('a[href^="/characters/"]')).not.toBeNull();
    await click('Back to Bestiary');
    expect(host.querySelector<HTMLInputElement>('input[type="search"]')?.value).toBe('hushpelt');
    expect(host.querySelector('[role="status"]')?.textContent).toBe('1 creature');
  });

  it('handles empty filters and random picks from the filtered set', async () => {
    await render('/bestiary?q=hushpelt&habitat=City');
    expect(host.textContent).toContain('No creatures match');
    const random = [...host.querySelectorAll('button')].find((button) => button.textContent === 'Random creature')!;
    expect(random.disabled).toBe(true);
    await click('Clear filters');
    expect(host.querySelector('[role="status"]')?.textContent).toBe('72 creatures');
    expect(host.querySelectorAll('li')).toHaveLength(24);
    await click('Show 24 more');
    expect(host.querySelectorAll('li')).toHaveLength(48);
    await click('Random creature');
    expect(host.querySelector('article')).not.toBeNull();
  });

  it('shows a reference-only entity and an unknown-entry fallback', async () => {
    await render('/bestiary/unclaimed-applause');
    expect(host.textContent).toContain('No physical health track.');
    expect(host.querySelector('[aria-labelledby="beast-ecology-heading"]')?.textContent).toContain('Unclaimed Applause');
    expect(host.querySelector('button')).toBeNull();
    await act(async () => root.unmount());
    root = createRoot(host);
    await render('/bestiary/missing');
    expect(host.textContent).toContain('Creature not found');
    await click('Back to Bestiary');
    expect(host.querySelector('h1')?.textContent).toBe('Bestiary');
  });

  it('opens a high-rating creature on the real character sheet and rolls its actual pool', async () => {
    await render('/bestiary/quarry-cradle');
    await click('Add NPC to chronicle');
    await click('Open sheet');
    expect(host.querySelector<HTMLInputElement>('[aria-label="Strength rating"]')?.value).toBe('12');
    expect(host.querySelector<HTMLInputElement>('[aria-label="Stamina rating"]')?.value).toBe('11');
    const roll = host.querySelector<HTMLButtonElement>('[aria-label="Roll Strength"]')!;
    await act(async () => roll.click());
    expect(host.querySelector('[role="dialog"]')?.textContent).toContain('Roll 12 dice');
    await click('Roll 12 dice');
    expect(host.querySelectorAll('[role="dialog"] .die')).toHaveLength(12);
  });

  it('still adds a usable NPC if the portrait cannot load', async () => {
    vi.mocked(beastPortrait).mockRejectedValueOnce(new Error('Offline'));
    await render('/bestiary/cinder-skipper');
    await click('Add NPC to chronicle');
    expect(host.textContent).toContain('NPC added without its portrait');
    const saved = JSON.parse(host.querySelector('[data-testid="chronicle"]')!.textContent!);
    expect(saved).toHaveLength(1);
    expect(saved[0].name).toBe('Cinder Skipper');
    expect(saved[0].image).toBeUndefined();
  });
});
