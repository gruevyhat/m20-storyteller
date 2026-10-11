#!/usr/bin/env python3
"""Build public/tutorial.html, the app's tutorial page, from the Markdown source.

The Markdown file is the only source; edit it and rerun:

    python3 scripts/build_tutorial.py

Handles the small Markdown subset the tutorial uses: headings, paragraphs, lists, block quotes,
inline code, bold, italics, links and images. Images are embedded as data URIs so the page is a
single self-contained file. A ```mermaid block is replaced with the hand-drawn collaboration
diagram below (Mermaid itself is not loaded). Uses only the standard library.
"""
import base64
import html
import mimetypes
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / 'docs'
SOURCE = DOCS / 'tutorial-building-ttrpg-player-aids.md'
# Vite copies public/ into the site as-is, so the page is served at <base>/tutorial.html.
TARGET = ROOT / 'public' / 'tutorial.html'
HERE = Path(__file__).resolve().parent

DIAGRAM = '''<figure class="collaboration" aria-labelledby="loop-caption">
<div class="loop-node human"><span class="loop-label">GM</span><strong>Describe a need at the table</strong><span>An activity, a frustration, a rule, a screenshot</span></div>
<div class="loop-arrow" aria-hidden="true">↓</div>
<div class="loop-node harness"><span class="loop-label">Assistant</span><strong>Read the project and the rules, then build something to try</strong><span>A working screen, a rule model, generated content, a handout</span></div>
<div class="loop-arrow" aria-hidden="true">↓</div>
<div class="loop-fork">
<div class="loop-node human"><span class="loop-label">GM</span><strong>Try it and react</strong>
<div class="loop-ways"><span><b>Say what you see</b><br>“less blank space, not smaller cards”</span><span><b>Ask for the working</b><br>“show me the math”</span><span><b>Spell out behavior</b><br>“start with all nine cards face down…”</span><span><b>Give a reference</b><br>a picture of the right shape</span></div></div>
<div class="loop-node harness"><span class="loop-label">Assistant</span><strong>Check it beyond the screen</strong><span>Tests with fixed dice and seeds, the page in a browser, the data actually sent to players, a commit that builds on its own</span></div>
</div>
<div class="loop-return">↶ Back to the request or the build until it belongs at the table</div>
<div class="loop-memory"><strong>What carries over to the next session</strong>
<div class="memory-grid"><span><b>Tests</b>behavior that must not break</span><span><b>Page references</b>where each rule came from</span><span><b>Commits</b>what changed and why</span><span><b>Notes</b>preferences and open problems</span></div></div>
<figcaption id="loop-caption">The GM steers with short reactions to something real; the assistant checks what the GM cannot see. What is learned is kept where the next session will find it.</figcaption>
</figure>'''


def slug(s):
    return re.sub(r'[^\w\- ]', '', s.lower()).replace(' ', '-')


def data_uri(rel):
    path = (DOCS / rel).resolve()
    mime = mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
    return f'data:{mime};base64,' + base64.b64encode(path.read_bytes()).decode()


def inline(s):
    """Inline Markdown to HTML. Code spans and links are swapped out first so their text is not reformatted."""
    tokens = []

    def keep(value):
        tokens.append(value)
        return f'\x00{len(tokens) - 1}\x00'

    s = re.sub(r'`([^`]+)`', lambda m: keep('<code>' + html.escape(m[1]) + '</code>'), s)
    s = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', lambda m: keep(f'<a href="{html.escape(m[2], quote=True)}">{html.escape(m[1])}</a>'), s)
    s = html.escape(s)
    s = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', s)
    s = re.sub(r'\*([^*]+)\*', r'<em>\1</em>', s)
    while '\x00' in s:
        s = re.sub(r'\x00(\d+)\x00', lambda m: tokens[int(m[1])], s)
    return s


BLOCK_START = re.compile(r'^(?:#|>|- |\d+\. |!\[|```)')


