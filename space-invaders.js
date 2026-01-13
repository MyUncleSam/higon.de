// Space Invaders Animation
window.SpaceInvadersGame = class SpaceInvadersGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.aliens = [];
        this.bullets = [];
        this.playerX = canvas.width / 2;
        this.animationFrame = null;
        this.alienDirection = 1;
        this.animationVariant = Math.floor(Math.random() * 3);

        this.colors = {
            bg: '#000',
            alien: '#00ff00',
            player: '#00ffff',
            bullet: '#ffffff'
        };

        this.initAliens();
    }

    initAliens() {
        const rows = 4;
        const cols = 8;
        const alienSize = 30;
        const spacing = 20;
        const startX = (this.canvas.width - (cols * (alienSize + spacing))) / 2;
        const startY = 50;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                this.aliens.push({
                    x: startX + col * (alienSize + spacing),
                    y: startY + row * (alienSize + spacing),
                    size: alienSize,
                    alive: true,
                    animFrame: 0
                });
            }
        }
    }

    drawAlien(alien) {
        if (!alien.alive) return;

        const ctx = this.ctx;
        const x = alien.x;
        const y = alien.y;
        const s = alien.size;
        const frame = Math.floor(Date.now() / 300) % 2;

        ctx.fillStyle = this.colors.alien;
        ctx.strokeStyle = this.colors.alien;
        ctx.lineWidth = 2;

        // Klassisches Space Invaders Design
        ctx.beginPath();

        // Körper
        if (frame === 0) {
            // Frame 1
            ctx.fillRect(x + s * 0.2, y, s * 0.6, s * 0.3);
            ctx.fillRect(x, y + s * 0.3, s, s * 0.4);
            ctx.fillRect(x + s * 0.1, y + s * 0.7, s * 0.3, s * 0.3);
            ctx.fillRect(x + s * 0.6, y + s * 0.7, s * 0.3, s * 0.3);
        } else {
            // Frame 2
            ctx.fillRect(x + s * 0.2, y, s * 0.6, s * 0.3);
            ctx.fillRect(x, y + s * 0.3, s, s * 0.4);
            ctx.fillRect(x, y + s * 0.7, s * 0.2, s * 0.3);
            ctx.fillRect(x + s * 0.8, y + s * 0.7, s * 0.2, s * 0.3);
        }

        // Augen
        ctx.fillStyle = '#000';
        ctx.fillRect(x + s * 0.3, y + s * 0.4, s * 0.1, s * 0.1);
        ctx.fillRect(x + s * 0.6, y + s * 0.4, s * 0.1, s * 0.1);
    }

    drawPlayer() {
        const ctx = this.ctx;
        const y = this.canvas.height - 60;
        const size = 40;

        ctx.fillStyle = this.colors.player;

        // Kanone
        ctx.fillRect(this.playerX - size / 2, y, size, size * 0.3);
        ctx.fillRect(this.playerX - size * 0.15, y - size * 0.4, size * 0.3, size * 0.4);

        // Basis
        ctx.fillRect(this.playerX - size * 0.7, y + size * 0.3, size * 1.4, size * 0.2);
    }

    drawBullet(bullet) {
        this.ctx.fillStyle = this.colors.bullet;
        this.ctx.fillRect(bullet.x - 2, bullet.y, 4, 15);
    }

    update() {
        // Aliens bewegen
        let moveDown = false;

        for (let alien of this.aliens) {
            if (!alien.alive) continue;

            alien.x += this.alienDirection * 2;

            if (alien.x <= 0 || alien.x >= this.canvas.width - alien.size) {
                moveDown = true;
            }
        }

        if (moveDown) {
            this.alienDirection *= -1;
            for (let alien of this.aliens) {
                alien.y += 20;
            }
        }

        // Bullets bewegen
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= 5;
            return bullet.y > 0;
        });

        // Variante 0: Zufällige Schüsse
        // Variante 1: Von links nach rechts schießend
        // Variante 2: Spieler folgt Aliens
        if (this.animationVariant === 0 && Math.random() < 0.05) {
            this.bullets.push({ x: this.playerX, y: this.canvas.height - 60 });
        } else if (this.animationVariant === 1) {
            this.playerX += 3;
            if (this.playerX > this.canvas.width) this.playerX = 0;
            if (Math.random() < 0.1) {
                this.bullets.push({ x: this.playerX, y: this.canvas.height - 60 });
            }
        } else if (this.animationVariant === 2) {
            // Spieler zielt auf Aliens
            const targetAlien = this.aliens.find(a => a.alive);
            if (targetAlien) {
                const diff = targetAlien.x - this.playerX;
                this.playerX += Math.sign(diff) * 4;
                if (Math.random() < 0.08) {
                    this.bullets.push({ x: this.playerX, y: this.canvas.height - 60 });
                }
            }
        }

        // Kollisionserkennung
        for (let bullet of this.bullets) {
            for (let alien of this.aliens) {
                if (alien.alive &&
                    bullet.x > alien.x &&
                    bullet.x < alien.x + alien.size &&
                    bullet.y > alien.y &&
                    bullet.y < alien.y + alien.size) {
                    alien.alive = false;
                }
            }
        }
    }

    draw() {
        // Hintergrund
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Aliens zeichnen
        for (let alien of this.aliens) {
            this.drawAlien(alien);
        }

        // Spieler zeichnen
        this.drawPlayer();

        // Bullets zeichnen
        for (let bullet of this.bullets) {
            this.drawBullet(bullet);
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        this.animationFrame = requestAnimationFrame(() => this.gameLoop());
    }

    start() {
        this.gameLoop();
    }

    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
};
