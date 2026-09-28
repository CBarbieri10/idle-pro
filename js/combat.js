// js/combat.js - Matriz Tática e Sistema de Fusão (Breeding)
// Analista de Desempenho (Agente 3): Inteligência Competitiva e RNG
// RESTRIÇÃO HARD: Sem manipulação de DOM. Apenas data-driven.

const CombatSystem = {
    // Motor "Quick Match" Assíncrono
    // Avalia o desempenho através de cruzamento de indicadores, em vez de OVR simples.
    resolveQuickMatch: function(playerStats, bossStats) {
        let scorePlayer = 0;
        let scoreBoss = 0;
        let feedbackLines = [];

        // Função utilitária para extrair indicadores dinamicamente da array
        const extractStat = (statsArray, keyword) => {
            const obj = statsArray.find(s => s.nome.toLowerCase().includes(keyword.toLowerCase()));
            return obj ? obj.valor : 50; // OVR base de escape
        };

        const plPasse = extractStat(playerStats, 'passe') || extractStat(playerStats, 'técnica');
        const bossLeitura = extractStat(bossStats, 'leitura') || extractStat(bossStats, 'posicionamento');
        
        const plFisico = extractStat(playerStats, 'intensidade') || extractStat(playerStats, 'explosão');
        const bossCombate = extractStat(bossStats, 'duelos') || extractStat(bossStats, 'força');

        // 1º Cálculo de Sinergia: Criação vs Contenção (Peso Específico: 1.2x)
        if (plPasse > (bossLeitura * 1.2)) {
            scorePlayer += 2;
            feedbackLines.push("Um Passe de Ruptura magnífico quebrou completamente a linha de Leitura do Boss.");
        } else if (bossLeitura > plPasse) {
            scoreBoss += 1;
            feedbackLines.push("A Leitura Defensiva do adversário bloqueou suas principais tentativas de passe.");
        }

        // 2º Cálculo de Sinergia: Físico vs Físico
        if (plFisico > bossCombate) {
            scorePlayer += 1;
            feedbackLines.push("Sua Intensidade no segundo tempo esmagou os Duelos do adversário.");
        } else {
            scoreBoss += 2;
            feedbackLines.push("A imposição física do Boss dominou o meio de campo, anulando sua explosão.");
        }

        // 3º RNG de Matriz (O imponderável do esporte)
        const RNG_FATOR = Math.random();
        if (RNG_FATOR > 0.85) {
            scorePlayer += 1;
            feedbackLines.push("Uma falha bizarra do goleiro garantiu um gol de sorte ao seu favor!");
        } else if (RNG_FATOR < 0.15) {
            scoreBoss += 1;
            feedbackLines.push("Bola na trave e erro de arbitragem custaram caro à sua equipe.");
        }

        const victory = (scorePlayer > scoreBoss);

        return {
            victory: victory,
            score: `${scorePlayer} - ${scoreBoss}`,
            feedbackTactical: feedbackLines.join(" ")
        };
    },

    // Sistema de Fornalha (Breeding) - Retenção e RNG
    mergePlayers: function(card1, card2, card3) {
        const store = window.GameStore;
        if (!store) return { success: false, msg: "Store global não detectado." };

        // Hard checks do Game Design Document
        if (!card1 || !card2 || !card3) {
            return { success: false, msg: "São necessárias 3 cartas para a fusão." };
        }

        if (card1.raridade !== card2.raridade || card2.raridade !== card3.raridade) {
            return { success: false, msg: "As 3 cartas DEVEM possuir a mesma Raridade." };
        }

        if (card1.posicao !== card2.posicao || card2.posicao !== card3.posicao) {
            return { success: false, msg: "As 3 cartas DEVEM atuar na mesma Posição." };
        }

        // Tabela de Hierarquia
        const arvoreRaridade = ["comum", "incomum", "raro", "epico"];
        const currIndex = arvoreRaridade.indexOf(card1.raridade.toLowerCase());

        if (currIndex === -1 || currIndex === arvoreRaridade.length - 1) {
            return { success: false, msg: "Cartas já alcançaram a raridade máxima no ciclo atual." };
        }

        const targetRaridade = arvoreRaridade[currIndex + 1];

        // Cálculo de Pity System (Recuperado do Store)
        const state = store.getState();
        const MAX_PITY_ALLOWANCE = 4; // Na 5ª falha, o sucesso é absoluto
        const pityCounter = state.gachaSystem.pityCounter;
        
        const RNG_FATOR = Math.random();
        const CHANCE_BASE = 0.50; // 50% de chance nativa de dar certo
        
        let sucesso = false;

        if (pityCounter >= MAX_PITY_ALLOWANCE) {
            // Garantia Estatística (Pity Ativado)
            sucesso = true;
            store.dispatch({ type: 'RESET_PITY' });
        } else {
            if (RNG_FATOR <= CHANCE_BASE) {
                sucesso = true;
                store.dispatch({ type: 'RESET_PITY' });
            } else {
                sucesso = false;
                store.dispatch({ type: 'INCREMENT_PITY' });
            }
        }

        if (sucesso) {
            return {
                success: true,
                novaRaridade: targetRaridade,
                msg: `FUSÃO BEM SUCEDIDA! Você obteve uma carta ${targetRaridade.toUpperCase()}!`,
                novoItem: {
                    id: Date.now(),
                    posicao: card1.posicao,
                    raridade: targetRaridade,
                    nome: `Atleta Aprimorado`
                }
            };
        } else {
            return {
                success: false,
                msg: `FUSÃO FALHOU. Cartas consumidas. Seu Pity Counter subiu para ${pityCounter + 1}.`
            };
        }
    }
};

// Exportando globalmente
window.CombatSystem = CombatSystem;
