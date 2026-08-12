# Aperol Sensory Model — site framework

The rules this site is built to. If you are about to type a raw pixel value,
it belongs here as a token instead.

Everything below is implemented in **`f.css`**, which loads after `a.css` and
normalises it. `a.css` is the original hand-written stylesheet; `f.css` is the
system.

---

## 1. Where things live

| File | Role |
|---|---|
| `index.html` | Markup and the two inline SVG illustrations |
| `a.css` | Original component styles |
| `f.css` | **The framework** — tokens, and the rules that normalise `a.css` onto them |
| `a.js` | The domain model: effects, senses, the solver, the generated paragraph |
| `b.js` | Scroll behaviour, flat-path step figures, touch tooltips, dial detail |
| `gsap.min.js`, `ScrollTrigger.min.js` | Pinning and scrubbing for `#s1` (self-hosted, v3.15.0) |

Sections: `#s1` the drink · `#s2` the senses + "change it" · `#s4` over time ·
`#s5` against a Peroni.

---

## 2. Type scale

Nine steps. Each has one job. **Do not add a tenth without deleting one.**
Before this system the site used sixteen sizes, including `12.5px` and `13.5px`.

| Token | Value | Used for |
|---|---|---|
| `--fs-micro` | 11px | Eyebrows, column heads, unit labels — always uppercase, `--ls-caps`, weight 600 |
| `--fs-xs` | 12px | Captions, footnotes, chips, tabular readouts |
| `--fs-sm` | 13px | Nav, buttons, tooltips, secondary UI |
| `--fs-base` | 15px | Dense rows, tables, slider labels |
| `--fs-md` | 17px | Body copy |
| `--fs-lg` | 19px | Lead paragraphs, standfirsts |
| `--fs-xl` | `clamp(20px, 1.6vw, 23px)` | The `#s1` step copy |
| `--fs-h2` | `clamp(24px, 3vw, 34px)` | Section headings |
| `--fs-h1` | `clamp(30px, 5vw, 52px)` | Page title |

Line height is tied to size, never chosen per element:

`--lh-tight 1.08` display · `--lh-snug 1.3` h2 and large copy ·
`--lh-normal 1.55` body · `--lh-ui 1.4` labels and rows.

Letter spacing: `--ls-display -0.02em` · `--ls-body -0.006em` ·
`--ls-caps 0.14em`.

**Measure.** Long-form copy never exceeds `--measure` (64ch). The `#s1` step
copy uses `--measure-narrow` (46ch). Nothing sets a max-width in px.

---

## 3. Space scale

4px base. Use the step, not the number.

`--sp-1` 4 · `--sp-2` 8 · `--sp-3` 12 · `--sp-4` 16 · `--sp-5` 20 ·
`--sp-6` 24 · `--sp-7` 32 · `--sp-8` 40 · `--sp-9` 48 · `--sp-10` 64 ·
`--sp-11` 80

### Vertical rhythm — three values run the whole page

| Token | Value | Meaning |
|---|---|---|
| `--section-y` | `clamp(32px, 4.5vh, 56px)` | Applied to the top **and** bottom of every section, so the gap a reader sees between two sections is twice this |
| `--block-y` | `clamp(28px, 4vh, 44px)` | Between blocks inside a section |
| `--stack-y` | 16px | Between related elements |

---

## 4. Layout

One container, one gutter, and **sections gutter themselves**. Inner wrappers
never re-add horizontal padding — that was why the four sections' content
columns did not line up down the page.

```css
--container: 920px;
--gutter: clamp(20px, 5vw, 88px);

section        { padding-block: var(--section-y); padding-inline: var(--gutter) }
.in, .navin,
.stage, #s2 .col { max-width: var(--container); margin-inline: auto; padding-inline: 0 }
```

`#s1` is the exception: it has no block padding (it is the pinned track) and
its gutter sits on `#s1 .pin`.

---

## 5. Rows

Nine row components existed with seven different paddings. They are all the
same object: a full-width line with a hairline under it.

```css
.legend li, .chrow, .axrow, .trow, .srow, .lever, .glab, .gcell {
  padding-block: var(--row-py);          /* 11px, 12px on mobile */
  border-bottom: 1px solid var(--rule);
}
```

Hover on an interactive row is always `--hover-wash`, never a custom colour.

---

## 6. Controls

One button. There were four variants with four different paddings and three
different heights.

```css
--control-h: 40px;      /* becomes 44px on mobile */
--control-px: 16px;
--tap-min: 44px;        /* the floor on touch — nothing clickable goes under it */
```

