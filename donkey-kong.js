// Donkey Kong Animation
window.DonkeyKongGame = class DonkeyKongGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.mario = {
            x: 100,
            y: canvas.height - 100,
            vx: 2,
            vy: 0,
            onGround: false,
            climbing: false
        };
        this.barrels = [];
        this.platforms = [];
        this.ladders = [];
        this.animationFrame = null;
        this.animationVariant = Math.floor(Math.random() * 3);
        this.time = 0;

        this.colors = {
            bg: '#000000',
            platform: '#ff0000',
            ladder: '#00ffff',
            mario: '#ff0000',
            barrel: '#ff8800',
            kong: '#8B4513'
        };

        this.initLevel();
    }

    initLevel() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Plattformen (von unten nach oben, leicht schräg)
        this.platforms = [
            { x: 0, y: h - 80, width: w, height: 20 },
            { x: w * 0.1, y: h - 180, width: w * 0.8, height: 20 },
            { x: 0, y: h - 280, width: w * 0.9, height: 20 },
            { x: w * 0.2, y: h - 380, width: w * 0.7, height: 20 }
        ];

        // Leitern
        this.ladders = [
            { x: w * 0.3, y: h - 180, height: 100 },
            { x: w * 0.7, y: h - 280, height: 100 },
            { x: w * 0.4, y: h - 380, height: 100 }
        ];
    }

    drawMario() {
        const ctx = this.ctx;
        const m = this.mario;
        const size = 20;
        const frame = Math.floor(Date.now() / 200) % 2;

        ctx.fillStyle = this.colors.mario;

        // Kopf
        ctx.fillRect(m.x - size * 0.3, m.y - size * 1.5, size * 0.6, size * 0.6);

        // Körper
        ctx.fillRect(m.x - size * 0.4, m.y - size * 0.8, size * 0.8, size * 0.8);

        // Arme (animiert beim Laufen)
        const armOffset = m.climbing ? 0 : (frame === 0 ? size * 0.2 : -size * 0.2);
        ctx.fillRect(m.x - size * 0.7, m.y - size * 0.6 + armOffset, size * 0.3, size * 0.5);
        ctx.fillRect(m.x + size * 0.4, m.y - size * 0.6 - armOffset, size * 0.3, size * 0.5);

        // Beine (animiert beim Laufen)
        if (m.climbing) {
            ctx.fillRect(m.x - size * 0.3, m.y, size * 0.2, size * 0.5);
            ctx.fillRect(m.x + size * 0.1, m.y, size * 0.2, size * 0.5);
        } else {
            const legOffset = frame === 0 ? size * 0.15 : -size * 0.15;
            ctx.fillRect(m.x - size * 0.3, m.y + legOffset, size * 0.2, size * 0.5);
            ctx.fillRect(m.x + size * 0.1, m.y - legOffset, size * 0.2, size * 0.5);
        }
    }

    drawBarrel(barrel) {
        const ctx = this.ctx;
        const size = 15;

        ctx.fillStyle = this.colors.barrel;
        ctx.strokeStyle = '#663300';
        ctx.lineWidth = 2;

        // Fass
        ctx.beginPath();
        ctx.ellipse(barrel.x, barrel.y, size, size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Streifen
        ctx.beginPath();
        ctx.moveTo(barrel.x - size, barrel.y - size * 0.3);
        ctx.lineTo(barrel.x + size, barrel.y - size * 0.3);
        ctx.moveTo(barrel.x - size, barrel.y + size * 0.3);
        ctx.lineTo(barrel.x + size, barrel.y + size * 0.3);
        ctx.stroke();
    }

    drawPlatform(platform) {
        this.ctx.fillStyle = this.colors.platform;
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

        // Nieten
        this.ctx.fillStyle = '#ffff00';
        for (let x = platform.x + 20; x < platform.x + platform.width; x += 40) {
            this.ctx.fillRect(x, platform.y + 5, 5, 5);
        }
    }

    drawLadder(ladder) {
        const ctx = this.ctx;
        ctx.strokeStyle = this.colors.ladder;
        ctx.lineWidth = 3;

        // Seiten
        ctx.beginPath();
        ctx.moveTo(ladder.x, ladder.y);
        ctx.lineTo(ladder.x, ladder.y + ladder.height);
        ctx.moveTo(ladder.x + 20, ladder.y);
        ctx.lineTo(ladder.x + 20, ladder.y + ladder.height);
        ctx.stroke();

        // Sprossen
        for (let y = ladder.y; y < ladder.y + ladder.height; y += 20) {
            ctx.beginPath();
            ctx.moveTo(ladder.x, y);
            ctx.lineTo(ladder.x + 20, y);
            ctx.stroke();
        }
    }

    drawKong() {
        const ctx = this.ctx;
        const x = this.canvas.width * 0.3;
        const y = 50;
        const size = 40;

        ctx.fillStyle = this.colors.kong;

        // Kopf
        ctx.fillRect(x - size * 0.5, y, size, size * 0.8);

        // Ohren
        ctx.beginPath();
        ctx.arc(x - size * 0.5, y + size * 0.3, size * 0.2, 0, Math.PI * 2);
        ctx.arc(x + size * 0.5, y + size * 0.3, size * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Gesicht
        ctx.fillStyle = '#D2691E';
        ctx.fillRect(x - size * 0.3, y + size * 0.3, size * 0.6, size * 0.4);

        // Körper
        ctx.fillStyle = this.colors.kong;
        ctx.fillRect(x - size * 0.6, y + size * 0.8, size * 1.2, size);

        // Arme (animiert)
        const armFrame = Math.floor(Date.now() / 300) % 2;
        const armY = y + size * 0.9 + (armFrame === 0 ? 5 : -5);
        ctx.fillRect(x - size * 1.2, armY, size * 0.6, size * 0.8);
        ctx.fillRect(x + size * 0.6, armY, size * 0.6, size * 0.8);
    }

    update() {
        this.time++;
        const m = this.mario;

        // Variante 0: Normales Klettern und Laufen
        // Variante 1: Nur horizontal laufen
        // Variante 2: Springend hochkommen
        if (this.animationVariant === 0) {
            // Klettern auf Leitern
            m.climbing = false;
            for (let ladder of this.ladders) {
                if (Math.abs(m.x - ladder.x - 10) < 15 &&
                    m.y >= ladder.y && m.y <= ladder.y + ladder.height) {
                    m.climbing = true;
                    m.vy = -2;
                    m.y += m.vy;
                    break;
                }
            }

            if (!m.climbing) {
                m.x += m.vx;
            }
        } else if (this.animationVariant === 1) {
            // Nur horizontal laufen
            m.x += m.vx;
        } else {
            // Springen
            m.x += m.vx;
            if (this.time % 60 === 0) {
                m.vy = -8;
            }
            m.vy += 0.5; // Gravität
            m.y += m.vy;
        }

        // Plattform-Kollision
        m.onGround = false;
        for (let platform of this.platforms) {
            if (m.x > platform.x && m.x < platform.x + platform.width &&
                m.y >= platform.y - 5 && m.y <= platform.y + platform.height) {
                m.y = platform.y;
                m.vy = 0;
                m.onGround = true;
            }
        }

        // Richtungswechsel an Plattformenden
        if (m.x <= 0 || m.x >= this.canvas.width) {
            m.vx *= -1;
        }

        // Fässer spawnen
        if (Math.random() < 0.02) {
            this.barrels.push({
                x: this.canvas.width * 0.3,
                y: 70,
                vx: 2,
                vy: 0
            });
        }

        // Fässer bewegen
        this.barrels = this.barrels.filter(barrel => {
            barrel.x += barrel.vx;
            barrel.vy += 0.5; // Gravität
            barrel.y += barrel.vy;

            // Plattform-Kollision für Fässer
            for (let platform of this.platforms) {
                if (barrel.x > platform.x && barrel.x < platform.x + platform.width &&
                    barrel.y >= platform.y - 15 && barrel.y <= platform.y + platform.height) {
                    barrel.y = platform.y;
                    barrel.vy = 0;

                    // Rollen oder fallen
                    if (barrel.x > platform.x + platform.width - 20) {
                        barrel.vy = 2; // Fällt runter
                    }
                }
            }

            return barrel.y < this.canvas.height + 50;
        });
    }

    draw() {
        // Hintergrund
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Level-Elemente
        for (let platform of this.platforms) {
            this.drawPlatform(platform);
        }

        for (let ladder of this.ladders) {
            this.drawLadder(ladder);
        }

        // Donkey Kong
        this.drawKong();

        // Fässer
        for (let barrel of this.barrels) {
            this.drawBarrel(barrel);
        }

        // Mario
        this.drawMario();
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
