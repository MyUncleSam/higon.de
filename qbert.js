// Q*bert Animation
window.QbertGame = class QbertGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        // Pyramiden-Konfiguration (7 Reihen = 28 Würfel)
        this.pyramidRows = 7;
        this.cubes = [];

        // Q*bert
        this.qbert = {
            row: 0,
            col: 0,
            x: 0,
            y: 0,
            targetRow: 0,
            targetCol: 0,
            jumping: false,
            jumpProgress: 0,
            size: 0
        };

        // Gegner (optional)
        this.enemies = [];

        // Farben
        this.colors = {
            bg: '#000',
            cubeInitial: '#4a4a8a',
            cubeTarget: '#ffaa00',
            cubeTop: '#8080ff',
            cubeSide1: '#6060cc',
            cubeSide2: '#4040aa',
            qbert: '#ff8800',
            enemy: '#ff0066'
        };

        // Animation
        this.animationFrame = null;
        this.moveTimer = 0;
        this.moveInterval = 30; // Frames zwischen Bewegungen

        // Initial setup
        this.calculateDimensions();
        this.initPyramid();
        this.initQbert();
        this.initEnemies();
    }

    // Berechne Dimensionen basierend auf Canvas-Größe
    calculateDimensions() {
        // Skalierung basierend auf Bildschirmgröße - verwende mehr Platz
        const scale = Math.min(this.canvas.width, this.canvas.height) / 400;
        this.scale = scale;

        // Isometrische Würfelgröße - größer für bessere Nutzung des Bildschirms
        this.cubeSize = Math.floor(50 * scale);

        // Update Q*bert size
        this.qbert.size = this.cubeSize * 0.6;

        // Update enemy sizes
        for (let enemy of this.enemies) {
            enemy.size = this.cubeSize * 0.5;
        }
    }

    // Resize-Handler für dynamische Größenanpassung
    resize() {
        this.calculateDimensions();

        // Update Q*bert position
        const qbertPos = this.getIsometricPosition(this.qbert.row, this.qbert.col);
        this.qbert.x = qbertPos.x;
        this.qbert.y = qbertPos.y;

        // Update enemy positions
        for (let enemy of this.enemies) {
            const enemyPos = this.getIsometricPosition(enemy.row, enemy.col);
            enemy.x = enemyPos.x;
            enemy.y = enemyPos.y;
        }
    }

    // Erstelle die Pyramide mit 7 Reihen (28 Würfel)
    initPyramid() {
        for (let row = 0; row < this.pyramidRows; row++) {
            for (let col = 0; col <= row; col++) {
                this.cubes.push({
                    row: row,
                    col: col,
                    color: this.colors.cubeInitial,
                    isTarget: false,
                    hitCount: 0
                });
            }
        }
    }

    // Berechne isometrische Position eines Würfels
    getIsometricPosition(row, col) {
        const centerX = this.canvas.width / 2;

        // Positioniere die Pyramide oben mit genug Platz für Q*bert (inkl. Sprunghöhe)
        // Q*bert braucht etwa cubeSize * 0.6 für seinen Körper + cubeSize * 0.8 für Sprunghöhe
        const topMargin = this.cubeSize * 2;
        const centerY = topMargin;

        // Isometrische Projektion
        const isoX = (col - row / 2) * this.cubeSize * 1.5;
        const isoY = row * this.cubeSize * 0.75;

        return {
            x: centerX + isoX,
            y: centerY + isoY
        };
    }

    // Finde Würfel basierend auf row/col
    getCube(row, col) {
        return this.cubes.find(c => c.row === row && c.col === col);
    }

    initQbert() {
        this.qbert.row = 0;
        this.qbert.col = 0;
        const pos = this.getIsometricPosition(0, 0);
        this.qbert.x = pos.x;
        this.qbert.y = pos.y;
    }

    initEnemies() {
        // Spawne 2-3 Gegner an zufälligen Positionen
        const enemyCount = 2;
        for (let i = 0; i < enemyCount; i++) {
            const row = Math.floor(Math.random() * this.pyramidRows);
            const col = Math.floor(Math.random() * (row + 1));
            const pos = this.getIsometricPosition(row, col);

            this.enemies.push({
                row: row,
                col: col,
                x: pos.x,
                y: pos.y,
                targetRow: row,
                targetCol: col,
                jumping: false,
                jumpProgress: 0,
                size: this.cubeSize * 0.5,
                moveTimer: Math.floor(Math.random() * 60)
            });
        }
    }

    // Zeichne einen isometrischen Würfel
    drawCube(cube) {
        const ctx = this.ctx;
        const pos = this.getIsometricPosition(cube.row, cube.col);
        const size = this.cubeSize;

        // Farbvariation basierend auf Status
        let topColor, leftColor, rightColor;

        if (cube.isTarget) {
            topColor = this.colors.cubeTarget;
            leftColor = this.adjustColor(this.colors.cubeTarget, -30);
            rightColor = this.adjustColor(this.colors.cubeTarget, -50);
        } else {
            topColor = cube.color;
            leftColor = this.adjustColor(cube.color, -20);
            rightColor = this.adjustColor(cube.color, -40);
        }

        // Obere Fläche (Raute)
        ctx.fillStyle = topColor;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x + size * 0.75, pos.y + size * 0.375);
        ctx.lineTo(pos.x, pos.y + size * 0.75);
        ctx.lineTo(pos.x - size * 0.75, pos.y + size * 0.375);
        ctx.closePath();
        ctx.fill();

        // Umrandung
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = Math.max(1, this.scale * 2);
        ctx.stroke();

        // Linke Seite
        ctx.fillStyle = leftColor;
        ctx.beginPath();
        ctx.moveTo(pos.x - size * 0.75, pos.y + size * 0.375);
        ctx.lineTo(pos.x, pos.y + size * 0.75);
        ctx.lineTo(pos.x, pos.y + size * 1.25);
        ctx.lineTo(pos.x - size * 0.75, pos.y + size * 0.875);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Rechte Seite
        ctx.fillStyle = rightColor;
        ctx.beginPath();
        ctx.moveTo(pos.x + size * 0.75, pos.y + size * 0.375);
        ctx.lineTo(pos.x, pos.y + size * 0.75);
        ctx.lineTo(pos.x, pos.y + size * 1.25);
        ctx.lineTo(pos.x + size * 0.75, pos.y + size * 0.875);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    // Hilfsfunktion: Farbe abdunkeln
    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const num = parseInt(hex, 16);
        const r = Math.max(0, Math.min(255, (num >> 16) + amount));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
        const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
        return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    }

    // Zeichne Q*bert
    drawQbert() {
        const ctx = this.ctx;
        let x = this.qbert.x;
        let y = this.qbert.y;

        // Sprung-Animation
        if (this.qbert.jumping) {
            const startPos = this.getIsometricPosition(this.qbert.row, this.qbert.col);
            const endPos = this.getIsometricPosition(this.qbert.targetRow, this.qbert.targetCol);

            const progress = this.qbert.jumpProgress;
            x = startPos.x + (endPos.x - startPos.x) * progress;
            y = startPos.y + (endPos.y - startPos.y) * progress;

            // Parabel für Sprung-Höhe
            const jumpHeight = Math.sin(progress * Math.PI) * this.cubeSize * 0.8;
            y -= jumpHeight;
        }

        const size = this.qbert.size;

        // Körper (orange Kugel mit Schnauze)
        ctx.fillStyle = this.colors.qbert;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Schnauze/Nase
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(x - size * 0.2, y - size * 0.1, size * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Augen (weiß)
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x - size * 0.25, y - size * 0.3, size * 0.15, 0, Math.PI * 2);
        ctx.arc(x + size * 0.05, y - size * 0.3, size * 0.15, 0, Math.PI * 2);
        ctx.fill();

        // Pupillen (schwarz)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - size * 0.25, y - size * 0.3, size * 0.08, 0, Math.PI * 2);
        ctx.arc(x + size * 0.05, y - size * 0.3, size * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Füße (nur wenn nicht springend)
        if (!this.qbert.jumping || this.qbert.jumpProgress < 0.3) {
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.arc(x - size * 0.3, y + size * 0.4, size * 0.15, 0, Math.PI * 2);
            ctx.arc(x + size * 0.3, y + size * 0.4, size * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Zeichne Gegner
    drawEnemy(enemy) {
        const ctx = this.ctx;
        let x = enemy.x;
        let y = enemy.y;

        // Sprung-Animation
        if (enemy.jumping) {
            const startPos = this.getIsometricPosition(enemy.row, enemy.col);
            const endPos = this.getIsometricPosition(enemy.targetRow, enemy.targetCol);

            const progress = enemy.jumpProgress;
            x = startPos.x + (endPos.x - startPos.x) * progress;
            y = startPos.y + (endPos.y - startPos.y) * progress;

            const jumpHeight = Math.sin(progress * Math.PI) * this.cubeSize * 0.6;
            y -= jumpHeight;
        }

        const size = enemy.size;

        // Gegner als Kugel/Schlange (lila/pink)
        ctx.fillStyle = this.colors.enemy;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Augen
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x - size * 0.2, y - size * 0.1, size * 0.15, 0, Math.PI * 2);
        ctx.arc(x + size * 0.2, y - size * 0.1, size * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - size * 0.2, y - size * 0.1, size * 0.08, 0, Math.PI * 2);
        ctx.arc(x + size * 0.2, y - size * 0.1, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
    }

    // Prüfe ob eine Position gültig ist
    isValidPosition(row, col) {
        return row >= 0 && row < this.pyramidRows && col >= 0 && col <= row;
    }

    // Bewege Q*bert
    moveQbert() {
        if (this.qbert.jumping) {
            this.qbert.jumpProgress += 0.1;

            if (this.qbert.jumpProgress >= 1) {
                // Sprung beendet
                this.qbert.jumping = false;
                this.qbert.jumpProgress = 0;
                this.qbert.row = this.qbert.targetRow;
                this.qbert.col = this.qbert.targetCol;

                const pos = this.getIsometricPosition(this.qbert.row, this.qbert.col);
                this.qbert.x = pos.x;
                this.qbert.y = pos.y;

                // Würfel-Farbe ändern
                const cube = this.getCube(this.qbert.row, this.qbert.col);
                if (cube) {
                    cube.hitCount++;
                    if (!cube.isTarget) {
                        cube.isTarget = true;
                    }
                }

                // Prüfe ob alle Würfel die Zielfarbe haben
                const allTarget = this.cubes.every(c => c.isTarget);
                if (allTarget) {
                    // Level gewonnen - Reset
                    this.cubes.forEach(c => {
                        c.isTarget = false;
                        c.hitCount = 0;
                    });
                }
            }
        } else {
            // Neue Bewegung starten
            this.moveTimer++;
            if (this.moveTimer >= this.moveInterval) {
                this.moveTimer = 0;

                // Wähle zufällige Richtung (4 diagonale Richtungen)
                // 0 = oben-links, 1 = oben-rechts, 2 = unten-links, 3 = unten-rechts
                const directions = [
                    { dr: -1, dc: -1 }, // oben-links
                    { dr: -1, dc: 0 },  // oben-rechts
                    { dr: 1, dc: 0 },   // unten-links
                    { dr: 1, dc: 1 }    // unten-rechts
                ];

                // Priorisiere Bewegungen zu Würfeln die noch nicht die Zielfarbe haben
                const possibleMoves = [];
                for (let dir of directions) {
                    const newRow = this.qbert.row + dir.dr;
                    const newCol = this.qbert.col + dir.dc;

                    if (this.isValidPosition(newRow, newCol)) {
                        const cube = this.getCube(newRow, newCol);
                        const priority = cube && !cube.isTarget ? 10 : 1;
                        for (let i = 0; i < priority; i++) {
                            possibleMoves.push({ row: newRow, col: newCol });
                        }
                    }
                }

                if (possibleMoves.length > 0) {
                    const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                    this.qbert.targetRow = move.row;
                    this.qbert.targetCol = move.col;
                    this.qbert.jumping = true;
                }
            }
        }
    }

    // Bewege Gegner
    moveEnemy(enemy) {
        if (enemy.jumping) {
            enemy.jumpProgress += 0.08;

            if (enemy.jumpProgress >= 1) {
                enemy.jumping = false;
                enemy.jumpProgress = 0;
                enemy.row = enemy.targetRow;
                enemy.col = enemy.targetCol;

                const pos = this.getIsometricPosition(enemy.row, enemy.col);
                enemy.x = pos.x;
                enemy.y = pos.y;
            }
        } else {
            enemy.moveTimer++;
            if (enemy.moveTimer >= 50) {
                enemy.moveTimer = 0;

                // Bewege Gegner zufällig
                const directions = [
                    { dr: -1, dc: -1 },
                    { dr: -1, dc: 0 },
                    { dr: 1, dc: 0 },
                    { dr: 1, dc: 1 }
                ];

                const possibleMoves = [];
                for (let dir of directions) {
                    const newRow = enemy.row + dir.dr;
                    const newCol = enemy.col + dir.dc;

                    if (this.isValidPosition(newRow, newCol)) {
                        possibleMoves.push({ row: newRow, col: newCol });
                    }
                }

                if (possibleMoves.length > 0) {
                    const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                    enemy.targetRow = move.row;
                    enemy.targetCol = move.col;
                    enemy.jumping = true;
                }
            }
        }
    }

    update() {
        this.moveQbert();

        // Bewege Gegner
        for (let enemy of this.enemies) {
            this.moveEnemy(enemy);
        }
    }

    draw() {
        // Hintergrund
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Zeichne alle Würfel (von hinten nach vorne für korrektes Layering)
        for (let row = this.pyramidRows - 1; row >= 0; row--) {
            for (let col = row; col >= 0; col--) {
                const cube = this.getCube(row, col);
                if (cube) {
                    this.drawCube(cube);
                }
            }
        }

        // Zeichne Gegner
        for (let enemy of this.enemies) {
            this.drawEnemy(enemy);
        }

        // Zeichne Q*bert (immer ganz vorne)
        this.drawQbert();
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
