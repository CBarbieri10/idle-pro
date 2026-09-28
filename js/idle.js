// js/idle.js - Sistema de Treinamento e Curvas de Progressão
// Analista de Desempenho (Agente 3): Lógica Matemática e Despacho de Eventos
// RESTRIÇÃO HARD: Sem manipulação de DOM.

const IdleSystem = {
    // Curva Exponencial de Custo de XP
    // Ex: Nível 1 = 100 XP, Nível 2 = 125 XP, Nível 3 = 156 XP...
    calcularCustoXP: function(nivelAtual) {
        const custoBase = 100;
        const fatorMultiplicador = 1.25;
        return Math.floor(custoBase * Math.pow(fatorMultiplicador, nivelAtual - 1));
    },

    // Função de Treinamento (Chamada quando o jogador estiver numa zona física no Phaser)
    treinarAtributo: function(atributoNome, nivelAtual) {
        // Importa a instância do Observer
        const store = window.GameStore; 
        if (!store) {
            console.error("[Agente 3] Erro crítico: Store não inicializado.");
            return { success: false, reason: "STORE_OFFLINE" };
        }

        const state = store.getState();
        const custoEnergia = 15; 

        if (state.player.energy < custoEnergia) {
            return { success: false, reason: "ENERGIA_INSUFICIENTE" };
        }

        // --- BUFF DE BIOMA (DNA DO CLUBE) ---
        // Verificando se o jogador é do Interior Paulista (Bioma da Várzea)
        const isInteriorPaulista = (state.player.biomeMultiplier > 1.0); // Conforme injetado no Store
        const isTreinoTecnico = atributoNome.toLowerCase().includes("técnica") || atributoNome.toLowerCase().includes("giro");
        
        let ganhoDeXp = 50; // Valor fixo simulado gerado por ciclo de treino
        
        if (isInteriorPaulista && isTreinoTecnico) {
            ganhoDeXp = Math.floor(ganhoDeXp * 1.1); // Aplicação do multiplicador de 1.1x
        }

        // DESPACHO 1: Drenar Energia via Action (Reducer processará a conta)
        store.dispatch({
            type: 'UPDATE_ENERGY',
            payload: -custoEnergia
        });

        // DESPACHO 2: Subir os atributos (Criação de Payload para Action)
        // O Agente 1 depois deverá adicionar esse switch no Store, mas a instrução é apenas despachar.
        store.dispatch({
            type: 'UPDATE_STATS',
            payload: {
                atributo: atributoNome,
                xpGanho: ganhoDeXp,
                incrementoNivel: 1 // Simplificação para subir direto após um treino completo
            }
        });

        return { 
            success: true, 
            atributo: atributoNome, 
            xpAplicado: ganhoDeXp, 
            energiaGasta: custoEnergia 
        };
    }
};

// Exportando globalmente
window.IdleSystem = IdleSystem;
