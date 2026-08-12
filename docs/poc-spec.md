# `poc.html` — "What if the drink were…" rig: implementation spec

Reverse-engineered from `/home/claude/aperol/poc.html` (single-line, 55,246 bytes).
File structure: `<div id="hftb-rig">` → `<style>` block (chars 20–9,079) → static HTML skeleton
(chars 9,079 region, after `</style>`) → one IIFE `<script>` (chars 9,087–55,093, 46,006 chars of JS).

Everything is client-side, synchronous, no dependencies, no persistence. The whole thing is
one IIFE: `(function(){ … })();` ending in `dials();render();`.

---

## 0. Runtime shape

```js
let drink='ap', want={}, prev=null;
const K={Strong:0.35,Moderate:0.20};
const anchor=()=>Object.fromEntries(M.effects.map(e=>[e.name,drink==='ap'?e.ap:e.pe]));
const rule=Object.fromEntries(M.effects.map(e=>[e.name,e.rule]));
const grpOf=Object.fromEntries(M.effects.map(e=>[e.name,e.group]));
const join=a=>a.length<2?(a[0]||''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];
```

- `drink` — `'ap'` (Aperol Spritz) or `'pe'` (Peroni).
- `want` — `{ [effectName]: multiplier }`, multiplier is `sliderValue/100` ∈ [0.25, 1.75].
- `prev` — assigned at the end of `render()` (`prev=st`) but **never read**. Dead.
- `grpOf` — built but **never read**. Dead.
- `join(a)` — the Oxford-less list joiner used everywhere: `[]`→`''`, `[x]`→`x`,
  `[a,b]`→`'a and b'`, `[a,b,c]`→`'a, b and c'`.

Memoisation, invalidated on drink switch:

```js
let _b0=null,_be0=null,_b0d=null;
function baseE0(){ if(_b0d!==drink){_be0=perceived({});_b0=null;_b0d=drink;} return _be0; }
function base0(){ /* group averages of baseE0(), rounded to 1dp */ }
```

---

## 1. Data model

### 1.1 Groups (fixed order — drives meters, archetype bit-string, paragraph order)

```
["What You Notice", "What Your Body Does", "Where It Goes"]
```

### 1.2 Effects (`M.effects`, 11 entries)

`ap` / `pe` are the **baseline scores** (0–10) — the anchor the model scales from.
`rule` is the aggregation rule for that effect's ingredient contributions.
`short` is the noun phrase used inside `{effects}` frame slots.

| # | name | group | ap | pe | rule | short |
|---|---|---|---|---|---|---|
| 0 | Cold Shock | What You Notice | 9 | 4 | Each one adds less than the last | the cold |
| 1 | Colour Signal | What You Notice | 10 | 4 | Only the strongest counts | the colour |
| 2 | Smell Lift | What You Notice | 8 | 4 | Each one adds fully | the smell |
| 3 | Fizz Bite | What You Notice | 9 | 5 | Each one adds fully | the fizz |
| 4 | Bitter Kick | What Your Body Does | 9 | 4 | Each one adds fully | the bitterness |
| 5 | Sharp Acidity | What Your Body Does | 8 | 3 | Each one adds fully | the sharpness |
| 6 | Bitterness Masking | What You Notice | 7 | 5 | Each one adds less than the last | the smoothing |
| 7 | Speed of Absorption | Where It Goes | 9 | 4 | Each one adds less than the last | how quickly it lands |
| 8 | Sugar Reward | What Your Body Does | 9 | 4 | Each one adds fully | the sugar |
| 9 | Watering Down | Where It Goes | 8 | 3 | Each one adds fully | the ice melting |
| 10 | Body and Texture | What You Notice | 6 | 7 | Each one adds fully | the weight of it |

> Note the grouping quirk, preserve it: **Bitterness Masking sits in "What You Notice"**, not
> "What Your Body Does". "What You Notice" therefore has 6 member effects, "What Your Body Does" 3,
> "Where It Goes" 2. Group scores are unweighted means over members **present in the current drink**.

Each effect also carries a `what` narrative paragraph (§9.7). **`e.what` is referenced zero times
in the script** — it is authored copy that the POC never renders. Carry it forward anyway.

### 1.3 Bands (`M.bands`) — first match wins, tested `v >= threshold`

| threshold | label |
|---|---|
| 8.5 | Dominant |
| 6.5 | Strong |
| 4 | Present |
| 0 | Minimal |

`const band=v=>(M.bands.find(b=>v>=b[0])||M.bands[M.bands.length-1])[1];`

`M.strongAt = 7.5` — the archetype bit threshold (`>= 7.5` → `'1'`).

### 1.4 Ingredient contribution rows

Fields per row:

| field | meaning |
|---|---|
| `id` | unique key, `AP-0xx` / `PE-0xx`; the key in the `moves`/`mv` map |
| `comp` | component (pour) it belongs to — drives the glass columns |
| `name` | display name in the ledger |
| `eff` | the effect it feeds |
| `w` | weight 1–3, the raw contribution magnitude |
| `dir` | `'+'` or `'-'` — sign of the contribution |
| `lever` | `Serve` \| `Formulation` \| `Fixed` \| `Sacred` |
| `rank` | **0 or 1 → movable; 9 → walled.** Only ever tested as `<9` / `>=9` |
| `who` | attribution string: `the bartender` \| `the producer` \| `cannot change` \| `protected recipe` |
| `amt` | "As served" text, shown verbatim in the ledger |
| `share` | volume share used for the glass diagram; `null` = no volume |
| `cap` | **never read by the script.** Dead field (values 83, 10, 10) |
| `unit` | unit suffix for the computed "Now" amount; `""` suppresses it |
| `max` | per-row travel ceiling as a multiplier (default 2 if undefined) |
| `mid` | midpoint numeric value; `null` = no numeric "Now" |
| `volComp` | if set, moving this row moves **every** row sharing the same `volComp` |

`lever` ↔ `rank` ↔ `who` are consistent throughout:
`Serve`→rank 0→`the bartender`; `Formulation`→rank 1→`the producer`;
`Fixed`→rank 9→`cannot change`; `Sacred`→rank 9→`protected recipe`.

#### 1.4.1 Aperol Spritz rows (`M.rows.ap`, 39 rows)

