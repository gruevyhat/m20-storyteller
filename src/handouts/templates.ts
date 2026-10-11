// Ready-made handout looks. A template is only a style plus some starter text; the Storyteller
// edits the text like any other handout. Small conventions in the text drive the layout:
//   # Heading        a headline, name or title line
//   Label: value     a form field (reports, emails, posters, receipts)
//   Name: message    a chat line (text messages)
//   [[secret]]       blacked out on every handout, so the original never reaches the players
//   ---              a rule or tear line

export type HandoutStyle =
  | 'letter'
  | 'telegram'
  | 'newspaper'
  | 'report'
  | 'memo'
  | 'journal'
  | 'manuscript'
  | 'messages'
  | 'email'
  | 'missing'
  | 'obituary'
  | 'receipt'
  | 'card';

export interface HandoutTemplate {
  style: HandoutStyle;
  label: string;
  /** When to reach for it. */
  use: string;
  title: string;
  text: string;
}

export const HANDOUT_TEMPLATES: HandoutTemplate[] = [
  {
    style: 'letter',
    label: 'Letter',
    use: 'Inheritances, warnings, confessions, invitations.',
    title: 'A letter',
    text: `My dear friend,

I write in haste and by lamplight. The house is quieter than it should be, and I have stopped trusting the quiet.

If this reaches you, come by the north road, not the bridge. Bring the key I left with you. Tell no one where you are going, least of all [[my brother]].

Yours, while I am still able,
A.`,
  },
  {
    style: 'telegram',
    label: 'Telegram',
    use: 'Urgent news from far away, terse and expensive.',
    title: 'Telegram',
    text: `# Overland Wire Co.
To: The Recipient
ARRIVED SAFE STOP PACKAGE NOT AS DESCRIBED STOP IT IS BREATHING STOP DO NOT SEND THE OTHERS STOP WIRE INSTRUCTIONS CARE OF HARBOUR HOTEL STOP`,
  },
  {
    style: 'newspaper',
    label: 'Newspaper clipping',
    use: 'Public events, cover stories, the official version.',
    title: 'Newspaper clipping',
    text: `# Second Disappearance at Riverside Works
Staff reporter · Tuesday

Police were called for the second time this month to the disused Riverside mill after a night watchman failed to return home.

A spokesperson for the owners described the building as "secure and unremarkable." Neighbours report a low humming sound after midnight and lights in windows that were bricked up years ago.

Anyone with information is asked to contact the station on the High Street.`,
  },
  {
    style: 'report',
    label: 'Police report',
    use: 'Crime scenes, witness statements, case numbers.',
    title: 'Incident report',
    text: `# Incident Report
Case no.: 24-0117
Date: 14 March
Officer: Sgt. [[redacted]]
Location: 19 Marsh Lane, rear garden
Summary: Caller reported screaming. On arrival, no persons present. Soil disturbed in a circle approx. 3 m across. Grass inside the circle dead; grass outside it frosted, despite mild weather.
Disposition: No further action.`,
  },
  {
    style: 'memo',
    label: 'Classified memo',
    use: 'Conspiracies, cover-ups, documents that should never have left the building.',
    title: 'Internal memorandum',
    text: `# Internal Memorandum
From: Office of Continuity
To: Field Group [[Seven]]
Re: Subject recovered at [[Marsh Lane]]

The subject remains cooperative but continues to describe the room as larger than it is. Measurements are consistent. Staff who spend more than an hour inside agree with the subject.

Recommend the room be sealed and the staff reassigned. Do not discuss this memo by telephone.`,
  },
  {
    style: 'journal',
    label: 'Journal page',
    use: 'Diaries, research notes, the last entries of the missing.',
    title: 'Journal page',
    text: `# 3rd of November
Couldn't sleep again. The tapping in the walls has a rhythm now. I wrote it down: long, short, short, long. It's the same every night.

Tonight I tapped it back.

It stopped. Then it started again, from inside the wardrobe.`,
  },
  {
    style: 'manuscript',
    label: 'Occult manuscript',
    use: 'Rituals, grimoire pages, a mage’s private notes.',
    title: 'Manuscript fragment',
    text: `# Of the Door Within the Door
Let the seeker mark the threshold with salt and with their own name, written backward. At the turning of the hour let them knock thrice and wait.

What answers will ask a question. Answer it truly, for it already knows.

---
Here the page is torn. In another hand, beneath: "It did not ask me a question. It told me one."`,
  },
  {
    style: 'messages',
    label: 'Text messages',
    use: 'Phones found on bodies, group chats, last contacts.',
    title: 'Messages',
    text: `Dani: where are you
Dani: the party ended an hour ago
Sam: still in the house. can't find the front door
Dani: its literally the big one by the stairs
Sam: there are no stairs anymore
Dani: not funny
Sam: i know`,
  },
  {
    style: 'email',
    label: 'Email printout',
    use: 'Corporate trails, leaked correspondence, hacked inboxes.',
    title: 'Email',
    text: `From: j.harlow@archive-trust.org
To: board@archive-trust.org
Date: Fri, 2:14 AM
Subject: Re: The Wexley bequest

I've finished cataloguing the boxes. There is one more than the inventory lists. It isn't on the shelf when I look at it directly.

I'm taking tomorrow off. Please don't call.

J.`,
  },
  {
    style: 'missing',
    label: 'Missing poster',
    use: 'Lost people, lost pets, a face the characters will recognise later.',
    title: 'Missing',
    text: `# Missing
Name: Elena Voss
Age: 24
Last seen: Night bus 19, outbound, Friday
Wearing: Green coat, red scarf
---
She may seem confused. Please don't follow her. Call the family: 555-0143`,
  },
  {
    style: 'obituary',
    label: 'Obituary',
    use: 'Deaths that need a closer look.',
    title: 'Obituary',
    text: `# Harold Wren
1931 – this past Thursday

Retired surveyor, beloved uncle and keeper of bees. Harold passed peacefully at home, on the same day, his niece notes, as the bees left the hives.

The family asks that no flowers be sent to the house. The service will be private, and closed.`,
  },
  {
    style: 'receipt',
    label: 'Receipt or ticket',
    use: 'Alibis, timestamps, trails of small purchases.',
    title: 'Receipt',
    text: `# All-Night Pharmacy
Till 2 · 03:12
Bandages x 6: 9.00
Salt, 2 kg: 2.40
Candles, white x 12: 7.80
Chalk: 1.10
Total: 20.30
---
Paid cash. Thank you, come again.`,
  },
  {
    style: 'card',
    label: 'Calling card',
    use: 'An introduction, a threat, or a number to call.',
    title: 'Calling card',
    text: `# Mr. Quillon Ashe
Acquisitions & Reunions
---
We find what you lost.`,
  },
];

