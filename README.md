# ✦ Mélastro

Application d'astrologie en français, 100 % dans le navigateur, hébergée sur GitHub Pages.

**👉 https://ch4rybd3.github.io/Melastro/**

## Fonctionnalités (v1.0)

- **Carnet de profils** : enregistrement local, recherche, tri (nom, signe, anniversaire…), étiquettes, notes, export/import JSON.
- **Thème natal** : Soleil → Pluton, Nœuds (vrai ou moyen), Lilith, Part de Fortune, Ascendant, MC, 12 maisons.
- **7 systèmes de maisons** : Placidus, Koch, Régiomontanus, Campanus, Porphyre, Égales, Signes entiers.
- **Roue du thème** en SVG, aspects majeurs et mineurs (appliquants / séparants), grille d'aspects.
- **Lecture** : big three, planète par planète (signe, maison, dignités, rétrogradation), aspects, phase lunaire, forme du thème, configurations (stellium, grand trigone, T-carré, grande croix, yod).
- **Dominantes** : éléments, modes, polarités, hémisphères, planètes dominantes, poids par signe et par maison.
- **Ciel de naissance** : carte du ciel réelle au-dessus du lieu de naissance (3 200 étoiles, constellations en français, planètes, écliptique).
- **Synastrie** : bi-roue, score de compatibilité, scores par domaine, aspects croisés commentés, superposition des maisons, thème composite.
- **Transits** à une date au choix, **révolution solaire** année par année.
- **Le ciel aujourd'hui** : positions, rétrogrades, phases de la Lune, prochains changements de signe.
- **Statistiques du carnet** : répartition des signes solaires, lunaires, ascendants, Vénus, éléments, aspects, anniversaires, duos les plus compatibles.
- **Installable** sur iPhone (Safari → Partager → Sur l'écran d'accueil) et Android, fonctionne hors ligne.

## Précision

Zodiaque tropical, positions géocentriques apparentes. Calculs vérifiés contre Swiss Ephemeris sur 12 dates aléatoires (1930-2030) : écart < 0,4′ pour les planètes et les nœuds, 0′ pour l'Ascendant, le MC et les cuspides de toutes les maisons. Fuseaux horaires historiques via la base IANA du navigateur (heure d'été, heure allemande 1940-1944…), avec possibilité de forcer un décalage manuel.

## Confidentialité

Aucune donnée n'est envoyée à un serveur : les profils restent dans le `localStorage` du navigateur. Seule la recherche de ville interroge l'API de géocodage Open-Meteo.

## Crédits

- [Astronomy Engine](https://github.com/cosinekitty/astronomy) — Don Cross, licence MIT
- Catalogue d'étoiles et constellations : [d3-celestial](https://github.com/ofrohn/d3-celestial) — Olaf Frohn, licence BSD-3-Clause
- Géocodage : [Open-Meteo](https://open-meteo.com/)
