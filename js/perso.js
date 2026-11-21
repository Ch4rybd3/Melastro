/* Mélastro — lectures personnalisées (une phrase par planète et par signe) */
(function (root) {
  'use strict';
  const S = ['ari', 'tau', 'gem', 'can', 'leo', 'vir', 'lib', 'sco', 'sag', 'cap', 'aqu', 'pis'];
  const z = (arr) => Object.fromEntries(S.map((k, i) => [k, arr[i]]));

  const P = {};
  P.sun = { intro: 'Ce qui anime {N}, c’est ', by: z([
    'l’action et le défi : lancer des projets, prendre des initiatives, avancer sans attendre la permission.',
    'de construire quelque chose de solide et de beau : un cadre de vie stable, des plaisirs simples, des choses concrètes qui durent.',
    'd’apprendre, d’échanger et de bouger : les conversations, les découvertes, tout ce qui nourrit sa curiosité.',
    'de prendre soin et de créer un cocon : la famille, les proches et le chez-soi sont au cœur de son identité.',
    'de créer et de rayonner : mettre du cœur et de la générosité dans tout ce qui compte, et recevoir de la reconnaissance en retour.',
    'de se rendre utile et de bien faire les choses : améliorer, organiser, soigner les détails.',
    'l’harmonie et la relation : créer du lien, apaiser les tensions, s’entourer de beauté. {N} se construit beaucoup à travers les autres.',
    'l’intensité : aller au fond des choses, vivre des émotions vraies, se transformer à chaque épreuve.',
    'l’horizon : voyager, comprendre le monde, croire en quelque chose de plus grand et le partager.',
    'de bâtir et d’accomplir : se fixer des objectifs ambitieux et les atteindre pas à pas, avec sérieux.',
    'la liberté et les idées neuves : être soi-même sans se conformer, imaginer l’avenir, compter sur ses amis.',
    'la sensibilité et l’imaginaire : ressentir, rêver, aider, se relier à quelque chose qui dépasse le quotidien.',
  ]) };
  P.moon = { intro: 'Pour se sentir bien, {N} a besoin ', by: z([
    'd’action, de spontanéité et d’indépendance ; ses émotions sont vives, s’enflamment vite et retombent aussi vite.',
    'de calme, de confort et de stabilité ; un bon repas, un cadre doux et des personnes fiables suffisent à l’apaiser.',
    'de parler, d’échanger et de changer d’air ; mettre des mots sur ce qui est ressenti aide à digérer les émotions.',
    'de tendresse, de sécurité et d’un vrai chez-soi ; sa sensibilité est profonde et sa mémoire affective très forte.',
    'd’attention, de chaleur et de reconnaissance ; sentir qu’on l’apprécie lui donne confiance.',
    'd’ordre, de routines et de se sentir utile ; quand tout est à sa place, l’esprit peut enfin se reposer.',
    'd’harmonie et de bonnes relations ; les conflits pèsent lourd sur son moral, la paix autour de soi est essentielle.',
    'de relations profondes et sincères ; ses émotions sont intenses, rarement montrées, et sa confiance se gagne lentement.',
    'd’espace, d’aventure et d’optimisme ; la routine pèse, l’humour et les projets lui redonnent le moral.',
    'de structure et de maîtrise ; ses émotions sont souvent gardées pour soi, derrière une apparence solide.',
    'de liberté et d’amitié ; prendre du recul et garder son indépendance émotionnelle l’aide à se sentir bien.',
    'de douceur, de calme et de moments pour rêver ; les ambiances et les émotions des autres l’imprègnent facilement.',
  ]) };
  P.mercury = { intro: 'Côté tête, {N} ', by: z([
    'pense vite et parle franchement : va droit au but et aime débattre.',
    'réfléchit posément : apprend lentement mais retient tout, et préfère le concret aux théories.',
    'a l’esprit vif et curieux : aime parler, lire, apprendre plein de choses à la fois.',
    'pense avec le cœur et retient surtout ce qui l’a ému ; une excellente mémoire des souvenirs.',
    's’exprime avec chaleur et conviction, sait captiver un auditoire et défend ses idées avec panache.',
    'a un esprit précis et analytique : repère les détails et aime que les choses soient claires et logiques.',
    'pèse le pour et le contre, s’exprime avec tact et cherche toujours à comprendre les deux points de vue.',
    'a un esprit d’enquêteur : creuse, perce les secrets et ne se contente jamais des apparences.',
    'voit grand : aime les idées, les débats de fond et parle avec enthousiasme, parfois sans filtre.',
    'réfléchit de façon structurée et pragmatique, parle peu mais juste, et planifie sur le long terme.',
    'a des idées originales, pense en dehors des cadres et aime les sujets d’avenir et d’innovation.',
    'pense par images et intuitions plus que par logique ; une imagination riche, parfois un peu rêveuse.',
  ]) };
  P.venus = { intro: 'En amour, {N} ', by: z([
    'aime avec passion et spontanéité : le jeu de la séduction et les débuts enflammés l’attirent.',
    'cherche la stabilité, la fidélité et la tendresse ; l’amour passe par les sens, les gestes et les attentions concrètes.',
    'a besoin de complicité intellectuelle et de légèreté ; la séduction passe par les mots et l’humour.',
    'aime en protégeant et en prenant soin ; une relation rassurante, un vrai foyer, voilà l’idéal.',
    'aime avec générosité et panache, a besoin d’admiration et de beaux gestes romantiques.',
    'montre son amour par des attentions concrètes et des services rendus, plus que par de grandes déclarations.',
    'est dans son élément : la relation, l’élégance et l’harmonie à deux comptent énormément.',
    'aime intensément et totalement ; la passion, la loyauté et la profondeur ne se négocient pas.',
    'a besoin de liberté et d’aventure à deux ; partager des voyages, des rires et des idées nourrit l’amour.',
    's’engage avec sérieux et prudence ; l’amour se construit dans la durée et la confiance.',
    'a besoin d’un amour libre et complice, fondé sur l’amitié et le respect de l’indépendance de chacun.',
    'aime de façon romantique et dévouée, parfois idéalisée ; rêve d’un amour fusionnel et poétique.',
  ]) };
  P.mars = { intro: 'Pour agir, {N} ', by: z([
    'fonce avec énergie et courage ; la colère éclate vite mais ne dure pas.',
    'avance lentement mais sûrement, avec une endurance remarquable ; difficile à faire changer d’avis.',
    'agit sur plusieurs fronts à la fois, avec les mots comme arme favorite.',
    'agit surtout pour protéger ses proches ; la colère est souvent rentrée, exprimée de façon indirecte.',
    'agit avec fierté et passion, aime prendre les commandes et briller par ses actions.',
    'agit avec méthode et efficacité, aime le travail bien fait, parfois jusqu’au perfectionnisme.',
    'agit mieux en équipe et préfère négocier qu’affronter.',
    'agit avec une détermination redoutable : quand un objectif est fixé, rien ne l’arrête.',
    'agit avec enthousiasme pour ses idéaux, aime le sport, l’aventure et les grands projets.',
    'agit avec discipline et ambition, et avance de façon stratégique vers ses objectifs.',
    'agit de façon indépendante et inattendue, et se bat volontiers pour des causes collectives.',
    'agit par intuition et inspiration plutôt que par la force ; l’énergie fluctue selon les émotions.',
  ]) };
  P.jupiter = { intro: '{N} grandit et trouve sa chance ', by: z([
    'en osant, en prenant des initiatives et en se lançant.',
    'dans la stabilité, la nature, les plaisirs simples et la construction patiente.',
    'en apprenant, en communiquant et en multipliant les contacts.',
    'à travers la famille, le foyer et la générosité envers ses proches.',
    'en créant, en s’exprimant et en partageant sa joie de vivre.',
    'en se rendant utile, en travaillant avec soin et en prenant soin de sa santé.',
    'à travers les relations, les partenariats et les rencontres.',
    'en traversant les crises et en explorant les profondeurs de la vie.',
    'en voyageant, en étudiant et en suivant ses convictions.',
    'par l’effort, la persévérance et l’ambition à long terme.',
    'à travers l’amitié, les projets collectifs et les idées nouvelles.',
    'par la compassion, l’intuition et la spiritualité.',
  ]) };
  P.saturn = { intro: 'La grande leçon de vie de {N} : ', by: z([
    'apprendre à s’affirmer avec patience, sans forcer ni se décourager.',
    'construire sa sécurité matérielle et sa valeur personnelle, sans s’y accrocher.',
    'oser exprimer ses idées et apprendre avec rigueur.',
    'construire sa propre sécurité émotionnelle et apprivoiser ses peurs liées à la famille.',
    'oser briller et créer, sans attendre l’approbation des autres.',
    'lâcher le perfectionnisme et accepter que « fait » vaut mieux que « parfait ».',
    'bâtir des relations justes et durables, en apprenant à dire non.',
    'lâcher le besoin de contrôle et faire confiance pour s’ouvrir vraiment.',
    'trouver ses propres convictions et les mettre à l’épreuve du réel.',
    'assumer ses responsabilités et son ambition, sans s’oublier en chemin.',
    'trouver sa place dans un groupe tout en restant soi-même.',
    'donner forme à ses rêves et poser des limites à sa sensibilité.',
  ]) };

  P.chiron = { intro: 'La blessure intime de {N}, celle qui devient une force en guérissant : ', by: z([
    'oser s’affirmer et exister pleinement ; en la soignant, {N} apprend aux autres le courage.',
    'se sentir en sécurité et digne de valeur ; en la soignant, {N} aide les autres à s’ancrer.',
    'trouver sa place par la parole et le savoir ; en la soignant, {N} devient un passeur d’idées.',
    'le besoin d’être protégé et d’appartenir ; en la soignant, {N} sait accueillir et consoler.',
    'oser briller et être aimé pour ce qu’on est ; en la soignant, {N} aide les autres à rayonner.',
    'l’exigence et la peur de ne pas être parfait ; en la soignant, {N} devient un vrai soignant du quotidien.',
    'la relation et la peur du rejet ; en la soignant, {N} apprend aux autres l’équilibre à deux.',
    'la confiance et la peur de la trahison ; en la soignant, {N} accompagne les autres dans leurs crises.',
    'le sens de la vie et la foi ; en la soignant, {N} transmet une sagesse précieuse.',
    'la réussite et l’autorité ; en la soignant, {N} devient un guide solide.',
    'la différence et le sentiment de ne pas être comme les autres ; en la soignant, {N} rassemble.',
    'la sensibilité à vif et les frontières floues ; en la soignant, {N} devient un guérisseur intuitif.',
  ]) };

  // planètes lentes : générationnelles, la maison fait le côté personnel
  const GEN = {
    uranus: 'le besoin de liberté et de changement',
    neptune: 'l’idéal, le rêve et la spiritualité',
    pluto: 'les grandes transformations intérieures',
  };

  const HOUSE_P = [
    'dans sa façon d’être et de se présenter au monde',
    'dans son rapport à l’argent, à ses ressources et à sa propre valeur',
    'dans les échanges du quotidien, avec ses frères et sœurs, son entourage proche, à l’école',
    'à la maison, en famille et dans sa vie intime',
    'dans les loisirs, la créativité, les histoires d’amour et avec les enfants',
    'au travail, dans ses routines et dans sa façon de prendre soin de sa santé',
    'en couple et dans ses relations avec ses partenaires',
    'dans les moments de crise, l’intimité profonde et ce qui est partagé avec les autres (argent, héritage)',
    'dans les voyages, les études, la quête de sens et la découverte d’autres cultures',
    'dans sa carrière, sa vocation et son image publique',
    'avec ses amis, dans les groupes et les projets d’avenir',
    'dans sa vie intérieure, ses rêves, ses moments de solitude et sa spiritualité',
  ];

  const DIG_P = {
    dom: '{P} est ici « à la maison » : cette énergie vient naturellement à {N}, c’est une vraie ressource.',
    exa: '{P} est ici « à l’honneur » : c’est un point fort marqué chez {N}.',
    exil: '{P} est ici « loin de chez elle » : cette énergie demande un peu plus d’adaptation à {N}, mais elle peut s’exprimer de façon originale.',
    chute: '{P} est ici « en chute » : cette énergie est moins spontanée chez {N}. C’est un point à travailler consciemment, qui peut devenir une vraie force avec le temps.',
  };

  function fill(s, name, pname) { return s.replace(/\{N\}/g, name).replace(/\{P\}/g, pname || ''); }

  /** Retourne {perso, theory} pour une planète du thème */
  function planetReading(b, ch, name) {
    const I = root.Interp, E = root.Engine;
    const N = name || 'Cette personne';
    const sk = b.sign.key, house = !ch.noTime && b.house ? b.house : null;
    let perso;
    if (P[b.key]) perso = fill(P[b.key].intro + P[b.key].by[sk], N);
    else if (GEN[b.key]) perso = `${b.name} reste plusieurs années dans le même signe : en ${b.sign.name}, elle colore ${GEN[b.key]} de toute une génération (${I.signs[sk].kw}).` + (house ? ` Chez ${N}, c’est surtout ${HOUSE_P[house - 1]} que cela se joue.` : '');
    else if (b.key === 'node') perso = `Le chemin d’évolution de ${N} passe par des qualités ${I.signs[sk].adj.replace(/([a-zàâçéèêëîïôûù]+e)(?=[,\s]|$)/gi, '$1s')} (${I.signs[sk].kw}) : c’est en les développant que la vie prend tout son sens.`;
    else if (b.key === 'snode') perso = `Ce que ${N} sait déjà faire, presque par réflexe : ${I.signs[sk].kw}. Une base rassurante, mais à ne pas utiliser comme refuge.`;
    else if (b.key === 'lilith') perso = `La part sauvage et insoumise de ${N} s’exprime de façon ${I.signs[sk].adj} : dans ce domaine, pas question de compromis.`;
    else if (b.key === 'fortune') perso = `${N} trouve facilement du bien-être et de la chance ${house ? HOUSE_P[house - 1] : 'dans les domaines liés au ' + b.sign.name}.`;
    else perso = '';
    if (house && (P[b.key])) perso += ` Où ça se joue : surtout ${HOUSE_P[house - 1]}.`;
    if (b.dignity) perso += ' ' + fill(DIG_P[b.dignity.key], N, b.name);
    if (b.retro && E.PMAP[b.key].body && b.key !== 'sun' && b.key !== 'moon') perso += ` ${b.name} était rétrograde : ${N} vit cette énergie de façon plus intérieure, à son propre rythme, parfois avec un temps de décalage.`;
    const th = [`${b.name} = ${I.planets[b.key].role}`, `${b.sign.name} = ${I.signs[sk].kw}`];
    if (house) th.push(`maison ${house} = ${I.houses[house - 1].kw}`);
    if (b.dignity) th.push(b.dignity.label.toLowerCase());
    if (b.retro && E.PMAP[b.key].body && b.key !== 'sun' && b.key !== 'moon') th.push('rétrograde');
    return { perso, theory: th.join(' · ') };
  }

  function bigThree(ch, name) {
    const I = root.Interp, E = root.Engine;
    const N = name || 'Cette personne';
    const sun = ch.bodies[0], moon = ch.bodies[1], asc = ch.angles[0];
    const out = [
      { title: `Soleil en ${sun.sign.name} ${sun.sign.glyph}︎`, help: 'soleil', txt: fill(P.sun.intro + P.sun.by[sun.sign.key], N), theory: I.signs[sun.sign.key].txt },
      { title: `Lune en ${moon.sign.name} ${moon.sign.glyph}︎`, help: 'lune', txt: fill(P.moon.intro + P.moon.by[moon.sign.key], N), theory: `La Lune décrit les émotions et les besoins intimes. ${moon.sign.name} : ${I.signs[moon.sign.key].kw}.` },
    ];
    if (!ch.noTime) {
      const ruler = ch.bodies.find((b) => b.key === asc.sign.ruler);
      out.push({ title: `Ascendant ${asc.sign.name} ${asc.sign.glyph}︎`, help: 'ascendant', txt: `Au premier abord, ${N} donne une impression ${I.signs[asc.sign.key].adj}. C’est sa « façade », la manière spontanée d’entrer en contact avec les autres. Sa planète maîtresse, ${E.PMAP[asc.sign.ruler].name}, se trouve en ${ruler.sign.name}${ruler.house ? ' en maison ' + ruler.house : ''} : c’est ${ruler.house ? HOUSE_P[ruler.house - 1] : 'là'} que ${N} met le plus naturellement son énergie.`, theory: `L’Ascendant est le signe qui se levait à l’horizon Est à la naissance. ${asc.sign.name} : ${I.signs[asc.sign.key].kw}.` });
    }
    return out;
  }

  root.Perso = { planetReading, bigThree, HOUSE_P };
})(typeof window !== 'undefined' ? window : globalThis);
(function (root) {
  const ROLE = { sun: 'son identité', moon: 'ses émotions', mercury: 'sa façon de penser', venus: 'sa vie amoureuse', mars: 'son énergie d’action', jupiter: 'sa confiance', saturn: 'son sens des responsabilités', uranus: 'son besoin de liberté', neptune: 'son imaginaire', pluto: 'sa force de transformation', node: 'son chemin d’évolution', lilith: 'sa part sauvage', fortune: 'son bien-être', asc: 'sa personnalité visible', mc: 'sa vocation' };
  function aspectReading(a, name) {
    const N = name || 'cette personne', x = ROLE[a.a] || a.an, y = ROLE[a.b] || a.bn;
    const t = {
      conj: `Chez ${N}, ${x} et ${y} sont soudés : ces deux facettes agissent toujours ensemble.`,
      tri: `Chez ${N}, ${x} et ${y} s’accordent naturellement : un vrai talent, parfois tenu pour acquis.`,
      sext: `Chez ${N}, ${x} et ${y} se soutiennent : une belle ressource, qui demande juste d’être utilisée.`,
      sq: `Chez ${N}, ${x} et ${y} se frottent : une tension intérieure qui pousse à agir et à grandir.`,
      opp: `Chez ${N}, ${x} et ${y} tirent dans deux directions : tout l’enjeu est de trouver l’équilibre entre les deux.`,
      quinc: `Chez ${N}, ${x} et ${y} ne parlent pas la même langue : cela demande des ajustements réguliers.`,
    }[a.key] || `Chez ${N}, ${x} et ${y} sont discrètement reliés.`;
    return t;
  }
  root.Perso.aspectReading = aspectReading;
})(typeof window !== 'undefined' ? window : globalThis);
