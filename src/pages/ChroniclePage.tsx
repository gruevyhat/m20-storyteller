import { useState } from 'react';
import { Field } from '../components/ui';
import darkPackLogo from '../assets/darkpack-logo.png';
import { blankChronicle } from '../model/types';
import { exportChronicle, parseChronicle, useChronicle } from '../store/chronicle';

export default function ChroniclePage() {
  const { chronicle, dispatch } = useChronicle();
  const [message, setMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  async function onImport(file: File | undefined) {
    if (!file) return;
    try {
      const c = parseChronicle(await file.text());
      dispatch({ type: 'load', chronicle: c });
      setMessage(`Loaded ${c.name}: ${c.characters.length} characters, ${c.handouts.length} handouts.`);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <section className="panel flex flex-col gap-3">
        <h2 className="h-section">Chronicle</h2>
        <Field label="Name">
          <input value={chronicle.name} onChange={(e) => dispatch({ type: 'rename', name: e.target.value })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Era">
            <input value={chronicle.settings.era} placeholder="e.g. October 1990" onChange={(e) => dispatch({ type: 'settings', settings: { era: e.target.value } })} />
          </Field>
          <Field label="Place">
            <input value={chronicle.settings.place} placeholder="e.g. Edinburgh, Prague, Palo Alto" onChange={(e) => dispatch({ type: 'settings', settings: { place: e.target.value } })} />
          </Field>
        </div>
        <Field label="Storyteller notes">
          <textarea rows={6} value={chronicle.settings.notes} onChange={(e) => dispatch({ type: 'settings', settings: { notes: e.target.value } })} />
        </Field>
      </section>

      <section className="panel flex flex-col gap-3">
        <h2 className="h-section">Save & load</h2>
        <p className="text-sm text-muted">
          The chronicle saves automatically in this browser. Export it to back it up, move it to another computer, or keep it in git next to your notes.
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => exportChronicle(chronicle)}>
            Export chronicle
          </button>
          <label className="btn cursor-pointer">
            Import chronicle…
            <input type="file" accept=".json" className="sr-only" onChange={(e) => onImport(e.target.files?.[0])} />
          </label>
          {confirmReset ? (
            <span className="flex items-center gap-2 text-sm">
              Replace everything with an empty chronicle?
              <button
                className="btn border-wound text-wound"
                onClick={() => {
                  dispatch({ type: 'load', chronicle: blankChronicle() });
                  setConfirmReset(false);
                  setMessage('Started a new chronicle.');
                }}
              >
                Start over
              </button>
              <button className="btn" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
            </span>
          ) : (
            <button className="btn-ghost" onClick={() => setConfirmReset(true)}>
              New chronicle…
            </button>
          )}
        </div>
        {message && <p className="text-sm text-brass">{message}</p>}
      </section>

      <section className="panel flex flex-col gap-2 text-sm text-muted lg:col-span-2">
        <h2 className="h-section text-parchment">About</h2>
        <p>
          An unofficial, free fan tool for running Mage: The Ascension 20th Anniversary Edition. It contains no rulebook text; rules search works only on files you load
          yourself, and they stay in your browser.
        </p>
        <div className="flex items-center gap-3">
          <img src={darkPackLogo} alt="Dark Pack" className="h-16 w-16 shrink-0" />
          <p>
            Made under Paradox Interactive's Dark Pack Agreement. Portions of the materials are the copyrights and trademarks of Paradox Interactive AB, and are used
            with permission. All rights reserved. For more information please visit worldofdarkness.com.
          </p>
        </div>
        <p>Page references are to the M20 core rulebook (Onyx Path, 2015).</p>
      </section>
    </div>
  );
}
