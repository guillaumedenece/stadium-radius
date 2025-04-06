# Carte des Stades Sportifs Publics en France

Ce projet affiche une carte interactive de la France avec l'emplacement de tous les stades sportifs publics. Chaque stade est représenté par un point rouge et est entouré d'un cercle gris de 5 km de rayon.

## Fonctionnalités

- Carte interactive de la France
- Points rouges représentant les stades sportifs publics
- Cercles gris de 5 km de rayon autour de chaque stade
- Popups affichant le nom du stade et des informations complémentaires au clic
- Légende explicative
- Regroupement automatique des marqueurs (clustering) pour une meilleure performance avec un grand nombre de stades
- Récupération des données depuis l'API de data.gouv.fr
- Backup avec des données de démonstration en cas d'échec de l'API

## Technologies utilisées

- HTML5
- CSS3
- JavaScript
- [Leaflet](https://leafletjs.com/) - Bibliothèque JavaScript pour les cartes interactives
- [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) - Extension pour regrouper les marqueurs
- [PapaParse](https://www.papaparse.com/) - Bibliothèque pour parser les fichiers CSV
- API de data.gouv.fr - Données ouvertes sur les installations sportives en France

## Comment utiliser

1. Clonez ce dépôt ou téléchargez les fichiers
2. Ouvrez le fichier `index.html` dans votre navigateur

Ou simplement visitez [URL du site si déployé]

## Fonctionnement

Le site tente d'abord de charger les données réelles de tous les stades sportifs de France depuis l'API de data.gouv.fr. Si cela échoue pour une raison quelconque, il affiche un ensemble de données de démonstration avec une trentaine de stades majeurs.

## Personnalisation

Vous pouvez modifier le comportement de l'application en ajustant les paramètres dans `script.js`:

- Filtres pour les types de stades à afficher
- Rayon des cercles (actuellement 5 km)
- Style des marqueurs et des cercles
- Source des données

## Extensions futures

- Ajouter un filtre par type de stade
- Implémenter une recherche par ville
- Fonctionnalité pour calculer la zone couverte par plusieurs stades proches
- Statistiques sur la couverture des stades en France
- Itinéraire vers le stade le plus proche

## Licence

[MIT](https://choosealicense.com/licenses/mit/) ou autre licence de votre choix
