// Initialisation de la carte centrée sur la France
const map = L.map('map').setView([46.603354, 1.888334], 6); // Coordonnées approximatives du centre de la France

// Ajout d'une couche de carte (tiles) OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
}).addTo(map);

// Ajouter un contrôle de chargement
const loadingControl = L.control({position: 'topright'});
loadingControl.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'info loading');
    div.innerHTML = '<div id="loading" style="background-color: white; padding: 10px; border-radius: 5px; border: 1px solid #ccc;">Chargement des stades...</div>';
    return div;
};
loadingControl.addTo(map);

// URL de l'API des équipements sportifs
const baseApiUrl = 'https://equipements.sports.gouv.fr/api/explore/v2.1/catalog/datasets/data-es/records';
const limit = 100;

// Liste des départements français (codes INSEE)
const departements = [
    '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
    '11', '12', '13', '14', '15', '16', '17', '18', '19', '2A',
    '2B', '21', '22', '23', '24', '25', '26', '27', '28', '29',
    '30', '31', '32', '33', '34', '35', '36', '37', '38', '39',
    '40', '41', '42', '43', '44', '45', '46', '47', '48', '49',
    '50', '51', '52', '53', '54', '55', '56', '57', '58', '59',
    '60', '61', '62', '63', '64', '65', '66', '67', '68', '69',
    '70', '71', '72', '73', '74', '75', '76', '77', '78', '79',
    '80', '81', '82', '83', '84', '85', '86', '87', '88', '89',
    '90', '91', '92', '93', '94', '95', '971', '972', '973', '974', '976'
];

// Variables globales pour stocker les cercles et les marqueurs
let currentMarkers = null;
let currentCircles = [];

