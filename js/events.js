/* Mélastro — événements célestes et techniques prévisionnelles */
(function (root) {
  'use strict';
  const A = root.Astronomy, E = root.Engine;
  const DAY = 86400000;
  const norm = E.norm, angDiff = E.angDiff;
  const BODY = { sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto' };

  function lon(key, ms) {
    const t = A.MakeTime(new Date(ms));
    if (BODY[key]) return E.bodyLon(BODY[key], t).lon;
    if (key === 'chiron') return E.chironLon(t);
    if (key === 'node') return E.meanNode(t);
    return null;
  }
  const speed = (key, ms) => angDiff(lon(key, ms + DAY / 2), lon(key, ms - DAY / 2));
  function bisect(f, a, b, it = 40) { let fa = f(a); for (let i = 0; i < it; i++) { const m = (a + b) / 2, fm = f(m); if ((fa < 0) === (fm < 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; }

  /** Stations (rétrograde / direct) d'une planète */
  function stations(key, fromMs, days) {
    const out = []; let prev = speed(key, fromMs);
    for (let d = 1; d <= days; d++) {
      const ms = fromMs + d * DAY, sp = speed(key, ms);
      if ((sp < 0) !== (prev < 0)) { const t = bisect((x) => speed(key, x), ms - DAY, ms, 25); out.push({ ms: t, type: sp < 0 ? 'R' : 'D', lon: lon(key, t) }); }
      prev = sp;
    }
    return out;
  }
  function retroPeriods(key, fromMs, days) {
    const st = stations(key, fromMs - 160 * DAY, days + 160);
    const res = [];
    for (let i = 0; i < st.length; i++) if (st[i].type === 'R') { const d = st.find((x, j) => j > i && x.type === 'D'); if (d && d.ms >= fromMs) res.push({ key, start: st[i].ms, end: d.ms, lonStart: st[i].lon, lonEnd: d.lon }); }
    return res;
  }

  /** Éclipses à venir */
  function eclipses(fromMs, n = 4) {
    const out = [];
    let le = A.SearchLunarEclipse(new Date(fromMs));
    for (let i = 0; i < n; i++) { const ms = le.peak.date.getTime(); out.push({ type: 'lunaire', kind: le.kind, ms, lon: lon('moon', ms) }); le = A.NextLunarEclipse(le.peak); }
    let se = A.SearchGlobalSolarEclipse(new Date(fromMs));
    for (let i = 0; i < n; i++) { const ms = se.peak.date.getTime(); out.push({ type: 'solaire', kind: se.kind, ms, lon: lon('sun', ms) }); se = A.NextGlobalSolarEclipse(se.peak); }
    return out.sort((a, b) => a.ms - b.ms).slice(0, n + 2);
  }
  const KIND = { penumbral: 'pénombrale', partial: 'partielle', total: 'totale', annular: 'annulaire', hybrid: 'hybride' };

  /** Entrées de la Lune dans les signes entre deux dates */
  function moonIngresses(fromMs, toMs) {
    const out = []; const H = 3600000;
    let prevS = Math.floor(lon('moon', fromMs) / 30);
    for (let ms = fromMs + 2 * H; ms <= toMs; ms += 2 * H) {
      const s = Math.floor(lon('moon', ms) / 30);
      if (s !== prevS) { const t = bisect((x) => { const l = lon('moon', x); return angDiff(l, s * 30); }, ms - 2 * H, ms, 22); out.push({ ms: t, sign: s }); prevS = s; }
    }
    return out;
  }

  /** Périodes de Lune hors cours (dernier aspect majeur avant changement de signe) */
  function voidOfCourse(fromMs, toMs) {
    const ing = moonIngresses(fromMs - 3 * DAY, toMs + 3 * DAY);
    const pl = ['sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
    const asps = [0, 60, 90, 120, 180];
    const res = [];
    for (let k = 1; k < ing.length; k++) {
      const a = ing[k - 1].ms, b = ing[k].ms;
      if (b < fromMs || a > toMs) continue;
      const pa = pl.map((p) => lon(p, a)), pb = pl.map((p) => lon(p, b));
      let last = null;
      const step = 3600000; let prevMoon = lon('moon', a);
      for (let t = a + step; t <= b + 1; t += step) {
        const tt = Math.min(t, b), m = lon('moon', tt), f = (tt - a) / (b - a);
        const f0 = (tt - step - a) / (b - a);
        pl.forEach((p, i) => {
          const plNow = norm(pa[i] + angDiff(pb[i], pa[i]) * f), plPrev = norm(pa[i] + angDiff(pb[i], pa[i]) * Math.max(0, f0));
          const s0 = Math.abs(angDiff(prevMoon, plPrev)), s1 = Math.abs(angDiff(m, plNow));
          for (const x of asps) { if ((s0 - x) * (s1 - x) <= 0 && Math.abs(s1 - s0) < 30) { const tc = tt - step + step * Math.abs(s0 - x) / (Math.abs(s1 - s0) || 1); if (!last || tc > last.ms) last = { ms: tc, planet: p, asp: x }; } }
        });
        prevMoon = m;
      }
      if (last && b - last.ms > 60000) res.push({ start: last.ms, end: b, last, nextSign: ing[k].sign });
    }
    return res.filter((v) => v.end >= fromMs && v.start <= toMs);
  }

  /** Calendrier lunaire d'un mois (fuseau tz) */
  function moonMonth(year, month, tz) {
    const start = E.localToUTC(`${year}-${String(month).padStart(2, '0')}-01`, '00:00', tz).ms;
    const ny = month === 12 ? year + 1 : year, nm = month === 12 ? 1 : month + 1;
    const end = E.localToUTC(`${ny}-${String(nm).padStart(2, '0')}-01`, '00:00', tz).ms;
    const phases = []; let t = A.MakeTime(new Date(start - DAY));
    for (let i = 0; i < 8; i++) { const r = A.SearchMoonQuarter(t); if (r.time.date.getTime() > end) break; if (r.time.date.getTime() >= start) phases.push({ ms: r.time.date.getTime(), q: r.quarter, sign: Math.floor(lon('moon', r.time.date.getTime()) / 30) }); t = r.time.AddDays(1); }
    const ingress = moonIngresses(start, end);
    const voc = voidOfCourse(start, end);
    const days = [];
    for (let ms = start; ms < end; ms += DAY) {
      const local = new Date(ms + 12 * 3600000);
      const noon = ms + 12 * 3600000;
      days.push({ ms, day: Number(new Intl.DateTimeFormat('fr-FR', { timeZone: tz, day: 'numeric' }).format(local)), phase: A.MoonPhase(new Date(noon)), sign: Math.floor(lon('moon', noon) / 30), ing: ingress.filter((x) => x.ms >= ms && x.ms < ms + DAY), ph: phases.filter((x) => x.ms >= ms && x.ms < ms + DAY), voc: voc.filter((v) => v.start < ms + DAY && v.end > ms) });
    }
    return { start, end, days, phases, ingress, voc };
  }

  /** Croisements d'un aspect entre une planète en transit et un point natal */
  function crossings(key, natalLon, angle, fromMs, toMs, stepDays) {
    const out = []; const f = (ms) => angDiff(lon(key, ms), norm(natalLon + angle));
    let prev = f(fromMs);
    for (let ms = fromMs + stepDays * DAY; ms <= toMs; ms += stepDays * DAY) {
      const v = f(ms);
      if ((v < 0) !== (prev < 0) && Math.abs(v - prev) < 90) out.push(bisect(f, ms - stepDays * DAY, ms, 30));
      prev = v;
    }
    return out;
  }

  /** Grands cycles de vie */
  const LC = new Map();
  function lifeCycles(ch) {
    const key = ch.ms + '|' + ch.lat; if (LC.has(key)) return LC.get(key);
    const r = lifeCycles0(ch); LC.set(key, r); return r;
  }
  function lifeCycles0(ch) {
    const birth = ch.ms, to = birth + 100 * 365.25 * DAY;
    const nat = (k) => ch.bodies.find((b) => b.key === k).lon;
    const defs = [
      ['jupiter', 0, 'Retour de Jupiter', 'Tous les 12 ans environ : un nouveau cycle de croissance, de chance et d’ouverture commence.', 8],
      ['saturn', 90, 'Carré de Saturne', 'Un premier test de maturité : s’affirmer face aux règles et aux limites.', 10],
      ['saturn', 180, 'Opposition de Saturne', 'Le milieu du cycle de Saturne : faire le point sur ce qui a été construit.', 10],
      ['saturn', 270, 'Carré de Saturne (décroissant)', 'Un ajustement : consolider ou abandonner ce qui ne tient pas.', 10],
      ['saturn', 0, 'Retour de Saturne', 'Le grand passage à l’âge adulte (vers 29 ans), puis à la maturité (vers 58 ans) : on fait des choix qui engagent pour longtemps.', 10],
      ['uranus', 90, 'Carré d’Uranus', 'Vers 21 ans : besoin d’indépendance et de rupture avec le cadre familial.', 20],
      ['uranus', 180, 'Opposition d’Uranus', 'Vers 42 ans : la « crise du milieu de vie », envie de liberté et de renouveau.', 20],
      ['neptune', 90, 'Carré de Neptune', 'Vers 41 ans : remise en question des idéaux et des rêves.', 30],
      ['pluto', 90, 'Carré de Pluton', 'Une transformation profonde, souvent entre 36 et 45 ans selon la génération.', 30],
      ['chiron', 0, 'Retour de Chiron', 'Vers 50 ans : la blessure intime se transforme en sagesse et en capacité à aider les autres.', 12],
    ];
    const out = [];
    for (const [k, ang, label, txt, step] of defs) {
      const nl = nat(k); if (nl === undefined) continue;
      const xs = crossings(k, nl, ang, birth + 200 * DAY, to, step);
      // regrouper les passages multiples (rétrogradations) à moins d’un an d’écart
      const groups = [];
      for (const x of xs) { const g = groups[groups.length - 1]; if (g && x - g[g.length - 1] < 400 * DAY) g.push(x); else groups.push([x]); }
      for (const g of groups) out.push({ key: k, label, txt, ms: g[0], passes: g, age: (g[0] - birth) / (365.25 * DAY) });
    }
    return out.sort((a, b) => a.ms - b.ms);
  }

  /** Agenda des transits lents sur 12 mois */
  function transitAgenda(ch, fromMs, days = 365) {
    const T = ['mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron'];
    const N = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'].map((k) => ch.bodies.find((b) => b.key === k)).concat(ch.noTime ? [] : ch.angles.slice(0, 2));
    const ASP = [[0, 'conj', 'Conjonction'], [60, 'sext', 'Sextile'], [90, 'sq', 'Carré'], [120, 'tri', 'Trigone'], [180, 'opp', 'Opposition']];
    const out = [];
    for (const k of T) {
      const arr = []; for (let d = -3; d <= days + 3; d++) arr.push(lon(k, fromMs + d * DAY));
      const orbMax = k === 'mars' ? 1 : 1.2;
      for (const n of N) for (const [ang, ak, an] of ASP) {
        if (k === 'mars' && (ak === 'sext' || ak === 'tri')) continue;
        let inW = false, w = null;
        for (let i = 0; i < arr.length; i++) {
          const orb = Math.abs(Math.abs(angDiff(arr[i], n.lon)) - ang);
          if (orb <= orbMax) { if (!inW) { inW = true; w = { start: i, min: orb, exact: i }; } else if (orb < w.min) { w.min = orb; w.exact = i; } }
          else if (inW) { inW = false; w.end = i - 1; push(w); }
        }
        if (inW) { w.end = arr.length - 1; push(w); }
        function push(w) { const ms = (i) => fromMs + (i - 3) * DAY; if (ms(w.end) < fromMs) return; out.push({ t: k, n: n.key, nName: n.name, asp: ak, aspName: an, angle: ang, start: ms(w.start), end: ms(w.end), exact: ms(w.exact), minOrb: w.min, nature: ak === 'tri' || ak === 'sext' ? 'fluide' : ak === 'conj' ? 'neutre' : 'tendu' }); }
      }
    }
    return out.sort((a, b) => a.start - b.start);
  }

  /** Progressions secondaires (un jour = un an) */
  function progressed(ch, targetMs, houseSystem) {
    const years = (targetMs - ch.ms) / (365.2422 * DAY);
    const pms = ch.ms + years * DAY;
    const pc = E.calcChart({ ms: pms, lat: ch.lat, lon: ch.lon, houseSystem: houseSystem || ch.houseSystem, noTime: ch.noTime });
    // Lune progressée : changements de signe sur 30 ans
    const moonSteps = [];
    let prev = null;
    for (let m = -12; m <= 12 * 30; m += 1) {
      const t = targetMs + m * 30.44 * DAY, y = (t - ch.ms) / (365.2422 * DAY);
      if (y < 0) continue;
      const l = lon('moon', ch.ms + y * DAY), s = Math.floor(l / 30);
      if (prev !== null && s !== prev && t >= targetMs - 366 * DAY) moonSteps.push({ ms: t, sign: s, age: y });
      prev = s;
    }
    return { years, pms, chart: pc, moonSteps };
  }

  /** Lignes d'astrocartographie */
  function astroLines(ch) {
    const time = A.MakeTime(new Date(ch.ms));
    const gst = A.SiderealTime(time) * 15;
    const obs = new A.Observer(0, 0, 0);
    const out = [];
    for (const [k, b] of Object.entries(BODY)) {
      const eq = A.Equator(b, time, obs, true, true);
      const ra = eq.ra * 15, dec = eq.dec;
      const wrap = (x) => ((x + 540) % 360) - 180;
      const mc = wrap(ra - gst), ic = wrap(ra - gst + 180);
      const asc = [], dsc = [];
      for (let lat = -72; lat <= 72; lat += 1.5) {
        const c = -Math.tan(lat * Math.PI / 180) * Math.tan(dec * Math.PI / 180);
        if (Math.abs(c) > 1) continue;
        const H = Math.acos(c) * 180 / Math.PI;
        asc.push([wrap(ra - H - gst), lat]); dsc.push([wrap(ra + H - gst), lat]);
      }
      out.push({ key: k, mc, ic, asc, dsc });
    }
    return out;
  }

  /** Rectification : ascendants possibles au cours de la journée */
  function ascendantRanges(dateStr, lat, lonG, tz, houseSystem) {
    const out = []; let cur = null;
    for (let m = 0; m <= 24 * 60; m += 4) {
      const hh = String(Math.floor(Math.min(m, 1439) / 60)).padStart(2, '0'), mm = String(Math.min(m, 1439) % 60).padStart(2, '0');
      const ms = E.localToUTC(dateStr, `${hh}:${mm}`, tz).ms;
      const time = A.MakeTime(new Date(ms));
      const ramc = norm(A.SiderealTime(time) * 15 + lonG);
      const asc = E.ascFromRamc(ramc, E.trueObliquity(time), lat), s = Math.floor(asc / 30);
      const moonS = Math.floor(lon('moon', ms) / 30);
      if (!cur || cur.sign !== s) { if (cur) out.push(cur); cur = { sign: s, from: `${hh}:${mm}`, to: `${hh}:${mm}`, moon: new Set([moonS]) }; }
      else { cur.to = `${hh}:${mm}`; cur.moon.add(moonS); }
    }
    if (cur) out.push(cur);
    return out.map((r) => ({ ...r, moon: [...r.moon] }));
  }

  root.Events = { lon, speed, stations, retroPeriods, eclipses, KIND, moonIngresses, voidOfCourse, moonMonth, crossings, lifeCycles, transitAgenda, progressed, astroLines, ascendantRanges, DAY };
})(window);
