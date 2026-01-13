// Pac-Man Animation
window.PacManGame = class PacManGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.pacman = {
            x: 50,
            y: canvas.height / 2,
            radius: 25,
            mouthAngle: 0,
            direction: 0, // 0=right, 1=down, 2=left, 3=up
            speed: 3
        };
        this.dots = [];
        this.ghosts = [];
        this.animationFrame = null;
        this.animationVariant = Math.floor(Math.random() * 3);

        this.colors = {
            bg: '#000000',
            pacman: '#ffff00',
            dot: '#ffb8ae',
            ghost: ['#ff0000', '#00ffff', '#ffb8ff', '#ffb852']
        };

        this.initDots();
        this.initGhosts();
    }

    initDots() {
        const spacing = 40;
        for (let x = 20; x < this.canvas.width; x += spacing) {
            for (let y = 20; y < this.canvas.height; y += spacing) {
                this.dots.push({ x, y, eaten: false });
            }
        }
    }

    initGhosts() {
        const colors = this.colors.ghost;
        for (let i = 0; i < 4; i++) {
            this.ghosts.push({
                x: this.canvas.width - 100 - i * 50,
                y: this.canvas.height / 2 + (i % 2 === 0 ? -50 : 50),
                color: colors[i],
                direction: 2, // start moving left
                speed: 2 + Math.random()
            });
        }
    }

    drawPacman() {
        const ctx = this.ctx;
        const p = this.pacman;

        // Mund-Animation
        const mouthOpen = Math.abs(Math.sin(Date.now() / 100)) * 0.4;

        ctx.fillStyle = this.colors.pacman;
        ctx.beginPath();

        const rotationAngle = p.direction * Math.PI / 2;
        ctx.arc(p.x, p.y, p.radius,
                rotationAngle + mouthOpen,
                rotationAngle + Math.PI * 2 - mouthOpen);
        ctx.lineTo(p.x, p.y);
        ctx.closePath();
        ctx.fill();
    }

    drawGhost(ghost) {
        const ctx = this.ctx;
        const r = 20;

        ctx.fillStyle = ghost.color;

        // Körper
        ctx.beginPath();
        ctx.arc(ghost.x, ghost.y - r / 2, r, Math.PI, 0, false);
        ctx.lineTo(ghost.x + r, ghost.y + r);

        // Wellenförmiger Boden
        const waves = 3;
        for (let i = 0; i < waves; i++) {
            ctx.lineTo(ghost.x + r - (i + 0.5) * (2 * r / waves), ghost.y + r - 5);
            ctx.lineTo(ghost.x + r - (i + 1) * (2 * r / waves), ghost.y + r);
        }

        ctx.lineTo(ghost.x - r, ghost.y - r / 2);
        ctx.fill();

        // Augen
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ghost.x - 7, ghost.y - 5, 5, 0, Math.PI * 2);
        ctx.arc(ghost.x + 7, ghost.y - 5, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0000ff';
        ctx.beginPath();
        ctx.arc(ghost.x - 7, ghost.y - 5, 2, 0, Math.PI * 2);
        ctx.arc(ghost.x + 7, ghost.y - 5, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawDot(dot) {
        if (dot.eaten) return;
        this.ctx.fillStyle = this.colors.dot;
        this.ctx.beginPath();
        this.ctx.arc(dot.x, dot.y, 4, 0, Math.PI * 2);
        this.ctx.fill();
    }

    update() {
        const p = this.pacman;

        // Variante 0: Horizontal hin und her
        // Variante 1: Im Kreis
        // Variante 2: Geisterjagd
        if (this.animationVariant === 0) {
            p.x += p.speed;
            p.direction = 0;
            if (p.x > this.canvas.width + p.radius) {
                p.x = -p.radius;
                p.y = Math.random() * this.canvas.height;
            }
        } else if (this.animationVariant === 1) {
            // Kreisbewegung
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            const radius = 150;
            const angle = Date.now() / 1000;

            p.x = centerX + Math.cos(angle) * radius;
            p.y = centerY + Math.sin(angle) * radius;

            // Richtung basierend auf Bewegung
            const nextAngle = angle + 0.1;
            const nextX = centerX + Math.cos(nextAngle) * radius;
            if (nextX > p.x) p.direction = 0;
            else p.direction = 2;
        } else if (this.animationVariant === 2) {
            // Pac-Man jagt Geister
            if (this.ghosts.length > 0) {
                const target = this.ghosts[0];
                const dx = target.x - p.x;
                const dy = target.y - p.y;
                const angle = Math.atan2(dy, dx);

                p.x += Math.cos(angle) * p.speed;
                p.y += Math.sin(angle) * p.speed;

                // Richtung setzen
                if (Math.abs(dx) > Math.abs(dy)) {
                    p.direction = dx > 0 ? 0 : 2;
                } else {
                    p.direction = dy > 0 ? 1 : 3;
                }
            }
        }

        // Geister bewegen
        for (let ghost of this.ghosts) {
            if (this.animationVariant === 2) {
                // Geister fliehen vor Pac-Man
                const dx = ghost.x - p.x;
                const dy = ghost.y - p.y;
                const angle = Math.atan2(dy, dx);
                ghost.x += Math.cos(angle) * ghost.speed;
                ghost.y += Math.sin(angle) * ghost.speed;
            } else {
                ghost.x -= ghost.speed;
                if (ghost.x < -30) {
                    ghost.x = this.canvas.width + 30;
                    ghost.y = Math.random() * this.canvas.height;
                }
            }
        }

        // Dots essen
        for (let dot of this.dots) {
            if (!dot.eaten) {
                const dist = Math.hypot(p.x - dot.x, p.y - dot.y);
                if (dist < p.radius) {
                    dot.eaten = true;
                }
            }
        }

        // Dots zurücksetzen wenn alle gegessen
        if (this.dots.every(d => d.eaten)) {
            this.dots.forEach(d => d.eaten = false);
        }
    }

    draw() {
        // Hintergrund
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Dots zeichnen
        for (let dot of this.dots) {
            this.drawDot(dot);
        }

        // Geister zeichnen
        for (let ghost of this.ghosts) {
            this.drawGhost(ghost);
        }

        // Pac-Man zeichnen
        this.drawPacman();
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
