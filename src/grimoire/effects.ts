// Building blocks for generated rotes. Checked against the book: Sphere ranks (pp. 513–523); damage,
// healing and duration from the Base Damage or Duration chart, Magickal Damage types, the
// Correspondence connection table and the teleport chart (all p. 504). Per-rote numbers beyond those
// (weights lifted, Willpower difficulties, per-success penalties) are suggested homebrew.
import type { Sphere } from '../model/types';

export type Reqs = Partial<Record<Sphere, number>>;
export type Target = 'self' | 'other' | 'object' | 'place' | 'spirit';
export type Mode = 'coincidental' | 'vulgar' | 'either';

export interface Effect {
  id: string;
  spheres: Reqs;
  target: Target;
  /** Base successes for the standard result. */
  successes: number;
  mode: Mode;
  /** Neutral noun pool used in rote names. */
  nouns: string[];
  /** Verb phrase completing "the mage …". Third person, plural "they". */
  act: string;
  /** Rules text. Uses only M20 mechanics. */
  system: string;
  /** Damage-dealing effects (for "kind" filters and for modifiers that need a damage type). */
  harm?: boolean;
}

const DMG = 'Damage follows the Base Damage chart: nothing on one success, then about two health levels per success.';

export const EFFECTS: Effect[] = [
  // Correspondence
  { id: 'c-bearing', spheres: { Correspondence: 1 }, target: 'self', successes: 1, mode: 'coincidental', nouns: ['Compass', 'Bearing', 'Plumb-Line', 'Measure'], act: 'knows the exact distance and direction to anything they have touched today, and feels hollow walls and hidden rooms as pressure behind the eyes', system: 'Perception only; no roll needed beyond the Arete roll. Reveals concealed spaces within the immediate area.' },
  { id: 'c-window', spheres: { Correspondence: 2 }, target: 'place', successes: 2, mode: 'either', nouns: ['Window', 'Keyhole', 'Peephole', 'Far Eye'], act: 'sees and hears a distant place as though standing in it', system: 'Successes needed depend on connection: line of sight 1, very familiar 2, familiar 3, visited once 4, only described 5, anywhere 6+. Lasts a scene.' },
  { id: 'c-reach', spheres: { Correspondence: 2 }, target: 'object', successes: 2, mode: 'either', nouns: ['Long Hand', 'Reach', 'Ghost Grip', 'Pull'], act: 'reaches through space to touch, take or open something out of arm\'s reach', system: 'Range by connection, as for scrying. Fine manipulation only; force needs Forces.' },
  { id: 'c-gate', spheres: { Correspondence: 3 }, target: 'self', successes: 3, mode: 'vulgar', nouns: ['Door', 'Threshold', 'Passage', 'Fold'], act: 'steps through a doorway and out of another, somewhere else entirely', system: 'Teleport self. Successes by destination: within sight 1, very familiar 2, familiar or recently seen 3, visited briefly 4, described 5, blind 6+.' },
  { id: 'c-ward', spheres: { Correspondence: 4 }, target: 'place', successes: 3, mode: 'either', nouns: ['Seal', 'Ward', 'Closed Room', 'Lock'], act: 'seals a room against anything arriving or scrying through space', system: 'Each success subtracts one success from Correspondence Effects trying to enter or view the warded space. Lasts per the duration chart.' },
  { id: 'c-many', spheres: { Correspondence: 4 }, target: 'self', successes: 4, mode: 'vulgar', nouns: ['Echo', 'Twin', 'Second Place', 'Doubling'], act: 'stands in two places at once, fully present in both', system: 'Co-locate self in two locations; a third and further locations cost one more success each.' },
  { id: 'c-fold', spheres: { Correspondence: 5 }, target: 'place', successes: 5, mode: 'vulgar', nouns: ['Folded House', 'Wrong Room', 'Inner Hall', 'Labyrinth'], act: 'folds a building in on itself so its rooms connect in the wrong order', system: 'Spatial mutation of an area. Anyone trying to leave must roll Perception + Awareness (difficulty 8) per attempt. Lasts per the duration chart.' },

  // Entropy
  { id: 'e-flaw', spheres: { Entropy: 1 }, target: 'object', successes: 1, mode: 'coincidental', nouns: ['Flaw', 'Weak Seam', 'Crack', 'Tell'], act: 'sees the weak point in any lock, plan, body or argument', system: 'Each success lowers the difficulty of one mundane action exploiting that weakness by 1 (max −3).' },
  { id: 'e-nudge', spheres: { Entropy: 2 }, target: 'other', successes: 2, mode: 'coincidental', nouns: ['Nudge', 'Loaded Die', 'Bad Penny', 'Turn'], act: 'tilts the odds of a single chance event: a coin, a card, a ricochet, a stumble', system: 'Control probability: decide the outcome of one truly random event, or raise a target\'s next difficulty by 1 per success (max +3).' },
  { id: 'e-rot', spheres: { Entropy: 3 }, target: 'object', successes: 2, mode: 'coincidental', nouns: ['Rust', 'Rot', 'Age', 'Corrosion'], act: 'ages an object decades in moments; locks seize, guns jam, cables fray', system: 'Affects predictable patterns. One object per success beyond the first; a jammed weapon needs a Dexterity + Firearms roll (difficulty 8) to clear.' },
  { id: 'e-collapse', spheres: { Entropy: 3 }, target: 'place', successes: 3, mode: 'either', nouns: ['Fault', 'Fall', 'Cave-In', 'Last Straw'], act: 'finds the one flaw holding a structure up and lets it go', system: 'Collapse a wall, floor or stair. Anyone caught takes damage per the Base Damage chart (lethal); Dexterity + Athletics to avoid.', harm: true },
  { id: 'e-wither', spheres: { Entropy: 4 }, target: 'other', successes: 3, mode: 'vulgar', nouns: ['Withering', 'Blight', 'Long Decline', 'Grave-Touch'], act: 'lets a living body run down like a clock', system: `${DMG} Vulgar Entropy that disrupts a living Pattern does aggravated damage.`, harm: true },
  { id: 'e-forget', spheres: { Entropy: 5 }, target: 'other', successes: 4, mode: 'either', nouns: ['Forgetting', 'Erasure', 'Lost Word', 'Unthinking'], act: 'lets an idea in someone\'s mind fall apart until nothing remains', system: 'Affect thought: erode one belief, memory or oath. The target resists with Willpower (difficulty 8); each of their successes cancels one.' },

  // Forces
  { id: 'f-see', spheres: { Forces: 1 }, target: 'place', successes: 1, mode: 'coincidental', nouns: ['Current', 'Heat-Sight', 'Spark', 'Hum'], act: 'sees heat, current, radiation and sound as colours in the air', system: 'Perceive Forces in the area for a scene; spot live wires, body heat behind walls, hidden cameras.' },
  { id: 'f-dark', spheres: { Forces: 2 }, target: 'self', successes: 2, mode: 'either', nouns: ['Shadow', 'Blind Spot', 'Hush', 'Dimming'], act: 'bends light and sound away from themselves until they are a shadow among shadows', system: 'Each success adds +1 difficulty to Perception rolls to notice the mage (max +3). Coincidental in darkness or noise.' },
  { id: 'f-kill', spheres: { Forces: 2 }, target: 'object', successes: 2, mode: 'coincidental', nouns: ['Kill Switch', 'Brownout', 'Dead Line', 'Short'], act: 'kills the power to a device or a room, or wakes something long switched off', system: 'Redirect existing energy. One device per success, or a room\'s circuit on three.' },
  { id: 'f-burn', spheres: { Forces: 3 }, target: 'other', successes: 2, mode: 'vulgar', nouns: ['Burning', 'Arc', 'Brand', 'Live Wire'], act: 'turns the heat of a candle, a lighter or a socket into a lash of fire or current', system: `${DMG} Forces adds one automatic success to damage, and fire or electricity is aggravated. Needs an existing source; add Prime 2 to make it from nothing.`, harm: true },
  { id: 'f-shield', spheres: { Forces: 3 }, target: 'self', successes: 2, mode: 'either', nouns: ['Shield', 'Deflection', 'Glass Skin', 'Turning'], act: 'turns aside bullets and blows a heartbeat before they land', system: 'Each success subtracts one level from incoming physical or energy damage for a scene.' },
  { id: 'f-throw', spheres: { Forces: 3 }, target: 'object', successes: 2, mode: 'vulgar', nouns: ['Hurling', 'Unseen Hand', 'Push', 'Throw'], act: 'moves objects and bodies without touching them', system: 'Telekinesis: lift about 20 lb per success beyond the first, or strike for bashing damage per the Base Damage chart, plus one Forces success.', harm: true },
  { id: 'f-storm', spheres: { Forces: 4 }, target: 'place', successes: 5, mode: 'vulgar', nouns: ['Storm', 'Lightning Call', 'Squall', 'Thunderhead'], act: 'calls weather out of a clear sky and drops lightning where they please', system: `Control major Forces. ${DMG} Lightning adds one Forces success and is aggravated. Weather lasts per the duration chart.`, harm: true },
  { id: 'f-null', spheres: { Forces: 5 }, target: 'place', successes: 6, mode: 'vulgar', nouns: ['Blackout', 'Silence', 'Null', 'Still Air'], act: 'unmakes every light, sound and spark across a city block', system: 'Transmute major Forces into nothing. Lasts per the duration chart; huge Effects draw Paradox.' },

  // Life
  { id: 'l-read', spheres: { Life: 1 }, target: 'other', successes: 1, mode: 'coincidental', nouns: ['Pulse', 'Diagnosis', 'Bloodsign', 'Breath'], act: 'reads a body like a chart: injuries, sickness, pregnancy, a racing heart', system: 'Sense Life. +1 die to Medicine and to spotting lies by heartbeat for the scene.' },
  { id: 'l-mend', spheres: { Life: 2 }, target: 'self', successes: 2, mode: 'coincidental', nouns: ['Mending', 'Scar-Over', 'Knitting', 'Second Wind'], act: 'closes their own wounds', system: 'Heal self: health levels healed follow the Base Damage chart. Aggravated wounds need Life 3 and Prime 2.' },
  { id: 'l-mask', spheres: { Life: 3 }, target: 'self', successes: 2, mode: 'either', nouns: ['Mask', 'New Face', 'Skin-Change', 'Stranger'], act: 'reshapes their own face, voice and fingerprints into someone else\'s', system: 'Alter self. Lasts per the duration chart. Copying a specific person needs a body sample or long study.' },
  { id: 'l-heal', spheres: { Life: 3 }, target: 'other', successes: 2, mode: 'coincidental', nouns: ['Laying-On', 'Suture', 'Ward Round', 'Mercy'], act: 'heals someone else with their hands', system: 'Heal others per the Base Damage chart. Coincidental with medical cover (first aid, surgery, prayer at a bedside).' },
  { id: 'l-seize', spheres: { Life: 3 }, target: 'other', successes: 2, mode: 'vulgar', nouns: ['Seizure', 'Rictus', 'Cramp', 'Lock'], act: 'locks a body\'s muscles in place, or tears at it from inside', system: `Either paralyze the target for one turn per success (Stamina, difficulty 8, to resist), or wound them. ${DMG} The damage is lethal.`, harm: true },
  { id: 'l-graft', spheres: { Life: 4 }, target: 'other', successes: 4, mode: 'vulgar', nouns: ['Graft', 'Remaking', 'Flesh-Craft', 'Engraving'], act: 'reshapes another body: webbed hands, sealed lips, a second set of eyes', system: 'Alter complex life. Unwilling targets resist with Stamina (difficulty 8). Lasts per the duration chart.' },
  { id: 'l-beast', spheres: { Life: 4 }, target: 'self', successes: 4, mode: 'vulgar', nouns: ['Shedding', 'Moult', 'Becoming', 'Other Skin'], act: 'transforms their body into another living shape', system: 'Transform self into a living form of similar mass (more successes for very different sizes). Mind 1 keeps your thoughts your own.' },
  { id: 'l-create', spheres: { Life: 5, Prime: 2 }, target: 'place', successes: 8, mode: 'vulgar', nouns: ['Genesis', 'Homunculus', 'Firstborn', 'Brood'], act: 'grows a living creature, complete and breathing, from raw Quintessence', system: 'Create complex life. The creature has no mind of its own without Mind 5 or Spirit; it is loyal only as long as the Effect lasts.' },

  // Matter
  { id: 'm-know', spheres: { Matter: 1 }, target: 'object', successes: 1, mode: 'coincidental', nouns: ['Assay', 'Grain', 'Touchstone', 'Weight'], act: 'knows what anything is made of, where it came from and what is hidden inside it', system: 'Matter perception. Spot forgeries, poisons, hidden compartments and weak points in structures.' },
  { id: 'm-fit', spheres: { Matter: 2 }, target: 'object', successes: 2, mode: 'coincidental', nouns: ['Key', 'Fit', 'Temper', 'Edge'], act: 'reshapes a simple object: a key that fits, a blade that holds its edge, a bar that bends', system: 'Basic transmutation of a single homogeneous material.' },
  { id: 'm-wall', spheres: { Matter: 3 }, target: 'object', successes: 3, mode: 'vulgar', nouns: ['Opening', 'Passwall', 'Seamless Door', 'Breach'], act: 'reshapes a wall or a door so that there is a way through, or no way through', system: 'Alter form of complex objects. About one cubic yard per success beyond the first.' },
  { id: 'm-weld', spheres: { Matter: 3 }, target: 'object', successes: 2, mode: 'either', nouns: ['Weld', 'Seal', 'Rivet', 'Binding'], act: 'fuses metal to metal, door to frame, shackle to wrist', system: 'Fuse up to one object per success. Breaking it needs Strength rolls as for bending steel.' },
  { id: 'm-turn', spheres: { Matter: 4 }, target: 'object', successes: 3, mode: 'vulgar', nouns: ['Transmutation', 'Lead-Heart', 'Turning', 'Ash'], act: 'turns one substance into another: bullets to sand, glass to ice, chain to paper', system: 'Complex transmutation. Lasts per the duration chart.' },
  { id: 'm-law', spheres: { Matter: 5 }, target: 'object', successes: 5, mode: 'vulgar', nouns: ['New Law', 'Impossible Glass', 'Weightless Stone', 'Wrong Metal'], act: 'changes what a material is allowed to do: glass that will not break, stone that floats', system: 'Alter properties of matter. Lasts per the duration chart.' },

  // Mind
  { id: 'mi-clear', spheres: { Mind: 1 }, target: 'self', successes: 1, mode: 'coincidental', nouns: ['Clarity', 'Cold Focus', 'Still Point', 'Shield'], act: 'shuts out fear, fatigue and anything trying to get into their head', system: 'Mind shield: Mind Effects aimed at the mage are 1 harder per success for a scene, or one mental task gains a die.' },
  { id: 'mi-read', spheres: { Mind: 2 }, target: 'other', successes: 2, mode: 'coincidental', nouns: ['Reading', 'Surface', 'Tell', 'Murmur'], act: 'hears the loudest thoughts in the room and feels what everyone is feeling', system: 'Read surface thoughts and emotions for a scene. Willpower (difficulty 7) to hide a thought.' },
  { id: 'mi-whisper', spheres: { Mind: 2 }, target: 'other', successes: 2, mode: 'coincidental', nouns: ['Whisper', 'Impulse', 'Suggestion', 'Itch'], act: 'plants an impulse that feels like the target\'s own idea', system: 'Mental impulse: one simple action the target would plausibly take. Willpower (difficulty 7) resists.' },
  { id: 'mi-unseen', spheres: { Mind: 2 }, target: 'self', successes: 2, mode: 'coincidental', nouns: ['Unremarkable', 'Grey Coat', 'Passing', 'Background'], act: 'becomes someone people forget the moment they look away', system: 'Create impressions: +1 difficulty per success (max +3) to notice or remember the mage.' },
  { id: 'mi-link', spheres: { Mind: 3 }, target: 'other', successes: 2, mode: 'either', nouns: ['Line', 'Chorus', 'Party Line', 'Bridge'], act: 'opens a silent line between minds', system: 'Mental link with willing minds, one more per success beyond the first. Lasts per the duration chart.' },
  { id: 'mi-dread', spheres: { Mind: 3 }, target: 'other', successes: 3, mode: 'either', nouns: ['Dread', 'Nightmare', 'Night Terror', 'Black Dog'], act: 'shows someone the thing they are most afraid of, standing in the room', system: 'Project illusion or psychic blast. Willpower (difficulty 8) or flee; as an attack, damage per the chart is bashing.', harm: true },
  { id: 'mi-dream', spheres: { Mind: 3 }, target: 'other', successes: 3, mode: 'coincidental', nouns: ['Dreamwalk', 'Sleepwalk', 'Night Visit', 'Pillow'], act: 'walks into a sleeper\'s dream and talks to them there', system: 'Dreamwalk. The sleeper remembers it as a dream unless the mage wishes otherwise.' },
  { id: 'mi-puppet', spheres: { Mind: 4 }, target: 'other', successes: 4, mode: 'vulgar', nouns: ['Puppet', 'Strings', 'Rider', 'Leash'], act: 'takes the wheel of another person\'s body and mind', system: 'Control conscious mind for one turn per success (or a scene at 5+). Willpower (difficulty 8) each turn to break free.' },
  { id: 'mi-rewrite', spheres: { Mind: 4 }, target: 'other', successes: 3, mode: 'coincidental', nouns: ['Rewrite', 'Lost Hour', 'Edited Night', 'Palimpsest'], act: 'edits a stretch of someone\'s memory', system: 'Alter consciousness: rewrite up to an hour per success beyond the first.' },
  { id: 'mi-astral', spheres: { Mind: 4 }, target: 'self', successes: 3, mode: 'coincidental', nouns: ['Leaving', 'Silver Cord', 'Out-of-Body', 'Drift'], act: 'leaves their body behind and travels as pure thought', system: 'Astral projection. The body lies helpless and seems asleep.' },

  // Prime
  { id: 'p-taste', spheres: { Prime: 1 }, target: 'place', successes: 1, mode: 'coincidental', nouns: ['Taste', 'Hum of Power', 'Wellspring', 'Bloodhound'], act: 'tastes Quintessence in the air: Nodes, Tass, enchantments and magick recently worked', system: 'Etheric senses for a scene. Can sense Resonance and trace a recent Effect back toward its caster.' },
  { id: 'p-charge', spheres: { Prime: 2 }, target: 'object', successes: 2, mode: 'either', nouns: ['Charge', 'Anointing', 'Consecration', 'Edge of Light'], act: 'charges a weapon, a fist or a bullet with raw Quintessence', system: 'Spend one Quintessence: the weapon does aggravated damage and can strike spirits for the scene.' },
  { id: 'p-unravel', spheres: { Prime: 2 }, target: 'object', successes: 2, mode: 'coincidental', nouns: ['Unravelling', 'Counter', 'Unpicking', 'Null Point'], act: 'unpicks another mage\'s working', system: 'Countermagic: each success cancels one success of an opposing Effect (or unweaves a lasting one).' },
  { id: 'p-feed', spheres: { Prime: 3 }, target: 'place', successes: 2, mode: 'either', nouns: ['Feeding', 'Drawing', 'Siphon', 'Communion'], act: 'drinks Quintessence from a Node, a Tass or a willing donor', system: 'Channel Quintessence: points drawn follow the chart\'s damage column (two per success from the second).' },
  { id: 'p-burn', spheres: { Prime: 3 }, target: 'other', successes: 3, mode: 'vulgar', nouns: ['Unmaking', 'Pattern Burn', 'White Fire', 'Erasure'], act: 'burns at the target\'s Pattern itself', system: `Energy weapon. ${DMG} The damage is aggravated.`, harm: true },
  { id: 'p-infuse', spheres: { Prime: 4 }, target: 'object', successes: 4, mode: 'either', nouns: ['Reliquary', 'Battery', 'Heart-Stone', 'Talisman'], act: 'crafts a lasting Wonder or a store of Tass', system: 'Craft Tass or a permanent Wonder (with the Spheres of whatever it does). Usually worked as a ritual.' },

  // Spirit
  { id: 's-sight', spheres: { Spirit: 1 }, target: 'place', successes: 1, mode: 'coincidental', nouns: ['Other Sight', 'Veil-Look', 'Thin Place', 'Ghostlight'], act: 'sees the spirits in the room and how thin the Gauntlet is here', system: 'Spirit sight for a scene. Know the local Gauntlet rating.' },
  { id: 's-speak', spheres: { Spirit: 2 }, target: 'spirit', successes: 2, mode: 'coincidental', nouns: ['Séance', 'Last Words', 'Ghost Call', 'Party Line'], act: 'speaks with spirits and the restless dead across the Gauntlet', system: 'Touch spirit: talk and bargain with one spirit or shade per success beyond the first.' },
  { id: 's-ward', spheres: { Spirit: 2 }, target: 'place', successes: 2, mode: 'either', nouns: ['Salt Line', 'Ward', 'Exclusion', 'Threshold'], act: 'thickens the Gauntlet around a room so nothing comes through', system: 'Manipulate Gauntlet: +1 to its rating per success for the duration.' },
  { id: 's-step', spheres: { Spirit: 3 }, target: 'self', successes: 2, mode: 'vulgar', nouns: ['Stepping Sideways', 'Crossing', 'Penumbra', 'Mirror-Walk'], act: 'steps sideways into the spirit world', system: 'Pierce the Gauntlet. Difficulty is the local Gauntlet rating instead of the usual magick difficulty.' },
  { id: 's-call', spheres: { Spirit: 3 }, target: 'spirit', successes: 3, mode: 'either', nouns: ['Summons', 'Calling', 'Invitation', 'Lure'], act: 'calls a spirit across and wakes it enough to deal with', system: 'Rouse spirit; with Spirit 2 to speak, bargain for a service. Nothing compels it to agree.' },
  { id: 's-bind', spheres: { Spirit: 4 }, target: 'spirit', successes: 4, mode: 'vulgar', nouns: ['Binding', 'Jar', 'Fetish', 'Cage'], act: 'binds a spirit into an object, or drives one out of a person', system: 'Bind spirit or exorcise. The spirit resists with its Willpower; usually worked as a ritual.' },
  { id: 's-rend', spheres: { Spirit: 4 }, target: 'place', successes: 4, mode: 'vulgar', nouns: ['Tear', 'Wound in the World', 'Open Door', 'Rent'], act: 'tears a hole in the Gauntlet that anything can walk through', system: 'Rend Gauntlet for the duration. Things on the other side will notice.' },

  // Time
  { id: 't-clock', spheres: { Time: 1 }, target: 'self', successes: 1, mode: 'coincidental', nouns: ['Clockwork', 'Perfect Hour', 'Tick', 'Metronome'], act: 'always knows the exact time and feels where time is running wrong', system: 'Time sense. Detect temporal distortions and Time magick in the area.' },
  { id: 't-past', spheres: { Time: 2 }, target: 'place', successes: 2, mode: 'coincidental', nouns: ['Replay', 'Echo', 'Last Night', 'Afterimage'], act: 'watches what happened here, as it happened', system: 'Past sight. Reach back per the duration chart (one turn, a scene, a day, a story…).' },
  { id: 't-future', spheres: { Time: 2 }, target: 'self', successes: 2, mode: 'coincidental', nouns: ['Forecast', 'Omen', 'Next Move', 'Hunch'], act: 'glimpses the next few seconds a moment before they arrive', system: 'Future sight: +1 die per success (max +3) to initiative and dodging for a scene.' },
  { id: 't-quick', spheres: { Time: 3 }, target: 'self', successes: 3, mode: 'vulgar', nouns: ['Quickening', 'Slow World', 'Stolen Second', 'Overclock'], act: 'steps outside the flow of seconds and moves while everyone else crawls', system: 'Time dilation: one extra action per success beyond the first, for one turn per success.' },
  { id: 't-slow', spheres: { Time: 3 }, target: 'other', successes: 3, mode: 'vulgar', nouns: ['Molasses', 'Long Second', 'Drag', 'Undertow'], act: 'drags someone else\'s seconds out like taffy', system: 'Target loses one action per success beyond the first, for one turn per success.' },
  { id: 't-bubble', spheres: { Time: 4 }, target: 'place', successes: 4, mode: 'vulgar', nouns: ['Stasis', 'Amber', 'Frozen Hour', 'Specimen Jar'], act: 'freezes a person, an object or a room in a single unending instant', system: 'Time bubble. Lasts per the duration chart; nothing inside ages or acts.' },
  { id: 't-travel', spheres: { Time: 5, Correspondence: 2 }, target: 'self', successes: 10, mode: 'vulgar', nouns: ['Return', 'Rewind', 'Long Way Round', 'Second Draft'], act: 'goes back, briefly, to a moment already lived', system: 'Temporal travel. Enormous successes and Paradox; the Storyteller decides what may change.' },

  // Conjunctional
  { id: 'x-wires', spheres: { Mind: 3, Correspondence: 2, Forces: 2 }, target: 'self', successes: 3, mode: 'either', nouns: ['Ghost in the Line', 'Dial Tone', 'Static', 'Carrier Wave'], act: 'pours their mind into a telephone line and comes out of any speaker on the network', system: 'Perceive and speak through any connected device within range by connection.' },
  { id: 'x-script', spheres: { Life: 3, Mind: 2 }, target: 'other', successes: 3, mode: 'vulgar', nouns: ['Body-Book', 'Scar-Script', 'Written Skin', 'Testament'], act: 'writes a message into living skin as raised scars that only the intended reader understands', system: 'Damage per the chart (lethal, healing at once into scar), or no damage at two successes for a short message.', harm: true },
  { id: 'x-alloy', spheres: { Life: 4, Matter: 3 }, target: 'self', successes: 4, mode: 'vulgar', nouns: ['Liquid Skin', 'Chrome Flesh', 'Mercury Body', 'Alloy'], act: 'turns their flesh into flowing metal that closes around any wound', system: 'Each success subtracts one level from incoming damage for a scene; the body can flow through any gap an inch wide.' },
  { id: 'x-swarm', spheres: { Life: 3, Mind: 2 }, target: 'place', successes: 3, mode: 'either', nouns: ['Swarm', 'Brood', 'Infestation', 'Vermin'], act: 'calls every rat, roach and fly in the building and points them at something', system: 'Command simple life en masse. As an attack, damage per the chart (bashing) to everyone in the area.', harm: true },
  { id: 'x-implant', spheres: { Spirit: 3, Mind: 3 }, target: 'other', successes: 4, mode: 'coincidental', nouns: ['Passenger', 'Seed', 'Lodger', 'Nest'], act: 'plants a small, patient spirit inside someone\'s head to watch and report', system: 'The spirit relays what its host sees and hears. The host may notice with Perception + Awareness (difficulty 8).' },
  { id: 'x-angles', spheres: { Correspondence: 3, Mind: 3 }, target: 'place', successes: 4, mode: 'vulgar', nouns: ['Wrong Angles', 'Impossible Corner', 'Bent Room', 'Geometry'], act: 'makes a room\'s angles add up wrong, so that minds slide off its corners', system: 'Everyone inside rolls Willpower (difficulty 8) each turn or loses their action to disorientation.' },
  { id: 'x-sleep', spheres: { Life: 3, Time: 3 }, target: 'other', successes: 3, mode: 'either', nouns: ['Long Sleep', 'Cold Berth', 'Suspension', 'Hibernation'], act: 'puts a body into a sleep where nothing ages, bleeds or dies', system: 'Suspend life functions per the duration chart; wounds and poisons stop progressing.' },
  { id: 'x-hunt', spheres: { Correspondence: 2, Entropy: 2 }, target: 'other', successes: 2, mode: 'coincidental', nouns: ['Target Lock', 'Hunter\'s Eye', 'True Shot', 'Sightline'], act: 'knows exactly where the target will be when the shot arrives', system: 'Each success lowers the difficulty of one ranged attack by 1 (max −3) and ignores cover.' },
  { id: 'x-conjure', spheres: { Matter: 2, Prime: 2 }, target: 'object', successes: 3, mode: 'vulgar', nouns: ['Conjuring', 'Empty Hand', 'Something from Nothing', 'Making'], act: 'makes a simple object out of nothing: a blade, a key, a coin', system: 'Create matter from Quintessence. Lasts per the duration chart.' },
  { id: 'x-fetch', spheres: { Correspondence: 3, Matter: 1 }, target: 'object', successes: 2, mode: 'coincidental', nouns: ['Pocket', 'Fetch', 'Coat-Lining', 'Lost-and-Found'], act: 'reaches into an empty pocket and pulls out what they left at home', system: 'Pull a known object to hand; successes by familiarity of its location.' },

  // Blood, number and mind
  { id: 'x-bloodtrail', spheres: { Life: 1, Correspondence: 2 }, target: 'other', successes: 2, mode: 'coincidental', nouns: ['Red Thread', 'Bloodline', 'Vein-Map', 'Scent'], act: "follows a drop of someone's blood back to them, wherever they are", system: 'Sympathetic tracking: a blood sample is the strongest connection on the Correspondence table, so even great distances need few successes.' },
  { id: 'x-bloodprice', spheres: { Prime: 2, Life: 2 }, target: 'self', successes: 2, mode: 'either', nouns: ['Tithe', 'Blood Price', 'Offering', 'Libation'], act: 'bleeds into a bowl and turns the offering into raw Quintessence', system: 'Suggested system: take one level of lethal damage for each point of Quintessence gained, up to the successes rolled. The Storyteller may limit it.' },
  { id: 'e-odds', spheres: { Entropy: 1, Mind: 1 }, target: 'place', successes: 1, mode: 'coincidental', nouns: ['Odds', 'Probability', 'Expected Value', 'Calculation'], act: 'works out the odds of everything that might happen in the next few minutes', system: 'Each success gives +1 die (max +3) to one roll that depends on predicting chance or behaviour.' },
  { id: 'f-equation', spheres: { Forces: 2, Prime: 1 }, target: 'place', successes: 2, mode: 'either', nouns: ['Equation', 'Null Line', 'Cancellation', 'Boundary Condition'], act: 'writes an equation across a threshold that cancels any force trying to cross it', system: 'Each success subtracts one success from energy Effects crossing the line, or one level of fire or electrical damage.' },
  { id: 'mi-coldread', spheres: { Mind: 1 }, target: 'other', successes: 1, mode: 'coincidental', nouns: ['Cold Reading', 'Tell', 'Read', 'Hunch'], act: "reads a stranger's life from their posture, their shoes and their hands", system: "Each success reveals one true fact about the target that they haven't said aloud." },
  { id: 'x-remote', spheres: { Mind: 3, Correspondence: 2 }, target: 'other', successes: 3, mode: 'either', nouns: ['Remote Viewing', 'Far Mind', 'Second Sight', 'Projection'], act: 'reaches a familiar mind across any distance and listens to its surface thoughts', system: 'Range by Correspondence connection; read surface thoughts, as with Mind 2, for a scene.' },
];

