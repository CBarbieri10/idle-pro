// js/app.js - Ligação DOM/Store & UI Alta Conversão
// Especialista E-commerce/UI (Agente 4): Reage rigorosamente às mudanças de Estado do Observer para renderizar a interface visual.
// RESTRIÇÃO HARD: Acesso zero ao 'engine.js' ou lógicas matemáticas de evolução.

const UI = {
    init: function() {
        const store = window.GameStore;
        if (!store) {
            console.error("[Agente 4] Erro crítico: GameStore não encontrado. UI não será anexada.");
            return;
        }

        // Assinatura (Subscribe) do Store: Sempre que o Reducer aprovar uma mudança, o DOM reagirá.
        store.subscribe((state) => this.renderHUD(state));
        store.subscribe((state) => this.renderPaperDoll(state));
        
        // Disparo Inicial para renderizar a tela baseada no cache local
        this.renderHUD(store.getState());
        this.renderPaperDoll(store.getState());

        // Ativação do Gatilho Mental de Escassez
        this.startFlashTimer();

        // ---------------------------------------------------------
        // EVENT LISTENERS DA INTEGRAÇÃO (Diretor de Integração)
        // ---------------------------------------------------------
        document.addEventListener('SCOUT_ACTION', () => this.handleScoutAction());
        document.addEventListener('BOSS_ACTION', () => this.handleBossAction());
    },

    // ---------------------------------------------------------
    // LÓGICA DE PONTE (Diretor de Integração)
    // ---------------------------------------------------------
    
    handleScoutAction: function() {
        const store = window.GameStore;
        alert("🚐 Despachando Van de Olheiros! Iniciando busca de talentos (3s)...");
        
        // Simulação visual de timer (setTimeout)
        setTimeout(() => {
            // Injeta o jogador sorteado no Store após o timer
            store.dispatch({ 
                type: 'ADD_ITEM', 
                payload: { sku: 'JOGADOR_PROMESSA', type: 'player', raridade: 'Raro' } 
            });
            alert("✅ Olheiros retornaram! Um novo jogador foi adicionado ao seu inventário.");
        }, 3000);
    },

    handleBossAction: function() {
        const store = window.GameStore;
        const state = store.getState();

        // Valida se o jogador tem 'ChavesBoss' (Ticket de Desafio)
        if (state.inventory.chavesBoss <= 0) {
            // Gatilho agressivo de conversão RMT
            alert("❌ Acesso Negado! Você precisa de uma Chave do Boss.");
            this.abrirStore(); // Força a abertura da Flash Sale
        } else {
            // Se tiver chave, invoca a lógica de combate (CombatSystem)
            alert("⚔️ Entrando no Estádio! Calculando Sinergias...");
            
            // Simulação de Stats para o QuickMatch (Em produção, extrairia do state.player.atributos)
            const playerMockStats = [ { nome: 'Passe', valor: state.player.ovr + 10 } ];
            const bossMockStats = [ { nome: 'Leitura', valor: 55 } ];
            
            const result = window.CombatSystem.resolveQuickMatch(playerMockStats, bossMockStats);

            if (result.victory) {
                // Dispatch fictício de desbloqueio
                store.dispatch({ type: 'UNLOCK_REGION', payload: 'NOVO_CONTINENTE' });
                // Feedback Visual de Vitória
                this.simularVitoria();
            } else {
                alert(`💀 Derrota! ${result.feedbackTactical}`);
                // Dispara flash sale pela dor da derrota
                this.abrirStore(); 
            }
        }
    },

    // Renderização do HUD de Números em Tempo Real
    renderHUD: function(state) {
        document.getElementById('ui-energy').innerText = state.player.energy;
        document.getElementById('ui-coins').innerText = state.inventory.moedas;
        document.getElementById('ui-diamonds').innerText = state.inventory.diamantes;
        document.getElementById('ui-ovr').innerText = state.player.ovr;
    },

    // Sistema Inteligente de Z-Index para Cosméticos (Paper Doll)
    // Sincroniza tanto a miniatura do HUD quanto a foto do Portal de Notícias
    renderPaperDoll: function(state) {
        const applyCosmeticLayer = (idBase, idNews, srcStr) => {
            const elBase = document.getElementById(idBase);
            const elNews = document.getElementById(idNews);
            // Injeta o arquivo na tag img e torna transparente caso receba instrução de remoção
            if (elBase) { 
                elBase.src = srcStr; 
                elBase.style.opacity = srcStr.includes('transparent') ? 0 : 1; 
            }
            if (elNews) { 
                elNews.src = srcStr; 
                elNews.style.opacity = srcStr.includes('transparent') ? 0 : 1; 
            }
        };

        // Reset Diário de Sprites (Prepara para remontar o Avatar limpo)
        applyCosmeticLayer('doll-uniform', 'news-doll-uniform', 'img/uniforme-default.png');
        applyCosmeticLayer('doll-hair', 'news-doll-hair', 'img/transparent.png');
        applyCosmeticLayer('doll-boots', 'news-doll-boots', 'img/transparent.png');

        // Renderiza itens baseados estritamente na árvore do Estado (Redux Pattern)
        if (state.inventory.items && state.inventory.items.length > 0) {
            state.inventory.items.forEach(item => {
                if (item.sku === 'BOOT_APEX') {
                    applyCosmeticLayer('doll-boots', 'news-doll-boots', 'img/chuteira-apex.png');
                }
                if (item.sku === 'HAIR_NEON') {
                    applyCosmeticLayer('doll-hair', 'news-doll-hair', 'img/cabelo-neon.png');
                }
            });
        }
    },

    // ============================================
    // GATILHOS DE CONVERSÃO / UX ACTIONS
    // ============================================

    comprarEnergia: function() {
        // Envia o payload, e o próprio Subscribe (linha 13) fará a UI atualizar imediatamente ao concluir.
        window.GameStore.dispatch({ type: 'UPDATE_ENERGY', payload: 100 });
        alert("Sua barra de energia foi maximizada! Volte ao CT.");
    },

    comprarCosmetico: function(sku) {
        window.GameStore.dispatch({ type: 'ADD_ITEM', payload: { sku: sku, type: 'cosmetic' } });
        alert("Item Épico adquirido e vestido instantaneamente via Paper Doll.");
    },

    comprarFlashSale: function() {
        window.GameStore.dispatch({ type: 'UPDATE_ENERGY', payload: 300 });
        window.GameStore.dispatch({ type: 'ADD_ITEM', payload: { sku: 'BOOT_APEX', type: 'cosmetic' } });
        alert("Oferta VIP resgatada! Conta impulsionada rumo à glória.");
        this.fecharStore();
    },

    // ============================================
    // CONTROLE DE MODAIS (Glassmorphism)
    // ============================================
    
    abrirStore: function() {
        document.getElementById('modal-store').classList.remove('hidden');
    },
    fecharStore: function() {
        document.getElementById('modal-store').classList.add('hidden');
    },

    simularVitoria: function() {
        // Puxa o nome para personalizar a manchete (Feedback Visual Direcionado)
        const state = window.GameStore.getState();
        const nome = state.player.nome || "A PROMESSA LOCAL";
        
        document.getElementById('news-headline-text').innerText = `${nome} HUMILHA O CAMPEÃO REGIONAL!`;
        document.getElementById('modal-news').classList.remove('hidden');
    },
    fecharNews: function() {
        document.getElementById('modal-news').classList.add('hidden');
    },

    // Motor do Gatilho Mental de Escassez (Cronômetro RMT)
    startFlashTimer: function() {
        let timerSeconds = 14 * 60 + 59; // 14:59 cravados para senso de urgência
        
        setInterval(() => {
            timerSeconds--;
            if (timerSeconds < 0) timerSeconds = 0; // Expiraria a oferta idealmente
            
            const minutes = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
            const seconds = (timerSeconds % 60).toString().padStart(2, '0');
            
            const timerElement = document.getElementById('flash-timer');
            if (timerElement) {
                timerElement.innerText = `${minutes}:${seconds}`;
            }
        }, 1000);
    }
};

// Start Engine UI
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});

// Expõe globalmente para botões do DOM (onclick="")
window.UI = UI;
