/* Mélastro — rendu SVG : roue zodiacale, bi-roue, carte du ciel, graphiques */
(function (root) {
  'use strict';
  const E = () => root.Engine;
  const D2R = Math.PI / 180;
  const ELC = { feu: '#d95926', terre: '#199e70', air: '#c98500', eau: '#3987e5' };
  const ASPC = { fluide: '#3987e5', tendu: '#e66767', neutre: '#c98500', ajustement: '#9085e9', 'léger': '#8a86a8' };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const f1 = (x) => Math.round(x * 10) / 10;

  function spread(items, minSep) {
    // items: [{lon}] -> ajoute .plon (longitude d'affichage) en évitant les chevauchements
    const s = items.slice().sort((a, b) => a.lon - b.lon);
    s.forEach((it) => (it.plon = it.lon));
    for (let iter = 0; iter < 60; iter++) {
      let moved = false;
      for (let i = 0; i < s.length; i++) {
        const a = s[i], b = s[(i + 1) % s.length];
        if (s.length < 2) break;
        let d = ((b.plon - a.plon) % 360 + 360) % 360;
        if (d < minSep) { const push = (minSep - d) / 2; a.plon -= push; b.plon += push; moved = true; }
      }
      if (!moved) break;
    }
    return s;
  }

  /**
   * wheel(chart, opts) — opts.outer : second thème (synastrie / transits), opts.outerLabel, opts.size
   */
  function wheel(ch, opts = {}) {
    const S = 640, c = S / 2, outer = opts.outer;
    const R = outer ? { z1: 236, z0: 204, h0: 186, p: 166, asp: 120, o: 266 } : { z1: 300, z0: 262, h0: 242, p: 214, asp: 160 };
    const asc = ch.noTime ? 0 : ch.angles[0].lon;
    const rot = ch.noTime ? 0 : asc; // AS à gauche
    const pt = (lon, r) => { const a = (180 + (lon - rot)) * D2R; return [f1(c + r * Math.cos(a)), f1(c - r * Math.sin(a))]; };
    let g = `<svg viewBox="0 0 ${S} ${S}" class="wheel" role="img" aria-label="Roue du thème astral">`;
    g += `<defs><radialGradient id="wbg" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#221f45"/><stop offset="100%" stop-color="#14122b"/></radialGradient></defs>`;
    g += `<circle cx="${c}" cy="${c}" r="${outer ? R.o + 34 : R.z1}" fill="url(#wbg)" stroke="var(--line)"/>`;
    // signes
    for (let i = 0; i < 12; i++) {
      const s = E().SIGNS[i], a0 = i * 30, a1 = a0 + 30;
      const [x0, y0] = pt(a0, R.z1), [x1, y1] = pt(a1, R.z1), [x2, y2] = pt(a1, R.z0), [x3, y3] = pt(a0, R.z0);
      g += `<path d="M${x0},${y0} A${R.z1},${R.z1} 0 0,0 ${x1},${y1} L${x2},${y2} A${R.z0},${R.z0} 0 0,1 ${x3},${y3} Z" fill="${ELC[s.element]}" fill-opacity="0.16" stroke="var(--line)" stroke-width="1"><title>${s.name} — ${s.element}</title></path>`;
      const [gx, gy] = pt(a0 + 15, (R.z1 + R.z0) / 2);
      g += `<text x="${gx}" y="${gy}" class="sg" fill="${ELC[s.element]}" text-anchor="middle" dominant-baseline="central" font-size="${outer ? 17 : 20}">${s.glyph}︎</text>`;
      for (let d = 0; d < 30; d += 5) { const [tx, ty] = pt(a0 + d, R.z0), [tx2, ty2] = pt(a0 + d, R.z0 - (d % 10 === 0 ? 6 : 3)); g += `<line x1="${tx}" y1="${ty}" x2="${tx2}" y2="${ty2}" stroke="var(--muted)" stroke-width="0.7"/>`; }
    }
    g += `<circle cx="${c}" cy="${c}" r="${R.h0}" fill="none" stroke="var(--line)"/>`;
    g += `<circle cx="${c}" cy="${c}" r="${R.asp}" fill="rgba(10,9,25,.35)" stroke="var(--line)"/>`;
    // maisons
    if (!ch.noTime) {
      for (let i = 0; i < 12; i++) {
        const cu = ch.cusps[i], next = ch.cusps[(i + 1) % 12];
        const isAngle = i % 3 === 0;
        const [x0, y0] = pt(cu, R.z0), [x1, y1] = pt(cu, R.asp);
        g += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${isAngle ? 'var(--ink)' : 'var(--line2)'}" stroke-width="${isAngle ? 1.6 : 0.8}"/>`;
        const mid = cu + (((next - cu) % 360 + 360) % 360) / 2;
        const [hx, hy] = pt(mid, (R.h0 + R.z0) / 2 - 1);
        g += `<text x="${hx}" y="${hy}" class="hn" text-anchor="middle" dominant-baseline="central">${i + 1}</text>`;
      }
      const labels = [['AS', ch.angles[0].lon], ['MC', ch.angles[1].lon], ['DS', ch.angles[2].lon], ['FC', ch.angles[3].lon]];
      for (const [l, lon] of labels) { const [x, y] = pt(lon, (outer ? R.o + 22 : R.z1 + 0) + (outer ? 0 : -0)); if (!outer) { const [ax, ay] = pt(lon, R.z1 + 2); g += `<circle cx="${ax}" cy="${ay}" r="3" fill="var(--gold)"/>`; } g += outer ? '' : ''; void x; void y; }
      for (const [l, lon] of labels) { const [x, y] = pt(lon, R.asp - 12); g += `<text x="${x}" y="${y}" class="ang" text-anchor="middle" dominant-baseline="central">${l}</text>`; }
    }
    // aspects
    const shown = new Set(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'node', 'asc', 'mc', 'lilith']);
    const aspList = opts.aspects || ch.aspects;
    const lonOf = (key, src) => { const b = src.bodies.find((x) => x.key === key) || src.angles.find((x) => x.key === key); return b ? b.lon : null; };
    for (const a of aspList) {
      if (!shown.has(a.a) || !shown.has(a.b)) continue;
      if (!opts.aspects && !a.major) continue;
      const la = lonOf(a.a, outer ? outer : ch), lb = lonOf(a.b, ch);
      const l1 = outer ? la : lonOf(a.a, ch);
      if (l1 === null || lb === null) continue;
      const [x1, y1] = pt(l1, R.asp - 2), [x2, y2] = pt(lb, R.asp - 2);
      const op = Math.max(0.25, 1 - a.orb / (a.maxOrb || 8));
      g += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ASPC[a.nature]}" stroke-width="${a.key === 'conj' ? 0 : 1.4}" stroke-opacity="${f1(op)}" ${a.nature === 'tendu' ? '' : a.nature === 'fluide' ? '' : 'stroke-dasharray="4 3"'}><title>${esc(a.an + ' ' + a.name + ' ' + a.bn + ' (orbe ' + a.orb.toFixed(1) + '°)')}</title></line>`;
    }
    // planètes
    const place = (src, rP, inward, cls) => {
      const items = spread(src.bodies.filter((b) => b.key !== 'snode' || true).map((b) => ({ ...b })), outer ? 8.5 : 7);
      let s = '';
      for (const b of items) {
        const [px, py] = pt(b.lon, inward ? R.z0 : (outer ? R.z1 : R.z0));
        const [qx, qy] = pt(b.lon, inward ? R.z0 - 6 : R.z1 + 6);
        const [gx, gy] = pt(b.plon, rP);
        const [lx, ly] = pt(b.plon, inward ? rP - 20 : rP + 21);
        s += `<line x1="${px}" y1="${py}" x2="${qx}" y2="${qy}" stroke="var(--ink)" stroke-width="1"/>`;
        s += `<g class="pl ${cls}" data-key="${b.key}"><title>${esc(b.name + ' ' + E().fmtDeg(b.lon) + ' ' + b.sign.name + (b.house ? ' — maison ' + b.house : '') + (b.retro ? ' — rétrograde' : ''))}</title>`;
        s += `<circle cx="${gx}" cy="${gy}" r="12" fill="transparent"/>`;
        s += `<text x="${gx}" y="${gy}" text-anchor="middle" dominant-baseline="central" class="pg">${b.glyph}︎</text>`;
        s += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="central" class="pd">${Math.floor(b.deg)}°${b.retro && b.key !== 'node' && b.key !== 'snode' ? '℞' : ''}</text></g>`;
      }
      return s;
    };
    g += place(ch, R.p, true, 'in');
    if (outer) { g += `<circle cx="${c}" cy="${c}" r="${R.o + 34}" fill="none" stroke="var(--line)"/>`; g += place(outer, R.o, false, 'out'); }
    g += '</svg>';
    return g;
  }

  /** barres horizontales — data: [{label, value, color, sub, title}] */
  function hbars(data, opts = {}) {
    const max = opts.max || Math.max(...data.map((d) => d.value), 1);
    const W = 100;
    return `<div class="hbars">${data.map((d) => {
      const w = Math.max(0, (d.value / max) * W);
      return `<div class="hb" title="${esc(d.title || d.label + ' : ' + (opts.fmt ? opts.fmt(d.value) : d.value))}"><div class="hb-l">${d.icon ? `<span class="hb-i" style="color:${d.color}">${d.icon}</span>` : `<span class="sw" style="background:${d.color || 'var(--accent)'}"></span>`}${esc(d.label)}</div><div class="hb-t"><div class="hb-f" style="width:${w}%;background:${d.color || 'var(--accent)'}"></div></div><div class="hb-v">${opts.fmt ? opts.fmt(d.value) : d.value}</div></div>`;
    }).join('')}</div>`;
  }

  /** histogramme vertical des 12 signes */
  function signColumns(counts, opts = {}) {
    const max = Math.max(...counts, 1), W = 600, H = 200, bw = W / 12;
    let s = `<svg viewBox="0 -22 ${W} ${H + 68}" class="cols" role="img" aria-label="${esc(opts.label || 'Répartition par signe')}">`;
    for (let i = 0; i < 4; i++) { const y = f1(H - (H * i) / 4); s += `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-width="0.6"/>`; }
    counts.forEach((v, i) => {
      const sg = E().SIGNS[i], h = (v / max) * (H - 10), x = i * bw + 7, w = bw - 14;
      const y = H - h;
      if (v > 0) s += `<path d="M${f1(x)},${H} V${f1(y + 4)} Q${f1(x)},${f1(y)} ${f1(x + 4)},${f1(y)} H${f1(x + w - 4)} Q${f1(x + w)},${f1(y)} ${f1(x + w)},${f1(y + 4)} V${H} Z" fill="${ELC[sg.element]}"><title>${sg.name} : ${opts.fmt ? opts.fmt(v) : v}</title></path>`;
      s += `<rect x="${f1(i * bw)}" y="0" width="${f1(bw)}" height="${H}" fill="transparent"><title>${sg.name} : ${opts.fmt ? opts.fmt(v) : v}</title></rect>`;
      if (v > 0) s += `<text x="${f1(x + w / 2)}" y="${f1(y - 6)}" text-anchor="middle" class="cv">${opts.fmt ? opts.fmt(v) : v}</text>`;
      s += `<text x="${f1(i * bw + bw / 2)}" y="${H + 20}" text-anchor="middle" class="cg" fill="${ELC[sg.element]}">${sg.glyph}︎</text>`;
      s += `<text x="${f1(i * bw + bw / 2)}" y="${H + 38}" text-anchor="middle" class="cl">${sg.name.slice(0, 4)}.</text>`;
    });
    s += `<line x1="0" x2="${W}" y1="${H}" y2="${H}" stroke="var(--muted)"/></svg>`;
    return s;
  }

  /** grille d'aspects triangulaire */
  function aspectGrid(ch) {
    const pts = ch.bodies.filter((b) => b.key !== 'snode' && b.key !== 'fortune').concat(ch.noTime ? [] : ch.angles.slice(0, 2));
    const idx = {}; pts.forEach((p, i) => (idx[p.key] = i));
    const m = {}; for (const a of ch.aspects) { m[a.a + '|' + a.b] = a; m[a.b + '|' + a.a] = a; }
    let h = '<table class="agrid"><tbody>';
    for (let i = 0; i < pts.length; i++) {
      h += '<tr>';
      for (let j = 0; j < i; j++) {
        const a = m[pts[i].key + '|' + pts[j].key];
        h += a ? `<td class="has" style="color:${ASPC[a.nature]}" title="${esc(a.an + ' ' + a.name + ' ' + a.bn + ' — orbe ' + a.orb.toFixed(2) + '°' + (a.applying === true ? ' (appliquant)' : a.applying === false ? ' (séparant)' : ''))}">${a.glyph}<small>${Math.floor(a.orb)}°${String(Math.round((a.orb % 1) * 60)).padStart(2, '0')}</small></td>` : '<td></td>';
      }
      h += `<th title="${esc(pts[i].name)}">${pts[i].glyph}</th></tr>`;
    }
    h += '</tbody></table>';
    return h;
  }

  function moonIcon(phaseDeg, size = 46) {
    // phaseDeg : 0 = nouvelle, 180 = pleine
    const r = size / 2 - 2, c = size / 2;
    const p = ((phaseDeg % 360) + 360) % 360;
    const k = Math.cos(p * D2R); // 1 nouvelle, -1 pleine
    const waxing = p < 180;
    const rx = Math.abs(k) * r;
    const sweepLit = waxing ? 1 : 0;
    // portion éclairée : demi-cercle côté droit (croissante) + ellipse
    const halfLit = `M${c},${c - r} A${r},${r} 0 0,${sweepLit} ${c},${c + r}`;
    const ell = `A${f1(rx)},${r} 0 0,${(k > 0) === waxing ? 0 : 1} ${c},${c - r}`;
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="moonico" aria-hidden="true"><circle cx="${c}" cy="${c}" r="${r}" fill="#2c2850"/><path d="${halfLit} ${ell} Z" fill="#f3e9c6"/></svg>`;
  }

  /** carte du ciel : projection stéréographique centrée sur le zénith */
  function skyMap(view, opts = {}) {
    const S = 640, c = S / 2, R = 300;
    const proj = (alt, az) => { const z = (90 - alt) * D2R; const r = R * Math.tan(z / 2) / Math.tan(Math.PI / 4); const a = az * D2R; return [f1(c - r * Math.sin(a)), f1(c - r * Math.cos(a)), r]; };
    const sun = view.planets.find((p) => p.key === 'sun');
    const sa = sun.alt;
    const sky = sa > 0 ? ['#3d6fb0', '#1d3c72'] : sa > -6 ? ['#30406e', '#1a1f45'] : sa > -12 ? ['#1d2150', '#100f2a'] : sa > -18 ? ['#141638', '#0a0a1e'] : ['#0d0d26', '#05050f'];
    const dayDim = opts.realistic && sa > -6 ? 0.25 : 1;
    let g = `<svg viewBox="0 0 ${S} ${S}" class="skymap" role="img" aria-label="Carte du ciel"><defs><radialGradient id="skyg" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${sky[1]}"/><stop offset="100%" stop-color="${sky[0]}"/></radialGradient><clipPath id="hz"><circle cx="${c}" cy="${c}" r="${R}"/></clipPath></defs>`;
    g += `<circle cx="${c}" cy="${c}" r="${R}" fill="url(#skyg)"/>`;
    g += `<g clip-path="url(#hz)">`;
    // cercles d'altitude
    for (const alt of [30, 60]) { const r = proj(alt, 0)[2]; g += `<circle cx="${c}" cy="${c}" r="${f1(r)}" fill="none" stroke="#ffffff" stroke-opacity="0.07"/>`; }
    // lignes de constellations
    const SD = root.SKYDATA;
    if (opts.lines !== false) {
      let d = '';
      for (const fig of SD.lines) for (const seg of fig) {
        let prev = null;
        for (const [ra, dec] of seg) {
          const h = view.toHor(ra, dec);
          const cur = h.alt > -3 ? proj(h.alt, h.az) : null;
          if (cur && prev) d += `M${prev[0]},${prev[1]}L${cur[0]},${cur[1]}`;
          prev = cur;
        }
      }
      g += `<path d="${d}" stroke="#9fb3ff" stroke-opacity="${0.35 * dayDim}" stroke-width="0.9" fill="none"/>`;
    }
    // écliptique
    let ed = ''; let pe = null;
    for (const p of view.ecl) { const cur = p.alt > -3 ? proj(p.alt, p.az) : null; if (cur && pe) ed += `M${pe[0]},${pe[1]}L${cur[0]},${cur[1]}`; pe = cur; }
    g += `<path d="${ed}" stroke="#e8c25a" stroke-opacity="0.55" stroke-width="1.2" stroke-dasharray="5 4" fill="none"><title>Écliptique — chemin apparent du Soleil et des planètes</title></path>`;
    // étoiles
    const bvColor = (bv) => bv < 0 ? '#aac4ff' : bv < 0.3 ? '#d8e2ff' : bv < 0.6 ? '#fbf8ff' : bv < 1.0 ? '#fff1d6' : bv < 1.4 ? '#ffd9a8' : '#ffbe85';
    let st = '';
    const labels = [];
    for (const s of SD.stars) {
      const [ra, dec, mag, bv, name] = s;
      if (mag > (opts.maxMag || 5.6)) continue;
      const h = view.toHor(ra, dec);
      if (h.alt < 0) continue;
      const [x, y] = proj(h.alt, h.az);
      const r = Math.max(0.5, 3.4 - mag * 0.55);
      st += `<circle cx="${x}" cy="${y}" r="${f1(r)}" fill="${bvColor(bv)}" fill-opacity="${f1(Math.min(1, 1.15 - mag * 0.12) * dayDim)}"${name ? `><title>${esc(name)} (mag. ${mag})</title></circle>` : '/>'}`;
      if (name && mag < 1.6) labels.push(`<text x="${f1(x + 5)}" y="${f1(y - 5)}" class="sn">${esc(name)}</text>`);
    }
    g += st + labels.join('');
    // noms de constellations
    if (opts.names !== false) for (const [id, fr, ra, dec, rank] of SD.cons) {
      if (rank > 2) continue; const h = view.toHor(ra, dec); if (h.alt < 5) continue;
      const [x, y] = proj(h.alt, h.az); g += `<text x="${x}" y="${y}" class="cn" text-anchor="middle">${esc(fr)}</text>`; void id;
    }
    g += `</g>`;
    // planètes (hors du masque pour ne pas couper les étiquettes)
    const placed = [];
    for (const p of view.planets.slice().sort((a, b) => b.alt - a.alt)) {
      if (p.alt < 0) continue;
      const [x, y] = proj(p.alt, p.az);
      const col = p.key === 'sun' ? '#ffd257' : p.key === 'moon' ? '#f3e9c6' : '#ffb3d1';
      if (p.key === 'sun') g += `<circle cx="${x}" cy="${y}" r="14" fill="#ffd257" fill-opacity="0.25"/><circle cx="${x}" cy="${y}" r="8" fill="#ffd257"/>`;
      else if (p.key === 'moon') g += `<g transform="translate(${x - 12},${y - 12})">${moonIcon(view.moonPhase, 24)}</g>`;
      else g += `<circle cx="${x}" cy="${y}" r="4" fill="${col}" stroke="#14122b" stroke-width="1.5"/>`;
      let ly = y + 4; while (placed.some(([px, py]) => Math.abs(px - x) < 70 && Math.abs(py - ly) < 13)) ly += 13;
      placed.push([x, ly]);
      const right = x < c + R - 80;
      g += `<text x="${f1(right ? x + 10 : x - 10)}" y="${f1(ly)}" class="sp" text-anchor="${right ? 'start' : 'end'}">${p.glyph}\uFE0E ${esc(p.name)}</text>`;
    }
    g += `<circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="var(--ink)" stroke-opacity="0.6" stroke-width="1.5"/>`;
    for (const [l, az] of [['N', 0], ['E', 90], ['S', 180], ['O', 270]]) { const a = az * D2R; g += `<text x="${f1(c - (R + 14) * Math.sin(a))}" y="${f1(c - (R + 14) * Math.cos(a))}" class="card" text-anchor="middle" dominant-baseline="central">${l}</text>`; }
    // planètes sous l'horizon
    const below = view.planets.filter((p) => p.alt < 0).map((p) => p.glyph + '︎ ' + p.name).join(' · ');
    g += '</svg>';
    return { svg: g, below, sunAlt: sa };
  }

  root.Charts = { wheel, hbars, signColumns, aspectGrid, moonIcon, skyMap, ELC, ASPC, esc };
})(typeof window !== 'undefined' ? window : globalThis);
