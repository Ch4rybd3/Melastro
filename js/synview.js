/* Mélastro — vue Synastrie : lecture guidée et comparaison côte à côte */
(function (root) {
  'use strict';
  const E = () => root.Engine, C = () => root.Charts, I = () => root.Interp, H = (k) => root.Help.H(k);
  const esc = (s) => root.Charts.esc(s);
  const ORDER = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'node', 'lilith', 'asc', 'mc'];
  const W = { sun: 3, moon: 3, venus: 2.5, mars: 2, mercury: 1.5, asc: 2, jupiter: 1.2, saturn: 1.5, mc: 1, uranus: 0.6, neptune: 0.6, pluto: 0.8, node: 0.8, lilith: 0.4 };
  const OUTER = ['uranus', 'neptune', 'pluto', 'node', 'lilith', 'mc'];
  const ROLE = { sun: 'sa personnalité', moon: 'ses émotions', mercury: 'sa façon de penser', venus: 'sa façon d’aimer', mars: 'son énergie et son désir', jupiter: 'sa générosité', saturn: 'son sérieux', uranus: 'son besoin de liberté', neptune: 'ses rêves', pluto: 'son intensité', node: 'son chemin de vie', lilith: 'sa part sauvage', asc: 'son allure', mc: 'ses ambitions' };
  const NAMEOF = { asc: 'Ascendant', mc: 'Milieu du Ciel' };

  // Textes par paire de planètes. {X} = propriétaire de la 1re planète de la clé, {Y} = de la 2e.
  const PAIRS = {
    'sun|moon': ['Un des liens les plus précieux : ce que {X} est profondément répond aux besoins émotionnels de {Y}. On se sent naturellement compris l’un par l’autre.', 'Ce que {X} veut et ce dont {Y} a besoin ne vont pas toujours dans le même sens : il faut se parler pour ajuster les attentes.'],
    'sun|sun': ['Vos personnalités se reconnaissent : mêmes envies de fond, une complicité facile.', 'Deux caractères affirmés qui ne visent pas la même chose : stimulant, mais gare aux rivalités.'],
    'moon|moon': ['Vous vibrez émotionnellement sur la même longueur d’onde : on est bien ensemble, tout simplement.', 'Vos besoins émotionnels diffèrent : ce qui rassure l’un peut agacer l’autre. La patience est la clé.'],
    'venus|mars': ['Une belle attirance : le désir de {Y} répond à la façon d’aimer de {X}. Alchimie romantique et physique.', 'Une attirance forte mais électrique : passion et disputes peuvent aller de pair.'],
    'sun|venus': ['{Y} apprécie spontanément qui est {X} : affection, admiration, douceur.', 'De l’affection, mais des goûts ou des valeurs qui ne coïncident pas toujours.'],
    'moon|venus': ['La tendresse de {Y} apaise les émotions de {X} : un lien doux et affectueux.', 'La tendresse est là, mais les besoins de {X} et la façon d’aimer de {Y} demandent des ajustements.'],
    'mercury|mercury': ['Vous vous comprenez à demi-mot : les conversations sont faciles et fluides.', 'Vous ne pensez pas de la même façon : les discussions peuvent tourner au malentendu… ou au débat passionnant.'],
    'mars|mars': ['Vos énergies s’additionnent : vous faites une bonne équipe dans l’action.', 'Deux énergies qui se heurtent : attention aux disputes et aux bras de fer.'],
    'sun|mars': ['{Y} stimule et dynamise {X} : vous vous motivez mutuellement.', '{Y} peut bousculer {X} : une énergie forte, parfois conflictuelle.'],
    'moon|mars': ['{Y} protège et entraîne {X} : un lien vivant et passionné.', 'L’impulsivité de {Y} peut heurter la sensibilité de {X}.'],
    'venus|venus': ['Mêmes goûts, même façon d’aimer : vous appréciez les mêmes choses.', 'Des goûts différents en amour et en plaisirs : une occasion d’apprendre l’un de l’autre.'],
    'sun|mercury': ['{Y} comprend bien {X} et sait trouver les mots justes avec lui ou elle.', '{Y} peut mal interpréter les intentions de {X} : prendre le temps de s’expliquer.'],
    'moon|mercury': ['{Y} sait mettre des mots sur ce que ressent {X} : on se confie facilement.', 'Les mots de {Y} peuvent blesser la sensibilité de {X} sans le vouloir.'],
    'mercury|venus': ['Des échanges doux et charmants : on aime se parler.', 'Des petits décalages dans la façon d’exprimer l’affection.'],
    'mercury|mars': ['Des discussions animées et stimulantes, des projets à deux.', 'Les mots peuvent vite s’échauffer : attention au ton dans les désaccords.'],
    'sun|saturn': ['{Y} apporte stabilité et soutien à {X} : un lien solide, fait pour durer.', '{Y} peut donner à {X} l’impression d’être freiné ou jugé : de la lourdeur à alléger.'],
    'moon|saturn': ['{Y} rassure {X} et lui offre un cadre sécurisant.', '{X} peut se sentir peu compris émotionnellement par {Y}, qui paraît distant.'],
    'venus|saturn': ['Un amour sérieux et fidèle : {Y} apporte de la constance à l’affection de {X}.', '{Y} peut refroidir la tendresse de {X} : il faudra exprimer davantage la chaleur.'],
    'mars|saturn': ['{Y} canalise l’énergie de {X} : efficacité et persévérance à deux.', '{Y} peut freiner l’élan de {X}, source de frustration.'],
    'sun|jupiter': ['{Y} encourage {X} et lui donne confiance : une relation optimiste et généreuse.', 'Beaucoup d’enthousiasme, parfois trop : promesses ou excès à surveiller.'],
    'moon|jupiter': ['{Y} apporte joie, réconfort et générosité à {X}.', 'Une générosité un peu envahissante, ou des attentes émotionnelles démesurées.'],
    'venus|jupiter': ['Une relation joyeuse et chaleureuse, pleine de petits plaisirs partagés.', 'On se fait plaisir, parfois jusqu’à l’excès.'],
    'sun|asc': ['{Y} se reconnaît dans la personnalité de {X} : une évidence dès la première rencontre.', 'Une première impression contrastée : il faut apprendre à se découvrir.'],
    'moon|asc': ['{X} se sent à l’aise avec {Y} dès le départ.', '{X} peut se sentir bousculé par l’attitude de {Y}.'],
    'venus|asc': ['{X} est sous le charme de {Y} : une attirance immédiate.', 'Un charme réel, mais parfois déroutant.'],
    'mars|asc': ['{X} donne de l’énergie et de l’élan à {Y}.', '{X} peut paraître brusque ou envahissant aux yeux de {Y}.'],
    'asc|asc': ['Vos allures s’accordent : on vous voit facilement ensemble.', 'Deux styles très différents au premier abord.'],
  };
  const OUTERP = {
    pluto: ['Un lien intense et transformateur : {Y} touche {X} en profondeur.', 'Fascination et rapports de force : {Y} peut chercher à contrôler {X}… ou le transformer profondément.'],
    uranus: ['Un lien électrique et surprenant : {Y} apporte du neuf et de la liberté à {X}.', 'Excitant mais instable : {Y} peut bousculer la sécurité de {X}.'],
    neptune: ['Un lien poétique, presque magique : beaucoup d’idéal et de tendresse.', 'Gare aux illusions : on peut s’idéaliser ou se méprendre l’un sur l’autre.'],
    node: ['Une rencontre qui fait grandir : {X} aide {Y} à avancer sur son chemin de vie.', 'Une rencontre qui fait grandir, mais qui bouscule les habitudes de {Y}.'],
    lilith: ['Une attirance troublante, hors des conventions.', 'Une attirance troublante qui peut réveiller des zones sensibles.'],
  };

  const pname = (k) => NAMEOF[k] || E().PMAP[k].name;
  const FEM = ['Lune', 'Vénus', 'Lilith', 'Part de Fortune'];
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const de = (k, who) => { const n = pname(k); const art = /^[AEIOUÉ]/i.test(n) ? 'l’' : FEM.includes(n) ? 'la ' : 'le '; return `${art}${n} de ${who}`; };
  const isGood = (a) => a.nature === 'fluide' || (a.key === 'conj' && !['saturn', 'pluto', 'mars', 'uranus', 'lilith'].some((k) => a.a === k || a.b === k));
  const weight = (a) => (W[a.a] || 0.5) * (W[a.b] || 0.5) * (1 - 0.6 * a.orb / (a.maxOrb || 8));

  function describe(a, n1, n2) {
    // a.a appartient à n1, a.b à n2
    const i = ORDER.indexOf(a.a), j = ORDER.indexOf(a.b);
    const first = i <= j ? [a.a, n1] : [a.b, n2], second = i <= j ? [a.b, n2] : [a.a, n1];
    const good = isGood(a) ? 0 : 1;
    let t = PAIRS[first[0] + '|' + second[0]];
    if (t) return t[good].replace(/\{X\}/g, first[1]).replace(/\{Y\}/g, second[1]);
    for (const o of ['pluto', 'uranus', 'neptune', 'node', 'lilith']) {
      if (a.a === o || a.b === o) { const outerOwner = a.a === o ? n1 : n2, other = a.a === o ? n2 : n1; const tt = OUTERP[o][good]; return o === 'node' ? tt.replace(/\{X\}/g, other).replace(/\{Y\}/g, outerOwner) : tt.replace(/\{X\}/g, other).replace(/\{Y\}/g, outerOwner); }
    }
    const verb = a.key === 'conj' ? 'se mêlent intimement' : isGood(a) ? 's’accordent bien' : 'se défient';
    return cap(`${de(a.a, n1)} (${ROLE[a.a]}) et ${de(a.b, n2)} (${ROLE[a.b]}) ${verb}.`);
  }

  function aspectItem(a, n1, n2) {
    const good = isGood(a);
    return `<li class="sx ${good ? 'good' : 'hard'}"><div class="sx-h"><span class="sx-ic">${good ? '✦' : '⚡'}</span><b>${a.ag}︎ ${esc(cap(de(a.a, n1)))}</b> <span class="sx-asp" style="color:${C().ASPC[a.nature]}">${a.glyph} ${a.name.toLowerCase()}</span> <b>${a.bg}︎ ${esc(de(a.b, n2))}</b></div><p>${esc(describe(a, n1, n2))}</p><span class="theory small">${a.name} : ${I().aspects[a.key]} · orbe ${a.orb.toFixed(1)}°</span></li>`;
  }

  function relEl(e1, e2) {
    if (e1 === e2) return ['même élément', 'same'];
    const comp = { feu: 'air', air: 'feu', terre: 'eau', eau: 'terre' };
    return comp[e1] === e2 ? ['complémentaires', 'comp'] : ['différents', 'diff'];
  }
  const ROWTXT = {
    sun: { same: 'Vous vous reconnaissez dans vos motivations profondes.', comp: 'Vos personnalités se stimulent et se complètent.', diff: 'Vous n’avancez pas au même rythme : chacun apporte ce qui manque à l’autre.' },
    moon: { same: 'Vous ressentez les choses de la même manière : confort émotionnel.', comp: 'Vos besoins émotionnels se nourrissent mutuellement.', diff: 'Vous n’avez pas les mêmes besoins pour vous sentir bien : à expliciter.' },
    asc: { same: 'Même style au premier abord : on vous voit vite ensemble.', comp: 'Vos allures se mettent en valeur l’une l’autre.', diff: 'Deux styles bien différents au premier contact.' },
    mercury: { same: 'Vous pensez de la même façon : on se comprend vite.', comp: 'Vos façons de penser s’enrichissent.', diff: 'Vous raisonnez différemment : bien vérifier qu’on s’est compris.' },
    venus: { same: 'Même façon d’aimer et mêmes goûts.', comp: 'Vos façons d’aimer se complètent joliment.', diff: 'Vous n’exprimez pas l’affection de la même manière.' },
    mars: { same: 'Même manière d’agir : efficaces ensemble.', comp: 'Vos énergies se relancent l’une l’autre.', diff: 'Vous n’agissez pas au même rythme : patience !' },
  };

  function render(p1, p2, c1, c2, syn, avatar) {
    const n1 = p1.name, n2 = p2.name, N1 = esc(n1), N2 = esc(n2);
    const asp = syn.aspects.filter((a) => !(OUTER.includes(a.a) && OUTER.includes(a.b)) && !(['uranus', 'neptune', 'pluto'].includes(a.a) && a.a === a.b)).map((a) => ({ ...a, w: weight(a) }));
    const goods = asp.filter(isGood).sort((x, y) => y.w - x.w), hards = asp.filter((a) => !isGood(a)).sort((x, y) => y.w - x.w);
    const s = syn.score;
    const verdict = s >= 75 ? 'Une très belle affinité' : s >= 60 ? 'Une bonne entente' : s >= 45 ? 'Une relation équilibrée' : s >= 30 ? 'Une relation qui demande des efforts' : 'Des énergies très contrastées';
    const vtxt = s >= 60 ? `Entre ${N1} et ${N2}, les liens harmonieux l’emportent : la relation coule plutôt naturellement.` : s >= 45 ? `Entre ${N1} et ${N2}, il y a autant de points d’entente que de points de friction : une relation vivante, qui fait grandir.` : `Entre ${N1} et ${N2}, les tensions sont nombreuses : la relation sera intense et demandera de la communication, mais les défis sont aussi des moteurs.`;
    const best = goods[0], worst = hards[0];

    // côte à côte
    const row = (label, k, help) => {
      const a = k === 'asc' ? (c1.noTime ? null : c1.angles[0]) : c1.bodies.find((b) => b.key === k);
      const b = k === 'asc' ? (c2.noTime ? null : c2.angles[0]) : c2.bodies.find((x) => x.key === k);
      if (!a || !b) return `<tr><th>${label} ${H(help)}</th><td>${a ? sgn(a.sign) : '—'}</td><td>${b ? sgn(b.sign) : '—'}</td><td class="muted small">Heure de naissance inconnue</td></tr>`;
      const [rl, rk] = relEl(a.sign.element, b.sign.element);
      return `<tr><th>${label} ${H(help)}</th><td>${sgn(a.sign)}</td><td>${sgn(b.sign)}</td><td><span class="rel ${rk}">${rk === 'same' ? '●●' : rk === 'comp' ? '●○' : '○○'} ${rl}</span><br><span class="small">${ROWTXT[k][rk]}</span></td></tr>`;
    };
    const sgn = (sg) => `<span style="color:${C().ELC[sg.element]}">${sg.glyph}︎</span> ${sg.name} <span class="muted small">(${sg.element})</span>`;

    // domaines
    const DOM = { amour: ['Amour & tendresse', ['venus', 'moon', 'sun'], '💗'], communication: ['Communication', ['mercury', 'sun', 'asc'], '💬'], quotidien: ['Vie quotidienne', ['moon', 'saturn', 'asc', 'mercury'], '🏡'], passion: ['Passion & désir', ['mars', 'venus', 'pluto'], '🔥'], durabilite: ['Solidité dans le temps', ['saturn', 'jupiter', 'sun', 'moon', 'node'], '⚓'] };
    const usedDom = new Set();
    const domCard = (k) => {
      const [label, keys, ic] = DOM[k], v = syn.domains[k];
      const score = (a) => a.w * ((keys.includes(a.a) && keys.includes(a.b)) ? 3 : 1) * ((a.a === keys[0] || a.b === keys[0]) ? 2 : 1);
      const rel = asp.filter((a) => (keys.includes(a.a) || keys.includes(a.b)) && !usedDom.has(a));
      const g = rel.filter(isGood).sort((x, y) => score(y) - score(x))[0], h = rel.filter((a) => !isGood(a)).sort((x, y) => score(y) - score(x))[0];
      if (g) usedDom.add(g); if (h) usedDom.add(h);
      const lvl = v >= 70 ? 'Point fort' : v >= 50 ? 'Plutôt favorable' : v >= 35 ? 'Mitigé' : 'À travailler';
      return `<div class="dom"><div class="dom-h"><span>${ic} <b>${label}</b></span><span class="dom-l">${lvl}</span></div><div class="hb-t"><div class="hb-f" style="width:${v}%;background:var(--accent)"></div></div>
        ${g ? `<p class="small">✦ ${esc(describe(g, n1, n2))}</p>` : ''}${h ? `<p class="small">⚡ ${esc(describe(h, n1, n2))}</p>` : ''}${!g && !h ? '<p class="small muted">Peu d’aspects marquants dans ce domaine : ni frein, ni moteur particulier.</p>' : ''}</div>`;
    };

    const ovl = (list, owner, host) => {
      const key = list.filter((o) => ['sun', 'moon', 'venus', 'mars', 'mercury', 'jupiter', 'saturn'].includes(o.key));
      return key.length ? `<ul class="plist">${key.map((o) => `<li>${o.glyph}︎ <span>${esc(cap(de(o.key, owner)))} tombe dans la <b>maison ${o.house}</b> de ${esc(host)} : ${esc(owner)} touche ${esc(host)} surtout ${root.Perso.HOUSE_P[o.house - 1]}.</span></li>`).join('')}</ul>` : '<p class="muted">Heure de naissance inconnue : superposition impossible.</p>';
    };

    const comp = syn.composite;
    return `
    <div class="synhead card">
      <div class="sp1">${avatar(p1)}<div><b>${N1}</b><br><span class="small muted">☉︎ ${c1.bodies[0].sign.name} · ☽︎ ${c1.bodies[1].sign.name}${c1.noTime ? '' : ' · AS ' + c1.angles[0].sign.name}</span></div></div>
      <div class="ring" style="--v:${s}"><span>${s}</span><small>/100</small></div>
      <div class="sp1 r">${avatar(p2)}<div><b>${N2}</b><br><span class="small muted">☉︎ ${c2.bodies[0].sign.name} · ☽︎ ${c2.bodies[1].sign.name}${c2.noTime ? '' : ' · AS ' + c2.angles[0].sign.name}</span></div></div>
    </div>
    <div class="card"><h2>${verdict} ${H('score')}</h2><p>${vtxt}</p>
      ${best ? `<p><b>Le lien le plus fort :</b> ${esc(describe(best, n1, n2))}</p>` : ''}
      ${worst ? `<p><b>Le principal défi :</b> ${esc(describe(worst, n1, n2))}</p>` : ''}
      <p class="small muted">${goods.length} liens harmonieux · ${hards.length} liens de tension, parmi les aspects qui comptent (les aspects entre planètes lentes, communs à toute une génération, sont mis de côté).</p></div>

    <h2 class="sec">1. Vos thèmes côte à côte ${H('elementsCroises')}</h2>
    <div class="card scroll"><table class="tbl cmp"><thead><tr><th></th><th>${N1}</th><th>${N2}</th><th>Entre vous</th></tr></thead><tbody>
      ${row('Soleil', 'sun', 'soleil')}${row('Lune', 'moon', 'lune')}${row('Ascendant', 'asc', 'ascendant')}${row('Mercure', 'mercury', 'aspects')}${row('Vénus', 'venus', 'aspects')}${row('Mars', 'mars', 'aspects')}
      <tr><th>Élément dominant ${H('elements')}</th><td>${I().elements[c1.stats.domEl[0][0]].name}</td><td>${I().elements[c2.stats.domEl[0][0]].name}</td><td class="small">${(() => { const [rl, rk] = relEl(c1.stats.domEl[0][0], c2.stats.domEl[0][0]); return rk === 'same' ? 'Même tempérament de base.' : rk === 'comp' ? 'Tempéraments complémentaires.' : 'Tempéraments ' + rl + ' : chacun apporte ce qui manque à l’autre.'; })()}</td></tr>
    </tbody></table><p class="small muted">●● même élément · ●○ éléments complémentaires (Feu–Air, Terre–Eau) · ○○ éléments différents</p></div>

    <h2 class="sec">2. Domaine par domaine</h2>
    <div class="card doms">${Object.keys(DOM).map(domCard).join('')}</div>

    <h2 class="sec">3. Ce qui vous rapproche ${H('aspects')}</h2>
    <div class="card"><ul class="sxl">${goods.slice(0, 6).map((a) => aspectItem(a, n1, n2)).join('') || '<p class="muted">Pas de lien harmonieux marquant.</p>'}</ul></div>

    <h2 class="sec">4. Ce qui peut coincer</h2>
    <div class="card"><ul class="sxl">${hards.slice(0, 6).map((a) => aspectItem(a, n1, n2)).join('') || '<p class="muted">Pas de tension marquante.</p>'}</ul>
      <p class="small muted">Une tension n’est pas une incompatibilité : c’est souvent là que se trouvent l’attirance et la croissance.</p></div>

    <h2 class="sec">5. Où chacun touche l’autre ${H('superposition')}</h2>
    <div class="grid2"><div class="card"><h3>${N2} dans la vie de ${N1}</h3>${ovl(syn.overlay, n2, n1)}</div><div class="card"><h3>${N1} dans la vie de ${N2}</h3>${ovl(syn.overlay2, n1, n2)}</div></div>

    <h2 class="sec">6. Votre relation comme une personne ${H('composite')}</h2>
    <div class="card"><p>Le Soleil de votre relation est en <b>${comp[0].sign.name}</b> : ensemble, vous formez un duo ${I().signs[comp[0].sign.key].adj}. Sa Lune en <b>${comp[1].sign.name}</b> montre ce dont le couple a besoin pour se sentir bien : ${I().signs[comp[1].sign.key].kw}. Sa Vénus en <b>${comp[3].sign.name}</b> décrit votre façon de vous aimer : de manière ${I().signs[comp[3].sign.key].adj}.</p>
      <details><summary>Positions du thème composite</summary><div class="chips">${comp.filter((b) => E().PMAP[b.key].body).map((b) => `<span class="chip">${b.glyph}︎ ${b.name} ${b.sign.glyph}︎ ${E().fmtDeg(b.lon, false)}</span>`).join('')}</div></details></div>

    <details class="card"><summary><b>Pour aller plus loin :</b> la bi-roue et la liste complète des ${syn.aspects.length} aspects</summary>
      <div class="split" style="margin-top:1rem"><div>${C().wheel(c2, { outer: c1, aspects: syn.aspects })}<p class="muted small">Intérieur : ${N2} · extérieur : ${N1}.</p></div>
      <div><ul class="asplist">${syn.aspects.map((a) => `<li><span class="ag" style="color:${C().ASPC[a.nature]}">${a.ag}︎ ${a.glyph} ${a.bg}︎</span><div class="small">${esc(de(a.a, n1))} ${a.name.toLowerCase()} ${esc(de(a.b, n2))} <span class="muted">· orbe ${a.orb.toFixed(1)}°</span></div></li>`).join('')}</ul></div></div></details>`;
  }

  root.SynView = { render, describe };
})(window);
