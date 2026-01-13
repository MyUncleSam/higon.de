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

        // Bewegungssteuerung für menschenähnliche Zielverfolgung
        this.playerVelocity = 0;
        this.targetEnemy = null;
        this.targetX = canvas.width / 2;
        this.speedChangeTimer = 0;

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
        this.initEnemies(); // Muss vor pickNewSpeed kommen da es formationMinX/MaxX setzt

        // Starte Spieler in der Mitte des Formation-Bereichs
        this.playerX = (this.formationMinX + this.formationMaxX) / 2;
        this.pickNewTargetEnemy();
    }

    pickNewTargetEnemy() {
        // Finde alle lebenden Feinde
        const aliveEnemies = this.enemies.filter(e => e.alive);

        if (aliveEnemies.length === 0) {
            this.targetEnemy = null;
            this.targetX = this.canvas.width / 2;
            return;
        }

        // Wähle zufälligen Feind als Ziel
        this.targetEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];

        // Ziel-X-Position ist die X-Position des Feindes (mit leichter Variation)
        const variation = (Math.random() - 0.5) * this.enemySize * 0.5;
        this.targetX = this.targetEnemy.x + variation;

        // Halte im Formation-Bereich
        this.targetX = Math.max(this.formationMinX, Math.min(this.formationMaxX, this.targetX));
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
        const rows = 4;
        const cols = 6;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const startY = this.canvas.height * 0.15;
        const spacingX = Math.max(50, this.bossSize * 1.8);
        const spacingY = Math.max(45, this.bossSize * 1.6);

        // Berechne Formation-Grenzen für Spieler-Bewegungsbereich
        this.formationMinX = centerX - (cols - 1) * spacingX / 2;
        this.formationMaxX = centerX + (cols - 1) * spacingX / 2;

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

                // Verschiedene Gegnertypen: Boss (oberste Reihe), Butterfly (2. Reihe), Bee (untere Reihen)
                let enemyType;
                if (row === 0) {
                    enemyType = 'boss';
                } else if (row === 1) {
                    enemyType = 'butterfly';
                } else {
                    enemyType = 'bee';
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
                    type: enemyType
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
        const frame = Math.floor(Date.now() / 200) % 2;

        if (enemy.type === 'boss') {
            this.drawBossGalaga(ctx, x, y, frame);
        } else if (enemy.type === 'butterfly') {
            this.drawButterfly(ctx, x, y, frame);
        } else {
            this.drawBee(ctx, x, y, frame);
        }
    }

    // Boss Galaga - Großer gelber Anführer
    drawBossGalaga(ctx, x, y, frame) {
        const size = this.bossSize;

        // Hauptkörper (gelb-orange)
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#FF8C00';
        ctx.lineWidth = 2;

        // Kopf
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.3, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Körper
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.ellipse(x, y + size * 0.2, size * 0.6, size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Antennen
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = Math.max(2, size * 0.08);
        ctx.beginPath();
        ctx.moveTo(x - size * 0.3, y - size * 0.6);
        ctx.lineTo(x - size * 0.15, y - size * 0.4);
        ctx.moveTo(x + size * 0.3, y - size * 0.6);
        ctx.lineTo(x + size * 0.15, y - size * 0.4);
        ctx.stroke();

        // Antennenspitzen
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(x - size * 0.3, y - size * 0.6, size * 0.1, 0, Math.PI * 2);
        ctx.arc(x + size * 0.3, y - size * 0.6, size * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Große Flügel (animiert)
        const wingAngle = frame === 0 ? 0 : Math.PI / 16;
        ctx.fillStyle = '#87CEEB';

        // Linker Flügel
        ctx.save();
        ctx.translate(x - size * 0.6, y);
        ctx.rotate(-wingAngle);
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.5, size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4682B4';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // Rechter Flügel
        ctx.save();
        ctx.translate(x + size * 0.6, y);
        ctx.rotate(wingAngle);
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.5, size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4682B4';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // Augen
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x - size * 0.2, y - size * 0.35, size * 0.12, 0, Math.PI * 2);
        ctx.arc(x + size * 0.2, y - size * 0.35, size * 0.12, 0, Math.PI * 2);
        ctx.fill();

        // Pupillen (rot für bösartigen Look)
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(x - size * 0.2, y - size * 0.35, size * 0.06, 0, Math.PI * 2);
        ctx.arc(x + size * 0.2, y - size * 0.35, size * 0.06, 0, Math.PI * 2);
        ctx.fill();
    }

    // Butterfly - Roter Schmetterlings-Feind
    drawButterfly(ctx, x, y, frame) {
        const size = this.enemySize;

        // Körper (rot)
        ctx.fillStyle = '#DC143C';
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.ellipse(x, y, size * 0.4, size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Schmetterlingsflügel (animiert)
        const wingSpread = frame === 0 ? 1.0 : 0.85;

        // Obere Flügel
        ctx.fillStyle = '#FF4500';

        // Linker oberer Flügel
        ctx.beginPath();
        ctx.ellipse(x - size * 0.5 * wingSpread, y - size * 0.2, size * 0.45, size * 0.35, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Rechter oberer Flügel
        ctx.beginPath();
        ctx.ellipse(x + size * 0.5 * wingSpread, y - size * 0.2, size * 0.45, size * 0.35, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Untere Flügel (kleiner)
        ctx.fillStyle = '#FF6347';

        // Linker unterer Flügel
        ctx.beginPath();
        ctx.ellipse(x - size * 0.4 * wingSpread, y + size * 0.3, size * 0.35, size * 0.25, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Rechter unterer Flügel
        ctx.beginPath();
        ctx.ellipse(x + size * 0.4 * wingSpread, y + size * 0.3, size * 0.35, size * 0.25, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Flügeldetails (weiße Punkte)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x - size * 0.5 * wingSpread, y - size * 0.2, size * 0.1, 0, Math.PI * 2);
        ctx.arc(x + size * 0.5 * wingSpread, y - size * 0.2, size * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Augen
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(x - size * 0.15, y - size * 0.1, size * 0.15, 0, Math.PI * 2);
        ctx.arc(x + size * 0.15, y - size * 0.1, size * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x - size * 0.15, y - size * 0.1, size * 0.08, 0, Math.PI * 2);
        ctx.arc(x + size * 0.15, y - size * 0.1, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
    }

    // Bee - Blauer Bienen-Feind
    drawBee(ctx, x, y, frame) {
        const size = this.enemySize;

        // Körper mit Streifen (blau-weiß)
        ctx.fillStyle = '#1E90FF';
        ctx.strokeStyle = '#000080';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.ellipse(x, y, size * 0.35, size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Streifen
        ctx.strokeStyle = '#87CEEB';
        ctx.lineWidth = Math.max(2, size * 0.12);
        ctx.beginPath();
        ctx.moveTo(x - size * 0.3, y - size * 0.2);
        ctx.lineTo(x + size * 0.3, y - size * 0.2);
        ctx.moveTo(x - size * 0.3, y + size * 0.1);
        ctx.lineTo(x + size * 0.3, y + size * 0.1);
        ctx.stroke();

        // Flügel (einfacher als Schmetterling, animiert)
        const wingY = frame === 0 ? -size * 0.6 : -size * 0.5;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.strokeStyle = '#B0C4DE';
        ctx.lineWidth = 1;

        // Linker Flügel
        ctx.beginPath();
        ctx.ellipse(x - size * 0.4, y + wingY * 0.5, size * 0.3, size * 0.5, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Rechter Flügel
        ctx.beginPath();
        ctx.ellipse(x + size * 0.4, y + wingY * 0.5, size * 0.3, size * 0.5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Augen
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x - size * 0.15, y - size * 0.15, size * 0.12, 0, Math.PI * 2);
        ctx.arc(x + size * 0.15, y - size * 0.15, size * 0.12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x - size * 0.15, y - size * 0.15, size * 0.06, 0, Math.PI * 2);
        ctx.arc(x + size * 0.15, y - size * 0.15, size * 0.06, 0, Math.PI * 2);
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

        // Menschenähnliche Spieler Bewegung - bewege zu Ziel-Feind
        const distanceToTarget = Math.abs(this.targetX - this.playerX);

        // Wenn Ziel erreicht oder Ziel-Feind tot, wähle neues Ziel
        if (distanceToTarget < 5 || (this.targetEnemy && !this.targetEnemy.alive)) {
            this.pickNewTargetEnemy();
        }

        // Aktualisiere Ziel-Position wenn Feind sich bewegt (bei Spirale/Welle)
        if (this.targetEnemy && this.targetEnemy.alive) {
            const variation = (Math.random() - 0.5) * this.enemySize * 0.3;
            this.targetX = this.targetEnemy.x + variation;
            this.targetX = Math.max(this.formationMinX, Math.min(this.formationMaxX, this.targetX));
        }

        // Berechne Geschwindigkeit basierend auf Distanz zum Ziel
        const direction = Math.sign(this.targetX - this.playerX);
        const baseSpeed = Math.max(2, this.playerSize * 0.15);

        let targetVelocity = 0;
        if (distanceToTarget > 5) {
            // Geschwindigkeit basiert auf Distanz, mit Maximum
            const maxSpeed = baseSpeed * (1.2 + Math.random() * 0.6); // Variable Geschwindigkeit
            const speedFactor = Math.min(1, distanceToTarget / 100); // Langsamer wenn nah am Ziel
            targetVelocity = direction * maxSpeed * speedFactor;
        }

        // Sanfte Beschleunigung/Verzögerung
        const accelRate = 0.12;
        this.playerVelocity += (targetVelocity - this.playerVelocity) * accelRate;

        // Spieler bewegen
        this.playerX += this.playerVelocity;

        // Im Formation-Bereich halten
        this.playerX = Math.max(this.formationMinX, Math.min(this.formationMaxX, this.playerX));

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