// ---------------------------------------------------------------------------
// Modifiers that can be stacked on an effect. Each lists where it makes sense.

export interface Modifier {
  id: string;
  spheres: Reqs;
  extraSuccesses: number;
  /** A full sentence added after the description. */
  clause: string;
  system: string;
  allows: Target[];
  /** Skip if the effect already uses any of these Spheres at any rank. */
  excludeIf?: Sphere[];
  /** Only for harmful effects. */
  harmOnly?: boolean;
  /** Not on effects that are already vulgar (e.g. "keeps it coincidental"). */
  notVulgar?: boolean;
}

export const MODIFIERS: Modifier[] = [
  { id: 'range', spheres: { Correspondence: 2 }, extraSuccesses: 1, clause: 'It reaches anyone they can see, or anyone they know well.', system: 'Range by Correspondence connection (extra successes for weaker connections).', allows: ['other', 'object', 'spirit'], excludeIf: ['Correspondence'] },
  { id: 'trigger', spheres: { Time: 4 }, extraSuccesses: 1, clause: 'It can be hung to go off later, when a condition is met.', system: 'Trigger Effect: cast now, release later on a stated condition.', allows: ['self', 'other', 'object', 'place', 'spirit'], excludeIf: ['Time'] },
  { id: 'lasting', spheres: { Prime: 2 }, extraSuccesses: 1, clause: 'A bead of Quintessence anchors it so it outlasts the night.', system: 'Spend one Quintessence: duration steps up one row on the duration chart.', allows: ['self', 'other', 'object', 'place'], excludeIf: ['Prime'] },
  { id: 'spirits', spheres: { Spirit: 2 }, extraSuccesses: 1, clause: 'It reaches across the Gauntlet to things on the other side.', system: 'Also affects spirits and ephemeral objects.', allows: ['other', 'object', 'place'], excludeIf: ['Spirit'] },
  { id: 'many', spheres: {}, extraSuccesses: 2, clause: 'It spreads to everyone in the room.', system: 'Each success beyond the base adds one more target (optional dividing successes rule).', allows: ['other'] },
  { id: 'unseen', spheres: { Mind: 2 }, extraSuccesses: 1, clause: 'Witnesses leave quite sure that nothing happened.', system: 'Witnesses who fail a Willpower roll (difficulty 7) recall nothing unusual; helps keep it coincidental.', allows: ['self', 'other', 'object', 'place'], excludeIf: ['Mind'], notVulgar: true },
  { id: 'agg', spheres: { Prime: 2 }, extraSuccesses: 0, clause: 'Charged with Quintessence, the wound never heals clean.', system: 'Spend one Quintessence: the damage is aggravated.', allows: ['other', 'place'], excludeIf: ['Prime'], harmOnly: true },
  { id: 'token', spheres: { Matter: 1, Prime: 2 }, extraSuccesses: 1, clause: 'It can be sealed inside a small object that anyone can set off.', system: 'Stored in a token; whoever breaks or uses it releases the Effect once.', allows: ['other', 'place', 'object'], excludeIf: ['Prime', 'Matter'] },
  { id: 'network', spheres: { Correspondence: 2, Forces: 1 }, extraSuccesses: 1, clause: 'It travels down a phone line or through a broadcast.', system: 'Range through any connected wire or signal the mage can reach.', allows: ['other', 'place'], excludeIf: ['Correspondence', 'Forces'] },
];