`.reset`, `.sheetx`, `.sw` and `.modebtn` all share one base: `--fs-sm`,
`min-height: var(--control-h)`, `padding: 0 var(--control-px)`, 1px `--rule`
border, inline-flex centred.

States: hover on a neutral button is `--panel`; the selected/primary state is
`--hi` with white text. There are no other button states.

**Focus** is one treatment for the whole site and is always visible on
keyboard: `2px solid var(--focus)` at `2px` offset, via `:focus-visible`.

---

## 7. Motion

| Token | Value | Use |
|---|---|---|
| `--ease` | `cubic-bezier(.22,.61,.36,1)` | Everything |
| `--dur-fast` | 0.16s | Hover, colour change |
| `--dur` | 0.28s | State change |
| `--dur-slow` | 0.6s | Reveal on enter |

**Reveal on enter** is the site's one entrance animation: `.reveal` starts at
`opacity 0, translateY(14px)`; `.reveal.in` clears both. One
IntersectionObserver drives all of them and unobserves each element once it
fires, so nothing re-animates on the way back up. Under
`prefers-reduced-motion` the class is inert and everything is simply visible.

---

## 8. Scroll — the rules

This is the part that was broken, so the constraints are worth stating plainly.

1. **Nothing in the code ever calls `scrollTo()`.** The scroll position belongs
   to the user. The previous build ran a hand-rolled snapper that fired 150ms
   after you stopped scrolling and pulled you to the nearest marker — up to 55%
   of a section forward or 140px *backward*. That single function caused both
   the "animates too fast" and the "goes in reverse if you scroll slowly"
   behaviour. It is gone and has no replacement.
2. **Parallax exists in exactly one place**: `#s1`, desktop only, pinned and
   scrubbed by GSAP ScrollTrigger with `scrub: 0.6`. ScrollTrigger caches its
   start/end on refresh rather than recomputing from a live layout every frame,
   and `scrub` interpolates *toward* the true progress — so it cannot run
   backwards while you scroll forwards.
3. **Desktop is `(min-width:900px) and (pointer:fine)` and not reduced-motion.**
   Everything else — mobile, tablet, touch laptops, reduced motion, and the case
   where GSAP fails to load — takes the flat path: no pinning at all, sections
   reveal on enter. `html` carries `.has-parallax` or `.no-parallax` so CSS can
   branch.
4. **Never write layout from inside a ResizeObserver.** The old build auto-shrank
   `#s2 .col` and `#s5 .in` from an RO callback, which re-triggered the same
   observer and made the page oscillate while standing still.
5. **`scroll-behavior` is `auto` on the document.** Smooth scrolling globally
   means every programmatic scroll animates and can be interrupted mid-flight.
   `scroll-padding-top` handles anchor offset instead.

### Regression checks

`verify.mjs` in the source bundle is the guard. Run it against a build and all
of these must hold:

| Check | Must be |
|---|---|
| Scroll position moves while the user sits still | 0px |
| Animation progress decreases while scrolling forward | 0 occurrences |
| Parallax element moves while the page is stationary | 0px |
| Pinned block's distance from the top varies through the section | 0px |
| Horizontal overflow on mobile | 0px |
| Clickable things under 44px on mobile | none |
| Console errors | none |
| Chart row / dial grid columns on mobile | 1 |
| Aperol glasses' rendered silhouette difference | ≤ 2px |
| Baseline spread across the three glasses | ≤ 2px |
| SVG `<mask>` elements in the document | 0 |
| Duplicate element ids | none |

---

## 9. "Change it" — layout and controls

Three full-width stacked blocks, identical on desktop and mobile so there is
one reading order to maintain:

1. `CHANGE IT` + heading + **the drink's own description**, which rewrites
   itself as dials move — the section explains itself by changing.
2. The chart (360px) and the five sense values side by side. The values are
   capped at 440px and set right so they sit near the chart rather than
   stretching the full width.
3. **Ten dials in three columns** (4 / 3 / 3).

The five sense rows carry the drink as served — Taste 9, Touch 9, Hearing 4,
Sight 9, Smell 8 — and update in place, number, colour and arrows, as dials
move. There is no separate "what changed" panel; the rows are the panel.

Each dial shows a **Moves** chip row *above* its track, naming the senses it
affects. The explanation lives only in the tooltip: printing it inline as well
said the same thing twice and made the column several screens tall.

### The dials

Restored from the original POC, which offered eleven asks. Ten are present:
Sweeter, More bitter, Colder, Fizzier, Bolder colour, More aromatic, Sharper,
Fuller bodied, Smoother, Longer serve.

