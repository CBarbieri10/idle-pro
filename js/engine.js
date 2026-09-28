// js/engine.js - Motor Phaser 3
// Arquiteto de Phaser 3: Motor otimizado com Scale Manager nativo e rendering AAA.

class WorldScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WorldScene' });
    }

    preload() {
        const graphics = this.make.graphics();

        // 1. CHÃO: Padrão Limpo (Xadrez sutil em tons terrosos escuros para a Várzea)
        graphics.fillStyle(0x2d241c, 1); // Terra escura base
        graphics.fillRect(0, 0, 64, 64);
        graphics.fillStyle(0x352b22, 1); // Xadrez mais claro sutil
        graphics.fillRect(0, 0, 32, 32);
        graphics.fillRect(32, 32, 32, 32);
        graphics.generateTexture('tile_varzea', 64, 64);
        graphics.clear();

        // 2. JOGADOR: Peça de Prancheta Tática (Pino Metálico)
        graphics.fillStyle(0x1a1a1a, 1); // Borda externa escura
        graphics.fillCircle(16, 16, 16);
        graphics.fillStyle(0x404040, 1); // Corpo metálico claro
        graphics.fillCircle(16, 16, 14);
        graphics.fillStyle(0x222222, 1); // Núcleo escuro profundo
        graphics.fillCircle(16, 16, 10);
        graphics.generateTexture('player_base', 32, 32);
        graphics.clear();

        // 3. Zonas (Sem glow pesado - Polido)
        graphics.fillStyle(0x064e3b, 0.8);
        graphics.fillRect(0, 0, 200, 150);
        graphics.generateTexture('zone_ct', 200, 150);
        graphics.clear();

        graphics.fillStyle(0x334155, 0.8);
        graphics.fillRect(0, 0, 150, 100);
        graphics.generateTexture('zone_transport', 150, 100);
        graphics.clear();

        graphics.fillStyle(0x7f1d1d, 0.8);
        graphics.fillRect(0, 0, 200, 120);
        graphics.generateTexture('zone_boss', 200, 120);
        graphics.clear();
    }

    create() {
        const worldWidth = 2400;
        const worldHeight = 1800;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // Tilemap cobrindo todo o mundo (Otimizado via TileSprite)
        this.add.tileSprite(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 'tile_varzea');

        // Zonas de Interação
        this.transportZone = this.add.image(1800, 600, 'zone_transport');
        this.add.text(1800, 540, 'RODOVIÁRIA (OLHEIROS)', { fontSize: '14px', fill: '#cbd5e1', fontStyle: 'bold' }).setOrigin(0.5);

        this.bossZone = this.add.image(worldWidth / 2, 200, 'zone_boss');
        this.add.text(worldWidth / 2, 130, 'ESTÁDIO DO BOSS', { fontSize: '18px', fill: '#f87171', fontStyle: 'bold' }).setOrigin(0.5);

        // Jogador (Container para unir Gráfico Metálico + Número)
        this.playerSprite = this.add.sprite(0, 0, 'player_base');
        this.playerText = this.add.text(0, 0, '10', { fontSize: '14px', fill: '#FFF', fontStyle: 'bold', fontFamily: 'sans-serif' }).setOrigin(0.5);
        this.player = this.add.container(worldWidth / 2, worldHeight / 2, [this.playerSprite, this.playerText]);
        
        // Habilita física no Container
        this.physics.world.enable(this.player);
        this.player.body.setSize(32, 32);
        this.player.body.setOffset(-16, -16);
        this.player.body.setCollideWorldBounds(true);

        // Câmera Tática (Scale Manager faz o viewport crescer nativamente)
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.5); // Dá a visão de prancheta

        // Controles
        this.cursors = this.input.keyboard.createCursorKeys(); 
        this.keys = this.input.keyboard.addKeys('W,A,S,D');
        this.input.keyboard.on('keydown-SPACE', this.handleInteraction, this);
    }

    handleInteraction() {
        const px = this.player.x;
        const py = this.player.y;
        const tx = this.transportZone.x;
        const ty = this.transportZone.y;
        const bx = this.bossZone.x;
        const by = this.bossZone.y;

        // Distância euclidiana simples para colisão de contêineres/zonas
        if (Phaser.Math.Distance.Between(px, py, tx, ty) < 100) {
            document.dispatchEvent(new CustomEvent('SCOUT_ACTION'));
        } 
        else if (Phaser.Math.Distance.Between(px, py, bx, by) < 120) {
            document.dispatchEvent(new CustomEvent('BOSS_ACTION'));
        }
    }

    update() {
        const speed = 250;
        let velX = 0;
        let velY = 0;

        if (this.cursors.left.isDown || this.keys.A.isDown) velX = -speed;
        else if (this.cursors.right.isDown || this.keys.D.isDown) velX = speed;

        if (this.cursors.up.isDown || this.keys.W.isDown) velY = -speed;
        else if (this.cursors.down.isDown || this.keys.S.isDown) velY = speed;

        if (velX !== 0 && velY !== 0) {
            velX *= Math.SQRT1_2;
            velY *= Math.SQRT1_2;
        }

        this.player.body.setVelocity(velX, velY);
    }
}

// Configuração Engine AAA
const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE, // Adaptação Nativa AAA (Sem listeners HTML gambiarra)
        width: '100%',
        height: '100%',
        parent: 'game-container'
    },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [WorldScene]
};

window.GameEngine = new Phaser.Game(config);