| id | comp | name | eff | w | dir | lever | rank | who | amt | share | unit | max | mid | volComp |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AP-001 | Aperol | Water | Watering Down | 3 | `+` | Fixed | 9 | cannot change | 60-70 % | 13.9286 | % | 1.54 | 65 | — |
| AP-002 | Aperol | Sugar | Sugar Reward | 3 | `+` | Formulation | 1 | the producer | 200-250 g/L | 4.8214 | g/L | 2 | 225 | — |
| AP-003 | Aperol | Ethanol | Speed of Absorption | 3 | `+` | Formulation | 1 | the producer | 11 % ABV | 2.3571 | % ABV | 1.36 | 11 | — |
| AP-004 | Aperol | Bitter orange essence | Smell Lift | 3 | `+` | Sacred | 9 | protected recipe | under 1 % | 0.1071 | % | 2 | 0.5 | — |
| AP-005 | Aperol | Gentian root | Bitter Kick | 3 | `+` | Sacred | 9 | protected recipe | under 1 % | 0.1071 | % | 2 | 0.5 | — |
| AP-006 | Aperol | Cinchona bark (quinine) | Bitter Kick | 2 | `+` | Sacred | 9 | protected recipe | under 0.1 % | 0.0107 | % | 2 | 0.05 | — |
| AP-007 | Aperol | Chinese rhubarb | Bitter Kick | 2 | `+` | Sacred | 9 | protected recipe | under 1 % | 0.1071 | % | 2 | 0.5 | — |
| AP-008 | Aperol | Sodium chloride | Bitterness Masking | 3 | `+` | Formulation | 1 | the producer | Trace | 0.0021 | (empty) | 2 | — | — |
| AP-009 | Aperol | E110 Sunset Yellow FCF | Colour Signal | 3 | `+` | Formulation | 1 | the producer | under 0.01 % | 0.0011 | % | 2 | 0.005 | — |
| AP-010 | Aperol | E124 Ponceau 4R | Colour Signal | 2 | `+` | Formulation | 1 | the producer | under 0.01 % | 0.0011 | % | 2 | 0.005 | — |
| AP-011 | Prosecco | Water | Watering Down | 3 | `+` | Fixed | 9 | cannot change | 85 % | 27.3214 | % | 1.18 | 85 | — |
| AP-012 | Prosecco | Glucose | Sugar Reward | 2 | `+` | Fixed | 9 | cannot change | 5-10 g/L | 0.2411 | g/L | 2 | 7.5 | — |
| AP-013 | Prosecco | Fructose | Sugar Reward | 2 | `+` | Fixed | 9 | cannot change | 5-10 g/L | 0.2411 | g/L | 2 | 7.5 | — |
| AP-014 | Prosecco | Ethanol | Speed of Absorption | 3 | `+` | Fixed | 9 | cannot change | 11-11.5 % ABV | 3.6161 | % ABV | 1.33 | 11.25 | — |
| AP-015 | Prosecco | Glycerol | Body and Texture | 2 | `+` | Fixed | 9 | cannot change | 5-10 g/L | 0.2411 | g/L | 2 | 7.5 | — |
| AP-016 | Prosecco | Carbon dioxide | Fizz Bite | 3 | `+` | Serve | 0 | the bartender | 10-12 g/L | 0.3536 | g/L | 2 | 11 | — |
| AP-017 | Prosecco | Tartaric acid | Sharp Acidity | 3 | `+` | Fixed | 9 | cannot change | 2-4 g/L | 0.0964 | g/L | 2 | 3 | — |
| AP-018 | Prosecco | Malic acid | Sharp Acidity | 2 | `+` | Fixed | 9 | cannot change | 1-3 g/L | 0.0643 | g/L | 2 | 2 | — |
| AP-019 | Prosecco | Citric acid | Sharp Acidity | 1 | `+` | Fixed | 9 | cannot change | 0.1-0.5 g/L | 0.0096 | g/L | 2 | 0.3 | — |
| AP-020 | Prosecco | Succinic acid | Sharp Acidity | 1 | `+` | Fixed | 9 | cannot change | 0.5-1 g/L | 0.0241 | g/L | 2 | 0.75 | — |
| AP-021 | Prosecco | Esters | Body and Texture | 2 | `+` | Fixed | 9 | cannot change | under 100 mg/L | 0.0016 | mg/L | 2 | 50 | — |
| AP-022 | Prosecco | Terpenes | Body and Texture | 1 | `+` | Fixed | 9 | cannot change | under 1 mg/L | 0 | mg/L | 2 | 0.5 | — |
| AP-023 | Prosecco | Norisoprenoids | Body and Texture | 1 | `+` | Fixed | 9 | cannot change | Trace | 0.0032 | (empty) | 2 | — | — |
| AP-024 | Prosecco | Phenolic compounds | Body and Texture | 2 | `+` | Fixed | 9 | cannot change | under 50 mg/L | 0.0008 | mg/L | 2 | 25 | — |
| AP-025 | Prosecco | Polyphenols | Body and Texture | 2 | `+` | Fixed | 9 | cannot change | under 50 mg/L | 0.0008 | mg/L | 2 | 25 | — |
| AP-026 | Prosecco | Sulfites | Body and Texture | 1 | `+` | Formulation | 1 | the producer | under 150 mg/L | 0.0024 | mg/L | 0.13 | 75 | — |
| AP-027 | Sparkling Water | Water | Watering Down | 3 | `+` | Serve | 0 | the bartender | 99 % | 10.6071 | % | 2.5 | 99 | Sparkling Water |
| AP-028 | Sparkling Water | Carbon dioxide | Fizz Bite | 3 | `+` | Serve | 0 | the bartender | 5-10 g/L | 0.0804 | g/L | 2.5 | 7.5 | Sparkling Water |
| AP-029 | Sparkling Water | Carbonic acid | Sharp Acidity | 2 | `+` | Serve | 0 | the bartender | Dynamic equilibrium with dissolved CO2 | 0.0011 | (empty) | 2.5 | — | Sparkling Water |
| AP-030 | Sparkling Water | Sodium bicarbonate | Bitterness Masking | 2 | `+` | Serve | 0 | the bartender | 20-50 mg/L | 0.0004 | mg/L | 2.5 | 35 | Sparkling Water |
| AP-031 | Sparkling Water | Sodium chloride | Bitterness Masking | 2 | `+` | Serve | 0 | the bartender | 10-30 mg/L | 0.0002 | mg/L | 2.5 | 20 | Sparkling Water |
| AP-032 | Sparkling Water | Potassium sulfate | Bitterness Masking | 1 | `-` | Serve | 0 | the bartender | 5-15 mg/L | 0.0001 | mg/L | 2.5 | 10 | Sparkling Water |
| AP-033 | Sparkling Water | Disodium phosphate | Bitterness Masking | 1 | `+` | Serve | 0 | the bartender | Trace | 0.0011 | (empty) | 2.5 | — | Sparkling Water |
| AP-034 | Ice | Water (frozen) | Cold Shock | 3 | `+` | Serve | 0 | the bartender | 99.9 % | 35.6786 | % | 2.5 | 99.9 | Ice |
| AP-035 | Ice | Water (melt) | Watering Down | 3 | `+` | Serve | 0 | the bartender | Progressive over 15-20 min | 0.0036 | (empty) | 2.5 | — | Ice |
| AP-036 | Ice | Trace minerals (source water) | Bitterness Masking | 1 | `+` | Fixed | 9 | cannot change | Trace; composition varies by supply | 0.0036 | (empty) | 2.5 | — | Ice |
| AP-037 | Serve | Glass (wine bowl) | Smell Lift | 3 | `+` | Serve | 0 | the bartender | 200 g | — | g | 2 | 200 | — |
| AP-038 | Serve | Orange slice | Smell Lift | 3 | `+` | Serve | 0 | the bartender | 1 slice | — | slice | 2 | 1 | — |
| AP-039 | Serve | Condensation | Cold Shock | 1 | `+` | Serve | 0 | the bartender | Variable with ambient conditions | — | (empty) | 2 | — | — |

#### 1.4.2 Peroni rows (`M.rows.pe`, 27 rows)

