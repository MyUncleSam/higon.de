// Frogger Animation
window.FroggerGame = class FroggerGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.frog = {
            x: canvas.width / 2,
            y: canvas.height - 40,
            size: 25,
            direction: 0 // 0=up, 1=right, 2=down, 3=left
        };
        this.cars = [];
        this.logs = [];
        this.animationFrame = null;
        this.animationVariant = Math.floor(Math.random() * 3);
        this.time = 0;

        this.colors = {
            bg: '#000000',
            road: '#333333',
            water: '#0066cc',
            frog: '#00ff00',
            car: ['#ff0000', '#ffff00', '#ff00ff', '#00ffff'],
            log: '#8B4513',
            grass: '#00aa00'
        };

        this.initLevel();
    }

    initLevel() {
        const h = this.canvas.height;
        const laneHeight = 50;

        // Straßen (Autos)
        for (let i = 0; i < 3; i++) {
            const y = h - 150 - i * laneHeight;
            const speed = (i % 2 === 0 ? 2 : -3);
            const numCars = 3;

            for (let j = 0; j < numCars; j++) {
                this.cars.push({
                    x: (this.canvas.width / numCars) * j,
                    y: y,
                    width: 60,
                    height: 30,
                    speed: speed,
                    color: this.colors.car[i % this.colors.car.length]
                });
            }
        }

        // Fluss (Baumstämme)
        for (let i = 0; i < 3; i++) {
            const y = h - 400 - i * laneHeight;
            const speed = (i % 2 === 0 ? 1.5 : -2);
            const numLogs = 2;

            for (let j = 0; j < numLogs; j++) {
                this.logs.push({
                    x: (this.canvas.width / numLogs) * j,
                    y: y,
                    width: 100,
                    height: 35,
                    speed: speed
                });
            }
        }
    }

    drawFrog() {
        const ctx = this.ctx;
        const f = this.frog;
        const s = f.size;

        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.direction * Math.PI / 2);

        ctx.fillStyle = this.colors.frog;

        // Körper
        ctx.fillRect(-s * 0.4, -s * 0.3, s * 0.8, s * 0.6);

        // Kopf
        ctx.beginPath();
        ctx.arc(0, -s * 0.4, s * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Augen
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-s * 0.15, -s * 0.5, s * 0.15, 0, Math.PI * 2);
        ctx.arc(s * 0.15, -s * 0.5, s * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-s * 0.15, -s * 0.5, s * 0.08, 0, Math.PI * 2);
        ctx.arc(s * 0.15, -s * 0.5, s * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Beine
        ctx.fillStyle = this.colors.frog;
        const legFrame = Math.floor(Date.now() / 200) % 2;
        const legSpread = legFrame === 0 ? 0.6 : 0.4;

        // Hinterbeine
        ctx.fillRect(-s * legSpread, s * 0.1, s * 0.3, s * 0.5);
        ctx.fillRect(s * (legSpread - 0.3), s * 0.1, s * 0.3, s * 0.5);

        // Vorderbeine
        ctx.fillRect(-s * legSpread * 0.8, -s * 0.5, s * 0.2, s * 0.4);
        ctx.fillRect(s * (legSpread * 0.8 - 0.2), -s * 0.5, s * 0.2, s * 0.4);

        ctx.restore();
    }

    drawCar(car) {
        const ctx = this.ctx;

        ctx.fillStyle = car.color;
        ctx.fillRect(car.x, car.y, car.width, car.height);

        // Fenster
        ctx.fillStyle = '#87ceeb';
        ctx.fillRect(car.x + car.width * 0.3, car.y + 5, car.width * 0.4, car.height * 0.4);

        // Räder
        ctx.fillStyle = '#000000';
        ctx.fillRect(car.x + 5, car.y - 5, 10, 5);
        ctx.fillRect(car.x + car.width - 15, car.y - 5, 10, 5);
        ctx.fillRect(car.x + 5, car.y + car.height, 10, 5);
        ctx.fillRect(car.x + car.width - 15, car.y + car.height, 10, 5);
    }

    drawLog(log) {
        const ctx = this.ctx;

        ctx.fillStyle = this.colors.log;
        ctx.fillRect(log.x, log.y, log.width, log.height);

        // Holzstruktur
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const x = log.x + (log.width / 3) * i;
            ctx.beginPath();
            ctx.moveTo(x, log.y);
            ctx.lineTo(x, log.y + log.height);
            ctx.stroke();
        }

        // Ringe
        ctx.beginPath();
        ctx.arc(log.x + log.width * 0.25, log.y + log.height / 2, log.height * 0.3, 0, Math.PI * 2);
        ctx.arc(log.x + log.width * 0.75, log.y + log.height / 2, log.height * 0.25, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawLane(y, height, color, label) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, y, this.canvas.width, height);

        // Linien (wenn Straße)
        if (color === this.colors.road) {
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([20, 10]);
            this.ctx.beginPath();
            this.ctx.moveTo(0, y + height / 2);
            this.ctx.lineTo(this.canvas.width, y + height / 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }

    update() {
        this.time++;
        const f = this.frog;

        // Variante 0: Frosch hüpft nach oben
        // Variante 1: Frosch bewegt sich seitlich
        // Variante 2: Frosch reitet auf Baumstämmen
        if (this.animationVariant === 0) {
            if (this.time % 40 === 0) {
                f.y -= 50;
                f.direction = 0;
                if (f.y < 50) {
                    f.y = this.canvas.height - 40;
                }
            }
        } else if (this.animationVariant === 1) {
            f.x += 2;
            f.direction = 1;
            if (f.x > this.canvas.width) {
                f.x = 0;
                f.y = this.canvas.height - 40;
            }
        } else if (this.animationVariant === 2) {
            // Frosch springt nach oben und reitet auf Baumstämmen
            if (this.time % 60 === 0 && f.y > 200) {
                f.y -= 50;
                f.direction = 0;
            }

            // Check ob auf Baumstamm
            for (let log of this.logs) {
                if (Math.abs(f.y - log.y) < 25 &&
                    f.x > log.x && f.x < log.x + log.width) {
                    f.x += log.speed;
                }
            }

            if (f.y < 100) {
                f.y = this.canvas.height - 40;
                f.x = this.canvas.width / 2;
            }
        }

        // Autos bewegen
        for (let car of this.cars) {
            car.x += car.speed;
            if (car.speed > 0 && car.x > this.canvas.width) {
                car.x = -car.width;
            } else if (car.speed < 0 && car.x < -car.width) {
                car.x = this.canvas.width;
            }
        }

        // Baumstämme bewegen
        for (let log of this.logs) {
            log.x += log.speed;
            if (log.speed > 0 && log.x > this.canvas.width) {
                log.x = -log.width;
            } else if (log.speed < 0 && log.x < -log.width) {
                log.x = this.canvas.width;
            }
        }
    }

    draw() {
        const h = this.canvas.height;

        // Hintergrund
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Ziel (oberer grüner Bereich)
        this.drawLane(0, 80, this.colors.grass, 'ZIEL');

        // Wasser
        this.drawLane(80, 200, this.colors.water, 'WASSER');

        // Sicherheitszone
        this.drawLane(280, 40, this.colors.grass, 'SICHER');

        // Straße
        this.drawLane(320, 150, this.colors.road, 'STRASSE');

        // Start (unterer grüner Bereich)
        this.drawLane(h - 60, 60, this.colors.grass, 'START');

        // Baumstämme zeichnen
        for (let log of this.logs) {
            this.drawLog(log);
        }

        // Autos zeichnen
        for (let car of this.cars) {
            this.drawCar(car);
        }

        // Frosch zeichnen
        this.drawFrog();
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
