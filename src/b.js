/* ---------------------------------------------------------------------------
 * b.js — scroll behaviour and control modes.
 *
 * Replaces the hand-rolled pin/snap/progress engine that used to live in a.js.
 *
 *  - Parallax exists in exactly one place: #s1, desktop only, pinned and
 *    scrubbed by GSAP ScrollTrigger. ScrollTrigger caches its start/end on
 *    refresh instead of recomputing from a live layout every frame, and
 *    `scrub` interpolates toward the target, so progress only ever moves the
 *    way the user is scrolling.
 *  - Everywhere else, at every breakpoint, content reveals on enter via
 *    IntersectionObserver and then stays put.
 *  - Nothing in here ever calls scrollTo(). The scroll position belongs to the
 *    user.
 * ------------------------------------------------------------------------- */
(function () {
  "use strict";

  var reduced = matchMedia("(prefers-reduced-motion:reduce)").matches;
  var doc = document.documentElement;

  // If GSAP did not load, fall back to the flat path rather than leaving #s1
  // pinned with nothing driving it. a.js reads APEROL_DESKTOP_PARALLAX live, so
  // clearing it here is enough to switch the whole page over.
  var DESKTOP = !!window.APEROL_DESKTOP_PARALLAX && !!window.gsap && !!window.ScrollTrigger;
  window.APEROL_DESKTOP_PARALLAX = DESKTOP;

  doc.classList.add(DESKTOP ? "has-parallax" : "no-parallax");

  /* -- 1. Reveal on enter --------------------------------------------------
   * One observer, used by everything. Elements opt in with .reveal and are
   * unobserved as soon as they fire, so nothing re-animates on the way back up.
   */
  var revealIO = null;
  if ("IntersectionObserver" in window && !reduced) {
    revealIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          var delay = parseFloat(el.dataset.revealDelay || 0);
          if (delay) {
            setTimeout(function () {
              el.classList.add("in");
            }, delay);
          } else {
            el.classList.add("in");
          }
          revealIO.unobserve(el);
          if (el.dataset.revealFire) fire(el.dataset.revealFire, el);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
  }

  function reveal(el, delay, fireName) {
    if (!el) return;
    el.classList.add("reveal");
    if (delay) el.dataset.revealDelay = delay;
    if (fireName) el.dataset.revealFire = fireName;
    if (!revealIO) {
      el.classList.add("in");
      if (fireName) fire(fireName, el);
      return;
    }
    revealIO.observe(el);
  }

  var fired = {};
  function fire(name, el) {
    if (fired[name]) return;
    fired[name] = true;
    if (name === "chart") revealChart();
    if (name === "trows") revealTrows(el);
  }

  /* -- 2. #s2: draw the spider chart in once, then hand over to the dials ---
   * a.js reads window.APEROL_S2 (0..1) for the chart's draw-in and treats
   * 1 as "done, controls are live".
   */
  window.APEROL_S2 = 0;
  function revealChart() {
    if (reduced) {
      window.APEROL_S2 = 1;
      return;
    }
    var DUR = 900;
    var t0 = null;
    requestAnimationFrame(function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / DUR);
      // easeOutCubic — settles rather than snapping.
      window.APEROL_S2 = 1 - Math.pow(1 - p, 3);
      if (p < 1) requestAnimationFrame(step);
      else window.APEROL_S2 = 1;
    });
  }

  /* -- 3. #s4 timeline rows — stagger in on enter -------------------------- */
  function revealTrows(scope) {
    var rows = [].slice.call((scope || document).querySelectorAll(".trow"));
    rows.forEach(function (r, i) {
      setTimeout(
        function () {
          r.classList.add("on");
        },
        reduced ? 0 : i * 70,
      );
    });
  }

  /* -- 4. Wire the reveals ------------------------------------------------- */
  function setupReveals() {
    var s2head = document.querySelector("#s2 .s2head");
    reveal(s2head);
    reveal(document.getElementById("sp-host"), 0, "chart");

    var s4 = document.getElementById("s4");
    if (s4) {
      reveal(s4.querySelector(".in"), 0, "trows");
      var axis = s4.querySelector(".axis");
      reveal(axis);
    }

    var s5 = document.getElementById("s5");
    if (s5) reveal(s5.querySelector(".in"));

    // Off desktop #s1 is a normal stacked section: the glass, then each step.
    if (!DESKTOP) {
      buildFlatFigures();
      var steps = [].slice.call(document.querySelectorAll("#s1 .step"));
      steps.forEach(function (st) {
        st.classList.add("static");
        reveal(st);
      });
      var art = document.querySelector("#s1 .art");
      if (art) reveal(art);
      var legend = document.querySelector("#s1 .legend");
      if (legend) reveal(legend);
    }
  }

  /* -- 4b. Flat-path figures for "by volume" and "by impact" ---------------
   * On the pinned desktop path one illustration morphs through every step. On
   * the flat path it cannot, so those two steps had no picture at all. Each
   * gets its own small glass showing that step's split, cloned from the main
   * artwork so it stays in sync with it.
   */
  var SPLITS = {
    2: [
      ["Prosecco", 50.1, "#D7C96A"],
      ["Aperol", 33.3, "#E8622A"],
      ["Sparkling water", 16.6, "#9FC7D6"],
    ],
    3: [
      ["Aperol", 52, "#E8622A"],
      ["Sparkling water", 24, "#9FC7D6"],
      ["Prosecco", 24, "#D7C96A"],
    ],
  };

  function buildFlatFigures() {
    var source = document.querySelector("#s1 .art > svg");
    if (!source) return;

    Object.keys(SPLITS).forEach(function (stepKey) {
      var step = document.querySelector('#s1 .step[data-s="' + stepKey + '"]');
      if (!step || step.querySelector(".stepfig")) return;

      var svg = source.cloneNode(true);

      // Edit the clone while the original ids are still on it, so everything
      // can be found by name. Ids are made unique afterwards, in one pass.
      ["ice 1", "ice 2", "ice 3", "orange", "straw", "Aperol logo"].forEach(function (name) {
        var n = svg.querySelector('[id="' + name + '"]');
        if (n && n.parentNode) n.parentNode.removeChild(n);
      });
      // Hide the real liquid; the proportion bands replace it.
      ["Group 21", "Ellipse 31"].forEach(function (name) {
        var n = svg.querySelector('[id="' + name + '"]');
        if (n) n.setAttribute("opacity", "0");
      });

      // Draw the bands into the same glass-clipped group the live chart uses,
      // so they take the shape of the bowl.
      var host = svg.querySelector('[id="hg-segs"]');
      if (host) {
        while (host.firstChild) host.removeChild(host.firstChild);
        host.setAttribute("opacity", "1");
        var y = 277;
        SPLITS[stepKey].forEach(function (row) {
          var h = (120 * row[1]) / 100;
          var r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          r.setAttribute("x", "150");
          r.setAttribute("width", "200");
          r.setAttribute("y", y.toFixed(2));
          r.setAttribute("height", (h + 0.6).toFixed(2));
          r.setAttribute("fill", row[2]);
          host.appendChild(r);
          y += h;
        });
      }

      // Namespace every id and every reference to one, so the clone's clipPaths
      // cannot collide with the live artwork's.
      var pfx = "fig" + stepKey + "-";
      var markup = svg.outerHTML
        .replace(/\sid="([^"]+)"/g, ' id="' + pfx + '$1"')
        .replace(/url\(#([^)]+)\)/g, "url(#" + pfx + "$1)");

      var fig = document.createElement("figure");
      fig.className = "stepfig";
      fig.setAttribute("aria-hidden", "true");
      fig.innerHTML = markup;
      var legend = step.querySelector(".legend");
      step.insertBefore(fig, legend || null);
      reveal(fig);
    });
  }

  /* -- 5. #s1 parallax, desktop only --------------------------------------
   * The one pinned, scrubbed section on the site.
   */
  function setupParallax() {
    if (!DESKTOP || !window.gsap || !window.ScrollTrigger) {
      window.APEROL_P = 1;
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    var s1 = document.getElementById("s1");
    var track = s1 && s1.querySelector(".track");
    var pin = s1 && s1.querySelector(".pin");
    if (!track || !pin) {
      window.APEROL_P = 1;
      return;
    }

    var navH = function () {
      return parseFloat(getComputedStyle(doc).getPropertyValue("--nav")) || 68;
    };

    ScrollTrigger.create({
      trigger: track,
      start: function () {
        return "top top+=" + navH();
      },
      end: "bottom bottom",
      pin: pin,
      // .track already reserves the scroll distance, so ScrollTrigger must not
      // add its own spacer on top of it.
      pinSpacing: false,
      anticipatePin: 1,
      // scrub:0.6 eases the animation toward the scroll position instead of
      // snapping to it. This is the whole "grounded" feel — and because it only
      // ever interpolates toward the true progress, it cannot run backwards
      // while you scroll forwards.
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: function (self) {
        window.APEROL_P = self.progress;
      },
      onRefresh: function (self) {
        window.APEROL_P = self.progress;
      },
    });

    // Recalculate once fonts and the inline SVGs have settled.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        ScrollTrigger.refresh();
      });
    }
    addEventListener("load", function () {
      ScrollTrigger.refresh();
    });
  }

  /* -- 6. Basic / Advanced control modes ----------------------------------- */
  var DIAL_EFFECTS = {
    sweeter: ["Taste"],
    bitter: ["Taste", "Smell"],
    colder: ["Touch", "Taste"],
    fizzier: ["Touch", "Hearing"],
    brighter: ["Sight"],
    aromatic: ["Smell", "Taste"],
    sharper: ["Taste", "Touch"],
    fuller: ["Touch", "Taste"],
    smoother: ["Taste"],
    longer: ["Taste", "Touch", "Smell"],
    boozier: ["Taste", "Touch"],
  };
  // The Basic/Advanced toggle has been removed: every dial is shown, with its
  // detail, all the time.
  function setupModes() {
    var s2 = document.getElementById("s2");
    if (!s2) return;

    // Each dial's detail is built from what it already knows: the tooltip copy
    // becomes visible prose, and the senses it moves are spelled out.
    [].slice.call(s2.querySelectorAll(".dial")).forEach(function (dial) {
      var input = dial.querySelector("input[data-d]");
      var nm = dial.querySelector(".nm");
      if (!input || !nm) return;
      var key = input.dataset.d;

      var senses = DIAL_EFFECTS[key] || [];
      if (senses.length) {
        var chips = document.createElement("div");
        chips.className = "dialaffects";
        chips.innerHTML =
          '<span class="dialaffects-l">Moves</span>' +
          senses
            .map(function (x) {
              return "<i>" + x + "</i>";
            })
            .join("");
        // Above the track, not below: it describes what the slider will do, so
        // it reads before you reach for it.
        dial.insertBefore(chips, input);
      }

      // The explanation lives in the tooltip only. It used to also be printed
      // inline under every slider, which said the same thing twice and made the
      // control column several screens tall.
    });

    var rb = document.getElementById("dialreset");
    if (rb) {
      rb.addEventListener("click", function () {
        [].slice.call(s2.querySelectorAll("input[data-d]")).forEach(function (inp) {
          if (inp.value === "100") return;
          inp.value = 100;
          inp.dispatchEvent(new Event("input", { bubbles: true }));
          inp.dispatchEvent(new Event("change", { bubbles: true }));
        });
      });
    }
  }

  /* -- 7. Tooltips on touch ------------------------------------------------
   * a.js drives #tip from mouseover/focus, and the stylesheet hid it outright
   * on coarse pointers — so on a phone every data-tip on the page was dead
   * content. Here a tap opens the same tip as a bottom sheet, and a second tap
   * (or a tap anywhere else, or Escape) closes it.
   */
  function setupTouchTips() {
    if (!matchMedia("(hover:none)").matches) return;
    var tip = document.getElementById("tip");
    if (!tip) return;
    var open = null;

    function show(el) {
      var text = el.getAttribute("data-tip");
      if (!text) return;
      open = el;
      tip.querySelector(".lab").textContent = el.getAttribute("data-lab") || "What drives it";
      tip.querySelector(".txt").textContent = text;
      // Bottom sheet: fixed to the viewport, so it never lands off-screen the
      // way the cursor-anchored version would on a narrow display.
      tip.classList.add("on", "sheet");
      tip.classList.remove("above", "below");
      tip.style.top = "";
      tip.style.left = "";
      document.querySelectorAll("[data-tip].tipopen").forEach(function (n) {
        n.classList.remove("tipopen");
      });
      el.classList.add("tipopen");
    }

    function hide() {
      tip.classList.remove("on");
      if (open) open.classList.remove("tipopen");
      open = null;
    }

    document.addEventListener(
      "click",
      function (e) {
        var t = e.target.closest ? e.target.closest("[data-tip]") : null;
        // Never swallow a tap meant for a real control.
        if (t && e.target.closest("button, a, input, label")) return;
        if (!t) {
          if (open && !tip.contains(e.target)) hide();
          return;
        }
        if (t === open) hide();
        else show(t);
      },
      true,
    );

    addEventListener("keydown", function (e) {
      if (e.key === "Escape") hide();
    });
  }

  /* -- 8. Go ---------------------------------------------------------------- */
  function init() {
    setupReveals();
    setupModes();
    setupTouchTips();
    setupParallax();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
