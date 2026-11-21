/* Mélastro — fonctionnalités v1.3 : horoscope, calendrier, événements, agenda, cycles, progressions,
   astrocartographie, rectification, journal, fiche PDF, affiche du ciel, groupe, sauvegarde cloud, .ics, thèmes */
(function (root) {
  'use strict';
  const App = () => root.App, E = () => root.Engine, C = () => root.Charts, I = () => root.Interp, EV = () => root.Events, PS = () => root.Perso;
  const H = (k) => root.Help.H(k);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (s) => document.querySelector(s);
  const DAY = 86400000;
  const fmtD = (ms, opt) => new Date(ms).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', ...(opt || { day: 'numeric', month: 'long', year: 'numeric' }) });
  const fmtT = (ms) => new Date(ms).toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' });
  const sgn = (i) => { const s = E().SIGNS[((i % 12) + 12) % 12]; return `<span style="color:${C().ELC[s.element]}">${s.glyph}︎</span> ${s.name}`; };
  const pl = (k) => E().PMAP[k];
  const FEM = ['Lune', 'Vénus', 'Lilith', 'Part de Fortune'];
  const art = (k) => { const n = k === 'asc' ? 'Ascendant' : k === 'mc' ? 'Milieu du Ciel' : pl(k).name; return (/^[AEIOUÉ]/i.test(n) ? 'l’' : FEM.includes(n) ? 'la ' : 'le ') + n; };
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const ROLE = { sun: 'son identité', moon: 'ses émotions', mercury: 'sa façon de penser', venus: 'sa vie amoureuse', mars: 'son énergie', jupiter: 'sa confiance', saturn: 'son sens des responsabilités', uranus: 'son besoin de liberté', neptune: 'son imaginaire', pluto: 'sa force intérieure', chiron: 'sa blessure intime', node: 'son chemin de vie', lilith: 'sa part sauvage', asc: 'sa personnalité', mc: 'sa vie professionnelle' };

  /* ================= Horoscope du jour ================= */
  const TFLAV = {
    sun: ['met en lumière', 'met à l’épreuve', 'éclaire intensément'], moon: ['adoucit', 'rend plus réactive', 'rend très sensible'],
    mercury: ['inspire', 'complique', 'occupe les pensées de'], venus: ['adoucit et embellit', 'rend exigeante', 'enchante'],
    mars: ['dynamise', 'met sous pression', 'électrise'], jupiter: ['ouvre de belles portes à', 'gonfle', 'amplifie'],
    saturn: ['stabilise', 'freine et met à l’épreuve', 'structure en profondeur'], uranus: ['libère', 'bouscule', 'réveille brusquement'],
    neptune: ['inspire', 'brouille', 'enveloppe de rêve'], pluto: ['transforme en douceur', 'pousse dans ses retranchements', 'transforme en profondeur'],
    chiron: ['aide à guérir', 'réveille', 'touche'], node: ['oriente', 'questionne', 'met sur le chemin de'],
  };
  const ADV = {
    sun: ['se mettre en avant, oser se montrer', 'éviter les bras de fer d’ego'], moon: ['écouter ses envies et prendre soin de soi', 'ne pas réagir à chaud'],
    mercury: ['parler, écrire, négocier, apprendre', 'relire avant d’envoyer, vérifier les détails'], venus: ['se faire plaisir et voir les gens qu’on aime', 'éviter les achats impulsifs et les jalousies'],
    mars: ['se lancer, bouger, faire du sport', 'canaliser l’irritation, éviter les conflits'], jupiter: ['voir grand et saisir les occasions', 'ne pas en faire trop'],
    saturn: ['s’organiser et construire sur le long terme', 'être patient et indulgent avec soi'], uranus: ['tenter quelque chose de nouveau', 'rester souple face aux imprévus'],
    neptune: ['rêver, créer, méditer', 'vérifier les informations, éviter les illusions'], pluto: ['aller au fond des choses', 'lâcher prise sur ce qu’on ne contrôle pas'],
    chiron: ['prendre soin de ses fragilités', 'se montrer bienveillant avec ses blessures'], node: ['suivre son intuition profonde', 'sortir de ses vieilles habitudes'],
  };
  function horoscope(p, ch, ms) {
    const tr = E().transitsFor(ch, ms, {});
    const W = { moon: 1.2, sun: 1.5, mercury: 1.3, venus: 1.5, mars: 1.6, jupiter: 1.2, saturn: 1.3, uranus: 1, neptune: 0.9, pluto: 1, chiron: 0.6, node: 0.5, lilith: 0.2 };
    const NW = { sun: 3, moon: 3, asc: 2.5, mc: 2, venus: 2, mars: 2, mercury: 1.8, jupiter: 1.2, saturn: 1.2 };
    const list = tr.aspects.filter((a) => !['lilith', 'node'].includes(a.a) && a.b !== 'lilith' && a.b !== 'fortune').map((a) => ({ ...a, w: (W[a.a] || 0.5) * (NW[a.b] || 0.8) * (1 - a.orb / (a.maxOrb + 0.01)) })).sort((x, y) => y.w - x.w);
    const moon = tr.chart.bodies[1];
    const moonHouse = ch.noTime ? null : E().houseOf(moon.lon, ch.cusps);
    const N = p.name;
    const top = list.slice(0, 4);
    const score = (keys) => { let s = 0; for (const a of list) if (keys.includes(a.b) || keys.includes(a.a)) s += (a.nature === 'fluide' ? 1 : a.nature === 'tendu' ? -0.9 : (['saturn', 'mars', 'pluto', 'uranus'].includes(a.a) ? -0.4 : 0.6)) * a.w; return Math.max(1, Math.min(5, Math.round(3 + 2 * Math.tanh(s / 4)))); };
    const met = { amour: score(['venus', 'moon']), travail: score(['mercury', 'saturn', 'mc', 'sun']), energie: score(['mars', 'sun', 'asc']), moral: score(['moon', 'jupiter', 'sun']) };
    const phrase = (a) => { const fl = TFLAV[a.a] || ['influence', 'défie', 'active']; const v = a.nature === 'fluide' ? fl[0] : a.nature === 'tendu' ? fl[1] : fl[2]; return `${cap(art(a.a))} ${v} ${ROLE[a.b] || art(a.b)}${a.a === 'moon' ? ' pour quelques heures' : ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron', 'node'].includes(a.a) ? ' (une influence de fond, sur plusieurs semaines)' : ''}.`; };
    const adv = top.length ? (ADV[top[0].a] || ADV.moon)[top[0].nature === 'tendu' ? 1 : 0] : 'profiter d’une journée calme pour souffler';
    return { tr, top, moon, moonHouse, met, phrase, adv, N, phase: E().moonPhaseName(tr.chart.moonPhase), phaseDeg: tr.chart.moonPhase };
  }
  const stars = (n) => '★'.repeat(n) + '<span class="muted">' + '★'.repeat(5 - n) + '</span>';
  function tabHoroscope(p, ch, dateStr) {
    const today = new Date().toISOString().slice(0, 10), ds = dateStr || today;
    const ms = dateStr ? E().localToUTC(ds, '12:00', 'Europe/Paris').ms : Date.now();
    const h = horoscope(p, ch, ms);
    const tomorrow = new Date(new Date(ds).getTime() + DAY).toISOString().slice(0, 10), yest = new Date(new Date(ds).getTime() - DAY).toISOString().slice(0, 10);
    return `<div class="toolbar"><a class="btn sm" href="#/profil/${p.id}/horoscope/${yest}">◀ Veille</a><input type="date" id="hodate" value="${ds}" style="width:auto"><a class="btn sm" href="#/profil/${p.id}/horoscope">Aujourd’hui</a><a class="btn sm" href="#/profil/${p.id}/horoscope/${tomorrow}">Lendemain ▶</a></div>
    <div class="split"><div class="col">
      <div class="card horo"><h2>${fmtD(ms, { weekday: 'long', day: 'numeric', month: 'long' })} pour ${esc(p.name)} ${H('transits')}</h2>
        <div class="row">${C().moonIcon(h.phaseDeg, 54)}<p>La Lune est en <b>${h.moon.sign.name}</b> (${h.phase.toLowerCase()})${h.moonHouse ? ` et traverse sa <b>maison ${h.moonHouse}</b> : aujourd’hui, l’attention de ${esc(p.name)} se tourne naturellement ${PS().HOUSE_P[h.moonHouse - 1]}` : ''}.</p></div>
        ${h.top.length ? `<h3>Les influences du jour</h3><ul class="sxl">${h.top.map((a) => `<li class="sx ${a.nature === 'tendu' ? 'hard' : 'good'}"><p>${a.nature === 'tendu' ? '⚡' : '✦'} ${h.phrase(a)}</p><span class="theory small">${a.an} en transit ${a.name.toLowerCase()} ${a.bn} natal · orbe ${a.orb.toFixed(1)}°</span></li>`).join('')}</ul>` : '<p>Une journée sans influence marquante : idéale pour souffler.</p>'}
        <div class="advice">💡 <b>Le conseil du jour :</b> ${h.adv}.</div></div></div>
      <div class="col"><div class="card"><h3>Météo astrale</h3><dl class="kv meteo"><dt>💗 Amour</dt><dd>${stars(h.met.amour)}</dd><dt>💼 Travail</dt><dd>${stars(h.met.travail)}</dd><dt>⚡ Énergie</dt><dd>${stars(h.met.energie)}</dd><dt>☀️ Moral</dt><dd>${stars(h.met.moral)}</dd></dl>
        <p class="small muted">Calculée à partir des vrais transits du jour sur le thème de ${esc(p.name)} : ce n’est pas un horoscope générique par signe.</p></div>
        <div class="card"><h3>Toutes les influences actives</h3><ul class="plist">${h.tr.aspects.filter((a) => a.a !== 'lilith' && a.b !== 'lilith').slice(0, 12).map((a) => `<li><span style="color:${C().ASPC[a.nature]}">${a.ag}︎ ${a.glyph} ${a.bg}︎</span> <span class="small">${a.an} ${a.name.toLowerCase()} ${a.bn} · ${a.orb.toFixed(1)}°</span></li>`).join('')}</ul></div></div></div>`;
  }

  /* ================= Calendrier lunaire & événements ================= */
  function cielTabs(tab) { return `<nav class="tabs">${[['', 'Le ciel aujourd’hui'], ['calendrier', 'Calendrier lunaire'], ['evenements', 'Rétrogrades & éclipses']].map(([k, l]) => `<a href="#/ciel${k ? '/' + k : ''}" class="${(tab || '') === k ? 'on' : ''}">${l}</a>`).join('')}</nav>`; }
  function ciel(tab, viewSky, a, b) {
    if (tab === 'calendrier') return cielTabs(tab) + calendar(a, b);
    if (tab === 'evenements') return cielTabs(tab) + eventsView();
    return cielTabs('') + viewSky();
  }
  const QN = ['Nouvelle Lune', 'Premier quartier', 'Pleine Lune', 'Dernier quartier'];
  function calendar(yStr, mStr) {
    const now = new Date(); const y = +(yStr || now.getFullYear()), m = +(mStr || now.getMonth() + 1);
    const tz = 'Europe/Paris';
    const mm = EV().moonMonth(y, m, tz);
    const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); const lead = (first + 6) % 7;
    const prev = m === 1 ? [y - 1, 12] : [y, m - 1], next = m === 12 ? [y + 1, 1] : [y, m + 1];
    const todayStr = new Date().toISOString().slice(0, 10);
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push('<div class="cd cd-empty"></div>');
    for (const d of mm.days) {
      const s = E().SIGNS[d.sign]; const iso = `${y}-${String(m).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
      cells.push(`<div class="cd ${iso === todayStr ? 'today' : ''} ${d.ph.length ? 'ev' : ''}" title="${esc(E().moonPhaseName(d.phase) + ' en ' + s.name)}"><div class="cd-n">${d.day}</div>${C().moonIcon(d.phase, 26)}<div class="cd-s" style="color:${C().ELC[s.element]}">${s.glyph}︎</div>
        ${d.ph.map((x) => `<div class="cd-e">${['🌑', '🌓', '🌕', '🌗'][x.q]} ${fmtT(x.ms)}</div>`).join('')}${d.ing.map((x) => `<div class="cd-i">→ ${E().SIGNS[x.sign].glyph}︎ ${fmtT(x.ms)}</div>`).join('')}${d.voc.length ? '<div class="cd-v" title="Lune hors cours">◌ HC</div>' : ''}</div>`);
    }
    const monthName = new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return `<section class="hero"><div><h1>${cap(monthName)}</h1><p class="sub">Phases, signes de la Lune et périodes « hors cours », à l’heure de Paris ${H('lunePhases')}</p></div>
      <div class="row"><a class="btn sm" href="#/ciel/calendrier/${prev[0]}/${prev[1]}">◀</a><a class="btn sm" href="#/ciel/calendrier">Ce mois-ci</a><a class="btn sm" href="#/ciel/calendrier/${next[0]}/${next[1]}">▶</a></div></section>
      <div class="card"><div class="cal">${['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'].map((d) => `<div class="cdh">${d}</div>`).join('')}${cells.join('')}</div>
      <p class="small muted">🌑🌓🌕🌗 phases · → changement de signe de la Lune · ◌ HC : Lune hors cours ${H('voc')}</p></div>
      <div class="grid2"><div class="card"><h3>Phases du mois</h3><ul class="plist">${mm.phases.map((x) => `<li>${['🌑', '🌓', '🌕', '🌗'][x.q]} <span><b>${QN[x.q]}</b> en ${sgn(x.sign)} — ${fmtD(x.ms, { weekday: 'long', day: 'numeric', month: 'long' })} à ${fmtT(x.ms)}<br><span class="small muted">${x.q === 0 ? 'Moment idéal pour poser des intentions et démarrer.' : x.q === 2 ? 'Moment de bilan, d’émotions fortes et de récolte.' : x.q === 1 ? 'Passer à l’action, surmonter les obstacles.' : 'Trier, lâcher, préparer le cycle suivant.'}</span></span></li>`).join('')}</ul></div>
      <div class="card"><h3>Lune hors cours ${H('voc')}</h3>${mm.voc.length ? `<ul class="plist">${mm.voc.map((v) => `<li>◌ <span>du ${fmtD(v.start, { weekday: 'short', day: 'numeric', month: 'short' })} ${fmtT(v.start)} au ${fmtD(v.end, { weekday: 'short', day: 'numeric', month: 'short' })} ${fmtT(v.end)} <span class="small muted">(${durH(v.end - v.start)})</span></span></li>`).join('')}</ul>` : '<p class="muted">Aucune.</p>'}<p class="small muted">Traditionnellement, on évite d’y lancer des projets importants ou de signer.</p></div></div>`;
  }
  const durH = (ms) => { const h = Math.round(ms / 3600000); return h < 1 ? 'moins d’une heure' : h + ' h'; };

  function eventsView() {
    const now = Date.now(), P = App().state.profiles;
    const retro = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'].flatMap((k) => EV().retroPeriods(k, now - 30 * DAY, 400)).filter((r) => r.end > now).sort((a, b) => a.start - b.start);
    const ecl = EV().eclipses(now, 4);
    const touched = (lo, hi, extra) => P.map((p) => { const ch = App().chartOf(p); const hits = ch.bodies.filter((b) => ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'].includes(b.key)).concat(ch.noTime ? [] : ch.angles.slice(0, 2)).filter((b) => inArc(b.lon, lo - extra, hi + extra)); const house = ch.noTime ? null : E().houseOf((lo + E().angDiff(hi, lo) / 2 + 360) % 360, ch.cusps); return { p, hits, house }; });
    const inArc = (x, a, b) => { const span = E().norm(b - a), d = E().norm(x - a); return d <= span; };
    const pTxt = (list) => list.filter((x) => x.hits.length || x.house).map((x) => `<li><a href="#/profil/${x.p.id}">${esc(x.p.name)}</a> : ${x.house ? `touche sa maison ${x.house} (${PS().HOUSE_P[x.house - 1]})` : ''}${x.hits.length ? `${x.house ? ' et ' : ''}passe sur ${x.hits.map((h) => art(h.key) + (h.key === 'asc' || h.key === 'mc' ? '' : ' natal')).join(', ')}` : ''}.</li>`).join('');
    const RTXT = { mercury: 'Communication, transports, contrats et appareils peuvent faire des siennes : idéal pour relire, revoir, renouer — moins pour signer ou acheter de l’électronique.', venus: 'Les histoires d’amour passées refont surface, on réévalue ses goûts et ses dépenses. Évitez chirurgie esthétique et gros achats de luxe.', mars: 'L’énergie se tourne vers l’intérieur : moins d’élan, plus de frustrations. On reprend des projets plutôt que d’en lancer de nouveaux.', jupiter: 'Le temps de consolider ce qui a grandi, de repenser ses croyances et ses projets d’expansion.', saturn: 'On revoit ses structures, ses engagements et ses responsabilités, à son rythme.' };
    return `<section class="hero"><div><h1>Rétrogrades & éclipses</h1><p class="sub">Les grands moments des 12 prochains mois, et ce qu’ils activent pour chaque personne du carnet. ${H('retro')}</p></div><button class="btn" data-act="ics">📅 Ajouter à mon agenda (.ics)</button></section>
      <h2 class="sec">Planètes rétrogrades</h2>
      ${retro.map((r) => `<div class="card evc"><div class="evh"><span class="evg">${pl(r.key).glyph}︎</span><div><b>${pl(r.key).name} rétrograde</b><br><span class="small">du ${fmtD(r.start)} au ${fmtD(r.end)} · de ${E().fmtDeg(r.lonStart)} à ${E().fmtDeg(r.lonEnd)}</span></div>${r.start < now ? '<span class="badge">en cours</span>' : ''}</div><p class="small">${RTXT[r.key]}</p>${P.length ? `<ul class="small evp">${pTxt(touched(r.lonEnd, r.lonStart, 1))}</ul>` : ''}</div>`).join('')}
      <h2 class="sec">Éclipses ${H('eclipse')}</h2>
      ${ecl.map((e) => `<div class="card evc"><div class="evh"><span class="evg">${e.type === 'solaire' ? '🌑' : '🌕'}</span><div><b>Éclipse ${e.type} ${EV().KIND[e.kind] || ''}</b><br><span class="small">${fmtD(e.ms, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à ${fmtT(e.ms)} · ${E().fmtDeg(e.lon)} ${E().signOf(e.lon).sign.name}</span></div></div>
        <p class="small">${e.type === 'solaire' ? 'Une super Nouvelle Lune : un nouveau départ, souvent inattendu, dans le domaine touché.' : 'Une super Pleine Lune : une fin, une prise de conscience ou un aboutissement dans le domaine touché.'}</p>${P.length ? `<ul class="small evp">${pTxt(touched(e.lon - 3, e.lon + 3, 0).concat(touched(e.lon + 177, e.lon + 183, 0).map((x) => ({ ...x, house: null }))).filter((x, i, arr) => arr.findIndex((y) => y.p.id === x.p.id && (y.hits.length === x.hits.length)) === i))}</ul>` : ''}</div>`).join('')}`;
  }

  /* ================= Agenda des transits ================= */
  const AGTXT = {
    jupiter: ['une période d’ouverture et de chance pour', 'un excès d’optimisme possible autour de', 'un grand élan d’expansion pour'],
    saturn: ['une consolidation solide de', 'une période d’épreuve et de maturation pour', 'un tournant sérieux pour'],
    uranus: ['un vent de liberté et de nouveauté sur', 'des changements soudains autour de', 'un réveil brutal mais libérateur de'],
    neptune: ['une inspiration douce pour', 'du flou et des doutes autour de', 'une dissolution des repères de'],
    pluto: ['une transformation constructive de', 'une crise profonde qui transforme', 'une renaissance de'],
    chiron: ['une guérison possible de', 'une blessure qui se réveille autour de', 'une prise de conscience sur'],
    mars: ['un coup de boost pour', 'des tensions et de l’impatience autour de', 'une poussée d’énergie pour'],
  };
  function tabAgenda(p, ch) {
    const now = Date.now(); const start = now - 30 * DAY;
    const ag = EV().transitAgenda(ch, start, 395).filter((x) => x.end >= now - 15 * DAY);
    const span = 395 * DAY; const pos = (ms) => Math.max(0, Math.min(100, ((ms - start) / span) * 100));
    const months = []; for (let i = 0; i <= 13; i++) { const d = new Date(start); d.setDate(1); d.setMonth(d.getMonth() + i); if (d.getTime() >= start && d.getTime() <= start + span) months.push(d.getTime()); }
    const slow = ag.filter((x) => x.t !== 'mars'), fast = ag.filter((x) => x.t === 'mars');
    const row = (x) => `<div class="gr"><div class="gl2">${pl(x.t).glyph}︎ <span style="color:${C().ASPC[x.nature]}">${E().ASPECTS.find((a) => a.key === x.asp).glyph}</span> ${x.n === 'asc' ? 'AS' : x.n === 'mc' ? 'MC' : pl(x.n).glyph + '︎'} <span class="small">${pl(x.t).name} ${x.aspName.toLowerCase()} ${x.nName}</span></div><div class="gt"><div class="gb" style="left:${pos(x.start)}%;width:${Math.max(1, pos(x.end) - pos(x.start))}%;background:${C().ASPC[x.nature]}" title="${esc(fmtD(x.start) + ' → ' + fmtD(x.end))}"></div><div class="gx" style="left:${pos(x.exact)}%"></div></div></div>`;
    const card = (x) => { const t = (AGTXT[x.t] || AGTXT.mars)[x.nature === 'fluide' ? 0 : x.nature === 'tendu' ? 1 : 2]; return `<li class="sx ${x.nature === 'tendu' ? 'hard' : 'good'}"><div class="sx-h"><b>${pl(x.t).glyph}︎ ${pl(x.t).name} ${x.aspName.toLowerCase()} ${art(x.n)}${x.n === 'asc' || x.n === 'mc' ? '' : ' natal'}</b></div><p>${cap(t)} ${ROLE[x.n]}.</p><span class="small">Du <b>${fmtD(x.start)}</b> au <b>${fmtD(x.end)}</b> · exact le ${fmtD(x.exact)}</span></li>`; };
    return `<div class="card"><h3>Les 12 prochains mois en un coup d’œil ${H('lentes')}</h3>
      <div class="gantt"><div class="gr gh"><div class="gl2"></div><div class="gt">${months.map((m) => `<span class="gm" style="left:${pos(m)}%">${new Date(m).toLocaleDateString('fr-FR', { month: 'short' })}</span>`).join('')}<div class="gnow" style="left:${pos(now)}%"></div></div></div>${slow.map(row).join('') || '<p class="muted">Aucun grand transit sur la période.</p>'}</div>
      <p class="small muted">Barre = période d’influence (orbe ≤ 1,2°), trait blanc = exactitude, ligne dorée = aujourd’hui. Bleu : soutien · rouge : défi · jaune : activation.</p></div>
      <div class="grid2"><div class="card"><h3>Grandes tendances</h3><ul class="sxl">${slow.map(card).join('') || '<p class="muted">Rien de majeur.</p>'}</ul></div>
      <div class="card"><h3>Passages de Mars</h3><ul class="sxl">${fast.map(card).join('') || '<p class="muted">Rien de marquant.</p>'}</ul></div></div>`;
  }

  /* ================= Cycles de vie ================= */
  function tabCycles(p, ch) {
    const cy = EV().lifeCycles(ch); const now = Date.now();
    const next = cy.find((c) => c.ms > now);
    return `<div class="card"><h3>Les grands rendez-vous de la vie ${H('cycles')}</h3><p class="small">Certaines planètes reviennent à des moments précis former des angles avec leur position de naissance. Ces dates marquent souvent des tournants.</p>
      ${next ? `<div class="advice">⏭ Prochain rendez-vous : <b>${next.label}</b> à ${Math.floor(next.age)} ans, le ${fmtD(next.ms)}.</div>` : ''}
      <ol class="tl">${cy.map((c) => `<li class="${c.ms < now ? 'past' : ''} ${c === next ? 'next' : ''}"><div class="tl-a">${Math.floor(c.age)} ans</div><div class="tl-b"><b>${pl(c.key).glyph}︎ ${c.label}</b> <span class="small muted">— ${fmtD(c.ms, { month: 'long', year: 'numeric' })}${c.passes.length > 1 ? ` (${c.passes.length} passages, jusqu’en ${fmtD(c.passes[c.passes.length - 1], { month: 'long', year: 'numeric' })})` : ''}</span><br><span class="small">${c.txt}</span></div></li>`).join('')}</ol></div>`;
  }

  /* ================= Progressions ================= */
  function tabProgressions(p, ch, dateStr) {
    const ms = dateStr ? E().localToUTC(dateStr, '12:00', 'Europe/Paris').ms : Date.now();
    const pr = EV().progressed(ch, ms, App().state.settings.houseSystem);
    const pc = pr.chart; const keys = ['sun', 'moon', 'mercury', 'venus', 'mars'];
    const pm = pc.bodies[1];
    const pmHouse = ch.noTime ? null : E().houseOf(pm.lon, ch.cusps);
    return `<div class="toolbar"><label>Date <input type="date" id="prdate" value="${new Date(ms).toISOString().slice(0, 10)}"></label><span class="small muted">${esc(p.name)} a ${pr.years.toFixed(1).replace('.', ',')} ans à cette date.</span></div>
      <div class="split"><div class="col"><div class="card"><h3>La Lune progressée ${H('progressions')}</h3><div class="row">${C().moonIcon(E().norm(pm.lon - pc.bodies[0].lon), 54)}<p>En ce moment, la Lune progressée de ${esc(p.name)} est en <b>${pm.sign.name}</b>${pmHouse ? `, dans sa maison ${pmHouse}` : ''}. Pendant environ deux ans et demi, ${PS().planetReading({ ...pm, house: null, dignity: null, retro: false }, { noTime: true }, p.name).perso.charAt(0).toLowerCase() + PS().planetReading({ ...pm, house: null, dignity: null, retro: false }, { noTime: true }, p.name).perso.slice(1)}${pmHouse ? ` Les besoins se portent surtout ${PS().HOUSE_P[pmHouse - 1]}.` : ''}</p></div>
        <h4>Prochaines étapes</h4><ul class="plist">${pr.moonSteps.slice(0, 10).map((x) => `<li>☽︎ <span>entre en ${sgn(x.sign)} vers ${fmtD(x.ms, { month: 'long', year: 'numeric' })} <span class="muted small">(${Math.floor(x.age)} ans)</span></span></li>`).join('')}</ul></div></div>
      <div class="col"><div class="card"><h3>Natal / progressé</h3><table class="tbl"><thead><tr><th></th><th>Naissance</th><th>Aujourd’hui (progressé)</th></tr></thead><tbody>${keys.map((k) => { const n = ch.bodies.find((b) => b.key === k), q = pc.bodies.find((b) => b.key === k); return `<tr><td>${n.glyph}︎ ${n.name}</td><td>${sgn(n.signIdx)} <span class="small muted">${E().fmtDeg(n.lon, false)}</span></td><td>${sgn(q.signIdx)} <span class="small muted">${E().fmtDeg(q.lon, false)}</span>${q.signIdx !== n.signIdx ? ' <span class="badge">a changé</span>' : ''}</td></tr>`; }).join('')}${ch.noTime ? '' : ['asc', 'mc'].map((k, i) => `<tr><td>${['Ascendant', 'Milieu du Ciel'][i]}</td><td>${sgn(ch.angles[i].idx)}</td><td>${sgn(pc.angles[i].idx)}</td></tr>`).join('')}</tbody></table>
        <p class="small">${pc.bodies[0].signIdx !== ch.bodies[0].signIdx ? `Le Soleil progressé est passé en <b>${pc.bodies[0].sign.name}</b> : avec l’âge, ${esc(p.name)} a intégré des qualités ${I().signs[pc.bodies[0].sign.key].adj.replace(/([a-zàâçéèêëîïôûù]+e)(?=[,\s]|$)/gi, '$1s')}.` : `Le Soleil progressé est toujours en ${pc.bodies[0].sign.name}.`}</p></div></div></div>`;
  }

  /* ================= Astrocartographie ================= */
  const CITIES = [['Paris', 48.86, 2.35], ['Londres', 51.51, -0.13], ['Madrid', 40.42, -3.7], ['Lisbonne', 38.72, -9.14], ['Rome', 41.9, 12.5], ['Berlin', 52.52, 13.4], ['Amsterdam', 52.37, 4.9], ['Bruxelles', 50.85, 4.35], ['Genève', 46.2, 6.15], ['Barcelone', 41.39, 2.17], ['Athènes', 37.98, 23.73], ['Istanbul', 41.01, 28.98], ['Moscou', 55.76, 37.62], ['Stockholm', 59.33, 18.07], ['Reykjavik', 64.15, -21.94], ['Dublin', 53.35, -6.26], ['Marrakech', 31.63, -7.99], ['Le Caire', 30.04, 31.24], ['Dakar', 14.72, -17.47], ['Abidjan', 5.36, -4.01], ['Nairobi', -1.29, 36.82], ['Le Cap', -33.92, 18.42], ['La Réunion', -21.11, 55.53], ['Dubaï', 25.2, 55.27], ['Bombay', 19.08, 72.88], ['Bangkok', 13.76, 100.5], ['Bali', -8.65, 115.22], ['Singapour', 1.35, 103.82], ['Hong Kong', 22.32, 114.17], ['Tokyo', 35.68, 139.69], ['Séoul', 37.57, 126.98], ['Sydney', -33.87, 151.21], ['Auckland', -36.85, 174.76], ['Tahiti', -17.53, -149.57], ['Honolulu', 21.31, -157.86], ['Los Angeles', 34.05, -118.24], ['San Francisco', 37.77, -122.42], ['Vancouver', 49.28, -123.12], ['Montréal', 45.5, -73.57], ['New York', 40.71, -74.0], ['Miami', 25.76, -80.19], ['Mexico', 19.43, -99.13], ['La Havane', 23.11, -82.37], ['Guadeloupe', 16.24, -61.53], ['Martinique', 14.64, -61.02], ['Bogota', 4.71, -74.07], ['Lima', -12.05, -77.04], ['Rio de Janeiro', -22.91, -43.17], ['Buenos Aires', -34.6, -58.38], ['Santiago', -33.45, -70.67], ['Québec', 46.81, -71.21], ['Édimbourg', 55.95, -3.19], ['Prague', 50.08, 14.44], ['Vienne', 48.21, 16.37], ['Copenhague', 55.68, 12.57], ['Oslo', 59.91, 10.75], ['Nouméa', -22.27, 166.44], ['Kyoto', 35.01, 135.77], ['Pékin', 39.9, 116.4], ['Jérusalem', 31.77, 35.21]];
  const ACTXT = {
    sun: 'reconnaissance, confiance en soi, rayonnement', moon: 'se sentir chez soi, vie de famille, émotions', mercury: 'études, échanges, écriture, commerce', venus: 'amour, beauté, plaisir, harmonie', mars: 'énergie, sport, courage… mais aussi conflits',
    jupiter: 'chance, expansion, opportunités', saturn: 'travail sérieux, responsabilités, parfois lourdeur', uranus: 'changements soudains, liberté, originalité', neptune: 'spiritualité, art, rêve… et illusions', pluto: 'transformations intenses, pouvoir',
  };
  const ANG = { mc: ['MC', 'au zénith : carrière et image publique'], ic: ['FC', 'sous les pieds : foyer, racines, vie intime'], asc: ['AS', 'à l’horizon Est : personnalité, vitalité'], dsc: ['DS', 'à l’horizon Ouest : relations et couple'] };
  const LCOL = { sun: '#e8c25a', moon: '#c9c3e8', mercury: '#9fd3c7', venus: '#f29fc5', mars: '#e66767', jupiter: '#d95926', saturn: '#a3a08f', uranus: '#3987e5', neptune: '#5fb2e8', pluto: '#9085e9' };
  function tabAstro(p, ch) {
    const L = EV().astroLines(ch);
    const X = (lon) => (lon + 180) * 2, Y = (lat) => (90 - lat) * 2;
    const path = (pts) => { let d = '', prev = null; for (const [lo, la] of pts) { const cmd = prev && Math.abs(lo - prev) < 90 ? 'L' : 'M'; d += `${cmd}${X(lo).toFixed(1)},${Y(la).toFixed(1)}`; prev = lo; } return d; };
    let g = `<svg viewBox="0 0 720 300" class="amap" role="img" aria-label="Carte d’astrocartographie"><rect width="720" height="300" fill="#0f1a33"/><g transform="translate(0,-30)"><path d="${root.WORLD_PATH}" transform="scale(2)" fill="#2b3557" stroke="#465385" stroke-width="0.3"/>`;
    for (let lo = -150; lo <= 150; lo += 30) g += `<line x1="${X(lo)}" x2="${X(lo)}" y1="0" y2="360" stroke="#ffffff10"/>`;
    for (const l of L) {
      const c = LCOL[l.key];
      g += `<line x1="${X(l.mc)}" x2="${X(l.mc)}" y1="0" y2="360" stroke="${c}" stroke-width="1.6"><title>${pl(l.key).name} MC</title></line>`;
      g += `<line x1="${X(l.ic)}" x2="${X(l.ic)}" y1="0" y2="360" stroke="${c}" stroke-width="1.2" stroke-dasharray="5 4"><title>${pl(l.key).name} FC</title></line>`;
      g += `<path d="${path(l.asc)}" stroke="${c}" stroke-width="1.4" fill="none" stroke-dasharray="1.5 3" stroke-linecap="round"><title>${pl(l.key).name} AS</title></path><path d="${path(l.dsc)}" stroke="${c}" stroke-width="1.2" fill="none" stroke-dasharray="8 3 2 3"><title>${pl(l.key).name} DS</title></path>`;
      g += `<text x="${X(l.mc) + 3}" y="44" fill="${c}" font-size="11">${pl(l.key).glyph}︎</text>`;
    }
    g += `<circle cx="${X(ch.lon)}" cy="${Y(ch.lat)}" r="4" fill="#fff" stroke="#000"/></g></svg>`;
    // villes proches
    const near = [];
    for (const [nm, la, lo] of CITIES) for (const l of L) {
      const dLon = (a) => Math.abs(((lo - a + 540) % 360) - 180) * Math.cos(la * Math.PI / 180);
      const cand = [['mc', dLon(l.mc)], ['ic', dLon(l.ic)]];
      for (const k of ['asc', 'dsc']) { let best = 99; for (const [x, y] of l[k]) if (Math.abs(y - la) < 2) best = Math.min(best, dLon(x)); cand.push([k, best]); }
      for (const [k, d] of cand) if (d < 3.5) near.push({ city: nm, planet: l.key, ang: k, d });
    }
    const byCity = {}; near.sort((a, b) => a.d - b.d).forEach((n) => { (byCity[n.city] = byCity[n.city] || []).push(n); });
    return `<div class="card"><h3>Où les planètes de ${esc(p.name)} sont-elles puissantes ? ${H('astrocarto')}</h3>${g}
      <div class="legend">${L.map((l) => `<span><i style="background:${LCOL[l.key]}"></i>${pl(l.key).glyph}︎ ${pl(l.key).name}</span>`).join('')}</div>
      <p class="small muted">Trait plein : planète au Milieu du Ciel · tirets : au Fond du Ciel · pointillés : à l’Ascendant · tiret-point : au Descendant. Point blanc : lieu de naissance.</p></div>
      <div class="grid2"><div class="card"><h3>Villes sur les lignes</h3>${Object.keys(byCity).length ? `<ul class="plist">${Object.entries(byCity).slice(0, 25).map(([c, ns]) => `<li><span><b>${c}</b> : ${ns.slice(0, 3).map((n) => `<span style="color:${LCOL[n.planet]}">${pl(n.planet).glyph}︎ ${pl(n.planet).name} ${ANG[n.ang][0]}</span>`).join(', ')}<br><span class="small muted">${ns.slice(0, 2).map((n) => `${pl(n.planet).name} ${ANG[n.ang][1]} → ${ACTXT[n.planet]}`).join(' · ')}</span></span></li>`).join('')}</ul>` : '<p class="muted">Aucune grande ville de la liste n’est sur une ligne.</p>'}</div>
      <div class="card"><h3>Que signifie chaque ligne ?</h3><ul class="plist">${L.map((l) => `<li><span style="color:${LCOL[l.key]}">${pl(l.key).glyph}︎</span><span><b>${pl(l.key).name}</b> : ${ACTXT[l.key]}</span></li>`).join('')}</ul><p class="small muted">Plus on est près d’une ligne (moins de 300 à 500 km), plus l’effet est ressenti en vivant ou voyageant là-bas.</p></div></div>`;
  }

  /* ================= Rectification ================= */
  function tabHeure(p) {
    const ranges = EV().ascendantRanges(p.date, +p.place.lat, +p.place.lon, p.place.tz, App().state.settings.houseSystem);
    const moonChange = new Set(ranges.flatMap((r) => r.moon)).size > 1;
    return `<div class="card"><h3>Quel est l’Ascendant de ${esc(p.name)} ? ${H('ascendant')}</h3><p>Sans heure de naissance, on ne connaît ni l’Ascendant ni les maisons. Le ${App().fmtDate(p.date)} à ${esc(p.place.name)}, l’Ascendant a changé ${ranges.length} fois. Lis les portraits ci-dessous : celui qui ressemble le plus à ${esc(p.name)} donne la tranche horaire probable.</p>
      ${moonChange ? `<div class="notice">☽ La Lune a changé de signe ce jour-là (${[...new Set(ranges.flatMap((r) => r.moon))].map((s) => E().SIGNS[s].name).join(' puis ')}) : choisir l’heure précisera aussi le signe lunaire.</div>` : ''}</div>
      <div class="asr">${ranges.map((r) => { const s = E().SIGNS[r.sign]; const mid = midTime(r.from, r.to); return `<div class="card"><h3 style="color:${C().ELC[s.element]}">${s.glyph}︎ Ascendant ${s.name}</h3><p class="small"><b>Entre ${r.from} et ${r.to}</b>${r.moon.length ? ` · Lune en ${r.moon.map((m) => E().SIGNS[m].name).join('/')}` : ''}</p><p>Au premier abord, ${esc(p.name)} donnerait une impression ${I().signs[s.key].adj}. ${I().signs[s.key].txt}</p><button class="btn sm" data-act="settime" data-id="${p.id}" data-time="${mid}">Choisir cette tranche (${mid})</button></div>`; }).join('')}</div>`;
  }
  const midTime = (a, b) => { const t = (s) => +s.slice(0, 2) * 60 + +s.slice(3); const m = Math.round((t(a) + t(b === '23:59' ? '24:00' : b)) / 2); return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };

  /* ================= Journal ================= */
  const MOODS = ['😞', '😕', '😐', '🙂', '😄'];
  function tabJournal(p) {
    const J = (p.journal || []).slice().sort((a, b) => b.date.localeCompare(a.date));
    const ctx = (d) => { const ms = E().localToUTC(d, '12:00', 'Europe/Paris').ms; const ch = App().chartOf(p); const tr = E().transitsFor(ch, ms, {}); const m = tr.chart.bodies[1]; return { moon: m, phase: tr.chart.moonPhase, top: tr.aspects.filter((a) => a.a !== 'moon')[0] }; };
    let corr = '';
    if (J.length >= 5) {
      const byEl = { feu: [], terre: [], air: [], eau: [] };
      J.forEach((e) => { const c = ctx(e.date); byEl[c.moon.sign.element].push(e.mood); });
      corr = `<div class="card"><h3>Ton humeur selon la Lune ${H('lune')}</h3>${C().hbars(Object.entries(byEl).map(([k, v]) => ({ label: `Lune en ${I().elements[k].name} (${v.length})`, value: v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length + 1) * 10) / 10 : 0, color: C().ELC[k] })), { max: 5, fmt: (v) => v ? v.toFixed(1) + '/5' : '—' })}<p class="small muted">Humeur moyenne des entrées selon l’élément de la Lune du jour.</p></div>`;
    }
    return `<div class="split"><div class="col"><div class="card"><h3>Nouvelle entrée ${H('journal')}</h3>
      <label>Date<input type="date" id="jd" value="${new Date().toISOString().slice(0, 10)}"></label>
      <div class="moods">${MOODS.map((m, i) => `<label><input type="radio" name="jm" value="${i}" ${i === 3 ? 'checked' : ''}><span>${m}</span></label>`).join('')}</div>
      <label>Ce que je ressens, ce qui s’est passé<textarea id="jt" rows="4"></textarea></label>
      <button class="btn primary" data-act="jadd" data-id="${p.id}">Enregistrer</button></div>${corr}</div>
      <div class="col"><div class="card"><h3>Entrées (${J.length})</h3>${J.length ? J.map((e) => { const c = ctx(e.date); return `<div class="je"><div class="je-h"><span class="je-m">${MOODS[e.mood]}</span><b>${App().fmtDate(e.date)}</b><span class="small muted">${C().moonIcon(c.phase, 16)} Lune en ${c.moon.sign.name}${c.top ? ` · ${c.top.an} ${c.top.name.toLowerCase()} ${c.top.bn}` : ''}</span><button class="btn sm danger" data-act="jdel" data-id="${p.id}" data-jid="${e.id}" title="Supprimer">✕</button></div>${e.text ? `<p class="pre">${esc(e.text)}</p>` : ''}</div>`; }).join('') : '<p class="muted">Note ton humeur au fil des jours : Mélastro y associe la Lune et les transits du moment, pour repérer tes cycles.</p>'}</div></div></div>`;
  }

  /* ================= Fiche imprimable ================= */
  function viewFiche(id) {
    const p = App().getP(id); if (!p) return '<div class="card">Profil introuvable.</div>';
    const ch = App().chartOf(p), st = ch.stats;
    const elTot = Object.values(st.el).reduce((a, b) => a + b, 0);
    return `<div class="noprint toolbar"><a class="btn sm" href="#/profil/${p.id}">◀ Retour</a><button class="btn primary" data-act="print">🖨 Imprimer / enregistrer en PDF</button><span class="small muted">Dans la fenêtre d’impression, choisis « Enregistrer au format PDF ».</span></div>
    <article class="fiche"><header class="fh"><div><h1>${esc(p.name)}</h1><p>${App().fmtDate(p.date)}${p.timeUnknown ? ' · heure inconnue' : ' à ' + p.time} · ${esc(p.place.name)}</p></div><div class="fb">✦ Mélastro</div></header>
      <section class="fgrid"><div>${C().wheel(ch)}</div><div>${PS().bigThree(ch, p.name).map((x) => `<h3>${x.title}</h3><p>${x.txt}</p>`).join('')}
        <h3>Dominantes</h3><p>Élément : <b>${I().elements[st.domEl[0][0]].name}</b> · Mode : <b>${I().modes[st.domMo[0][0]].name}</b> · Planète : <b>${pl(st.ranking[0][0]).name}</b> (type ${I().dominant[st.ranking[0][0]].type.toLowerCase()})</p>
        ${C().hbars(['feu', 'terre', 'air', 'eau'].map((e) => ({ label: I().elements[e].name, value: Math.round(st.el[e] / elTot * 100), color: C().ELC[e] })), { max: 100, fmt: (v) => v + ' %' })}</div></section>
      <section><h2>Positions</h2><table class="tbl"><tbody>${ch.bodies.map((b) => `<tr><td>${b.glyph}︎ ${b.name}</td><td>${b.sign.name} ${E().fmtDeg(b.lon, false)}</td><td>${b.house ? 'M' + b.house : ''}</td><td>${b.retro && pl(b.key).body ? '℞' : ''}${b.dignity ? ' ' + b.dignity.label : ''}</td></tr>`).join('')}${ch.noTime ? '' : `<tr><td>Ascendant</td><td>${ch.angles[0].sign.name} ${E().fmtDeg(ch.angles[0].lon, false)}</td><td></td><td></td></tr><tr><td>Milieu du Ciel</td><td>${ch.angles[1].sign.name} ${E().fmtDeg(ch.angles[1].lon, false)}</td><td></td><td></td></tr>`}</tbody></table></section>
      <section><h2>Lecture planète par planète</h2>${ch.bodies.filter((b) => b.key !== 'snode').map((b) => { const r = PS().planetReading(b, ch, p.name); return `<h4>${b.glyph}︎ ${b.name} en ${b.sign.name}${b.house ? ', maison ' + b.house : ''}</h4><p>${r.perso}</p>`; }).join('')}</section>
      <section><h2>Aspects majeurs</h2>${ch.aspects.filter((a) => a.major).slice(0, 16).map((a) => `<p><b>${a.an} ${a.name.toLowerCase()} ${a.bn}</b> — ${PS().aspectReading(a, p.name)}</p>`).join('')}</section>
      <footer class="small">Thème calculé par Mélastro · zodiaque tropical · maisons ${E().HOUSE_SYSTEMS[ch.houseSystem]}</footer></article>`;
  }

  /* ================= Affiche du ciel ================= */
  function posterSvg(p) {
    const ch = App().chartOf(p);
    const view = E().skyView(ch.ms, ch.lat, ch.lon);
    const sm = C().skyMap(view, { lines: true, names: false, night: true });
    const inner = sm.svg.replace('<svg ', '<svg x="150" y="250" width="900" height="900" ').replace(/var\(--ink\)/g, '#efeaff').replace(/var\(--gold\)/g, '#e8c25a');
    const css = '.sn{fill:#dfe6ff;font-size:10px;opacity:.8;font-family:Georgia,serif}.cn{fill:#9fb3ff;font-size:10px}.sp{fill:#ffd9e8;font-size:12px;font-weight:600;font-family:Georgia,serif;paint-order:stroke;stroke:#0b0a1d;stroke-width:3px}.card{fill:#e8c25a;font-weight:700;font-size:15px;font-family:Georgia,serif}';
    const dt = new Date(ch.ms).toLocaleString('fr-FR', { timeZone: p.place.tz || 'Europe/Paris', dateStyle: 'full', timeStyle: p.timeUnknown ? undefined : 'short' });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1600" width="1200" height="1600"><style>${css}</style><defs><radialGradient id="pbg" cx="50%" cy="40%" r="80%"><stop offset="0" stop-color="#1d1a44"/><stop offset="1" stop-color="#07061a"/></radialGradient></defs>
      <rect width="1200" height="1600" fill="url(#pbg)"/><rect x="40" y="40" width="1120" height="1520" fill="none" stroke="#e8c25a" stroke-opacity=".5" stroke-width="2"/>
      <text x="600" y="150" text-anchor="middle" fill="#e8c25a" font-family="Georgia,serif" font-size="30" letter-spacing="10">LE CIEL DU JOUR OÙ EST NÉ·E</text>
      <text x="600" y="215" text-anchor="middle" fill="#f3e9c6" font-family="Georgia,serif" font-size="64" font-style="italic">${esc(p.name)}</text>
      ${inner}
      <text x="600" y="1290" text-anchor="middle" fill="#efeaff" font-family="Georgia,serif" font-size="34">${esc(dt)}</text>
      <text x="600" y="1345" text-anchor="middle" fill="#c4bfe0" font-family="Georgia,serif" font-size="28">${esc(p.place.name)}</text>
      <text x="600" y="1390" text-anchor="middle" fill="#8a86a8" font-family="Georgia,serif" font-size="22">${Math.abs(ch.lat).toFixed(4)}° ${ch.lat >= 0 ? 'N' : 'S'} · ${Math.abs(ch.lon).toFixed(4)}° ${ch.lon >= 0 ? 'E' : 'O'}</text>
      <text x="600" y="1460" text-anchor="middle" fill="#e8c25a" font-family="Georgia,serif" font-size="26">Soleil ${ch.bodies[0].sign.name} · Lune ${ch.bodies[1].sign.name}${ch.noTime ? '' : ' · Ascendant ' + ch.angles[0].sign.name}</text>
      <text x="600" y="1525" text-anchor="middle" fill="#5d5a80" font-family="Georgia,serif" font-size="18" letter-spacing="4">MÉLASTRO</text></svg>`;
  }
  function viewAffiche(id) {
    const p = App().getP(id); if (!p) return '<div class="card">Profil introuvable.</div>';
    return `<div class="noprint toolbar"><a class="btn sm" href="#/profil/${p.id}">◀ Retour</a><button class="btn primary" data-act="posterpng" data-id="${p.id}">⬇️ Télécharger l’image (PNG)</button><button class="btn" data-act="print">🖨 Imprimer</button></div>
      <div class="poster">${posterSvg(p)}</div><p class="noprint small muted">Le vrai ciel au-dessus du lieu de naissance, au moment de la naissance. Une jolie idée de cadeau à imprimer en A3.</p>`;
  }
  function posterPng(id) {
    const p = App().getP(id); const svg = posterSvg(p);
    const img = new Image(); const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    img.onload = () => { const cv = document.createElement('canvas'); cv.width = 2400; cv.height = 3200; const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0, 2400, 3200); URL.revokeObjectURL(url); cv.toBlob((b) => shareOrDownload(new File([b], `ciel-${slug(p.name)}.png`, { type: 'image/png' }))); };
    img.src = url;
  }
  const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  async function shareOrDownload(file) {
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: file.name }); return true; } catch (e) { if (e.name === 'AbortError') return false; } }
    const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); return true;
  }

  /* ================= Synastrie de groupe ================= */
  function viewGroupe(ids) {
    const P = App().state.profiles; const sel = (ids || '').split(',').filter((x) => App().getP(x));
    const pick = `<section class="hero"><div><h1>Synastrie de groupe ${H('synastrie')}</h1><p class="sub">Famille, amis, équipe : qui s’entend le mieux, et quelle énergie manque au groupe ?</p></div><a class="btn sm" href="#/synastrie">⚭ Comparer un duo</a></section>
      <div class="card"><div class="chips">${P.map((p) => `<label class="chip pick"><input type="checkbox" value="${p.id}" ${sel.includes(p.id) ? 'checked' : ''}> ${esc(p.name)}</label>`).join('')}</div><button class="btn primary" data-act="groupgo">Analyser le groupe</button></div>`;
    if (sel.length < 3) return pick + '<p class="muted">Choisis au moins 3 personnes.</p>';
    const ps = sel.map((id) => App().getP(id)), chs = ps.map((p) => App().chartOf(p));
    const M = ps.map((_, i) => ps.map((__, j) => i === j ? null : E().synastry(chs[i], chs[j]).score));
    const avg = ps.map((_, i) => M[i].filter((x) => x !== null).reduce((a, b) => a + b, 0) / (ps.length - 1));
    const pairs = []; for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) pairs.push([i, j, M[i][j]]);
    pairs.sort((a, b) => b[2] - a[2]);
    const el = { feu: 0, terre: 0, air: 0, eau: 0 }; chs.forEach((c) => { const t = Object.values(c.stats.el).reduce((a, b) => a + b, 0); for (const k in el) el[k] += c.stats.el[k] / t / ps.length; });
    const elS = Object.entries(el).sort((a, b) => b[1] - a[1]);
    const col = (v) => `hsl(${248}, ${40 + v * 0.4}%, ${14 + v * 0.42}%)`;
    const center = avg.indexOf(Math.max(...avg));
    return pick + `<div class="grid2"><div class="card span2"><h3>Matrice des affinités ${H('score')}</h3><div class="scroll"><table class="mx"><thead><tr><th></th>${ps.map((p) => `<th>${esc(p.name)}</th>`).join('')}<th>Moyenne</th></tr></thead><tbody>${ps.map((p, i) => `<tr><th>${esc(p.name)}</th>${M[i].map((v, j) => v === null ? '<td class="self">—</td>' : `<td style="background:${col(v)}"><a href="#/synastrie/${ps[i].id}/${ps[j].id}">${v}</a></td>`).join('')}<td><b>${Math.round(avg[i])}</b></td></tr>`).join('')}</tbody></table></div><p class="small muted">Clique sur une case pour voir la synastrie détaillée du duo.</p></div>
      <div class="card"><h3>Les duos</h3><p>🥇 <b>${esc(ps[pairs[0][0]].name)} & ${esc(ps[pairs[0][1]].name)}</b> forment le duo le plus harmonieux (${pairs[0][2]}/100).</p><p>⚡ <b>${esc(ps[pairs[pairs.length - 1][0]].name)} & ${esc(ps[pairs[pairs.length - 1][1]].name)}</b> ont le lien le plus tendu (${pairs[pairs.length - 1][2]}/100) : souvent le plus stimulant… ou le plus électrique.</p><p>🧲 <b>${esc(ps[center].name)}</b> est le « liant » du groupe : en moyenne la meilleure entente avec tout le monde.</p></div>
      <div class="card"><h3>L’énergie du groupe ${H('elements')}</h3>${C().hbars(['feu', 'terre', 'air', 'eau'].map((e) => ({ label: I().elements[e].name, value: Math.round(el[e] * 100), color: C().ELC[e] })), { max: 100, fmt: (v) => v + ' %' })}<p class="small">Le groupe est porté par l’élément <b>${I().elements[elS[0][0]].name}</b> (${I().elements[elS[0][0]].txt}). ${elS[3][1] < 0.17 ? `L’élément <b>${I().elements[elS[3][0]].name}</b> manque : ${I().elements[elS[3][0]].txt} sont moins naturels ensemble.` : 'Les éléments sont plutôt bien répartis.'}</p>
      <ul class="plist">${ps.map((p, i) => `<li>${App().avatar(p)}<span><b>${esc(p.name)}</b> apporte surtout l’élément ${I().elements[chs[i].stats.domEl[0][0]].name} (type ${I().dominant[chs[i].stats.ranking[0][0]].type.toLowerCase()})</span></li>`).join('')}</ul></div></div>`;
  }

  /* ================= Export .ics ================= */
  function icsExport() {
    const now = Date.now(), P = App().state.profiles; const ev = [];
    const stamp = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    const dday = (ms) => new Date(ms).toISOString().slice(0, 10).replace(/-/g, '');
    const add = (o) => ev.push(o);
    let t = root.Astronomy.MakeTime(new Date(now));
    for (let i = 0; i < 52; i++) { const r = root.Astronomy.SearchMoonQuarter(t); if (r.quarter === 0 || r.quarter === 2) { const ms = r.time.date.getTime(); add({ s: ms, e: ms + 3600000, sum: `${r.quarter ? '🌕 Pleine Lune' : '🌑 Nouvelle Lune'} en ${E().signOf(EV().lon('moon', ms)).sign.name}`, alarm: true }); } t = r.time.AddDays(1); if (r.time.date.getTime() > now + 366 * DAY) break; }
    for (const k of ['mercury', 'venus', 'mars']) for (const r of EV().retroPeriods(k, now, 366)) add({ allday: true, s: r.start, e: r.end + DAY, sum: `${pl(k).name} rétrograde`, alarm: true });
    for (const e of EV().eclipses(now, 4)) add({ s: e.ms, e: e.ms + 3600000, sum: `Éclipse ${e.type} ${EV().KIND[e.kind] || ''} en ${E().signOf(e.lon).sign.name}`, alarm: true });
    for (const p of P) add({ allday: true, s: Date.UTC(+p.date.slice(0, 4), +p.date.slice(5, 7) - 1, +p.date.slice(8, 10)), e: Date.UTC(+p.date.slice(0, 4), +p.date.slice(5, 7) - 1, +p.date.slice(8, 10)) + DAY, sum: `🎂 Anniversaire de ${p.name}`, rrule: 'FREQ=YEARLY', alarm: true });
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Melastro//FR', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Mélastro'];
    ev.forEach((x, i) => { lines.push('BEGIN:VEVENT', `UID:melastro-${i}-${x.s}@ch4rybd3.github.io`, `DTSTAMP:${stamp(now)}`, x.allday ? `DTSTART;VALUE=DATE:${dday(x.s)}` : `DTSTART:${stamp(x.s)}`, x.allday ? `DTEND;VALUE=DATE:${dday(x.e)}` : `DTEND:${stamp(x.e)}`, `SUMMARY:${x.sum}`); if (x.rrule) lines.push(`RRULE:${x.rrule}`); if (x.alarm) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${x.sum}`, x.allday ? 'TRIGGER:PT9H' : 'TRIGGER:-PT2H', 'END:VALARM'); lines.push('END:VEVENT'); });
    lines.push('END:VCALENDAR');
    shareOrDownload(new File([lines.join('\r\n')], 'melastro-agenda.ics', { type: 'text/calendar' }));
    App().toast(`${ev.length} événements exportés`);
  }

  /* ================= Rappels du jour ================= */
  function reminders() {
    const now = Date.now(), P = App().state.profiles; const out = [];
    const A = root.Astronomy;
    const ph = A.MoonPhase(new Date()), moonS = E().signOf(EV().lon('moon', now)).sign;
    out.push(`${root.Charts.moonIcon(ph, 20)} Lune en <b>${moonS.name}</b> (${E().moonPhaseName(ph).toLowerCase()})`);
    const q = A.SearchMoonQuarter(A.MakeTime(new Date(now - DAY / 2)));
    if ((q.quarter === 0 || q.quarter === 2) && q.time.date.getTime() - now < 2 * DAY) out.push(`${q.quarter ? '🌕 Pleine' : '🌑 Nouvelle'} Lune ${q.time.date.getTime() - now < DAY ? 'aujourd’hui' : 'demain'}`);
    const sp = EV().speed('mercury', now); if (sp < 0) out.push('☿ Mercure est rétrograde');
    for (const p of P) { const d = Math.round(App().nextBday(p) / DAY); if (d <= 7) out.push(`🎂 ${d === 0 ? `C’est l’anniversaire de <b>${esc(p.name)}</b> !` : `Anniversaire de <b>${esc(p.name)}</b> dans ${d} jour${d > 1 ? 's' : ''}`} <a href="#/profil/${p.id}/revolution">sa révolution solaire</a>`); }
    return `<div class="remind">${out.map((x) => `<span>${x}</span>`).join('')}<a href="#/ciel/calendrier" class="small">Calendrier →</a></div>`;
  }
  function init() {
    // notification système une fois par jour (si autorisée)
    try {
      const s = App().state.settings, today = new Date().toISOString().slice(0, 10);
      if (s.notify && 'Notification' in window && Notification.permission === 'granted' && s.lastNotify !== today) {
        const P = s && App().state.profiles; const b = P.filter((p) => App().nextBday(p) < DAY);
        const ph = root.Astronomy.MoonPhase(new Date());
        new Notification('Mélastro', { body: `Lune en ${E().signOf(EV().lon('moon', Date.now())).sign.name} (${E().moonPhaseName(ph).toLowerCase()})${b.length ? ' · Anniversaire : ' + b.map((p) => p.name).join(', ') : ''}`, icon: 'icons/icon-192.png' });
        s.lastNotify = today; App().save();
      }
    } catch (e) { /* */ }
  }

  /* ================= Réglages ================= */
  const THEMES = [['nuit', 'Nuit étoilée'], ['aurore', 'Aurore'], ['ocean', 'Océan'], ['clair', 'Clair']];
  function settingsHtml() {
    const s = App().state.settings;
    return `<div class="card"><h3>Apparence</h3><div class="themes">${THEMES.map(([k, l]) => `<button class="th th-${k} ${((s.theme || 'nuit') === k) ? 'on' : ''}" data-act="theme" data-theme="${k}"><span></span>${l}</button>`).join('')}</div></div>
      <div class="card"><h3>Rappels</h3><p class="small">Pour de vrais rappels sur ton téléphone (pleines et nouvelles lunes, rétrogrades, éclipses, anniversaires), ajoute le calendrier Mélastro à ton agenda :</p><button class="btn" data-act="ics">📅 Exporter vers mon agenda (.ics)</button>
        <label class="chk"><input type="checkbox" id="notif" ${s.notify ? 'checked' : ''}> Notification du jour à l’ouverture de l’app</label><p class="small muted">Sur iPhone, les notifications ne fonctionnent que si Mélastro est installée sur l’écran d’accueil.</p></div>`;
  }
  function afterSettings() {
    const n = $('#notif'); if (n) n.onchange = async () => { const s = App().state.settings; if (n.checked && 'Notification' in window) { const r = await Notification.requestPermission(); s.notify = r === 'granted'; if (!s.notify) { n.checked = false; App().toast('Notifications refusées par le navigateur'); } } else s.notify = false; App().save(); };
  }

  /* ================= Actions ================= */
  function act(a, b) {
    if (a === 'print') { window.print(); return true; }
    if (a === 'posterpng') { posterPng(b.dataset.id); return true; }
    if (a === 'ics') { icsExport(); return true; }
    if (a === 'theme') { App().state.settings.theme = b.dataset.theme; document.documentElement.dataset.theme = b.dataset.theme; App().save(); App().route(); return true; }
    if (a === 'cloud') { const st = App().state; const f = new File([JSON.stringify({ app: 'Mélastro', exportedAt: new Date().toISOString(), profiles: st.profiles }, null, 2)], `melastro-carnet-${new Date().toISOString().slice(0, 10)}.json`, { type: 'application/json' }); shareOrDownload(f).then((ok) => { if (ok) { st.settings.lastBackup = Date.now(); App().save(); App().toast('Choisis « Enregistrer dans Fichiers » → iCloud Drive (ou Google Drive)'); } }); return true; }
    if (a === 'groupgo') { const ids = [...document.querySelectorAll('.pick input:checked')].map((x) => x.value); location.hash = '#/groupe/' + ids.join(','); return true; }
    if (a === 'settime') { const p = App().getP(b.dataset.id); if (confirm(`Enregistrer ${b.dataset.time} comme heure de naissance probable de ${p.name} ? (Tu pourras la modifier ensuite.)`)) { p.time = b.dataset.time; p.timeUnknown = false; p.notes = ((p.notes || '') + `\nHeure estimée par rectification (${b.dataset.time}).`).trim(); p.updatedAt = Date.now(); App().save(); location.hash = '#/profil/' + p.id; } return true; }
    if (a === 'jadd') { const p = App().getP(b.dataset.id); const m = document.querySelector('input[name=jm]:checked'); (p.journal = p.journal || []).push({ id: Date.now().toString(36), date: $('#jd').value, mood: +(m ? m.value : 3), text: $('#jt').value.trim() }); App().save(); App().route(); App().toast('Entrée ajoutée'); return true; }
    if (a === 'jdel') { const p = App().getP(b.dataset.id); if (confirm('Supprimer cette entrée ?')) { p.journal = (p.journal || []).filter((e) => e.id !== b.dataset.jid); App().save(); App().route(); } return true; }
    return false;
  }
  function afterProfil(id, tab) {
    const bindDate = (sel, t) => { const d = $(sel); if (d) d.onchange = () => { location.hash = `#/profil/${id}/${t}/${d.value}`; }; };
    if (tab === 'horoscope') bindDate('#hodate', 'horoscope');
    if (tab === 'progressions') bindDate('#prdate', 'progressions');
  }

  const F = root.Features = root.Features || { views: {}, ptabs: {}, after: {} };
  Object.assign(F.views, { fiche: viewFiche, affiche: viewAffiche, groupe: viewGroupe });
  Object.assign(F.ptabs, { horoscope: tabHoroscope, agenda: tabAgenda, cycles: tabCycles, progressions: tabProgressions, astrocarto: tabAstro, heure: (p) => tabHeure(p), journal: (p) => tabJournal(p) });
  Object.assign(F, { ciel, reminders, init, settingsHtml, afterSettings, act, afterProfil, horoscope });
})(window);
