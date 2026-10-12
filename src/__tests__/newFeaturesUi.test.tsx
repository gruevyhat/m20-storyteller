import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CharactersPage from '../pages/CharactersPage';
import Roller from '../components/Roller';
import VaultPage from '../pages/VaultPage';
import { ChronicleProvider, useChronicle } from '../store/chronicle';
import { blankCharacter } from '../model/types';
import { logXp } from '../model/experience';

vi.mock('idb-keyval', () => ({ get: vi.fn().mockResolvedValue(undefined), set: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../sync/channel', () => ({ openChannel: () => ({ post: () => {}, close: () => {} }) }));

let root: Root;
let host: HTMLDivElement;

const mage = (() => {
  const c = blankCharacter('pc');
  c.id = 'm1';
  c.name = 'Ines';
  c.arete = 3;
  c.affinity = 'Forces';
  c.spheres = { Forces: 2, Correspondence: 1 };
  return logXp(c, 20, 'Session 1', 1);
})();

let api: ReturnType<typeof useChronicle>;
function Harness() {
  api = useChronicle();
  const { dispatch, chronicle } = api;
  useEffect(() => {
    if (!chronicle.characters.length) dispatch({ type: 'addCharacters', characters: [mage] });
  }, [chronicle.characters.length, dispatch]);
  return null;
}

async function render(el: React.ReactNode, path = '/characters/m1') {
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ChronicleProvider>
          <Harness />
          {el}
        </ChronicleProvider>
      </MemoryRouter>,
    );
  });
}

const button = (text: string) => {
  const all = [...host.querySelectorAll<HTMLButtonElement>('button')];
  return all.find((b) => b.textContent?.trim() === text) ?? all.find((b) => b.textContent?.includes(text));
};
async function click(text: string) {
  const b = button(text);
  expect(b, text).toBeTruthy();
  await act(async () => b!.click());
}
async function select(label: string, value: string) {
  const s = host.querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`)!;
  expect(s, label).toBeTruthy();
  await act(async () => {
    s.value = value;
    s.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe('new sheet sections', () => {
  it('spends experience on the affinity Sphere, then undoes it', async () => {
    await render(<Routes><Route path="/characters/:id" element={<CharactersPage />} /></Routes>);
    expect(host.textContent).toContain('Experience');
    expect(host.textContent).toContain('Wonders');
    expect(host.textContent).toContain('20 available');
    await select('Trait to raise', 'sphere:Forces');
    await click('Spend 14');
    expect(api.chronicle.characters[0].spheres.Forces).toBe(3);
    expect(host.textContent).toContain('6 available');
    await act(async () => api.undo());
    expect(api.chronicle.characters[0].spheres.Forces).toBe(2);
    await click('Add a blank Wonder');
    expect(api.chronicle.characters[0].wonders).toHaveLength(1);
    await select('Wonder from the Vault', 'the-starwright-s-astrolabe');
    await act(async () => host.querySelector<HTMLButtonElement>('button[aria-label="Add the chosen Wonder"]')!.click());
    expect(api.chronicle.characters[0].wonders?.[1]).toMatchObject({ name: 'The Starwright’s Astrolabe', kind: 'Talisman', rating: 3, arete: 4 });
  });
});

describe('Effect planner in the roller', () => {
  it('sets Sphere and successes needed, and one cast undoes as one step', async () => {
    await render(<Roller />, '/table');
    await click('Magick');
    await select('Rolling for', 'm1');
    await click('Work out the Spheres and successes');
    const forces2 = host.querySelector<HTMLButtonElement>('button[aria-label="Set Forces used to 2"]')!;
    await act(async () => forces2.click());
    const feat = host.querySelector<HTMLSelectElement>('option[value="difficult"]')!.parentElement as HTMLSelectElement;
    await act(async () => {
      feat.value = 'difficult';
      feat.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await click('Use: Sphere 2, need 3');
    expect(host.textContent).toMatch(/roll\s*3\s*dice at\s*5, need\s*3/);
    const before = JSON.stringify(api.chronicle);
    await click('Cast');
    expect(api.chronicle.log).toHaveLength(1);
    await act(async () => api.undo());
    expect(JSON.stringify(api.chronicle)).toBe(before);
  });
});

describe('Vault page', () => {
  it('lists Wonders and lets a PC buy one with experience', async () => {
    await render(<Routes><Route path="/vault" element={<VaultPage />} /><Route path="/vault/:id" element={<VaultPage />} /></Routes>, '/vault');
    expect(host.textContent).toContain('Vault');
    expect(host.textContent).toContain('Lantern of the Small Hours');
    const link = [...host.querySelectorAll('a')].find((a) => a.textContent?.includes('Lantern of the Small Hours'))!;
    await act(async () => link.click());
    expect(host.textContent).toContain('History');
    const owner = host.querySelector<HTMLSelectElement>('select')!;
    await act(async () => {
      owner.value = 'm1';
      owner.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await click('Buy for 5 XP');
    const c = api.chronicle.characters[0];
    expect(c.wonders?.[0]).toMatchObject({ name: 'Lantern of the Small Hours', kind: 'Talisman', arete: 2, quintessence: 5 });
    expect(c.experience?.log.at(-1)).toMatchObject({ xp: -5, note: 'Wonder: Lantern of the Small Hours' });
    expect(host.textContent).toContain('bought it for 5 XP');
  });
});

describe('Wonder Background on the sheet', () => {
  it('draws a matching Wonder when the Background is bought, and undo takes both back', async () => {
    await render(<Routes><Route path="/characters/:id" element={<CharactersPage />} /></Routes>);
    await select('New trait category', 'backgrounds');
    const name = host.querySelector<HTMLInputElement>('input[aria-label="New trait name"]')!;
    await act(async () => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      set.call(name, 'Wonder');
      name.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await click('Learn (3 XP)');
    const c = api.chronicle.characters[0];
    expect(c.abilities.backgrounds).toEqual([{ name: 'Wonder', rating: 1 }]);
    expect(c.wonders?.filter((w) => w.fromBackground).map((w) => w.rating)).toEqual([1]);
    expect(host.textContent).toContain('Draw another');
    await act(async () => api.undo());
    expect(api.chronicle.characters[0].wonders ?? []).toEqual([]);
  });
});
