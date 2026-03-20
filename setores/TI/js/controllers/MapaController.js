// js/controllers/MapaController.js — Gerenciamento do Mapa Interativo com Leaflet
// Depends on: leaflet.js, data.js (lojasIniciais), LojasChamadosController.js (sysLogs)

window.mapaTI = null;
window.marcadoresMapa = {};
window.camadaEstados = null;
window.camadaMascara = null;

// Mapeamento de regionais customizadas para siglas padrão do IBGE
const MAPA_ESTADOS_TI = {
    'CE2': 'CE',
    'CE3': 'CE',
    'RMA': 'CE' // CSC está em Fortaleza/CE conforme coordenadas
};

function getEstadoPadrao(sigla) {
    return MAPA_ESTADOS_TI[sigla] || sigla;
}

window.initMapa = function () {
    const mapEl = document.getElementById('mapContainer');
    if (!mapEl) return;

    if (window.mapaTI) {
        setTimeout(() => {
            window.mapaTI.invalidateSize();
            window.renderizarMarcadoresMapa();
        }, 100);
        return;
    }

    // Configurações para manter o foco no Brasil
    const sulBr = [-33.74, -73.98];
    const norteBr = [5.27, -28.84];
    const boundsBr = L.latLngBounds(sulBr, norteBr);

    window.mapaTI = L.map('mapContainer', {
        minZoom: 4,
        maxBounds: boundsBr,
        maxBoundsViscosity: 1.0,
        zoomSnap: 0.5
    }).setView([-15.7801, -47.9292], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(window.mapaTI);

    // Carregar Máscara (apenas Brasil visível)
    fetch('https://raw.githubusercontent.com/codeforamerica/click_near_here/master/public/data/brazil-boundary.json')
        .then(response => response.json())
        .then(data => {
            const worldCoords = [
                [90, -180], [90, 180], [-90, 180], [-90, -180]
            ];
            
            // O GeoJSON pode ter múltiplas partes (MultiPolygon)
            const holeCoords = data.features[0].geometry.coordinates.map(poly => {
                return poly[0].map(coord => [coord[1], coord[0]]);
            });

            // Criar polígono invertido (Mundo - Brasil)
            window.camadaMascara = L.polygon([worldCoords, ...holeCoords], {
                color: 'transparent',
                fillColor: '#f1f5f9', // slate-100 (neutro)
                fillOpacity: 1,
                interactive: false,
                pane: 'overlayPane'
            }).addTo(window.mapaTI);
        });

    // Carregar GeoJSON dos estados brasileiros
    fetch('https://raw.githubusercontent.com/codeforgermany/click_that_hood/master/public/data/brazil-states.geojson')
        .then(response => response.json())
        .then(data => {
            window.camadaEstados = L.geoJson(data, {
                style: estilizarEstado,
                onEachFeature: (feature, layer) => {
                    layer.bindTooltip(feature.properties.name, { sticky: true });
                }
            }).addTo(window.mapaTI);
            window.renderizarMarcadoresMapa();
        })
        .catch(err => console.error('Erro ao carregar GeoJSON:', err));

    const style = document.createElement('style');
    style.innerHTML = `
        #mapContainer { background: #f1f5f9 !important; }
        .marker-pin {
            width: 26px; height: 26px; border-radius: 50% 50% 50% 0;
            background: #c30b82; position: absolute; transform: rotate(-45deg);
            left: 50%; top: 50%; margin: -13px 0 0 -13px;
            border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            z-index: 1000;
        }
        .marker-pin::after {
            content: ''; width: 12px; height: 12px; margin: 5px 0 0 5px;
            background: #fff; position: absolute; border-radius: 50%;
        }
        .marker-green { background: #10b981 !important; }
        .marker-red { background: #ef4444 !important; }
        .leaflet-interactive { transition: fill-opacity 0.3s, fill 0.3s; }
    `;
    document.head.appendChild(style);
};

function estilizarEstado(feature) {
    const sigla = feature.properties.sigla;
    const status = getStatusEstado(sigla);
    
    let color = 'transparent';
    let fillOpacity = 0;

    if (status === 'problem') {
        color = '#ef4444';
        fillOpacity = 0.15;
    } else if (status === 'ok') {
        color = '#10b981';
        fillOpacity = 0.1;
    }

    return {
        fillColor: color,
        weight: 1,
        opacity: 0.3,
        color: 'var(--border)',
        fillOpacity: fillOpacity
    };
}

function getStatusEstado(siglaPadrao) {
    if (!window.lojasIniciais) return 'none';

    // Filtrar lojas deste estado
    const lojasNesteEstado = window.lojasIniciais.filter(l => getEstadoPadrao(l.estado) === siglaPadrao);
    if (lojasNesteEstado.length === 0) return 'none';

    // Se qualquer loja tiver chamado aberto, o estado inteiro fica vermelho
    const temProblema = lojasNesteEstado.some(loja => {
        const logs = window.sysLogs[loja.id] || [];
        return logs.some(l => !l.resolvido);
    });

    return temProblema ? 'problem' : 'ok';
}

window.renderizarMarcadoresMapa = function () {
    if (!window.mapaTI || !window.lojasIniciais) return;

    // Atualizar cores dos polígonos dos estados
    if (window.camadaEstados) {
        window.camadaEstados.eachLayer(layer => {
            window.camadaEstados.resetStyle(layer);
        });
    }

    window.lojasIniciais.forEach(loja => {
        if (!loja.lat || !loja.lng) return;

        const logs = window.sysLogs[loja.id] || [];
        const temPendente = logs.some(l => !l.resolvido);
        const corClasse = temPendente ? 'marker-red' : 'marker-green';
        const statusTexto = temPendente ? `${logs.filter(l => !l.resolvido).length} chamado(s) aberto(s)` : 'Tudo OK';

        const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class='marker-pin ${corClasse}'></div>`,
            iconSize: [26, 36],
            iconAnchor: [13, 36]
        });

        if (window.marcadoresMapa[loja.id]) {
            window.marcadoresMapa[loja.id].setIcon(customIcon);
            window.marcadoresMapa[loja.id].getPopup().setContent(`<strong>${loja.nome}</strong><br>${statusTexto}`);
        } else {
            const marker = L.marker([loja.lat, loja.lng], { icon: customIcon })
                .bindPopup(`<strong>${loja.nome}</strong><br>${statusTexto}`)
                .addTo(window.mapaTI);
            window.marcadoresMapa[loja.id] = marker;
        }
    });
};

setInterval(() => {
    if (document.getElementById('view-mapa') && document.getElementById('view-mapa').style.display === 'block') {
        window.renderizarMarcadoresMapa();
    }
}, 5000);
