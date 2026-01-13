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
        // Spawne Pac-Man an einer zufälligen Position (wie mitten im Spiel)
        const pos = this.findRandomFreePosition();

        // Finde eine gültige Startrichtung
        const directions = [
            { dx: 1, dy: 0 },   // right
            { dx: 0, dy: 1 },   // down
            { dx: -1, dy: 0 },  // left
            { dx: 0, dy: -1 }   // up
        ];

        let validDirection = 0;
        for (let i = 0; i < 4; i++) {
            const dir = directions[i];
            if (this.canMove(pos.x + dir.dx, pos.y + dir.dy)) {
                validDirection = i;
                break;
            }
        }

        this.pacman = {
            gridX: pos.x,
            gridY: pos.y,
            x: pos.x * this.cellSize + this.cellSize / 2,
            y: pos.y * this.cellSize + this.cellSize / 2,
            radius: this.cellSize * 0.4,
            direction: validDirection,
            nextDirection: validDirection,
            speed: 2,
            moving: true
        };
    }

    initMaze() {
        // Erstelle ein authentisches Pac-Man Labyrinth ohne unzugängliche Räume
        // 0 = Weg, 1 = Wand
        this.maze = [];

        // Klassisches Pac-Man Labyrinth - alle Pfade verbunden
        const mazePattern = [
            "############################",
            "#............##............#",
            "#.####.#####.##.#####.####.#",
            "#o####.#####.##.#####.####o#",
            "#..........................#",
            "#.####.##.########.##.####.#",
            "#......##....##....##......#",
            "######.##### ## #####.######",
            "######.##### ## #####.######",
            "######.##          ##.######",
            "######.## ######## ##.######",
            "      .## ######## ##.      ",
            "######.## ######## ##.######",
            "######.##          ##.######",
            "######.## ######## ##.######",
            "######.## ######## ##.######",
            "#............##............#",
            "#.####.#####.##.#####.####.#",
            "#...##................##...#",
            "###.##.##.########.##.##.###",
            "#......##....##....##......#",
            "#.##########.##.##########.#",
            "#o..........................#",
            "############################"
        ];

        const patternHeight = mazePattern.length;
        const patternWidth = mazePattern[0].length;

        // Initialisiere Maze mit richtiger Größe
        for (let y = 0; y < this.rows; y++) {
            this.maze[y] = [];
            for (let x = 0; x < this.cols; x++) {
                this.maze[y][x] = 1; // Start mit Wänden
            }
        }

        // Zentriere das Pattern auf dem Bildschirm
        const offsetX = Math.floor((this.cols - patternWidth) / 2);
        const offsetY = Math.floor((this.rows - patternHeight) / 2);

        // Übertrage Pattern in die Maze
        for (let y = 0; y < patternHeight; y++) {
            for (let x = 0; x < patternWidth; x++) {
                const targetX = offsetX + x;
                const targetY = offsetY + y;

                if (targetX >= 0 && targetX < this.cols && targetY >= 0 && targetY < this.rows) {
                    const char = mazePattern[y][x];

                    if (char === '#') {
                        this.maze[targetY][targetX] = 1; // Wand
                    } else if (char === '.' || char === ' ' || char === 'o' || char === '-') {
                        this.maze[targetY][targetX] = 0; // Weg
                    }
                }
            }
        }

        // Speichere Offsets für spätere Verwendung (z.B. Ghost House Position)
        this.mazeOffsetX = offsetX;
        this.mazeOffsetY = offsetY;
        this.mazePatternWidth = patternWidth;
        this.mazePatternHeight = patternHeight;
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
        // Platziere Dots auf ALLEN begehbaren Feldern
        // (Ghost House ist jetzt geschlossen, also automatisch ausgeschlossen)
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
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

        // Power Pellets in den vier Ecken (basierend auf 'o' im Pattern)
        const pelletPositions = [
            { x: this.mazeOffsetX + 1, y: this.mazeOffsetY + 3 },
            { x: this.mazeOffsetX + 26, y: this.mazeOffsetY + 3 },
            { x: this.mazeOffsetX + 1, y: this.mazeOffsetY + 22 },
            { x: this.mazeOffsetX + 26, y: this.mazeOffsetY + 22 }
        ];

        for (let pos of pelletPositions) {
            if (pos.x >= 0 && pos.x < this.cols && pos.y >= 0 && pos.y < this.rows &&
                this.maze[pos.y] && this.maze[pos.y][pos.x] === 0) {

                // Entferne normalen Dot an dieser Position
                this.dots = this.dots.filter(d => !(d.gridX === pos.x && d.gridY === pos.y));

                this.powerPellets.push({
                    gridX: pos.x,
                    gridY: pos.y,
                    x: pos.x * this.cellSize + this.cellSize / 2,
                    y: pos.y * this.cellSize + this.cellSize / 2,
                    eaten: false
                });
            }
        }

        // Simuliere "mitten im Spiel" - esse einige zufällige Dots bereits
        const dotsToEat = Math.floor(this.dots.length * 0.3); // 30% der Dots bereits gegessen
        for (let i = 0; i < dotsToEat; i++) {
            const randomIndex = Math.floor(Math.random() * this.dots.length);
            this.dots[randomIndex].eaten = true;
        }

        // Vielleicht ist auch ein Power Pellet schon gegessen
        if (Math.random() < 0.3) {
            const randomPellet = Math.floor(Math.random() * this.powerPellets.length);
            this.powerPellets[randomPellet].eaten = true;
        }
    }

    initGhosts() {
        const colors = this.colors.ghost;
        const minDistanceBetweenGhosts = 5;
        const directions = [
            { dx: 1, dy: 0 },   // right
            { dx: 0, dy: 1 },   // down
            { dx: -1, dy: 0 },  // left
            { dx: 0, dy: -1 }   // up
        ];

        for (let i = 0; i < 4; i++) {
            let pos;
            let attempts = 0;
            const maxAttempts = 50;

            // Finde zufällige Position mit Abstand zu anderen Geistern
            do {
                pos = this.findRandomFreePosition();

                // Prüfe Abstand zu anderen Geistern und Pac-Man
                let tooClose = false;

                // Nicht zu nahe an Pac-Man spawnen
                const distToPacman = this.manhattanDistance(pos.x, pos.y, this.pacman.gridX, this.pacman.gridY);
                if (distToPacman < 8) {
                    tooClose = true;
                }

                // Nicht zu nahe an anderen Geistern
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
                pos = this.findRandomFreePosition();
            }

            // Finde eine gültige Startrichtung für diese Position
            let validDirection = 0;
            for (let dir = 0; dir < 4; dir++) {
                const testDir = directions[dir];
                if (this.canMove(pos.x + testDir.dx, pos.y + testDir.dy)) {
                    validDirection = dir;
                    break;
                }
            }

            this.ghosts.push({
                gridX: pos.x,
                gridY: pos.y,
                x: pos.x * this.cellSize + this.cellSize / 2,
                y: pos.y * this.cellSize + this.cellSize / 2,
                color: colors[i],
                direction: validDirection, // Gültige Startrichtung statt zufälliger
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

        // Zeichne Wände als gefüllte Blöcke für bessere Sichtbarkeit
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.maze[y][x] === 1) {
                    const px = x * this.cellSize;
                    const py = y * this.cellSize;

                    // Fülle die Wand mit dunkelblauer Farbe
                    ctx.fillStyle = this.colors.wall;
                    ctx.fillRect(px + 1, py + 1, this.cellSize - 2, this.cellSize - 2);

                    // Füge eine hellere Umrandung hinzu für 3D-Effekt
                    ctx.strokeStyle = '#4141ff';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(px + 1, py + 1, this.cellSize - 2, this.cellSize - 2);
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

    findNearestDot() {
        // Finde den nächsten ungegessenen Dot oder Power Pellet
        let nearestDist = Infinity;
        let nearestDot = null;

        // Prüfe normale Dots
        for (let dot of this.dots) {
            if (!dot.eaten) {
                const dist = Math.hypot(
                    dot.gridX - this.pacman.gridX,
                    dot.gridY - this.pacman.gridY
                );
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestDot = { gridX: dot.gridX, gridY: dot.gridY };
                }
            }
        }

        // Prüfe Power Pellets (bevorzuge diese leicht)
        for (let pellet of this.powerPellets) {
            if (!pellet.eaten) {
                const dist = Math.hypot(
                    pellet.gridX - this.pacman.gridX,
                    pellet.gridY - this.pacman.gridY
                ) * 0.8; // Pellets sind attraktiver
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestDot = { gridX: pellet.gridX, gridY: pellet.gridY };
                }
            }
        }

        return nearestDot;
    }

    movePacman() {
        const p = this.pacman;
        const directions = [
            { dx: 1, dy: 0 },   // right
            { dx: 0, dy: 1 },   // down
            { dx: -1, dy: 0 },  // left
            { dx: 0, dy: -1 }   // up
        ];

        // Berechne Grid-Center
        const centerX = p.gridX * this.cellSize + this.cellSize / 2;
        const centerY = p.gridY * this.cellSize + this.cellSize / 2;
        const distToCenter = Math.hypot(p.x - centerX, p.y - centerY);
        const atCenter = distToCenter < 2;

        // Wenn wir im Center sind, prüfe Richtungen
        if (atCenter) {
            p.x = centerX;
            p.y = centerY;

            // Prüfe ob aktuelle Richtung frei ist
            const currentDir = directions[p.direction];
            const nextGridX = p.gridX + currentDir.dx;
            const nextGridY = p.gridY + currentDir.dy;

            // Sammle alle gültigen Richtungen
            const validDirs = [];
            for (let i = 0; i < 4; i++) {
                const testDir = directions[i];
                const testX = p.gridX + testDir.dx;
                const testY = p.gridY + testDir.dy;
                if (this.canMove(testX, testY)) {
                    validDirs.push(i);
                }
            }

            // Wenn mehr als 1 Richtung möglich (an einer Kreuzung) ODER aktuelle Richtung blockiert
            if (validDirs.length > 1 || !this.canMove(nextGridX, nextGridY)) {
                // Finde nächsten Dot
                const targetDot = this.findNearestDot();

                if (targetDot) {
                    // Berechne welche Richtung uns näher zum Ziel bringt
                    let bestDir = p.direction;
                    let bestDist = Infinity;

                    for (let dir of validDirs) {
                        const testDir = directions[dir];
                        const testX = p.gridX + testDir.dx;
                        const testY = p.gridY + testDir.dy;

                        // Distanz zum Ziel von dieser Position
                        const distToTarget = Math.hypot(
                            targetDot.gridX - testX,
                            targetDot.gridY - testY
                        );

                        if (distToTarget < bestDist) {
                            bestDist = distToTarget;
                            bestDir = dir;
                        }
                    }

                    p.direction = bestDir;
                } else if (validDirs.length > 0) {
                    // Kein Dot gefunden, wähle zufällige Richtung
                    const oppositeDir = (p.direction + 2) % 4;
                    const notOpposite = validDirs.filter(d => d !== oppositeDir);

                    if (notOpposite.length > 0) {
                        p.direction = notOpposite[Math.floor(Math.random() * notOpposite.length)];
                    } else {
                        p.direction = validDirs[0];
                    }
                }
            }
        }

        // Bewege Pac-Man kontinuierlich
        const dir = directions[p.direction];
        const newX = p.x + dir.dx * p.speed;
        const newY = p.y + dir.dy * p.speed;

        // Prüfe ob die neue Position gültig ist
        const newGridX = Math.floor(newX / this.cellSize);
        const newGridY = Math.floor(newY / this.cellSize);

        if (this.canMove(newGridX, newGridY)) {
            p.x = newX;
            p.y = newY;
            p.gridX = newGridX;
            p.gridY = newGridY;
        } else {
            // Snap zum Grid wenn wir an eine Wand stoßen würden
            p.x = centerX;
            p.y = centerY;
        }

        // Tunnel wrap-around
        if (p.x < 0) {
            p.x = this.canvas.width;
            p.gridX = Math.floor(p.x / this.cellSize);
        }
        if (p.x > this.canvas.width) {
            p.x = 0;
            p.gridX = 0;
        }
    }

    moveGhost(ghost) {
        const directions = [
            { dx: 1, dy: 0 },   // right
            { dx: 0, dy: 1 },   // down
            { dx: -1, dy: 0 },  // left
            { dx: 0, dy: -1 }   // up
        ];

        // Berechne Grid-Center
        const centerX = ghost.gridX * this.cellSize + this.cellSize / 2;
        const centerY = ghost.gridY * this.cellSize + this.cellSize / 2;
        const distToCenter = Math.hypot(ghost.x - centerX, ghost.y - centerY);
        const atCenter = distToCenter < 2;

        // Am Grid-Center: Entscheide neue Richtung
        if (atCenter) {
            ghost.x = centerX;
            ghost.y = centerY;

            // Prüfe ob aktuelle Richtung noch frei ist
            const currentDir = directions[ghost.direction];
            const nextGridX = ghost.gridX + currentDir.dx;
            const nextGridY = ghost.gridY + currentDir.dy;

            // Finde alle gültigen Richtungen
            const validDirs = [];
            for (let i = 0; i < 4; i++) {
                const testDir = directions[i];
                const testX = ghost.gridX + testDir.dx;
                const testY = ghost.gridY + testDir.dy;
                if (this.canMove(testX, testY)) {
                    validDirs.push(i);
                }
            }

            // Wenn mehr als 1 Richtung möglich (Kreuzung) ODER aktuelle Richtung blockiert
            const isBlocked = !this.canMove(nextGridX, nextGridY);
            const atIntersection = validDirs.length > 1;
            const shouldDecide = isBlocked || (atIntersection && Math.random() < 0.2);

            if (shouldDecide && validDirs.length > 0) {
                if (this.animationVariant === 2 && !ghost.scared) {
                    // Variante 2: Verfolge Pac-Man intelligent
                    let bestDir = ghost.direction;
                    let bestDist = Infinity;

                    for (let testDir of validDirs) {
                        const td = directions[testDir];
                        const testX = ghost.gridX + td.dx;
                        const testY = ghost.gridY + td.dy;

                        // Distanz zu Pac-Man von dieser Position
                        const distToPacman = Math.hypot(
                            this.pacman.gridX - testX,
                            this.pacman.gridY - testY
                        );

                        if (distToPacman < bestDist) {
                            bestDist = distToPacman;
                            bestDir = testDir;
                        }
                    }
                    ghost.direction = bestDir;
                } else {
                    // Zufällige Richtung, aber bevorzuge nicht zurückgehen
                    const oppositeDir = (ghost.direction + 2) % 4;
                    const notOpposite = validDirs.filter(d => d !== oppositeDir);

                    if (notOpposite.length > 0) {
                        ghost.direction = notOpposite[Math.floor(Math.random() * notOpposite.length)];
                    } else {
                        ghost.direction = validDirs[0];
                    }
                }
            } else if (isBlocked && validDirs.length > 0) {
                // Notfall: Wenn blockiert, nimm irgendeine gültige Richtung
                ghost.direction = validDirs[0];
            }
        }

        // Bewege Ghost kontinuierlich
        const dir = directions[ghost.direction];
        const newX = ghost.x + dir.dx * ghost.speed;
        const newY = ghost.y + dir.dy * ghost.speed;

        // Prüfe ob neue Position gültig ist
        const newGridX = Math.floor(newX / this.cellSize);
        const newGridY = Math.floor(newY / this.cellSize);

        if (this.canMove(newGridX, newGridY)) {
            ghost.x = newX;
            ghost.y = newY;
            ghost.gridX = newGridX;
            ghost.gridY = newGridY;
        } else {
            // Snap zum Grid wenn blockiert
            ghost.x = centerX;
            ghost.y = centerY;
        }

        // Tunnel wrap-around
        if (ghost.x < 0) {
            ghost.x = this.canvas.width;
            ghost.gridX = Math.floor(ghost.x / this.cellSize);
        }
        if (ghost.x > this.canvas.width) {
            ghost.x = 0;
            ghost.gridX = 0;
        }
    }

    update() {
        // Pac-Man bewegt sich mit eingebautem Pathfinding zum nächsten Dot
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
