/* Mélastro — application */
(function () {
  'use strict';
  const E = window.Engine, C = window.Charts, I = window.Interp, esc = C.esc, H = window.Help.H, PS = window.Perso;
  const $ = (s, el = document) => el.querySelector(s);
  const KEY = 'melastro.v1';
  const VERSION = '1.1.0';

  /* ---------------- État & stockage ---------------- */
  const defaults = { houseSystem: 'placidus', nodeType: 'true', minor: true, skyLines: true, skyNames: true, realistic: false, lastBackup: null };
  let state = load();
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.profiles) return { profiles: s.profiles, settings: { ...defaults, ...(s.settings || {}) } }; } catch (e) { /* */ }
    return { profiles: [], settings: { ...defaults } };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { toast('Impossible d’enregistrer : stockage plein ou désactivé.'); } }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const getP = (id) => state.profiles.find((p) => p.id === id);

  const chartCache = new Map();
  function chartOf(p) {
    const k = p.id + '|' + p.updatedAt + '|' + state.settings.houseSystem + '|' + state.settings.nodeType;
    if (chartCache.has(k)) return chartCache.get(k);
    const t = E.localToUTC(p.date, p.timeUnknown ? '12:00' : p.time, p.place.tz, p.tzOverride);
    const ch = E.calcChart({ ms: t.ms, lat: +p.place.lat, lon: +p.place.lon, houseSystem: state.settings.houseSystem, nodeType: state.settings.nodeType, noTime: !!p.timeUnknown });
    ch.offsetMin = t.offsetMin; ch.ambiguous = t.ambiguous;
    if (!state.settings.minor) ch.aspects = ch.aspects.filter((a) => a.major);
    chartCache.set(k, ch);
    return ch;
  }

  /* ---------------- Utilitaires UI ---------------- */
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 3200); }
  const fmtDate = (d) => { const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}`; };
  const fmtDT = (ms, tz) => new Date(ms).toLocaleString('fr-FR', { timeZone: tz || 'Europe/Paris', dateStyle: 'long', timeStyle: 'short' });
  const age = (d) => { const b = new Date(d), n = new Date(); let a = n.getFullYear() - b.getFullYear(); if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--; return a; };
  const sg = (s) => `<span class="gl" style="color:${C.ELC[s.element]}">${s.glyph}︎</span>`;
  const pct = (v, tot) => Math.round((v / (tot || 1)) * 100);
  function avatar(p) { const ch = chartOf(p); const s = ch.bodies[0].sign; return `<div class="av" style="--c:${p.color || C.ELC[s.element]}">${s.glyph}︎</div>`; }

  /* ---------------- Routeur ---------------- */
  const views = { carnet: viewCarnet, profil: viewProfil, synastrie: viewSyn, ciel: viewSky, stats: viewStats, reglages: viewSettings };
  function route() {
    const parts = (location.hash.replace(/^#\/?/, '') || 'carnet').split('/').map(decodeURIComponent);
    const v = views[parts[0]] ? parts[0] : 'carnet';
    document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('on', a.dataset.v === v));
    const main = $('#main');
    try { main.innerHTML = views[v](...parts.slice(1)); } catch (e) { console.error(e); main.innerHTML = `<div class="card"><h2>Oups</h2><p>Une erreur est survenue : ${esc(e.message)}</p></div>`; }
    main.scrollTop = 0; window.scrollTo(0, 0);
    (afterRender[v] || (() => {}))(...parts.slice(1));
  }
  const afterRender = {};
  window.addEventListener('hashchange', route);

  /* ================= CARNET ================= */
  let carnetFilter = { q: '', sort: 'name', tag: '' };
  function viewCarnet() {
    const P = state.profiles;
    const tags = [...new Set(P.flatMap((p) => p.tags || []))].sort();
    let list = P.filter((p) => (!carnetFilter.q || (p.name + ' ' + (p.place.name || '') + ' ' + (p.notes || '')).toLowerCase().includes(carnetFilter.q.toLowerCase())) && (!carnetFilter.tag || (p.tags || []).includes(carnetFilter.tag)));
    const sorters = { name: (a, b) => a.name.localeCompare(b.name, 'fr'), date: (a, b) => a.date.localeCompare(b.date), sign: (a, b) => chartOf(a).bodies[0].lon - chartOf(b).bodies[0].lon || a.name.localeCompare(b.name), recent: (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0), birthday: (a, b) => nextBday(a) - nextBday(b) };
    list.sort(sorters[carnetFilter.sort] || sorters.name);
    const backupWarn = P.length && (!state.settings.lastBackup || Date.now() - state.settings.lastBackup > 30 * 86400000);
    return `
    <section class="hero">
      <div><h1>Carnet des thèmes</h1><p class="sub">${P.length ? `${P.length} profil${P.length > 1 ? 's' : ''} enregistré${P.length > 1 ? 's' : ''}` : 'Aucun profil pour l’instant'}</p></div>
      <button class="btn primary" data-act="new">＋ Nouveau profil</button>
    </section>
    ${backupWarn ? `<div class="notice">💾 Pense à sauvegarder ton carnet (il est stocké uniquement sur cet appareil). <button class="btn sm" data-act="export">Exporter maintenant</button></div>` : ''}
    ${P.length ? `<div class="toolbar">
      <input type="search" id="q" placeholder="Rechercher un nom, un lieu, une note…" value="${esc(carnetFilter.q)}">
      <select id="sort"><option value="name">Nom</option><option value="date">Date de naissance</option><option value="sign">Signe solaire</option><option value="birthday">Prochain anniversaire</option><option value="recent">Modifié récemment</option></select>
      ${tags.length ? `<select id="tagf"><option value="">Toutes les étiquettes</option>${tags.map((t) => `<option ${t === carnetFilter.tag ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>` : ''}
    </div>` : ''}
    <div class="grid-cards">${list.map(cardProfile).join('') || (P.length ? '<p class="muted">Aucun résultat.</p>' : emptyState())}</div>`;
  }
  function nextBday(p) { const n = new Date(); n.setHours(0, 0, 0, 0); const [, m, d] = p.date.split('-').map(Number); let b = new Date(n.getFullYear(), m - 1, d); if (b < n) b = new Date(n.getFullYear() + 1, m - 1, d); return b - n; }
  function emptyState() {
    return `<div class="empty card"><div class="big">✦</div><h2>Bienvenue dans Mélastro</h2><p>Ajoute un premier profil avec sa date, son heure et son lieu de naissance : Mélastro calcule le thème complet — signe, ascendant, maisons, aspects, carte du ciel — et le garde dans ton carnet.</p><div class="row"><button class="btn primary" data-act="new">Créer un profil</button><button class="btn" data-act="demo">Voir un exemple</button><button class="btn" data-act="import">Importer un carnet</button></div></div>`;
  }
  function cardProfile(p) {
    const ch = chartOf(p); const s = ch.bodies[0].sign, m = ch.bodies[1].sign, a = ch.angles[0].sign;
    return `<a class="pcard" href="#/profil/${p.id}">
      ${avatar(p)}
      <div class="pc-b"><div class="pc-n">${esc(p.name)}</div><div class="pc-d">${fmtDate(p.date)}${p.timeUnknown ? '' : ' · ' + p.time} · ${esc(p.place.name || '')}</div>
      <div class="pc-t"><span title="Soleil">☉︎ ${sg(s)} ${s.name}</span><span title="Lune">☽︎ ${sg(m)} ${m.name}</span>${p.timeUnknown ? '' : `<span title="Ascendant">AS ${sg(a)} ${a.name}</span>`}</div>
      ${(p.tags || []).length ? `<div class="tags">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}</div></a>`;
  }
  afterRender.carnet = () => {
    const q = $('#q'); if (q) { q.oninput = () => { carnetFilter.q = q.value; const pos = q.selectionStart; route(); const nq = $('#q'); nq.focus(); nq.setSelectionRange(pos, pos); }; }
    const so = $('#sort'); if (so) { so.value = carnetFilter.sort; so.onchange = () => { carnetFilter.sort = so.value; route(); }; }
    const tf = $('#tagf'); if (tf) tf.onchange = () => { carnetFilter.tag = tf.value; route(); };
  };

  /* ---------------- Formulaire profil ---------------- */
  function openForm(p) {
    const isNew = !p; p = p || { name: '', date: '', time: '', timeUnknown: false, place: { name: '', lat: '', lon: '', tz: 'Europe/Paris' }, tzOverride: '', notes: '', tags: [], color: '' };
    const dlg = $('#dlg');
    dlg.innerHTML = `<form method="dialog" class="form" id="pf" novalidate>
      <h2>${isNew ? 'Nouveau profil' : 'Modifier le profil'}</h2>
      <label>Prénom / nom<input name="name" required value="${esc(p.name)}" autocomplete="off"></label>
      <div class="two"><label>Date de naissance<input type="date" name="date" required value="${esc(p.date)}" min="1800-01-01" max="2100-12-31"></label>
      <label>Heure (locale)<input type="time" name="time" value="${esc(p.time)}" ${p.timeUnknown ? 'disabled' : ''}></label></div>
      <label class="chk"><input type="checkbox" name="timeUnknown" ${p.timeUnknown ? 'checked' : ''}> Heure inconnue (thème calculé à midi, sans maisons ni ascendant)</label>
      <label>Lieu de naissance<div class="placebox"><input name="placeq" placeholder="Tape une ville…" value="${esc(p.place.name)}" autocomplete="off"><div id="placeres" class="placeres"></div></div></label>
      <div class="placeinfo" id="placeinfo">${p.place.lat !== '' ? placeInfo(p.place) : '<span class="muted">Choisis une ville dans la liste.</span>'}</div>
      <details ${p.tzOverride !== '' && p.tzOverride !== null && p.tzOverride !== undefined ? 'open' : ''}><summary>Réglages avancés (coordonnées, fuseau)</summary>
        <div class="three"><label>Latitude<input name="lat" type="number" step="any" value="${esc(p.place.lat)}"></label><label>Longitude<input name="lon" type="number" step="any" value="${esc(p.place.lon)}"></label><label>Fuseau IANA<input name="tz" value="${esc(p.place.tz || '')}" placeholder="Europe/Paris"></label></div>
        <label>Décalage UTC forcé (heures, ex. 1 ou -5) — laisse vide pour utiliser le fuseau historique<input name="tzOverride" type="number" step="any" value="${esc(p.tzOverride ?? '')}"></label>
      </details>
      <label>Étiquettes (séparées par des virgules)<input name="tags" value="${esc((p.tags || []).join(', '))}" placeholder="famille, amis, célébrités…"></label>
      <label>Notes<textarea name="notes" rows="3">${esc(p.notes || '')}</textarea></label>
      <div class="row end">${isNew ? '' : '<button type="button" class="btn danger" id="pfdel">Supprimer</button>'}<span class="grow"></span><button type="button" class="btn" value="cancel" id="pfcancel">Annuler</button><button class="btn primary" value="ok">Enregistrer</button></div>
    </form>`;
    dlg.showModal();
    const f = $('#pf');
    f.timeUnknown.onchange = () => (f.time.disabled = f.timeUnknown.checked);
    $('#pfcancel').onclick = () => dlg.close();
    if (!isNew) $('#pfdel').onclick = () => { if (confirm(`Supprimer définitivement « ${p.name} » ?`)) { state.profiles = state.profiles.filter((x) => x.id !== p.id); save(); dlg.close(); location.hash = '#/carnet'; route(); toast('Profil supprimé'); } };
    let timer;
    f.placeq.oninput = () => { clearTimeout(timer); timer = setTimeout(() => searchPlace(f.placeq.value, f), 300); };
    f.onsubmit = (ev) => {
      ev.preventDefault();
      if (!f.name.value.trim()) { toast('Indique un prénom ou un nom.'); f.name.focus(); return; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date.value)) { toast('Indique une date de naissance valide.'); f.date.focus(); return; }
      const lat = parseFloat(String(f.lat.value).replace(',', '.')), lon = parseFloat(String(f.lon.value).replace(',', '.'));
      if (Math.abs(lat) > 90 || Math.abs(lon) > 180) { toast('Coordonnées hors limites.'); return; }
      if (isNaN(lat) || isNaN(lon)) { toast('Choisis un lieu dans la liste ou saisis les coordonnées.'); return; }
      if (!f.timeUnknown.checked && !f.time.value) { toast('Indique l’heure de naissance ou coche « Heure inconnue ».'); return; }
      const tz = f.tz.value.trim();
      if (tz) { try { new Intl.DateTimeFormat('fr', { timeZone: tz }); } catch (e) { toast('Fuseau horaire inconnu : ' + tz); return; } }
      const data = { name: f.name.value.trim(), date: f.date.value, time: f.time.value, timeUnknown: f.timeUnknown.checked, place: { name: f.placeq.value.trim(), lat, lon, tz: tz || null }, tzOverride: f.tzOverride.value === '' || isNaN(parseFloat(f.tzOverride.value)) ? '' : parseFloat(f.tzOverride.value), notes: f.notes.value, tags: f.tags.value.split(',').map((s) => s.trim()).filter(Boolean), updatedAt: Date.now() };
      if (isNew) { const np = { id: uid(), createdAt: Date.now(), ...data }; state.profiles.push(np); save(); dlg.close(); location.hash = '#/profil/' + np.id; }
      else { Object.assign(p, data); save(); dlg.close(); route(); }
      toast('Profil enregistré ✓');
    };
  }
  function placeInfo(pl) { return `📍 ${(+pl.lat).toFixed(4)}°, ${(+pl.lon).toFixed(4)}° · fuseau ${esc(pl.tz || '—')}`; }
  async function searchPlace(q, f) {
    const box = $('#placeres'); if (!q || q.length < 2) { box.innerHTML = ''; return; }
    let res = [];
    try {
      const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=fr&format=json`);
      const j = await r.json(); res = (j.results || []).map((x) => ({ name: x.name, sub: [x.admin2, x.admin1, x.country].filter(Boolean).join(', '), lat: x.latitude, lon: x.longitude, tz: x.timezone }));
    } catch (e) { res = OFFLINE_CITIES.filter((c) => c[0].toLowerCase().startsWith(q.toLowerCase())).map((c) => ({ name: c[0], sub: 'France (hors ligne)', lat: c[1], lon: c[2], tz: 'Europe/Paris' })); }
    box.innerHTML = res.length ? res.map((x, i) => `<button type="button" data-i="${i}">${esc(x.name)} <small>${esc(x.sub)}</small></button>`).join('') : '<div class="muted pad">Aucun lieu trouvé</div>';
    box.querySelectorAll('button').forEach((b) => (b.onclick = () => {
      const x = res[+b.dataset.i]; f.placeq.value = x.name + (x.sub ? ' (' + x.sub.split(', ').pop() + ')' : ''); f.lat.value = x.lat; f.lon.value = x.lon; f.tz.value = x.tz || ''; box.innerHTML = ''; $('#placeinfo').innerHTML = placeInfo(x);
    }));
  }
  const OFFLINE_CITIES = [['Paris', 48.8566, 2.3522], ['Marseille', 43.2965, 5.3698], ['Lyon', 45.764, 4.8357], ['Toulouse', 43.6047, 1.4442], ['Nice', 43.7102, 7.262], ['Nantes', 47.2184, -1.5536], ['Strasbourg', 48.5734, 7.7521], ['Montpellier', 43.6108, 3.8767], ['Bordeaux', 44.8378, -0.5792], ['Lille', 50.6292, 3.0573], ['Rennes', 48.1173, -1.6778], ['Reims', 49.2583, 4.0317], ['Le Havre', 49.4944, 0.1079], ['Saint-Étienne', 45.4397, 4.3872], ['Toulon', 43.1242, 5.928], ['Grenoble', 45.1885, 5.7245], ['Dijon', 47.322, 5.0415], ['Angers', 47.4784, -0.5632], ['Nîmes', 43.8367, 4.3601], ['Clermont-Ferrand', 45.7772, 3.087], ['Le Mans', 48.0061, 0.1996], ['Aix-en-Provence', 43.5297, 5.4474], ['Brest', 48.3904, -4.4861], ['Tours', 47.3941, 0.6848], ['Amiens', 49.8941, 2.2958], ['Limoges', 45.8336, 1.2611], ['Metz', 49.1193, 6.1757], ['Besançon', 47.2378, 6.0241], ['Perpignan', 42.6887, 2.8948], ['Orléans', 47.9029, 1.9093], ['Rouen', 49.4432, 1.0999], ['Caen', 49.1829, -0.3707], ['Nancy', 48.6921, 6.1844], ['Avignon', 43.9493, 4.8055], ['Poitiers', 46.5802, 0.3404], ['Pau', 43.2951, -0.3708], ['La Rochelle', 46.1603, -1.1511], ['Bayonne', 43.4929, -1.4748], ['Ajaccio', 41.9192, 8.7386], ['Annecy', 45.8992, 6.1294]];

  /* ================= PROFIL ================= */
  const PTABS = [['theme', 'Thème'], ['positions', 'Positions'], ['aspects', 'Aspects'], ['lecture', 'Lecture'], ['dominantes', 'Dominantes'], ['ciel', 'Ciel de naissance'], ['transits', 'Transits'], ['revolution', 'Révolution solaire']];
  function viewProfil(id, tab = 'theme', extra) {
    const p = getP(id); if (!p) return `<div class="card"><p>Profil introuvable.</p><a href="#/carnet" class="btn">Retour au carnet</a></div>`;
    const ch = chartOf(p);
    const s = ch.bodies[0], m = ch.bodies[1], a = ch.angles[0];
    const head = `<section class="phead">
      ${avatar(p)}<div class="grow"><h1>${esc(p.name)}</h1><p class="sub">${fmtDate(p.date)}${p.timeUnknown ? ' · heure inconnue' : ' à ' + p.time} · ${esc(p.place.name)} · ${E.formatOffset(ch.offsetMin)} · ${age(p.date)} ans</p>
      <div class="big3"><div><small>Soleil ${H('soleil')}</small>${sg(s.sign)} ${s.sign.name}</div><div><small>Lune ${H('lune')}</small>${sg(m.sign)} ${m.sign.name}</div>${p.timeUnknown ? '' : `<div><small>Ascendant ${H('ascendant')}</small>${sg(a.sign)} ${a.sign.name}</div>`}</div></div>
      <div class="pact"><button class="btn sm" data-act="edit" data-id="${p.id}">✎ Modifier</button><a class="btn sm" href="#/synastrie/${p.id}">⚭ Comparer</a></div></section>
      ${ch.ambiguous ? '<div class="notice">⚠️ Cette heure tombe pendant un changement d’heure (heure d’été/hiver). Vérifie le décalage dans les réglages avancés du profil.</div>' : ''}
      ${ch.houseNote ? `<div class="notice">${esc(ch.houseNote)}</div>` : ''}
      <nav class="tabs">${PTABS.map(([k, l]) => `<a href="#/profil/${p.id}/${k}" class="${k === tab ? 'on' : ''}">${l}</a>`).join('')}</nav>`;
    const body = ({ theme: tabTheme, positions: tabPositions, aspects: tabAspects, lecture: tabLecture, dominantes: tabDominantes, ciel: tabCiel, transits: tabTransits, revolution: tabRevolution }[tab] || tabTheme)(p, ch, extra);
    return head + body;
  }

  function tabTheme(p, ch) {
    const st = ch.stats;
    return `<div class="split">
      <div class="card wheelcard">${C.wheel(ch)}
        <div class="legend"><span><i style="background:${C.ASPC.fluide}"></i>Fluide (trigone, sextile)</span><span><i style="background:${C.ASPC.tendu}"></i>Tendu (carré, opposition)</span><span><i style="background:${C.ASPC.neutre}"></i>Conjonction</span></div>
        <p class="muted small">Comment lire la roue ${H('roue')} · Maisons ${E.HOUSE_SYSTEMS[ch.houseSystem]} ${H('systemeMaisons')} · Survole une planète pour le détail.</p></div>
      <div class="col">
        <div class="card"><h3>Les trois piliers ${H('theme')}</h3>${PS.bigThree(ch, p.name).map((x) => `<h4>${x.title} ${H(x.help)}</h4><p>${x.txt}</p><p class="theory">${x.theory}</p>`).join('')}</div>
        <div class="card"><h3>En un coup d’œil</h3>
          <dl class="kv">
            <dt>Élément dominant ${H('elements')}</dt><dd>${I.elements[st.domEl[0][0]].name}</dd>
            <dt>Mode dominant ${H('modes')}</dt><dd>${I.modes[st.domMo[0][0]].name}</dd>
            <dt>Planète dominante ${H('dominantes')}</dt><dd title="${esc(I.dominant[st.ranking[0][0]].txt)}">${E.PMAP[st.ranking[0][0]].glyph}︎ ${E.PMAP[st.ranking[0][0]].name} <span class="muted small">(type ${I.dominant[st.ranking[0][0]].type.toLowerCase()})</span></dd>
            ${ch.noTime ? '' : `<dt>Maître d’Ascendant ${H('maitreAsc')}</dt><dd>${E.PMAP[ch.angles[0].sign.ruler].name} en ${ch.bodies.find((b) => b.key === ch.angles[0].sign.ruler).sign.name}</dd>`}
            <dt>Phase lunaire ${H('phase')}</dt><dd>${C.moonIcon(ch.moonPhase, 22)} ${E.moonPhaseName(ch.moonPhase)}</dd>
            <dt>Naissance ${H('jourNuit')}</dt><dd>${ch.diurnal ? '☀️ de jour' : '🌙 de nuit'}</dd>
            <dt>Rétrogrades ${H('retro')}</dt><dd>${st.retro.length ? st.retro.map((k) => E.PMAP[k].name).join(', ') : 'aucune'}</dd>
            <dt>Forme du thème ${H('forme')}</dt><dd>${st.shape.name}</dd>
          </dl></div>
        ${st.configs.length ? `<div class="card"><h3>Configurations remarquables ${H('configurations')}</h3><ul class="cfg">${st.configs.map((c) => `<li><b>${c.type}</b> — ${esc(c.detail)}</li>`).join('')}</ul></div>` : ''}
        ${p.notes ? `<div class="card"><h3>Notes</h3><p class="pre">${esc(p.notes)}</p></div>` : ''}
      </div></div>`;
  }

  function tabPositions(p, ch) {
    const rows = ch.bodies.map((b) => `<tr><td><span class="pg2">${b.glyph}︎</span> ${b.name}</td><td>${sg(b.sign)} ${b.sign.name}</td><td class="num">${E.fmtDeg(b.lon, false)}</td><td>${b.house ? 'M' + b.house : '—'}</td><td>${b.retro && E.PMAP[b.key].body ? '<span class="retro" title="Rétrograde">℞</span>' : ''}</td><td>${b.dignity ? `<span class="dig ${b.dignity.key}">${b.dignity.label}</span>` : ''}</td><td class="num muted">${b.speed !== undefined ? (b.speed >= 0 ? '+' : '') + b.speed.toFixed(3) + '°/j' : ''}</td></tr>`).join('');
    const ang = ch.noTime ? '' : ch.angles.map((a) => `<tr><td><b>${a.glyph}</b> ${a.name}</td><td>${sg(a.sign)} ${a.sign.name}</td><td class="num">${E.fmtDeg(a.lon, false)}</td><td></td><td></td><td></td><td></td></tr>`).join('');
    const cusps = ch.noTime ? '<p class="muted">Heure inconnue : les maisons ne peuvent pas être calculées.</p>' : `<table class="tbl"><thead><tr><th>Maison</th><th>Signe</th><th>Cuspide ${H('cuspide')}</th><th>Maître ${H('maitre')}</th><th>Domaine</th></tr></thead><tbody>${ch.cusps.map((c, i) => { const s = E.signOf(c); return `<tr><td>${i + 1}</td><td>${sg(s.sign)} ${s.sign.name}</td><td class="num">${E.fmtDeg(c, false)}</td><td>${E.PMAP[s.sign.ruler].name}</td><td class="muted small">${I.houses[i].kw}</td></tr>`; }).join('')}</tbody></table>`;
    return `<div class="card"><h3>Positions planétaires ${H('theme')}</h3><div class="scroll"><table class="tbl"><thead><tr><th>Point</th><th>Signe ${H('signes')}</th><th>Degré</th><th>Maison ${H('maisons')}</th><th>℞ ${H('retro')}</th><th>Dignité ${H('dignites')}</th><th>Vitesse ${H('vitesse')}</th></tr></thead><tbody>${rows}${ang}</tbody></table></div>
      <p class="muted small">Zodiaque tropical ${H('tropical')}, positions géocentriques apparentes. Nœud ${state.settings.nodeType === 'mean' ? 'moyen' : 'vrai'} ${H('noeuds')}, Lilith = Lune Noire moyenne ${H('lilith')}, Part de Fortune ${H('fortune')}. Temps universel : ${new Date(ch.ms).toISOString().replace('T', ' ').slice(0, 16)} UTC · Temps sidéral local ${H('tempsSideral')} : ${hms(ch.lst)} · JJ ${ch.jd.toFixed(5)}</p></div>
      <div class="card"><h3>Maisons ${H('maisons')} <span class="muted small">${E.HOUSE_SYSTEMS[ch.houseSystem]}</span> ${H('systemeMaisons')}</h3><div class="scroll">${cusps}</div></div>`;
  }
  const hms = (h) => { const H = Math.floor(h), M = Math.floor((h - H) * 60), S = Math.round(((h - H) * 60 - M) * 60); return `${H}h${String(M).padStart(2, '0')}m${String(S).padStart(2, '0')}s`; };

  function tabAspects(p, ch) {
    const st = ch.stats; const tot = ch.aspects.length;
    const byType = E.ASPECTS.map((a) => ({ label: a.name, value: ch.aspects.filter((x) => x.key === a.key).length, color: C.ASPC[a.nature], icon: a.glyph })).filter((x) => x.value);
    return `<div class="split"><div class="card"><h3>Grille des aspects ${H('grille')}</h3><div class="scroll">${C.aspectGrid(ch)}</div><p class="muted small">Survole une case pour l’orbe exacte. ${state.settings.minor ? 'Aspects mineurs inclus.' : 'Aspects majeurs uniquement.'}</p></div>
      <div class="col"><div class="card"><h3>Équilibre des aspects ${H('aspects')}</h3>
        ${C.hbars([{ label: 'Fluides', value: st.aspCount.fluide, color: C.ASPC.fluide }, { label: 'Tendus', value: st.aspCount.tendu, color: C.ASPC.tendu }, { label: 'Conjonctions', value: st.aspCount.neutre, color: C.ASPC.neutre }, { label: 'Ajustements / mineurs', value: st.aspCount.autre, color: C.ASPC.ajustement }])}
        <p class="small">${st.aspCount.fluide > st.aspCount.tendu * 1.4 ? 'Thème plutôt harmonieux : les talents circulent facilement, le défi est de ne pas s’endormir sur ses acquis.' : st.aspCount.tendu > st.aspCount.fluide * 1.4 ? 'Thème dynamique et exigeant : beaucoup de tensions qui sont autant de moteurs d’évolution.' : 'Thème équilibré entre facilités et défis.'}</p></div>
        <div class="card"><h3>Par type (${tot}) ${H('mineurs')}</h3>${C.hbars(byType)}</div></div></div>
      <div class="card"><h3>Liste détaillée ${H('orbe')} ${H('appliquant')}</h3><ul class="asplist">${ch.aspects.map((a) => `<li><span class="ag" style="color:${C.ASPC[a.nature]}">${a.ag}︎ ${a.glyph} ${a.bg}︎</span><div><b>${a.an} ${a.name.toLowerCase()} ${a.bn}</b> <span class="muted">orbe ${a.orb.toFixed(2)}°${a.applying === true ? ' · appliquant' : a.applying === false ? ' · séparant' : ''}</span><br><span class="small">${PS.aspectReading(a, p.name)}</span><span class="theory small">${I.aspectText(a)}</span></div></li>`).join('')}</ul></div>`;
  }

  function tabLecture(p, ch) {
    const main = ch.bodies;
    return `<div class="card"><h3>Synthèse ${H('elements')}</h3><p>${I.elementSummary(ch.stats)}</p><p>${I.moonPhases[E.moonPhaseName(ch.moonPhase)]}</p><p><b>Forme ${ch.stats.shape.name}</b> : ${ch.stats.shape.desc}</p></div>
      <div class="card"><h3>Planète par planète ${H('signes')}</h3>${main.map((b) => `<div class="lec"><div class="lec-g" style="color:${C.ELC[b.sign.element]}">${b.glyph}︎</div><div><h4>${b.name} en ${b.sign.name}${b.house ? ', maison ' + b.house : ''} ${H({ sun: 'soleil', moon: 'lune', node: 'noeuds', snode: 'noeuds', lilith: 'lilith', fortune: 'fortune' }[b.key] || '')}${b.dignity ? ' ' + H('dignites') : ''}</h4>${((r) => `<p>${r.perso}</p><p class="theory">${r.theory}</p>`)(PS.planetReading(b, ch, p.name))}</div></div>`).join('')}</div>
      ${ch.noTime ? '' : `<div class="card"><h3>Les maisons habitées ${H('maisons')}</h3>${I.houses.map((h, i) => { const occ = main.filter((b) => b.house === i + 1 && E.PMAP[b.key].body); return occ.length ? `<p><b>${h.name}</b> (${h.kw}) : ${occ.map((b) => b.name).join(', ')}.</p>` : ''; }).join('')}<p class="muted small">Les maisons vides ne sont pas « inactives » : elles s’expriment à travers leur maître et le signe de leur cuspide.</p></div>`}
      <div class="card"><h3>Aspects majeurs ${H('aspects')}</h3>${ch.aspects.filter((a) => a.major).slice(0, 14).map((a) => `<p><b style="color:${C.ASPC[a.nature]}">${a.glyph}</b> <b>${a.an} ${a.name.toLowerCase()} ${a.bn}</b> — ${PS.aspectReading(a, p.name)}</p><p class="theory">${I.aspectText(a)}</p>`).join('')}</div>`;
  }

  function tabDominantes(p, ch) {
    const st = ch.stats;
    const elTot = Object.values(st.el).reduce((a, b) => a + b, 0);
    const moTot = Object.values(st.mo).reduce((a, b) => a + b, 0);
    const pr = st.ranking.slice(0, 10).map(([k, v]) => ({ label: E.PMAP[k].name, value: v, icon: E.PMAP[k].glyph + '︎', color: 'var(--accent)' }));
    return `<div class="grid2">
      <div class="card"><h3>Éléments ${H('elements')}</h3>${C.hbars(['feu', 'terre', 'air', 'eau'].map((e) => ({ label: I.elements[e].name, value: pct(st.el[e], elTot), color: C.ELC[e], title: I.elements[e].name + ' : ' + I.elements[e].txt })), { max: 100, fmt: (v) => v + ' %' })}<p class="small">${I.elementSummary(st)}</p></div>
      <div class="card"><h3>Modes ${H('modes')}</h3>${C.hbars(['cardinal', 'fixe', 'mutable'].map((m) => ({ label: I.modes[m].name, value: pct(st.mo[m], moTot), color: 'var(--accent)', title: I.modes[m].txt })), { max: 100, fmt: (v) => v + ' %' })}
        <h3 style="margin-top:1rem">Polarité ${H('polarite')}</h3>${C.hbars([{ label: 'Yang (feu, air)', value: pct(st.pol['+'], elTot), color: 'var(--gold)' }, { label: 'Yin (terre, eau)', value: pct(st.pol['-'], elTot), color: 'var(--accent)' }], { max: 100, fmt: (v) => v + ' %' })}</div>
      <div class="card"><h3>Planètes dominantes ${H('dominantes')}</h3>${C.hbars(pr)}<p class="muted small">Score combinant angularité, maîtrises (Ascendant, MC, luminaires), dignités et nombre d’aspects.</p></div>
      <div class="card span2"><h3>Interprétation des dominantes ${H('dominantes')}</h3>${st.ranking.slice(0, 3).map(([k, v], i) => { const d = I.dominant[k], b = ch.bodies.find((x) => x.key === k); return `<div class="lec"><div class="lec-g" style="color:var(--gold)">${E.PMAP[k].glyph}\uFE0E</div><div><h4>${i === 0 ? 'Planète dominante' : i === 1 ? 'Deuxième dominante' : 'Troisième dominante'} : ${E.PMAP[k].name} <span class="muted small">(type ${d.type.toLowerCase()} · score ${v})</span></h4><p>${d.txt}</p><p class="small">${E.PMAP[k].name} en ${b.sign.name}${b.house ? ', maison ' + b.house : ''} : cette énergie s’exprime de manière ${I.signs[b.sign.key].adj}${b.house ? ', surtout dans ' + I.houses[b.house - 1].kw : ''}.</p><p class="small muted">Pourquoi elle domine : ${domReasons(ch, b).join(' · ')}</p></div></div>`; }).join('')}</div>
      ${ch.noTime ? '' : `<div class="card"><h3>Hémisphères ${H('hemispheres')}</h3>${C.hbars([{ label: 'Est — affirmation de soi', value: pct(st.hemi.est, st.hemi.est + st.hemi.ouest), color: 'var(--gold)' }, { label: 'Ouest — tourné vers l’autre', value: pct(st.hemi.ouest, st.hemi.est + st.hemi.ouest), color: 'var(--accent)' }, { label: 'Sud — vie publique', value: pct(st.hemi.sud, st.hemi.nord + st.hemi.sud), color: 'var(--gold)' }, { label: 'Nord — vie intime', value: pct(st.hemi.nord, st.hemi.nord + st.hemi.sud), color: 'var(--accent)' }], { max: 100, fmt: (v) => v + ' %' })}</div>`}
      <div class="card span2"><h3>Poids par signe ${H('signes')}</h3>${C.signColumns(st.signScore.map((v) => Math.round(v * 10) / 10), { label: 'Poids par signe' })}</div>
      ${ch.noTime ? '' : `<div class="card span2"><h3>Poids par maison ${H('maisons')}</h3>${C.hbars(st.houseScore.map((v, i) => ({ label: I.houses[i].name, value: Math.round(v * 10) / 10, color: 'var(--accent)', title: I.houses[i].kw })))}</div>`}
    </div>`;
  }

  function domReasons(ch, b) {
    const r = [];
    if (!ch.noTime) {
      const angs = [['à l’Ascendant', ch.angles[0].lon], ['au Milieu du Ciel', ch.angles[1].lon], ['au Descendant', ch.angles[2].lon], ['au Fond du Ciel', ch.angles[3].lon]];
      for (const [n, l] of angs) { const o = Math.abs(E.angDiff(b.lon, l)); if (o < 10) r.push(`conjointe ${n} (${o.toFixed(1)}°)`); }
      if (ch.angles[0].sign.ruler === b.key) r.push('maîtresse de l’Ascendant');
      if (ch.angles[1].sign.ruler === b.key) r.push('maîtresse du Milieu du Ciel');
      if ([1, 10].includes(b.house)) r.push('en maison angulaire ' + b.house);
    }
    if (ch.bodies[0].sign.ruler === b.key && b.key !== 'sun') r.push('maîtresse du signe solaire');
    if (ch.bodies[1].sign.ruler === b.key && b.key !== 'moon') r.push('maîtresse du signe lunaire');
    if (b.key === 'sun' || b.key === 'moon') r.push('luminaire');
    if (b.dignity && b.dignity.score > 0) r.push(b.dignity.label.toLowerCase());
    const n = ch.aspects.filter((a) => a.major && (a.a === b.key || a.b === b.key)).length;
    if (n >= 4) r.push(n + ' aspects majeurs');
    return r.length ? r : ['présence équilibrée dans le thème'];
  }

  function tabCiel(p, ch) {
    const view = E.skyView(ch.ms, ch.lat, ch.lon);
    const sm = C.skyMap(view, { lines: state.settings.skyLines, names: state.settings.skyNames, realistic: state.settings.realistic });
    const dayNote = sm.sunAlt > 0 ? '☀️ Le Soleil était levé : ces étoiles étaient là, mais invisibles dans la lumière du jour.' : sm.sunAlt > -12 ? '🌆 Crépuscule : seules les étoiles les plus brillantes étaient visibles.' : '🌌 Nuit noire : le ciel était tel que dessiné ici.';
    return `<div class="split"><div class="card skycard">${sm.svg}</div>
      <div class="col"><div class="card"><h3>${H('ciel')} Le ciel au-dessus de ${esc(p.place.name.split(' (')[0])}</h3><p>${fmtDT(ch.ms, p.place.tz)}</p><p>${dayNote}</p><p class="small muted">Vue en levant la tête : zénith au centre, horizon sur le bord, Nord en haut, Est à gauche. La ligne pointillée dorée est l’écliptique ${H('ecliptique')}, sur laquelle se trouvent le Soleil, la Lune et les planètes.</p>
        ${sm.below ? `<p class="small"><b>Sous l’horizon :</b> ${sm.below}</p>` : ''}
        <div class="row wrap"><label class="chk"><input type="checkbox" id="skl" ${state.settings.skyLines ? 'checked' : ''}> Lignes des constellations</label><label class="chk"><input type="checkbox" id="skn" ${state.settings.skyNames ? 'checked' : ''}> Noms</label><label class="chk"><input type="checkbox" id="skr" ${state.settings.realistic ? 'checked' : ''}> Luminosité réaliste</label></div></div>
        <div class="card"><h3>Planètes visibles ${H('magnitude')}</h3><ul class="plist">${view.planets.map((pl) => `<li class="${pl.alt < 0 ? 'muted' : ''}">${pl.glyph}︎ <b>${pl.name}</b> — ${pl.alt >= 0 ? `hauteur ${pl.alt.toFixed(0)}°, direction ${azName(pl.az)}` : 'sous l’horizon'}${pl.mag !== null && pl.alt >= 0 && pl.key !== 'sun' ? ` · mag. ${pl.mag.toFixed(1)}` : ''}</li>`).join('')}</ul></div>
        <div class="card"><h3>Lune de naissance ${H('phase')}</h3><div class="row">${C.moonIcon(ch.moonPhase, 64)}<div><b>${E.moonPhaseName(ch.moonPhase)}</b><br><span class="small">${I.moonPhases[E.moonPhaseName(ch.moonPhase)]}</span></div></div></div>
      </div></div>`;
  }
  const azName = (az) => ['Nord', 'Nord-Est', 'Est', 'Sud-Est', 'Sud', 'Sud-Ouest', 'Ouest', 'Nord-Ouest'][Math.round(az / 45) % 8];
  afterRender.profil = (id, tab) => {
    if (tab === 'ciel') { const bind = (sel, key) => { const el = $(sel); if (el) el.onchange = () => { state.settings[key] = el.checked; save(); route(); }; }; bind('#skl', 'skyLines'); bind('#skn', 'skyNames'); bind('#skr', 'realistic'); }
    if (tab === 'transits') { const d = $('#trdate'); if (d) d.onchange = () => { location.hash = `#/profil/${id}/transits/${d.value}`; }; }
    if (tab === 'revolution') { const y = $('#sry'); if (y) y.onchange = () => { location.hash = `#/profil/${id}/revolution/${y.value}`; }; }
  };

  function tabTransits(p, ch, dateStr) {
    const today = new Date(); const ds = dateStr || today.toISOString().slice(0, 10);
    const ms = dateStr ? E.localToUTC(ds, '12:00', 'Europe/Paris').ms : Date.now();
    const tr = E.transitsFor(ch, ms, { nodeType: state.settings.nodeType });
    const slow = tr.aspects.filter((a) => ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'node'].includes(a.a));
    const fast = tr.aspects.filter((a) => !['jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'node'].includes(a.a));
    const li = (a) => `<li><span class="ag" style="color:${C.ASPC[a.nature]}">${a.ag}︎ ${a.glyph} ${a.bg}︎</span><div>${I.transitText(a)}${a.transitHouse ? ` <span class="muted small">(transite votre maison ${a.transitHouse})</span>` : ''}</div></li>`;
    return `<div class="toolbar"><label>Date des transits <input type="date" id="trdate" value="${ds}"></label><a class="btn sm" href="#/profil/${p.id}/transits">Aujourd’hui</a></div>
      <div class="split"><div class="card wheelcard">${C.wheel(ch, { outer: tr.chart, aspects: tr.aspects })}<p class="muted small">Intérieur : thème natal · extérieur : ciel du ${fmtDate(ds)}.</p></div>
      <div class="col"><div class="card"><h3>Grandes tendances (planètes lentes) ${H('lentes')}</h3>${slow.length ? `<ul class="asplist">${slow.map(li).join('')}</ul>` : '<p class="muted">Aucun transit lent serré en ce moment.</p>'}</div>
      <div class="card"><h3>Climat du moment (planètes rapides) ${H('transits')}</h3>${fast.length ? `<ul class="asplist">${fast.map(li).join('')}</ul>` : '<p class="muted">Rien de marquant.</p>'}</div></div></div>`;
  }

  function tabRevolution(p, ch, yearStr) {
    const y = +(yearStr || new Date().getFullYear());
    const sr = E.solarReturn(ch, y);
    if (!sr) return '<div class="card"><p>Calcul impossible.</p></div>';
    const src = sr.chart; if (!state.settings.minor) src.aspects = src.aspects.filter((a) => a.major);
    const asc = src.angles[0], b = src.bodies;
    const sun = b[0], moon = b[1];
    const years = []; const by = +p.date.slice(0, 4); for (let k = Math.max(by, y - 10); k <= y + 10; k++) years.push(k);
    return `<div class="toolbar"><label>Année <select id="sry">${years.map((k) => `<option ${k === y ? 'selected' : ''}>${k}</option>`).join('')}</select></label><span class="muted small">Calculée pour le lieu de naissance.</span></div>
      <div class="split"><div class="card wheelcard">${C.wheel(src)}</div>
      <div class="col"><div class="card"><h3>Révolution solaire ${y} ${H('revolution')}</h3><p>Retour exact du Soleil à ${E.fmtDeg(ch.bodies[0].lon)} le <b>${fmtDT(sr.ms, p.place.tz)}</b>.</p>
      <dl class="kv"><dt>Ascendant de l’année</dt><dd>${sg(asc.sign)} ${asc.sign.name}</dd><dt>Soleil en maison</dt><dd>${sun.house}</dd><dt>Lune</dt><dd>${sg(moon.sign)} ${moon.sign.name}, maison ${moon.house}</dd></dl>
      <p><b>Thème de l’année :</b> le Soleil en maison ${sun.house} met l’accent sur ${I.houses[sun.house - 1].kw}. La Lune en maison ${moon.house} indique que les besoins émotionnels se porteront sur ${I.houses[moon.house - 1].kw}. L’Ascendant ${asc.sign.name} donne une tonalité ${I.signs[asc.sign.key].adj} à l’année.</p></div>
      <div class="card"><h3>Positions de l’année</h3><table class="tbl"><tbody>${b.filter((x) => E.PMAP[x.key].body).map((x) => `<tr><td>${x.glyph}︎ ${x.name}</td><td>${sg(x.sign)} ${E.fmtDeg(x.lon, false)}</td><td>M${x.house}</td></tr>`).join('')}</tbody></table></div></div></div>`;
  }

  /* ================= SYNASTRIE ================= */
  function viewSyn(id1, id2) {
    const P = state.profiles;
    if (P.length < 2) return `<div class="card"><h2>Synastrie</h2><p>Il faut au moins deux profils dans le carnet pour les comparer.</p><button class="btn primary" data-act="new">Ajouter un profil</button></div>`;
    const opt = (sel) => P.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr')).map((p) => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
    const sel = `<section class="hero"><div><h1>Synastrie ${H('synastrie')}</h1><p class="sub">Comparer deux thèmes : compatibilité, aspects croisés, maisons, thème composite.</p></div></section>
      <div class="toolbar syn"><select id="s1"><option value="">— Profil 1 —</option>${opt(id1)}</select><span class="amp">⚭</span><select id="s2"><option value="">— Profil 2 —</option>${opt(id2)}</select></div>`;
    const p1 = getP(id1), p2 = getP(id2);
    if (!p1 || !p2 || p1 === p2) return sel + '<div class="card muted">Choisis deux profils différents.</div>';
    const c1 = chartOf(p1), c2 = chartOf(p2);
    const syn = E.synastry(c1, c2);
    const n1 = esc(p1.name), n2 = esc(p2.name);
    const dl = { amour: 'Amour & tendresse', communication: 'Communication', quotidien: 'Vie quotidienne', passion: 'Passion & désir', durabilite: 'Solidité & durée' };
    const top = syn.aspects.slice(0, 30);
    const ov = (list, owner, host) => list.length ? `<table class="tbl"><tbody>${list.map((o) => `<tr><td>${o.glyph}︎ ${o.name} de ${owner}</td><td>maison ${o.house} de ${host}</td><td class="muted small">${I.houses[o.house - 1].kw}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Heure inconnue : superposition impossible.</p>';
    return sel + `<div class="split">
      <div class="card wheelcard">${C.wheel(c2, { outer: c1, aspects: syn.aspects })}<p class="muted small">Intérieur : ${n2} · extérieur : ${n1}.</p></div>
      <div class="col">
        <div class="card score"><div class="ring" style="--v:${syn.score}"><span>${syn.score}</span><small>/100</small></div><div><h3>${n1} & ${n2} ${H('score')}</h3><p>${syn.score >= 75 ? 'Une belle affinité : beaucoup d’échanges fluides entre vos thèmes.' : syn.score >= 55 ? 'Une relation équilibrée, entre complicité et défis stimulants.' : syn.score >= 40 ? 'Une relation qui demande des ajustements, mais riche d’apprentissages.' : 'Des énergies contrastées : la relation sera intense et formatrice.'}</p><p class="muted small">${syn.aspects.filter((a) => a.nature === 'fluide').length} aspects fluides · ${syn.aspects.filter((a) => a.nature === 'tendu').length} tendus · ${syn.aspects.filter((a) => a.key === 'conj').length} conjonctions</p></div></div>
        <div class="card"><h3>Par domaine</h3>${C.hbars(Object.entries(syn.domains).map(([k, v]) => ({ label: dl[k], value: v, color: 'var(--accent)' })), { max: 100, fmt: (v) => v + ' %' })}</div>
        <div class="card"><h3>Éléments croisés ${H('elementsCroises')}</h3><dl class="kv"><dt>Soleil ↔ Soleil</dt><dd>${c1.bodies[0].sign.name} / ${c2.bodies[0].sign.name} — ${syn.sunMoon.sun}</dd><dt>Lune ↔ Lune</dt><dd>${c1.bodies[1].sign.name} / ${c2.bodies[1].sign.name} — ${syn.sunMoon.moon}</dd><dt>Vénus de ${n1} ↔ Mars de ${n2}</dt><dd>${syn.sunMoon.venusMars}</dd><dt>Mars de ${n1} ↔ Vénus de ${n2}</dt><dd>${syn.sunMoon.marsVenus}</dd></dl></div>
      </div></div>
      <div class="card"><h3>Aspects croisés principaux ${H('aspects')}</h3><ul class="asplist">${top.map((a) => `<li><span class="ag" style="color:${C.ASPC[a.nature]}">${a.ag}︎ ${a.glyph} ${a.bg}︎</span><div>${I.synText(a, n1, n2)} <span class="muted small">orbe ${a.orb.toFixed(1)}°</span></div></li>`).join('')}</ul></div>
      <div class="grid2"><div class="card"><h3>Planètes de ${n2} dans les maisons de ${n1} ${H('superposition')}</h3>${ov(syn.overlay, n2, n1)}</div><div class="card"><h3>Planètes de ${n1} dans les maisons de ${n2}</h3>${ov(syn.overlay2, n1, n2)}</div></div>
      <div class="card"><h3>Thème composite ${H('composite')}</h3><p class="small muted">Le composite décrit la relation elle-même comme une entité.</p><div class="chips">${syn.composite.filter((b) => E.PMAP[b.key].body).map((b) => `<span class="chip">${b.glyph}︎ ${b.name} ${sg(b.sign)} ${E.fmtDeg(b.lon, false)}</span>`).join('')}</div>
      <p>Soleil composite en <b>${syn.composite[0].sign.name}</b> : la relation se vit sur un mode ${I.signs[syn.composite[0].sign.key].adj}. Vénus composite en <b>${syn.composite[3].sign.name}</b> : l’affection s’exprime de façon ${I.signs[syn.composite[3].sign.key].adj}.</p></div>`;
  }
  afterRender.synastrie = (a, b) => { const s1 = $('#s1'), s2 = $('#s2'); if (!s1) return; const go = () => (location.hash = `#/synastrie/${s1.value}/${s2.value}`); s1.onchange = go; s2.onchange = go; void a; void b; };

  /* ================= CIEL DU JOUR ================= */
  function viewSky() {
    const now = Date.now(); const loc = state.settings.skyPlace || { name: 'Paris', lat: 48.8566, lon: 2.3522 };
    const ch = E.calcChart({ ms: now, lat: loc.lat, lon: loc.lon, houseSystem: state.settings.houseSystem, nodeType: state.settings.nodeType, noTime: true });
    const A = window.Astronomy;
    const nextPh = []; let t = A.MakeTime(new Date());
    for (const [ph, nm] of [[0, 'Nouvelle Lune'], [90, 'Premier quartier'], [180, 'Pleine Lune'], [270, 'Dernier quartier']]) { const r = A.SearchMoonPhase(ph, t, 40); if (r) nextPh.push([r.date, nm, ph]); }
    nextPh.sort((a, b) => a[0] - b[0]);
    // prochaines entrées dans les signes
    const ingress = [];
    for (const b of ch.bodies.filter((x) => ['sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'].includes(x.key))) {
      const step = b.key === 'sun' || b.key === 'mercury' || b.key === 'venus' ? 1 : b.key === 'mars' ? 2 : 5;
      let prev = b.signIdx; for (let d = step; d < 400; d += step) { const c = E.calcChart({ ms: now + d * 86400000, lat: 0, lon: 0, noTime: true }).bodies.find((x) => x.key === b.key); if (c.signIdx !== prev) { ingress.push({ b, when: now + d * 86400000, sign: c.sign }); break; } prev = c.signIdx; }
    }
    ingress.sort((a, b) => a.when - b.when);
    const view = E.skyView(now, loc.lat, loc.lon);
    const sm = C.skyMap(view, { lines: state.settings.skyLines, names: state.settings.skyNames });
    const P = state.profiles;
    return `<section class="hero"><div><h1>Le ciel aujourd’hui</h1><p class="sub">${new Date(now).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}</p></div></section>
      <div class="split"><div class="col">
        <div class="card"><h3>Positions du jour ${H('retro')}</h3><table class="tbl"><tbody>${ch.bodies.filter((b) => b.key !== 'fortune').map((b) => `<tr><td>${b.glyph}︎ ${b.name}</td><td>${sg(b.sign)} ${b.sign.name}</td><td class="num">${E.fmtDeg(b.lon, false)}</td><td>${b.retro && E.PMAP[b.key].body ? '<span class="retro">℞ rétrograde</span>' : ''}</td></tr>`).join('')}</tbody></table></div>
        <div class="card"><h3>Lune ${H('lunePhases')}</h3><div class="row">${C.moonIcon(ch.moonPhase, 64)}<div><b>${E.moonPhaseName(ch.moonPhase)}</b> en ${ch.bodies[1].sign.name}<br><span class="small muted">${Math.round((1 - Math.cos(ch.moonPhase * Math.PI / 180)) * 50)} % éclairée</span></div></div>
          <ul class="plist">${nextPh.map(([d, nm, ph]) => `<li>${C.moonIcon(ph, 18)} ${nm} — ${d.toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} en ${E.signOf(E.calcChart({ ms: d.getTime(), lat: 0, lon: 0, noTime: true }).bodies[1].lon).sign.name}</li>`).join('')}</ul></div>
        <div class="card"><h3>Prochains changements de signe ${H('ingress')}</h3><ul class="plist">${ingress.map((x) => `<li>${x.b.glyph}︎ ${x.b.name} entre en ${sg(x.sign)} ${x.sign.name} vers le ${new Date(x.when).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</li>`).join('')}</ul></div>
        ${P.length ? `<div class="card"><h3>Transits du jour pour… ${H('transits')}</h3><div class="chips">${P.map((p) => `<a class="chip" href="#/profil/${p.id}/transits">${esc(p.name)}</a>`).join('')}</div></div>` : ''}
      </div>
      <div class="card skycard">${sm.svg}<p class="muted small">Ciel actuel au-dessus de ${esc(loc.name)}. ${sm.below ? 'Sous l’horizon : ' + sm.below : ''}</p></div></div>`;
  }

  /* ================= STATISTIQUES ================= */
  function viewStats() {
    const P = state.profiles;
    if (!P.length) return `<div class="card"><h2>Statistiques</h2><p>Ajoute des profils pour voir les statistiques de ton carnet.</p></div>`;
    const charts = P.map((p) => ({ p, ch: chartOf(p) }));
    const cnt = (fn) => { const a = new Array(12).fill(0); charts.forEach((x) => { const v = fn(x); if (v !== null) a[v]++; }); return a; };
    const sun = cnt((x) => x.ch.bodies[0].signIdx), moon = cnt((x) => x.ch.bodies[1].signIdx), asc = cnt((x) => (x.ch.noTime ? null : x.ch.angles[0].idx)), venus = cnt((x) => x.ch.bodies[3].signIdx);
    const el = { feu: 0, terre: 0, air: 0, eau: 0 }; charts.forEach((x) => { const t = Object.values(x.ch.stats.el).reduce((a, b) => a + b, 0); for (const k in el) el[k] += x.ch.stats.el[k] / t; });
    const domEl = { feu: 0, terre: 0, air: 0, eau: 0 }; charts.forEach((x) => domEl[x.ch.stats.domEl[0][0]]++);
    const domPl = {}; charts.forEach((x) => { const k = x.ch.stats.ranking[0][0]; domPl[k] = (domPl[k] || 0) + 1; });
    const aspT = {}; charts.forEach((x) => x.ch.aspects.filter((a) => a.major).forEach((a) => (aspT[a.key] = (aspT[a.key] || 0) + 1)));
    const ret = {}; charts.forEach((x) => x.ch.stats.retro.forEach((k) => (ret[k] = (ret[k] || 0) + 1)));
    const ph = {}; charts.forEach((x) => { const n = E.moonPhaseName(x.ch.moonPhase); ph[n] = (ph[n] || 0) + 1; });
    const upcoming = P.slice().sort((a, b) => nextBday(a) - nextBday(b)).slice(0, 6);
    // paires les plus compatibles
    let pairs = [];
    if (P.length >= 2 && P.length <= 60) { for (let i = 0; i < charts.length; i++) for (let j = i + 1; j < charts.length; j++) pairs.push({ a: charts[i].p, b: charts[j].p, s: E.synastry(charts[i].ch, charts[j].ch).score }); pairs.sort((x, y) => y.s - x.s); }
    const decade = {}; P.forEach((p) => { const d = Math.floor(+p.date.slice(0, 4) / 10) * 10; decade[d] = (decade[d] || 0) + 1; });
    const n = P.length;
    return `<section class="hero"><div><h1>Statistiques du carnet ${H('stats')}</h1><p class="sub">${n} profil${n > 1 ? 's' : ''} analysé${n > 1 ? 's' : ''}</p></div></section>
      <div class="tiles"><div class="tile"><small>Signe solaire le plus fréquent</small><b>${E.SIGNS[sun.indexOf(Math.max(...sun))].name}</b></div><div class="tile"><small>Élément dominant du carnet</small><b>${I.elements[Object.entries(el).sort((a, b) => b[1] - a[1])[0][0]].name}</b></div><div class="tile"><small>Planète dominante la plus fréquente</small><b>${E.PMAP[Object.entries(domPl).sort((a, b) => b[1] - a[1])[0][0]].name}</b></div><div class="tile"><small>Profils sans heure</small><b>${P.filter((p) => p.timeUnknown).length}</b></div></div>
      <div class="grid2">
        <div class="card span2"><h3>Signes solaires</h3>${C.signColumns(sun, { label: 'Signes solaires' })}</div>
        <div class="card"><h3>Signes lunaires</h3>${C.signColumns(moon, { label: 'Signes lunaires' })}</div>
        <div class="card"><h3>Ascendants</h3>${C.signColumns(asc, { label: 'Ascendants' })}</div>
        <div class="card"><h3>Vénus</h3>${C.signColumns(venus, { label: 'Vénus' })}</div>
        <div class="card"><h3>Répartition moyenne des éléments</h3>${C.hbars(['feu', 'terre', 'air', 'eau'].map((e) => ({ label: I.elements[e].name, value: Math.round((el[e] / n) * 100), color: C.ELC[e] })), { max: 100, fmt: (v) => v + ' %' })}<h4>Élément dominant par profil</h4>${C.hbars(['feu', 'terre', 'air', 'eau'].map((e) => ({ label: I.elements[e].name, value: domEl[e], color: C.ELC[e] })))}</div>
        <div class="card"><h3>Planètes dominantes</h3>${C.hbars(Object.entries(domPl).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: E.PMAP[k].name, value: v, icon: E.PMAP[k].glyph + '︎', color: 'var(--accent)' })))}</div>
        <div class="card"><h3>Aspects majeurs ${H('aspects')}</h3>${C.hbars(E.ASPECTS.filter((a) => a.major).map((a) => ({ label: a.name, value: aspT[a.key] || 0, icon: a.glyph, color: C.ASPC[a.nature] })))}</div>
        <div class="card"><h3>Planètes rétrogrades à la naissance</h3>${Object.keys(ret).length ? C.hbars(Object.entries(ret).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: E.PMAP[k].name, value: v, icon: E.PMAP[k].glyph + '︎', color: 'var(--accent)' }))) : '<p class="muted">Aucune.</p>'}</div>
        <div class="card"><h3>Phases lunaires de naissance</h3>${C.hbars(Object.entries(ph).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: k, value: v, color: 'var(--gold)' })))}</div>
        <div class="card"><h3>Décennies de naissance</h3>${C.hbars(Object.entries(decade).sort().map(([k, v]) => ({ label: 'Années ' + k, value: v, color: 'var(--accent)' })))}</div>
        <div class="card"><h3>Prochains anniversaires</h3><ul class="plist">${upcoming.map((p) => { const d = Math.round(nextBday(p) / 86400000); return `<li><a href="#/profil/${p.id}/revolution">${esc(p.name)}</a> — ${d === 0 ? '<b>aujourd’hui 🎂</b>' : 'dans ' + d + ' jour' + (d > 1 ? 's' : '')} (${age(p.date) + (d === 0 ? 0 : 1)} ans)</li>`; }).join('')}</ul></div>
        ${pairs.length ? `<div class="card"><h3>Duos les plus compatibles</h3><ul class="plist">${pairs.slice(0, 8).map((x) => `<li><a href="#/synastrie/${x.a.id}/${x.b.id}">${esc(x.a.name)} ⚭ ${esc(x.b.name)}</a> — <b>${x.s}</b>/100</li>`).join('')}</ul></div>` : ''}
      </div>`;
  }

  /* ================= RÉGLAGES ================= */
  function viewSettings() {
    const s = state.settings;
    return `<section class="hero"><div><h1>Réglages</h1><p class="sub">Mélastro v${VERSION}</p></div></section>
      <div class="grid2"><div class="card"><h3>Calculs</h3>
        <label>Système de maisons ${H('systemeMaisons')}<select id="hs">${Object.entries(E.HOUSE_SYSTEMS).map(([k, v]) => `<option value="${k}" ${k === s.houseSystem ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label>Nœuds lunaires ${H('noeudType')}<select id="nt"><option value="true" ${s.nodeType !== 'mean' ? 'selected' : ''}>Nœud vrai</option><option value="mean" ${s.nodeType === 'mean' ? 'selected' : ''}>Nœud moyen</option></select></label>
        <label class="chk"><input type="checkbox" id="mi" ${s.minor ? 'checked' : ''}> Afficher les aspects mineurs (quinconce, semi-sextile, semi-carré, sesqui-carré) ${H('mineurs')}</label>
        <label>Lieu pour « Le ciel aujourd’hui »<div class="placebox"><input id="skyq" value="${esc((s.skyPlace || { name: 'Paris' }).name)}" autocomplete="off"><div id="placeres" class="placeres"></div></div></label>
      </div>
      <div class="card"><h3>Sauvegarde du carnet</h3><p>Le carnet est enregistré <b>uniquement dans ce navigateur</b>, sur cet appareil. Exporte-le régulièrement (fichier JSON) pour ne rien perdre, ou pour le transférer sur un autre téléphone.</p>
        <p class="muted small">Dernière sauvegarde : ${s.lastBackup ? new Date(s.lastBackup).toLocaleString('fr-FR') : 'jamais'}</p>
        <div class="row wrap"><button class="btn primary" data-act="export">💾 Exporter le carnet</button><button class="btn" data-act="import">📂 Importer</button><button class="btn danger" data-act="wipe">Tout effacer</button></div></div>
      <div class="card span2"><h3>À propos des calculs</h3><p class="small">Zodiaque tropical, positions géocentriques apparentes calculées avec <a href="https://github.com/cosinekitty/astronomy" target="_blank" rel="noopener">Astronomy Engine</a> (précision vérifiée à moins d’une minute d’arc par rapport à Swiss Ephemeris). Les fuseaux horaires historiques (heure d’été, heure allemande de 1940-1944, etc.) proviennent de la base IANA intégrée au navigateur. La recherche de ville utilise Open-Meteo. Le catalogue d’étoiles (3 200 étoiles jusqu’à la magnitude 5,6) et les figures des constellations proviennent de d3-celestial.</p>
      <p class="small">📱 <b>Installer sur iPhone</b> : ouvre Mélastro dans Safari → bouton Partager → « Sur l’écran d’accueil ». Sur Android : menu de Chrome → « Installer l’application ».</p></div></div>`;
  }
  afterRender.reglages = () => {
    $('#hs').onchange = (e) => { state.settings.houseSystem = e.target.value; save(); toast('Système de maisons : ' + E.HOUSE_SYSTEMS[e.target.value]); };
    $('#nt').onchange = (e) => { state.settings.nodeType = e.target.value; save(); };
    $('#mi').onchange = (e) => { state.settings.minor = e.target.checked; chartCache.clear(); save(); };
    let t; const q = $('#skyq');
    q.oninput = () => { clearTimeout(t); t = setTimeout(async () => {
      const box = $('#placeres'); try { const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q.value)}&count=6&language=fr`); const j = await r.json(); const res = j.results || [];
        box.innerHTML = res.map((x, i) => `<button type="button" data-i="${i}">${esc(x.name)} <small>${esc([x.admin1, x.country].filter(Boolean).join(', '))}</small></button>`).join('');
        box.querySelectorAll('button').forEach((b) => (b.onclick = () => { const x = res[+b.dataset.i]; state.settings.skyPlace = { name: x.name, lat: x.latitude, lon: x.longitude }; save(); q.value = x.name; box.innerHTML = ''; toast('Lieu enregistré'); }));
      } catch (e) { box.innerHTML = '<div class="pad muted">Hors ligne</div>'; } }, 300); };
  };

  /* ---------------- Import / export ---------------- */
  function exportData() {
    const blob = new Blob([JSON.stringify({ app: 'Mélastro', version: VERSION, exportedAt: new Date().toISOString(), profiles: state.profiles }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `melastro-carnet-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); a.remove();
    state.settings.lastBackup = Date.now(); save(); toast('Carnet exporté ✓');
  }
  function importData() {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
    inp.onchange = async () => {
      try {
        const j = JSON.parse(await inp.files[0].text()); const list = j.profiles || j;
        if (!Array.isArray(list)) throw new Error('format');
        let added = 0, updated = 0;
        for (const p of list) { if (!p.name || !p.date || !p.place) continue; const ex = state.profiles.find((x) => x.id === p.id); if (ex) { Object.assign(ex, p); updated++; } else { state.profiles.push({ ...p, id: p.id || uid() }); added++; } }
        save(); route(); toast(`${added} profil(s) ajouté(s), ${updated} mis à jour`);
      } catch (e) { toast('Fichier invalide'); }
    };
    inp.click();
  }

  /* ---------------- Actions globales ---------------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act;
    if (act === 'new') openForm();
    else if (act === 'edit') openForm(getP(b.dataset.id));
    else if (act === 'export') exportData();
    else if (act === 'import') importData();
    else if (act === 'wipe') { if (confirm('Effacer tout le carnet de cet appareil ? Pense à exporter avant.') && confirm('Vraiment tout effacer ?')) { state.profiles = []; save(); route(); } }
    else if (act === 'demo') {
      const demo = [
        { name: 'Exemple — Albert Einstein', date: '1879-03-14', time: '11:30', place: { name: 'Ulm (Allemagne)', lat: 48.4011, lon: 9.9876, tz: null }, tzOverride: 0.6656, tags: ['exemple', 'célébrités'] },
        { name: 'Exemple — Marie Curie', date: '1867-11-07', time: '12:00', timeUnknown: true, place: { name: 'Varsovie (Pologne)', lat: 52.2297, lon: 21.0122, tz: null }, tzOverride: 1.4, tags: ['exemple', 'célébrités'] },
      ];
      demo.forEach((d) => state.profiles.push({ id: uid(), createdAt: Date.now(), updatedAt: Date.now(), notes: 'Profil d’exemple — tu peux le supprimer.', timeUnknown: false, ...d }));
      save(); route();
    }
  });

  /* ---------------- PWA ---------------- */
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

  route();
})();
