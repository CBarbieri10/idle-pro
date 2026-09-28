// database.js - Sistema Estrito de E-commerce RMT
const GameDatabase = {
    // Itens Cosméticos e Boosts de Utilidade
    lojaRMT: [
        {
            sku: "HAIR_01_EPICO",
            nome: "Cabelo Rosa Cyber",
            categoria: "Cosmetico",
            equipSlot: "cabeca",
            imgSrc: "img/cabelo-rosa.png",
            raridade: "Epico",
            preco: 300,
            desc: "Penteado futurista chamativo que brilha sob holofotes."
        },
        {
            sku: "UNIFORM_01_LENDARIO",
            nome: "Manto Estelar",
            categoria: "Cosmetico",
            equipSlot: "tronco",
            imgSrc: "img/uniforme-estelar.png",
            raridade: "Lendario",
            preco: 2500,
            desc: "Tecido importado de fibra de carbono para aerodinâmica suprema."
        },
        {
            sku: "BOOT_01_COMUM",
            nome: "Chuteira Básica",
            categoria: "Cosmetico",
            equipSlot: "pes",
            imgSrc: "img/chuteira-comum.png",
            raridade: "Comum",
            preco: 50,
            desc: "Uma chuteira simples de couro. Leve e durável."
        },
        {
            sku: "BOOT_02_EPICO",
            nome: "Chuteira Apex Predator",
            categoria: "Cosmetico",
            equipSlot: "pes",
            imgSrc: "img/chuteira-apex.png",
            raridade: "Epico",
            preco: 500,
            desc: "Explosão física instantânea para o segundo tempo. Deixa um rastro púrpura no campo."
        },
        {
            sku: "BOOT_03_LENDARIO",
            nome: "Chuteira Golden Flash",
            categoria: "Cosmetico",
            equipSlot: "pes",
            imgSrc: "img/chuteira-golden.png",
            raridade: "Lendario",
            preco: 1500,
            desc: "Apenas para a elite. Emite pura energia dourada nos gramados."
        },
        {
            sku: "BOOST_XP_01",
            nome: "Bebida Energética",
            categoria: "Utilitario",
            equipSlot: "acessorio", // Opcional, para aparecer no slot de utilitario
            imgSrc: "img/boost-xp.png",
            raridade: "Incomum",
            preco: 200,
            desc: "+20% de ganho de XP (Boost Passivo)."
        }
    ]
};

// Expondo globalmente para outros scripts
window.GameDatabase = GameDatabase;
