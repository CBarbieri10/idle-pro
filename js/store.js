// js/store.js - Gerenciador de Estado Global (Padrão Observer)
// Arquiteto de Estado: Responsável por garantir a integridade dos dados e o padrão Observer.
// RESTRIÇÃO HARD: NENHUMA manipulação de DOM ou chamada ao Phaser ocorre neste arquivo.

class Store {
    constructor() {
        // Inicializa o estado buscando do LocalStorage ou construindo do zero
        this.state = this.loadInitialState();
        // Lista de observadores (callbacks de UI, Phaser, etc.)
        this.listeners = [];
    }

    // Retorna o estado inicial completo e estruturado conforme DIRETRIZES
    get defaultState() {
        return {
            player: {
                nome: "",
                nacionalidade: "",
                posicao: "",
                ovr: 50,
                biomeMultiplier: 1.0, // Baseado na origem escolhida (Bioma)
                energy: 100 // Usado para treinamento e interações físicas
            },
            inventory: {
                moedas: 0, // Soft Currency
                diamantes: 0, // Hard Currency (RMT)
                chavesBoss: 0, // Tickets de Desafio para expansão territorial
                items: [] // Inventário de cosméticos e utilitários
            },
            gachaSystem: {
                pityCounter: 0, // Sistema de garantia contra azar (RNG)
                dropRates: { 
                    comum: 70, 
                    incomum: 25, 
                    raro: 4, 
                    epico: 1 
                }
            },
            worldRankings: {
                topNacional: [],
                topGlobal: []
            }
        };
    }

    // Middleware interno de leitura: Carrega do localStorage ('idlePro_Data')
    loadInitialState() {
        try {
            const savedState = localStorage.getItem('idlePro_Data');
            if (savedState) {
                return JSON.parse(savedState);
            }
        } catch (error) {
            console.error("Falha ao carregar save. Iniciando com estado padrão.", error);
        }
        return this.defaultState;
    }

    // Retorna uma cópia readonly do estado atual para evitar mutações diretas perigosas
    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    // Método Subscribe: Registra listeners para reagirem a mudanças no estado
    subscribe(listener) {
        this.listeners.push(listener);
        // Retorna função para un-subscribe, útil para memory management
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    // O coração do Observer: Reducer + Middleware (Salva em LocalStorage e Notifica)
    dispatch(action) {
        if (!action || !action.type) return;

        // --- INÍCIO DO REDUCER (Mutações controladas do estado) ---
        switch (action.type) {
            case 'CREATE_PLAYER':
                this.state.player.nome = action.payload.nome;
                this.state.player.nacionalidade = action.payload.nacionalidade;
                this.state.player.posicao = action.payload.posicao;
                this.state.player.biomeMultiplier = action.payload.biomeMultiplier || 1.0;
                break;
            
            case 'UPDATE_ENERGY':
                // Garante que a energia fique entre 0 e 100
                this.state.player.energy = Math.max(0, Math.min(100, this.state.player.energy + action.payload));
                break;
                
            case 'ADD_COINS':
                this.state.inventory.moedas += action.payload;
                break;
                
            case 'SPEND_COINS':
                if (this.state.inventory.moedas >= action.payload) {
                    this.state.inventory.moedas -= action.payload;
                }
                break;
                
            case 'ADD_ITEM':
                this.state.inventory.items.push(action.payload);
                break;
                
            case 'INCREMENT_PITY':
                this.state.gachaSystem.pityCounter += 1;
                break;
                
            case 'RESET_PITY':
                this.state.gachaSystem.pityCounter = 0;
                break;
                
            case 'RESET_STATE':
                // Reset completo da progressão
                this.state = this.defaultState;
                break;

            // Outras actions que os Agentes 3 e 4 precisarem serão incluídas posteriormente
            default:
                console.warn(`[Store] Ação não mapeada: ${action.type}`);
                break;
        }
        // --- FIM DO REDUCER ---

        // --- INÍCIO DO MIDDLEWARE (Efeitos Colaterais Automáticos) ---
        
        // 1. Persistência de Dados Obrigatória
        this.saveStateToLocal();
        
        // 2. Notificação da Rede de Observadores (Broadcast)
        this.notifyListeners();
        
        // --- FIM DO MIDDLEWARE ---
    }

    // Middleware interno de gravação: Salva no localStorage na chave 'idlePro_Data'
    saveStateToLocal() {
        try {
            localStorage.setItem('idlePro_Data', JSON.stringify(this.state));
        } catch (error) {
            console.error("Falha crítica ao salvar estado no localStorage.", error);
        }
    }

    // Dispara as notificações para as camadas DOM e Phaser renderizarem novamente
    notifyListeners() {
        const frozenState = this.getState(); // Passa estado seguro (sem referências)
        this.listeners.forEach(listener => {
            try {
                listener(frozenState);
            } catch (err) {
                console.error("[Store] Erro ao executar listener registrado:", err);
            }
        });
    }
}

// Exportação Singleton Global (Permite que outros sistemas o utilizem facilmente)
window.GameStore = new Store();
