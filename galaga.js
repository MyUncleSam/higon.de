// Galaga Animation
window.GalagaGame = class GalagaGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        // Skalierung basierend auf Bildschirmgröße
        const scale = Math.min(canvas.width, canvas.height) / 600;
        this.enemySize = Math.floor(26 * scale);
        this.bossSize = Math.floor(32 * scale);
        this.playerSize = Math.floor(28 * scale);
        this.bulletWidth = Math.max(2, Math.floor(3 * scale));
        this.bulletHeight = Math.max(6, Math.floor(16 * scale));
        this.starSize = Math.max(1, scale * 1.5);

        this.enemies = [];
        this.bullets = [];
        this.playerX = canvas.width / 2;
        this.playerY = canvas.height - canvas.height * 0.15;
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
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * this.starSize + this.starSize * 0.5
            });
        }
    }

    initEnemies() {
        const rows = 3;
        const cols = 6;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const startY = this.canvas.height * 0.15;
        const spacingX = Math.max(50, this.bossSize * 1.8);
        const spacingY = Math.max(45, this.bossSize * 1.6);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const homeX = centerX - (cols - 1) * spacingX / 2 + col * spacingX;
                const homeY = startY + row * spacingY;

                // Verschiedene Einflug-Pfade
                const pathType = (row + col) % 4;
                let pathStartX, pathStartY, controlPoints;

                switch (pathType) {
                    case 0: // Von links oben, Kurve nach rechts
                        pathStartX = -50;
                        pathStartY = -50;
                        controlPoints = [
                            { x: centerX / 3, y: centerY / 3 },
                            { x: centerX, y: -30 }
                        ];
                        break;
                    case 1: // Von rechts oben, Kurve nach links
                        pathStartX = this.canvas.width + 50;
                        pathStartY = -50;
                        controlPoints = [
                            { x: this.canvas.width * 2 / 3, y: centerY / 3 },
                            { x: centerX, y: -30 }
                        ];
                        break;
                    case 2: // Von oben Mitte, Spirale
                        pathStartX = centerX;
                        pathStartY = -100;
                        controlPoints = [
                            { x: centerX + 100, y: 50 },
                            { x: centerX - 100, y: 80 }
                        ];
                        break;
                    case 3: // Von unten, Schleife nach oben
                        pathStartX = centerX + (col % 2 === 0 ? -150 : 150);
                        pathStartY = this.canvas.height + 50;
                        controlPoints = [
                            { x: centerX + (col % 2 === 0 ? 100 : -100), y: centerY },
                            { x: centerX, y: 50 }
                        ];
                        break;
                }

                this.enemies.push({
                    x: pathStartX,
                    y: pathStartY,
                    homeX: homeX,
                    homeY: homeY,
                    phase: 'entering',
                    enterProgress: -(row * cols + col) * 0.05, // Gestaffelt einfliegen
                    controlPoints: controlPoints,
                    startX: pathStartX,
                    startY: pathStartY,
                    diveAngle: 0,
                    alive: true,
                    type: row === 0 ? 'boss' : 'soldier'
                });
            }
        }
    }

    drawPlayer() {
        const ctx = this.ctx;
        const x = this.playerX;
        const y = this.playerY;
        const size = this.playerSize;

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
        ctx.fillRect(x - size * 1.5, y + size * 0.2, size * 0.6, size * 0.5);
        ctx.fillRect(x + size * 0.9, y + size * 0.2, size * 0.6, size * 0.5);

        // Cockpit
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawEnemy(enemy) {
        if (!enemy.alive) return;

        const ctx = this.ctx;
        const x = enemy.x;
        const y = enemy.y;
        const size = enemy.type === 'boss' ? this.bossSize : this.enemySize;
        const frame = Math.floor(Date.now() / 200) % 2;

        // Farbe basierend auf Typ
        if (enemy.type === 'boss') {
            ctx.fillStyle = '#ffaa00';
            ctx.strokeStyle = '#ffff00';
        } else {
            ctx.fillStyle = this.colors.enemy;
            ctx.strokeStyle = this.colors.enemyAccent;
        }
        ctx.lineWidth = Math.max(1, size * 0.06);

        // Körper
        ctx.beginPath();
        ctx.ellipse(x, y, size * 0.6, size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Flügel (animiert)
        const wingSpread = frame === 0 ? 1.1 : 0.8;
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
        ctx.fillStyle = enemy.type === 'boss' ? '#ff0000' : this.colors.enemyAccent;
        ctx.beginPath();
        ctx.arc(x - size * 0.2, y - size * 0.2, size * 0.15, 0, Math.PI * 2);
        ctx.arc(x + size * 0.2, y - size * 0.2, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBullet(bullet) {
        this.ctx.fillStyle = this.colors.bullet;
        this.ctx.fillRect(bullet.x - this.bulletWidth / 2, bullet.y, this.bulletWidth, this.bulletHeight);
    }

    drawStars() {
        this.ctx.fillStyle = this.colors.stars;
        for (let star of this.stars) {
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        }
    }

    // Berechne Position entlang Bezier-Kurve für Einflug
    getBezierPoint(t, start, control1, control2, end) {
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        const t2 = t * t;
        const t3 = t2 * t;

        return {
            x: mt3 * start.x + 3 * mt2 * t * control1.x + 3 * mt * t2 * control2.x + t3 * end.x,
            y: mt3 * start.y + 3 * mt2 * t * control1.y + 3 * mt * t2 * control2.y + t3 * end.y
        };
    }

    update() {
        this.time++;

        // Variante 0: Formation mit Tauchgängen
        // Variante 1: Spiralbewegung
        // Variante 2: Wellenförmige Angriffe
        for (let enemy of this.enemies) {
            if (!enemy.alive) continue;

            if (enemy.phase === 'entering') {
                enemy.enterProgress += 0.015;

                if (enemy.enterProgress >= 0 && enemy.enterProgress < 1) {
                    // Fliege entlang Bezier-Kurve ein
                    const pos = this.getBezierPoint(
                        enemy.enterProgress,
                        { x: enemy.startX, y: enemy.startY },
                        enemy.controlPoints[0],
                        enemy.controlPoints[1],
                        { x: enemy.homeX, y: enemy.homeY }
                    );
                    enemy.x = pos.x;
                    enemy.y = pos.y;
                } else if (enemy.enterProgress >= 1) {
                    // Einflug abgeschlossen, in Formation
                    enemy.x = enemy.homeX;
                    enemy.y = enemy.homeY;
                    enemy.phase = 'formation';
                }
            } else if (enemy.phase === 'formation') {
                if (this.animationVariant === 0) {
                    // Gelegentlich tauchen
                    if (Math.random() < 0.008) {
                        enemy.phase = 'diving';
                        enemy.diveAngle = 0;
                    }
                } else if (this.animationVariant === 1) {
                    // Spirale
                    const angle = this.time * 0.02 + enemy.homeX * 0.01;
                    const spiralRadius = Math.max(30, this.bossSize * 1.2);
                    enemy.x = enemy.homeX + Math.sin(angle) * spiralRadius;
                    enemy.y = enemy.homeY + Math.cos(angle) * (spiralRadius * 0.5);
                } else if (this.animationVariant === 2) {
                    // Welle
                    const waveAmplitude = Math.max(50, this.bossSize * 1.8);
                    enemy.x = enemy.homeX + Math.sin(this.time * 0.05 + enemy.homeY * 0.1) * waveAmplitude;
                }
            } else if (enemy.phase === 'diving') {
                // Tauchgang mit Kurve
                enemy.diveAngle += 0.04;
                const diveAmplitude = Math.max(100, this.bossSize * 3.5);
                const diveSpeed = Math.max(50, this.bossSize * 1.8);
                const diveX = Math.sin(enemy.diveAngle * 2) * diveAmplitude;
                const diveY = enemy.diveAngle * diveSpeed;

                enemy.x = enemy.homeX + diveX;
                enemy.y = enemy.homeY + diveY;

                if (enemy.y > this.canvas.height + 50) {
                    // Zurück zum Einflug
                    enemy.phase = 'entering';
                    enemy.enterProgress = -0.2;
                    enemy.x = enemy.startX;
                    enemy.y = enemy.startY;
                }
            }
        }

        // Spieler bewegen
        const playerSpeed = Math.max(2, this.playerSize * 0.15);
        const playerRange = Math.max(180, this.canvas.width * 0.35);

        if (this.animationVariant === 0) {
            this.playerX += Math.sin(this.time * 0.02) * playerSpeed;
        } else if (this.animationVariant === 1) {
            this.playerX = this.canvas.width / 2 + Math.sin(this.time * 0.03) * playerRange;
        } else {
            this.playerX += playerSpeed * 1.3;
            if (this.playerX > this.canvas.width) this.playerX = 0;
        }

        // Schüsse
        if (Math.random() < 0.06) {
            this.bullets.push({
                x: this.playerX,
                y: this.playerY - this.playerSize
            });
        }

        // Bullets bewegen
        const bulletSpeed = Math.max(5, this.playerSize * 0.25);
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= bulletSpeed;
            return bullet.y > 0;
        });

        // Kollisionserkennung
        const hitRadius = Math.max(20, this.bossSize * 0.8);
        for (let bullet of this.bullets) {
            for (let enemy of this.enemies) {
                if (enemy.alive &&
                    Math.abs(bullet.x - enemy.x) < hitRadius &&
                    Math.abs(bullet.y - enemy.y) < hitRadius) {
                    enemy.alive = false;
                    bullet.y = -100;
                }
            }
        }

        // Neue Welle wenn alle zerstört
        if (this.enemies.every(e => !e.alive)) {
            this.enemies = [];
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
