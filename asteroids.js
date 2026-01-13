// Asteroids Animation
window.AsteroidsGame = class AsteroidsGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ship = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            angle: 0,
            vx: 0,
            vy: 0,
            size: 15
        };
        this.asteroids = [];
        this.bullets = [];
        this.animationFrame = null;
        this.animationVariant = Math.floor(Math.random() * 3);

        this.colors = {
            bg: '#000000',
            ship: '#ffffff',
            asteroid: '#aaaaaa',
            bullet: '#ffff00'
        };

        this.initAsteroids();
    }

    initAsteroids() {
        const count = 8 + Math.floor(Math.random() * 5);
        for (let i = 0; i < count; i++) {
            this.createAsteroid();
        }
    }

    createAsteroid(x = null, y = null, size = null) {
        const asteroid = {
            x: x !== null ? x : Math.random() * this.canvas.width,
            y: y !== null ? y : Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            size: size !== null ? size : 20 + Math.random() * 40,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            points: []
        };

        // Erstelle unregelmäßige Asteroiden-Form
        const numPoints = 8 + Math.floor(Math.random() * 4);
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const variance = 0.5 + Math.random() * 0.5;
            asteroid.points.push({
                angle: angle,
                distance: asteroid.size * variance
            });
        }

        this.asteroids.push(asteroid);
    }

    drawShip() {
        const ctx = this.ctx;
        const s = this.ship;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);

        ctx.strokeStyle = this.colors.ship;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.size, 0);
        ctx.lineTo(-s.size, -s.size * 0.7);
        ctx.lineTo(-s.size * 0.5, 0);
        ctx.lineTo(-s.size, s.size * 0.7);
        ctx.closePath();
        ctx.stroke();

        // Triebwerks-Effekt (wenn beschleunigt)
        if (this.animationVariant === 1 || Math.random() < 0.1) {
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.moveTo(-s.size * 0.5, -s.size * 0.3);
            ctx.lineTo(-s.size * 1.5, 0);
            ctx.lineTo(-s.size * 0.5, s.size * 0.3);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }

    drawAsteroid(asteroid) {
        const ctx = this.ctx;

        ctx.save();
        ctx.translate(asteroid.x, asteroid.y);
        ctx.rotate(asteroid.rotation);

        ctx.strokeStyle = this.colors.asteroid;
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < asteroid.points.length; i++) {
            const point = asteroid.points[i];
            const x = Math.cos(point.angle) * point.distance;
            const y = Math.sin(point.angle) * point.distance;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    drawBullet(bullet) {
        this.ctx.fillStyle = this.colors.bullet;
        this.ctx.beginPath();
        this.ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    update() {
        const s = this.ship;

        // Variante 0: Drehen und schießen
        // Variante 1: Durchs Feld fliegen
        // Variante 2: Kreisförmige Bewegung
        if (this.animationVariant === 0) {
            s.angle += 0.05;
            if (Math.random() < 0.05) {
                this.bullets.push({
                    x: s.x + Math.cos(s.angle) * s.size,
                    y: s.y + Math.sin(s.angle) * s.size,
                    vx: Math.cos(s.angle) * 5,
                    vy: Math.sin(s.angle) * 5,
                    life: 60
                });
            }
        } else if (this.animationVariant === 1) {
            // Beschleunigung in Blickrichtung
            s.angle += 0.02;
            s.vx += Math.cos(s.angle) * 0.1;
            s.vy += Math.sin(s.angle) * 0.1;

            // Geschwindigkeit begrenzen
            const speed = Math.hypot(s.vx, s.vy);
            if (speed > 5) {
                s.vx = (s.vx / speed) * 5;
                s.vy = (s.vy / speed) * 5;
            }

            if (Math.random() < 0.08) {
                this.bullets.push({
                    x: s.x + Math.cos(s.angle) * s.size,
                    y: s.y + Math.sin(s.angle) * s.size,
                    vx: Math.cos(s.angle) * 6 + s.vx,
                    vy: Math.sin(s.angle) * 6 + s.vy,
                    life: 60
                });
            }
        } else if (this.animationVariant === 2) {
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            const radius = 150;
            const angle = Date.now() / 1000;

            s.x = centerX + Math.cos(angle) * radius;
            s.y = centerY + Math.sin(angle) * radius;
            s.angle = angle + Math.PI / 2;
            s.vx = 0;
            s.vy = 0;

            if (Math.random() < 0.06) {
                this.bullets.push({
                    x: s.x,
                    y: s.y,
                    vx: Math.cos(s.angle) * 5,
                    vy: Math.sin(s.angle) * 5,
                    life: 60
                });
            }
        }

        // Schiff bewegen
        s.x += s.vx;
        s.y += s.vy;

        // Wrap around screen
        if (s.x < 0) s.x = this.canvas.width;
        if (s.x > this.canvas.width) s.x = 0;
        if (s.y < 0) s.y = this.canvas.height;
        if (s.y > this.canvas.height) s.y = 0;

        // Asteroiden bewegen
        for (let asteroid of this.asteroids) {
            asteroid.x += asteroid.vx;
            asteroid.y += asteroid.vy;
            asteroid.rotation += asteroid.rotationSpeed;

            // Wrap around
            if (asteroid.x < -asteroid.size) asteroid.x = this.canvas.width + asteroid.size;
            if (asteroid.x > this.canvas.width + asteroid.size) asteroid.x = -asteroid.size;
            if (asteroid.y < -asteroid.size) asteroid.y = this.canvas.height + asteroid.size;
            if (asteroid.y > this.canvas.height + asteroid.size) asteroid.y = -asteroid.size;
        }

        // Bullets bewegen und altern
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;

            // Wrap around
            if (bullet.x < 0) bullet.x = this.canvas.width;
            if (bullet.x > this.canvas.width) bullet.x = 0;
            if (bullet.y < 0) bullet.y = this.canvas.height;
            if (bullet.y > this.canvas.height) bullet.y = 0;

            return bullet.life > 0;
        });

        // Kollisionserkennung
        this.bullets.forEach(bullet => {
            this.asteroids.forEach((asteroid, index) => {
                const dist = Math.hypot(bullet.x - asteroid.x, bullet.y - asteroid.y);
                if (dist < asteroid.size) {
                    bullet.life = 0; // Bullet entfernen

                    // Asteroid splitten, wenn groß genug
                    if (asteroid.size > 15) {
                        for (let i = 0; i < 2; i++) {
                            this.createAsteroid(
                                asteroid.x,
                                asteroid.y,
                                asteroid.size / 2
                            );
                        }
                    }

                    this.asteroids.splice(index, 1);

                    // Neue Asteroiden spawnen wenn zu wenige
                    if (this.asteroids.length < 3) {
                        this.createAsteroid();
                    }
                }
            });
        });
    }

    draw() {
        // Hintergrund
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Asteroiden zeichnen
        for (let asteroid of this.asteroids) {
            this.drawAsteroid(asteroid);
        }

        // Bullets zeichnen
        for (let bullet of this.bullets) {
            this.drawBullet(bullet);
        }

        // Schiff zeichnen
        this.drawShip();
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
