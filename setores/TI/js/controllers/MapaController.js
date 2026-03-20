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
                    layer.on('click', (e) => {
                        L.DomEvent.stopPropagation(e);
                        window.abrirDetalhesEstado(feature.properties.sigla, feature.properties.name);
                    });
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
        .leaflet-interactive { transition: fill-opacity 0.3s, fill 0.3s; cursor: pointer !important; }
        .leaflet-interactive:hover { fill-opacity: 0.25 !important; }
    `;
    document.head.appendChild(style);
};

window.abrirDetalhesEstado = function (sigla, nome) {
    const sidebar = document.getElementById('stateSidebar');
    const overlay = document.getElementById('stateSidebarOverlay');
    const title = document.getElementById('stateSidebarTitle');
    const content = document.getElementById('stateSidebarContent');
    
    if (!sidebar || !content) return;

    title.innerText = nome;
    content.innerHTML = '';
    
    const siglaPadrao = getEstadoPadrao(sigla);
    const lojas = window.lojasIniciais.filter(l => getEstadoPadrao(l.estado) === siglaPadrao);

    if (lojas.length === 0) {
        content.innerHTML = `<div class="p-8 text-center text-[var(--text-muted)]">Nenhuma loja cadastrada neste estado.</div>`;
    } else {
        lojas.forEach(loja => {
            const logs = window.sysLogs[loja.id] || [];
            const pendentes = logs.filter(l => !l.resolvido);
            const temPendente = pendentes.length > 0;
            
            const item = document.createElement('div');
            item.className = 'p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--sp-pink)] transition-all cursor-pointer group shadow-sm flex items-center justify-between';
            item.onclick = () => {
                if (typeof window.abrirModal === 'function') {
                    window.abrirModal(loja.id, loja.nome, loja.estado);
                }
            };

            const statusColor = temPendente ? 'bg-[#ef4444]' : 'bg-[#10b981]';
            const statusText = temPendente ? `${pendentes.length} chamado(s)` : 'Tudo OK';
            const statusBadgeColor = temPendente ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100';

            item.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-2.5 h-2.5 rounded-full ${statusColor} shadow-sm"></div>
                    <div>
                        <div class="font-bold text-[var(--text-main)] group-hover:text-[var(--sp-pink)] transition-colors">${loja.nome}</div>
                        <div class="text-[10px] text-[var(--text-muted)] uppercase tracking-tighter">${loja.estado}</div>
                    </div>
                </div>
                <div class="px-2 py-1 rounded-md border text-[10px] font-bold ${statusBadgeColor}">${statusText}</div>
            `;
            content.appendChild(item);
        });
    }

    sidebar.classList.remove('translate-x-full');
    overlay.classList.remove('hidden');
};

window.fecharDetalhesEstado = function () {
    const sidebar = document.getElementById('stateSidebar');
    const overlay = document.getElementById('stateSidebarOverlay');
    if (sidebar) sidebar.classList.add('translate-x-full');
    if (overlay) overlay.classList.add('hidden');
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
