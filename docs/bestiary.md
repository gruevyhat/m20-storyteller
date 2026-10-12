# Original Bestiary

All 108 bundled creature concepts, descriptions, stat blocks, attack profiles and special encounter rules were authored for M20 Storyteller. They replace the earlier book-derived catalog. They are homebrew suggestions, not official creatures or official game statistics. Names were not simply substituted onto the old templates.

The roster has eighteen entries in each of six categories. Sixteen of the first four categories are a darker set, in the spirit of body horror and cosmic dread, with wholly original names and concepts:

- **Wildlife:** invented fauna such as the Cinder Skipper, Hushpelt Tracker and Rainspool Grazer.
- **Constructs:** machines and animated objects, including the Quarry Cradle, Foldpaper Bailiff and Waxkey Usher.
- **Aberrations:** unusual living phenomena such as the Windowreef, Pocket Orchard and Compass Leech.
- **Apparitions:** uncanny visitors with their own motives and interactions, including the Blue Hour Host and Unclaimed Applause.
- **Otherworlders:** physical beings from realities beyond the consensus: severed pocket Realms, the Dream and Mirror Zones, Paradox bubbles, alternate timelines, the aether between the Horizons and the deep universe. Examples include the Cut-Off Chorister, Folded Surveyor and Second-Sun Envoy.
- **Umbrood:** native spirits of the Otherworlds, from Penumbral Glens and Blights to the High Umbra, the Digital Web, the edge of the realm of the dead and the Dream Zone, plus two original Paradox spirits. Examples include the Mossback Usher, Errata Clerk and Siege-Ox of the Spires.

The two newest categories took the setting's cosmology from the M20 core book and Gods & Monsters as inspiration only. No book creature, named Realm, deity or bespoke Charm was carried over.

Habitats replace the former book filter: City, Industrial, Thresholds, Underground, Waterways and Wilderness, plus Penumbra and Otherworlds for creatures usually met beyond the Gauntlet. Each entry has an appearance, encounter premise, attack guidance and a bounded special interaction. Creature-specific mechanics include triggers, durations, limits or ways to respond. The app does not automatically resolve them. Use your chronicle's normal combat rules for attack, damage and armor rolls.

## Creature distinctions

The [catalog review](bestiary-review.md) records the role and signature interaction of every entry, plus the nine revisions made to separate overlapping encounters. Shared basic attack pools or health tracks do not imply the same creature. The review compares concepts and player choices as well as names and text.

## Data and NPC copies

Every entry includes an Ecology section describing its food or other source of sustenance, habitat use, breeding or origin, and effects on its surroundings. These are original homebrew details. Ecology appears on the detail page, is included in catalog search, and is copied into new NPC notes and the `Ecology` reference field for JSON and Markdown backups. Previously saved NPCs remain independent copies.

`src/bestiary/creatures.json` is the complete authored catalog. It contains no book references, extracted source headings, copied stat blocks or imported power lists. The previous `stats.json` and `notes.ts` were removed.

- Rating ranges are authored variants. Adding an NPC chooses the lower or upper end of each range.
- Unlisted Social Attributes remain unset; the character sheet and exports display them as zero. NPCs have Arete 0, no Spheres and no mage resources.
- Each physical creature has its own health penalties. The final incapacitated state prevents ordinary wound-adjusted rolls.
- Unclaimed Applause, Static Saint, Noonstar Vigil and the Signal Mouth have no physical Attributes, Armor or health track. They remain reference-only.
- Umbrood carry M20 spirit traits: Rage, Gnosis, Essence and Charms drawn only from the core book's standard Charm list. Spirits that can Materialize have Physical Attributes and a health track, and use their Gnosis for Social and Mental Attributes, so they can be added as NPCs. The rest are reference-only. Spirit traits are copied into an added NPC's notes and its `Spirit traits` reference field.
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
