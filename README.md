# aperol-sensory-model — source

Live: https://aperol-sensory-model.vercel.app

This bundle exists because the site had no source control; the source was
reconstructed from the live deployment. **Put this in a git repo and connect it
to the Vercel project** — still the highest-value next step.

## Layout

```
src/       readable source — edit these
build/     minified output — what is deployed
FRAMEWORK.md          the design system, SVG rules and scroll rules. Read first.
aperol-voice-audit.md brand voice research and the copy audit
poc-spec.md           spec of the original "change it" POC
verify.mjs            the regression suite
package.json          the Vercel build
```

| File | Role |
|---|---|
| `index.html` | Markup, inline SVG illustrations |
| `a.css` | Original component styles |
| `f.css` | The framework — tokens and normalisation. Loads after `a.css`. |
| `a.js` | Domain model: effects, senses, solver, generated paragraph |
| `b.js` | Scroll behaviour, step figures, touch tooltips, dial chips |
| `glass-the-one-you-made.svg` | The imported glass, already converted and namespaced |
| `gsap.min.js` / `ScrollTrigger.min.js` | GSAP 3.15.0, self-hosted |

## Build

```sh
npx html-minifier-terser --collapse-whitespace --remove-comments \
    --minify-css true --minify-js true src/index.html -o build/index.html
npx cleancss -O2 src/a.css -o build/a.css
npx cleancss -O2 src/f.css -o build/f.css
npx terser src/a.js -c -m --comments false -o build/a.js
npx terser src/b.js -c -m --comments false -o build/b.js
cp src/gsap.min.js src/ScrollTrigger.min.js build/
```

## Deploy

Put `package.json` and the contents of `build/` in one directory, then:

```sh
vercel link --project aperol-sensory-model --scope here-for-the-better
vercel deploy --prod --scope here-for-the-better
```

Link first, or deploy from a directory named for the project — the CLI takes
the project name from the directory and will otherwise create a new one.

## Verify

```sh
python3 -m http.server 8080 --directory build &
TARGET=http://127.0.0.1:8080/index.html node verify.mjs
```

23 checks across desktop and mobile. Run it before every deploy — several of
these are regressions that already happened once and were invisible by eye.

## The three rules that cost the most time

1. **All narrow-viewport media queries stay in one block at the end of
   `f.css`.** Nothing may be appended after it. Media queries add no
   specificity, so a later same-specificity desktop rule wins on mobile too.
   This silently reverted the phone layout twice.
2. **No SVG `<mask>`, and namespace every imported id.** WebKit — every browser
   on iOS, Chrome included — drops Figma's `mask-type:alpha` masks and renders
   the masked content in full. Duplicate ids let the wrong clipPath win.
3. **Never size artwork by its box alone.** Each export carries different empty
   space inside its viewBox, so equal box heights do not give equal drawings.
   Measure the silhouette, then nudge by the gap. Both are asserted.

## Adding a new drink illustration

1. Convert `<mask>` → `<clipPath>`.
2. Prefix every `id` and every `url(#…)` with something unique.
3. Drop the fixed `width`/`height`, keep the `viewBox`.
4. Run `verify.mjs` — the glass size and baseline checks will tell you the nudge
   percentages you need.

<!-- git-driven deploys verified 2026-08-12T17:44Z -->
