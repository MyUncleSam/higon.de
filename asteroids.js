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

        // Variables für menschenähnliche Bewegung
        this.rotationSpeed = 0;
        this.targetRotationSpeed = 0;
        this.rotationChangeTimer = 0;
        this.thrustTimer = 0;
        this.nextThrustDuration = 0;
        this.nextRestDuration = 0;

        this.colors = {
            bg: '#000000',
            ship: '#ffffff',
            asteroid: '#aaaaaa',
            bullet: '#ffff00'
        };

        this.initAsteroids();
        this.pickNewRotationTarget();
        this.pickNewThrustPattern();
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
        const isThrusting = this.thrustTimer < this.nextThrustDuration;
        if (isThrusting) {
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.moveTo(-s.size * 0.5, -s.size * 0.3);
            // Flamme flackert leicht
            const flameLength = 1.3 + Math.random() * 0.4;
            ctx.lineTo(-s.size * flameLength, 0);
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

    // Wähle eine neue Ziel-Rotationsgeschwindigkeit
    pickNewRotationTarget() {
        // Zufällige Rotationsgeschwindigkeit (kann auch negativ sein für Richtungswechsel)
        this.targetRotationSpeed = (Math.random() - 0.5) * 0.12;
        // Wie lange bis zur nächsten Änderung (60-180 Frames)
        this.rotationChangeTimer = 60 + Math.random() * 120;
    }

    // Wähle ein neues Schub-Muster
    pickNewThrustPattern() {
        // Wie lange soll geschoben werden (20-80 Frames)
        this.nextThrustDuration = 20 + Math.random() * 60;
        // Wie lange Pause danach (10-60 Frames)
        this.nextRestDuration = 10 + Math.random() * 50;
        this.thrustTimer = 0;
    }

    update() {
        const s = this.ship;

        // Menschenähnliche Rotation mit sanften Übergängen
        this.rotationChangeTimer--;
        if (this.rotationChangeTimer <= 0) {
            this.pickNewRotationTarget();
        }

        // Sanft zur Ziel-Rotationsgeschwindigkeit interpolieren
        const rotationLerp = 0.05;
        this.rotationSpeed += (this.targetRotationSpeed - this.rotationSpeed) * rotationLerp;
        s.angle += this.rotationSpeed;

        // Menschenähnliches Schub-Muster (Phasen von Schub und Pause)
        this.thrustTimer++;
        let shouldThrust = false;

        if (this.thrustTimer < this.nextThrustDuration) {
            // Schub-Phase
            shouldThrust = true;
        } else if (this.thrustTimer >= this.nextThrustDuration + this.nextRestDuration) {
            // Neues Muster wählen
            this.pickNewThrustPattern();
        }

        // Schub anwenden wenn in Schub-Phase
        if (shouldThrust) {
            const thrustStrength = 0.08 + Math.random() * 0.04; // Leicht variierende Stärke
            s.vx += Math.cos(s.angle) * thrustStrength;
            s.vy += Math.sin(s.angle) * thrustStrength;
        }

        // Geschwindigkeit begrenzen
        const speed = Math.hypot(s.vx, s.vy);
        const maxSpeed = 5;
        if (speed > maxSpeed) {
            s.vx = (s.vx / speed) * maxSpeed;
            s.vy = (s.vy / speed) * maxSpeed;
        }

        // Schießen in Blickrichtung (variiert je nach animationVariant)
        let shootChance = 0.03;
        if (this.animationVariant === 1) shootChance = 0.05;
        if (this.animationVariant === 2) shootChance = 0.04;

        if (Math.random() < shootChance) {
            this.bullets.push({
                x: s.x + Math.cos(s.angle) * s.size,
                y: s.y + Math.sin(s.angle) * s.size,
                vx: Math.cos(s.angle) * 6 + s.vx,
                vy: Math.sin(s.angle) * 6 + s.vy,
                life: 60
            });
        }

        // Dämpfung der Geschwindigkeit (Reibung im Weltraum ist unrealistisch, aber macht es interessanter)
        s.vx *= 0.99;
        s.vy *= 0.99;

        // Stelle sicher, dass das Schiff immer eine Mindestgeschwindigkeit hat
        const currentSpeed = Math.hypot(s.vx, s.vy);
        const minSpeed = 3.5;

        if (currentSpeed < minSpeed) {
            // Gib dem Schiff einen Schub in Blickrichtung, um es in Bewegung zu halten
            s.vx += Math.cos(s.angle) * 0.2;
            s.vy += Math.sin(s.angle) * 0.2;
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
