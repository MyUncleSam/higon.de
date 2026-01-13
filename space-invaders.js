// Space Invaders Animation
window.SpaceInvadersGame = class SpaceInvadersGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        // Skalierung basierend auf Bildschirmgröße
        const scale = Math.min(canvas.width, canvas.height) / 600;
        this.alienSize = Math.floor(30 * scale);
        this.playerSize = Math.floor(40 * scale);

        this.aliens = [];
        this.bullets = [];
        this.playerX = canvas.width / 2;
        this.playerDirection = 1;
        this.animationFrame = null;
        this.alienDirection = 1;
        this.animationVariant = Math.floor(Math.random() * 3);

        // Menschenähnliche Bewegung
        this.playerVelocity = 0;
        this.targetPosition = canvas.width / 2;
        this.moveTimer = 0;
        this.isMoving = true;

        this.colors = {
            bg: '#000',
            alien: '#00ff00',
            player: '#00ffff',
            bullet: '#ffffff'
        };

        this.initAliens();
        this.pickNewTargetPosition();
    }

    initAliens() {
        const rows = 4;
        const cols = 8;
        const spacing = this.alienSize * 0.7;
        const startX = (this.canvas.width - (cols * (this.alienSize + spacing))) / 2;
        const startY = this.canvas.height * 0.1;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                this.aliens.push({
                    x: startX + col * (this.alienSize + spacing),
                    y: startY + row * (this.alienSize + spacing),
                    size: this.alienSize,
                    alive: true,
                    animFrame: 0
                });
            }
        }
    }

    pickNewTargetPosition() {
        // Wähle eine neue Zielposition im spielbaren Bereich
        const minX = this.playerSize * 2;
        const maxX = this.canvas.width - this.playerSize * 2;

        // Verschiedene Bewegungsmuster
        const pattern = Math.random();

        if (pattern < 0.3) {
            // Kurze Bewegung (nahe der aktuellen Position)
            const range = this.canvas.width * 0.15;
            this.targetPosition = this.playerX + (Math.random() - 0.5) * range;
        } else if (pattern < 0.6) {
            // Mittlere Bewegung
            const range = this.canvas.width * 0.3;
            this.targetPosition = this.playerX + (Math.random() - 0.5) * range;
        } else {
            // Große Bewegung (zu einer anderen Seite)
            this.targetPosition = minX + Math.random() * (maxX - minX);
        }

        // Im spielbaren Bereich halten
        this.targetPosition = Math.max(minX, Math.min(maxX, this.targetPosition));

        // Bewegungsdauer basierend auf Distanz
        const distance = Math.abs(this.targetPosition - this.playerX);
        this.moveTimer = distance / 2; // Proportional zur Distanz
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
        ctx.lineWidth = Math.max(1, s * 0.07);

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
        const y = this.canvas.height - this.canvas.height * 0.1;
        const size = this.playerSize;

        ctx.fillStyle = this.colors.player;

        // Kanone
        ctx.fillRect(this.playerX - size / 2, y, size, size * 0.3);
        ctx.fillRect(this.playerX - size * 0.15, y - size * 0.4, size * 0.3, size * 0.4);

        // Basis
        ctx.fillRect(this.playerX - size * 0.7, y + size * 0.3, size * 1.4, size * 0.2);
    }

    drawBullet(bullet) {
        const bulletWidth = Math.max(2, this.playerSize * 0.1);
        const bulletHeight = Math.max(8, this.playerSize * 0.4);
        this.ctx.fillStyle = this.colors.bullet;
        this.ctx.fillRect(bullet.x - bulletWidth / 2, bullet.y, bulletWidth, bulletHeight);
    }

    update() {
        // Aliens bewegen (nach links UND rechts wie im Original)
        let moveDown = false;
        const moveSpeed = Math.max(1, this.alienSize * 0.07);

        for (let alien of this.aliens) {
            if (!alien.alive) continue;

            alien.x += this.alienDirection * moveSpeed;

            // Prüfe ob Alien den Rand erreicht
            if (alien.x <= this.alienSize * 0.3 || alien.x >= this.canvas.width - alien.size - this.alienSize * 0.3) {
                moveDown = true;
            }
        }

        if (moveDown) {
            this.alienDirection *= -1;
            const dropDistance = this.alienSize * 0.7;
            for (let alien of this.aliens) {
                alien.y += dropDistance;

                // Reset wenn zu weit unten
                if (alien.y > this.canvas.height - this.canvas.height * 0.25) {
                    alien.y = this.canvas.height * 0.1;
                }
            }
        }

        // Bullets bewegen
        const bulletSpeed = Math.max(3, this.playerSize * 0.2);
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= bulletSpeed;
            return bullet.y > 0;
        });

        // Menschenähnliche Spieler Bewegung mit Zielverfolgung
        this.moveTimer--;

        // Neue Zielposition wählen wenn Timer abgelaufen oder Ziel erreicht
        const distanceToTarget = Math.abs(this.targetPosition - this.playerX);
        if (this.moveTimer <= 0 || distanceToTarget < 2) {
            this.pickNewTargetPosition();

            // Gelegentlich kurze Pause vor nächster Bewegung
            if (Math.random() < 0.15) {
                this.moveTimer = 10 + Math.random() * 30; // Kurze Pause
                this.targetPosition = this.playerX; // Bleib stehen
            }
        }

        // Berechne Beschleunigung zur Zielposition
        const direction = Math.sign(this.targetPosition - this.playerX);
        const baseAccel = Math.max(2, this.playerSize * 0.1) * 0.3;

        // Geschwindigkeit basierend auf Distanz zum Ziel anpassen
        let targetVelocity = 0;
        if (distanceToTarget > 5) {
            // Geschwindigkeit nimmt mit Distanz zu, hat aber ein Maximum
            const maxSpeed = Math.max(3, this.playerSize * 0.15);
            targetVelocity = direction * Math.min(maxSpeed, distanceToTarget * 0.1);
        }

        // Sanfte Interpolation zur Zielgeschwindigkeit (Beschleunigung/Verzögerung)
        const accelRate = 0.15;
        this.playerVelocity += (targetVelocity - this.playerVelocity) * accelRate;

        // Spieler bewegen
        this.playerX += this.playerVelocity;

        // Spieler im Bildschirm halten
        this.playerX = Math.max(this.playerSize, Math.min(this.canvas.width - this.playerSize, this.playerX));

        // Schießen mit variabler Frequenz
        let shootChance = 0.06;
        if (this.animationVariant === 1) shootChance = 0.08;
        if (this.animationVariant === 2) shootChance = 0.1;

        if (Math.random() < shootChance) {
            this.bullets.push({ x: this.playerX, y: this.canvas.height - this.canvas.height * 0.1 });
        }

        // Kollisionserkennung
        this.bullets = this.bullets.filter(bullet => {
            for (let alien of this.aliens) {
                if (alien.alive &&
                    bullet.x > alien.x &&
                    bullet.x < alien.x + alien.size &&
                    bullet.y > alien.y &&
                    bullet.y < alien.y + alien.size) {
                    alien.alive = false;
                    return false; // Remove bullet after hitting one alien
                }
            }
            return true; // Keep bullet if it didn't hit anything
        });

        // Neue Welle wenn alle Aliens tot
        if (this.aliens.every(a => !a.alive)) {
            this.aliens = [];
            this.initAliens();
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