export const STYLE_LABELS: Record<HandoutStyle, string> = Object.fromEntries(HANDOUT_TEMPLATES.map((t) => [t.style, t.label])) as Record<
  HandoutStyle,
  string
>;

/** Blacks out every [[secret]]. The bar keeps roughly the secret's length, but never its letters. */
export function redact(text: string) {
  return text.replace(/\[\[([^\]]*)\]\]/g, (_, s: string) => '█'.repeat(Math.min(Math.max(s.length, 3), 24)));
}

export type Line =
  | { kind: 'heading'; text: string }
  | { kind: 'field'; label: string; value: string }
  | { kind: 'rule' }
  | { kind: 'blank' }
  | { kind: 'text'; text: string };

/** A short "Label:" at the start of a line, as used by forms, emails and chats. */
const FIELD = /^([^:\n]{1,24}):\s+(.*)$/;

/** Splits redacted handout text into the lines the layouts understand. */
export function parseLines(text: string, fields = true): Line[] {
  return redact(text)
    .split('\n')
    .map((raw): Line => {
      const line = raw.trimEnd();
      if (!line.trim()) return { kind: 'blank' };
      if (/^\s*-{3,}\s*$/.test(line)) return { kind: 'rule' };
      const h = line.match(/^#\s+(.*)$/);
      if (h) return { kind: 'heading', text: h[1] };
      const f = fields ? line.match(FIELD) : null;
      if (f) return { kind: 'field', label: f[1].trim(), value: f[2] };
      return { kind: 'text', text: line };
    });
}