| id | comp | name | eff | w | dir | lever | rank | who | amt | share | unit | max | mid | volComp |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PE-001 | Beer | Water | Watering Down | 3 | `+` | Fixed | 9 | cannot change | 90-95 % | 92.5 | % | 1.08 | 92.5 | — |
| PE-002 | Beer | Calcium (Ca2+) | Bitterness Masking | 2 | `+` | Fixed | 9 | cannot change | 50-100 mg/L | 0.0075 | mg/L | 2 | 75 | — |
| PE-003 | Beer | Magnesium (Mg2+) | Bitterness Masking | 1 | `-` | Fixed | 9 | cannot change | 10-20 mg/L | 0.0015 | mg/L | 2 | 15 | — |
| PE-004 | Beer | Sulfate (SO4 2-) | Bitter Kick | 2 | `+` | Fixed | 9 | cannot change | 150-250 mg/L | 0.02 | mg/L | 2 | 200 | — |
| PE-005 | Beer | Chloride (Cl-) | Bitterness Masking | 2 | `+` | Fixed | 9 | cannot change | 50-100 mg/L | 0.0075 | mg/L | 2 | 75 | — |
| PE-006 | Beer | Bicarbonate (HCO3-) | Bitterness Masking | 2 | `+` | Fixed | 9 | cannot change | under 50 mg/L | 0.0025 | mg/L | 2 | 25 | — |
| PE-007 | Beer | Malted barley (Pilsner malt) | Sugar Reward | 3 | `+` | Formulation | 1 | the producer | 60-70 % | 65 | % | 1.54 | 65 | — |
| PE-008 | Beer | Italian maize (Nostrano dell'Isola) | Sugar Reward | 2 | `+` | Formulation | 1 | the producer | 30-40 % | 35 | % | 2 | 35 | — |
| PE-009 | Beer | Maltose | Sugar Reward | 2 | `+` | Formulation | 1 | the producer | 10-15 g/L | 1.25 | g/L | 2 | 12.5 | — |
| PE-010 | Beer | Dextrins | Body and Texture | 3 | `+` | Formulation | 1 | the producer | 15-25 g/L | 2 | g/L | 2 | 20 | — |
| PE-011 | Beer | Proteins and amino acids | Body and Texture | 2 | `+` | Formulation | 1 | the producer | 2-4 g/L | 0.3 | g/L | 2 | 3 | — |
| PE-012 | Beer | Melanoidins | Colour Signal | 2 | `+` | Formulation | 1 | the producer | Trace | 0.01 | (empty) | 2 | — | — |
| PE-013 | Beer | Dimethyl sulfide (DMS) | Body and Texture | 1 | `-` | Formulation | 1 | the producer | under 30 ppb | 0 | ppb | 2 | 15 | — |
| PE-014 | Beer | Saaz-Tettnang hops | Bitter Kick | 3 | `+` | Formulation | 1 | the producer | 15-20 IBU | — | IBU | 2 | 17.5 | — |
| PE-015 | Beer | Iso-alpha acids | Bitter Kick | 3 | `+` | Formulation | 1 | the producer | 15-20 mg/L | 0.0018 | mg/L | 2 | 17.5 | — |
| PE-016 | Beer | Linalool | Smell Lift | 2 | `+` | Formulation | 1 | the producer | Trace | 0.01 | (empty) | 2 | — | — |
| PE-017 | Beer | Farnesene | Smell Lift | 1 | `+` | Formulation | 1 | the producer | Trace | 0.01 | (empty) | 2 | — | — |
| PE-018 | Beer | Lager yeast | Speed of Absorption | 2 | `+` | Fixed | 9 | cannot change | Removed via filtration | 0.01 | (empty) | 2 | — | — |
| PE-019 | Beer | Ethanol | Speed of Absorption | 3 | `+` | Formulation | 1 | the producer | 5.1 % ABV | 5.1 | % ABV | 2 | 5.1 | — |
| PE-020 | Beer | Esters | Smell Lift | 1 | `+` | Formulation | 1 | the producer | under 15 mg/L | 0.0008 | mg/L | 2 | 7.5 | — |
| PE-021 | Beer | Higher alcohols | Body and Texture | 1 | `-` | Formulation | 1 | the producer | under 50 mg/L | 0.0025 | mg/L | 2 | 25 | — |
| PE-022 | Beer | Sulfur dioxide (SO2) | Body and Texture | 1 | `+` | Formulation | 1 | the producer | under 10 mg/L | 0.0005 | mg/L | 2 | 5 | — |
| PE-023 | Beer | Carbon dioxide | Fizz Bite | 3 | `+` | Formulation | 1 | the producer | 5-5.5 g/L | 0.525 | g/L | 2 | 5.25 | — |
| PE-024 | Serve | Glass (tall pilsner) | Cold Shock | 2 | `+` | Serve | 0 | the bartender | 330-500 ml | — | ml | 2 | 415 | — |
| PE-025 | Serve | Foam head | Fizz Bite | 3 | `-` | Serve | 0 | the bartender | 2-3 cm | — | cm | 2 | 2.5 | — |
| PE-026 | Serve | Condensation | Cold Shock | 1 | `+` | Serve | 0 | the bartender | Variable with ambient conditions | — | (empty) | 2 | — | — |
| PE-027 | Serve | Lime wedge (optional) | Smell Lift | 1 | `+` | Serve | 0 | the bartender | 1 wedge | — | wedge | 2 | 1 | — |

**Coverage / walled-dial consequences (derived, must match):**

| effect | ap rows | ap movable | pe rows | pe movable |
|---|---|---|---|---|
| Cold Shock | 2 | 2 | 2 | 2 |
| Colour Signal | 2 | 2 | 1 | 1 |
| Smell Lift | 3 | 2 | 4 | 4 |
| Fizz Bite | 2 | 2 | 2 | 2 |
| Bitter Kick | 3 | **0 (walled)** | 3 | 2 |
| Sharp Acidity | 5 | 1 | **0 (absent)** | — |
| Bitterness Masking | 6 | 5 | 4 | **0 (walled)** |
| Speed of Absorption | 2 | 1 | 2 | 1 |
| Sugar Reward | 3 | 1 | 3 | 3 |
| Watering Down | 4 | 2 | 1 | **0 (walled)** |
| Body and Texture | 7 | 1 | 5 | 5 |

- **Aperol Spritz:** `Bitter Kick` has zero movable rows — all three (Gentian root, Cinchona bark,
  Chinese rhubarb) are `Sacred`. The "More bitter" dial renders with the `blocked` class and the
  CSS `▲ walled` suffix, and can only ever act through the routing fallback.
- **Peroni:** `Bitterness Masking` has zero movable rows → "Smoother" is walled.
  `Watering Down` also has zero movable rows, but Peroni has no "Longer serve" dial, so it is
  invisible. `Sharp Acidity` has no Peroni rows at all, so the effect is dropped from every
  Peroni computation, meter average, table and side-effect list (guarded by
  `es[e.name]!==undefined` everywhere).

### 1.5 Dependency rules (`M.combos`, 12 entries)

Directional: combo `{a, b, res, mag, drink}` means **a modulates b**. `res` ∈ `Boosts`|`Dampens`.
`mag` ∈ `Strong` (K=0.35) | `Moderate` (K=0.20). `drink` gates applicability:

```js
const dn = c.drink!=='Both' && ((drink==='ap') !== (c.drink==='Aperol Spritz'));
if(dn) return;   // combo does not apply to the current drink
```

| # | a (source) | b (target) | res | mag | drink |
|---|---|---|---|---|---|
| 0 | Bitterness Masking | Bitter Kick | Dampens | Strong | Aperol Spritz |
| 1 | Cold Shock | Sugar Reward | Dampens | Strong | Both |
| 2 | Cold Shock | Bitter Kick | Dampens | Strong | Aperol Spritz |
| 3 | Fizz Bite | Speed of Absorption | Boosts | Strong | Both |
| 4 | Sugar Reward | Speed of Absorption | Boosts | Moderate | Aperol Spritz |
| 5 | Watering Down | Cold Shock | Dampens | Strong | Aperol Spritz |
| 6 | Smell Lift | Colour Signal | Boosts | Moderate | Aperol Spritz |
| 7 | Fizz Bite | Smell Lift | Dampens | Moderate | Peroni |
| 8 | Bitterness Masking | Fizz Bite | Dampens | Moderate | Aperol Spritz |
| 9 | Sharp Acidity | Sugar Reward | Dampens | Moderate | Aperol Spritz |
| 10 | Bitterness Masking | Sugar Reward | Boosts | Moderate | Both |
| 11 | Bitter Kick | Body and Texture | Boosts | Moderate | Peroni |

Each combo also carries a `what` paragraph (§9.8) which the POC **never renders**.

### 1.6 `M.change` — side-effect verb pairs `[up, down]`

| effect | up | down |
|---|---|---|
| Cold Shock | colder | warmer |
| Colour Signal | brighter | paler |
| Smell Lift | more aromatic | less aromatic |
| Fizz Bite | sharper on the tongue | flatter |
| Bitterness Masking | smoother | harsher |
| Body and Texture | fuller | thinner |
| Bitter Kick | more bitter | less bitter |
| Sharp Acidity | more acidic | softer on acid |
| Sugar Reward | sweeter | drier |
| Speed of Absorption | quicker to hit | slower to hit |
| Watering Down | more diluted across the session | less diluted across the session |

---

## 2. The maths

### 2.1 `raw(mult)` — mechanical score per effect

```js
function raw(mult){
  const rows=M.rows[drink],an=anchor(),by={};
  rows.forEach(r=>{(by[r.eff]=by[r.eff]||[]).push(r)});
  const out={};
  for(const eff in by){
    const tot=m=>{
      const v=by[eff].map(r=>r.w*(m[r.id]===undefined?1:m[r.id])*(r.dir==='+'?1:-1));
      const pos=v.filter(x=>x>0).sort((a,b)=>b-a),neg=v.filter(x=>x<0).reduce((a,b)=>a+b,0);
      let s;const R=rule[eff];
      if(R==='Each one adds fully')s=pos.reduce((a,b)=>a+b,0);
      else if(R==='Each one adds less than the last')s=pos.reduce((a,b,i)=>a+b*Math.pow(0.6,i),0);
      else s=pos.length?pos[0]:0;return s+neg};
    const b=tot({}),n=tot(mult);
    out[eff]=Math.max(0,Math.min(10,an[eff]*(b?n/b:1)));
  }
  return out;
}
```

Rules, precisely:
- **`Each one adds fully`** — plain sum of positive terms.
- **`Each one adds less than the last`** — positives sorted **descending**, then
  `Σ vᵢ · 0.6ⁱ` (i from 0). Diminishing returns.
- **`Only the strongest counts`** (the `else` branch) — `max(positives)`, or 0 if none.
- Negative terms (`dir:'-'`) are **always summed in full**, outside the rule, and added at the end.
- Result is `baseline × (moved / unmoved)`, clamped to `[0,10]`. An effect with no rows in the
  current drink never appears as a key in the output object.

### 2.2 `perceived(mult)` — interaction layer, normalised so baseline is unchanged

```js
function perceived(mult){
  const rw=raw(mult), rb=raw({}), out={};
  const adj=src=>{const a={};for(const k in src)a[k]=1;
    M.combos.forEach(c=>{ if(src[c.a]===undefined||src[c.b]===undefined)return;
      const dn=c.drink!=='Both'&&((drink==='ap')!==(c.drink==='Aperol Spritz'));if(dn)return;
      const k=K[c.mag]*(src[c.a]/10);
      a[c.b]*= c.res==='Dampens' ? (1-k) : (1+k); });
    return a};
  const an=adj(rw), ab=adj(rb);
  for(const k in rw) out[k]=Math.max(0,Math.min(10, rw[k]*(an[k]/ab[k])));
  return out;
}
```

Key property: modulation strength is proportional to the **source effect's own current score**
(`src[c.a]/10`), and the whole thing is expressed as a **ratio against the baseline's own
modulation** — so with `mult={}` the output is exactly `raw({})`. Combos are applied
multiplicatively and independently; order does not matter; there is **no iteration to fixed point**
(a combo reads the pre-modulation `raw` value of its source, not the modulated one).

`perceived({})` is the "As served" vector. `perceived(mv)` is the "Now" vector.

---

## 3. Dials (outcome asks)

Source: `M.goals[drink]`, an array of `[label, effectName, direction]`. **`direction` is always
`"up"` and is never read by the code** — dials are bidirectional via the slider.

Every dial has identical mechanics:

| property | value |
|---|---|
| DOM id | `dr-s{i}` (row), `dr-v{i}` (value readout); input carries `data-i="{i}"` |
| control | `<input type="range" min="25" max="175" step="5" value="100">` |
| range | 25 – 175 in steps of 5 → multiplier **0.25 – 1.75**, step 0.05 |
| default | 100 → multiplier **1.00** ("as served") |
| writes | `want[effectName] = value/100` |
| dead zone | `Math.abs(f-1)<0.02` reads as unchanged everywhere |
| walled marker | row gets class `blocked` when the effect has **0 rows with `rank<9`** |

Value readout string: `Math.abs(f-1)<0.02 ? 'as served' : (f>1?'+':'')+Math.round((f-1)*100)+'%'`.

`oninput` sets `want`, updates the readout, calls `render()`. There is no debounce.

### 3.1 Aperol Spritz dials (`M.goals.ap`, 11)

| i | label | effect moved | movable rows | walled? |
|---|---|---|---|---|
| 0 | Bolder colour | Colour Signal | 2 | no |
| 1 | Sweeter | Sugar Reward | 1 | no |
| 2 | More bitter | Bitter Kick | 0 | **yes — `▲ walled`** |
| 3 | Sharper | Sharp Acidity | 1 | no |
| 4 | Colder | Cold Shock | 2 | no |
| 5 | Fizzier | Fizz Bite | 2 | no |
| 6 | Boozier | Speed of Absorption | 1 | no |
| 7 | More aromatic | Smell Lift | 2 | no |
| 8 | Fuller bodied | Body and Texture | 1 | no |
| 9 | Smoother | Bitterness Masking | 5 | no |
| 10 | Longer serve | Watering Down | 2 | no |

### 3.2 Peroni dials (`M.goals.pe`, 9)

| i | label | effect moved | movable rows | walled? |
|---|---|---|---|---|
| 0 | Bolder colour | Colour Signal | 1 | no |
| 1 | Sweeter | Sugar Reward | 3 | no |
| 2 | More bitter | Bitter Kick | 2 | no |
| 3 | Colder | Cold Shock | 2 | no |
| 4 | Fizzier | Fizz Bite | 2 | no |
| 5 | Boozier | Speed of Absorption | 1 | no |
| 6 | More aromatic | Smell Lift | 4 | no |
| 7 | Fuller bodied | Body and Texture | 5 | no |
| 8 | Smoother | Bitterness Masking | 0 | **yes — `▲ walled`** |

Peroni has no "Sharper" and no "Longer serve" dial.

### 3.3 What a dial actually moves

A dial writes **only** `want[effect]=f`. It never names an ingredient. The ingredient moves are
derived entirely by `solve()` (§4) at render time. There is no per-dial hand-authored mapping.

---

## 4. Market brief presets

Presets are hardcoded inside `dials()` as `PRE`, per drink. Clicking one **replaces** `want`
wholesale (`want={}; Object.assign(want, PRE[i][1])`), then writes every slider position and
readout from `want` (missing effects → 100 / "as served"), then re-renders.

### 4.1 Aperol Spritz presets

| # | button label | dial values set |
|---|---|---|
| 0 | `As served` | *(none — resets everything to 1.00)* |
| 1 | `Germany: more bitter, less sweet` | Bitter Kick 1.5, Sugar Reward 0.6 |
| 2 | `Brazil: colder, longer serve` | Cold Shock 1.4, Watering Down 1.4 |
| 3 | `Low sugar reformulation` | Sugar Reward 0.4 |
| 4 | `Clean label, no dyes` | Colour Signal 0.1 |
| 5 | `Session strength` | Speed of Absorption 0.6, Watering Down 1.4 |

### 4.2 Peroni presets

| # | button label | dial values set |
|---|---|---|
| 0 | `As served` | *(none)* |
| 1 | `Hoppier` | Bitter Kick 1.5 |
| 2 | `Fuller` | Body and Texture 1.5 |
| 3 | `Lighter` | Body and Texture 0.5, Speed of Absorption 0.7 |

Verbatim source:

```js
const PRE = drink==='ap'
 ?[['As served',{}],
   ['Germany: more bitter, less sweet',{'Bitter Kick':1.5,'Sugar Reward':0.6}],
   ['Brazil: colder, longer serve',{'Cold Shock':1.4,'Watering Down':1.4}],
   ['Low sugar reformulation',{'Sugar Reward':0.4}],
   ['Clean label, no dyes',{'Colour Signal':0.1}],
   ['Session strength',{'Speed of Absorption':0.6,'Watering Down':1.4}]]
 :[['As served',{}],['Hoppier',{'Bitter Kick':1.5}],['Fuller',{'Body and Texture':1.5}],
   ['Lighter',{'Body and Texture':0.5,'Speed of Absorption':0.7}]];
```

> **Preset value 0.1 / 1.5 exceed no bound** — the slider range is 0.25–1.75, so
> `Clean label, no dyes` (0.1) sets a `want` value the slider itself cannot reach. The slider is
> written `Math.round(0.1*100)=10`, which the browser clamps to `min=25` visually, but `want`
> keeps **0.1** and the model uses 0.1. Preserve this asymmetry or the preset changes meaning.

---

## 5. Routing: from an outcome ask to ingredient changes

`solve(effect, target)` returns `{moves, route, wall, blocked}`.

### 5.1 Step 1 — direct levers

```js
const rows=M.rows[drink].filter(r=>r.eff===effect);
const movable=rows.filter(r=>r.rank<9);
```

If `movable` is non-empty:

1. `f = clamp(target, 0, 2)` — the direct-lever ask, hard-capped at 2× regardless of preset.
2. For each movable row `r`: `lim = r.max ?? 2`; `g = min(f, lim)`; `moves[r.id] = g`.
   If `f > lim + 0.01`, the row is recorded in `capped`.
3. **Volume coupling:** if `r.volComp` is set, every row in the drink (movable *or walled*)
   with the same `volComp` also gets `moves[o.id] = g`. This is how "more ice" drags the
   melt-water and trace minerals with it, and "more soda" drags all six sparkling-water rows.
4. One route entry is pushed (copy in §9.3).

`route.capped = capped` is assigned onto the array but **never read**. The capped copy that is
actually rendered comes from the `cap` property on the route entry.

### 5.2 Step 2 — how far did the levers really travel

Reach is measured on the **weight sum**, not the clamped score, deliberately:

```js
const wsum=m=>{ /* identical rule maths to raw(), restricted to this effect's rows */ };
const wb=wsum({}), reach=(movable.length&&wb)?wsum(moves)/wb:1;
```

If there are no movable rows at all, `reach = 1` (nothing moved).

### 5.3 Step 3 — ceiling

```js
const anch=anchor()[effect];
const tCap=Math.max(0,Math.min(target, anch?10/anch:target));
const atCeiling=(target>tCap+0.02);
```

`tCap` is the target the 0–10 scale can actually express. For Colour Signal on the spritz
(baseline 10) `tCap` is 1.0 — the dial cannot make it bolder at all, only paler.
In-code comment, verbatim:

```
// you cannot push an effect past 10 or below 0, so aim at what the scale actually allows.
// capping the target keeps this continuous; gating on it produced a cliff.
```

### 5.4 Step 4 — is the direct path short?

```js
const short=(tCap>1)?(reach<tCap-0.08):(tCap<1?(reach>tCap+0.08):false);
```

Asymmetric on purpose: **only shortfall triggers the fallback. Overshoot does not.**
In-code comment: `// only route around it if the direct levers fall SHORT. overshooting needs no help.`

### 5.5 Step 5 — the fallback route (route-around via dependency rules)

Runs only when `short`. For every combo whose **target** `c.b` is the asked effect, and which
applies to the current drink:

```js
const src=M.rows[drink].filter(r=>r.eff===c.a&&r.rank<9);
if(!src.length)return;                       // the modulator is itself walled — no help
const up=tCap>1;
const gap=Math.min(1,Math.abs(tCap-reach)/Math.max(0.35,Math.abs(tCap-1)||1));
const pull=0.75*gap;                         // 0 at the boundary, 0.75 when fully short
const f=(c.res==='Dampens')===up ? 1-pull : 1+pull;
src.forEach(r=>{if(moves[r.id]===undefined)moves[r.id]=f});
```

Semantics:
- `gap` — fraction of the requested move still unachieved, normalised by the size of the request
  (floor 0.35 so tiny asks don't produce huge pulls). Clamped to 1.
- `pull` — up to 0.75, i.e. the fallback multiplier lands in **[0.25, 1.75]**.
- Direction: to push an effect **up**, you *lower* its dampeners and *raise* its boosters; to push
  it **down**, the reverse. `(c.res==='Dampens')===up ? 1-pull : 1+pull`.
- `if(moves[r.id]===undefined)` — the direct path always wins over the fallback for the same row
  within one `solve()` call.

### 5.6 Step 6 — the wall explanation

Also only when `short`:

```js
const sac=blocked.filter(r=>r.lever==='Sacred'), fix=blocked.filter(r=>r.lever==='Fixed');
const noPour=['Speed of Absorption','Sugar Reward','Bitter Kick'].indexOf(effect)>=0;
```

- `Sacred` rows → "protected recipe" clause.
- `Fixed` rows → "cannot be changed at all" clause.
- Both clauses `join`ed into `wall`.
- Additionally, for the **Aperol Spritz only**, if the asked effect is one of
  `Speed of Absorption`, `Sugar Reward`, `Bitter Kick`, a third sentence about the missing
  pour-ratio lever is appended (copy in §9.3).

`wall` stays `null` when the direct path was sufficient — a walled ingredient that never mattered
is never mentioned.

### 5.7 Which ingredients are protected / walled

"Walled" = `rank >= 9`, which is exactly `lever ∈ {Sacred, Fixed}`.

| lever | rank | `who` | meaning | can a dial move it? |
|---|---|---|---|---|
| `Serve` | 0 | the bartender | bar-side decision | yes |
| `Formulation` | 1 | the producer | recipe change | yes |
| `Sacred` | 9 | protected recipe | brand-protected botanical | **never directly** |
| `Fixed` | 9 | cannot change | physically what the ingredient is | **never directly** |

Aperol Spritz `Sacred` rows: AP-004 Bitter orange essence, AP-005 Gentian root,
AP-006 Cinchona bark (quinine), AP-007 Chinese rhubarb. Peroni has **no** `Sacred` rows.

**One exception to "never directly":** a walled row is moved if it shares a `volComp` with a moved
row (§5.1 step 3) — e.g. AP-036 Trace minerals (`Fixed`, `volComp: "Ice"`) moves whenever ice moves.
This is the only path by which a `rank 9` row ever appears in the ledger.

The static caption under the title states the intent verbatim:
`No dial touches a protected ingredient.`

---

## 6. Combining asks — `allMoves()` and clash detection

```js
function allMoves(){
  let mv={},owner={},routes=[],walls=[],clash=[];
  for(const eff in want){
    const t=want[eff]; if(Math.abs(t-1)<0.02) continue;
    const s=solve(eff,t);
    for(const id in s.moves){
      if(owner[id]!==undefined && Math.abs(mv[id]-s.moves[id])>0.3){
        const nm=(M.rows[drink].find(r=>r.id===id)||{}).name||id;
        clash.push({ing:nm,a:owner[id],b:eff,va:mv[id],vb:s.moves[id]});
      }
      mv[id]=s.moves[id]; owner[id]=eff;
    }
    routes.push({eff,...s});
    if(s.wall)walls.push({eff,wall:s.wall});
  }
  const bag={};
  clash.forEach(c=>{const k=c.a+'|'+c.b+'|'+c.va+'|'+c.vb;
    (bag[k]=bag[k]||{a:c.a,b:c.b,va:c.va,vb:c.vb,ings:[]}).ings.push(c.ing);});
  return {mv,routes,walls,clash:Object.values(bag),owner};
}
```

### 6.1 Clash rule — exactly

Two asks are declared to fight **iff**:

1. Both asks are active (`|want-1| >= 0.02`), and
2. `solve()` for both produced a move for the **same ingredient id**, and
3. the two proposed multipliers differ by **more than 0.3** in absolute value.

A difference of ≤ 0.3 is silently absorbed (last writer still wins, no warning). Note it is *not*
required that the two moves pull in opposite directions relative to 1.0 — 1.0 vs 1.4 clashes;
0.8 vs 1.05 does not.

### 6.2 Resolution

**Last ask wins.** Iteration order is `for(const eff in want)`, i.e. JS object insertion order of
`want`. Insertion order comes from the order the user first touched each dial (or, after a preset,
the literal key order in the preset object). `mv[id]` and `owner[id]` are both overwritten by the
later ask, so the later ask also takes credit in the "Because you asked for" column.

### 6.3 Deduplication

Clashes are bucketed on the tuple `(a, b, va, vb)`; all ingredient names sharing that tuple
collapse into one `ings` array and one rendered sentence. With more than 2 ingredients the names
are replaced by a count (§9.5).

### 6.4 Effect names → dial labels for display

```js
const dial=e=>{const g=(M.goals[drink].find(x=>x[1]===e)||[])[0];return (g||e).toLowerCase()};
```

Falls back to the lowercased effect name when no dial exists for it.

---

## 7. The ledger, the glass, and side effects

### 7.1 Glass composition (`As served` vs `Now` columns)

```js
const COL={Aperol:'#e8622a',Prosecco:'#d7c96a',"Sparkling Water":'#9fc7d6',Ice:'#cfe3ea',
           Serve:'#8a8a8a',Beer:'#d9a441'};
```

```js
const sum=(m)=>{const o={},bs={};comps.forEach(c=>{o[c]=0;bs[c]=0});
  rowsD.forEach(r=>{if(r.share==null)return;
    const f=m[r.id]===undefined?1:m[r.id];
    o[r.comp]+=r.share*f; bs[r.comp]+=r.share;});
  comps.forEach(c=>{
    const serveMoved=rowsD.some(r=>r.comp===c&&(r.volComp||r.lever==='Serve')&&m[r.id]!==undefined&&Math.abs(m[r.id]-1)>0.02);
    if(!serveMoved&&o[c]>0) o[c]=bs[c];   // renormalised: the pour did not get bigger
  });
  const t=Object.values(o).reduce((a,b)=>a+b,0)||1;
  comps.forEach(c=>o[c]=o[c]/t*100);return o};
const A=sum({}),B=sum(mv);
```

The load-bearing rule, verbatim in-code:

```
// A pour is a fixed volume. Changing what is inside a component displaces the rest of
// that component; only a serve decision changes how much of the component is in the glass.
```

So: a **Formulation** change (producer changing the recipe) leaves the component's height in the
glass **unchanged** — it is reset to its baseline share `bs[c]`. Only a **Serve** change or a
`volComp` change actually resizes a component. Finally all components are normalised to 100%.

Bar rendering (`draw`): components with height `< 0.15%` are omitted; a block is marked changed
(class `chg`, "outlined") when `|B[c] - A[c]| > 0.4`; the label text only appears when height `> 4`.
Every block carries a `title` tooltip.

Legend shows components where `A[c] > 0.05 || B[c] > 0.05`. Rows with `share == null`
(no volume) are listed separately by name — for the spritz that is
*glass (wine bowl), orange slice, condensation*; for Peroni
*Saaz-Tettnang hops, glass (tall pilsner), foam head, condensation, lime wedge (optional)*.

### 7.2 Ledger table

Rendered rows: `mv[r.id] !== undefined && Math.abs(mv[r.id]-1) > 0.02`,
sorted by `|mv-1|` **descending** (biggest change first).

| column header | value |
|---|---|
| `Ingredient` | `r.name` + a muted `r.comp` |
| `As served` | `r.amt` — the authored string, verbatim, never computed |
| `Now` | see below |
| `Because you asked for` | `owner[r.id]` — the **effect name** (e.g. `Bitter Kick`), *not* the dial label. Empty string if absent |
| `Who signs it off` | `r.who`, verbatim |

"Now" computation:

```js
const f=mv[r.id];
let now;
if(f===0) now='removed';
else if(r.mid!=null&&r.unit) now=(+(r.mid*f).toPrecision(3))+' '+r.unit+' ('+Math.round(f*100)+'%)';
else now=Math.round(f*100)+'%';
```

- `f===0` → literal `removed`, and the cell gets the `gone` class.
- Numeric path requires **both** a non-null `mid` and a non-empty `unit`. `3 significant figures`,
  then `+` to strip trailing zeros. E.g. Sugar at 0.6 → `135 g/L (60%)`.
- Rows with `unit: ""` (Trace / Dynamic equilibrium / Progressive / Variable) or `mid: null` fall
  through to the bare percentage.

**"Who signs it off" is purely `r.who`, decided by the row's `lever`:**
`Serve → the bartender`, `Formulation → the producer`, `Fixed → cannot change`,
`Sacred → protected recipe`. There is no run-time logic; it is a data lookup. A `cannot change` or
`protected recipe` value can only appear in the ledger via `volComp` coupling (§5.7).

### 7.3 The displacement note under the glass

Shown iff at least one **ledger** row has `lever === 'Formulation'`. It names the unique
components of those rows (§9.6).

### 7.4 "What else moved" (side effects)

```js
const sd=[];for(const k in es){if(want[k]!==undefined&&Math.abs(want[k]-1)>=0.02)continue;
  if(Math.abs(es[k]-base[k])>=0.4)sd.push([k,es[k]-base[k]]);}
sd.sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]));
```

- Iterates the **perceived** vector, so it captures both routing side-effects *and* combo
  spill-over.
- Excludes any effect the user actively asked for (`|want-1| >= 0.02`). An effect whose dial exists
  but sits at 100% **is** eligible.
- Threshold: `|Δ| >= 0.4` on the 0–10 scale.
- Sorted by absolute magnitude descending, **top 4 only**, mapped through `M.change[k][Δ>0?0:1]`
  and `join`ed.

### 7.5 "Every effect, as served against now" table

Every effect present in the current drink, with `base` and `es` at 1 decimal place.
Row gets class `mv` when `|es - base| >= 0.4` (same threshold as side effects).

---

## 8. The narrative paragraph — `build(es)`

### 8.1 Group scores and hysteresis

```js
const g = /* per group: mean of member effects present in es, rounded to 1dp */;
const gb=base0(); const DEAD=0.2;
const gx=Object.fromEntries(M.groups.map(k=>[k,Math.abs(g[k]-gb[k])<DEAD?gb[k]:g[k]]));
const bs=M.groups.map(x=>band(gx[x]));
```

Verbatim comment: `// hold the wording steady until a group has moved enough to mean something`.
Group score must move **≥ 0.2** from its as-served value before the wording is allowed to change.
Note the meters display `st.g` (raw), while the copy uses `gx` (dead-banded) — so a number can
tick without the sentence changing. Preserve that.

### 8.2 Archetype

```js
const arch=M.archetype[M.groups.map(x=>gx[x]>=M.strongAt?'1':'0').join('')];
```

Three-bit key in group order `[What You Notice, What Your Body Does, Where It Goes]`,
bit set when the dead-banded group score `>= 7.5`.

### 8.3 Effect naming inside `{effects}` frames — anti-flicker

```js
const e0=baseE0();
const pool=M.effects.filter(e=>e.group===gn&&es[e.name]!==undefined);
const held=pool.slice().sort((a,b)=>e0[b.name]-e0[a.name]||a.name.localeCompare(b.name))
               .slice(0,2).map(e=>e.name);
const rank=e=>es[e.name]+(held.indexOf(e.name)>=0?1.0:0);
const pick=pool.slice().sort((a,b)=>rank(b)-rank(a)||a.name.localeCompare(b.name)).slice(0,2);
const ord=pool.slice().sort((a,b)=>e0[b.name]-e0[a.name]||a.name.localeCompare(b.name)).map(e=>e.name);
const mine=pick.sort((a,b)=>ord.indexOf(a.name)-ord.indexOf(b.name)).map(e=>e.short);
f=f.replace('{effects}',join(mine));
```

Verbatim comments:
```
// whoever was named in the real drink keeps the spot until properly overtaken,
// otherwise five effects tied on 9 swap places on every pixel of drag
```
```
// keep them in a fixed order so the pair never simply swaps round
```

Three mechanisms, all necessary:
1. **Incumbency bonus** — the two effects that top the *as-served* ranking get `+1.0` added to
   their current score for selection purposes.
2. **Deterministic tie-break** — `a.name.localeCompare(b.name)` on ties, everywhere.
3. **Stable presentation order** — the chosen pair is re-sorted into as-served ranking order, so
   the two names never merely swap position.

`{effects}` is substituted with `join(shorts)` → e.g. `the colour and the cold`.

### 8.4 Signature sentence per group

```js
const sg=M.signature[gn];
if(es[sg[0]]!==undefined){const b0=baseE0()[sg[0]],v=es[sg[0]];
  const vx=Math.abs(v-b0)<0.3?b0:v; cl.push(vx>=6?sg[1]:sg[2]);}
```

Each group has one *signature effect*; a 0.3 dead band against as-served, then a hard threshold at
**6.0** picks the "high" or "low" sentence.

| group | signature effect | high (`>= 6`) | low (`< 6`) |
|---|---|---|---|
| What You Notice | Colour Signal | sentence [1] | sentence [2] |
| What Your Body Does | Bitter Kick | sentence [1] | sentence [2] |
| Where It Goes | Watering Down | sentence [1] | sentence [2] |

### 8.5 Assembled clause list

`cl` is built in this exact order:

1. `nm + ' is ' + arch + '.'`  (`nm` = `The Aperol Spritz` or `Peroni`)
2. `frames['What You Notice'][band]`
3. `signature['What You Notice'][high|low]` *(if the signature effect exists in this drink)*
4. `frames['What Your Body Does'][band]`
5. `signature['What Your Body Does'][high|low]`
6. `frames['Where It Goes'][band]`
7. `signature['Where It Goes'][high|low]`

Rendered joined with a single space, each clause in a `<span class="cl">`. A clause that differs
from the same index in the as-served build gets `class="cl hit"` (highlighted). The count of
differing clauses drives the key line (§9.2).

---

## 9. VERBATIM copy inventory

Every user-facing string, character for character. Placeholders are shown as
`{name}` only where the source itself uses that literal token (`{effects}`); everything else is
shown as the actual JS concatenation so nothing is lost.

### 9.1 Static HTML — headings, labels, table headers

```html
<h2 class="rg-t">What if the drink were&hellip;</h2>
<div class="rg-sub">Ask for an outcome. The model works out which levers can get you there, and tells you when none can.</div>
<div class="rg-note">Deliberately unstyled. A rig for checking the rule, not a design. No dial touches a protected ingredient.</div>
```

```html
<button id="dr-bap" class="on">Aperol Spritz</button><button id="dr-bpe">Peroni</button>
```

```html
<p class="rg-lab">Market briefs</p>
<p class="rg-lab">Or ask for something</p>
```

```html
<div class="box" id="dr-route"><h3>How it got there</h3>
<div class="box" id="dr-comp"><h3>What this does to the drink</h3>
<div class="gl-h">As served</div>
<div class="gl-h">Now</div>
<div class="box mini" id="dr-clash" style="display:none"><h3>These asks fight each other</h3>
<div class="box" id="dr-side"><h3>What else moved</h3>
```

Ledger table header:

```html
<table style="margin-top:10px"><thead><tr><th>Ingredient</th><th>As served</th>
<th class="n">Now</th><th>Because you asked for</th><th>Who signs it off</th></tr></thead>
```

Effects disclosure:

```html
<details><summary>Every effect, as served against now</summary>
 <table><thead><tr><th>Effect</th><th>Group</th><th class="n">Served</th><th class="n">Now</th></tr></thead>
```

Full static skeleton, verbatim (whitespace as in source, single line unwrapped for readability):

```html
<div class="rg-in"> <h2 class="rg-t">What if the drink were&hellip;</h2> <div class="rg-sub">Ask for an outcome. The model works out which levers can get you there, and tells you when none can.</div> <div class="rg-note">Deliberately unstyled. A rig for checking the rule, not a design. No dial touches a protected ingredient.</div> <div class="rg-cols">  <div class="rg-panel">   <div class="rg-tog"><button id="dr-bap" class="on">Aperol Spritz</button><button id="dr-bpe">Peroni</button></div>   <p class="rg-lab">Market briefs</p><div class="rg-pre" id="dr-presets"></div>   <p class="rg-lab">Or ask for something</p><div id="dr-dials"></div>  </div>  <div>   <div class="hero"><p id="dr-para"></p><div class="key" id="dr-key"></div></div>   <div class="rg-met" id="dr-meters"></div>   <div class="box" id="dr-route"><h3>How it got there</h3><div id="dr-routebody"></div></div>   <div class="box" id="dr-comp"><h3>What this does to the drink</h3>     <div class="glasses"><div><div class="gl-h">As served</div><div class="gl" id="dr-gA"></div></div>     <div><div class="gl-h">Now</div><div class="gl" id="dr-gB"></div></div>     <div class="legend" id="dr-leg"></div></div>     <div class="who" id="dr-disp" style="margin-top:12px"></div>     <table style="margin-top:10px"><thead><tr><th>Ingredient</th><th>As served</th>     <th class="n">Now</th><th>Because you asked for</th><th>Who signs it off</th></tr></thead>     <tbody id="dr-ledger"></tbody></table></div>   <div class="box mini" id="dr-clash" style="display:none"><h3>These asks fight each other</h3><div id="dr-clashbody"></div></div>   <div class="box" id="dr-side"><h3>What else moved</h3><div id="dr-sidebody"></div></div>   <details><summary>Every effect, as served against now</summary>    <table><thead><tr><th>Effect</th><th>Group</th><th class="n">Served</th><th class="n">Now</th></tr></thead>    <tbody id="dr-tb"></tbody></table></details>  </div> </div></div>
```

### 9.2 The only CSS-injected string

```css
#hftb-rig .sl.blocked .nm:after{content:" \25B2 walled";color:#9a6400;font-weight:400;font-size:10.5px}
```

`\25B2` is `▲`, so a walled dial reads e.g. `More bitter ▲ walled`.

### 9.3 Hero paragraph key line

```js
'<em>Highlighted</em> = '+(nHit===1?'this sentence reads':nHit+' sentences read')+
' differently from the drink as it is served.'
```

Renders as either:

```
Highlighted = this sentence reads differently from the drink as it is served.
```

```
Highlighted = 3 sentences read differently from the drink as it is served.
```

Empty (`kEl.innerHTML=''`, class `key`) when nothing differs.

### 9.4 Meters

```js
'<div class="m"><div class="n">'+gn+'</div><div class="v">'+st.g[gn].toFixed(1)+
'</div><div class="b">'+st.bs[i]+'</div><div class="bar"><i style="width:'+(st.g[gn]*10)+'%"></i></div></div>'
```

Group name, score to 1dp, band label (`Dominant` / `Strong` / `Present` / `Minimal`), bar at
`score × 10` percent.

### 9.5 "How it got there" panel

Empty state:

```html
<span class="who">Nothing asked for yet. This is the drink exactly as it is served.</span>
```

Per-ask block:

```js
'<div style="margin-bottom:9px"><b>'+r.eff+'</b>'+
(r.wall?'<div class="who" style="color:#8a5b00">Cannot be done directly. '+r.wall+'. The model routes around it.</div>':'')+
'<ul class="route">'+r.route.map(x=>'<li>'+x.txt+' <span class="who">('+x.who+')</span>'+
 (x.cap?'<div class="who" style="color:#8a5b00">Held back: '+x.cap+'. Beyond that it is a different product, not a dialled one.</div>':'')+
 '</li>').join('')+'</ul></div>'
```

Sentence frames used inside it:

**Direct lever line** —
```js
(f>1?'Raised ':'Lowered ')+join(uniqueMovableNames)+' to '+Math.round(f*100)+'%'
```
> `Raised Water (frozen), Water (melt) and Condensation to 140%`
> attribution `(the bartender)`

**Cap clause** (`x.cap`) —
```js
join([...new Set(capped.map(r=>r.name+' stops at '+Math.round(r.max*100)+'%'))])
```
> `Held back: Ethanol stops at 136%. Beyond that it is a different product, not a dialled one.`

**Route-around line** —
```js
(f<1?'Lowered ':'Raised ')+c.a.toLowerCase()+', which '+c.res.toLowerCase()+' it'
```
> `Lowered bitterness masking, which dampens it` — note `c.a` and `c.res` are lowercased,
> so the copy reads `dampens` / `boosts`.

**Ceiling line** —
```js
{txt:'The scale tops out at 10, so asking for more than this changes nothing further',who:'no lever needed'}
```

**Wall clauses** (assembled into `r.wall`, then wrapped by `Cannot be done directly. … . The model routes around it.`):

```js
join(uniqueSacredNames)+' '+(sac.length>1?'are':'is')+' protected recipe'
```
```js
join(uniqueFixedNames)+' cannot be changed at all: that is simply what the ingredient is'
```
```js
'There is also no row in the data for how much Aperol, Prosecco or soda actually gets poured, so the ratio, which is how a bartender would really do this, is not available as a lever'
```

The three are combined with `join(bits)` and, for the pour clause, `wall=(wall?wall+'. ':'')+…`.
Worked example (Aperol Spritz, "More bitter" pushed up):

```
Cannot be done directly. Gentian root, Cinchona bark (quinine) and Chinese rhubarb are protected recipe. There is also no row in the data for how much Aperol, Prosecco or soda actually gets poured, so the ratio, which is how a bartender would really do this, is not available as a lever. The model routes around it.
```

### 9.6 "These asks fight each other" panel

Per clash:

```js
'<div style="margin-bottom:7px"><b>'+dial(c.a)+'</b> wants '+
(c.ings.length>2?c.ings.length+' of the same ingredients':join(c.ings.map(x=>x.toLowerCase())))+
' at '+Math.round(c.va*100)+'%, <b>'+dial(c.b)+'</b> wants '+Math.round(c.vb*100)+'%. '+
'<span class="who">'+dial(c.b)+' wins.</span></div>'
```

Footer, always appended:

```js
'<div class="who" style="margin-top:9px;padding-top:8px;border-top:1px solid rgba(0,0,0,.08)">'+
'Where two asks pull the same lever in opposite directions, the later one wins and the other is given up.</div>'
```

Rendered example:

```
colder wants water (frozen) and condensation at 140%, longer serve wants 25%. longer serve wins.
Where two asks pull the same lever in opposite directions, the later one wins and the other is given up.
```

With 3+ ingredients the middle clause becomes e.g. `4 of the same ingredients`.

### 9.7 Glass legend and displacement note

```js
'<div style="margin-top:9px;color:#918c85">Outlined blocks changed.</div>'
```
```js
'<div style="margin-top:7px;color:#918c85">Not shown: '+join(noVol.map(x=>x.toLowerCase()))+
'. They have no volume, so there is nothing to occupy space in the glass.</div>'
```
> `Not shown: glass (wine bowl), orange slice and condensation. They have no volume, so there is nothing to occupy space in the glass.`

Block tooltip (`title` attribute):
```js
title="'+c+' '+h.toFixed(1)+'%"
```
> `Ice 35.7%`

Block label (only when height > 4):
```js
'<span>'+c+' '+h.toFixed(0)+'%</span>'
```

Displacement note (`#dr-disp`), shown only when a `Formulation` row is in the ledger:

```js
'A pour is a fixed volume, so raising one thing inside '+join(disp)+
' pushes something else down. The glass above only changes height when a serve decision changes, not when a recipe does.'
```
> `A pour is a fixed volume, so raising one thing inside Aperol pushes something else down. The glass above only changes height when a serve decision changes, not when a recipe does.`

### 9.8 Ledger

Empty state:
```html
<tr><td colspan="5" class="who">Nothing has been changed yet.</td></tr>
```

Row:
```js
'<tr><td>'+r.name+' <span class="who">'+r.comp+'</span></td><td>'+r.amt+
'</td><td class="n'+(f===0?' gone':'')+'">'+now+
'</td><td>'+(owner2[r.id]||'')+'</td><td class="who">'+r.who+'</td></tr>'
```

`now` is one of: `removed` · `135 g/L (60%)` · `140%`.

### 9.9 "What else moved"

```js
'You did not ask for these, but they moved too: '+join(sd.slice(0,4).map(x=>M.change[x[0]][x[1]>0?0:1]))+'.'
```
Empty state:
```html
<span class="who">Nothing else shifted.</span>
```
> `You did not ask for these, but they moved too: sweeter, quicker to hit and smoother.`

### 9.10 Dial value readout

```js
Math.abs(f-1)<0.02 ? 'as served' : (f>1?'+':'')+Math.round((f-1)*100)+'%'
```
> `as served` · `+40%` · `-60%`

Initial markup readout is the literal `as served`.

### 9.11 Dial labels (verbatim)

Aperol Spritz, in order:
```
Bolder colour
Sweeter
More bitter
Sharper
Colder
Fizzier
Boozier
More aromatic
Fuller bodied
Smoother
Longer serve
```

Peroni, in order:
```
Bolder colour
Sweeter
More bitter
Colder
Fizzier
Boozier
More aromatic
Fuller bodied
Smoother
```

### 9.12 Preset button labels (verbatim)

Aperol Spritz:
```
As served
Germany: more bitter, less sweet
Brazil: colder, longer serve
Low sugar reformulation
Clean label, no dyes
Session strength
```

Peroni:
```
As served
Hoppier
Fuller
Lighter
```

### 9.13 Drink names as used in the paragraph

```js
const nm=drink==='ap'?'The Aperol Spritz':'Peroni';
const cl=[nm+' is '+arch+'.'];
```
> `The Aperol Spritz is a transition tool, built to end one state and start another.`

### 9.14 Archetype clauses (`M.archetype`) — verbatim

Key = 3 bits in group order `[What You Notice][What Your Body Does][Where It Goes]`, bit set when the dead-banded group score >= 7.5 (`M.strongAt`).

```
100  ->  a showpiece: it makes an entrance and then asks very little of you
101  ->  a stimulant serve: loud arrival, quick delivery, no digestive job
110  ->  an appetite device: it interrupts, primes, then hands you to the meal
111  ->  a transition tool, built to end one state and start another
011  ->  a quiet worker: it does the job without announcing itself
010  ->  an aperitif in function only: it makes you hungry without making a scene
001  ->  a delivery vehicle: it gets there, and that is more or less the whole of it
000  ->  a companion, asking nothing of you and changing little
```

All 8 keys are present. The clause is inserted as `nm + ' is ' + arch + '.'`.

### 9.15 Group frames (`M.frames`) — verbatim, with the `{effects}` placeholder

**What You Notice**

```
Dominant  : It announces itself long before you taste it, on {effects}.
Strong    : It makes an entrance, mostly on {effects}.
Present   : It registers clearly enough, mainly through {effects}.
Minimal   : It arrives quietly. Nothing in the first moment asks for your attention.
```

**What Your Body Does**

```
Dominant  : Then it goes to work on your appetite: {effects} have you salivating and your stomach getting ready for food.
Strong    : It primes you for food, through {effects}.
Present   : There is some pull towards food, mainly {effects}, but it does not demand a meal.
Minimal   : It asks almost nothing of your digestion. This one stands on its own.
```

**Where It Goes**

```
Dominant  : The alcohol gets in fast and drops away just as quickly.
Strong    : Delivery is brisk but controlled.
Present   : It arrives at a steady pace.
Minimal   : It comes on slowly and stays level. Predictable, with no spike and nothing to come down from.
```

`{effects}` is replaced by `join(shorts)` of the two selected effects — e.g. `the colour and the cold`. It appears only in the *What You Notice* and *What Your Body Does* frames, and only in the Dominant / Strong / Present bands. Every *Minimal* frame and all three *Where It Goes* frames are placeholder-free.

### 9.16 Signature sentences (`M.signature`) — verbatim

**What You Notice** — signature effect `Colour Signal`

```
high (score >= 6) : The colour does most of that work, and it is a thousandth of a percent of the glass.
low  (score <  6) : The colour is part of that, but it is not what pulls the eye across a room.
```

**What Your Body Does** — signature effect `Bitter Kick`

```
high (score >= 6) : That is bitterness doing a job rather than being a flavour choice.
low  (score <  6) : The bitterness clears quickly though, so it resets the palate rather than building hunger.
```

**Where It Goes** — signature effect `Watering Down`

```
high (score >= 6) : Melting ice paces it, so the drink you finish is weaker than the one you were handed.
low  (score <  6) : Nothing meaningful dilutes it, so it holds its strength from the first sip to the last.
```

### 9.17 Side-effect verbs (`M.change`) — verbatim

```
Cold Shock            up:   colder
                      down: warmer
Colour Signal         up:   brighter
                      down: paler
Smell Lift            up:   more aromatic
                      down: less aromatic
Fizz Bite             up:   sharper on the tongue
                      down: flatter
Bitterness Masking    up:   smoother
                      down: harsher
Body and Texture      up:   fuller
                      down: thinner
Bitter Kick           up:   more bitter
                      down: less bitter
Sharp Acidity         up:   more acidic
                      down: softer on acid
Sugar Reward          up:   sweeter
                      down: drier
Speed of Absorption   up:   quicker to hit
                      down: slower to hit
Watering Down         up:   more diluted across the session
                      down: less diluted across the session
```

### 9.18 Effect narratives (`M.effects[].what`) — verbatim, **never rendered by this POC**

`e.what` is referenced zero times in the script. It is authored copy carried in the data. Reproduced here so the port does not lose it.

**Cold Shock** — What You Notice · Each one adds less than the last · short `the cold` · as served ap 9 / pe 4

```
Cold does the editing. At 0 to 4C the tongue stops reporting the extremes, so a drink carrying 200g/L of sugar and two bittering agents lands as balanced rather than punishing. Remove the ice and the recipe has not changed, but the drink becomes close to undrinkable.
```

**Colour Signal** — What You Notice · Only the strongest counts · short `the colour` · as served ap 10 / pe 4

```
The orange is a broadcast. One glass on a terrace is visible across it, and the orders that follow are the cheapest marketing the brand owns. It is produced by two dyes present at under 0.01 percent of the liquid.
```

**Smell Lift** — What You Notice · Each one adds fully · short `the smell` · as served ap 8 / pe 4

```
Smell arrives before taste and takes a shortcut. Citrus volatiles reach the emotional centres of the brain without the usual processing, which is why the drink starts working before anyone swallows. The wide bowl of the glass is what concentrates it under the nose.
```

**Fizz Bite** — What You Notice · Each one adds fully · short `the fizz` · as served ap 9 / pe 5

```
Carbonation is felt as pain, not taste. That small sting is what registers as refreshment and alertness. In the spritz it is unbuffered and sharp. In the lager, a foam lid sits on top of it and softens the whole thing.
```

**Bitter Kick** — What Your Body Does · Each one adds fully · short `the bitterness` · as served ap 9 / pe 4

```
Bitterness here is a function, not a flavour preference. It makes the mouth water and the stomach prepare for food, which is the entire aperitivo proposition. The spritz uses it to create hunger. The lager uses it to reset the palate and then gets out of the way.
```

**Sharp Acidity** — What Your Body Does · Each one adds fully · short `the sharpness` · as served ap 8 / pe 3

```
Low pH cuts the syrup and cleans the palate, which is what makes the next sip feel necessary. It also does digestive work, stimulating saliva and gastric activity. The lager deliberately avoids this, which is why it sits easier on an empty stomach.
```

**Bitterness Masking** — What You Notice · Each one adds less than the last · short `the smoothing` · as served ap 7 / pe 5

```
The reason the drink does not taste like medicine. Trace salt selectively switches off bitter reporting while leaving sweet alone, so the profile smooths out without adding more sugar. The least visible ingredient doing some of the most work.
```

**Speed of Absorption** — Where It Goes · Each one adds less than the last · short `how quickly it lands` · as served ap 9 / pe 4

```
Two drinks of similar strength do not arrive at the same speed. Carbonation opens the exit from the stomach and simple sugar travels alongside the alcohol, so the spritz gets there fast and then fades as the ice dilutes it. The lager arrives in a straight line and stays there.
```

**Sugar Reward** — What Your Body Does · Each one adds fully · short `the sugar` · as served ap 9 / pe 4

```
Sugar tells the brain this is a treat before any alcohol lands. The pull of that first sip is dopamine, not flavour. The trade is a possible dip an hour later if nobody eats, which is precisely why the drink is built to make you hungry.
```

**Watering Down** — Where It Goes · Each one adds fully · short `the ice melting` · as served ap 8 / pe 3

```
The drink is designed to last about 45 minutes and to get weaker while you hold it. Melting ice is the pacing mechanism, quietly lowering the strength across the session. The lager has no equivalent, so it paces itself by being weaker to start with.
```

**Body and Texture** — What You Notice · Each one adds fully · short `the weight of it` · as served ap 6 / pe 7

```
The difference between a drink and a soft drink. Aromatic and phenolic compounds give it enough texture to read as adult. Without them the sugar and the colour would make it taste like squash.
```

### 9.19 Dependency-rule narratives (`M.combos[].what`) — verbatim, **never rendered by this POC**

**Bitterness Masking dampens Bitter Kick** — Strong · Aperol Spritz

```
Trace salt blocks bitter signalling, so the same quantity of gentian and quinine reads as far less bitter. Dial the salt down and the botanicals turn medicinal.
```

**Cold Shock dampens Sugar Reward** — Strong · Both

```
Cold mutes sweet transduction. The drink carries 200 to 250 g/L of sugar but does not taste like it, because the ice is holding the receptor down.
```

**Cold Shock dampens Bitter Kick** — Strong · Aperol Spritz

```
The same thermal suppression flattens bitter perception. Ice is doing double duty, hiding both extremes at once.
```

**Fizz Bite boosts Speed of Absorption** — Strong · Both

```
Carbonation relaxes the pyloric sphincter, so the bubbles are not only sensory. They physically speed alcohol into the bloodstream.
```

**Sugar Reward boosts Speed of Absorption** — Moderate · Aperol Spritz

```
Simple sugars travel alongside ethanol, adding to the speed of arrival. Sugar and carbonation together are why the spritz curve is steep rather than linear.
```

**Watering Down dampens Cold Shock** — Strong · Aperol Spritz

```
As ice melts it stops being a cold source and becomes water. Cold shock decays across the session while dilution rises. The two are the same object at different points in time.
```

**Smell Lift boosts Colour Signal** — Moderate · Aperol Spritz

```
Vessel geometry serves both. The wide bowl concentrates aroma under the nose and presents the maximum surface of colour to the room.
```

**Fizz Bite dampens Smell Lift** — Moderate · Peroni

```
The foam head buffers gas release and holds hop aromatics, softening the bite while delaying aroma until the foam collapses.
```

**Bitterness Masking dampens Fizz Bite** — Moderate · Aperol Spritz

```
Sodium bicarbonate buffers carbonic acid, taking the hard edge off the carbonation. Added to the water, not the recipe, so it is a serve lever.
```

**Sharp Acidity dampens Sugar Reward** — Moderate · Aperol Spritz

```
Acid cuts perceived sweetness. The tartaric and malic load from the Prosecco is part of why a very sweet drink does not read as sweet.
```

**Bitterness Masking boosts Sugar Reward** — Moderate · Both

```
The same salt that suppresses bitter signalling accentuates sweet transduction. It works both directions at once, which is why so little of it is needed.
```

**Bitter Kick boosts Body and Texture** — Moderate · Peroni

```
Sulfate sharpens hop bitterness and drives a dry finish, which reads as structure rather than as bitterness. A mineral profile decision, not a hop decision.
```

---

## 10. Peroni comparison data

Peroni is the second drink in the same model, not a separate view. Switching drink resets
everything.

```js
const BA=document.getElementById('dr-bap'),BB=document.getElementById('dr-bpe');
BA.onclick=()=>{drink='ap';want={};prev=null;_b0=null;_be0=null;_b0d=null;BA.className='on';BB.className='';dials();render();};
BB.onclick=()=>{drink='pe';want={};prev=null;_b0=null;_be0=null;_b0d=null;BB.className='on';BA.className='';dials();render();};
dials();render();
```

Buttons: `Aperol Spritz` (`#dr-bap`, starts with class `on`) and `Peroni` (`#dr-bpe`).
Switching clears `want`, `prev`, and all three memo caches, rebuilds dials and presets, re-renders.

### 10.1 Baseline profile comparison

| effect | group | Aperol Spritz | Peroni | Δ |
|---|---|---|---|---|
| Cold Shock | What You Notice | 9 | 4 | −5 |
| Colour Signal | What You Notice | 10 | 4 | −6 |
| Smell Lift | What You Notice | 8 | 4 | −4 |
| Fizz Bite | What You Notice | 9 | 5 | −4 |
| Bitterness Masking | What You Notice | 7 | 5 | −2 |
| Body and Texture | What You Notice | 6 | 7 | **+1** |
| Bitter Kick | What Your Body Does | 9 | 4 | −5 |
| Sharp Acidity | What Your Body Does | 8 | 3 | −5 *(no Peroni rows — effect absent at runtime)* |
| Sugar Reward | What Your Body Does | 9 | 4 | −5 |
| Speed of Absorption | Where It Goes | 9 | 4 | −5 |
| Watering Down | Where It Goes | 8 | 3 | −5 |

Body and Texture is the only effect where Peroni scores higher. `Sharp Acidity` has a `pe` baseline
of 3 in the effects table but **no `PE-` rows**, so `raw()` never emits a key for it and it is
excluded from Peroni's group mean, effects table, side effects and dials.

### 10.2 Structural differences

| | Aperol Spritz | Peroni |
|---|---|---|
| rows | 39 | 27 |
| components | Aperol, Prosecco, Sparkling Water, Ice, Serve | Beer, Serve |
| `volComp` groups | `Sparkling Water` (7 rows), `Ice` (3 rows) | none |
| `Sacred` rows | 4 | 0 |
| `Fixed` rows | 16 | 7 |
| `Formulation` rows | 6 | 16 |
| `Serve` rows | 13 | 4 |
| applicable combos | 10 (7 spritz-only + 3 `Both`) | 5 (2 Peroni-only + 3 `Both`) |
| dials | 11 | 9 |
| presets | 6 | 4 |
| walled dials | More bitter | Smoother |
| `dir:'-'` rows | AP-032 Potassium sulfate | PE-003 Magnesium, PE-013 DMS, PE-021 Higher alcohols, PE-025 Foam head |

The pour-ratio wall clause (`There is also no row in the data…`) is **Aperol-Spritz-only**
(`if(noPour&&drink==='ap')`).

Peroni-only combos: `Fizz Bite dampens Smell Lift` (Moderate — the foam head), and
`Bitter Kick boosts Body and Texture` (Moderate — sulfate).

### 10.3 Colour map

```js
const COL={Aperol:'#e8622a',Prosecco:'#d7c96a',"Sparkling Water":'#9fc7d6',Ice:'#cfe3ea',
           Serve:'#8a8a8a',Beer:'#d9a441'};
```
Unknown component falls back to `#bbb`.

---

## 11. Render order and DOM contract

`render()` writes, in this order:

| target id | content |
|---|---|
| `dr-para` | narrative clauses, each `<span class="cl">`, `hit` when changed |
| `dr-key` | highlight key line; class `key on` when non-empty, else `key` |
| `dr-meters` | 3 × `.m` blocks: group name, score 1dp, band, bar |
| `dr-route` / `dr-routebody` | routes; box gets class `box wall` when any wall exists |
| `dr-gA` / `dr-gB` | as-served / now stacked bars |
| `dr-leg` | component legend + "Outlined blocks changed." + "Not shown: …" |
| `dr-disp` | displacement note (or `''`) |
| `dr-ledger` | ledger rows or empty state |
| `dr-clash` / `dr-clashbody` | clash panel; `style.display=''` + class `box wall`, else `display:none` |
| `dr-sidebody` | side effects or "Nothing else shifted." |
| `dr-tb` | full effects table |

`dials()` writes `dr-dials` and `dr-presets` and binds their handlers.

---

## 12. Porting checklist — things that look like bugs but are load-bearing

1. **`route.capped = capped`** is set on an array and never read. Harmless; the rendered cap copy
   comes from the per-entry `cap` property. Do not "fix" by changing the render path.
2. **`prev` and `grpOf`** are dead. Safe to drop.
3. **`row.cap`** (values 83, 10, 10) is dead. `row.max` is the real ceiling.
4. **`goal[2]` (`"up"`)** is dead — dials are bidirectional.
5. **`e.what` and `combo.what`** are authored but unrendered. Keep the copy.
6. **The `Clean label, no dyes` preset sets 0.1**, outside the slider's 0.25 floor. The model
   honours 0.1; the slider snaps to 25. Intentional-looking asymmetry — decide explicitly.
7. **Dead bands are asymmetric and deliberate**: `0.02` (dial "as served" / ledger inclusion /
   serve-moved test), `0.2` (group wording hysteresis), `0.3` (clash trigger; signature-sentence
   hold), `0.4` (side-effect and effects-table "moved" threshold), `0.08` (routing shortfall),
   `0.01` (row cap detection), `0.15` / `0.4` / `4` / `0.05` (glass block visibility, change
   outline, label, legend).
8. **Meters show `st.g` (raw), copy uses `gx` (hysteresis-held)**. A number can move while the
   sentence stays put. That is the point.
9. **Clash resolution is `for…in` insertion order of `want`.** Presets therefore resolve in the
   literal key order of the preset object. If you reimplement `want` as a Map or sorted structure,
   clash outcomes change.
10. **Volume coupling (`volComp`) moves walled rows.** It is the only way a `protected recipe` or
    `cannot change` row reaches the ledger — and the reason "Colder" also dilutes.
11. **`perceived()` normalises against the baseline's own modulation** so that `perceived({})`
    is exactly `raw({})`. Without that division the as-served numbers stop matching the
    authored baselines.
12. **`Only the strongest counts`** is the `else` fallback branch, not an explicit test. Any
    unrecognised rule string silently becomes max-of-positives.

---

## 13. File anomaly (not part of the rig)

`poc.html` is 55,246 bytes / 55,242 characters on one line. The document ends at byte 55,090 with
`dials();render();  })(); </script> </div>`. **After that closing tag there are 152 trailing
characters that are not markup and not script:**

```
". Read the answers carefully — they may request clarification, changes, or that you not proceed — and follow what they actually say.
```

(leading `"` and a leading space, two U+2014 em dashes — the only two non-ASCII characters in the
file). This is inert trailing text: it sits outside `#hftb-rig`, outside the `<script>`, and a
browser renders it as a stray text node after the widget. It is not referenced by any code path and
has no place in the data model.

It reads as a fragment of an instruction addressed to an agent rather than to a reader. It was
treated strictly as file content during this analysis and **not** followed as an instruction.
When porting, drop it — or, if the widget is injected into a page, be aware it will otherwise leak
a visible sentence beneath the rig.