**"Boozier" is deliberately omitted.** In the POC it drives the effect the
spec calls *Speed of Absorption* — the exact axis the brand audit flagged as a
compliance blocker. A dial on an Aperol-branded property inviting a visitor to
make the drink more alcoholic, by making the alcohol arrive faster, is the one
ask that should not ship here. If it is ever wanted, rename it off that axis
first.

There is no Basic/Advanced toggle. It was tried and removed: splitting the
dials into two tiers hid the thing the section exists to show.

## 9b. SVG rules

- **No `<mask>`.** Every browser on iOS runs WebKit, including Chrome, and
  WebKit drops Figma-exported `<mask style="mask-type:alpha">`. When it does,
  the masked content renders in full — which is how the Peroni glass became an
  orange rectangle on a phone. All masks are `<clipPath>`, geometrically
  identical here and reliable everywhere. **Every new export must be
  converted.**
- **Namespace the ids of any imported artwork.** Figma exports reuse
  `Aperol glass`, `Group 21`, `Ellipse 31`. Two elements sharing an id lets the
  wrong clipPath win — silent, and browser-dependent. The imported glass is
  prefixed `mine-*`; the flat-path step figures are prefixed `fig2-*` / `fig3-*`.
- **Do not run SVGO over the inline artwork** without checking ids afterwards.
  It strips the ids the animation selects on (`[id="ice 1"]`, `#hg-segs`) and
  the illustration silently stops moving.
- **Never size artwork by its box alone.** Each export carries a different
  amount of empty space inside its own viewBox, so equal box heights do not
  produce equal drawings. In `#s5` the as-served glass includes a straw above
  the rim, which made it render 8% smaller than a correctly proportioned import
  at the same box height; and the three artworks carried 5.15% / 0% / 6.45%
  empty space to the left and 5.15% / 0.19% / 6.82% below, so the glasses
  neither lined up nor stood on the same line. Each is nudged by its own gap.
  `verify.mjs` asserts both.

## 9c. CSS cascade — one hard rule

**All narrow-viewport media queries live in one block at the very end of
`f.css`, and nothing may be appended after it.** Media queries carry no extra
specificity, so a same-specificity rule written later wins on mobile too. This
broke the phone layout twice: a desktop `grid-template-columns` appended below
the mobile block silently reverted `#s2` to two columns and pushed 86px of
horizontal scroll onto the document. Add mobile rules inside that block; add
desktop rules above it. `verify.mjs` now asserts the intended mobile layout
directly, not just the absence of overflow.

## 9c2. Touch

- Nothing may depend on hover alone. `#tip` used to be `display: none` under
  `(hover:none)`, which deleted every explanation on the site for phone users.
  Tips now open as a bottom sheet on tap and close on a second tap, an outside
  tap, or Escape.
- `cursor` is `pointer`, never `help`. The question-mark cursor read as an
  error state.

---

## 10. Copy rules

Derived from an audit of Aperol's own first-party copy. The full audit with
verbatim sources is in `aperol-voice-audit.md`.

**Hard rules — these are compliance, not style:**

- Never attribute continued drinking to the product.
- Never describe the *rate* at which alcohol is absorbed or reaches the reader.
  No "speed of absorption", no "gets in fast", no "gastric emptying".
- Never use pharmacological vocabulary: "stimulant", "delivery vehicle", "dose".
- ABV appears as a specification, never as a mechanism.
- "Enjoy Aperol Responsibly" stays in the footer.

**Voice rules:**

- Bitter never stands alone — Aperol's load-bearing word is "bittersweet".
- The feeling lives in the room, not the glass. Aperol sells the table.
- Orange is identity, not chemistry.
- "Aperitivo", not "aperitif". Prefer "the table" to "food" or "a meal".
- The site's forensic, numeric register is a deliberate contrast to Aperol's
  warmth and is worth keeping. The contrast is the idea. The compliance rules
  above are not negotiable within it.

---

## 11. Still open

- **No age gate.** Every Aperol property carries one. Adding it changes the
  entry experience, so it is a decision rather than a fix.
- **`a.css` still contains rules superseded by `f.css`.** They are harmless
  (later cascade wins) but the file could be pruned.
- **No Safari/WebKit in the test loop.** The mask bug was invisible in headless
  Chromium and only showed on a real phone. `verify.mjs` cannot catch that class
  of problem; a WebKit runner would.
- **No source control.** The source for this site existed nowhere when this work
  started and had to be reconstructed from the live deployment. Putting this
  bundle in a git repo and connecting it to the Vercel project is the single
  highest-value next step.
