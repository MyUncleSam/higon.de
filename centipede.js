// Centipede Animation
window.CentipedeGame = class CentipedeGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.centipede = [];
        this.mushrooms = [];
        this.bullets = [];
        this.player = {
            x: canvas.width / 2,
            y: canvas.height - 80
        };
        this.animationFrame = null;
        this.animationVariant = Math.floor(Math.random() * 3);
        this.time = 0;

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
        const gridSize = 30;

        for (let i = 0; i < count; i++) {
            this.mushrooms.push({
                x: Math.floor(Math.random() * (this.canvas.width / gridSize)) * gridSize,
                y: Math.floor(Math.random() * (this.canvas.height * 0.7 / gridSize)) * gridSize,
                health: 3
            });
        }
    }

    initCentipede() {
        const segmentCount = 12;
        const startX = 0;
        const startY = 30;
        const segmentSize = 15;

        for (let i = 0; i < segmentCount; i++) {
            this.centipede.push({
                x: startX - i * segmentSize * 2,
                y: startY,
                vx: 2,
                vy: 0,
                size: segmentSize,
                isHead: i === 0
            });
        }
    }

    drawPlayer() {
        const ctx = this.ctx;
        const p = this.player;
        const size = 20;

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
        const size = 12;

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
        this.ctx.fillRect(bullet.x - 2, bullet.y, 4, 15);
    }

    update() {
        this.time++;

        // Variante 0: Normales Schlängeln
        // Variante 1: Spiralbewegung
        // Variante 2: Schnelle Zickzack-Bewegung
        const head = this.centipede[0];
        if (!head) return;

        if (this.animationVariant === 0) {
            // Normale Centipede-Bewegung
            head.x += head.vx;

            // Kollision mit Wand oder Pilz
            let shouldMoveDown = false;

            if (head.x <= 0 || head.x >= this.canvas.width) {
                shouldMoveDown = true;
            }

            for (let mushroom of this.mushrooms) {
                if (Math.abs(head.x - mushroom.x) < 20 && Math.abs(head.y - mushroom.y) < 20) {
                    shouldMoveDown = true;
                    break;
                }
            }

            if (shouldMoveDown) {
                head.vx *= -1;
                head.y += 30;

                if (head.y > this.canvas.height - 100) {
                    head.y = 30;
                }
            }
        } else if (this.animationVariant === 1) {
            // Spiralbewegung
            const angle = this.time * 0.05;
            const radius = 100 + Math.sin(this.time * 0.02) * 50;
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 3;

            head.x = centerX + Math.cos(angle) * radius;
            head.y = centerY + Math.sin(angle) * radius;
        } else {
            // Schnelles Zickzack
            head.x += head.vx * 2;
            head.y += Math.sin(this.time * 0.1) * 3;

            if (head.x <= 0 || head.x >= this.canvas.width) {
                head.vx *= -1;
            }
        }

        // Körpersegmente folgen dem Kopf
        for (let i = 1; i < this.centipede.length; i++) {
            const prev = this.centipede[i - 1];
            const current = this.centipede[i];
            const dx = prev.x - current.x;
            const dy = prev.y - current.y;
            const distance = Math.hypot(dx, dy);
            const targetDistance = current.size * 1.8;

            if (distance > targetDistance) {
                const ratio = (distance - targetDistance) / distance;
                current.x += dx * ratio * 0.2;
                current.y += dy * ratio * 0.2;
            }
        }

        // Spieler bewegt sich
        if (this.animationVariant === 0) {
            this.player.x += Math.sin(this.time * 0.03) * 2;
        } else if (this.animationVariant === 1) {
            this.player.x = this.canvas.width / 2 + Math.cos(this.time * 0.02) * 200;
        } else {
            this.player.x += 3;
            if (this.player.x > this.canvas.width) this.player.x = 0;
        }

        // Schüsse
        if (Math.random() < 0.06) {
            this.bullets.push({
                x: this.player.x,
                y: this.player.y - 20
            });
        }

        // Bullets bewegen
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= 8;
            return bullet.y > 0;
        });

        // Kollisionserkennung
        for (let bullet of this.bullets) {
            // Centipede treffen
            for (let i = 0; i < this.centipede.length; i++) {
                const segment = this.centipede[i];
                const dist = Math.hypot(bullet.x - segment.x, bullet.y - segment.y);
                if (dist < segment.size) {
                    this.centipede.splice(i, 1);
                    bullet.y = -100;

                    // Pilz spawnen
                    this.mushrooms.push({
                        x: Math.floor(segment.x / 30) * 30,
                        y: Math.floor(segment.y / 30) * 30,
                        health: 3
                    });

                    // Neue Kopfsegmente wenn geteilt
                    if (i > 0 && i < this.centipede.length) {
                        this.centipede[i].isHead = true;
                    }
                    break;
                }
            }

            // Pilze treffen
            for (let i = 0; i < this.mushrooms.length; i++) {
                const mushroom = this.mushrooms[i];
                if (Math.abs(bullet.x - mushroom.x) < 15 && Math.abs(bullet.y - mushroom.y) < 15) {
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
