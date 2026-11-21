/* Mélastro — quiz : apprendre l'astrologie & quiz sur soi-même */
(function (root) {
  'use strict';
  const App = () => root.App, E = () => root.Engine, C = () => root.Charts, I = () => root.Interp, PS = () => root.Perso;
  const H = (k) => root.Help.H(k);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const F = (t) => t + '︎';

  /* ---------- Quiz d'apprentissage ---------- */
  const DATES = ['21 mars – 19 avril', '20 avril – 20 mai', '21 mai – 20 juin', '21 juin – 22 juillet', '23 juillet – 22 août', '23 août – 22 septembre', '23 septembre – 22 octobre', '23 octobre – 21 novembre', '22 novembre – 21 décembre', '22 décembre – 19 janvier', '20 janvier – 18 février', '19 février – 20 mars'];
  function genQ() {
    const S = E().SIGNS, P = E().PLANETS.filter((p) => p.body || p.key === 'chiron'), A = E().ASPECTS.filter((a) => a.major);
    const gens = [
      () => { const s = pick(S); return { q: `Quel signe est représenté par le symbole <span class="qg">${F(s.glyph)}</span> ?`, ok: s.name, opts: S.map((x) => x.name), ex: `${F(s.glyph)} est le symbole du ${s.name}.` }; },
      () => { const s = pick(S); return { q: `À quel élément appartient le <b>${s.name}</b> ?`, ok: I().elements[s.element].name, opts: ['Feu', 'Terre', 'Air', 'Eau'], ex: `Le ${s.name} est un signe ${s.element === 'eau' ? 'd’Eau' : s.element === 'air' ? 'd’Air' : 'de ' + I().elements[s.element].name} : ${I().elements[s.element].txt}.` }; },
      () => { const s = pick(S); return { q: `Quelle planète gouverne le <b>${s.name}</b> ?`, ok: E().PMAP[s.ruler].name, opts: P.map((x) => x.name), ex: `Le ${s.name} est gouverné par ${E().PMAP[s.ruler].name}${s.ruler2 ? ` (et traditionnellement ${E().PMAP[s.ruler2].name})` : ''}.` }; },
      () => { const p = pick(P); return { q: `Quel astre est représenté par <span class="qg">${F(p.glyph)}</span> ?`, ok: p.name, opts: P.map((x) => x.name), ex: `${F(p.glyph)} = ${p.name} : ${I().planets[p.key].role}.` }; },
      () => { const p = pick(P.filter((x) => x.key !== 'chiron')); return { q: `Que représente <b>${p.name}</b> dans un thème ?`, ok: I().planets[p.key].role, opts: P.filter((x) => x.key !== 'chiron').map((x) => I().planets[x.key].role), ex: `${p.name} représente ${I().planets[p.key].role}.` }; },
      () => { const a = pick(A); return { q: `Quel angle forme un <b>${a.name.toLowerCase()}</b> ?`, ok: a.angle + '°', opts: A.map((x) => x.angle + '°'), ex: `Un ${a.name.toLowerCase()} = ${a.angle}° : il ${I().aspects[a.key]}.` }; },
      () => { const a = pick(A); return { q: `Le symbole <span class="qg">${a.glyph}</span> désigne…`, ok: a.name, opts: A.map((x) => x.name), ex: `${a.glyph} = ${a.name} (${a.angle}°).` }; },
      () => { const h = pick(I().houses); return { q: `Quelle maison parle de <b>${h.kw}</b> ?`, ok: h.name, opts: I().houses.map((x) => x.name), ex: `C’est la ${h.name}.` }; },
      () => { const i = Math.floor(Math.random() * 12); return { q: `Quel est le signe opposé au <b>${S[i].name}</b> ?`, ok: S[(i + 6) % 12].name, opts: S.map((x) => x.name), ex: `Sur la roue, le ${S[(i + 6) % 12].name} fait face au ${S[i].name} : deux signes complémentaires.` }; },
      () => { const i = Math.floor(Math.random() * 12); return { q: `Quel signe couvre à peu près la période du <b>${DATES[i]}</b> ?`, ok: S[i].name, opts: S.map((x) => x.name), ex: `Le Soleil traverse le ${S[i].name} du ${DATES[i]} (les dates varient d’un jour selon les années).` }; },
      () => { const s = pick(S); return { q: `Le <b>${s.name}</b> est un signe…`, ok: I().modes[s.mode].name, opts: ['Cardinal', 'Fixe', 'Mutable'], ex: `Le ${s.name} est ${I().modes[s.mode].name.toLowerCase()} : ${I().modes[s.mode].txt}.` }; },
      () => { const ks = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn']; const k = pick(ks); const d = E().DIGNITIES[k]; const sk = pick(d.dom); const s = S.find((x) => x.key === sk); return { q: `Dans quel signe <b>${E().PMAP[k].name}</b> est-elle « en domicile » (chez elle) ?`, ok: s.name, opts: S.map((x) => x.name), ex: `${E().PMAP[k].name} est en domicile en ${d.dom.map((x) => S.find((y) => y.key === x).name).join(' et ')}.` }; },
    ];
    const g = pick(gens)();
    const wrong = shuffle([...new Set(g.opts.filter((o) => o !== g.ok))]).slice(0, 3);
    return { ...g, opts: shuffle([g.ok, ...wrong]) };
  }
  let LQ = null;
  function learnStart() { LQ = { qs: Array.from({ length: 10 }, genQ), i: 0, score: 0, answered: false }; }

  /* ---------- Quiz sur soi ---------- */
  const QE = [
    ['Ton week-end idéal ?', { feu: 'Une aventure, du sport, de l’imprévu', terre: 'Un bon repas, la nature, du repos', air: 'Voir des amis, discuter, découvrir une expo', eau: 'Un cocon avec mes proches, un film qui émeut' }],
    ['Face à un problème, tu…', { feu: 'fonces et agis tout de suite', terre: 'cherches une solution concrète, étape par étape', air: 'analyses et en parles autour de toi', eau: 'écoutes ton intuition et ce que tu ressens' }],
    ['Ce qui te fait le plus de bien ?', { feu: 'Relever un défi', terre: 'Sentir que tout est en ordre et stable', air: 'Apprendre quelque chose de nouveau', eau: 'Un moment de vraie connexion avec quelqu’un' }],
    ['On te reproche parfois…', { feu: 'de foncer sans réfléchir', terre: 'de manquer de souplesse', air: 'd’être trop dans ta tête', eau: 'd’être trop sensible' }],
    ['En amour, ce qui compte le plus ?', { feu: 'La passion', terre: 'La fidélité et la stabilité', air: 'La complicité et les échanges', eau: 'La tendresse et l’intimité' }],
    ['Ton rapport à l’argent ?', { feu: 'Je dépense pour vivre des expériences', terre: 'J’épargne et je construis', air: 'J’y pense peu, ça va, ça vient', eau: 'Je dépense pour faire plaisir ou me réconforter' }],
    ['Dans un groupe, tu es plutôt…', { feu: 'la personne qui entraîne les autres', terre: 'la personne sur qui on peut compter', air: 'la personne qui fait circuler les idées', eau: 'la personne qui écoute et réconforte' }],
    ['Ton endroit rêvé ?', { feu: 'Un lieu plein de soleil et d’énergie', terre: 'Une maison à la campagne', air: 'Une ville animée', eau: 'Le bord de mer' }],
  ];
  const QM = [
    ['Face au changement…', { cardinal: 'je le provoque', fixe: 'je préfère la stabilité', mutable: 'je m’adapte facilement' }],
    ['Dans un projet, tu préfères…', { cardinal: 'le lancer', fixe: 'le mener jusqu’au bout', mutable: 'l’ajuster et l’améliorer en route' }],
    ['Tes amis diraient que tu es…', { cardinal: 'un moteur', fixe: 'un roc', mutable: 'un caméléon' }],
    ['Ton petit défaut ?', { cardinal: 'Commencer plein de choses', fixe: 'L’entêtement', mutable: 'L’éparpillement' }],
  ];
  function buildSelf(p, ch) {
    const qs = [];
    QE.forEach(([q, o]) => qs.push({ type: 'el', q, opts: shuffle(Object.entries(o)) }));
    QM.forEach(([q, o]) => qs.push({ type: 'mo', q, opts: shuffle(Object.entries(o)) }));
    const sun = ch.bodies[0].sign, moon = ch.bodies[1].sign, asc = ch.noTime ? null : ch.angles[0].sign;
    const used = [sun.key, moon.key, asc && asc.key];
    const decoy = shuffle(E().SIGNS.filter((s) => !used.includes(s.key)));
    const parts = [['sun', sun], ['moon', moon]].concat(asc ? [['asc', asc]] : []);
    const portrait = (s) => `Une personnalité ${I().signs[s.key].adj}, portée par ${I().signs[s.key].kw.replace(/, ([^,]+)$/, ' et $1')}.`;
    qs.push({ type: 'big', q: 'Quelle description te ressemble le plus ?', opts: shuffle(parts.map(([k, s]) => [k, portrait(s)]).concat([['decoy', portrait(decoy[0])]])) });
    const need = (sk) => { const t = PS().planetReading({ ...ch.bodies[1], sign: E().SIGNS.find((x) => x.key === sk), house: null, dignity: null, retro: false }, { noTime: true }, 'X').perso; return t.replace(/^Pour se sentir bien, X a besoin /, '').replace(/^./, (c) => c.toUpperCase()); };
    const anim = () => { const t = PS().planetReading({ ...ch.bodies[0], house: null, dignity: null, retro: false }, { noTime: true }, 'X').perso; return 'Avant tout : ' + t.replace(/^Ce qui anime X, c’est /, '').replace(/X/g, 'on'); };
    qs.push({ type: 'big2', q: 'Au fond de toi, tu as surtout besoin…', opts: shuffle([['moon', need(moon.key)], ['sun', anim()], ['decoy', need(decoy[1].key)]]) });
    const top = ch.stats.ranking.slice(0, 2).map((x) => x[0]);
    const other = shuffle(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].filter((k) => !top.includes(k))).slice(0, 2);
    qs.push({ type: 'dom', q: 'Quelle énergie te parle le plus ?', opts: shuffle(top.concat(other).map((k) => [k, I().dominant[k].txt])) });
    return qs;
  }
  let SQ = null;

  function selfResult(p, ch, ans) {
    const el = { feu: 0, terre: 0, air: 0, eau: 0 }, mo = { cardinal: 0, fixe: 0, mutable: 0 };
    ans.forEach((a) => { if (a.type === 'el') el[a.v]++; if (a.type === 'mo') mo[a.v]++; });
    const big = ans.find((a) => a.type === 'big'), big2 = ans.find((a) => a.type === 'big2'), dom = ans.find((a) => a.type === 'dom');
    const st = ch.stats; const tot = Object.values(st.el).reduce((a, b) => a + b, 0), mtot = Object.values(st.mo).reduce((a, b) => a + b, 0);
    return { date: new Date().toISOString().slice(0, 10), el, mo, big: big && big.v, big2: big2 && big2.v, dom: dom && dom.v, chartEl: Object.fromEntries(Object.entries(st.el).map(([k, v]) => [k, Math.round(v / tot * 100)])), chartMo: Object.fromEntries(Object.entries(st.mo).map(([k, v]) => [k, Math.round(v / mtot * 100)])) };
  }
  function renderResult(p, ch, r) {
    const N = esc(p.name);
    const selfEl = Object.fromEntries(Object.entries(r.el).map(([k, v]) => [k, Math.round(v / 8 * 100)]));
    const selfMo = Object.fromEntries(Object.entries(r.mo).map(([k, v]) => [k, Math.round(v / 4 * 100)]));
    const topSelf = Object.entries(selfEl).sort((a, b) => b[1] - a[1])[0][0], topChart = Object.entries(r.chartEl).sort((a, b) => b[1] - a[1])[0][0];
    const lowChart = Object.entries(r.chartEl).sort((a, b) => a[1] - b[1])[0][0];
    const twin = (label, a, b, keys, names, colors) => `<div class="twin"><div class="tw-h"><span></span><span>Tes réponses</span><span>Ton thème</span></div>${keys.map((k) => `<div class="tw-r"><span>${names[k]}</span><div class="hb-t"><div class="hb-f" style="width:${a[k]}%;background:${colors ? colors[k] : 'var(--gold)'}"></div></div><div class="hb-t"><div class="hb-f" style="width:${b[k]}%;background:${colors ? colors[k] : 'var(--accent)'}"></div></div></div>`).join('')}</div>`;
    const ELN = { feu: 'Feu', terre: 'Terre', air: 'Air', eau: 'Eau' }, MON = { cardinal: 'Cardinal', fixe: 'Fixe', mutable: 'Mutable' };
    const sun = ch.bodies[0].sign.name, moon = ch.bodies[1].sign.name, asc = ch.noTime ? null : ch.angles[0].sign.name;
    const bigTxt = { sun: `Tu t’es reconnu·e dans la description de ton <b>Soleil en ${sun}</b> : tu vis en accord avec ton identité profonde, ton signe « officiel » te ressemble vraiment.`, moon: `Tu t’es reconnu·e dans ta <b>Lune en ${moon}</b> : ta vie émotionnelle prend beaucoup de place. C’est très fréquent chez les personnes qui ne se retrouvent pas dans leur signe solaire !`, asc: `Tu t’es reconnu·e dans ton <b>Ascendant ${asc}</b> : c’est la façon dont tu te montres au monde, celle que les autres voient en premier.`, decoy: `La description que tu as choisie ne correspond ni à ton Soleil, ni à ta Lune, ni à ton Ascendant. Regarde tes planètes dominantes et les signes très occupés de ton thème : c’est souvent là que se cache cette facette.` };
    return `<div class="card"><h2>Ce que ton thème dit de toi… et ce que tu en dis ${H('elements')}</h2>
      <h3>Les éléments</h3>${twin('', selfEl, r.chartEl, ['feu', 'terre', 'air', 'eau'], ELN, C().ELC)}
      <p>${topSelf === topChart ? `✦ Parfaite cohérence : tu te sens surtout <b>${ELN[topSelf]}</b>, et c’est aussi l’élément dominant de ton thème. Tu vis pleinement ton tempérament.` : `Tu te sens surtout <b>${ELN[topSelf]}</b>, alors que ton thème met en avant l’élément <b>${ELN[topChart]}</b>. ${I().elements[topChart].txt.charAt(0).toUpperCase() + I().elements[topChart].txt.slice(1)} : ces qualités sont en toi, peut-être pas encore pleinement exprimées${r.chartEl[topSelf] < 15 ? `. Et l’élément ${ELN[topSelf]}, peu présent dans ton thème, est sans doute une qualité que tu as développée par toi-même` : ''}.`}</p>
      ${selfEl[lowChart] >= 25 ? `<p>Intéressant : l’élément <b>${ELN[lowChart]}</b> est le plus faible de ton thème, mais tu le revendiques. On compense souvent consciemment ce qui nous manque !</p>` : ''}
      <h3>Les modes ${H('modes')}</h3>${twin('', selfMo, r.chartMo, ['cardinal', 'fixe', 'mutable'], MON)}
      <h3>Ta facette dominante ${H('theme')}</h3><p>${bigTxt[r.big] || ''}</p>
      ${r.big2 ? `<p>${r.big2 === 'moon' ? `Ton besoin intime correspond à ta <b>Lune en ${moon}</b> : tu connais bien ta sensibilité.` : r.big2 === 'sun' ? `Tu as répondu avec ton <b>Soleil</b> plutôt qu’avec ta Lune : tu te définis par ce qui t’anime plus que par tes émotions.` : `Ton besoin intime n’est pas celui de ta Lune en ${moon} : ta part émotionnelle est peut-être un peu en sommeil, ou exprimée autrement.`}</p>` : ''}
      ${r.dom ? `<p>${ch.stats.ranking.slice(0, 2).some((x) => x[0] === r.dom) ? `L’énergie qui te parle le plus, <b>${E().PMAP[r.dom].name}</b>, fait partie de tes planètes dominantes : tu es bien un type ${I().dominant[r.dom].type.toLowerCase()} !` : `Tu as choisi l’énergie de <b>${E().PMAP[r.dom].name}</b>, alors que ta planète dominante est <b>${E().PMAP[ch.stats.ranking[0][0]].name}</b> (type ${I().dominant[ch.stats.ranking[0][0]].type.toLowerCase()}). Une piste à explorer dans l’onglet Dominantes.`}</p>` : ''}
      <p class="small muted">Quiz fait le ${App().fmtDate(r.date)}. Ce n’est pas un test psychologique : c’est un miroir pour mieux comprendre ton thème.</p>
      <div class="row wrap"><button class="btn" data-act="qself" data-id="${p.id}">Refaire le quiz</button><a class="btn" href="#/profil/${p.id}/dominantes">Voir les dominantes</a><a class="btn" href="#/profil/${p.id}/lecture">Lire mon thème</a></div></div>`;
  }

  function tabQuizMoi(p, ch) {
    if (SQ && SQ.pid === p.id) {
      if (SQ.i >= SQ.qs.length) { const r = selfResult(p, ch, SQ.ans); p.selfQuiz = r; App().save(); SQ = null; return renderResult(p, ch, r); }
      const q = SQ.qs[SQ.i];
      return `<div class="card quiz"><div class="qprog"><div style="width:${SQ.i / SQ.qs.length * 100}%"></div></div><p class="small muted">Question ${SQ.i + 1} / ${SQ.qs.length} · réponds spontanément, comme ${esc(p.name)}</p><h2>${q.q}</h2><div class="qopts">${q.opts.map(([k, t]) => `<button class="qo" data-act="qsans" data-id="${p.id}" data-v="${k}">${esc(t)}</button>`).join('')}</div></div>`;
    }
    if (p.selfQuiz) return renderResult(p, ch, p.selfQuiz);
    return `<div class="card"><h2>Quiz sur moi 🔮</h2><p>15 questions sur ta façon d’être, sans rapport apparent avec l’astrologie. À la fin, Mélastro compare tes réponses à ton thème : ton élément ressenti face à ton élément astrologique, la facette de toi qui résonne le plus (Soleil, Lune ou Ascendant), ta planète dominante…</p><p class="small muted">Idéal pour comprendre ton profil et découvrir ce qui, dans ton thème, te ressemble le plus.</p><button class="btn primary" data-act="qself" data-id="${p.id}">Commencer</button></div>`;
  }

  function viewQuiz(mode) {
    const P = App().state.profiles;
    const head = `<section class="hero"><div><h1>Quiz</h1><p class="sub">Apprendre l’astrologie en jouant, ou se découvrir à travers son thème.</p></div></section>
      <nav class="tabs"><a href="#/quiz" class="${!mode ? 'on' : ''}">Apprendre</a><a href="#/quiz/moi" class="${mode === 'moi' ? 'on' : ''}">Quiz sur moi</a></nav>`;
    if (mode === 'moi') return head + (P.length ? `<div class="card"><h3>Qui fait le quiz ?</h3><div class="chips">${P.map((p) => `<a class="chip" href="#/profil/${p.id}/quizmoi">${esc(p.name)}${p.selfQuiz ? ' ✓' : ''}</a>`).join('')}</div><p class="small muted">Le quiz se fait depuis le profil de la personne. Crée d’abord ton propre profil dans le carnet si besoin.</p></div>` : '<div class="card"><p>Crée d’abord ton profil dans le carnet.</p><button class="btn primary" data-act="new">Créer mon profil</button></div>');
    if (!LQ) return head + `<div class="card"><h2>Devine le signe ✨</h2><p>10 questions tirées au hasard : symboles des signes et des planètes, éléments, maîtrises, aspects, maisons, dates… Chaque réponse est expliquée.</p>${best()}<button class="btn primary" data-act="qlearn">Commencer</button></div>`;
    if (LQ.i >= LQ.qs.length) {
      const s = App().state.settings; s.quizBest = Math.max(s.quizBest || 0, LQ.score); App().save();
      const sc = LQ.score; LQ = null;
      return head + `<div class="card quiz"><h2>${sc >= 9 ? '🏆 Astrologue confirmée !' : sc >= 7 ? '🌟 Très bien !' : sc >= 4 ? '🌙 Pas mal !' : '🌱 C’est un début !'}</h2><p class="big">${sc} / 10</p>${best()}<button class="btn primary" data-act="qlearn">Rejouer</button></div>`;
    }
    const q = LQ.qs[LQ.i];
    return head + `<div class="card quiz"><div class="qprog"><div style="width:${LQ.i * 10}%"></div></div><p class="small muted">Question ${LQ.i + 1} / 10 · score ${LQ.score}</p><h2>${q.q}</h2>
      <div class="qopts">${q.opts.map((o) => `<button class="qo ${LQ.answered ? (o === q.ok ? 'ok' : o === LQ.answered ? 'ko' : '') : ''}" data-act="qans" data-v="${esc(o)}" ${LQ.answered ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>
      ${LQ.answered ? `<div class="advice">${LQ.answered === q.ok ? '✅ Bravo !' : '❌ Raté.'} ${q.ex}</div><button class="btn primary" data-act="qnext">${LQ.i === 9 ? 'Voir le résultat' : 'Question suivante'}</button>` : ''}</div>`;
  }
  const best = () => { const b = App().state.settings.quizBest; return b ? `<p class="small muted">Meilleur score : ${b}/10</p>` : ''; };

  function act(a, b) {
    if (a === 'qlearn') { learnStart(); App().route(); return true; }
    if (a === 'qans') { LQ.answered = b.dataset.v; if (b.dataset.v === LQ.qs[LQ.i].ok) LQ.score++; App().route(); return true; }
    if (a === 'qnext') { LQ.i++; LQ.answered = false; App().route(); return true; }
    if (a === 'qself') { const p = App().getP(b.dataset.id); SQ = { pid: p.id, qs: buildSelf(p, App().chartOf(p)), i: 0, ans: [] }; location.hash = '#/profil/' + p.id + '/quizmoi'; App().route(); return true; }
    if (a === 'qsans') { const q = SQ.qs[SQ.i]; SQ.ans.push({ type: q.type, v: b.dataset.v }); SQ.i++; App().route(); return true; }
    return false;
  }

  const Fe = root.Features = root.Features || { views: {}, ptabs: {}, after: {} };
  Fe.views.quiz = viewQuiz;
  Fe.ptabs.quizmoi = tabQuizMoi;
  const prevAct = Fe.act;
  Object.defineProperty(Fe, 'act', { configurable: true, get: () => (a, b) => act(a, b) || (prevAct ? prevAct(a, b) : false), set: () => {} });
})(window);
