/* Mélastro — moteur de calcul astrologique (zodiaque tropical, géocentrique, positions apparentes)
 * Éphémérides : astronomy-engine (Don Cross, MIT) — précision de l'ordre de la minute d'arc.
 * Maisons : Placidus, Koch, Régiomontanus, Campanus, Porphyre, Égales, Signes entiers.
 */
(function (root) {
  'use strict';
  const A = root.Astronomy || (typeof require !== 'undefined' ? require('./astronomy.min.js') : null);

  const D2R = Math.PI / 180, R2D = 180 / Math.PI;
  const norm = (x) => ((x % 360) + 360) % 360;
  const sind = (x) => Math.sin(x * D2R), cosd = (x) => Math.cos(x * D2R), tand = (x) => Math.tan(x * D2R);
  const atan2d = (y, x) => Math.atan2(y, x) * R2D;
  const asind = (x) => Math.asin(Math.max(-1, Math.min(1, x))) * R2D;
  const angDiff = (a, b) => { let d = norm(a - b); return d > 180 ? d - 360 : d; }; // a - b dans ]-180,180]

  const SIGNS = [
    { key: 'ari', name: 'Bélier', glyph: '♈', element: 'feu', mode: 'cardinal', ruler: 'mars', polarity: '+' },
    { key: 'tau', name: 'Taureau', glyph: '♉', element: 'terre', mode: 'fixe', ruler: 'venus', polarity: '-' },
    { key: 'gem', name: 'Gémeaux', glyph: '♊', element: 'air', mode: 'mutable', ruler: 'mercury', polarity: '+' },
    { key: 'can', name: 'Cancer', glyph: '♋', element: 'eau', mode: 'cardinal', ruler: 'moon', polarity: '-' },
    { key: 'leo', name: 'Lion', glyph: '♌', element: 'feu', mode: 'fixe', ruler: 'sun', polarity: '+' },
    { key: 'vir', name: 'Vierge', glyph: '♍', element: 'terre', mode: 'mutable', ruler: 'mercury', polarity: '-' },
    { key: 'lib', name: 'Balance', glyph: '♎', element: 'air', mode: 'cardinal', ruler: 'venus', polarity: '+' },
    { key: 'sco', name: 'Scorpion', glyph: '♏', element: 'eau', mode: 'fixe', ruler: 'pluto', ruler2: 'mars', polarity: '-' },
    { key: 'sag', name: 'Sagittaire', glyph: '♐', element: 'feu', mode: 'mutable', ruler: 'jupiter', polarity: '+' },
    { key: 'cap', name: 'Capricorne', glyph: '♑', element: 'terre', mode: 'cardinal', ruler: 'saturn', polarity: '-' },
    { key: 'aqu', name: 'Verseau', glyph: '♒', element: 'air', mode: 'fixe', ruler: 'uranus', ruler2: 'saturn', polarity: '+' },
    { key: 'pis', name: 'Poissons', glyph: '♓', element: 'eau', mode: 'mutable', ruler: 'neptune', ruler2: 'jupiter', polarity: '-' },
  ];

  const PLANETS = [
    { key: 'sun', name: 'Soleil', glyph: '☉', body: 'Sun', w: 4, orb: 10 },
    { key: 'moon', name: 'Lune', glyph: '☽', body: 'Moon', w: 4, orb: 10 },
    { key: 'mercury', name: 'Mercure', glyph: '☿', body: 'Mercury', w: 2, orb: 7 },
    { key: 'venus', name: 'Vénus', glyph: '♀', body: 'Venus', w: 2, orb: 7 },
    { key: 'mars', name: 'Mars', glyph: '♂', body: 'Mars', w: 2, orb: 7 },
    { key: 'jupiter', name: 'Jupiter', glyph: '♃', body: 'Jupiter', w: 1.5, orb: 6 },
    { key: 'saturn', name: 'Saturne', glyph: '♄', body: 'Saturn', w: 1.5, orb: 6 },
    { key: 'uranus', name: 'Uranus', glyph: '♅', body: 'Uranus', w: 1, orb: 5 },
    { key: 'neptune', name: 'Neptune', glyph: '♆', body: 'Neptune', w: 1, orb: 5 },
    { key: 'pluto', name: 'Pluton', glyph: '♇', body: 'Pluto', w: 1, orb: 5 },
    { key: 'chiron', name: 'Chiron', glyph: '⚷', w: 0.6, orb: 4 },
    { key: 'node', name: 'Nœud Nord', glyph: '☊', w: 0.5, orb: 4 },
    { key: 'snode', name: 'Nœud Sud', glyph: '☋', w: 0.3, orb: 3 },
    { key: 'lilith', name: 'Lilith', glyph: '⚸', w: 0.3, orb: 3 },
    { key: 'fortune', name: 'Part de Fortune', glyph: '⊗', w: 0.3, orb: 2 },
  ];
  const PMAP = Object.fromEntries(PLANETS.map((p) => [p.key, p]));

  const ASPECTS = [
    { key: 'conj', name: 'Conjonction', glyph: '☌', angle: 0, orb: 8, nature: 'neutre', major: true },
    { key: 'opp', name: 'Opposition', glyph: '☍', angle: 180, orb: 8, nature: 'tendu', major: true },
    { key: 'tri', name: 'Trigone', glyph: '△', angle: 120, orb: 7, nature: 'fluide', major: true },
    { key: 'sq', name: 'Carré', glyph: '□', angle: 90, orb: 7, nature: 'tendu', major: true },
    { key: 'sext', name: 'Sextile', glyph: '⚹', angle: 60, orb: 5, nature: 'fluide', major: true },
    { key: 'quinc', name: 'Quinconce', glyph: '⚻', angle: 150, orb: 3, nature: 'ajustement', major: false },
    { key: 'ssext', name: 'Semi-sextile', glyph: '⚺', angle: 30, orb: 2, nature: 'léger', major: false },
    { key: 'ssq', name: 'Semi-carré', glyph: '∠', angle: 45, orb: 2, nature: 'tendu', major: false },
    { key: 'sesq', name: 'Sesqui-carré', glyph: '⚼', angle: 135, orb: 2, nature: 'tendu', major: false },
  ];

  const HOUSE_SYSTEMS = {
    placidus: 'Placidus', koch: 'Koch', regiomontanus: 'Régiomontanus', campanus: 'Campanus',
    porphyry: 'Porphyre', equal: 'Égales (depuis l’Ascendant)', whole: 'Signes entiers',
  };

  /* ---------- Temps & fuseaux horaires ---------- */
  const dtfCache = {};
  function tzOffsetMinutes(ms, tz) {
    if (!dtfCache[tz]) dtfCache[tz] = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', era: 'short' });
    const p = {}; dtfCache[tz].formatToParts(new Date(ms)).forEach((x) => (p[x.type] = x.value));
    let y = +p.year; if (p.era && p.era.startsWith('B')) y = 1 - y;
    const d = new Date(0); d.setUTCFullYear(y, +p.month - 1, +p.day); d.setUTCHours(+p.hour, +p.minute, +p.second, 0);
    return Math.round((d.getTime() - ms) / 60000);
  }
  /** Convertit une date/heure locale (civile) en instant UTC (ms). Retourne {ms, offsetMin, ambiguous}. */
  function localToUTC(dateStr, timeStr, tz, manualOffsetHours) {
    const [Y, M, D] = dateStr.split('-').map(Number);
    const [h, m] = (timeStr || '12:00').split(':').map(Number);
    const g = new Date(0); g.setUTCFullYear(Y, M - 1, D); g.setUTCHours(h, m, 0, 0);
    const guess = g.getTime();
    if (manualOffsetHours !== null && manualOffsetHours !== undefined && manualOffsetHours !== '' && !isNaN(manualOffsetHours)) {
      const off = Math.round(Number(manualOffsetHours) * 60);
      return { ms: guess - off * 60000, offsetMin: off, ambiguous: false };
    }
    if (!tz) return { ms: guess, offsetMin: 0, ambiguous: false };
    const o1 = tzOffsetMinutes(guess, tz);
    let ms = guess - o1 * 60000;
    const o2 = tzOffsetMinutes(ms, tz);
    if (o2 !== o1) ms = guess - o2 * 60000;
    const o3 = tzOffsetMinutes(ms, tz);
    const before = tzOffsetMinutes(ms - 3 * 3600000, tz), after = tzOffsetMinutes(ms + 3 * 3600000, tz);
    return { ms, offsetMin: o3, ambiguous: before !== after };
  }
  function formatOffset(min) {
    const s = min < 0 ? '−' : '+'; const a = Math.abs(min);
    return `UTC${s}${Math.floor(a / 60)}${a % 60 ? ':' + String(a % 60).padStart(2, '0') : ''}`;
  }

  /* ---------- Outils astronomiques ---------- */
  function trueObliquity(time) { return A.e_tilt(time).tobl; }
  function eclOfDate(vec) { const e = A.Ecliptic(vec); return { lon: norm(e.elon), lat: e.elat, vec: e.vec }; }

  function bodyLon(body, time) {
    if (body === 'Moon') { return eclOfDate(A.GeoMoon(time)); }
    return eclOfDate(A.GeoVector(body, time, true));
  }

  function trueNode(time) {
    // nœud osculateur : orbite instantanée de la Lune (vecteurs position/vitesse géométriques)
    const dt = 1 / 1440;
    const t0 = time.AddDays(-dt), t1 = time.AddDays(dt);
    const r = eclOfDate(A.GeoMoon(time)).vec;
    const a = eclOfDate(A.GeoMoon(t0)).vec, b = eclOfDate(A.GeoMoon(t1)).vec;
    const v = { x: (b.x - a.x) / (2 * dt), y: (b.y - a.y) / (2 * dt), z: (b.z - a.z) / (2 * dt) };
    const h = { x: r.y * v.z - r.z * v.y, y: r.z * v.x - r.x * v.z, z: r.x * v.y - r.y * v.x };
    return norm(atan2d(h.x, -h.y));
  }
  function meanNode(time) {
    const T = time.tt / 36525;
    return norm(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T * T * T / 467441 - T ** 4 / 60616000);
  }
  function meanLilith(time) {
    const T = time.tt / 36525;
    // longitude moyenne du périgée lunaire (Chapront) + 180° = apogée moyen (Lune Noire)
    return norm(83.3532465 + 4069.0137287 * T - 0.01032 * T * T - T ** 3 / 80053 + T ** 4 / 18999000 + 180);
  }

  /* ---------- Chiron (table Swiss Ephemeris 1900-2100, interpolation de Lagrange) ---------- */
  let CH = null;
  function chironLon(time) {
    const D = root.CHIRON; if (!D) return null;
    if (!CH) { const bin = typeof atob !== 'undefined' ? atob(D.b64) : Buffer.from(D.b64, 'base64').toString('binary'); CH = new Uint16Array(bin.length / 2); for (let i = 0; i < CH.length; i++) CH[i] = bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8); }
    const jd = time.ut + 2451545.0, x = (jd - D.jd0) / D.step, i = Math.floor(x) - 1, t = x - (i + 1);
    if (i < 0 || i + 3 >= CH.length) return null;
    const p = [0, 1, 2, 3].map((k) => CH[i + k] / 100);
    for (let k = 1; k < 4; k++) { while (p[k] - p[k - 1] > 180) p[k] -= 360; while (p[k] - p[k - 1] < -180) p[k] += 360; }
    const L = [-t * (t - 1) * (t - 2) / 6, (t + 1) * (t - 1) * (t - 2) / 2, -(t + 1) * t * (t - 2) / 2, (t + 1) * t * (t - 1) / 6];
    return norm(L[0] * p[0] + L[1] * p[1] + L[2] * p[2] + L[3] * p[3]);
  }

  /* ---------- Maisons ---------- */
  function ascFromRamc(ramc, eps, phi) { return norm(atan2d(cosd(ramc), -(sind(ramc) * cosd(eps) + tand(phi) * sind(eps)))); }
  function mcFromRamc(ramc, eps) { return norm(atan2d(sind(ramc), cosd(ramc) * cosd(eps))); }
  function lonFromRA(ra, eps) { return norm(atan2d(sind(ra), cosd(ra) * cosd(eps))); }
  // Point de l'écliptique intersecté par un cercle de position de pôle P passant à l'angle horaire H du méridien
  function cuspPole(ramc, H, eps, poleDeg) { const R = ramc + H; return norm(atan2d(sind(R), cosd(R) * cosd(eps) - tand(poleDeg) * sind(eps))); }

  function houses(system, ramc, eps, phi) {
    const asc = ascFromRamc(ramc, eps, phi), mc = mcFromRamc(ramc, eps);
    let c = new Array(12);
    const polar = Math.abs(phi) >= 90 - eps;
    let sys = system, note = '';
    if (polar && (sys === 'placidus' || sys === 'koch')) { sys = 'porphyry'; note = 'Latitude polaire : système ' + HOUSE_SYSTEMS[system] + ' impossible, Porphyre utilisé.'; }
    const fill = () => { c[0] = asc; c[9] = mc; c[6] = norm(asc + 180); c[3] = norm(mc + 180); };
    switch (sys) {
      case 'whole': { const s = Math.floor(asc / 30) * 30; for (let i = 0; i < 12; i++) c[i] = norm(s + 30 * i); break; }
      case 'equal': for (let i = 0; i < 12; i++) c[i] = norm(asc + 30 * i); break;
      case 'porphyry': {
        fill(); const q = norm(asc - mc), r = norm(norm(mc + 180) - asc);
        c[10] = norm(mc + q / 3); c[11] = norm(mc + 2 * q / 3); c[1] = norm(asc + r / 3); c[2] = norm(asc + 2 * r / 3);
        break;
      }
      case 'regiomontanus': {
        fill(); const H = { 10: 30, 11: 60, 1: 120, 2: 150 };
        for (const k of [10, 11, 1, 2]) { const P = atan2d(tand(phi) * sind(H[k]), 1); c[k] = cuspPole(ramc, H[k], eps, P); }
        break;
      }
      case 'campanus': {
        fill();
        const fh1 = asind(sind(phi) / 2), fh2 = asind(Math.sqrt(3) / 2 * sind(phi));
        const cf = cosd(phi);
        const xh1 = atan2d(Math.sqrt(3), cf), xh2 = atan2d(1 / Math.sqrt(3), cf);
        c[10] = cuspPole(ramc, 90 - xh1, eps, fh1); c[11] = cuspPole(ramc, 90 - xh2, eps, fh2);
        c[1] = cuspPole(ramc, 90 + xh2, eps, fh2); c[2] = cuspPole(ramc, 90 + xh1, eps, fh1);
        break;
      }
      case 'koch': {
        fill();
        const decMC = asind(sind(eps) * sind(mc));
        const ad3 = asind(tand(phi) * tand(decMC)) / 3;
        c[10] = cuspPole(ramc, 30 - 2 * ad3, eps, phi); c[11] = cuspPole(ramc, 60 - ad3, eps, phi);
        c[1] = cuspPole(ramc, 120 + ad3, eps, phi); c[2] = cuspPole(ramc, 150 + 2 * ad3, eps, phi);
        break;
      }
      case 'placidus':
      default: {
        fill();
        const solve = (frac, above) => {
          let lon = above ? norm(mc + 30 * (frac * 3)) : norm(asc + 30 * frac * 3);
          for (let i = 0; i < 60; i++) {
            const dec = asind(sind(eps) * sind(lon));
            const x = tand(phi) * tand(dec);
            if (Math.abs(x) > 1) return null;
            const ad = asind(x);
            const ra = above ? ramc + frac * (90 + ad) : ramc + 180 - frac * (90 - ad);
            const nl = lonFromRA(ra, eps);
            if (Math.abs(angDiff(nl, lon)) < 1e-8) { lon = nl; break; }
            lon = nl;
          }
          return lon;
        };
        c[10] = solve(1 / 3, true); c[11] = solve(2 / 3, true);
        c[2] = solve(1 / 3, false); c[1] = solve(2 / 3, false);
        if ([c[10], c[11], c[1], c[2]].some((v) => v === null)) return houses('porphyry', ramc, eps, phi);
        break;
      }
    }
    if (sys !== 'whole' && sys !== 'equal') {
      c[4] = norm(c[10] + 180); c[5] = norm(c[11] + 180); c[7] = norm(c[1] + 180); c[8] = norm(c[2] + 180);
    }
    return { cusps: c, asc, mc, system: sys, note };
  }

  function houseOf(lon, cusps) {
    for (let i = 0; i < 12; i++) {
      const a = cusps[i], b = cusps[(i + 1) % 12];
      const span = norm(b - a), d = norm(lon - a);
      if (d < span) return i + 1;
    }
    return 1;
  }

  /* ---------- Aspects ---------- */
  function findAspect(l1, l2, orbFactor, p1, p2, opts) {
    const sep = Math.abs(angDiff(l1, l2));
    let best = null;
    for (const asp of ASPECTS) {
      if (!asp.major && !(opts && opts.minor)) continue;
      let orb = asp.orb * (orbFactor || 1);
      const lum = (k) => k === 'sun' || k === 'moon';
      if (p1 && p2 && asp.major) { if (lum(p1) || lum(p2)) orb += 2; if (['node', 'snode', 'lilith', 'fortune', 'asc', 'mc'].includes(p1) || ['node', 'snode', 'lilith', 'fortune', 'asc', 'mc'].includes(p2)) orb = Math.min(orb, asp.angle === 0 || asp.angle === 180 ? 5 : 3); }
      const o = Math.abs(sep - asp.angle);
      if (o <= orb && (!best || o < best.orb)) best = { ...asp, orb: o, maxOrb: orb, exact: sep };
    }
    return best;
  }

  function aspectsBetween(listA, listB, opts) {
    const out = []; const same = listA === listB;
    for (let i = 0; i < listA.length; i++) {
      for (let j = same ? i + 1 : 0; j < listB.length; j++) {
        const a = listA[i], b = listB[j];
        if (same && ((a.key === 'node' && b.key === 'snode') || (a.key === 'snode' && b.key === 'node'))) continue;
        if (opts && opts.skip && (opts.skip.includes(a.key) || opts.skip.includes(b.key))) continue;
        const asp = findAspect(a.lon, b.lon, opts && opts.orbFactor, a.key, b.key, opts);
        if (!asp) continue;
        // appliquant / séparant
        let applying = null;
        if (a.speed !== undefined && b.speed !== undefined) {
          const now = Math.abs(Math.abs(angDiff(a.lon, b.lon)) - asp.angle);
          const later = Math.abs(Math.abs(angDiff(a.lon + a.speed * 0.01, b.lon + b.speed * 0.01)) - asp.angle);
          applying = later < now;
        }
        out.push({ a: a.key, b: b.key, an: a.name, bn: b.name, ag: a.glyph, bg: b.glyph, ...asp, applying });
      }
    }
    return out.sort((x, y) => x.orb - y.orb);
  }

  /* ---------- Thème complet ---------- */
  function signOf(lon) { const i = Math.floor(norm(lon) / 30); return { idx: i, sign: SIGNS[i], deg: norm(lon) - i * 30 }; }
  function fmtDeg(lon, withSign = true) {
    const s = signOf(lon); let d = Math.floor(s.deg); let m = Math.round((s.deg - d) * 60);
    if (m === 60) { m = 0; d += 1; }
    return `${d}°${String(m).padStart(2, '0')}′${withSign ? ' ' + s.sign.glyph : ''}`;
  }

  /**
   * calcChart(input) — input : {ms (UTC), lat, lon, houseSystem, nodeType, noTime}
   */
  function calcChart(input) {
    const date = new Date(input.ms);
    const time = A.MakeTime(date);
    const eps = trueObliquity(time);
    const gast = A.SiderealTime(time);
    const ramc = norm(gast * 15 + input.lon);
    const bodies = [];
    for (const p of PLANETS) {
      if (!p.body) continue;
      const e = bodyLon(p.body, time);
      const e2 = bodyLon(p.body, time.AddDays(0.5)), e1 = bodyLon(p.body, time.AddDays(-0.5));
      const speed = angDiff(e2.lon, e1.lon);
      bodies.push({ ...p, lon: e.lon, lat: e.lat, speed, retro: speed < 0 });
    }
    if (chironLon(time) !== null) {
      const cl = chironLon(time), c2 = chironLon(time.AddDays(0.5)), c1 = chironLon(time.AddDays(-0.5));
      const csp = angDiff(c2, c1);
      bodies.push({ ...PMAP.chiron, lon: cl, lat: 0, speed: csp, retro: csp < 0 });
    }
    const nodeLon = input.nodeType === 'mean' ? meanNode(time) : trueNode(time);
    const nodeSp = input.nodeType === 'mean' ? -0.0529 : angDiff(trueNode(time.AddDays(0.5)), trueNode(time.AddDays(-0.5)));
    bodies.push({ ...PMAP.node, lon: nodeLon, lat: 0, speed: nodeSp, retro: nodeSp < 0 });
    bodies.push({ ...PMAP.snode, lon: norm(nodeLon + 180), lat: 0, speed: nodeSp, retro: nodeSp < 0 });
    bodies.push({ ...PMAP.lilith, lon: meanLilith(time), lat: 0, speed: 0.111, retro: false });

    const H = houses(input.houseSystem || 'placidus', ramc, eps, input.lat);
    const sun = bodies[0], moon = bodies[1];
    // jour/nuit : Soleil au-dessus de l'horizon (maisons 7 à 12)
    const sunAboveDeg = angDiff(sun.lon, H.asc); // négatif => entre DS et AS par le MC… on utilise l'altitude réelle
    const obs = new A.Observer(input.lat, input.lon, 0);
    const sunEq = A.Equator('Sun', time, obs, true, true);
    const sunHor = A.Horizon(time, obs, sunEq.ra, sunEq.dec, 'normal');
    const diurnal = sunHor.altitude > -0.833;
    void sunAboveDeg;
    const fortune = diurnal ? norm(H.asc + moon.lon - sun.lon) : norm(H.asc + sun.lon - moon.lon);
    bodies.push({ ...PMAP.fortune, lon: fortune, lat: 0, speed: undefined, retro: false });

    for (const b of bodies) { const s = signOf(b.lon); b.signIdx = s.idx; b.sign = s.sign; b.deg = s.deg; b.house = input.noTime ? null : houseOf(b.lon, H.cusps); }

    const angles = [
      { key: 'asc', name: 'Ascendant', glyph: 'AS', lon: H.asc, speed: 360 },
      { key: 'mc', name: 'Milieu du Ciel', glyph: 'MC', lon: H.mc, speed: 360 },
      { key: 'dsc', name: 'Descendant', glyph: 'DS', lon: norm(H.asc + 180) },
      { key: 'ic', name: 'Fond du Ciel', glyph: 'FC', lon: norm(H.mc + 180) },
    ].map((x) => ({ ...x, ...signOf(x.lon), sign: signOf(x.lon).sign }));

    const aspPoints = bodies.filter((b) => b.key !== 'snode').concat(input.noTime ? [] : angles.slice(0, 2));
    const aspects = aspectsBetween(input.noTime ? aspPoints.filter((b) => b.key !== 'fortune' && b.key !== 'moon' || b.key === 'moon') : aspPoints, input.noTime ? aspPoints : aspPoints, { minor: true, skip: input.noTime ? ['fortune', 'asc', 'mc'] : [] });

    const moonPhase = A.MoonPhase(time);
    const ch = {
      ms: input.ms, time, jd: time.ut + 2451545.0, eps, ramc, lst: ramc / 15, lat: input.lat, lon: input.lon,
      bodies, angles, cusps: H.cusps, houseSystem: H.system, houseNote: H.note, aspects, diurnal, noTime: !!input.noTime,
      sunAlt: sunHor.altitude, moonPhase,
    };
    ch.stats = chartStats(ch);
    return ch;
  }

  /* ---------- Statistiques & dominantes ---------- */
  const DIGNITIES = {
    sun: { dom: ['leo'], exa: ['ari'], exil: ['aqu'], chute: ['lib'] },
    moon: { dom: ['can'], exa: ['tau'], exil: ['cap'], chute: ['sco'] },
    mercury: { dom: ['gem', 'vir'], exa: ['vir'], exil: ['sag', 'pis'], chute: ['pis'] },
    venus: { dom: ['tau', 'lib'], exa: ['pis'], exil: ['sco', 'ari'], chute: ['vir'] },
    mars: { dom: ['ari', 'sco'], exa: ['cap'], exil: ['lib', 'tau'], chute: ['can'] },
    jupiter: { dom: ['sag', 'pis'], exa: ['can'], exil: ['gem', 'vir'], chute: ['cap'] },
    saturn: { dom: ['cap', 'aqu'], exa: ['lib'], exil: ['can', 'leo'], chute: ['ari'] },
    uranus: { dom: ['aqu'], exa: ['sco'], exil: ['leo'], chute: ['tau'] },
    neptune: { dom: ['pis'], exa: ['can'], exil: ['vir'], chute: ['cap'] },
    pluto: { dom: ['sco'], exa: ['leo'], exil: ['tau'], chute: ['aqu'] },
  };
  function dignity(pkey, skey) {
    const d = DIGNITIES[pkey]; if (!d) return null;
    if (d.dom.includes(skey)) return { key: 'dom', label: 'Domicile', score: 5 };
    if (d.exa.includes(skey)) return { key: 'exa', label: 'Exaltation', score: 4 };
    if (d.exil.includes(skey)) return { key: 'exil', label: 'Exil', score: -5 };
    if (d.chute.includes(skey)) return { key: 'chute', label: 'Chute', score: -4 };
    return null;
  }

  function chartStats(ch) {
    const el = { feu: 0, terre: 0, air: 0, eau: 0 }, mo = { cardinal: 0, fixe: 0, mutable: 0 }, pol = { '+': 0, '-': 0 };
    const signScore = new Array(12).fill(0), houseScore = new Array(12).fill(0), planetScore = {};
    const main = ch.bodies.filter((b) => PMAP[b.key].body);
    const add = (signIdx, w) => { const s = SIGNS[signIdx]; el[s.element] += w; mo[s.mode] += w; pol[s.polarity] += w; signScore[signIdx] += w; };
    for (const b of main) { add(b.signIdx, b.w); if (b.house) houseScore[b.house - 1] += b.w; }
    if (!ch.noTime) { add(ch.angles[0].idx, 3); add(ch.angles[1].idx, 2); }
    // hémisphères
    const hemi = { est: 0, ouest: 0, nord: 0, sud: 0 };
    if (!ch.noTime) for (const b of main) { const h = b.house; if ([10, 11, 12, 1, 2, 3].includes(h)) hemi.est += b.w; else hemi.ouest += b.w; if (h >= 7) hemi.sud += b.w; else hemi.nord += b.w; }
    // planètes dominantes
    for (const b of main) {
      let s = b.w; const dig = dignity(b.key, b.sign.key); if (dig) s += dig.score * 0.6;
      if (!ch.noTime) {
        const asc = ch.angles[0].lon, mc = ch.angles[1].lon;
        for (const ang of [asc, mc, norm(asc + 180), norm(mc + 180)]) { const o = Math.abs(angDiff(b.lon, ang)); if (o < 10) s += (10 - o) * (ang === asc || ang === mc ? 0.9 : 0.5); }
        if (SIGNS[ch.angles[0].idx].ruler === b.key) s += 6;
        if (SIGNS[ch.angles[1].idx].ruler === b.key) s += 2;
        if ([1, 10].includes(b.house)) s += 2; if ([4, 7].includes(b.house)) s += 1;
      }
      if (SIGNS[ch.bodies[0].signIdx].ruler === b.key) s += 3;
      if (SIGNS[ch.bodies[1].signIdx].ruler === b.key) s += 2;
      for (const a of ch.aspects) if ((a.a === b.key || a.b === b.key) && a.major) s += 0.5 + (a.maxOrb - a.orb) / a.maxOrb;
      b.dignity = dig; planetScore[b.key] = Math.round(s * 10) / 10;
    }
    const ranking = Object.entries(planetScore).sort((x, y) => y[1] - x[1]);
    const aspCount = { fluide: 0, tendu: 0, neutre: 0, autre: 0 };
    for (const a of ch.aspects) { if (a.nature === 'fluide') aspCount.fluide++; else if (a.nature === 'tendu') aspCount.tendu++; else if (a.nature === 'neutre') aspCount.neutre++; else aspCount.autre++; }
    const retro = main.filter((b) => b.retro).map((b) => b.key);
    // configurations : stellium, grand trigone, T-carré, grande croix, yod
    const configs = findConfigs(ch, main);
    const domEl = Object.entries(el).sort((a, b) => b[1] - a[1]);
    const domMo = Object.entries(mo).sort((a, b) => b[1] - a[1]);
    return { el, mo, pol, signScore, houseScore, hemi, planetScore, ranking, aspCount, retro, configs, domEl, domMo, shape: chartShape(main) };
  }

  function findConfigs(ch, main) {
    const res = [];
    const keys = main.map((b) => b.key);
    const has = (k1, k2, ak) => ch.aspects.some((a) => a.key === ak && ((a.a === k1 && a.b === k2) || (a.a === k2 && a.b === k1)));
    // stellium (4+ planètes dans un même signe ou une même maison)
    const bySign = {}; main.forEach((b) => (bySign[b.sign.name] = (bySign[b.sign.name] || []).concat(b.name)));
    Object.entries(bySign).forEach(([s, l]) => { if (l.length >= 3) res.push({ type: 'Stellium', detail: `${l.length} planètes en ${s} : ${l.join(', ')}` }); });
    if (!ch.noTime) { const byH = {}; main.forEach((b) => (byH[b.house] = (byH[b.house] || []).concat(b.name))); Object.entries(byH).forEach(([h, l]) => { if (l.length >= 4) res.push({ type: 'Stellium', detail: `${l.length} planètes en maison ${h} : ${l.join(', ')}` }); }); }
    const nm = (k) => PMAP[k].name;
    for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) for (let k = j + 1; k < keys.length; k++) {
      const [a, b, c] = [keys[i], keys[j], keys[k]];
      if (has(a, b, 'tri') && has(b, c, 'tri') && has(a, c, 'tri')) res.push({ type: 'Grand Trigone', detail: `${nm(a)}, ${nm(b)}, ${nm(c)}` });
      for (const [x, y, z] of [[a, b, c], [b, c, a], [a, c, b]]) {
        if (has(x, y, 'opp') && has(x, z, 'sq') && has(y, z, 'sq')) res.push({ type: 'T-carré', detail: `${nm(x)} ☍ ${nm(y)}, apex ${nm(z)}` });
        if (has(x, y, 'sext') && has(x, z, 'quinc') && has(y, z, 'quinc')) res.push({ type: 'Yod (Doigt de Dieu)', detail: `${nm(x)} ⚹ ${nm(y)}, apex ${nm(z)}` });
      }
    }
    // grande croix
    for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
      if (!has(keys[i], keys[j], 'opp')) continue;
      for (let k = 0; k < keys.length; k++) for (let l = k + 1; l < keys.length; l++) {
        if ([i, j].includes(k) || [i, j].includes(l)) continue;
        if (has(keys[k], keys[l], 'opp') && has(keys[i], keys[k], 'sq') && has(keys[i], keys[l], 'sq') && k > i)
          res.push({ type: 'Grande Croix', detail: [keys[i], keys[j], keys[k], keys[l]].map(nm).join(', ') });
      }
    }
    return res;
  }

  function chartShape(main) {
    const l = main.map((b) => b.lon).sort((a, b) => a - b);
    const gaps = l.map((x, i) => norm(l[(i + 1) % l.length] - x)).sort((a, b) => b - a);
    const span = 360 - gaps[0];
    if (span <= 120) return { name: 'Faisceau (Bundle)', desc: 'Toutes les planètes tiennent dans un tiers du zodiaque : énergie concentrée, spécialisée.' };
    if (span <= 180) return { name: 'Bol (Bowl)', desc: 'Planètes réunies sur une moitié du zodiaque : une moitié de la vie investie, l’autre à conquérir.' };
    if (gaps[0] >= 60 && gaps[1] < 60 && span <= 240 && gaps[0] < 180) return { name: 'Locomotive', desc: 'Un tiers du ciel vide : forte motricité, besoin d’avancer et d’accomplir.' };
    if (gaps[0] >= 60 && gaps[1] >= 60) return { name: 'Balançoire (Seesaw)', desc: 'Deux groupes qui se font face : la vie comme recherche d’équilibre entre deux pôles.' };
    if (gaps[0] >= 90) return { name: 'Seau (Bucket)', desc: 'Une planète isolée sert d’anse et canalise l’ensemble du thème.' };
    return { name: 'Éparpillé (Splash)', desc: 'Planètes réparties sur tout le zodiaque : curiosité universelle, intérêts multiples.' };
  }

  /* ---------- Transits, révolution solaire, synastrie ---------- */
  function transitsFor(natal, ms, opts) {
    const now = calcChart({ ms, lat: natal.lat, lon: natal.lon, houseSystem: 'placidus', nodeType: opts && opts.nodeType, noTime: true });
    const tr = now.bodies.filter((b) => b.key !== 'fortune' && b.key !== 'snode');
    const nat = natal.bodies.filter((b) => b.key !== 'fortune' && b.key !== 'snode').concat(natal.noTime ? [] : natal.angles.slice(0, 2));
    const asp = aspectsBetween(tr, nat, { orbFactor: 0.25, minor: false });
    asp.forEach((a) => { const t = tr.find((x) => x.key === a.a); a.transitHouse = natal.noTime ? null : houseOf(t.lon, natal.cusps); });
    return { chart: now, aspects: asp };
  }

  function solarReturn(natal, year, place) {
    const sunLon = natal.bodies[0].lon;
    const birth = new Date(natal.ms);
    const start = new Date(Date.UTC(year, birth.getUTCMonth(), birth.getUTCDate()) - 4 * 86400000);
    const t = A.SearchSunLongitude(sunLon, start, 10);
    if (!t) return null;
    const ms = t.date.getTime();
    return { ms, chart: calcChart({ ms, lat: place ? place.lat : natal.lat, lon: place ? place.lon : natal.lon, houseSystem: natal.houseSystem }) };
  }

  function synastry(c1, c2) {
    const p1 = c1.bodies.filter((b) => b.key !== 'snode' && b.key !== 'fortune').concat(c1.noTime ? [] : c1.angles.slice(0, 2));
    const p2 = c2.bodies.filter((b) => b.key !== 'snode' && b.key !== 'fortune').concat(c2.noTime ? [] : c2.angles.slice(0, 2));
    const asp = aspectsBetween(p1, p2, { orbFactor: 0.75, minor: false });
    // score de compatibilité par domaine
    const W = { sun: 3, moon: 3, venus: 2.5, mars: 2, mercury: 1.5, jupiter: 1.2, saturn: 1.5, asc: 2, mc: 1, uranus: 0.6, neptune: 0.6, pluto: 0.8, node: 0.8, lilith: 0.4 };
    const domains = { amour: 0, communication: 0, quotidien: 0, passion: 0, durabilite: 0 };
    const dom = { amour: ['venus', 'moon', 'sun'], communication: ['mercury', 'sun', 'asc'], quotidien: ['moon', 'saturn', 'asc', 'mercury'], passion: ['mars', 'venus', 'pluto'], durabilite: ['saturn', 'jupiter', 'sun', 'moon', 'node'] };
    let harmony = 0, tension = 0;
    for (const a of asp) {
      const w = (W[a.a] || 0.5) * (W[b2(a)] || 0.5) * (1 - a.orb / (a.maxOrb + 0.01) * 0.6);
      let v;
      if (a.key === 'conj') { const hard = ['saturn', 'pluto', 'mars', 'uranus', 'lilith'].some((k) => a.a === k || a.b === k); v = hard ? -0.3 : 1; }
      else v = a.nature === 'fluide' ? 1 : -0.8;
      if (v > 0) harmony += w * v; else tension += -w * v;
      for (const d in dom) if (dom[d].includes(a.a) || dom[d].includes(a.b)) domains[d] += w * v;
    }
    function b2(a) { return a.b; }
    const total = harmony + tension || 1;
    const score = Math.round(50 + 50 * (harmony - tension) / (total + 8));
    const domScores = {}; for (const d in domains) domScores[d] = Math.max(5, Math.min(97, Math.round(50 + 45 * Math.tanh(domains[d] / 7))));
    // éléments croisés
    const elemMatch = (a, b) => { const ea = a.sign.element, eb = b.sign.element; if (ea === eb) return 'même élément'; const comp = { feu: 'air', air: 'feu', terre: 'eau', eau: 'terre' }; return comp[ea] === eb ? 'éléments complémentaires' : 'éléments contrastés'; };
    // superposition de maisons
    const overlay = c1.noTime ? [] : c2.bodies.filter((b) => PMAP[b.key].body).map((b) => ({ key: b.key, name: b.name, glyph: b.glyph, house: houseOf(b.lon, c1.cusps) }));
    const overlay2 = c2.noTime ? [] : c1.bodies.filter((b) => PMAP[b.key].body).map((b) => ({ key: b.key, name: b.name, glyph: b.glyph, house: houseOf(b.lon, c2.cusps) }));
    // thème composite (points médians)
    const mid = (a, b) => { const d = angDiff(b, a); return norm(a + d / 2); };
    const composite = c1.bodies.map((b, i) => ({ ...b, lon: mid(b.lon, c2.bodies[i].lon) })).map((b) => ({ ...b, ...signOf(b.lon), sign: signOf(b.lon).sign }));
    return {
      aspects: asp, score: Math.max(3, Math.min(99, score)), harmony, tension, domains: domScores,
      sunMoon: { sun: elemMatch(c1.bodies[0], c2.bodies[0]), moon: elemMatch(c1.bodies[1], c2.bodies[1]), venusMars: elemMatch(c1.bodies[3], c2.bodies[4]), marsVenus: elemMatch(c1.bodies[4], c2.bodies[3]) },
      overlay, overlay2, composite,
    };
  }

  /* ---------- Phase lunaire ---------- */
  function moonPhaseName(deg) {
    const names = ['Nouvelle Lune', 'Premier croissant', 'Premier quartier', 'Lune gibbeuse croissante', 'Pleine Lune', 'Lune gibbeuse décroissante', 'Dernier quartier', 'Dernier croissant'];
    return names[Math.floor(norm(deg + 22.5) / 45) % 8];
  }

  /* ---------- Carte du ciel (horizon local) ---------- */
  function skyView(ms, lat, lon) {
    const time = A.MakeTime(new Date(ms));
    const obs = new A.Observer(lat, lon, 0);
    const rot = A.Rotation_EQJ_HOR(time, obs);
    const toHor = (raDeg, decDeg) => {
      const v = new A.Vector(cosd(decDeg) * cosd(raDeg), cosd(decDeg) * sind(raDeg), sind(decDeg), time);
      const h = A.RotateVector(rot, v); const s = A.HorizonFromVector(h, 'normal');
      return { alt: s.lat, az: s.lon };
    };
    const planets = PLANETS.filter((p) => p.body).map((p) => {
      const eq = A.Equator(p.body, time, obs, true, true); const hor = A.Horizon(time, obs, eq.ra, eq.dec, 'normal');
      let mag = null; try { mag = p.body === 'Sun' ? -26.7 : A.Illumination(p.body, time).mag; } catch (e) { /* */ }
      return { ...p, alt: hor.altitude, az: hor.azimuth, mag };
    });
    // écliptique
    const ecl = [];
    const eps = trueObliquity(time);
    for (let l = 0; l <= 360; l += 3) {
      const ra = atan2d(sind(l) * cosd(eps), cosd(l)), dec = asind(sind(eps) * sind(l));
      const eqd = A.Equator('Sun', time, obs, true, false); void eqd;
      ecl.push({ l, ...toHorDate(time, obs, ra, dec) });
    }
    return { toHor, planets, ecl, time, obs, moonPhase: A.MoonPhase(time) };
  }
  function toHorDate(time, obs, raDeg, decDeg) { const h = A.Horizon(time, obs, norm(raDeg) / 15, decDeg, 'normal'); return { alt: h.altitude, az: h.azimuth }; }

  const api = {
    SIGNS, PLANETS, PMAP, ASPECTS, HOUSE_SYSTEMS, DIGNITIES,
    norm, angDiff, signOf, fmtDeg, localToUTC, tzOffsetMinutes, formatOffset,
    calcChart, houses, chironLon, bodyLon, meanNode, trueNode, trueObliquity, ascFromRamc, mcFromRamc, houseOf, aspectsBetween, transitsFor, solarReturn, synastry, moonPhaseName, skyView, dignity,
  };
  root.Engine = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