// Fonction pour charger les stades d'un département
async function chargerStadesParDepartement(departement) {
    let stades = [];
    let offset = 0;
    let hasMoreData = true;

    while (hasMoreData) {
        const url = `${baseApiUrl}?select=inst_nom%2C%20coordonnees&where=search(inst_nom%2C%20%27stade%27)%20AND%20startswith(inst_cp%2C%20%27${departement}%27)&limit=${limit}&offset=${offset}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const validStades = data.results.filter(stade =>
                    stade.coordonnees &&
                    stade.coordonnees.lat &&
                    stade.coordonnees.lon
                );

                stades = stades.concat(validStades);

                if (data.results.length < limit) {
                    hasMoreData = false;
                }
            } else {
                hasMoreData = false;
            }

            offset += limit;
        } catch (error) {
            console.error(`Erreur lors de la récupération des données pour le département ${departement}:`, error);
            hasMoreData = false;
        }
    }

    return stades;
}

// Fonction pour charger tous les stades de France
async function chargerTousLesStades() {
    try {
        document.getElementById('loading').style.display = 'block';
        let allStades = [];
        let currentDepartementIndex = 0;

        // Fonction récursive pour charger les stades département par département
        async function chargerDepartementSuivant() {
            if (currentDepartementIndex < departements.length) {
                const departement = departements[currentDepartementIndex];
                document.getElementById('loading').innerHTML =
                    `Chargement des stades... (${allStades.length} stades chargés, département ${departement})`;

                const stadesDepartement = await chargerStadesParDepartement(departement);
                allStades = allStades.concat(stadesDepartement);

                currentDepartementIndex++;
                setTimeout(chargerDepartementSuivant, 100); // Petit délai pour éviter de surcharger l'API
            } else {
                // Tous les départements ont été traités
                if (allStades.length > 0) {
                    addStadesToMap(allStades);
                    document.getElementById('loading').style.display = 'none';
                    console.log(`${allStades.length} stades chargés avec succès`);
                } else {
                    console.log("Aucun stade trouvé, utilisation des données de démonstration");
                    document.getElementById('loading').style.display = 'none';
                    addDemoStadesToMap();
                }
            }
        }

        // Démarrer le chargement département par département
        chargerDepartementSuivant();

    } catch (error) {
        console.error("Erreur lors du chargement des stades:", error);
        document.getElementById('loading').style.display = 'none';
        addDemoStadesToMap();
    }
}

// Fonction pour mettre à jour les cercles avec un nouveau rayon
function updateCirclesRadius(radiusInKm) {
    // Supprimer les anciens cercles
    currentCircles.forEach(circle => circle.remove());
    currentCircles = [];

    // Si nous avons des marqueurs, mettre à jour leurs cercles
    if (currentMarkers) {
        currentMarkers.getLayers().forEach(marker => {
            const latlng = marker.getLatLng();
            const circle = L.circle(latlng, {
                radius: radiusInKm * 1000, // Conversion en mètres
                color: '#7f8c8d',
                fillColor: 'transparent',
                weight: 2,
                fillOpacity: 0
            }).addTo(map);
            currentCircles.push(circle);
        });
    }
}

// Ajouter les stades au format de l'API à la carte
function addStadesToMap(stades) {
    // Supprimer les anciens marqueurs et cercles s'ils existent
    if (currentMarkers) {
        map.removeLayer(currentMarkers);
    }
    currentCircles.forEach(circle => circle.remove());
    currentCircles = [];

    // Création d'un cluster pour regrouper les marqueurs et améliorer les performances
    currentMarkers = L.markerClusterGroup();

    stades.forEach(stade => {
        // Vérifier que les coordonnées sont valides
        if (!stade.coordonnees || !stade.coordonnees.lat || !stade.coordonnees.lon) return;

        // Ajouter un marqueur pour chaque stade (point rouge)
        const marker = L.circleMarker([stade.coordonnees.lat, stade.coordonnees.lon], {
            radius: 5,
            fillColor: '#e74c3c',
            color: '#c0392b',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        });

        // Ajouter un popup avec le nom du stade
        marker.bindPopup(`<strong>${stade.inst_nom}</strong>`);

        // Ajouter un cercle de rayon par défaut (5km)
        const circle = L.circle([stade.coordonnees.lat, stade.coordonnees.lon], {
            radius: 5000, // 5km en mètres par défaut
            color: '#7f8c8d',
            fillColor: 'transparent',
            weight: 2,
            fillOpacity: 0
        });

        // Ajouter les marqueurs au cluster et les cercles directement à la carte
        currentMarkers.addLayer(marker);
        circle.addTo(map);
        currentCircles.push(circle);
    });

    // Ajouter le cluster à la carte
    map.addLayer(currentMarkers);
}

// Écouter les changements du sélecteur de rayon
document.getElementById('radius').addEventListener('change', function(e) {
    const newRadius = parseInt(e.target.value);
    updateCirclesRadius(newRadius);
});

// Données d'exemple pour les stades (utilisées en cas d'échec de l'API)
function addDemoStadesToMap() {
    const stadesDemo = [
        [48.9244, 2.3601, "Stade de France, Saint-Denis"],
        [48.8414, 2.2530, "Parc des Princes, Paris"],
        [43.2965, 5.3954, "Stade Vélodrome, Marseille"],
        [45.7239, 4.8316, "Groupama Stadium, Lyon"],
        [43.7246, 7.2590, "Allianz Riviera, Nice"],
        [43.6112, 3.8128, "Stade de la Mosson, Montpellier"],
        [47.2582, -1.5250, "Stade de la Beaujoire, Nantes"],
        [44.8379, -0.5389, "Matmut Atlantique, Bordeaux"],
        [48.1087, -1.6741, "Roazhon Park, Rennes"],
        [50.6332, 3.0762, "Stade Pierre-Mauroy, Lille"],
        [47.7474, 7.3089, "Stade de l'Ill, Mulhouse"],
        [49.4254, 2.0884, "Stade de Picardie, Amiens"],
        [47.3410, 5.0734, "Stade Gaston Gérard, Dijon"],
        [49.8911, 2.2675, "Stade de la Licorne, Amiens"],
        // Ajouter plus de stades de France
        [47.4761, 6.8135, "Stade Auguste-Bonal, Sochaux"],
        [49.7274, 4.7106, "Stade Louis-Dugauguez, Sedan"],
        [45.5266, 4.2901, "Stade Geoffroy-Guichard, Saint-Étienne"],
        [43.5549, 1.4343, "Stadium de Toulouse, Toulouse"],
        [47.8849, 1.9153, "Stade de la Source, Orléans"],
        [46.3075, 4.8334, "Stade Joseph-Guétat, Mâcon"],
        [44.8425, -0.5613, "Stade Chaban-Delmas, Bordeaux"],
        [43.8302, 4.3661, "Stade des Costières, Nîmes"],
        [45.9009, 6.1192, "Parc des Sports d'Annecy, Annecy"],
        [48.1175, -1.6769, "Stade Robert-Poirier, Rennes"],
        [43.6045, 3.9735, "Stade Yves-du-Manoir, Montpellier"],
        [49.2416, 4.0254, "Stade Auguste-Delaune, Reims"],
        [47.5946, 7.5465, "Stade de la Frontière, Saint-Louis"],
        [46.2049, 5.2253, "Stade Marcel-Verchère, Bourg-en-Bresse"],
        [50.4311, 2.8286, "Stade Bollaert-Delelis, Lens"],
        [49.1199, 6.1775, "Stade Saint-Symphorien, Metz"]
    ];

    // Ajouter les stades sur la carte
    stadesDemo.forEach(stade => {
        const [latitude, longitude, nom] = stade;

        // Ajouter un marqueur pour chaque stade (point rouge)
        const marker = L.circleMarker([latitude, longitude], {
            radius: 5,
            fillColor: '#e74c3c',
            color: '#c0392b',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);

        // Ajouter un popup avec le nom du stade
        marker.bindPopup(nom);

        // Ajouter un cercle de 5km de rayon (gris, non rempli)
        L.circle([latitude, longitude], {
            radius: 5000, // 5km en mètres
            color: '#7f8c8d',
            fillColor: 'transparent',
            weight: 2,
            fillOpacity: 0
        }).addTo(map);
    });
}

// Ajouter un contrôle d'échelle (affiche l'échelle en km/miles)
L.control.scale().addTo(map);

// Ajouter une légende
const legend = L.control({position: 'bottomright'});
legend.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'info legend');
    div.innerHTML = `
        <div style="background-color: white; padding: 10px; border-radius: 5px; border: 1px solid #ccc;">
            <div><span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #e74c3c; margin-right: 5px;"></span> Stade sportif public</div>
            <div><span style="display: inline-block; width: 10px; height: 10px; border: 2px solid #7f8c8d; border-radius: 50%; margin-right: 5px;"></span> Rayon de 5 km</div>
        </div>
    `;
    return div;
};
legend.addTo(map);

// Charger les stades au démarrage
chargerTousLesStades();
