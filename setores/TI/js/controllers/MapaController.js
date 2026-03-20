// js/controllers/MapaController.js — Gerenciamento do Mapa Interativo com Leaflet
// Depends on: leaflet.js, data.js (lojasIniciais), LojasChamadosController.js (sysLogs)

window.mapaTI = null;
window.marcadoresMapa = {};

window.initMapa = function () {
    const mapEl = document.getElementById('mapContainer');
    if (!mapEl) return;

    // Se o mapa já existir, apenas forçar o redimensionamento (necessário quando a view estava escondida)
    if (window.mapaTI) {
        setTimeout(() => {
            window.mapaTI.invalidateSize();
            window.renderizarMarcadoresMapa();
        }, 100);
        return;
    }

    // Inicializar o mapa centralizado no Brasil
    window.mapaTI = L.map('mapContainer').setView([-15.7801, -47.9292], 4);

    // Camada de visualização (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(window.mapaTI);

    // Ajustar cores dos ícones (CSS customizado para Leaflet)
    const style = document.createElement('style');
    style.innerHTML = `
        .marker-pin {
            width: 30px;
            height: 30px;
            border-radius: 50% 50% 50% 0;
            background: #c30b82;
            position: absolute;
            transform: rotate(-45deg);
            left: 50%;
            top: 50%;
            margin: -15px 0 0 -15px;
            border: 2px solid #fff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .marker-pin::after {
            content: '';
            width: 14px;
            height: 14px;
            margin: 6px 0 0 6px;
            background: #fff;
            position: absolute;
            border-radius: 50%;
        }
        .marker-green { background: #10b981 !important; }
        .marker-red { background: #ef4444 !important; }
    `;
    document.head.appendChild(style);

    window.renderizarMarcadoresMapa();
};

window.renderizarMarcadoresMapa = function () {
    if (!window.mapaTI || !window.lojasIniciais) return;

    window.lojasIniciais.forEach(loja => {
        if (!loja.lat || !loja.lng) return;

        const logs = window.sysLogs[loja.id] || [];
        const temPendente = logs.some(l => !l.resolvido);
        const corClasse = temPendente ? 'marker-red' : 'marker-green';
        const statusTexto = temPendente ? `${logs.filter(l => !l.resolvido).length} chamado(s) aberto(s)` : 'Tudo OK';

        // Criar ícone customizado
        const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class='marker-pin ${corClasse}'></div>`,
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        });

        if (window.marcadoresMapa[loja.id]) {
            // Atualizar marcador existente
            window.marcadoresMapa[loja.id].setIcon(customIcon);
            window.marcadoresMapa[loja.id].getPopup().setContent(`<strong>${loja.nome}</strong><br>${statusTexto}`);
        } else {
            // Criar novo marcador
            const marker = L.marker([loja.lat, loja.lng], { icon: customIcon })
                .bindPopup(`<strong>${loja.nome}</strong><br>${statusTexto}`)
                .addTo(window.mapaTI);
            
            window.marcadoresMapa[loja.id] = marker;
        }
    });
};

// Hook no LojasChamadosController para atualizar o mapa quando os logs mudarem
const originalInitLojasListeners = window.initLojasChamadosListeners;
window.initLojasChamadosListeners = function() {
    originalInitLojasListeners();
    // Adicionar um pequeno delay ou usar o onSnapshot já existente para atualizar
    // Como o onSnapshot chama renderizarLojas, podemos injetar lá ou apenas observar sysLogs
};

// Monitorar mudanças globais nos logs para atualizar os pontos do mapa
setInterval(() => {
    if (document.getElementById('view-mapa').style.display === 'block') {
        window.renderizarMarcadoresMapa();
    }
}, 5000); // Atualiza a cada 5 segundos se estiver na view do mapa
