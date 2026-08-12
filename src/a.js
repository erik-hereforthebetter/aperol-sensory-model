(!(function () {
  var e = matchMedia("(prefers-reduced-motion:reduce)").matches;
  // MOBILE / DESKTOP SPLIT --------------------------------------------------
  // Parallax (scroll-scrubbed pinning) is desktop-only, and only for #s1.
  // Everything else — every breakpoint — reveals on enter. See b.js.
  var IS_DESKTOP = matchMedia("(min-width:900px) and (pointer:fine)").matches && !e;
  window.APEROL_DESKTOP_PARALLAX = IS_DESKTOP;
  function t(e) {
    return (e = e < 0 ? 0 : e > 1 ? 1 : e) * e * e * (e * (6 * e - 15) + 10);
  }
  function n(e, t) {
    ((e.style.width = ""),
      (e.style.maxWidth = ""),
      (e.style.flexShrink = ""),
      (e.style.transform = "none"));
    for (var n = e.offsetWidth, o = 1, r = 0; r < 3; r++) {
      ((e.style.maxWidth = "none"), (e.style.flexShrink = "0"), (e.style.width = n / o + "px"));
      var a = e.scrollHeight,
        i = Math.min(1, t / (a * o));
      if (((o = Math.max(0.55, o * i)), Math.abs(1 - i) < 0.005)) break;
    }
    return (
      (e.style.transformOrigin = "center center"),
      o < 0.999
        ? ((e.style.maxWidth = "none"),
          (e.style.flexShrink = "0"),
          (e.style.width = n / o + "px"),
          (e.style.transform = "scale(" + o.toFixed(4) + ")"))
        : ((e.style.maxWidth = ""),
          (e.style.width = ""),
          (e.style.flexShrink = ""),
          (e.style.transform = "none")),
      o
    );
  }
  // The old build ran an auto-shrink pass (n(), above) over #s2 .col and
  // #s5 .in on every scroll, fed by a ResizeObserver. Writing width/transform
  // from inside a ResizeObserver callback re-triggers that same observer, so
  // the layout oscillated while the page was standing still. Both sections now
  // size themselves through normal CSS flow; this is a reset-only no-op kept
  // so the existing call sites stay valid.
  function o() {
    ["#s2 .col", "#s5 .in"].forEach(function (e) {
      var t = document.querySelector(e);
      t &&
        ((t.style.width = ""),
        (t.style.maxWidth = ""),
        (t.style.flexShrink = ""),
        (t.style.transform = ""));
    });
  }
  function a(e) {
    for (var t = 0, n = e; n; n = n.offsetParent) t += n.offsetTop;
    return t;
  }
  function i(e, t) {
    var n = 0.91 * (e.offsetHeight - t.offsetHeight);
    if (window.HOSTVH && n > 0) return Math.min(1, Math.max(0, (window.HOSTSCROLL - a(e)) / n));
    var o = e.getBoundingClientRect();
    if (n > 0) return Math.min(1, Math.max(0, -o.top / n));
    var r = window.innerHeight || 800,
      i = o.height - r;
    return i > 40 ? Math.min(1, Math.max(0, -o.top / i)) : 0;
  }
  window.HOSTSCROLL = window.HOSTSCROLL || 0;
  var s =
      '<svg viewBox="21 122 17.3 22.9" aria-hidden="true"><path d="M26.47 132.2L21 132.2L29.63 122L38.25 132.2L32.79 132.2L32.79 144.84L26.47 144.84L26.47 132.2Z" fill="currentColor"/></svg>',
    l = document.getElementById("s1"),
    c = l.querySelector(".track"),
    u = l.querySelector(".pin"),
    d = l.querySelector(".art"),
    h = d.querySelector("svg"),
    C = [].slice.call(l.querySelectorAll(".step")),
    f = h.querySelector("#hg-segs"),
    g = h.querySelector('[id="Group 21"]'),
    p = h.querySelector('[id="Ellipse 31"]'),
    m = h.querySelector('[id="Aperol logo"]'),
    v = [
      ["Prosecco", 50.1, "#D7C96A"],
      ["Aperol", 33.3, "#E8622A"],
      ["Sparkling water", 16.6, "#9FC7D6"],
    ],
    y = [
      ["Aperol", 52, "#E8622A"],
      ["Sparkling water", 24, "#9FC7D6"],
      ["Prosecco", 24, "#D7C96A"],
    ],
    w = { Prosecco: "#D7C96A", Aperol: "#E8622A", "Sparkling water": "#9FC7D6" },
    b = {},
    L = [].slice.call(l.querySelectorAll("#lg li")),
    k = [].slice.call(l.querySelectorAll("#lg2 li"));
  function x(e) {
    var t = {},
      n = 277;
    return (
      e.forEach(function (e) {
        var o = (120 * e[1]) / 100;
        ((t[e[0]] = { y: n, h: o, p: e[1] }), (n += o));
      }),
      t
    );
  }
  ["Prosecco", "Aperol", "Sparkling water"].forEach(function (e) {
    var t = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    (t.setAttribute("x", "150"),
      t.setAttribute("width", "200"),
      t.setAttribute("fill", w[e]),
      f.appendChild(t),
      (b[e] = t));
  });
  var E = x(v),
    S = x(y),
    M = {
      "ice 1": [-185, -150, -70],
      "ice 2": [165, -205, 55],
      "ice 3": [70, -280, 110],
      orange: [-215, -185, -40],
    },
    A = {
      "ice 1": [3.4, 4.1, 0, 212, 355],
      "ice 2": [3.9, 3.6, 1.9, 254, 334],
      "ice 3": [4.3, 4.7, 3.4, 244, 364],
      orange: [5.1, 4.4, 2.4, 221, 321],
    },
    H = h.querySelector('[id="straw"]'),
    B = Object.keys(M)
      .map(function (e) {
        var t = h.querySelector('[id="' + e + '"]');
        return t ? { el: t, v: M[e], j: A[e], o: parseFloat(t.getAttribute("data-o") || 1) } : null;
      })
      .filter(Boolean),
    q = [40, 240, 370, 320],
    T = [128, 236, 200, 324],
    F = [152, 246, 158, 300],
    V = 0,
    I = 0,
    W = [];
  function O() {
    var e = document.getElementById("senseover");
    if (e && W.length) {
      var t = h.querySelector('[id="Aperol glass"]'),
        n = h.querySelector('[id="straw"]');
      if (t && n) {
        var o = t.getBoundingClientRect(),
          r = n.getBoundingClientRect(),
          a = d.getBoundingClientRect(),
          i = Math.min(o.top, r.top) - a.top,
          s = Math.max(o.bottom, r.bottom) - a.top - i;
        ((e.style.top = i.toFixed(1) + "px"), (e.style.height = s.toFixed(1) + "px"));
        var l = Math.max(28, (s / 5) * 0.9);
        W.forEach(function (e) {
          e.style.height = l.toFixed(1) + "px";
        });
      }
    }
  }
  function R() {
    var e = l.querySelector(".stage"),
      t = l.querySelector(".say"),
      n = getComputedStyle(e).gridTemplateColumns.indexOf(" ") > 0,
      o = parseFloat(getComputedStyle(e).columnGap || 0);
    ((d.dataset.extra = n ? t.offsetWidth + o : 0),
      (d.dataset.off = n ? (t.offsetWidth + o) / 2 : 0),
      (d.dataset.base = d.parentNode.querySelector(".art").offsetWidth));
  }
  R();
  var Z = document.getElementById("s2"),
    P = Z.querySelector(".track"),
    z = Z.querySelector(".pin"),
    D = document.getElementById("sp-host").querySelector("#sp-datashape"),
    N = D.ownerSVGElement,
    // The five sense rows beside the chart. They show the drink as served and
    // then move, in place, as the dials are used — so the effect of a slider is
    // visible without scrolling away from it.
    Y = [].slice.call(document.querySelectorAll("#senselist .srow2")),
    j = [
      ["taste", 0],
      ["touch", 72],
      ["hearing", 144],
      ["sight", 216],
      ["smell", 288],
    ],
    G = { taste: 9, touch: 9, hearing: 4, sight: 9, smell: 8 },
    K = j.map(function () {
      var e = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      return (
        e.setAttribute("r", "5"),
        e.setAttribute("fill", "#12100E"),
        e.setAttribute("opacity", "0"),
        N.appendChild(e),
        e
      );
    });
  function U(e, t) {
    (D.setAttribute(
      "points",
      j
        .map(function (n) {
          var o = ((80.6 * e[n[0]]) / 10) * t,
            r = ((n[1] - 90) * Math.PI) / 180;
          return (185.5 + o * Math.cos(r)).toFixed(2) + "," + (171 + o * Math.sin(r)).toFixed(2);
        })
        .join(" "),
    ),
      j.forEach(function (n, o) {
        var r = ((80.6 * e[n[0]]) / 10) * t,
          a = ((n[1] - 90) * Math.PI) / 180;
        (K[o].setAttribute("cx", (185.5 + r * Math.cos(a)).toFixed(2)),
          K[o].setAttribute("cy", (171 + r * Math.sin(a)).toFixed(2)));
      }));
  }
  var X = document.getElementById("panelA"),
    $ = document.getElementById("panelB"),
    J = !1;
  var Q = {
      sweeter: { taste: 1 },
      bitter: { taste: 0.7, smell: 0.2 },
      colder: { touch: 1, taste: -0.5 },
      fizzier: { touch: 0.8, hearing: 1 },
      brighter: { sight: 1 },
      aromatic: { smell: 1, taste: 0.3 },
      // Restored from the original POC, which offered eleven asks rather than
      // six. "Boozier" is deliberately not among them — see FRAMEWORK.md.
      sharper: { taste: 0.8, touch: 0.2 },
      fuller: { touch: 1, taste: 0.2 },
      smoother: { taste: -0.5 },
      longer: { taste: -0.7, touch: -0.3, smell: -0.3 },
      boozier: { taste: 0.6, touch: 0.4 },
    },
    _ = null, // #changes was folded into the sense rows
    ee = document.getElementById("s2"),
    te = {
      taste:
        "Sugar in the Aperol, plus glucose and fructose in the Prosecco. Bitterness moves with the salt rather than the botanicals, which are protected.",
      touch:
        "Ice quantity, the CO2 in the Prosecco and the soda, and the glycerol carrying the weight.",
      hearing:
        "CO2 coming out of solution, and the ice cracking against the glass. Five rows in the whole file.",
      sight: "E110 and E124. Between them a thousandth of a percent of the glass.",
      smell:
        "Bitter orange essence in the Aperol, the terpenes in the Prosecco, and the slice on the rim.",
    },
    ne = {
      taste:
        '<svg viewBox="156.1 39.1 56 56" xmlns="http://www.w3.org/2000/svg" fill="none"><g >\n<path  d="M185.96 48.09C187.22 47.61 188.62 47.56 189.92 47.94V47.94C193.18 48.94 196.56 50.68 199.13 52.95C201.71 55.22 203.47 58 203.5 61.07V61.16C203.5 64.53 201.36 67.91 197.46 70.69L197.44 70.71L197.44 70.74C196.74 73.8 195.32 77.74 193.11 80.92C190.9 84.1 187.91 86.5 184.09 86.5C180.27 86.5 177.29 84.1 175.08 80.92C172.87 77.74 171.45 73.8 170.75 70.74L170.75 70.71L170.72 70.69L170.36 70.43C166.69 67.7 164.69 64.43 164.69 61.16V61.07L164.7 60.79C164.83 57.83 166.56 55.15 169.06 52.95C171.63 50.68 175.01 48.94 178.27 47.94L178.27 47.94C179.57 47.56 180.95 47.61 182.22 48.09V48.09L182.22 48.09C183.44 48.47 184.74 48.47 185.95 48.09L185.96 48.09ZM174.74 62.87C174.12 63.38 173.64 64.03 173.32 64.77C173.04 65.41 172.89 66.1 172.88 66.8L172.89 67.1C172.89 69.13 173.91 73.31 175.82 76.98C176.77 78.82 177.95 80.54 179.33 81.8C180.71 83.06 182.31 83.86 184.09 83.86C185.88 83.86 187.47 83.06 188.86 81.8C190.24 80.54 191.42 78.82 192.37 76.98C194.27 73.31 195.3 69.13 195.3 67.1C195.33 66.3 195.19 65.5 194.86 64.76C194.54 64.03 194.05 63.38 193.44 62.87L193.41 62.85H174.76L174.74 62.87ZM184.09 57.28C180.33 57.24 176.58 57.81 173 58.98L172.93 59.01L172.95 59.07C173.02 59.39 173.2 59.68 173.45 59.89C173.71 60.09 174.03 60.21 174.35 60.21H193.83C194.16 60.21 194.48 60.1 194.73 59.89C194.98 59.69 195.16 59.4 195.23 59.08L195.24 59.02L195.18 59C191.6 57.82 187.86 57.24 184.09 57.28ZM188.84 50.39C188.26 50.29 187.66 50.32 187.09 50.5L186.81 50.6C185.04 51.15 183.15 51.15 181.38 50.6H181.37C180.63 50.3 179.82 50.25 179.05 50.46L179.05 50.46C174.59 51.84 170.07 54.66 168.21 58.02L168.1 58.22L168.31 58.12C173.21 55.7 178.63 54.51 184.09 54.65H184.1C189.56 54.51 194.98 55.7 199.88 58.12L200.09 58.22L199.98 58.02C198.11 54.66 193.6 51.84 189.14 50.46L189.14 50.46L188.84 50.39Z" fill="black" stroke="white" stroke-width="0.147009"/>\n<circle  cx="184.094" cy="67.094" r="24.6239" stroke="black" stroke-width="2.94017"/>\n</g</svg>',
      touch:
        '<svg viewBox="259.1 111.1 56 56" xmlns="http://www.w3.org/2000/svg" fill="none"><g >\n<path  d="M282.19 120.09C283.06 120.09 283.91 120.46 284.52 121.09C285.13 121.73 285.48 122.61 285.48 123.5V128.43C285.96 128.16 286.51 128 287.09 128C287.98 128 288.81 128.35 289.43 129V129C289.7 129.28 289.91 129.6 290.07 129.95C290.61 129.54 291.28 129.29 292.02 129.29C292.89 129.29 293.74 129.65 294.35 130.29C294.7 130.64 294.96 131.06 295.12 131.52C295.64 131.17 296.26 130.96 296.93 130.96C297.81 130.96 298.63 131.31 299.25 131.95L299.25 131.95C299.87 132.59 300.21 133.45 300.21 134.35V146.96C300.21 153.09 295.4 158.09 289.45 158.09H285.47C283.32 158.09 281.25 157.44 279.47 156.2C276.49 154.13 274.71 150.67 274.71 146.96V142.83C274.71 140.27 276.52 138.12 278.9 137.71V123.49C278.9 121.62 280.36 120.09 282.19 120.09ZM282.19 121.82C281.31 121.82 280.58 122.57 280.58 123.5L280.58 143.01C280.58 143.48 280.21 143.87 279.74 143.87C279.27 143.87 278.9 143.47 278.9 143.01V139.48C277.46 139.86 276.39 141.23 276.39 142.85V146.97C276.39 150.12 277.89 153.04 280.41 154.79C281.92 155.84 283.67 156.39 285.47 156.39H289.46C294.45 156.39 298.53 152.18 298.54 146.99L298.54 146.99V134.35C298.54 133.9 298.37 133.48 298.06 133.16C297.76 132.84 297.36 132.67 296.93 132.67C296.05 132.67 295.32 133.42 295.32 134.35V138.5C295.32 138.97 294.95 139.36 294.48 139.36C294 139.36 293.63 138.96 293.63 138.5V132.68C293.63 132.23 293.47 131.81 293.16 131.5L293.16 131.49C292.86 131.18 292.44 131.01 292.02 131.01C291.14 131.01 290.41 131.75 290.41 132.68V138.5C290.41 138.97 290.05 139.36 289.57 139.36C289.1 139.36 288.74 138.97 288.73 138.5L288.71 131.41V131.4C288.71 130.96 288.54 130.53 288.23 130.21L288.23 130.21C287.93 129.89 287.52 129.72 287.09 129.72C286.22 129.72 285.48 130.47 285.48 131.4V138.5C285.48 138.97 285.12 139.37 284.64 139.37C284.17 139.37 283.8 138.97 283.8 138.5V123.5C283.8 123.06 283.63 122.62 283.33 122.31L283.33 122.31C283.03 122 282.61 121.82 282.19 121.82Z" fill="black" stroke="black" stroke-width="0.51453"/>\n<circle  cx="287.094" cy="139.094" r="24.6239" stroke="black" stroke-width="2.94017"/>\n</g</svg>',
      hearing:
        '<svg viewBox="220.1 228.1 56 56" xmlns="http://www.w3.org/2000/svg" fill="none"><g >\n<g >\n<path  d="M245.93 236.31C248.19 235.71 250.75 235.8 253.55 236.56C256.38 237.32 258.7 238.66 260.46 240.54C261.89 242.07 262.94 243.94 263.59 246.1L263.59 246.11C264.62 249.55 264.33 252.93 264.15 253.84C264.03 254.43 263.52 256.07 262.44 257.99C261.07 260.43 259.28 262.48 257.14 264.1C254.71 265.94 253.29 267.2 252.39 268.22C251.49 269.24 251.11 270.01 250.76 270.85C250.41 271.72 249.57 273.36 247.95 274.55C246.74 275.44 245.37 275.89 243.86 275.89C243.32 275.89 242.75 275.83 242.19 275.71C240.02 275.24 238.39 273.98 237.49 272.05H237.49C236.82 270.62 236.58 268.83 236.84 267.14C236.94 266.51 237.54 266.07 238.17 266.17C238.81 266.27 239.25 266.87 239.15 267.5C239.06 268.09 238.92 269.61 239.61 271.06C240.19 272.32 241.23 273.11 242.68 273.43C244.15 273.74 245.46 273.49 246.56 272.67C247.41 272.04 248.15 271.06 248.59 269.97C249.55 267.63 250.81 265.96 255.73 262.24C258.07 260.47 259.57 258.33 260.4 256.84C261.37 255.12 261.78 253.77 261.86 253.38H261.86C261.98 252.76 262.26 249.82 261.35 246.78C260.81 244.96 259.93 243.4 258.75 242.14C257.29 240.58 255.34 239.46 252.94 238.81C250.56 238.17 248.41 238.08 246.56 238.56C245.11 238.93 243.83 239.65 242.74 240.7C241.8 241.61 241.16 242.62 240.76 243.41C240.55 243.8 240.41 244.14 240.32 244.38C240.27 244.5 240.24 244.59 240.21 244.66C240.2 244.69 240.19 244.72 240.19 244.74L240.18 244.77C240.09 245.06 239.9 245.32 239.62 245.47C239.35 245.62 239.03 245.65 238.73 245.57C238.43 245.48 238.18 245.29 238.03 245.01C237.88 244.74 237.85 244.43 237.93 244.12C237.96 244.01 238.75 241.34 241.06 239.07C242.44 237.72 244.08 236.79 245.93 236.31Z" fill="black" stroke="white" stroke-width="0.0735043"/>\n<path  d="M246.25 241.9C247.69 241.25 249.25 241.06 250.78 241.37C252.3 241.67 253.87 242.41 255.19 243.46C256.63 244.6 257.73 246.04 258.36 247.63C258.95 249.11 259.14 250.67 258.91 252.27C258.67 254.01 257.94 255.76 256.73 257.47C256.55 257.73 256.29 257.9 255.98 257.95C255.67 258.01 255.36 257.94 255.11 257.76C254.58 257.39 254.45 256.66 254.82 256.13C256.66 253.51 257.14 250.88 256.19 248.5C255.71 247.29 254.86 246.18 253.74 245.29H253.74C252.71 244.47 251.49 243.89 250.32 243.66C249.28 243.45 248.2 243.58 247.21 244.03C246.28 244.45 245.5 245.13 245 245.94C244.61 246.57 244.42 247.27 244.45 247.94V247.94C244.47 248.67 244.75 249.38 245.26 250.05L245.28 250.06H245.29C246.96 250.01 248.38 250.26 249.53 250.79C250.67 251.33 251.53 252.13 252.06 253.18L252.17 253.39C252.68 254.53 252.81 255.91 252.52 257.29C252.27 258.44 251.75 259.51 251.08 260.24L250.95 260.38C250.73 260.6 250.44 260.72 250.13 260.72C249.81 260.72 249.52 260.6 249.3 260.38C248.84 259.92 248.84 259.18 249.3 258.73C249.72 258.31 250.07 257.6 250.23 256.81C250.42 255.92 250.35 255.05 250.04 254.36C249.76 253.76 249.29 253.29 248.65 252.96C248.1 252.68 247.42 252.5 246.62 252.43L246.56 252.43L246.58 252.48C246.79 253.28 246.77 254.07 246.52 254.83C246.1 256.1 245.13 257.07 244.19 258.02C243.56 258.66 242.9 259.32 242.48 260.01C242.21 260.45 242.13 260.83 242.25 261.14C242.37 261.47 242.69 261.76 243.03 261.99C243.28 262.16 243.56 262.3 243.77 262.38L243.97 262.46C244.26 262.55 244.5 262.76 244.64 263.04C244.78 263.31 244.81 263.63 244.71 263.93C244.55 264.41 244.11 264.74 243.6 264.74C243.48 264.74 243.36 264.72 243.24 264.68H243.24C243.18 264.66 242.61 264.47 241.97 264.08V264.08C241.01 263.5 240.37 262.79 240.06 261.96C239.8 261.27 239.66 260.17 240.47 258.81C241.03 257.88 241.79 257.12 242.52 256.38L242.53 256.37V256.37C242.92 255.98 243.3 255.59 243.62 255.22C243.93 254.84 244.18 254.47 244.3 254.1V254.09C244.35 253.95 244.43 253.69 244.36 253.27C244.28 252.85 244.05 252.28 243.46 251.54C242.61 250.46 242.15 249.28 242.11 248.02C242.07 246.89 242.38 245.74 243.01 244.72C243.75 243.51 244.9 242.51 246.25 241.9Z" fill="black" stroke="white" stroke-width="0.0735043"/>\n</g>\n<circle  cx="248.094" cy="256.094" r="24.6239" stroke="black" stroke-width="2.94017"/>\n</g</svg>',
      sight:
        '<svg viewBox="98.1 230.1 56 56" xmlns="http://www.w3.org/2000/svg" fill="none"><g >\n<g >\n<path  fill-rule="evenodd" clip-rule="evenodd" d="M146.77 257.77C146.67 257.66 144.38 254.97 140.66 252.25C135.69 248.62 130.53 246.7 125.73 246.7C120.93 246.7 115.76 248.62 110.79 252.25C107.07 254.97 104.78 257.66 104.69 257.77C104.32 258.2 104.32 258.84 104.69 259.27C104.78 259.39 107.07 262.07 110.79 264.79C115.76 268.42 120.93 270.34 125.73 270.34C130.53 270.34 135.69 268.42 140.66 264.79C144.38 262.07 146.67 259.39 146.77 259.27C147.13 258.84 147.13 258.2 146.77 257.77ZM112.21 262.94C109.84 261.22 108.06 259.48 107.15 258.52C108.69 256.91 112.71 253.06 117.9 250.79C115.93 252.78 114.72 255.51 114.72 258.52C114.72 261.53 115.93 264.25 117.89 266.24C115.68 265.28 113.74 264.06 112.21 262.94ZM125.73 267.2C120.94 267.2 117.04 263.31 117.04 258.52C117.04 253.73 120.94 249.84 125.73 249.84C130.51 249.84 134.41 253.73 134.41 258.52C134.41 263.31 130.51 267.2 125.73 267.2ZM139.25 262.94C137.71 264.06 135.77 265.28 133.56 266.24C135.52 264.25 136.74 261.53 136.74 258.52C136.74 255.52 135.52 252.79 133.56 250.8C135.77 251.76 137.71 252.98 139.25 254.1C141.61 255.82 143.39 257.56 144.31 258.52C143.39 259.48 141.61 261.22 139.25 262.94ZM128.44 257.02C127.28 257.02 126.34 256.07 126.34 254.91C126.34 254.25 126.64 253.67 127.11 253.28C126.67 253.16 126.21 253.1 125.73 253.1C122.73 253.1 120.3 255.53 120.3 258.52C120.3 261.52 122.73 263.95 125.73 263.95C128.72 263.95 131.15 261.52 131.15 258.52C131.15 257.5 130.87 256.55 130.38 255.74C130.06 256.49 129.31 257.02 128.44 257.02Z" fill="black"/>\n</g>\n<circle  cx="126.094" cy="258.094" r="24.6239" stroke="black" stroke-width="2.94017"/>\n</g</svg>',
      smell:
        '<svg viewBox="57.1 111.1 56 56" xmlns="http://www.w3.org/2000/svg" fill="none"><g >\n<g >\n<g >\n<g >\n<path  d="M79.68 114.7C80.35 114.36 81.13 114.6 81.52 115.22L81.6 115.36C81.6 115.37 81.61 115.38 81.61 115.4C81.63 115.42 81.64 115.45 81.66 115.49C81.7 115.57 81.75 115.69 81.83 115.83C81.97 116.12 82.18 116.53 82.45 117.04C83 118.06 83.78 119.49 84.77 121.16C86.63 124.28 89.21 128.26 92.25 132.01L92.86 132.76C95.47 135.94 97.34 138.67 98.49 141.06C99.64 143.46 100.08 145.52 99.83 147.36V147.36C99.64 149.16 98.77 150.66 97.21 151.84V151.84C95.03 153.53 92.41 154.09 89.84 154.09C85.08 154.09 80.5 152.08 78.99 151.33L78.96 151.31L78.93 151.33C78.5 151.52 78.08 151.71 77.65 151.92L77.22 152.15C75.91 152.83 74.73 153.08 73.8 153.08C72.56 153.08 71.57 152.65 71.01 152.28L71.01 152.28L70.72 152.07C69.29 150.97 68.48 149.04 68.65 147C68.9 144.2 70.71 141.7 73.64 140.39C74.36 140.09 75.19 140.39 75.55 141.11H75.56C75.86 141.83 75.56 142.67 74.84 143.03C72.04 144.3 71.59 146.34 71.53 147.18V147.18C71.46 148.33 71.84 149.3 72.63 149.82C73.41 150.35 74.58 150.27 75.91 149.57H75.91C82.44 146.12 86.57 145.93 86.76 145.93H86.76C87.54 145.87 88.25 146.53 88.25 147.31L88.26 147.31C88.31 148.08 87.66 148.75 86.88 148.81H86.87C86.87 148.81 86.87 148.81 86.86 148.81C86.85 148.81 86.83 148.81 86.81 148.81C86.77 148.81 86.71 148.82 86.62 148.83C86.45 148.84 86.2 148.88 85.88 148.93C85.23 149.04 84.28 149.25 83.09 149.63L82.88 149.69L83.08 149.77C84.79 150.37 86.98 150.95 89.21 151.04C91.43 151.14 93.7 150.74 95.54 149.38L95.54 149.38C96.38 148.72 96.83 148 96.99 147.07L97.02 146.88C97.18 145.53 96.73 143.85 95.67 141.82C94.62 139.78 92.95 137.39 90.65 134.62L90.01 133.84C83.52 125.82 79.27 117.22 79.03 116.62L79.02 116.61L78.96 116.47C78.7 115.79 79.01 115.03 79.68 114.7Z" fill="black" stroke="white" stroke-width="0.147009"/>\n</g>\n</g>\n</g>\n<circle  cx="85.094" cy="139.094" r="24.6239" stroke="black" stroke-width="2.94017"/>\n</g</svg>',
    },
    oe = {
      effects: [
        { name: "Cold Shock", group: "What You Notice", ap: 9, short: "the cold" },
        { name: "Colour Signal", group: "What You Notice", ap: 10, short: "the colour" },
        { name: "Smell Lift", group: "What You Notice", ap: 8, short: "the smell" },
        { name: "Fizz Bite", group: "What You Notice", ap: 9, short: "the fizz" },
        { name: "Bitter Kick", group: "What Your Body Does", ap: 9, short: "the bitterness" },
        { name: "Sharp Acidity", group: "What Your Body Does", ap: 8, short: "the sharpness" },
        { name: "Bitterness Masking", group: "What You Notice", ap: 7, short: "the smoothing" },
        {
          name: "How Quickly It Lands",
          group: "Where It Goes",
          ap: 9,
          short: "how quickly it lands",
        },
        { name: "Sugar Reward", group: "What Your Body Does", ap: 9, short: "the sugar" },
        { name: "Watering Down", group: "Where It Goes", ap: 8, short: "the ice melting" },
        { name: "Body and Texture", group: "What You Notice", ap: 6, short: "the weight of it" },
      ],
      groups: ["What You Notice", "What Your Body Does", "Where It Goes"],
      frames: {
        "What You Notice": {
          Dominant: "It announces itself long before you taste it, on {effects}.",
          Strong: "It makes an entrance, mostly on {effects}.",
          Present: "It registers clearly enough, mainly through {effects}.",
          Minimal: "It arrives quietly. Nothing in the first moment asks for your attention.",
        },
        "What Your Body Does": {
          Dominant: "Then it goes to work on your appetite: {effects} sharpen you for the table.",
          Strong: "It primes you for food, through {effects}.",
          Present:
            "There is some pull towards food, mainly {effects}, but it does not demand a meal.",
          Minimal: "It asks almost nothing of your digestion. This one stands on its own.",
        },
        "Where It Goes": {
          Dominant:
            "It reads bright at the front and clears quickly, which is what an aperitivo is for.",
          Strong: "It builds and fades at an even pace.",
          Present: "It arrives at a steady pace.",
          Minimal:
            "It comes on slowly and stays level. Predictable, with no spike and nothing to come down from.",
        },
      },
      signature: {
        "What You Notice": [
          "Colour Signal",
          "The colour does most of that work, and it is a thousandth of a percent of the glass.",
          "The colour is part of that, but it is not what pulls the eye across a room.",
        ],
        "What Your Body Does": [
          "Bitter Kick",
          "That is bitterness doing a job rather than being a flavour choice.",
          "The bitterness clears quickly though, so it resets the palate rather than building hunger.",
        ],
        "Where It Goes": [
          "Watering Down",
          "Melting ice paces it, so the drink you finish is weaker than the one you were handed.",
          "Nothing meaningful dilutes it, so it holds its strength from the first sip to the last.",
        ],
      },
      archetype: {
        111: "a transition tool, built to end one state and start another",
        110: "an appetite device: it interrupts, primes, then hands you to the meal",
        101: "an opening act: it arrives loudly and then steps aside",
        100: "a showpiece: it makes an entrance and then asks very little of you",
        "011": "a quiet worker: it does the job without announcing itself",
        "010": "an aperitif in function only: it makes you hungry without making a scene",
        "001":
          "a signal more than a meal companion: it arrives, and that is more or less the whole of it",
        "000": "a companion, asking nothing of you and changing little",
      },
      bands: [
        [8.5, "Dominant"],
        [6.5, "Strong"],
        [4, "Present"],
        [0, "Minimal"],
      ],
      strongAt: 7.5,
    },
    re = document.getElementById("drinkline"),
    ae = {
      taste:
        '<svg viewBox="0 0 73 73" fill="none" xmlns="http://www.w3.org/2000/svg">\n<g>\n<circle cx="36.3044" cy="36.3044" r="34.259" fill="#E8CAA3" stroke="black" stroke-width="4.09063"/>\n<path d="M38.9 9.87C40.66 9.2 42.6 9.13 44.41 9.66V9.66C48.94 11.05 53.65 13.47 57.23 16.63C60.7 19.68 63.1 23.41 63.29 27.53L63.3 27.93V28.04C63.3 32.74 60.33 37.43 54.91 41.31L54.87 41.34L54.87 41.37C53.9 45.63 51.92 51.12 48.85 55.54C45.77 59.97 41.62 63.3 36.3 63.3C30.99 63.3 26.84 59.97 23.76 55.54C20.69 51.12 18.71 45.63 17.74 41.37L17.74 41.34L17.7 41.31C12.28 37.43 9.31 32.74 9.31 28.04V27.93C9.35 23.65 11.8 19.78 15.38 16.63C18.96 13.47 23.67 11.05 28.2 9.66L28.2 9.66C30.01 9.13 31.93 9.2 33.69 9.87L33.7 9.87C35.39 10.4 37.2 10.4 38.89 9.87L38.9 9.87ZM23.29 30.42C22.43 31.14 21.76 32.04 21.31 33.07C20.87 34.09 20.66 35.2 20.72 36.31H20.72C20.72 39.13 22.14 44.95 24.79 50.07C26.12 52.63 27.75 55.01 29.68 56.77C31.6 58.52 33.82 59.64 36.3 59.64C38.79 59.64 41.01 58.52 42.93 56.77C44.86 55.02 46.49 52.62 47.82 50.07C50.47 44.95 51.89 39.13 51.89 36.31C51.94 35.2 51.73 34.09 51.28 33.06C50.83 32.04 50.16 31.14 49.3 30.42L49.27 30.4H23.32L23.29 30.42ZM36.3 22.66C31.06 22.59 25.85 23.39 20.86 25.02L20.78 25.05L20.8 25.14C20.9 25.59 21.14 25.99 21.5 26.28C21.85 26.56 22.3 26.72 22.75 26.73H49.86C50.31 26.73 50.75 26.57 51.1 26.29C51.45 26 51.7 25.6 51.79 25.16L51.81 25.07L51.73 25.04C46.75 23.4 41.54 22.59 36.3 22.66ZM32.52 13.35C31.49 12.94 30.36 12.87 29.29 13.15L29.29 13.16C23.08 15.08 16.8 19 14.21 23.68L14.05 23.96L14.34 23.82C21.16 20.45 28.7 18.79 36.3 18.99H36.31C43.91 18.79 51.45 20.45 58.27 23.82L58.56 23.96L58.4 23.68C55.81 19 49.53 15.08 43.32 13.16L43.32 13.16L43.12 13.11C42.11 12.88 41.05 12.97 40.09 13.35C37.62 14.12 34.98 14.12 32.52 13.35Z" fill="black" stroke="black" stroke-width="0.204532"/>\n</g>\n</svg>',
      touch:
        '<svg viewBox="0 0 73 73" fill="none" xmlns="http://www.w3.org/2000/svg">\n<g>\n<circle cx="36.3044" cy="36.3044" r="34.259" fill="#E8CAA3" stroke="black" stroke-width="4.09063"/>\n<path d="M29.48 9.87C30.69 9.87 31.87 10.38 32.72 11.26C33.58 12.14 34.06 13.36 34.06 14.61V21.47C34.72 21.09 35.49 20.87 36.3 20.87C37.53 20.87 38.69 21.36 39.55 22.26H39.55C39.92 22.65 40.23 23.1 40.45 23.59C41.2 23.01 42.13 22.66 43.16 22.66C44.37 22.66 45.55 23.17 46.41 24.05C46.89 24.54 47.24 25.13 47.47 25.77C48.19 25.28 49.05 24.99 49.98 24.99C51.21 24.99 52.36 25.48 53.22 26.36L53.22 26.36C54.09 27.26 54.56 28.45 54.56 29.71V47.25C54.56 55.78 47.86 62.74 39.59 62.74H34.04C31.24 62.74 28.53 61.94 26.16 60.42L25.7 60.11C21.55 57.22 19.07 52.41 19.07 47.25V41.51C19.07 37.94 21.59 34.95 24.91 34.38V14.6C24.91 12 26.94 9.87 29.48 9.87ZM29.48 12.27C28.26 12.27 27.24 13.31 27.24 14.61L27.25 41.75C27.25 42.41 26.73 42.95 26.07 42.95C25.42 42.95 24.91 42.4 24.91 41.75V36.84C22.9 37.37 21.41 39.27 21.41 41.53V47.27C21.41 51.65 23.5 55.71 27.01 58.15C29.1 59.6 31.53 60.37 34.05 60.37H39.59C46.54 60.37 52.22 54.52 52.23 47.3L52.23 47.28V29.71C52.23 29.08 51.99 28.49 51.57 28.05C51.14 27.61 50.58 27.37 49.98 27.37C48.76 27.37 47.74 28.41 47.74 29.71V35.48C47.74 36.13 47.23 36.67 46.57 36.67C45.91 36.67 45.41 36.12 45.41 35.48V27.38C45.41 26.76 45.17 26.18 44.74 25.73L44.74 25.73C44.33 25.3 43.75 25.05 43.16 25.05C41.94 25.05 40.92 26.09 40.92 27.38V35.48C40.92 36.13 40.41 36.67 39.76 36.67C39.1 36.67 38.59 36.13 38.59 35.48L38.55 25.61V25.61C38.55 24.98 38.31 24.39 37.88 23.94L37.88 23.94C37.47 23.5 36.9 23.26 36.3 23.26C35.08 23.26 34.07 24.3 34.07 25.61V35.48C34.07 36.13 33.56 36.68 32.9 36.68C32.23 36.68 31.73 36.13 31.73 35.48V14.61C31.73 13.99 31.48 13.39 31.06 12.95L31.06 12.95C30.65 12.52 30.07 12.27 29.48 12.27Z" fill="#030303" stroke="black" stroke-width="0.71586"/>\n</g>\n</svg>',
      sight:
        '<svg viewBox="0 0 73 73" fill="none" xmlns="http://www.w3.org/2000/svg">\n<g>\n<circle cx="36.3044" cy="36.3044" r="34.259" fill="#E8CAA3" stroke="black" stroke-width="4.09063"/>\n<g>\n<path d="M35.79 20.5C42.46 20.5 49.63 23.17 56.54 28.22C61.71 31.99 64.9 35.73 65.03 35.89C65.52 36.47 65.52 37.33 65.03 37.91C64.9 38.07 61.71 41.8 56.54 45.58C49.63 50.63 42.46 53.29 35.79 53.29C29.13 53.29 21.95 50.63 15.04 45.58C9.88 41.8 6.69 38.07 6.56 37.91C6.06 37.33 6.06 36.47 6.56 35.89C6.69 35.73 9.88 31.99 15.04 28.22C21.95 23.17 29.13 20.5 35.79 20.5ZM35.79 24.77C29.1 24.77 23.66 30.21 23.66 36.9C23.66 43.59 29.1 49.03 35.79 49.03C42.48 49.03 47.92 43.59 47.92 36.9C47.92 30.21 42.48 24.77 35.79 24.77ZM24.88 26.1C17.65 29.26 12.06 34.61 9.91 36.87L9.88 36.9L9.91 36.94C11.18 38.27 13.66 40.7 16.95 43.1C19.09 44.65 21.8 46.35 24.87 47.69L24.93 47.61C22.21 44.85 20.53 41.07 20.53 36.9C20.53 32.72 22.21 28.94 24.94 26.18L24.88 26.1ZM46.72 26.11L46.66 26.19C49.38 28.95 51.06 32.73 51.06 36.9C51.06 41.07 49.38 44.85 46.66 47.61L46.72 47.69C49.79 46.35 52.5 44.65 54.63 43.1C57.93 40.7 60.4 38.27 61.68 36.93L61.71 36.9L61.68 36.86C60.4 35.53 57.93 33.1 54.63 30.7C52.5 29.15 49.79 27.45 46.72 26.11ZM35.79 29.4C36.42 29.4 37.03 29.49 37.61 29.63C36.99 30.18 36.59 30.98 36.59 31.88C36.59 33.52 37.92 34.85 39.57 34.85C40.76 34.85 41.79 34.15 42.27 33.13C42.91 34.24 43.29 35.52 43.29 36.9C43.29 41.04 39.93 44.4 35.79 44.4C31.65 44.4 28.3 41.04 28.3 36.9C28.3 32.76 31.65 29.4 35.79 29.4Z" fill="black" stroke="black" stroke-width="0.102266"/>\n</g>\n</g>\n</svg>',
      hearing:
        '<svg viewBox="0 0 73 73" fill="none" xmlns="http://www.w3.org/2000/svg">\n<g>\n<g>\n<circle cx="36.3044" cy="36.3044" r="34.259" fill="#E8CAA3" stroke="black" stroke-width="4.09063"/>\n<path d="M33.29 8.78C36.44 7.95 40.01 8.07 43.9 9.12C47.83 10.19 51.06 12.06 53.51 14.67C55.5 16.79 56.96 19.39 57.86 22.41L57.86 22.41C59.3 27.21 58.89 31.9 58.64 33.17C58.48 33.99 57.77 36.27 56.26 38.94C54.36 42.33 51.87 45.19 48.89 47.44C45.51 50 43.53 51.76 42.28 53.18C41.02 54.59 40.5 55.66 40.02 56.84C39.56 57.97 38.5 60.04 36.51 61.67L36.1 61.98C34.42 63.22 32.52 63.84 30.42 63.84C29.75 63.84 29.07 63.78 28.39 63.65L28.09 63.59C25.07 62.94 22.81 61.18 21.55 58.51C20.62 56.52 20.29 54.03 20.65 51.68C20.78 50.8 21.62 50.19 22.5 50.32C23.38 50.46 23.99 51.29 23.86 52.18C23.74 52.99 23.55 55.11 24.5 57.13C25.26 58.77 26.58 59.84 28.4 60.33L28.77 60.42C30.81 60.85 32.63 60.5 34.17 59.37C35.35 58.49 36.38 57.13 37 55.61C38.33 52.35 40.08 50.03 46.93 44.85C50.19 42.39 52.27 39.41 53.43 37.35C54.78 34.95 55.34 33.07 55.45 32.54C55.63 31.67 56.01 27.57 54.75 23.35C53.99 20.82 52.77 18.65 51.13 16.89C49.1 14.72 46.38 13.16 43.05 12.26C39.74 11.37 36.75 11.24 34.17 11.91C32.16 12.42 30.37 13.43 28.86 14.88C27.55 16.15 26.66 17.56 26.09 18.65C25.81 19.2 25.61 19.67 25.48 20C25.42 20.17 25.37 20.3 25.34 20.4C25.32 20.44 25.31 20.48 25.3 20.51C25.3 20.53 25.29 20.55 25.29 20.55C25.17 20.96 24.9 21.31 24.52 21.52C24.14 21.73 23.7 21.78 23.28 21.66C22.86 21.54 22.52 21.27 22.31 20.89C22.1 20.51 22.05 20.07 22.17 19.65C22.21 19.5 23.29 15.78 26.52 12.62C28.44 10.74 30.72 9.45 33.29 8.78Z" fill="black" stroke="black" stroke-width="0.102266"/>\n<path d="M33.73 16.56C35.74 15.65 37.92 15.39 40.04 15.81V15.81C42.16 16.24 44.35 17.27 46.18 18.73C48.18 20.31 49.7 22.32 50.59 24.53C51.41 26.59 51.67 28.76 51.36 30.99C51.02 33.41 50 35.84 48.33 38.22C48.07 38.58 47.71 38.82 47.28 38.89C46.85 38.96 46.42 38.87 46.06 38.62C45.33 38.11 45.15 37.09 45.67 36.36C48.23 32.71 48.89 29.04 47.57 25.74C46.9 24.06 45.71 22.51 44.16 21.28C42.73 20.13 41.03 19.32 39.4 19C37.95 18.71 36.46 18.89 35.08 19.52C33.78 20.1 32.69 21.05 32 22.18C31.46 23.06 31.2 24.02 31.23 24.96V24.96C31.27 25.98 31.65 26.96 32.37 27.89L32.38 27.91L32.41 27.91C34.73 27.84 36.71 28.18 38.3 28.92C40 29.72 41.23 30.94 41.97 32.55C42.69 34.13 42.86 36.05 42.46 37.96C42.09 39.68 41.3 41.25 40.27 42.27V42.27C39.97 42.58 39.57 42.74 39.13 42.74C38.7 42.74 38.29 42.57 37.98 42.26C37.35 41.63 37.35 40.6 37.98 39.97C38.56 39.39 39.05 38.39 39.28 37.3C39.54 36.06 39.45 34.85 39.01 33.9C38.67 33.17 38.13 32.57 37.4 32.13L37.08 31.95C36.31 31.56 35.36 31.31 34.25 31.21L34.18 31.2L34.19 31.27C34.49 32.39 34.46 33.49 34.11 34.55C33.53 36.31 32.18 37.67 30.87 38.99C30.1 39.76 29.3 40.56 28.73 41.4L28.49 41.76C28.12 42.37 28.01 42.89 28.17 43.32C28.34 43.78 28.78 44.19 29.26 44.5C29.73 44.82 30.24 45.05 30.56 45.16H30.56C30.97 45.29 31.3 45.58 31.5 45.96C31.7 46.35 31.73 46.79 31.6 47.2C31.38 47.88 30.76 48.33 30.05 48.33C29.88 48.33 29.71 48.3 29.55 48.25L29.55 48.25L29.36 48.18C29.06 48.07 28.45 47.82 27.78 47.42C26.53 46.67 25.67 45.75 25.21 44.69L25.12 44.47C24.77 43.51 24.57 41.97 25.7 40.09C26.29 39.11 27.03 38.27 27.79 37.48L28.56 36.7L28.57 36.68C29.11 36.14 29.64 35.61 30.07 35.09C30.45 34.63 30.77 34.17 30.95 33.72L31.02 33.52C31.09 33.32 31.21 32.95 31.11 32.37C31 31.79 30.68 31 29.86 29.97H29.86C28.67 28.46 28.04 26.82 27.98 25.08C27.92 23.5 28.35 21.91 29.23 20.48C30.25 18.8 31.85 17.41 33.73 16.56Z" fill="black" stroke="black" stroke-width="0.102266"/>\n</g>\n</g>\n</svg>',
      smell:
        '<svg viewBox="0 0 73 73" fill="none" xmlns="http://www.w3.org/2000/svg">\n<g>\n<circle cx="36.3044" cy="36.3044" r="34.259" fill="#E8CAA3" stroke="black" stroke-width="4.09063"/>\n<g>\n<g>\n<g>\n<path d="M28.77 2.36C29.77 1.86 30.94 2.27 31.44 3.28V3.27C31.44 3.29 31.45 3.31 31.46 3.33C31.48 3.37 31.5 3.41 31.53 3.47C31.58 3.58 31.66 3.74 31.76 3.94C31.96 4.34 32.25 4.91 32.63 5.62C33.39 7.04 34.48 9.03 35.86 11.35C38.45 15.7 42.03 21.23 46.26 26.46L47.11 27.49C50.74 31.91 53.34 35.71 54.94 39.05C56.55 42.38 57.15 45.25 56.8 47.8V47.81C56.54 50.32 55.34 52.39 53.17 54.04H53.17C50.13 56.38 46.48 57.17 42.9 57.17C36.28 57.17 29.91 54.38 27.81 53.33L27.77 53.31L27.72 53.33C27.13 53.59 26.54 53.85 25.95 54.15L25.36 54.47C23.53 55.42 21.89 55.77 20.59 55.77C18.86 55.77 17.48 55.16 16.71 54.65H16.71C14.54 53.23 13.25 50.51 13.41 47.59L13.43 47.3C13.78 43.41 16.29 39.94 20.37 38.11C21.31 37.72 22.39 38.06 22.94 38.93L23.04 39.11C23.42 40.05 23.08 41.13 22.21 41.68L22.04 41.77C18.14 43.54 17.52 46.38 17.43 47.55L17.43 47.55C17.34 49.15 17.87 50.5 18.96 51.23C19.99 51.91 21.47 51.86 23.18 51.06L23.53 50.88C32.61 46.08 38.37 45.82 38.62 45.82L38.62 45.82C39.7 45.74 40.7 46.65 40.7 47.73L40.7 47.74C40.79 48.81 39.88 49.73 38.79 49.82H38.79C38.78 49.82 38.78 49.82 38.78 49.82C38.78 49.82 38.77 49.82 38.76 49.82C38.75 49.82 38.73 49.82 38.69 49.82C38.63 49.83 38.55 49.83 38.43 49.85C38.19 49.87 37.85 49.92 37.4 49.99C36.49 50.15 35.18 50.43 33.51 50.96L33.22 51.05L33.51 51.15C35.88 51.99 38.93 52.8 42.02 52.93C45.12 53.06 48.28 52.51 50.84 50.61L50.84 50.61C52.09 49.63 52.72 48.56 52.89 47.13V47.13C53.12 45.26 52.49 42.92 51.02 40.09C49.65 37.44 47.52 34.34 44.62 30.79L44.03 30.08L43.15 29C34.11 17.84 28.2 5.87 27.86 5.03H27.86L27.86 5.02L27.77 4.83C27.41 3.88 27.84 2.83 28.77 2.36Z" fill="black" stroke="black" stroke-width="0.204532"/>\n</g>\n</g>\n</g>\n</g>\n</svg>',
    };
  function ie(e) {
    var t = {};
    oe.groups.forEach(function (n) {
      var o = oe.effects.filter(function (e) {
        return e.group === n;
      });
      t[n] =
        o.reduce(function (t, n) {
          return t + e[n.name];
        }, 0) / o.length;
    });
    var n = oe.groups
        .map(function (e) {
          return t[e] >= oe.strongAt ? "1" : "0";
        })
        .join(""),
      o = ["The Aperol Spritz is " + oe.archetype[n] + "."];
    return (
      oe.groups.forEach(function (n) {
        var r,
          a =
            oe.frames[n][
              (function (e) {
                for (var t = 0; t < oe.bands.length; t++)
                  if (e >= oe.bands[t][0]) return oe.bands[t][1];
                return oe.bands[oe.bands.length - 1][1];
              })(t[n])
            ];
        if (a.indexOf("{effects}") >= 0) {
          var i = oe.effects
            .filter(function (e) {
              return e.group === n;
            })
            .sort(function (t, n) {
              return e[n.name] - e[t.name];
            })
            .slice(0, 2)
            .map(function (e) {
              return e.short;
            });
          a = a.replace(
            "{effects}",
            (r = i).length < 2 ? r[0] || "" : r.slice(0, -1).join(", ") + " and " + r[r.length - 1],
          );
        }
        o.push(a);
        var s = oe.signature[n];
        void 0 !== e[s[0]] && o.push(e[s[0]] >= 6 ? s[1] : s[2]);
      }),
      o
    );
  }
  !(function () {
    var e = document.getElementById("senseover");
    e &&
      (["taste", "touch", "sight", "hearing", "smell"].forEach(function (t) {
        var n = document.createElement("i");
        ((n.innerHTML = ae[t]), e.appendChild(n), W.push(n));
      }),
      O(),
      requestAnimationFrame(O),
      addEventListener("resize", O));
  })();
  var se = {
      sweeter: { "Sugar Reward": 1 },
      bitter: { "Bitter Kick": 1, "Bitterness Masking": -0.4 },
      colder: { "Cold Shock": 1, "Watering Down": 0.4 },
      fizzier: { "Fizz Bite": 1 },
      brighter: { "Colour Signal": 1 },
      aromatic: { "Smell Lift": 1, "Body and Texture": 0.3 },
      sharper: { "Sharp Acidity": 1 },
      fuller: { "Body and Texture": 1 },
      smoother: { "Bitterness Masking": 1, "Bitter Kick": -0.3 },
      longer: { "Watering Down": 1, "Cold Shock": 0.3 },
      boozier: { "How Quickly It Lands": 1, "Watering Down": -0.3 },
    },
    le = {};
  oe.effects.forEach(function (e) {
    le[e.name] = e.ap;
  });
  var ce = ie(le);
  var ue = {};
  function de() {
    var e = {};
    for (var t in G) e[t] = G[t];
    for (var n in ue) {
      var o = ue[n] - 1;
      if (o) for (var t in Q[n]) e[t] = Math.max(0, Math.min(10, e[t] + Q[n][t] * o * 6));
    }
    U(e, 1);
    var r = [];
    // Update the sense rows in place rather than rebuilding a separate list:
    // the number changes, and arrows appear on the rows that actually moved.
    (Y.forEach(function (t) {
      var n = t.dataset.s,
        o = e[n] - G[n],
        i = t.querySelector("em"),
        l = t.querySelector(".arrows"),
        c = Math.abs(o) >= 0.5;
      (i && (i.textContent = Math.round(e[n])),
        t.classList.toggle("moved", c),
        t.classList.toggle("up", c && o > 0),
        t.classList.toggle("dn", c && o < 0));
      if (l) {
        if (c) {
          var u = Math.max(1, Math.min(3, Math.round(Math.abs(o) / 1.6)));
          ((l.style.color = o > 0 ? "var(--up)" : "var(--dn)"),
            (l.innerHTML = new Array(u + 1)
              .join(s)
              .replace(/<svg/g, o < 0 ? '<svg style="transform:rotate(180deg)"' : "<svg")));
        } else ((l.innerHTML = ""), (l.style.color = ""));
      }
      c && r.push(n);
    }),
      (function () {
        var e = {};
        for (var t in le) e[t] = le[t];
        for (var n in ue) {
          var o = ue[n] - 1;
          if (o) for (var r in se[n]) e[r] = Math.max(0, Math.min(10, e[r] + se[n][r] * o * 7));
        }
        var a = !1;
        for (var i in ue) Math.abs(ue[i] - 1) > 0.02 && (a = !0);
        // fe holds the recomputed scores for "the one you made". The Peroni
        // comparison shows it as its own column, so it re-renders on every
        // change rather than waiting for a toggle.
        (a ? (fe = pe(e)) : (fe = null), me());
        var l = ie(e);
        re.innerHTML = l
          .map(function (e, t) {
            return '<span class="cl' + (e !== ce[t] ? " hit" : "") + '">' + e + "</span>";
          })
          .join(" ");
      })(),
      // "touched" still marks that the drink has been changed from as-served;
      // the separate #changes list is gone, since the sense rows now carry that
      // information themselves.
      ee.classList.toggle("touched", r.length > 0));
  }
  ([].slice.call(document.querySelectorAll(".dial input")).forEach(function (e) {
    e.oninput = function () {
      var t = e.dataset.d,
        n = +e.value / 100;
      ((ue[t] = n),
        (document.getElementById("v-" + t).textContent =
          Math.abs(n - 1) < 0.02
            ? "as served"
            : (n > 1 ? "+" : "") + Math.round(100 * (n - 1)) + "%"),
        de());
    };
  }),
    (document.getElementById("reset").onclick = function () {
      ((ue = {}),
        [].slice.call(document.querySelectorAll(".dial input")).forEach(function (e) {
          ((e.value = 100),
            (document.getElementById("v-" + e.dataset.d).textContent = "as served"));
        }),
        de());
    }));
  var he = [
      ["What you notice", 8.2, 4.8],
      ["What your body does", 8.7, 3.7],
      ["Where it goes", 8.5, 3.5],
    ],
    Ce = "base",
    fe = null,
    ge = {
      "What You Notice":
        "No colour signal to speak of and no garnish, so a large part of what the Spritz does before the first sip is simply not present.",
      "What Your Body Does":
        "Little bitter kick and no sugar reward, so almost nothing here is priming an appetite.",
      "Where It Goes":
        "Nothing in a Peroni melts, so it does not change in the glass. The Spritz does, and that is the real difference between the two.",
    };
  function pe(e) {
    var t = {};
    return (
      oe.groups.forEach(function (n) {
        var o = oe.effects.filter(function (e) {
          return e.group === n;
        });
        t[n] =
          o.reduce(function (t, n) {
            return t + e[n.name];
          }, 0) / o.length;
      }),
      t
    );
  }
  function me() {
    [].slice.call(document.querySelectorAll("#s5 .gcell")).forEach(function (e) {
      !e.dataset.base &&
        e.getAttribute("data-tip") &&
        ((e.dataset.base = e.getAttribute("data-tip")),
        (e.dataset.baselab = e.getAttribute("data-lab") || ""));
    });
    [].slice.call(document.querySelectorAll("#s5 .vsgrid .glab"));
    // Three columns per group now: as served, the one you made, Peroni.
    // The middle column stays a dash until a dial has actually been moved.
    var e = [].slice.call(document.querySelectorAll("#s5 .vsgrid .gcell")),
      t = null,
      mine = fe || null;
    he.forEach(function (n, o) {
      var r = t ? Math.round(10 * t[oe.groups[o]]) / 10 : n[1],
        a = n[2],
        i = r - a,
        l = Math.max(1, Math.min(3, Math.round(Math.abs(i) / 1.6))),
        c = r >= a;
      function u(e, t) {
        return (
          '<span class="arrows" style="color:' +
          (t ? "var(--dn)" : "var(--up)") +
          '">' +
          new Array(e + 1)
            .join(s)
            .replace(/<svg/g, t ? '<svg style="transform:rotate(180deg)"' : "<svg") +
          "</span>"
        );
      }
      ((e[3 * o].className = "gcell " + (c ? "lead" : "trail")),
        (e[3 * o].innerHTML = "<span>" + r.toFixed(1) + "</span>" + u(l, !c)));

      // Middle column: your version, measured against as-served rather than
      // against the Peroni, because that is the change you just made.
      var mc = e[3 * o + 1];
      if (mc) {
        if (mine) {
          var mv = Math.round(10 * mine[oe.groups[o]]) / 10,
            md = mv - n[1],
            mu = Math.abs(md) < 0.05,
            ml = Math.max(1, Math.min(3, Math.round(Math.abs(md) / 1.6)));
          ((mc.className = "gcell mine on " + (mu ? "same" : md > 0 ? "lead" : "trail")),
            (mc.innerHTML = "<span>" + mv.toFixed(1) + "</span>" + (mu ? "" : u(ml, md < 0))),
            mc.setAttribute("data-lab", "Your version"),
            mc.setAttribute(
              "data-tip",
              mu
                ? "Unchanged from as served on this group. What you asked for moves other things."
                : (md > 0 ? "Up " : "Down ") +
                    Math.abs(md).toFixed(1) +
                    " on as served, recomputed from the dials you moved.",
            ));
        } else {
          ((mc.className = "gcell mine"),
            (mc.innerHTML = "<span>&mdash;</span>"),
            mc.setAttribute("data-lab", "Your version"),
            mc.setAttribute(
              "data-tip",
              "Move a dial in Change it and this column fills in, recomputed from what you asked for.",
            ));
        }
      }
      var d = oe.groups[o],
        h = t ? ke() : le,
        C = oe.effects.filter(function (e) {
          return e.group === d;
        }),
        f = C.slice().sort(function (e, t) {
          return h[t.name] - h[e.name];
        }),
        g = Math.abs(i).toFixed(1).replace(/\.0$/, "") + (1 === Math.abs(i) ? " point" : " points");
      (e[3 * o].setAttribute("data-lab", C.length + " effects, averaged"),
        e[3 * o].setAttribute(
          "data-tip",
          (t ? "Recomputed from the dials you moved. " : "") +
            f[0].name +
            " leads this group at " +
            h[f[0].name].toFixed(1) +
            ", with " +
            f[f.length - 1].name.toLowerCase() +
            " lowest at " +
            h[f[f.length - 1].name].toFixed(1) +
            ". " +
            (c
              ? "Ahead of the Peroni by " + g + "."
              : "Behind the Peroni by " + g + ", which the workbook has never produced before."),
        ),
        e[3 * o + 2].setAttribute("data-lab", C.length + " effects, averaged"),
        e[3 * o + 2].setAttribute(
          "data-tip",
          ge[d] + " " + (c ? "Behind by " + g + "." : "Ahead by " + g + "."),
        ),
        (e[3 * o + 2].className = "gcell " + (c ? "trail" : "lead")),
        (e[3 * o + 2].innerHTML = "<span>" + a.toFixed(1) + "</span>" + u(l, c)));
    });
    // The column headings are static now; nothing relabels them.
    var mh = document.getElementById("minehead");
    mh && mh.classList.toggle("filled", !!mine);
    var sn = document.getElementById("swnote");
    sn && (sn.textContent = mine ? "recomputed" : "move a dial");
  }
  me();
  var ve = document.getElementById("sheet"),
    ye = document.getElementById("sheetbody"),
    we = document.getElementById("sheettitle"),
    be = {
      sweeter: "Producer",
      bitter: "Walled",
      colder: "Bar",
      fizzier: "Bar",
      brighter: "Producer",
      aromatic: "Bar",
      sharper: "Bar",
      fuller: "Producer",
      smoother: "Bar",
      longer: "Bar",
      boozier: "Bar",
    },
    Le = {
      sweeter: "Sweeter",
      bitter: "More bitter",
      colder: "Colder",
      fizzier: "Fizzier",
      brighter: "Bolder colour",
      aromatic: "More aromatic",
      sharper: "Sharper",
      fuller: "Fuller bodied",
      smoother: "Smoother",
      longer: "Longer serve",
      boozier: "Boozier",
    };
  function ke() {
    var e = {};
    for (var t in le) e[t] = le[t];
    for (var n in ue) {
      var o = ue[n] - 1;
      if (o) for (var r in se[n]) e[r] = Math.max(0, Math.min(10, e[r] + se[n][r] * o * 7));
    }
    return e;
  }
  function xe(e, t) {
    var n = e - t;
    return Math.abs(n) < 0.05
      ? "<em>&mdash;</em>"
      : '<em class="' + (n > 0 ? "up" : "dn") + '">' + (n > 0 ? "+" : "") + n.toFixed(1) + "</em>";
  }
  function Ee() {
    var e = [],
      t = ke(),
      n = (function () {
        var e = {};
        for (var t in G) e[t] = G[t];
        for (var n in ue) {
          var o = ue[n] - 1;
          if (o) for (var r in Q[n]) e[r] = Math.max(0, Math.min(10, e[r] + Q[n][r] * o * 6));
        }
        return e;
      })(),
      o = !1;
    for (var r in ue) Math.abs(ue[r] - 1) > 0.02 && (e.push(r), (o = !0));
    we.textContent = o ? "The one you made" : "As it is served";
    var a = "";
    ((a += '<div class="sblk"><h4>What the drink is</h4><p>' + ie(t).join(" ") + "</p></div>"),
      (a += '<div class="sblk"><h4>What you asked for</h4>'),
      e.length
        ? e.forEach(function (e) {
            var t = Math.round(100 * (ue[e] - 1));
            a +=
              '<div class="lever"><b>' +
              Le[e] +
              "</b><span>" +
              (t > 0 ? "+" : "") +
              t +
              '%</span><span class="who">' +
              be[e] +
              "</span></div>";
          })
        : (a +=
            '<p style="color:var(--mut)">Nothing yet. Every dial is at as served, so this report is the baseline drink exactly as the workbook describes it.</p>'),
      (a += "</div>"),
      e.indexOf("bitter") >= 0 &&
        (a +=
          '<div class="sblk"><h4>Where it had to route around</h4><p class="walled"><b>Bitterness is walled.</b> Gentian, quinine and rhubarb are protected, so nothing on this page touches them. The model reaches bitterness indirectly instead, by easing off the things that were suppressing it: salt and cold. The bitterness you gain was already in the glass.</p></div>'),
      (a +=
        '<div class="sblk"><h4>The five senses</h4><div class="srow hd"><span>Sense</span><i>As served</i><u>Now</u><em>Change</em></div>'),
      j.forEach(function (e) {
        var t = e[0],
          o = t.charAt(0).toUpperCase() + t.slice(1);
        a +=
          '<div class="srow"><b>' +
          o +
          "</b><i>" +
          G[t].toFixed(1) +
          "</i><u>" +
          n[t].toFixed(1) +
          "</u>" +
          xe(n[t], G[t]) +
          "</div>";
      }),
      (a += "</div>"),
      (a +=
        '<div class="sblk"><h4>All eleven effects</h4><div class="srow hd"><span>Effect</span><i>As served</i><u>Now</u><em>Change</em></div>'),
      oe.effects.forEach(function (e) {
        a +=
          '<div class="srow"><b>' +
          e.name +
          "</b><i>" +
          le[e.name].toFixed(1) +
          "</i><u>" +
          t[e.name].toFixed(1) +
          "</u>" +
          xe(t[e.name], le[e.name]) +
          "</div>";
      }),
      (a += "</div>"));
    var i = pe(t),
      s = pe(le);
    ((a +=
      '<div class="sblk"><h4>The three groups</h4><div class="srow hd"><span>Group</span><i>As served</i><u>Now</u><em>Change</em></div>'),
      oe.groups.forEach(function (e) {
        a +=
          '<div class="srow"><b>' +
          e +
          "</b><i>" +
          s[e].toFixed(1) +
          "</i><u>" +
          i[e].toFixed(1) +
          "</u>" +
          xe(i[e], s[e]) +
          "</div>";
      }),
      (a += "</div>"),
      (a +=
        '<div class="sblk"><h4>What this report does not cover</h4><p style="color:var(--mut);font-size:14px">The pour ratio cannot move: there is no row in the workbook for the volume of Aperol against Prosecco against soda, so nothing here can make the drink stronger or weaker by rebalancing the glass. Timings are derived rather than measured for nine of the eleven effects. Peroni has no row feeding sharp acidity at all.</p></div>'),
      (ye.innerHTML = a));
  }
  function Se() {
    ((ve.hidden = !0), (document.body.style.overflow = ""));
  }
  (document.getElementById("fullinfo").addEventListener("click", function () {
    (Ee(),
      (ve.hidden = !1),
      (document.body.style.overflow = "hidden"),
      document.getElementById("sheetx").focus());
  }),
    document.getElementById("sheetx").addEventListener("click", Se),
    ve.addEventListener("click", function (e) {
      e.target === ve && Se();
    }),
    addEventListener("keydown", function (e) {
      "Escape" !== e.key || ve.hidden || Se();
    }));
  var Me = document.createElement("div");
  ((Me.id = "tip"),
    (Me.innerHTML = '<i class="arw"></i><span class="lab"></span><span class="txt"></span>'),
    document.body.appendChild(Me));
  var Ae = null;
  function He(e) {
    var t = e.getAttribute("data-tip");
    t &&
      ((Ae = e),
      (Me.querySelector(".lab").textContent = e.getAttribute("data-lab") || "What drives it"),
      (Me.querySelector(".txt").textContent = t),
      Me.classList.add("on"),
      Be(e));
  }
  function Be(e) {
    var t = e.getBoundingClientRect(),
      n = Me.offsetWidth,
      o = Me.offsetHeight,
      r = t.bottom + o + 12 < innerHeight,
      a = r ? t.bottom + 12 : t.top - o - 12;
    !r && a < 64 && ((r = !0), (a = t.bottom + 12));
    var i = t.left + t.width / 2 - n / 2;
    ((i = Math.max(14, Math.min(innerWidth - n - 14, i))),
      (Me.style.top = a + "px"),
      (Me.style.left = i + "px"),
      Me.classList.toggle("below", r),
      Me.classList.toggle("above", !r));
    var s = t.left + t.width / 2 - i - 4.5;
    Me.querySelector(".arw").style.left = Math.max(12, Math.min(n - 21, s)) + "px";
  }
  function qe() {
    (Me.classList.remove("on"), (Ae = null));
  }
  (document.addEventListener("mouseover", function (e) {
    var t = e.target.closest ? e.target.closest("[data-tip]") : null;
    t && t !== Ae && He(t);
  }),
    document.addEventListener("mouseout", function (e) {
      var t = e.target.closest ? e.target.closest("[data-tip]") : null;
      t && t === Ae && !t.contains(e.relatedTarget) && qe();
    }),
    document.addEventListener("focusin", function (e) {
      var t = e.target.closest ? e.target.closest("[data-tip]") : null;
      t && He(t);
    }),
    document.addEventListener("focusout", qe),
    addEventListener(
      "scroll",
      function () {
        Ae && Be(Ae);
      },
      { passive: !0 },
    ),
    addEventListener("keydown", function (e) {
      "Escape" === e.key && qe();
    }));
  var Te = [].slice.call(document.querySelectorAll(".trow"));
  if ("IntersectionObserver" in window) {
    var Fe = new IntersectionObserver(
      function (e) {
        e.forEach(function (e) {
          if (e.isIntersecting) {
            var t = +e.target.dataset.i;
            (setTimeout(function () {
              e.target.classList.add("on");
            }, 70 * t),
              Fe.unobserve(e.target));
          }
        });
      },
      { threshold: 0.35 },
    );
    Te.forEach(function (e) {
      Fe.observe(e);
    });
  } else
    Te.forEach(function (e) {
      e.classList.add("on");
    });
  var Ve = [].slice.call(document.querySelectorAll("#nav a"));
  var Ie = { s1: [0.04, 0.28, 0.52, 0.76, 0.99], s2: [0.06, 0.8] };
  function We() {
    Object.keys(Ie).forEach(function (e) {
      var t = document.getElementById(e);
      if (t) {
        var n = t.querySelector(".track"),
          o = t.querySelector(".pin");
        if (n && o)
          if (
            ([].slice.call(n.querySelectorAll(".snap")).forEach(function (e) {
              e.remove();
            }),
            "sticky" === getComputedStyle(o).position || Ke.length)
          ) {
            var r = 0.91 * (n.offsetHeight - o.offsetHeight);
            Ie[e].forEach(function (e) {
              var t = document.createElement("i");
              ((t.className = "snap"), (t.style.top = Math.round(e * r) + "px"), n.appendChild(t));
            });
          }
      }
    });
  }
  var Oe = [],
    Re = null,
    Ze = !1,
    Pe = 0;
  function ze() {
    ((Oe = [].map.call(document.querySelectorAll(".snap"), function (e) {
      return Math.round(e.getBoundingClientRect().top + pageYOffset);
    })),
      ["s4", "s5"].forEach(function (e) {
        var t = document.getElementById(e);
        t && Oe.push(Math.round(t.getBoundingClientRect().top + pageYOffset));
      }),
      Oe.sort(function (e, t) {
        return e - t;
      }));
    for (var e = [], t = 1; t < Oe.length; t++) e.push(Oe[t] - Oe[t - 1]);
    (e.sort(function (e, t) {
      return e - t;
    }),
      (Pe = e.length ? e[Math.floor(e.length / 2)] : innerHeight));
  }
  var De = 0,
    Ne = 1;
  // REMOVED: hand-rolled scroll snapping.
  //
  // This used to fire 150ms after the user stopped scrolling and smooth-scroll
  // them to the nearest ".snap" marker — searching up to 0.55 x section height
  // ahead and up to 140px BEHIND the current position. Creeping slowly through
  // a section therefore got you yanked backwards, and a normal flick got thrown
  // half a section forward. That is the "animates too fast / sometimes goes in
  // reverse" behaviour. There is no replacement: scrolling is now entirely the
  // user's, and #s1's animation is scrubbed off it by ScrollTrigger (b.js).
  function Ye() {}
  addEventListener("keydown", function (e) {
    if (!(e.metaKey || e.ctrlKey || e.altKey || e.shiftKey))
      if (ve.hidden) {
        var t = e.target,
          n = t && t.tagName;
        if (!("INPUT" === n || "TEXTAREA" === n || "SELECT" === n || (t && t.isContentEditable))) {
          var o = "ArrowRight" === e.key || "ArrowDown" === e.key,
            r = "ArrowLeft" === e.key || "ArrowUp" === e.key;
          (o || r) &&
            (function (e) {
              if (Oe.length) {
                var t = pageYOffset,
                  n = null;
                if (e > 0) {
                  for (var o = 0; o < Oe.length; o++)
                    if (Oe[o] > t + 12) {
                      n = Oe[o];
                      break;
                    }
                } else
                  for (var r = Oe.length - 1; r >= 0; r--)
                    if (Oe[r] < t - 12) {
                      n = Oe[r];
                      break;
                    }
                return (
                  null !== n &&
                  ((Ze = !0),
                  clearTimeout(Re),
                  scrollTo({ top: n, behavior: "smooth" }),
                  setTimeout(function () {
                    Ze = !1;
                  }, 620),
                  !0)
                );
              }
            })(o ? 1 : -1) &&
            e.preventDefault();
        }
      } else {
        var a = "ArrowDown" === e.key || "ArrowRight" === e.key,
          i = "ArrowUp" === e.key || "ArrowLeft" === e.key;
        (a || i) &&
          (ye.scrollBy({ top: 90 * (a ? 1 : -1), behavior: "smooth" }), e.preventDefault());
      }
  });
  var je = { s1: 640, s2: 300 };
  function Ge() {
    var e = window.HOSTVH || innerHeight;
    for (var t in ((e = Math.max(420, Math.min(1400, e))), je)) {
      var n = document.getElementById(t);
      if (n) {
        var o = n.querySelector(".track");
        o && (o.style.height = Math.round((e * je[t]) / 100) + "px");
      }
    }
  }
  window.HOSTVH = window.HOSTVH || 0;
  var Ke = [];
  function Ue(e) {
    for (var t = e.parentElement; t && t !== document.documentElement; t = t.parentElement) {
      var n = getComputedStyle(t);
      if (
        (n.transform && "none" !== n.transform) ||
        (n.filter && "none" !== n.filter) ||
        (n.perspective && "none" !== n.perspective)
      )
        return !0;
    }
    return !1;
  }
  function Xe() {
    var e = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav")) || 68;
    Ke.forEach(function (t) {
      var n = t.tr.getBoundingClientRect(),
        o = t.pn.offsetHeight;
      if (window.HOSTVH) {
        var r = a(t.tr),
          i = window.HOSTSCROLL - r;
        return (
          (t.pn.style.position = "absolute"),
          (t.pn.style.left = "0px"),
          (t.pn.style.width = "100%"),
          void (t.pn.style.top = Math.round(Math.min(Math.max(0, i), t.tr.offsetHeight - o)) + "px")
        );
      }
      n.top > e
        ? ((t.pn.style.position = "absolute"),
          (t.pn.style.top = "0px"),
          (t.pn.style.left = "0px"),
          (t.pn.style.width = "100%"))
        : n.bottom < e + o
          ? ((t.pn.style.position = "absolute"),
            (t.pn.style.top = Math.max(0, t.tr.offsetHeight - o) + "px"),
            (t.pn.style.left = "0px"),
            (t.pn.style.width = "100%"))
          : t.noFixed
            ? ((t.pn.style.position = "absolute"),
              (t.pn.style.top = Math.round(e - n.top) + "px"),
              (t.pn.style.left = "0px"),
              (t.pn.style.width = "100%"))
            : ((t.pn.style.position = "fixed"),
              (t.pn.style.top = e + "px"),
              (t.pn.style.left = Math.round(n.left) + "px"),
              (t.pn.style.width = Math.round(n.width) + "px"));
    });
  }
  var $e,
    Je = [];
  // REMOVED: the JS "fake sticky" fallback that manually positioned .pin with
  // position:fixed/absolute when it decided CSS sticky would not work. It ran
  // on every scroll event, wrote layout, then read it back on the next frame —
  // a second source of the jitter. Pinning is now ScrollTrigger's job on
  // desktop (b.js) and does not happen at all on mobile.
  function Qe() {
    (Ke.forEach(function (e) {
      ((e.pn.style.position = ""),
        (e.pn.style.top = ""),
        (e.pn.style.left = ""),
        (e.pn.style.width = ""));
    }),
      (Ke = []));
  }
  function QeLegacy() {
    if (window.HOSTVH)
      return (
        ["s1", "s2"].forEach(function (e) {
          var t = document.getElementById(e);
          if (t) {
            var n = t.querySelector(".track"),
              o = t.querySelector(".pin");
            n && o && Ke.push({ tr: n, pn: o, noFixed: !0 });
          }
        }),
        void Xe()
      );
    (["s1", "s2"].forEach(function (e) {
      var t = document.getElementById(e);
      if (t) {
        var n = t.querySelector(".track"),
          o = t.querySelector(".pin");
        n &&
          o &&
          (function (e) {
            for (
              var t = e.parentElement;
              t && t !== document.body && t !== document.documentElement;
              t = t.parentElement
            ) {
              var n = getComputedStyle(t);
              if (/hidden|auto|scroll|clip/.test(n.overflow + " " + n.overflowY)) return !0;
            }
            return !1;
          })(o) &&
          Ke.push({ tr: n, pn: o, noFixed: Ue(o) });
      }
    }),
      Ke.length && Xe());
  }
  function _e() {
    var e, t;
    // #s1 progress. On desktop ScrollTrigger owns this and writes a smoothed,
    // always-monotonic value to window.APEROL_P (b.js). Off desktop there is no
    // parallax at all, so #s1 sits at its resolved end state and the steps are
    // revealed individually by IntersectionObserver.
    // 0.30 is the resting state of the #s1 illustration on the flat path: the
    // masthead logo has cleared, the copy column is at full opacity, and the
    // drink is still intact — ice, orange and straw in place, before the
    // scrubbed sequence starts pulling it apart at 0.32.
    ((I = window.APEROL_DESKTOP_PARALLAX
      ? "number" == typeof window.APEROL_P
        ? window.APEROL_P
        : i(c, u)
      : 0.3),
      (e = 0.4 * innerHeight),
      (t = "s1"),
      ["s1", "s2", "s4", "s5"].forEach(function (n) {
        var o = document.getElementById(n);
        if (o) {
          var r = o.getBoundingClientRect();
          r.top <= e && r.bottom > e && (t = n);
        }
      }),
      "s2" === t && J && (t = "s2b"),
      Ve.forEach(function (e) {
        e.classList.toggle("on", e.dataset.t === t);
      }));
  }
  function et() {
    (Ge(), R(), o(), Qe(), We(), ze(), _e());
  }
  (addEventListener("scroll", _e, { passive: !0 }),
    (window.aperolReflow = et),
    (window.aperolScroll = _e),
    // Flat path: #lg is the pour and #lg2 is the impact weighting. The pinned
    // path cross-fades one into the other; here each list simply states its own
    // numbers, once. (The old build wrote the same interpolated values into
    // both lists, so "by volume" and "by impact" always read identically.)
    (function () {
      if (window.APEROL_DESKTOP_PARALLAX) return;
      [
        [L, v],
        [k, y],
      ].forEach(function (pair) {
        pair[0].forEach(function (li, idx) {
          var row = pair[1][idx];
          if (!row) return;
          ((li.querySelector("i").style.background = w[row[0]]),
            (li.querySelector("span").textContent = row[0]),
            (li.querySelector("em").textContent = Math.round(row[1]) + "%"));
        });
      });
    })(),
    addEventListener("resize", function () {
      (clearTimeout($e), ($e = setTimeout(et, 120)));
    }),
    window.visualViewport &&
      visualViewport.addEventListener("resize", function () {
        (clearTimeout($e), ($e = setTimeout(et, 120)));
      }),
    addEventListener("orientationchange", function () {
      setTimeout(et, 220);
    }),
    Ge(),
    Qe(),
    We(),
    ze(),
    requestAnimationFrame(function () {
      (Qe(), We(), ze());
    }),
    setTimeout(function () {
      (Qe(), We(), ze());
    }, 500),
    o(),
    requestAnimationFrame(function () {
      o();
    }),
    setTimeout(o, 400));
  var tt = de;
  ((de = function () {
    (tt(), o());
  }),
    _e(),
    requestAnimationFrame(function n(o) {
      ((V = o / 1e3),
        (function (n) {
          var o = t((n - 0.32) / 0.12),
            r = 1 - t((o - 0.45) / 0.55),
            a = e ? 0 : 1 - t(n / 0.06);
          B.forEach(function (e) {
            var t = 0.7 * Math.sin(V / e.j[0] + e.j[2]) * a,
              n = 0.9 * Math.cos(V / e.j[1] + e.j[2]) * a,
              i = 0.7 * Math.sin(V / (1.7 * e.j[0]) + e.j[2]) * a;
            (e.el.setAttribute(
              "transform",
              "translate(" +
                (e.v[0] * o + t).toFixed(2) +
                "," +
                (e.v[1] * o + n).toFixed(2) +
                ") rotate(" +
                (e.v[2] * o).toFixed(2) +
                ") rotate(" +
                i.toFixed(2) +
                " " +
                e.j[3] +
                " " +
                e.j[4] +
                ")",
            ),
              e.el.setAttribute("opacity", (e.o * r).toFixed(3)));
          });
          var i = 1 - t((n - 0.08) / 0.1),
            s = i * (d.dataset.extra || 0);
          d.style.width = "calc(100% + " + s.toFixed(1) + "px)";
          var c = t((n - 0.82) / 0.13),
            u = t((n - 0.42) / 0.07);
          ((d.style.transform = "translateY(" + (2 * Math.sin(V / 3.6) * a).toFixed(2) + "px)"),
            (h.style.opacity = (1 - 0.78 * c).toFixed(3)),
            (h.style.transform = "scale(" + ((1 - 0.25 * u) * (1 - 0.1 * c)).toFixed(4) + ")"),
            (h.style.transformOrigin = "center center"),
            c > 0 && O(),
            W.forEach(function (e, o) {
              var r = t((n - 0.825 - 0.015 * o) / 0.06);
              ((e.style.opacity = r.toFixed(3)),
                (e.style.transform =
                  "translateY(" +
                  (14 * (1 - r)).toFixed(1) +
                  "px) scale(" +
                  (0.86 + 0.14 * r).toFixed(3) +
                  ")"));
            }),
            (l.querySelector(".say").style.opacity = (1 - i).toFixed(3)));
          var x = t(n / 0.14);
          m &&
            (m.setAttribute("opacity", (1 - x).toFixed(3)),
            m.setAttribute(
              "transform",
              "translate(228 394) scale(" + (1 + 0.14 * x).toFixed(3) + ") translate(-224 -112)",
            ));
          var M = t((n - 0.06) / 0.12),
            A = t((n - 0.36) / 0.12);
          h.setAttribute(
            "viewBox",
            [0, 1, 2, 3]
              .map(function (e) {
                var t = q[e] + (T[e] - q[e]) * M;
                return (t + (F[e] - t) * A).toFixed(1);
              })
              .join(" "),
          );
          var I = t((n - 0.42) / 0.07);
          (g && g.setAttribute("opacity", (1 - I).toFixed(3)),
            p && p.setAttribute("opacity", (1 - I).toFixed(3)),
            f.setAttribute("opacity", I.toFixed(3)));
          var R = t((n - 0.6) / 0.12);
          (["Prosecco", "Aperol", "Sparkling water"].forEach(function (e) {
            var t = E[e].y + (S[e].y - E[e].y) * R,
              n = E[e].h + (S[e].h - E[e].h) * R;
            (b[e].setAttribute("y", t.toFixed(2)),
              b[e].setAttribute("height", (n + 0.6).toFixed(2)));
          }),
            H &&
              (H.setAttribute(
                "transform",
                "translate(227.3 0) scale(" + (1 - 2 * R).toFixed(3) + " 1) translate(-227.3 0)",
              ),
              H.setAttribute("opacity", "1")));
          // Only the pinned desktop path cross-fades the two legends off scroll
          // progress. On the flat path each step owns its own figures and they
          // are written once, below.
          if (window.APEROL_DESKTOP_PARALLAX) {
            var Z = R < 0.5 ? v : y;
            [L, k].forEach(function (e) {
              e.forEach(function (e, t) {
                var n = Z[t][0],
                  o = Math.round(E[n].p + (S[n].p - E[n].p) * R);
                ((e.querySelector("i").style.background = w[n]),
                  (e.querySelector("span").textContent = n),
                  (e.querySelector("em").textContent = o + "%"));
              });
            });
            var P = n < 0.4 ? 0 : n < 0.64 ? 1 : n < 0.88 ? 2 : 3;
            C.forEach(function (e, t) {
              e.classList.toggle("on", t === P);
            });
          }
        })(I));
      var r,
        // #s2 is no longer scroll-scrubbed. The chart draws itself in once, on
        // section enter (b.js tweens window.APEROL_S2 from 0 to 1), and the
        // controls go live the moment it lands. The old scrubbed intro that
        // counted the five sense values up has been removed entirely.
        a = "number" == typeof window.APEROL_S2 ? window.APEROL_S2 : 1;
      ((r = a >= 0.999) !== J &&
        ((J = r),
        X && X.classList.toggle("off", r),
        $ && $.classList.toggle("on", r),
        ee.classList.toggle("live", r),
        r && (D.setAttribute("opacity", "1"), de())),
        J ||
          (function (n) {
            var o = e ? 1 : t(n);
            (U(G, o),
              D.setAttribute("opacity", (e ? 1 : Math.min(1, 1.6 * o)).toFixed(3)),
              j.forEach(function (t, o) {
                K[o].setAttribute("opacity", e || n > 0.25 + 0.08 * o ? "1" : "0");
              }));
          })(a),
        requestAnimationFrame(n));
    }));
})(),
  (function () {
    if (window.top !== window.self) {
      document.documentElement.classList.add("framed");
      var e = 0;
      (addEventListener("message", function (n) {
        var o,
          r = n.data;
        r &&
          r.aperol &&
          ("host" === r.aperol &&
            "number" == typeof r.vh &&
            (o = r.vh) &&
            (o = Math.max(420, Math.min(1400, o))) !== window.HOSTVH &&
            ((window.HOSTVH = o),
            document.documentElement.style.setProperty("--vph", o + "px"),
            "function" == typeof window.aperolReflow && window.aperolReflow(),
            (e = 0),
            setTimeout(t, 60)),
          "scroll" === r.aperol &&
            "number" == typeof r.y &&
            ((window.HOSTSCROLL = r.y),
            "function" == typeof window.aperolScroll && window.aperolScroll()),
          "measure" === r.aperol && ((e = 0), t()));
      }),
        addEventListener("load", function () {
          (t(), setTimeout(t, 400), setTimeout(t, 1400));
        }),
        setTimeout(t, 600));
      try {
        parent.postMessage({ aperol: "ready" }, "*");
      } catch (e) {}
    }
    function t() {
      var t = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      if (!(Math.abs(t - e) < 4)) {
        e = t;
        try {
          parent.postMessage({ aperol: "height", value: t }, "*");
        } catch (e) {}
      }
    }
  })());
