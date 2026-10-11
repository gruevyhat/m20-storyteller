# Original Bestiary

All 72 bundled creature concepts, descriptions, stat blocks, attack profiles and special encounter rules were authored for M20 Storyteller. They replace the earlier book-derived catalog. They are homebrew suggestions, not official creatures or official game statistics. Names were not simply substituted onto the old templates.

The roster has eighteen entries in each of four categories. The last sixteen are a darker set, in the spirit of body horror and cosmic dread, with wholly original names and concepts:

- **Wildlife:** invented fauna such as the Cinder Skipper, Hushpelt Tracker and Rainspool Grazer.
- **Constructs:** machines and animated objects, including the Quarry Cradle, Foldpaper Bailiff and Waxkey Usher.
- **Aberrations:** unusual living phenomena such as the Windowreef, Pocket Orchard and Compass Leech.
- **Apparitions:** uncanny visitors with their own motives and interactions, including the Blue Hour Host and Unclaimed Applause.

Habitats replace the former book filter: City, Industrial, Thresholds, Underground, Waterways and Wilderness. Each entry has an appearance, encounter premise, attack guidance and a bounded special interaction. Creature-specific mechanics include triggers, durations, limits or ways to respond. The app does not automatically resolve them. Use your chronicle's normal combat rules for attack, damage and armor rolls.

## Data and NPC copies

`src/bestiary/creatures.json` is the complete authored catalog. It contains no book references, extracted source headings, copied stat blocks or imported power lists. The previous `stats.json` and `notes.ts` were removed.

- Rating ranges are authored variants. Adding an NPC chooses the lower or upper end of each range.
- Unlisted Social Attributes remain unset; the character sheet and exports display them as zero. NPCs have Arete 0, no Spheres and no mage resources.
- Each physical creature has its own health penalties. The final incapacitated state prevents ordinary wound-adjusted rolls.
- Unclaimed Applause, Static Saint and Noonstar Vigil are manifestations with no physical Attributes, Armor or health track. They remain reference-only.
- NPCs embed a copy of their illustration for offline use and JSON backups, and receive independent traits, health and Willpower, plus the original encounter rules, habitat and homebrew attribution in their notes.
- Existing NPCs already saved in a browser chronicle are independent user data. Replacing the bundled catalog does not rewrite or delete them.
- Markdown export/import preserves the custom tracks, high ratings, specialties and reference notes. JSON chronicle backups preserve the complete saved state.

## Illustrations

Every entry has its own 768 × 512 WebP illustration in `public/bestiary/`, used on both catalog cards and detail pages. Images were generated locally with the installed **mflux** implementation of **Z-Image Turbo**, using the cached `filipstrand/Z-Image-Turbo-mflux-4bit` checkpoint. No book artwork or reference images were supplied.

The prompts describe the new creatures in a shared ink-and-watercolor style. `scripts/bestiary-image-prompts.json` records each prompt and seed. `scripts/bestiary-image-manifest.json` records the actual model, steps, precision, seed, dimensions and prompt for each delivered image. The first illustration used nine steps; the remaining illustrations use four-step Turbo inference.

To resume or regenerate images, use the Python interpreter from the installed mflux environment:

```bash
/path/to/mflux/bin/python scripts/generate_bestiary_images.py --model-path /path/to/cached/model
# Optionally: --only cinder-skipper --replace
```

The renderer loads the model once, works offline, validates existing images before skipping them, and records each successful render. It requires local Metal GPU access. It does not install packages or download models. Prompts and output files stay within the project.

The catalog's original content does not change the project's existing World of Darkness/Dark Pack notices or imply that the underlying game system is owned by this project.
