/* Mélastro — bibliothèque d'interprétations (français) */
(function (root) {
  'use strict';
  const T = {};

  T.signs = {
    ari: { kw: 'élan, courage, spontanéité', txt: 'Le Bélier ouvre le zodiaque : c’est l’énergie du commencement, l’impulsion pure. Direct, enthousiaste et combatif, il agit avant de réfléchir et aime relever les défis. Son écueil : l’impatience et la colère vite allumée, vite éteinte.', adj: 'fougueuse, directe et entreprenante' },
    tau: { kw: 'stabilité, sensualité, persévérance', txt: 'Le Taureau incarne la fertilité et l’enracinement. Patient, fidèle, attaché au confort et aux plaisirs des sens, il construit lentement mais solidement. Son écueil : l’entêtement et la peur du changement.', adj: 'calme, sensuelle et constante' },
    gem: { kw: 'curiosité, échange, mobilité', txt: 'Les Gémeaux vivent par l’esprit et la parole. Vifs, drôles, adaptables, ils collectionnent les idées, les rencontres et les informations. Leur écueil : la dispersion et une certaine inconstance.', adj: 'vive, curieuse et communicative' },
    can: { kw: 'sensibilité, protection, mémoire', txt: 'Le Cancer est le signe du foyer, de la famille et des racines. Tendre, intuitif et protecteur, il ressent tout intensément et se souvient de tout. Son écueil : la susceptibilité et le repli dans sa carapace.', adj: 'sensible, protectrice et intuitive' },
    leo: { kw: 'rayonnement, créativité, générosité', txt: 'Le Lion veut briller et faire briller. Chaleureux, loyal, créatif et fier, il a le sens du spectacle et du cœur. Son écueil : l’orgueil et le besoin d’être admiré.', adj: 'rayonnante, généreuse et fière' },
    vir: { kw: 'analyse, service, précision', txt: 'La Vierge trie, ordonne, perfectionne. Méthodique, serviable, attentive aux détails et à la santé, elle aime être utile. Son écueil : l’anxiété, la critique et le perfectionnisme.', adj: 'précise, réfléchie et serviable' },
    lib: { kw: 'harmonie, relation, esthétique', txt: 'La Balance cherche l’équilibre et la beauté. Diplomate, charmante, sociable, elle vit à travers la relation à l’autre et a un sens aigu de la justice. Son écueil : l’indécision et la peur du conflit.', adj: 'harmonieuse, diplomate et raffinée' },
    sco: { kw: 'intensité, transformation, profondeur', txt: 'Le Scorpion plonge sous la surface. Magnétique, passionné, lucide, il explore les mystères, le pouvoir et la renaissance. Son écueil : la jalousie, le contrôle et la rancune.', adj: 'intense, magnétique et pénétrante' },
    sag: { kw: 'expansion, idéal, aventure', txt: 'Le Sagittaire vise loin. Optimiste, franc, épris de liberté, de voyages et de sens, il cherche la vérité et aime la transmettre. Son écueil : l’excès, l’impatience et l’arrogance moralisatrice.', adj: 'optimiste, aventureuse et franche' },
    cap: { kw: 'ambition, structure, endurance', txt: 'Le Capricorne gravit la montagne pas à pas. Sérieux, responsable, ambitieux et endurant, il bâtit pour durer. Son écueil : la froideur apparente, la rigidité et le pessimisme.', adj: 'ambitieuse, structurée et persévérante' },
    aqu: { kw: 'originalité, liberté, fraternité', txt: 'Le Verseau regarde vers l’avenir. Indépendant, inventif, humaniste, il valorise l’amitié, les idées nouvelles et le collectif. Son écueil : le détachement émotionnel et l’esprit de contradiction.', adj: 'originale, indépendante et visionnaire' },
    pis: { kw: 'empathie, imagination, spiritualité', txt: 'Les Poissons dissolvent les frontières. Compatissants, rêveurs, artistes et intuitifs, ils perçoivent l’invisible. Leur écueil : la fuite, la confusion et la difficulté à poser des limites.', adj: 'rêveuse, empathique et inspirée' },
  };

  T.planets = {
    sun: { role: 'l’identité profonde, la volonté, ce qui fait briller', short: 'identité' },
    moon: { role: 'les émotions, les besoins intimes, la sensibilité et le rapport à la mère', short: 'émotions' },
    mercury: { role: 'la pensée, la communication et la manière d’apprendre', short: 'intellect' },
    venus: { role: 'l’amour, le goût, la séduction et ce qui procure du plaisir', short: 'amour' },
    mars: { role: 'l’action, le désir, l’énergie et la façon de s’affirmer', short: 'action' },
    jupiter: { role: 'l’expansion, la chance, la confiance et la quête de sens', short: 'expansion' },
    saturn: { role: 'la structure, les limites, la maturité et les leçons de vie', short: 'structure' },
    uranus: { role: 'l’originalité, le besoin de liberté et les ruptures soudaines', short: 'liberté' },
    neptune: { role: 'l’idéal, l’imaginaire, la spiritualité et les illusions', short: 'rêve' },
    pluto: { role: 'la transformation profonde, le pouvoir et les renaissances', short: 'transformation' },
    node: { role: 'la direction d’évolution, ce vers quoi l’âme est appelée à grandir', short: 'destinée' },
    snode: { role: 'les acquis et les automatismes qu’il s’agit de dépasser', short: 'acquis' },
    lilith: { role: 'la part sauvage, les désirs refoulés, ce qui refuse de se soumettre', short: 'part sauvage' },
    fortune: { role: 'le point de bien-être et d’épanouissement naturel', short: 'bonheur' },
  };

  T.houses = [
    { n: 1, name: 'Maison I', kw: 'la personnalité, l’apparence, la façon d’aborder la vie' },
    { n: 2, name: 'Maison II', kw: 'les ressources, l’argent, les valeurs et l’estime de soi' },
    { n: 3, name: 'Maison III', kw: 'la communication, les frères et sœurs, l’entourage proche, les études courtes' },
    { n: 4, name: 'Maison IV', kw: 'le foyer, la famille, les racines et la vie intérieure' },
    { n: 5, name: 'Maison V', kw: 'la créativité, les amours, le plaisir, les enfants' },
    { n: 6, name: 'Maison VI', kw: 'le quotidien, le travail, la santé et le service' },
    { n: 7, name: 'Maison VII', kw: 'le couple, les associations, les relations engagées' },
    { n: 8, name: 'Maison VIII', kw: 'les crises, la sexualité, les héritages, les transformations' },
    { n: 9, name: 'Maison IX', kw: 'les voyages, la philosophie, les études supérieures, la spiritualité' },
    { n: 10, name: 'Maison X', kw: 'la carrière, la réputation, la vocation et l’accomplissement' },
    { n: 11, name: 'Maison XI', kw: 'les amitiés, les projets, les groupes et les espoirs' },
    { n: 12, name: 'Maison XII', kw: 'l’inconscient, la solitude, l’épreuve et la vie spirituelle' },
  ];

  T.aspects = {
    conj: 'fusionne les énergies : elles agissent ensemble, pour le meilleur comme pour le pire',
    opp: 'met les énergies face à face : tension, projection sur l’autre, recherche d’équilibre',
    tri: 'fait circuler les énergies avec aisance : un talent naturel, parfois tenu pour acquis',
    sq: 'crée une friction dynamique : un défi qui pousse à agir et à évoluer',
    sext: 'offre une opportunité harmonieuse, qui demande un petit effort pour s’exprimer',
    quinc: 'demande un ajustement permanent entre deux énergies qui ne se comprennent pas',
    ssext: 'relie discrètement deux énergies voisines',
    ssq: 'génère une petite irritation, un aiguillon',
    sesq: 'produit une tension sourde qui cherche une issue',
  };

  T.elements = {
    feu: { name: 'Feu', txt: 'enthousiasme, action, confiance, inspiration' },
    terre: { name: 'Terre', txt: 'réalisme, concret, patience, sens pratique' },
    air: { name: 'Air', txt: 'idées, communication, sociabilité, recul' },
    eau: { name: 'Eau', txt: 'émotion, intuition, empathie, imaginaire' },
  };
  T.modes = {
    cardinal: { name: 'Cardinal', txt: 'initier, lancer, impulser' },
    fixe: { name: 'Fixe', txt: 'stabiliser, maintenir, approfondir' },
    mutable: { name: 'Mutable', txt: 'adapter, transmettre, transformer' },
  };

  T.retro = 'Rétrograde : l’énergie de la planète se tourne vers l’intérieur, elle se vit de façon plus introspective, décalée ou à retardement.';

  T.moonPhases = {
    'Nouvelle Lune': 'Né(e) à la Nouvelle Lune : tempérament instinctif, tourné vers le nouveau, qui agit par élan subjectif.',
    'Premier croissant': 'Premier croissant : besoin de s’affranchir du passé et de s’affirmer, énergie de croissance.',
    'Premier quartier': 'Premier quartier : esprit de décision et d’action, goût pour les défis et la construction.',
    'Lune gibbeuse croissante': 'Gibbeuse croissante : perfectionnisme, besoin d’analyser et d’améliorer.',
    'Pleine Lune': 'Pleine Lune : grande conscience de l’autre et des relations, tiraillement fécond entre deux pôles.',
    'Lune gibbeuse décroissante': 'Gibbeuse décroissante : âme de transmetteur, besoin de partager ce qui a été compris.',
    'Dernier quartier': 'Dernier quartier : remise en question, réorientation, capacité à tourner la page.',
    'Dernier croissant': 'Dernier croissant : sagesse, intuition, sens du passage et de la fin des cycles.',
  };

  T.dignity = {
    dom: 'en domicile : elle s’exprime avec naturel et puissance',
    exa: 'en exaltation : elle donne le meilleur d’elle-même, avec éclat',
    exil: 'en exil : elle s’exprime de façon moins naturelle, ce qui demande de l’adaptation',
    chute: 'en chute : son expression est fragilisée et demande à être consciemment travaillée',
  };

  const E = () => root.Engine;

  T.planetText = function (b, noTime) {
    const s = T.signs[b.sign.key], p = T.planets[b.key];
    let t = `${b.name} en ${b.sign.name} : ${p.role.charAt(0).toUpperCase() + p.role.slice(1)} s’exprime de manière ${s.adj} (${s.kw}).`;
    if (!noTime && b.house) t += ` En maison ${b.house}, cette énergie s’investit dans ${T.houses[b.house - 1].kw}.`;
    if (b.dignity) t += ` La planète est ${T.dignity[b.dignity.key]}.`;
    if (b.retro && E().PMAP[b.key].body && b.key !== 'sun' && b.key !== 'moon') t += ' ' + T.retro;
    return t;
  };

  T.bigThree = function (ch) {
    const sun = ch.bodies[0], moon = ch.bodies[1], asc = ch.angles[0];
    const out = [];
    out.push({ title: `Soleil en ${sun.sign.name} ${sun.sign.glyph}`, txt: T.signs[sun.sign.key].txt });
    out.push({ title: `Lune en ${moon.sign.name} ${moon.sign.glyph}`, txt: `Sur le plan émotionnel, la Lune en ${moon.sign.name} indique une sensibilité ${T.signs[moon.sign.key].adj}. Pour se sentir en sécurité, cette personne a besoin de ${({ feu: 'mouvement, de reconnaissance et de spontanéité', terre: 'stabilité, de confort matériel et de routines rassurantes', air: 'dialogue, de liberté et de stimulation intellectuelle', eau: 'tendresse, d’intimité et de liens profonds' })[moon.sign.element]}.` });
    if (!ch.noTime) out.push({ title: `Ascendant ${asc.sign.name} ${asc.sign.glyph}`, txt: `L’Ascendant décrit la façon d’entrer en contact avec le monde et la première impression laissée. Ici, une allure ${T.signs[asc.sign.key].adj}. Maître de l’Ascendant : ${E().PMAP[asc.sign.ruler].name}, planète qui colore toute la personnalité.` });
    return out;
  };

  T.aspectText = function (a) {
    return `${a.an} ${a.name.toLowerCase()} ${a.bn} : l’aspect ${T.aspects[a.key]}. Il relie ${(T.planets[a.a] || { short: a.an }).short} et ${(T.planets[a.b] || { short: a.bn }).short}.`;
  };

  T.synText = function (a, n1, n2) {
    const nat = a.nature === 'fluide' ? 'harmonie' : a.nature === 'tendu' ? 'défi' : 'fusion';
    const p1 = (T.planets[a.a] || { short: a.an }).short, p2 = (T.planets[a.b] || { short: a.bn }).short;
    return `${a.an} de ${n1} ${a.name.toLowerCase()} ${a.bn} de ${n2} — ${nat} entre ${p1} et ${p2}.`;
  };

  T.elementSummary = function (st) {
    const [e1] = st.domEl, low = st.domEl[st.domEl.length - 1];
    return `Dominante ${T.elements[e1[0]].name} (${T.elements[e1[0]].txt}). Élément le plus faible : ${T.elements[low[0]].name}${low[1] < 2 ? ', presque absent — une qualité à cultiver consciemment' : ''}. Mode dominant : ${T.modes[st.domMo[0][0]].name} (${T.modes[st.domMo[0][0]].txt}).`;
  };

  T.transitText = function (a) {
    const verb = a.nature === 'fluide' ? 'soutient' : a.nature === 'tendu' ? 'met à l’épreuve' : 'active fortement';
    return `${a.an} en transit ${verb} votre ${a.bn} natal(e) (${a.name.toLowerCase()}, orbe ${a.orb.toFixed(1)}°${a.applying === true ? ', en approche' : a.applying === false ? ', en séparation' : ''}).`;
  };

  root.Interp = T;
})(typeof window !== 'undefined' ? window : globalThis);
