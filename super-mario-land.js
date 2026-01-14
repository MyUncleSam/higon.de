window.SuperMarioLandGame = class SuperMarioLandGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.animationFrame = null;
        this.animationVariant = Math.floor(Math.random() * 3);

        // Scaling
        this.scale = Math.min(canvas.width, canvas.height) / 400;

        // Colors (NES-style)
        this.colors = {
            bg: '#5c94fc',
            ground: '#c84c0c',
            brick: '#dc9c64',
            questionBlock: '#faa005',
            pipe: '#74a838',
            pipeHighlight: '#8fc848',
            pipeShadow: '#4a7820',
            mario: '#ff0000',
            marioBlue: '#0000ff',
            skin: '#f4a460',
            coin: '#ffd700',
            cloud: '#ffffff',
            bush: '#00aa00',
            goomba: '#8b4513',
            goombaDark: '#5c3317',
            koopa: '#00aa00',
            koopaDark: '#006600',
            text: '#ffffff'
        };

        // World/Camera
        this.worldOffset = 0;
        this.scrollSpeed = 1.5 * this.scale;

        // Chunk-based level generation
        this.chunkWidth = 400;
        this.chunks = [];
        this.nextChunkX = 0;

        // Ground position
        this.groundY = canvas.height - 48 * this.scale;

        // Mario
        this.mario = {
            x: canvas.width * 0.25,
            y: 0,
            vx: 0,
            vy: 0,
            width: 14 * this.scale,
            height: 20 * this.scale,
            state: 'running',
            direction: 1,
            animFrame: 0,
            grounded: false,
            jumpHeld: false
        };

        // Physics
        this.gravity = 0.4 * this.scale;
        this.jumpForce = -9 * this.scale;
        this.maxFallSpeed = 8 * this.scale;

        // Background decorations
        this.clouds = [];
        this.bushes = [];

        // Game state
        this.coinCount = 0;
        this.frame = 0;
        this.isDead = false;
        this.deathTimer = 0;

        this.initLevel();
    }

    start() {
        this.gameLoop();
    }

    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        this.animationFrame = requestAnimationFrame(() => this.gameLoop());
    }

    initLevel() {
        // Pre-generate clouds (fixed positions with parallax)
        for (let i = 0; i < 10; i++) {
            this.clouds.push({
                x: i * 200 + Math.random() * 100,
                y: 30 + Math.random() * 60,
                size: 0.8 + Math.random() * 0.5
            });
        }

        // Pre-generate several chunks before starting view
        const preGenerateCount = 3;
        for (let i = -preGenerateCount; i < 5; i++) {
            this.generateChunk(i * this.chunkWidth);
        }
        this.nextChunkX = 5 * this.chunkWidth;

        // Start mid-level
        this.worldOffset = this.chunkWidth * 1.5;

        // Position Mario on ground
        this.mario.y = this.groundY - this.mario.height;

        // Pre-collect some coins to show game is in progress
        this.coinCount = Math.floor(Math.random() * 15) + 5;
        let coinsToMark = Math.floor(Math.random() * 10) + 3;
        for (const chunk of this.chunks) {
            for (const coin of chunk.coins) {
                if (coinsToMark > 0 && coin.x < this.worldOffset && Math.random() < 0.5) {
                    coin.collected = true;
                    coinsToMark--;
                }
            }
        }

        // Pre-remove some enemies
        for (const chunk of this.chunks) {
            for (const enemy of chunk.enemies) {
                if (enemy.x < this.worldOffset && Math.random() < 0.4) {
                    enemy.alive = false;
                }
            }
        }
    }

    generateChunk(startX) {
        const tileSize = 16 * this.scale;
        const tilesPerChunk = Math.ceil(this.chunkWidth / tileSize);

        const chunk = {
            startX: startX,
            endX: startX + this.chunkWidth,
            tiles: [],  // Array of booleans: true = ground, false = gap
            platforms: [],
            enemies: [],
            coins: [],
            pipes: [],
            bushes: []
        };

        // Generate ground tiles with gaps
        let i = 0;
        while (i < tilesPerChunk) {
            // Decide if we should place a gap (not at the very start of chunk)
            if (Math.random() < 0.12 && i > 4) {
                // Gap: exactly 1 or 2 blocks
                const gapSize = Math.random() < 0.5 ? 1 : 2;
                for (let g = 0; g < gapSize && i < tilesPerChunk; g++) {
                    chunk.tiles.push(false);
                    i++;
                }
            } else {
                // Ground tile
                chunk.tiles.push(true);
                i++;
            }
        }

        // Add enemies on ground sections
        let groundStart = -1;
        for (let t = 0; t <= chunk.tiles.length; t++) {
            const isGround = t < chunk.tiles.length && chunk.tiles[t];
            if (isGround && groundStart === -1) {
                groundStart = t;
            } else if (!isGround && groundStart !== -1) {
                // End of ground section
                const groundLength = t - groundStart;
                if (groundLength >= 4 && Math.random() < 0.3) {
                    const enemyTile = groundStart + 2 + Math.floor(Math.random() * (groundLength - 3));
                    const enemyX = startX + enemyTile * tileSize + tileSize / 2;
                    this.addEnemy(chunk, enemyX, groundLength * tileSize);
                }
                // Maybe add bush
                if (groundLength >= 3 && Math.random() < 0.3) {
                    const bushTile = groundStart + Math.floor(Math.random() * (groundLength - 2));
                    chunk.bushes.push({
                        x: startX + bushTile * tileSize,
                        size: 0.7 + Math.random() * 0.6
                    });
                }
                groundStart = -1;
            }
        }

        // Add floating platforms
        const numPlatforms = Math.floor(Math.random() * 2);
        for (let i = 0; i < numPlatforms; i++) {
            const platX = startX + 50 + Math.random() * (this.chunkWidth - 100);
            const platY = this.groundY - (80 + Math.random() * 60) * this.scale;
            const platWidth = (48 + Math.random() * 32) * this.scale;
            chunk.platforms.push({
                x: platX,
                y: platY,
                width: platWidth,
                type: Math.random() < 0.4 ? 'question' : 'brick'
            });

            // Add coins above platform
            if (Math.random() < 0.6) {
                for (let c = 0; c < 3; c++) {
                    chunk.coins.push({
                        x: platX + c * 16 * this.scale,
                        y: platY - 20 * this.scale,
                        collected: false
                    });
                }
            }
        }

        // Find ground sections for placing coins and pipes
        const groundSections = [];
        let sectionStart = -1;
        for (let t = 0; t <= chunk.tiles.length; t++) {
            const isGround = t < chunk.tiles.length && chunk.tiles[t];
            if (isGround && sectionStart === -1) {
                sectionStart = t;
            } else if (!isGround && sectionStart !== -1) {
                groundSections.push({ start: sectionStart, length: t - sectionStart });
                sectionStart = -1;
            }
        }

        // Add coins in patterns on ground
        if (Math.random() < 0.5 && groundSections.length > 0) {
            const section = groundSections[Math.floor(Math.random() * groundSections.length)];
            if (section.length >= 5) {
                const pattern = Math.floor(Math.random() * 3);
                const baseTile = section.start + 1 + Math.floor(Math.random() * (section.length - 4));
                const baseX = startX + baseTile * tileSize;

                if (pattern === 0) {
                    // Arc
                    for (let i = 0; i < 5; i++) {
                        const arcHeight = Math.sin(i / 4 * Math.PI) * 40 * this.scale;
                        chunk.coins.push({
                            x: baseX + i * 14 * this.scale,
                            y: this.groundY - 30 * this.scale - arcHeight,
                            collected: false
                        });
                    }
                } else if (pattern === 1) {
                    // Row
                    for (let i = 0; i < 4; i++) {
                        chunk.coins.push({
                            x: baseX + i * tileSize,
                            y: this.groundY - 40 * this.scale,
                            collected: false
                        });
                    }
                } else {
                    // Single high coin
                    chunk.coins.push({
                        x: baseX,
                        y: this.groundY - 70 * this.scale,
                        collected: false
                    });
                }
            }
        }

        // Add decorative pipes on ground sections
        if (Math.random() < 0.3 && groundSections.length > 0) {
            const section = groundSections[Math.floor(Math.random() * groundSections.length)];
            if (section.length >= 4) {
                const pipeTile = section.start + 1 + Math.floor(Math.random() * (section.length - 2));
                chunk.pipes.push({
                    x: startX + pipeTile * tileSize,
                    height: (32 + Math.random() * 32) * this.scale
                });
            }
        }

        this.chunks.push(chunk);
    }

    addEnemy(chunk, x, patrolWidth) {
        const type = Math.random() < 0.7 ? 'goomba' : 'koopa';
        const patrolRange = Math.min(40 * this.scale, patrolWidth / 3);
        chunk.enemies.push({
            x: x,
            y: this.groundY,
            width: 14 * this.scale,
            height: 14 * this.scale,
            type: type,
            vx: -0.8 * this.scale,
            direction: -1,
            animFrame: 0,
            alive: true,
            patrolLeft: x - patrolRange,
            patrolRight: x + patrolRange
        });
    }

    cleanupOldChunks() {
        const leftEdge = this.worldOffset - this.chunkWidth;
        this.chunks = this.chunks.filter(chunk => chunk.endX > leftEdge);
    }

    update() {
        this.frame++;

        // Handle death state
        if (this.isDead) {
            this.deathTimer++;
            // Wait ~60 frames (1 second at 60fps), then restart
            if (this.deathTimer >= 60) {
                this.restartGame();
            }
            return;
        }

        // Scroll world
        this.worldOffset += this.scrollSpeed;

        // Generate new chunks
        const rightEdge = this.worldOffset + this.canvas.width;
        while (rightEdge > this.nextChunkX - this.chunkWidth) {
            this.generateChunk(this.nextChunkX);
            this.nextChunkX += this.chunkWidth;
        }

        // Cleanup old chunks
        this.cleanupOldChunks();

        // Update Mario AI
        this.updateMarioAI();

        // Update Mario physics
        this.updateMario();

        // Update enemies
        this.updateEnemies();

        // Update coins
        this.updateCoins();
    }

    updateMarioAI() {
        const marioWorldX = this.worldOffset + this.mario.x;
        const tileSize = 16 * this.scale;

        // Only make decisions when grounded
        if (!this.mario.grounded) return;

        // Primary focus: detect gaps and jump over them
        const lookAheadTiles = 4;  // Look ahead 4 tiles
        let gapDetected = false;
        let gapDistance = Infinity;

        for (const chunk of this.chunks) {
            // Check tiles ahead of Mario for gaps
            for (let t = 0; t < chunk.tiles.length; t++) {
                if (chunk.tiles[t]) continue;  // Not a gap

                // This is a gap tile
                const gapWorldX = chunk.startX + t * tileSize;
                const gapDist = gapWorldX - marioWorldX;

                if (gapDist > 5 * this.scale && gapDist < lookAheadTiles * tileSize) {
                    gapDetected = true;
                    gapDistance = Math.min(gapDistance, gapDist);
                }
            }
        }

        // Jump for gaps - this is the priority
        // Jump when gap is about 2-3 tiles away
        if (gapDetected && gapDistance < 2.5 * tileSize) {
            this.performJump();
            return;
        }

        // Secondary: check for enemies
        const enemyLookAhead = 50 * this.scale;
        for (const chunk of this.chunks) {
            for (const enemy of chunk.enemies) {
                if (!enemy.alive) continue;
                const enemyDist = enemy.x - marioWorldX;
                if (enemyDist > 10 * this.scale && enemyDist < enemyLookAhead) {
                    this.performJump();
                    return;
                }
            }

        }
    }

    performJump() {
        if (this.mario.grounded) {
            this.mario.vy = this.jumpForce;
            this.mario.grounded = false;
            this.mario.state = 'jumping';
            this.mario.jumpHeld = true;
        }
    }

    updateMario() {
        const m = this.mario;

        // Apply gravity
        m.vy += this.gravity;
        if (m.vy > this.maxFallSpeed) {
            m.vy = this.maxFallSpeed;
        }

        // Variable jump height
        if (m.jumpHeld && m.vy < 0) {
            m.vy += this.gravity * 0.3;
        } else {
            m.jumpHeld = false;
        }

        // Update position
        m.y += m.vy;

        // Ground collision
        const marioWorldX = this.worldOffset + m.x;
        const tileSize = 16 * this.scale;
        m.grounded = false;

        for (const chunk of this.chunks) {
            // Check ground tiles
            const tileIndex = Math.floor((marioWorldX - chunk.startX) / tileSize);
            if (tileIndex >= 0 && tileIndex < chunk.tiles.length && chunk.tiles[tileIndex]) {
                if (m.y + m.height >= this.groundY && m.vy >= 0) {
                    m.y = this.groundY - m.height;
                    m.vy = 0;
                    m.grounded = true;
                    m.state = 'running';
                }
            }

            // Check platforms
            for (const plat of chunk.platforms) {
                const screenPlatX = plat.x - this.worldOffset;
                if (m.x + m.width / 2 > screenPlatX && m.x - m.width / 2 < screenPlatX + plat.width) {
                    if (m.y + m.height >= plat.y && m.y + m.height <= plat.y + 10 * this.scale && m.vy >= 0) {
                        m.y = plat.y - m.height;
                        m.vy = 0;
                        m.grounded = true;
                        m.state = 'running';
                    }
                }
            }

            // Check pipes (Mario can land on top)
            for (const pipe of chunk.pipes) {
                const pipeScreenX = pipe.x - this.worldOffset;
                const pipeWidth = 28 * this.scale;
                const pipeTopY = this.groundY - pipe.height;

                if (m.x + m.width / 2 > pipeScreenX - 3 * this.scale && m.x - m.width / 2 < pipeScreenX + pipeWidth + 3 * this.scale) {
                    if (m.y + m.height >= pipeTopY && m.y + m.height <= pipeTopY + 10 * this.scale && m.vy >= 0) {
                        m.y = pipeTopY - m.height;
                        m.vy = 0;
                        m.grounded = true;
                        m.state = 'running';
                    }
                }
            }
        }

        // Fell into pit - trigger death
        if (m.y > this.canvas.height + 50) {
            this.triggerDeath();
        }

        // Update state
        if (!m.grounded) {
            m.state = m.vy < 0 ? 'jumping' : 'falling';
        }

        // Animation frame
        if (m.grounded) {
            m.animFrame = Math.floor(this.frame / 6) % 3;
        }
    }

    triggerDeath() {
        // Mario fell - stop scrolling and wait before restart
        this.isDead = true;
        this.deathTimer = 0;
    }

    restartGame() {
        // Reset all game state
        this.isDead = false;
        this.deathTimer = 0;
        this.worldOffset = 0;
        this.chunks = [];
        this.nextChunkX = 0;
        this.coinCount = 0;
        this.frame = 0;

        // Reinitialize level
        this.initLevel();
    }

    updateEnemies() {
        const marioWorldX = this.worldOffset + this.mario.x;

        for (const chunk of this.chunks) {
            for (const enemy of chunk.enemies) {
                if (!enemy.alive) continue;

                // Patrol movement
                enemy.x += enemy.vx;
                enemy.animFrame++;

                // Reverse at patrol bounds
                if (enemy.x <= enemy.patrolLeft || enemy.x >= enemy.patrolRight) {
                    enemy.vx *= -1;
                    enemy.direction *= -1;
                }

                // Check if Mario stomped
                const dx = Math.abs(marioWorldX - enemy.x);
                const marioBottom = this.mario.y + this.mario.height;
                const enemyTop = enemy.y;

                if (dx < 12 * this.scale && marioBottom >= enemyTop - 5 * this.scale && marioBottom <= enemyTop + 10 * this.scale && this.mario.vy > 0) {
                    enemy.alive = false;
                    this.mario.vy = this.jumpForce * 0.6;
                    this.mario.state = 'jumping';
                }
            }
        }
    }

    updateCoins() {
        const marioWorldX = this.worldOffset + this.mario.x;
        const marioWorldY = this.mario.y;

        for (const chunk of this.chunks) {
            for (const coin of chunk.coins) {
                if (coin.collected) continue;

                const dx = Math.abs(marioWorldX - coin.x);
                const dy = Math.abs(marioWorldY + this.mario.height / 2 - coin.y);

                if (dx < 15 * this.scale && dy < 15 * this.scale) {
                    coin.collected = true;
                    this.coinCount++;
                }
            }
        }
    }

    draw() {
        const ctx = this.ctx;

        // Clear background
        ctx.fillStyle = this.colors.bg;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw layers back to front
        this.drawClouds();
        this.drawBushes();
        this.drawPipes();
        this.drawGround();
        this.drawPlatforms();
        this.drawCoins();
        this.drawEnemies();
        this.drawMario();
        this.drawUI();
    }

    drawClouds() {
        const ctx = this.ctx;
        ctx.fillStyle = this.colors.cloud;

        for (const cloud of this.clouds) {
            // Parallax - clouds move slower
            const screenX = cloud.x - this.worldOffset * 0.2;
            const wrappedX = ((screenX % (this.canvas.width + 200)) + this.canvas.width + 200) % (this.canvas.width + 200) - 100;

            const size = cloud.size * this.scale;

            ctx.beginPath();
            ctx.arc(wrappedX, cloud.y * this.scale, 18 * size, 0, Math.PI * 2);
            ctx.arc(wrappedX + 22 * size, cloud.y * this.scale - 5 * size, 22 * size, 0, Math.PI * 2);
            ctx.arc(wrappedX + 44 * size, cloud.y * this.scale, 18 * size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawBushes() {
        const ctx = this.ctx;

        for (const chunk of this.chunks) {
            for (const bush of chunk.bushes) {
                const screenX = bush.x - this.worldOffset;
                if (screenX < -50 || screenX > this.canvas.width + 50) continue;

                const size = bush.size * this.scale;

                ctx.fillStyle = this.colors.bush;
                ctx.beginPath();
                ctx.arc(screenX, this.groundY, 12 * size, Math.PI, 0);
                ctx.arc(screenX + 18 * size, this.groundY, 16 * size, Math.PI, 0);
                ctx.arc(screenX + 36 * size, this.groundY, 12 * size, Math.PI, 0);
                ctx.fill();
            }
        }
    }

    drawPipes() {
        const ctx = this.ctx;

        for (const chunk of this.chunks) {
            for (const pipe of chunk.pipes) {
                const screenX = pipe.x - this.worldOffset;
                if (screenX < -40 || screenX > this.canvas.width + 40) continue;

                const width = 28 * this.scale;
                const height = pipe.height;
                const y = this.groundY - height;

                // Main pipe body
                ctx.fillStyle = this.colors.pipe;
                ctx.fillRect(screenX, y + 12 * this.scale, width, height - 12 * this.scale);

                // Pipe top (wider)
                ctx.fillRect(screenX - 3 * this.scale, y, width + 6 * this.scale, 14 * this.scale);

                // Highlight
                ctx.fillStyle = this.colors.pipeHighlight;
                ctx.fillRect(screenX + 2 * this.scale, y + 14 * this.scale, 4 * this.scale, height - 14 * this.scale);
                ctx.fillRect(screenX - 1 * this.scale, y + 2 * this.scale, 5 * this.scale, 10 * this.scale);

                // Shadow
                ctx.fillStyle = this.colors.pipeShadow;
                ctx.fillRect(screenX + width - 5 * this.scale, y + 14 * this.scale, 4 * this.scale, height - 14 * this.scale);
            }
        }
    }

    drawGround() {
        const ctx = this.ctx;
        const tileSize = 16 * this.scale;

        for (const chunk of this.chunks) {
            // Draw each tile in the chunk
            for (let t = 0; t < chunk.tiles.length; t++) {
                if (!chunk.tiles[t]) continue;  // Skip gaps

                const worldX = chunk.startX + t * tileSize;
                const screenX = worldX - this.worldOffset;

                // Skip if off-screen
                if (screenX > this.canvas.width || screenX + tileSize < 0) continue;

                // Draw 2 rows of bricks for this tile
                for (let ty = 0; ty < 2; ty++) {
                    const x = screenX;
                    const y = this.groundY + ty * tileSize;

                    // Main brick
                    ctx.fillStyle = this.colors.ground;
                    ctx.fillRect(x, y, tileSize - 1, tileSize - 1);

                    // Highlight (top and left edge)
                    ctx.fillStyle = this.colors.brick;
                    ctx.fillRect(x, y, tileSize - 2, 2 * this.scale);
                    ctx.fillRect(x, y, 2 * this.scale, tileSize - 2);

                    // Dark edge
                    ctx.fillStyle = '#8c4800';
                    ctx.fillRect(x + tileSize - 3 * this.scale, y + 2 * this.scale, 2 * this.scale, tileSize - 3);
                    ctx.fillRect(x + 2 * this.scale, y + tileSize - 3 * this.scale, tileSize - 4 * this.scale, 2 * this.scale);
                }
            }
        }
    }

    drawPlatforms() {
        const ctx = this.ctx;
        const tileSize = 16 * this.scale;

        for (const chunk of this.chunks) {
            for (const plat of chunk.platforms) {
                const screenX = plat.x - this.worldOffset;
                if (screenX > this.canvas.width || screenX + plat.width < 0) continue;

                const numTiles = Math.ceil(plat.width / tileSize);

                for (let i = 0; i < numTiles; i++) {
                    const x = screenX + i * tileSize;
                    const y = plat.y;

                    if (plat.type === 'question') {
                        // Question block
                        ctx.fillStyle = this.colors.questionBlock;
                        ctx.fillRect(x, y, tileSize - 1, tileSize - 1);

                        // Border
                        ctx.fillStyle = '#cd7f00';
                        ctx.fillRect(x, y, tileSize - 1, 2 * this.scale);
                        ctx.fillRect(x, y, 2 * this.scale, tileSize - 1);
                        ctx.fillRect(x, y + tileSize - 3 * this.scale, tileSize - 1, 2 * this.scale);
                        ctx.fillRect(x + tileSize - 3 * this.scale, y, 2 * this.scale, tileSize - 1);

                        // Question mark
                        ctx.fillStyle = '#000000';
                        ctx.font = `bold ${10 * this.scale}px Arial`;
                        ctx.fillText('?', x + 4 * this.scale, y + 12 * this.scale);
                    } else {
                        // Brick block
                        ctx.fillStyle = this.colors.ground;
                        ctx.fillRect(x, y, tileSize - 1, tileSize - 1);

                        ctx.fillStyle = this.colors.brick;
                        ctx.fillRect(x, y, tileSize - 2, 2 * this.scale);
                        ctx.fillRect(x, y, 2 * this.scale, tileSize - 2);
                    }
                }
            }
        }
    }

    drawCoins() {
        const ctx = this.ctx;

        for (const chunk of this.chunks) {
            for (const coin of chunk.coins) {
                if (coin.collected) continue;

                const screenX = coin.x - this.worldOffset;
                if (screenX < -20 || screenX > this.canvas.width + 20) continue;

                const size = 6 * this.scale;
                const wobble = Math.sin(this.frame * 0.15 + coin.x * 0.01) * 0.3;

                ctx.fillStyle = this.colors.coin;
                ctx.beginPath();
                ctx.ellipse(screenX, coin.y, size * (0.7 + wobble * 0.3), size, 0, 0, Math.PI * 2);
                ctx.fill();

                // Shine
                ctx.fillStyle = '#ffec8b';
                ctx.beginPath();
                ctx.ellipse(screenX - 2 * this.scale, coin.y - 2 * this.scale, size * 0.3, size * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawEnemies() {
        const ctx = this.ctx;

        for (const chunk of this.chunks) {
            for (const enemy of chunk.enemies) {
                if (!enemy.alive) continue;

                const screenX = enemy.x - this.worldOffset;
                if (screenX < -20 || screenX > this.canvas.width + 20) continue;

                if (enemy.type === 'goomba') {
                    this.drawGoomba(screenX, enemy);
                } else {
                    this.drawKoopa(screenX, enemy);
                }
            }
        }
    }

    drawGoomba(screenX, enemy) {
        const ctx = this.ctx;
        const size = 14 * this.scale;
        const y = enemy.y;

        // Body (brown mushroom)
        ctx.fillStyle = this.colors.goomba;

        // Head (dome)
        ctx.beginPath();
        ctx.arc(screenX, y - size * 0.4, size * 0.55, Math.PI, 0);
        ctx.fill();

        // Body
        ctx.fillRect(screenX - size * 0.45, y - size * 0.4, size * 0.9, size * 0.5);

        // Feet (animated)
        const footOffset = Math.floor(enemy.animFrame / 10) % 2 === 0 ? 2 * this.scale : -2 * this.scale;
        ctx.fillStyle = this.colors.goombaDark;
        ctx.fillRect(screenX - size * 0.4 + footOffset, y, size * 0.35, size * 0.15);
        ctx.fillRect(screenX + size * 0.05 - footOffset, y, size * 0.35, size * 0.15);

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(screenX - size * 0.3, y - size * 0.5, size * 0.2, size * 0.15);
        ctx.fillRect(screenX + size * 0.1, y - size * 0.5, size * 0.2, size * 0.15);

        // Pupils
        ctx.fillStyle = '#000000';
        ctx.fillRect(screenX - size * 0.22, y - size * 0.47, size * 0.08, size * 0.1);
        ctx.fillRect(screenX + size * 0.18, y - size * 0.47, size * 0.08, size * 0.1);

        // Eyebrows (angry)
        ctx.fillRect(screenX - size * 0.35, y - size * 0.58, size * 0.25, size * 0.06);
        ctx.fillRect(screenX + size * 0.1, y - size * 0.58, size * 0.25, size * 0.06);
    }

    drawKoopa(screenX, enemy) {
        const ctx = this.ctx;
        const size = 14 * this.scale;
        const y = enemy.y;

        // Shell
        ctx.fillStyle = this.colors.koopa;
        ctx.beginPath();
        ctx.arc(screenX, y - size * 0.35, size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Shell pattern
        ctx.strokeStyle = this.colors.koopaDark;
        ctx.lineWidth = 2 * this.scale;
        ctx.beginPath();
        ctx.arc(screenX, y - size * 0.35, size * 0.3, 0, Math.PI * 2);
        ctx.stroke();

        // Head
        ctx.fillStyle = this.colors.skin;
        const headX = enemy.direction > 0 ? screenX + size * 0.35 : screenX - size * 0.35;
        ctx.fillRect(headX - size * 0.15, y - size * 0.6, size * 0.3, size * 0.35);

        // Eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(headX - size * 0.05, y - size * 0.55, size * 0.08, size * 0.08);

        // Feet
        const footOffset = Math.floor(enemy.animFrame / 10) % 2 === 0 ? 2 * this.scale : -2 * this.scale;
        ctx.fillStyle = this.colors.koopa;
        ctx.fillRect(screenX - size * 0.3 + footOffset, y, size * 0.25, size * 0.12);
        ctx.fillRect(screenX + size * 0.05 - footOffset, y, size * 0.25, size * 0.12);
    }

    drawMario() {
        const ctx = this.ctx;
        const m = this.mario;
        const x = m.x;
        let y = m.y;
        const s = this.scale;

        // Jump squash/stretch
        let scaleX = 1;
        let scaleY = 1;
        if (m.state === 'jumping') {
            scaleX = 0.9;
            scaleY = 1.1;
        } else if (m.state === 'falling') {
            scaleX = 1.1;
            scaleY = 0.9;
        }

        ctx.save();
        ctx.translate(x, y + m.height);
        ctx.scale(scaleX, scaleY);

        const w = 14 * s;
        const h = 20 * s;

        // Cap
        ctx.fillStyle = this.colors.mario;
        ctx.fillRect(-w * 0.5, -h, w, h * 0.2);

        // Head
        ctx.fillStyle = this.colors.skin;
        ctx.fillRect(-w * 0.4, -h * 0.8, w * 0.8, h * 0.35);

        // Hair/sideburn
        ctx.fillStyle = '#4a2800';
        ctx.fillRect(-w * 0.45, -h * 0.75, w * 0.15, h * 0.2);

        // Eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(w * 0.05, -h * 0.7, w * 0.15, h * 0.1);

        // Mustache
        ctx.fillRect(-w * 0.1, -h * 0.5, w * 0.45, h * 0.08);

        // Body (red shirt)
        ctx.fillStyle = this.colors.mario;
        ctx.fillRect(-w * 0.45, -h * 0.45, w * 0.9, h * 0.25);

        // Overalls
        ctx.fillStyle = this.colors.marioBlue;
        ctx.fillRect(-w * 0.4, -h * 0.2, w * 0.8, h * 0.35);

        // Legs (animated when running)
        if (m.state === 'running') {
            const frame = m.animFrame;
            if (frame === 0) {
                ctx.fillRect(-w * 0.35, -h * 0.15 + h * 0.15, w * 0.3, h * 0.25);
                ctx.fillRect(w * 0.05, -h * 0.15 + h * 0.15, w * 0.3, h * 0.25);
            } else if (frame === 1) {
                ctx.fillRect(-w * 0.4, -h * 0.15 + h * 0.15, w * 0.35, h * 0.25);
                ctx.fillRect(w * 0.15, -h * 0.15 + h * 0.1, w * 0.25, h * 0.2);
            } else {
                ctx.fillRect(-w * 0.15, -h * 0.15 + h * 0.1, w * 0.25, h * 0.2);
                ctx.fillRect(w * 0.05, -h * 0.15 + h * 0.15, w * 0.35, h * 0.25);
            }
        } else {
            // Jumping/falling pose
            ctx.fillRect(-w * 0.4, -h * 0.15 + h * 0.1, w * 0.35, h * 0.2);
            ctx.fillRect(w * 0.05, -h * 0.15 + h * 0.1, w * 0.35, h * 0.2);
        }

        ctx.restore();
    }

    drawUI() {
        const ctx = this.ctx;

        // Title
        ctx.fillStyle = this.colors.text;
        ctx.font = `bold ${14 * this.scale}px monospace`;
        ctx.fillText('MARIO LAND', 10 * this.scale, 20 * this.scale);

        // Coin counter
        ctx.fillStyle = this.colors.coin;
        ctx.beginPath();
        ctx.arc(this.canvas.width - 60 * this.scale, 16 * this.scale, 6 * this.scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.colors.text;
        ctx.fillText('x ' + this.coinCount, this.canvas.width - 50 * this.scale, 20 * this.scale);
    }
};
