// Centipede Animation
window.CentipedeGame = class CentipedeGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        // Skalierung basierend auf Bildschirmgröße
        const scale = Math.min(canvas.width, canvas.height) / 600;
        this.segmentSize = Math.floor(15 * scale);
        this.mushroomSize = Math.floor(12 * scale);
        this.playerSize = Math.floor(20 * scale);
        this.gridSize = Math.floor(30 * scale);
        this.bulletWidth = Math.max(2, Math.floor(4 * scale));
        this.bulletHeight = Math.max(6, Math.floor(15 * scale));

        this.centipede = [];
        this.mushrooms = [];
        this.bullets = [];
        this.player = {
            x: canvas.width / 2,
            y: canvas.height - canvas.height * 0.12
        };
        this.animationFrame = null;
        this.animationVariant = Math.floor(Math.random() * 3);
        this.time = 0;

        // Bewegungssteuerung
        this.moveCounter = 0;
        this.moveSpeed = 3; // Frames pro Gitterschritt

        this.colors = {
            bg: '#000000',
            centipedeHead: '#ff00ff',
            centipedeBody: '#00ff00',
            mushroom: '#ff8800',
            player: '#00ffff',
            bullet: '#ffffff'
        };

        this.initMushrooms();
        this.initCentipede();
    }

    initMushrooms() {
        const count = 30;

        for (let i = 0; i < count; i++) {
            this.mushrooms.push({
                x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)) * this.gridSize,
                y: Math.floor(Math.random() * (this.canvas.height * 0.7 / this.gridSize)) * this.gridSize,
                health: 3
            });
        }
    }

    initCentipede() {
        const segmentCount = 12;
        const startCol = 0;
        const startRow = 1;

        this.centipede = [];

        for (let i = 0; i < segmentCount; i++) {
            this.centipede.push({
                gridX: startCol - i,
                gridY: startRow,
                x: (startCol - i) * this.gridSize,
                y: startRow * this.gridSize,
                direction: 1, // 1 = rechts, -1 = links
                size: this.segmentSize,
                isHead: i === 0
            });
        }
    }

    drawPlayer() {
        const ctx = this.ctx;
        const p = this.player;
        const size = this.playerSize;

        ctx.fillStyle = this.colors.player;

        // Spieler-Kanone
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - size);
        ctx.lineTo(p.x - size * 0.7, p.y + size * 0.5);
        ctx.lineTo(p.x + size * 0.7, p.y + size * 0.5);
        ctx.closePath();
        ctx.fill();

        // Basis
        ctx.fillRect(p.x - size, p.y + size * 0.5, size * 2, size * 0.3);
    }

    drawCentipede() {
        const ctx = this.ctx;

        for (let i = 0; i < this.centipede.length; i++) {
            const segment = this.centipede[i];
            const size = segment.size;

            // Farbe basierend auf Position
            if (segment.isHead) {
                ctx.fillStyle = this.colors.centipedeHead;
            } else {
                const hue = (i / this.centipede.length) * 60 + 120;
                ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            }

            // Segment-Körper
            ctx.beginPath();
            ctx.arc(segment.x, segment.y, size, 0, Math.PI * 2);
            ctx.fill();

            // Segmentdetails
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(segment.x, segment.y, size * 0.7, 0, Math.PI * 2);
            ctx.stroke();

            // Augen für Kopf
            if (segment.isHead) {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(segment.x - size * 0.3, segment.y - size * 0.3, size * 0.2, 0, Math.PI * 2);
                ctx.arc(segment.x + size * 0.3, segment.y - size * 0.3, size * 0.2, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(segment.x - size * 0.3, segment.y - size * 0.3, size * 0.1, 0, Math.PI * 2);
                ctx.arc(segment.x + size * 0.3, segment.y - size * 0.3, size * 0.1, 0, Math.PI * 2);
                ctx.fill();
            }

            // Beine (animiert)
            const legFrame = Math.floor(Date.now() / 100 + i) % 2;
            const legLength = size * 0.5;
            const legY = segment.y + (legFrame === 0 ? size : size * 0.8);

            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(segment.x - size * 0.5, segment.y);
            ctx.lineTo(segment.x - size * 0.8, legY);
            ctx.moveTo(segment.x + size * 0.5, segment.y);
            ctx.lineTo(segment.x + size * 0.8, legY);
            ctx.stroke();
        }
    }

    drawMushroom(mushroom) {
        const ctx = this.ctx;
        const size = this.mushroomSize;

        // Hut
        ctx.fillStyle = this.colors.mushroom;
        ctx.beginPath();
        ctx.arc(mushroom.x, mushroom.y, size, Math.PI, 0);
        ctx.fill();

        // Punkte auf dem Hut
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(mushroom.x - size * 0.5, mushroom.y - size * 0.3, size * 0.2, 0, Math.PI * 2);
        ctx.arc(mushroom.x + size * 0.5, mushroom.y - size * 0.3, size * 0.2, 0, Math.PI * 2);
        ctx.arc(mushroom.x, mushroom.y - size * 0.6, size * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Stiel
        ctx.fillStyle = '#ffcc99';
        ctx.fillRect(mushroom.x - size * 0.3, mushroom.y, size * 0.6, size * 0.8);
    }

    drawBullet(bullet) {
        this.ctx.fillStyle = this.colors.bullet;
        this.ctx.fillRect(bullet.x - this.bulletWidth / 2, bullet.y, this.bulletWidth, this.bulletHeight);
    }

    update() {
        this.time++;
        this.moveCounter++;

        if (this.centipede.length === 0) return;

        // Bewege alle Segmente in diskreten Grid-Schritten
        if (this.moveCounter >= this.moveSpeed) {
            this.moveCounter = 0;

            // Berechne Anzahl Spalten im Grid
            const cols = Math.floor(this.canvas.width / this.gridSize);
            const rows = Math.floor(this.canvas.height / this.gridSize);

            // Speichere alle alten Positionen BEVOR wir irgendwas bewegen
            const oldPositions = this.centipede.map(seg => ({
                gridX: seg.gridX,
                gridY: seg.gridY
            }));

            // Bewege jedes Segment
            for (let i = 0; i < this.centipede.length; i++) {
                const segment = this.centipede[i];

                if (segment.isHead) {
                    // Kopf bewegt sich selbstständig
                    let shouldMoveDown = false;

                    // Nächste Position berechnen
                    const nextGridX = segment.gridX + segment.direction;

                    // Wand-Kollision
                    if (nextGridX < 0 || nextGridX >= cols) {
                        shouldMoveDown = true;
                    }

                    // Pilz-Kollision prüfen
                    if (!shouldMoveDown) {
                        for (let mushroom of this.mushrooms) {
                            const mushroomGridX = Math.floor(mushroom.x / this.gridSize);
                            const mushroomGridY = Math.floor(mushroom.y / this.gridSize);

                            if (mushroomGridX === nextGridX && mushroomGridY === segment.gridY) {
                                shouldMoveDown = true;
                                break;
                            }
                        }
                    }

                    if (shouldMoveDown) {
                        // Bewege nach unten und wechsle Richtung
                        segment.gridY += 1;
                        segment.direction *= -1;

                        // Wrap around wenn zu weit unten
                        if (segment.gridY >= rows - 2) {
                            segment.gridY = 1;
                        }
                    } else {
                        // Bewege horizontal
                        segment.gridX += segment.direction;
                    }

                    // Aktualisiere pixel-Position
                    segment.x = segment.gridX * this.gridSize;
                    segment.y = segment.gridY * this.gridSize;
                } else {
                    // Körpersegmente folgen dem vorherigen Segment
                    // Nimm die ALTE Position des vorherigen Segments
                    if (i > 0 && oldPositions[i - 1]) {
                        segment.gridX = oldPositions[i - 1].gridX;
                        segment.gridY = oldPositions[i - 1].gridY;
                        segment.x = segment.gridX * this.gridSize;
                        segment.y = segment.gridY * this.gridSize;
                    }
                }
            }
        }

        // Spieler bewegt sich
        const playerSpeed = Math.max(1.5, this.playerSize * 0.1);
        const playerRange = Math.min(this.canvas.width * 0.4, 200);

        if (this.animationVariant === 0) {
            this.player.x += Math.sin(this.time * 0.03) * playerSpeed;
        } else if (this.animationVariant === 1) {
            this.player.x = this.canvas.width / 2 + Math.cos(this.time * 0.02) * playerRange;
        } else {
            this.player.x += playerSpeed * 1.5;
            if (this.player.x > this.canvas.width) this.player.x = 0;
        }

        // Schüsse
        if (Math.random() < 0.06) {
            this.bullets.push({
                x: this.player.x,
                y: this.player.y - this.playerSize
            });
        }

        // Bullets bewegen
        const bulletSpeed = Math.max(6, this.playerSize * 0.4);
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= bulletSpeed;
            return bullet.y > 0;
        });

        // Kollisionserkennung
        for (let bullet of this.bullets) {
            // Centipede treffen
            for (let i = 0; i < this.centipede.length; i++) {
                const segment = this.centipede[i];
                const dist = Math.hypot(bullet.x - segment.x, bullet.y - segment.y);
                if (dist < segment.size + this.gridSize * 0.3) {
                    // Pilz spawnen an Grid-Position
                    this.mushrooms.push({
                        x: segment.gridX * this.gridSize,
                        y: segment.gridY * this.gridSize,
                        health: 3
                    });

                    // Wenn das Segment ein Kopf war und es noch weitere Segmente gibt,
                    // wird das nächste Segment zum neuen Kopf
                    if (i === 0 && this.centipede.length > 1) {
                        this.centipede[1].isHead = true;
                        // Kopf bekommt eigene Richtung (könnte zufällig sein)
                        this.centipede[1].direction = Math.random() < 0.5 ? 1 : -1;
                    }
                    // Wenn Segment in der Mitte getroffen wurde, wird das nachfolgende Segment ein neuer Kopf
                    else if (i > 0 && i < this.centipede.length - 1) {
                        this.centipede[i + 1].isHead = true;
                        this.centipede[i + 1].direction = Math.random() < 0.5 ? 1 : -1;
                    }

                    // Entferne getroffenes Segment
                    this.centipede.splice(i, 1);
                    bullet.y = -100;
                    break;
                }
            }

            // Pilze treffen
            for (let i = 0; i < this.mushrooms.length; i++) {
                const mushroom = this.mushrooms[i];
                const hitDist = this.mushroomSize * 1.2;
                if (Math.abs(bullet.x - mushroom.x) < hitDist && Math.abs(bullet.y - mushroom.y) < hitDist) {
                    mushroom.health--;
                    bullet.y = -100;
                    if (mushroom.health <= 0) {
                        this.mushrooms.splice(i, 1);
                    }
                    break;
                }
            }
        }

        // Neuen Centipede spawnen wenn alle weg
        if (this.centipede.length === 0) {
            this.initCentipede();
        }
    }

    draw() {
        // Hintergrund
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Pilze
        for (let mushroom of this.mushrooms) {
            this.drawMushroom(mushroom);
        }

        // Bullets
        for (let bullet of this.bullets) {
            this.drawBullet(bullet);
        }

        // Centipede
        this.drawCentipede();

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
