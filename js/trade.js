// trade.js - E-commerce e Cartões 3D Tilt

const TradeSystem = {
    comprarItem: function(sku) {
        try {
            const item = window.GameDatabase.lojaRMT.find(i => i.sku === sku);
            if (!item) return false;

            const state = IdleSystem.loadState();
            
            if (state.premiumCoins < item.preco) {
                alert("Saldo insuficiente!");
                return false;
            }

            if (state.inventario.some(i => i.sku === sku) && item.categoria === "Cosmetico") {
                alert("Você já possui este item!");
                return false;
            }

            state.premiumCoins -= item.preco;
            state.inventario.push({
                sku: item.sku, nome: item.nome, raridade: item.raridade,
                categoria: item.categoria, equipado: false
            });

            IdleSystem.saveState(state);
            IdleSystem.updateTopBarHUD();
            this.renderizarMercado(); 
            
            if (item.categoria === "Cosmetico") this.equiparItem(item.sku);
            return true;
        } catch (e) {
            console.error(e); return false;
        }
    },

    equiparItem: function(sku) {
        try {
            const state = IdleSystem.loadState();
            const itemToEquip = state.inventario.find(i => i.sku === sku);
            if(!itemToEquip) return false;

            const dbItem = window.GameDatabase.lojaRMT.find(i => i.sku === sku);
            const slotTarget = dbItem ? dbItem.equipSlot : "none";

            // Desequipa os itens do mesmo slot
            state.inventario.forEach(i => {
                const iDb = window.GameDatabase.lojaRMT.find(db => db.sku === i.sku);
                if(iDb && iDb.equipSlot === slotTarget) {
                    i.equipado = false;
                }
            });
            itemToEquip.equipado = true;
            IdleSystem.saveState(state);
            
            this.renderizarAvatar();
            return true;
        } catch(e) { return false; }
    },

    renderizarAvatar: function() {
        const state = IdleSystem.loadState();
        if (!state) return;

        // Resetar UI e Imagens
        const slotsUI = {
            cabeca: document.getElementById('ui-slot-cabeca'),
            tronco: document.getElementById('ui-slot-tronco'),
            pes: document.getElementById('ui-slot-pes'),
            acessorio: document.getElementById('ui-slot-acessorio')
        };
        const imgs = {
            cabeca: document.getElementById('camada-cabelo'),
            tronco: document.getElementById('camada-uniforme'),
            pes: document.getElementById('camada-pes'),
            acessorio: document.getElementById('camada-acessorio')
        };

        // Reseta todos os slots pra padrão
        Object.values(slotsUI).forEach(el => {
            if(el) {
                el.classList.remove("epic", "legendary");
                el.style.backgroundImage = "none";
            }
        });
        if(imgs.cabeca) imgs.cabeca.src = "img/transparent.png";
        if(imgs.tronco) imgs.tronco.src = "img/uniforme-default.png";
        if(imgs.pes) imgs.pes.src = "img/transparent.png";
        if(imgs.acessorio) imgs.acessorio.src = "img/transparent.png";

        // Aplica itens equipados
        state.inventario.filter(i => i.equipado).forEach(invItem => {
            const dbItem = window.GameDatabase.lojaRMT.find(db => db.sku === invItem.sku);
            if (!dbItem) return;
            
            const slot = dbItem.equipSlot;
            
            // 1. Aplica na imagem principal do avatar
            if (imgs[slot]) {
                imgs[slot].src = dbItem.imgSrc;
            }

            // 2. Aplica Glow e Imagem no Slot da UI
            if (slotsUI[slot]) {
                slotsUI[slot].style.backgroundImage = `url('${dbItem.imgSrc}')`;
                if (dbItem.raridade === "Epico") slotsUI[slot].classList.add("epic");
                if (dbItem.raridade === "Lendario") slotsUI[slot].classList.add("legendary");
            }
        });
        
        if (typeof window.atualizarAvatarPhaser === 'function') {
            window.atualizarAvatarPhaser();
        }
    },

    renderizarMercado: function() {
        const grid = document.getElementById("rmt-grid");
        if (!grid) return;
        
        grid.innerHTML = "";
        const state = IdleSystem.loadState();

        window.GameDatabase.lojaRMT.forEach(item => {
            const jaPossui = state.inventario.some(i => i.sku === item.sku);
            
            let cssClass = "card-rmt";
            let iconCode = "ph-sneaker"; // chuteira default
            
            if(item.categoria === "Utilitario") iconCode = "ph-lightning";
            if(item.raridade === "Epico") cssClass += " epic";
            if(item.raridade === "Lendario") cssClass += " legendary";

            const div = document.createElement("div");
            div.className = cssClass;
            div.setAttribute("data-tilt", "");
            div.setAttribute("data-tilt-glare", "");
            div.setAttribute("data-tilt-max-glare", "0.4");
            
            div.innerHTML = `
                <i class="ph-fill ${iconCode}"></i>
                <div class="rmt-nome">${item.nome.toUpperCase()}</div>
                <div class="rmt-desc">${item.desc}</div>
                <div class="rmt-footer">
                    <span class="rmt-preco"><i class="ph-fill ph-coin"></i> ${item.preco}</span>
                    <button class="action-btn ${jaPossui ? 'btn-outline' : 'neon-cyan-btn'}" 
                        style="width: 50%; padding: 10px;"
                        ${jaPossui ? 'disabled' : `onclick="TradeSystem.comprarItem('${item.sku}')"`}>
                        ${jaPossui ? 'OBTIDO' : 'COMPRAR'}
                    </button>
                </div>
            `;
            grid.appendChild(div);
        });

        // Inicializa o Tilt pros novos elementos do grid dinâmico
        if (window.VanillaTilt) {
            VanillaTilt.init(grid.querySelectorAll(".card-rmt"));
        }
    }
};

window.TradeSystem = TradeSystem;