def render(text):
    lines = text.splitlines()
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        if line.startswith('```'):
            i += 1
            while i < len(lines) and not lines[i].startswith('```'):
                i += 1
            i += 1
            out.append(DIAGRAM)
            continue
        if m := re.match(r'^(#{1,6}) (.+)$', line):
            level, label = len(m[1]), m[2]
            out.append(f'<h{level} id="{slug(label)}">{inline(label)}</h{level}>')
            i += 1
            continue
        if m := re.match(r'^!\[([^\]]*)\]\(([^)]+)\)\s*$', line):
            alt = m[1]
            out.append(f'<figure class="shot"><img src="{data_uri(m[2])}" alt="{html.escape(alt, quote=True)}"><figcaption>{inline(alt)}</figcaption></figure>')
            i += 1
            continue
        if line.startswith('> '):
            parts = []
            while i < len(lines) and lines[i].startswith('> '):
                parts.append(lines[i][2:])
                i += 1
            out.append('<blockquote><button class="copy" type="button" aria-label="Copy this example">Copy text</button><p>' + inline(' '.join(parts)) + '</p></blockquote>')
            continue
        if re.match(r'^(?:- |\d+\. )', line):
            ordered = bool(re.match(r'^\d+\.', line))
            pattern = r'^\d+\. ' if ordered else r'^- '
            tag = 'ol' if ordered else 'ul'
            items = []
            while i < len(lines) and re.match(pattern, lines[i]):
                items.append('<li>' + inline(re.sub(pattern, '', lines[i])) + '</li>')
                i += 1
            out.append(f'<{tag}>' + ''.join(items) + f'</{tag}>')
            continue
        parts = [line]
        i += 1
        while i < len(lines) and lines[i].strip() and not BLOCK_START.match(lines[i]):
            parts.append(lines[i])
            i += 1
        para = ' '.join(parts)
        cls = ' class="deliverable"' if para.startswith('**Try:**') else ''
        out.append(f'<p{cls}>' + inline(para) + '</p>')
    return '\n'.join(out)


def main():
    source = SOURCE.read_text()
    title = re.search(r'^# (.+)$', source, re.M)[1]
    deck = re.search(r'^## (.+)$', source, re.M)[1]
    # The title and subtitle become the page masthead, so drop them from the body.
    body = re.sub(r'^# [^\n]+\s+## [^\n]+\s+', '', source)
    toc = ''.join(
        f'<li><a href="#{slug(h)}"><span class="chapter">{re.match(r"\d+", h)[0].zfill(2) if re.match(r"\d+", h) else "→"}</span>'
        f'<span>{html.escape(re.sub(r"^\d+\. ", "", h))}</span></a></li>'
        for h in re.findall(r'^## (.+)$', body, re.M)
    )
    css = (HERE / 'tutorial.css').read_text()
    js = (HERE / 'tutorial.js').read_text()
    page = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="How to build RPG tools with a coding assistant, using M20-Storyteller as the worked example.">
<title>{html.escape(title)} · TTRPG Field Notes</title><style>{css}</style></head>
<body id="top"><a class="skip" href="#article">Skip to tutorial</a>
<header class="topbar"><a class="brand" href="#top">TTRPG Field Notes</a><div class="top-actions"><a class="back" href="./">← M20 Storyteller</a><button id="theme" type="button" aria-label="Switch to light theme">Light theme</button><button id="print" type="button">Print</button></div><div class="progress" aria-hidden="true"></div></header>
<div class="layout"><nav class="sidebar" aria-label="Tutorial contents"><div class="eyebrow">Inside the tutorial</div><button class="toc-toggle" type="button" aria-expanded="false" aria-controls="chapter-list">Chapters ↓</button><ol id="chapter-list">{toc}</ol><p class="side-note">Building and checking RPG tools, with M20-Storyteller as the example.</p></nav>
<main id="article"><div class="hero"><div class="eyebrow">A guide for game masters</div><h1>{html.escape(title)}</h1><p class="deck">{html.escape(deck)}</p></div>
<article class="article">{render(body)}</article>
<footer>{html.escape(title)}. {html.escape(deck)}. <a href="#top">Back to top ↑</a></footer></main></div>
<div class="toast" role="status" aria-live="polite"></div><script>{js}</script></body></html>'''
    TARGET.write_text(page)
    print(f'Wrote {TARGET.relative_to(ROOT)} ({len(page.encode()) // 1024} KB)')


if __name__ == '__main__':
    main()
