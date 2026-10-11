# M20 Storyteller

A Storyteller's console for *Mage: The Ascension 20th Anniversary Edition*, built as a static web app for GitHub Pages. Works for any M20 chronicle.

## Features

- **Table** — M20 dice pools (1s cancel, botches, specialties, Willpower), magick (difficulty by Sphere and coincidental/vulgar, ±3 modifier cap, casting pool capped by Willpower), rituals as extended Arete rolls (pp. 540–541), automatic Paradox and backlash, party trackers, a roll log and a clock.
- **Characters** — full sheet editor with sheet-style Arete, Willpower and Quintessence/Paradox trackers, a pop-up roller with sensible Attribute + Ability defaults, Merits & Flaws, random Markov-chain names, and import from Obsidian Fantasy Statblocks notes.
- **Create** — guided character creation that follows the M20 process step by step, with live checks and a freebie budget.
- **Fortune** — a tarot reading that becomes a legal starting mage. Each card decides part of the character; suits and Major Arcana decide priorities. Two optional extra cards bring balanced Merits and Flaws. Deck art is drawn in SVG.
- **Grimoire** — 720 generated rotes in six styles, filterable by Sphere and by what a character can cast, plus a randomizer.
- **Exports** — Markdown (Obsidian statblock format, round-trips through the importer) and a printable two-page PDF sheet.
- **Player screen** — a second window for public rolls, handouts and a clock.
- **Rules search** — load markdown you own and search it locally.

## Privacy and content

There's no server: data lives in your browser (IndexedDB) until you export it. No rulebook text ships with the app; rules search only works on files you load yourself, and those never leave your browser. Merit and Flaw names and costs come from *M20: The Book of Secrets*; their one-line summaries, all card meanings, rote text and descriptions are original.

## Development

```bash
npm install
npm run dev       # http://localhost:5173/m20-storyteller/
npm test          # Vitest
npm run build     # type-check + production build → dist/
```

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Legal

<img src="public/darkpack-logo.png" alt="Dark Pack" width="96" align="left">

Made under Paradox Interactive's [Dark Pack Agreement](https://www.paradoxinteractive.com/games/world-of-darkness/community/dark-pack-agreement). Unofficial, free fan tool; not affiliated with Paradox Interactive or Onyx Path Publishing. Portions of the materials are the copyrights and trademarks of Paradox Interactive AB, and are used with permission. All rights reserved. For more information please visit worldofdarkness.com.
