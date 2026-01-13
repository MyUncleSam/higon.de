// Pac-Man Animation (Authentisches Labyrinth-Design)
window.PacManGame = class PacManGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        // Grid-System - skaliert basierend auf Bildschirmgröße
        // Verwende ~28 Zellen für die kleinere Dimension für authentisches Gefühl
        const minDimension = Math.min(canvas.width, canvas.height);
        this.cellSize = Math.floor(minDimension / 28);
        this.cols = Math.floor(canvas.width / this.cellSize);
        this.rows = Math.floor(canvas.height / this.cellSize);

        // Pac-Man wird später mit zufälliger Position initialisiert
        this.pacman = null;

        this.ghosts = [];
        this.dots = [];
        this.powerPellets = [];
        this.maze = [];
        this.animationFrame = null;
        this.animationVariant = Math.floor(Math.random() * 3);
        this.powerMode = false;
        this.powerModeTimer = 0;

        this.colors = {
            bg: '#000000',
            wall: '#2121ff',
            pacman: '#ffff00',
            dot: '#ffb897',
            powerPellet: '#ffb897',
            ghost: ['#ff0000', '#00ffff', '#ffb8ff', '#ffb852'],
            scaredGhost: '#2121de',
            eyes: '#ffffff'
        };

        this.initMaze();
        this.initPacman();
        this.initGhosts();
        this.initDots();
    }

    initPacman() {
        // Finde zufällige Startposition für Pac-Man
        const pos = this.findRandomFreePosition();
        this.pacman = {
            gridX: pos.x,
            gridY: pos.y,
            x: pos.x * this.cellSize + this.cellSize / 2,
            y: pos.y * this.cellSize + this.cellSize / 2,
            radius: this.cellSize * 0.4,
            direction: 0, // 0=right, 1=down, 2=left, 3=up
            nextDirection: 0,
            speed: 2
        };
    }

    initMaze() {
        // Erstelle ein klassisches Pac-Man ähnliches Labyrinth
        // 0 = Weg, 1 = Wand
        this.maze = [];
        for (let y = 0; y < this.rows; y++) {
            this.maze[y] = [];
            for (let x = 0; x < this.cols; x++) {
                // Äußere Wände
                if (x === 0 || x === this.cols - 1 || y === 0 || y === this.rows - 1) {
                    this.maze[y][x] = 1;
                } else {
                    this.maze[y][x] = 0;
                }
            }
        }

        const midX = Math.floor(this.cols / 2);
        const midY = Math.floor(this.rows / 2);

        // Interne Labyrinth-Struktur (mehr Wände für komplexeres Labyrinth)
        const wallPatterns = [
            // Ecken - Horizontale Blöcke
            { x: 2, y: 2, w: 4, h: 2 },
            { x: this.cols - 6, y: 2, w: 4, h: 2 },
            { x: 2, y: this.rows - 4, w: 4, h: 2 },
            { x: this.cols - 6, y: this.rows - 4, w: 4, h: 2 },

            // Obere vertikale Blöcke
            { x: 2, y: 5, w: 2, h: 4 },
            { x: this.cols - 4, y: 5, w: 2, h: 4 },

            // Mittlere vertikale Blöcke
            { x: 7, y: 6, w: 2, h: 5 },
            { x: this.cols - 9, y: 6, w: 2, h: 5 },

            // Zentrale Box (Geister-Haus)
            { x: midX - 4, y: midY - 2, w: 8, h: 1 },
            { x: midX - 4, y: midY - 2, w: 1, h: 4 },
            { x: midX + 3, y: midY - 2, w: 1, h: 4 },
            { x: midX - 4, y: midY + 1, w: 8, h: 1 },

            // T-Formen oben
            { x: midX - 1, y: 2, w: 2, h: 4 },
            { x: midX - 3, y: 5, w: 6, h: 1 },

            // T-Formen unten
            { x: midX - 1, y: this.rows - 6, w: 2, h: 4 },
            { x: midX - 3, y: this.rows - 6, w: 6, h: 1 },

            // Zusätzliche L-Formen links
            { x: 2, y: midY - 4, w: 3, h: 2 },
            { x: 4, y: midY - 2, w: 1, h: 3 },

            // Zusätzliche L-Formen rechts
            { x: this.cols - 5, y: midY - 4, w: 3, h: 2 },
            { x: this.cols - 5, y: midY - 2, w: 1, h: 3 },

            // Kleine Blöcke verteilt
            { x: 10, y: 3, w: 2, h: 2 },
            { x: this.cols - 12, y: 3, w: 2, h: 2 },
            { x: 10, y: this.rows - 5, w: 2, h: 2 },
            { x: this.cols - 12, y: this.rows - 5, w: 2, h: 2 },

            // Zusätzliche zentrale Hindernisse
            { x: midX - 6, y: midY + 3, w: 3, h: 2 },
            { x: midX + 3, y: midY + 3, w: 3, h: 2 },
            { x: midX - 2, y: midY + 4, w: 4, h: 1 },

            // Weitere vertikale Wände
            { x: 13, y: 10, w: 1, h: 4 },
            { x: this.cols - 14, y: 10, w: 1, h: 4 },

            // Diagonale Strukturen simulieren
            { x: 8, y: midY - 6, w: 3, h: 1 },
            { x: 9, y: midY - 5, w: 2, h: 1 },
            { x: this.cols - 11, y: midY - 6, w: 3, h: 1 },
            { x: this.cols - 11, y: midY - 5, w: 2, h: 1 },
        ];

        // Wände hinzufügen
        for (let pattern of wallPatterns) {
            for (let dy = 0; dy < pattern.h; dy++) {
                for (let dx = 0; dx < pattern.w; dx++) {
                    const px = pattern.x + dx;
                    const py = pattern.y + dy;
                    if (px >= 0 && px < this.cols && py >= 0 && py < this.rows) {
                        this.maze[py][px] = 1;
                    }
                }
            }
        }
    }

    // Finde zufällige freie Position im Labyrinth
    findRandomFreePosition() {
        const freePositions = [];
        for (let y = 1; y < this.rows - 1; y++) {
            for (let x = 1; x < this.cols - 1; x++) {
                if (this.maze[y][x] === 0) {
                    freePositions.push({ x, y });
                }
            }
        }
        if (freePositions.length === 0) {
            return { x: 1, y: 1 };
        }
        return freePositions[Math.floor(Math.random() * freePositions.length)];
    }

    // Berechne Manhattan-Distanz
    manhattanDistance(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

    // Finde zufällige Position weit weg von einer anderen Position
    findRandomPositionAwayFrom(avoidX, avoidY, minDistance) {
        const freePositions = [];
        for (let y = 1; y < this.rows - 1; y++) {
            for (let x = 1; x < this.cols - 1; x++) {
                if (this.maze[y][x] === 0) {
                    const dist = this.manhattanDistance(x, y, avoidX, avoidY);
                    if (dist >= minDistance) {
                        freePositions.push({ x, y, dist });
                    }
                }
            }
        }
        if (freePositions.length === 0) {
            return this.findRandomFreePosition();
        }
        // Bevorzuge weiter entfernte Positionen
        freePositions.sort((a, b) => b.dist - a.dist);
        const topThird = Math.floor(freePositions.length / 3);
        const idx = Math.floor(Math.random() * Math.max(1, topThird));
        return freePositions[idx];
    }

    initDots() {
        // Platziere Dots auf allen freien Wegen
        for (let y = 1; y < this.rows - 1; y++) {
            for (let x = 1; x < this.cols - 1; x++) {
                if (this.maze[y][x] === 0) {
                    this.dots.push({
                        gridX: x,
                        gridY: y,
                        x: x * this.cellSize + this.cellSize / 2,
                        y: y * this.cellSize + this.cellSize / 2,
                        eaten: false
                    });
                }
            }
        }

        // Power Pellets in den Ecken
        const pelletPositions = [
            { x: 1, y: 1 },
            { x: this.cols - 2, y: 1 },
            { x: 1, y: this.rows - 2 },
            { x: this.cols - 2, y: this.rows - 2 }
        ];

        for (let pos of pelletPositions) {
            if (this.maze[pos.y] && this.maze[pos.y][pos.x] === 0) {
                this.powerPellets.push({
                    gridX: pos.x,
                    gridY: pos.y,
                    x: pos.x * this.cellSize + this.cellSize / 2,
                    y: pos.y * this.cellSize + this.cellSize / 2,
                    eaten: false
                });
            }
        }
    }

    initGhosts() {
        const colors = this.colors.ghost;
        const minDistanceFromPacman = Math.floor(Math.min(this.cols, this.rows) * 0.3);
        const minDistanceBetweenGhosts = 5;

        for (let i = 0; i < 4; i++) {
            let pos;
            let attempts = 0;
            const maxAttempts = 100;

            // Finde Position weit weg von Pac-Man
            do {
                pos = this.findRandomPositionAwayFrom(
                    this.pacman.gridX,
                    this.pacman.gridY,
                    minDistanceFromPacman
                );

                // Prüfe Abstand zu anderen Geistern
                let tooClose = false;
                for (let ghost of this.ghosts) {
                    const dist = this.manhattanDistance(pos.x, pos.y, ghost.gridX, ghost.gridY);
                    if (dist < minDistanceBetweenGhosts) {
                        tooClose = true;
                        break;
                    }
                }

                if (!tooClose) break;
                attempts++;
            } while (attempts < maxAttempts);

            // Falls keine gute Position gefunden, nimm was wir haben
            if (attempts >= maxAttempts) {
                pos = this.findRandomPositionAwayFrom(
                    this.pacman.gridX,
                    this.pacman.gridY,
                    minDistanceFromPacman
                );
            }

            this.ghosts.push({
                gridX: pos.x,
                gridY: pos.y,
                x: pos.x * this.cellSize + this.cellSize / 2,
                y: pos.y * this.cellSize + this.cellSize / 2,
                color: colors[i],
                direction: Math.floor(Math.random() * 4),
                speed: 1.5,
                scared: false
            });
        }
    }

    canMove(gridX, gridY) {
        if (gridX < 0 || gridX >= this.cols || gridY < 0 || gridY >= this.rows) {
            return false;
        }
        return this.maze[gridY][gridX] === 0;
    }

    drawMaze() {
        const ctx = this.ctx;
        ctx.strokeStyle = this.colors.wall;
        ctx.lineWidth = Math.max(2, this.cellSize * 0.12);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.maze[y][x] === 1) {
                    const px = x * this.cellSize;
                    const py = y * this.cellSize;

                    // Zeichne nur die äußeren Kanten der Wände
                    ctx.beginPath();

                    // Prüfe angrenzende Zellen
                    const top = y > 0 && this.maze[y - 1][x] === 0;
                    const bottom = y < this.rows - 1 && this.maze[y + 1][x] === 0;
                    const left = x > 0 && this.maze[y][x - 1] === 0;
                    const right = x < this.cols - 1 && this.maze[y][x + 1] === 0;

                    // Zeichne Ränder
                    if (top) {
                        ctx.moveTo(px, py);
                        ctx.lineTo(px + this.cellSize, py);
                    }
                    if (bottom) {
                        ctx.moveTo(px, py + this.cellSize);
                        ctx.lineTo(px + this.cellSize, py + this.cellSize);
                    }
                    if (left) {
                        ctx.moveTo(px, py);
                        ctx.lineTo(px, py + this.cellSize);
                    }
                    if (right) {
                        ctx.moveTo(px + this.cellSize, py);
                        ctx.lineTo(px + this.cellSize, py + this.cellSize);
                    }

                    ctx.stroke();
                }
            }
        }
    }

    drawPacman() {
        const ctx = this.ctx;
        const p = this.pacman;

        // Mund-Animation
        const mouthOpen = Math.abs(Math.sin(Date.now() / 100)) * 0.5;

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
        const r = this.cellSize * 0.4;

        ctx.fillStyle = ghost.scared ? this.colors.scaredGhost : ghost.color;

        // Körper
        ctx.beginPath();
        ctx.arc(ghost.x, ghost.y - r / 2, r, Math.PI, 0, false);
        ctx.lineTo(ghost.x + r, ghost.y + r);

        // Wellenförmiger Boden
        const waves = 3;
        for (let i = 0; i < waves; i++) {
            ctx.lineTo(ghost.x + r - (i + 0.5) * (2 * r / waves), ghost.y + r - 4);
            ctx.lineTo(ghost.x + r - (i + 1) * (2 * r / waves), ghost.y + r);
        }

        ctx.lineTo(ghost.x - r, ghost.y - r / 2);
        ctx.fill();

        // Augen
        if (!ghost.scared) {
            ctx.fillStyle = this.colors.eyes;
            const eyeSize = r * 0.25;
            const eyeY = ghost.y - r * 0.3;

            ctx.beginPath();
            ctx.arc(ghost.x - r * 0.35, eyeY, eyeSize, 0, Math.PI * 2);
            ctx.arc(ghost.x + r * 0.35, eyeY, eyeSize, 0, Math.PI * 2);
            ctx.fill();

            // Pupillen
            ctx.fillStyle = '#0000ff';
            const pupilSize = eyeSize * 0.5;
            ctx.beginPath();
            ctx.arc(ghost.x - r * 0.35, eyeY, pupilSize, 0, Math.PI * 2);
            ctx.arc(ghost.x + r * 0.35, eyeY, pupilSize, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Verängstigt - weiße Augen
            ctx.fillStyle = this.colors.eyes;
            ctx.beginPath();
            ctx.arc(ghost.x - r * 0.3, ghost.y - r * 0.2, 3, 0, Math.PI * 2);
            ctx.arc(ghost.x + r * 0.3, ghost.y - r * 0.2, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawDots() {
        const ctx = this.ctx;
        const dotSize = Math.max(2, this.cellSize * 0.12);
        const pelletSize = Math.max(4, this.cellSize * 0.28);

        // Normale Dots
        ctx.fillStyle = this.colors.dot;
        for (let dot of this.dots) {
            if (!dot.eaten) {
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dotSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Power Pellets (blinken)
        const pelletVisible = Math.floor(Date.now() / 200) % 2 === 0;
        if (pelletVisible) {
            ctx.fillStyle = this.colors.powerPellet;
            for (let pellet of this.powerPellets) {
                if (!pellet.eaten) {
                    ctx.beginPath();
                    ctx.arc(pellet.x, pellet.y, pelletSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    movePacman() {
        const p = this.pacman;
        const directions = [
            { dx: 1, dy: 0 },   // right
            { dx: 0, dy: 1 },   // down
            { dx: -1, dy: 0 },  // left
            { dx: 0, dy: -1 }   // up
        ];

        const dir = directions[p.direction];
        p.x += dir.dx * p.speed;
        p.y += dir.dy * p.speed;

        // Update grid position
        p.gridX = Math.floor(p.x / this.cellSize);
        p.gridY = Math.floor(p.y / this.cellSize);

        // Tunnel wrap-around
        if (p.x < 0) p.x = this.canvas.width;
        if (p.x > this.canvas.width) p.x = 0;

        // Prüfe ob Richtungswechsel möglich
        const nextDir = directions[p.nextDirection];
        const nextGridX = p.gridX + nextDir.dx;
        const nextGridY = p.gridY + nextDir.dy;

        if (this.canMove(nextGridX, nextGridY)) {
            p.direction = p.nextDirection;
        }

        // Prüfe ob aktuelle Richtung blockiert ist
        const currentNextX = p.gridX + dir.dx;
        const currentNextY = p.gridY + dir.dy;

        if (!this.canMove(currentNextX, currentNextY)) {
            // Snap to grid
            p.x = p.gridX * this.cellSize + this.cellSize / 2;
            p.y = p.gridY * this.cellSize + this.cellSize / 2;
        }
    }

    moveGhost(ghost) {
        const directions = [
            { dx: 1, dy: 0 },   // right
            { dx: 0, dy: 1 },   // down
            { dx: -1, dy: 0 },  // left
            { dx: 0, dy: -1 }   // up
        ];

        const dir = directions[ghost.direction];
        ghost.x += dir.dx * ghost.speed;
        ghost.y += dir.dy * ghost.speed;

        ghost.gridX = Math.floor(ghost.x / this.cellSize);
        ghost.gridY = Math.floor(ghost.y / this.cellSize);

        // Tunnel wrap
        if (ghost.x < 0) ghost.x = this.canvas.width;
        if (ghost.x > this.canvas.width) ghost.x = 0;

        // Richtungswechsel an Kreuzungen
        const centerX = ghost.gridX * this.cellSize + this.cellSize / 2;
        const centerY = ghost.gridY * this.cellSize + this.cellSize / 2;
        const atCenter = Math.abs(ghost.x - centerX) < 5 && Math.abs(ghost.y - centerY) < 5;

        if (atCenter && Math.random() < 0.1) {
            // Finde mögliche Richtungen
            const possibleDirs = [];
            for (let i = 0; i < 4; i++) {
                const testDir = directions[i];
                if (this.canMove(ghost.gridX + testDir.dx, ghost.gridY + testDir.dy)) {
                    possibleDirs.push(i);
                }
            }

            if (possibleDirs.length > 0) {
                if (this.animationVariant === 2 && !ghost.scared) {
                    // Verfolge Pac-Man
                    const dx = this.pacman.gridX - ghost.gridX;
                    const dy = this.pacman.gridY - ghost.gridY;

                    let bestDir = ghost.direction;
                    let bestDist = Infinity;

                    for (let testDir of possibleDirs) {
                        const td = directions[testDir];
                        const dist = Math.abs(dx - td.dx) + Math.abs(dy - td.dy);
                        if (dist < bestDist) {
                            bestDist = dist;
                            bestDir = testDir;
                        }
                    }
                    ghost.direction = bestDir;
                } else {
                    // Zufällige Richtung
                    ghost.direction = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
                }
            }
        }

        // Prüfe Kollision mit Wand
        const nextDir = directions[ghost.direction];
        const nextX = ghost.gridX + nextDir.dx;
        const nextY = ghost.gridY + nextDir.dy;

        if (!this.canMove(nextX, nextY)) {
            ghost.x = ghost.gridX * this.cellSize + this.cellSize / 2;
            ghost.y = ghost.gridY * this.cellSize + this.cellSize / 2;
        }
    }

    update() {
        // Variante 0: Klassisches Labyrinth-Spiel
        // Variante 1: Pac-Man folgt dem längsten Pfad
        // Variante 2: Geister jagen aktiv Pac-Man

        if (this.animationVariant === 0) {
            // Zufällige Richtungsänderungen
            if (Math.random() < 0.02) {
                this.pacman.nextDirection = Math.floor(Math.random() * 4);
            }
        } else if (this.animationVariant === 1) {
            // Folge dem Pfad
            if (Math.random() < 0.03) {
                this.pacman.nextDirection = (this.pacman.direction + (Math.random() < 0.5 ? 1 : 3)) % 4;
            }
        }

        this.movePacman();

        // Geister bewegen
        for (let ghost of this.ghosts) {
            ghost.scared = this.powerMode;
            this.moveGhost(ghost);
        }

        // Power Mode Timer
        if (this.powerMode) {
            this.powerModeTimer--;
            if (this.powerModeTimer <= 0) {
                this.powerMode = false;
            }
        }

        // Dots essen
        for (let dot of this.dots) {
            if (!dot.eaten) {
                const dist = Math.hypot(this.pacman.x - dot.x, this.pacman.y - dot.y);
                if (dist < this.cellSize * 0.5) {
                    dot.eaten = true;
                }
            }
        }

        // Power Pellets essen
        for (let pellet of this.powerPellets) {
            if (!pellet.eaten) {
                const dist = Math.hypot(this.pacman.x - pellet.x, this.pacman.y - pellet.y);
                if (dist < this.cellSize * 0.5) {
                    pellet.eaten = true;
                    this.powerMode = true;
                    this.powerModeTimer = 120; // ~2 Sekunden
                }
            }
        }

        // Level reset wenn alle Dots gegessen
        if (this.dots.every(d => d.eaten) && this.powerPellets.every(p => p.eaten)) {
            this.dots.forEach(d => d.eaten = false);
            this.powerPellets.forEach(p => p.eaten = false);
        }
    }

    draw() {
        // Hintergrund
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Labyrinth
        this.drawMaze();

        // Dots
        this.drawDots();

        // Geister
        for (let ghost of this.ghosts) {
            this.drawGhost(ghost);
        }

        // Pac-Man
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
