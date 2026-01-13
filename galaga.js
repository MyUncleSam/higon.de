// Galaga Animation
window.GalagaGame = class GalagaGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.enemies = [];
        this.bullets = [];
        this.playerX = canvas.width / 2;
        this.playerY = canvas.height - 80;
        this.animationFrame = null;
        this.animationVariant = Math.floor(Math.random() * 3);
        this.time = 0;

        this.colors = {
            bg: '#000033',
            player: '#00ff00',
            enemy: '#ff0000',
            enemyAccent: '#ffff00',
            bullet: '#ffffff',
            stars: '#ffffff'
        };

        this.stars = [];
        this.initStars();
        this.initEnemies();
    }

    initStars() {
        for (let i = 0; i < 50; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2
            });
        }
    }

    initEnemies() {
        const count = 12;
        for (let i = 0; i < count; i++) {
            this.enemies.push({
                x: (this.canvas.width / (count + 1)) * (i + 1),
                y: -50 - i * 30,
                homeX: (this.canvas.width / (count + 1)) * (i + 1),
                homeY: 100 + Math.floor(i / 4) * 50,
                phase: 'entering', // entering, formation, diving
                diveAngle: 0,
                alive: true
            });
        }
    }

    drawPlayer() {
        const ctx = this.ctx;
        const x = this.playerX;
        const y = this.playerY;
        const size = 20;

        ctx.fillStyle = this.colors.player;

        // Schiff-Körper
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x - size, y + size);
        ctx.lineTo(x, y + size * 0.5);
        ctx.lineTo(x + size, y + size);
        ctx.closePath();
        ctx.fill();

        // Flügel
        ctx.fillRect(x - size * 1.5, y + size * 0.2, size * 0.5, size * 0.4);
        ctx.fillRect(x + size, y + size * 0.2, size * 0.5, size * 0.4);
    }

    drawEnemy(enemy) {
        if (!enemy.alive) return;

        const ctx = this.ctx;
        const x = enemy.x;
        const y = enemy.y;
        const size = 18;
        const frame = Math.floor(Date.now() / 200) % 2;

        // Galaga Insekten-Design
        ctx.fillStyle = this.colors.enemy;
        ctx.strokeStyle = this.colors.enemyAccent;
        ctx.lineWidth = 2;

        // Körper
        ctx.beginPath();
        ctx.ellipse(x, y, size * 0.6, size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Flügel (animiert)
        const wingSpread = frame === 0 ? 1.0 : 0.7;
        ctx.beginPath();
        ctx.moveTo(x - size * wingSpread, y - size * 0.3);
        ctx.lineTo(x - size * 0.3, y);
        ctx.lineTo(x - size * wingSpread, y + size * 0.5);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + size * wingSpread, y - size * 0.3);
        ctx.lineTo(x + size * 0.3, y);
        ctx.lineTo(x + size * wingSpread, y + size * 0.5);
        ctx.stroke();

        // Augen
        ctx.fillStyle = this.colors.enemyAccent;
        ctx.beginPath();
        ctx.arc(x - size * 0.2, y - size * 0.2, size * 0.15, 0, Math.PI * 2);
        ctx.arc(x + size * 0.2, y - size * 0.2, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBullet(bullet) {
        this.ctx.fillStyle = this.colors.bullet;
        this.ctx.fillRect(bullet.x - 2, bullet.y, 4, 12);
    }

    drawStars() {
        this.ctx.fillStyle = this.colors.stars;
        for (let star of this.stars) {
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        }
    }

    update() {
        this.time++;

        // Variante 0: Formation mit Tauchgängen
        // Variante 1: Spiralbewegung
        // Variante 2: Wellenförmige Angriffe
        for (let enemy of this.enemies) {
            if (!enemy.alive) continue;

            if (enemy.phase === 'entering') {
                // Feinde fliegen in Formation
                enemy.y += 2;
                if (enemy.y >= enemy.homeY) {
                    enemy.phase = 'formation';
                }
            } else if (enemy.phase === 'formation') {
                if (this.animationVariant === 0) {
                    // Gelegentlich tauchen
                    if (Math.random() < 0.01) {
                        enemy.phase = 'diving';
                        enemy.diveAngle = 0;
                    }
                } else if (this.animationVariant === 1) {
                    // Spirale
                    const angle = this.time * 0.02 + enemy.homeX * 0.01;
                    enemy.x = enemy.homeX + Math.sin(angle) * 30;
                    enemy.y = enemy.homeY + Math.cos(angle) * 15;
                } else if (this.animationVariant === 2) {
                    // Welle
                    enemy.x = enemy.homeX + Math.sin(this.time * 0.05 + enemy.homeY * 0.1) * 50;
                }
            } else if (enemy.phase === 'diving') {
                // Tauchgang
                enemy.diveAngle += 0.05;
                const diveX = Math.sin(enemy.diveAngle * 2) * 100;
                const diveY = enemy.diveAngle * 50;

                enemy.x = enemy.homeX + diveX;
                enemy.y = enemy.homeY + diveY;

                if (enemy.y > this.canvas.height + 50) {
                    enemy.phase = 'entering';
                    enemy.y = -50;
                }
            }
        }

        // Spieler bewegen
        if (this.animationVariant === 0) {
            this.playerX += Math.sin(this.time * 0.02) * 3;
        } else if (this.animationVariant === 1) {
            this.playerX = this.canvas.width / 2 + Math.sin(this.time * 0.03) * 200;
        } else {
            this.playerX += 4;
            if (this.playerX > this.canvas.width) this.playerX = 0;
        }

        // Schüsse
        if (Math.random() < 0.08) {
            this.bullets.push({
                x: this.playerX,
                y: this.playerY - 20
            });
        }

        // Bullets bewegen
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= 6;
            return bullet.y > 0;
        });

        // Kollisionserkennung
        for (let bullet of this.bullets) {
            for (let enemy of this.enemies) {
                if (enemy.alive &&
                    Math.abs(bullet.x - enemy.x) < 20 &&
                    Math.abs(bullet.y - enemy.y) < 20) {
                    enemy.alive = false;
                    bullet.y = -100; // Bullet entfernen
                }
            }
        }

        // Neue Feinde wenn alle zerstört
        if (this.enemies.every(e => !e.alive)) {
            this.initEnemies();
        }
    }

    draw() {
        // Hintergrund
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Sterne
        this.drawStars();

        // Feinde
        for (let enemy of this.enemies) {
            this.drawEnemy(enemy);
        }

        // Bullets
        for (let bullet of this.bullets) {
            this.drawBullet(bullet);
        }

        // Spieler
        this.drawPlayer();
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
