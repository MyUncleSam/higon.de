window.DonkeyKongGame = class DonkeyKongGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.animationFrame = null;
        this.animationVariant = Math.floor(Math.random() * 3);

        // Color palette based on original Donkey Kong arcade
        this.colors = {
            bg: '#000000',
            mario: '#ff0000',
            marioBlue: '#0000ff',
            dk: '#8B4513',
            girder: this.animationVariant === 0 ? '#ff0000' : (this.animationVariant === 1 ? '#cc0000' : '#dd2200'),
            barrel: '#d2691e',
            ladder: '#ffff00',
            pauline: '#ffb6c1',
            text: '#ffffff'
        };

        // Scaling - make everything bigger
        this.scale = Math.min(canvas.width, canvas.height) / 400;

        // Platform system (4 platforms with drop zones)
        // Each platform has drop zones where barrels can fall through
        // Barrels alternate direction: right (top) -> left -> right -> left (bottom)
        this.platforms = [
            {
                y: 0.80,
                startX: 0.10,
                endX: 0.90,
                slopeRight: false,
                dropZones: [0.15] // barrel falls off left edge into void
            },
            {
                y: 0.60,
                startX: 0.10,
                endX: 0.90,
                slopeRight: true,
                dropZones: [0.85] // barrel falls off right edge
            },
            {
                y: 0.40,
                startX: 0.10,
                endX: 0.90,
                slopeRight: false,
                dropZones: [0.15] // barrel falls off left edge
            },
            {
                y: 0.20,
                startX: 0.20,
                endX: 0.80,
                slopeRight: true,
                dropZones: [0.85] // Top platform - barrel falls off right edge
            }
        ];

        // Ladders connecting platforms (from bottom platform index)
        this.ladders = [
            { fromPlatform: 0, toPlatform: 1, x: 0.35, bottomY: 0.80, topY: 0.60 },
            { fromPlatform: 0, toPlatform: 1, x: 0.65, bottomY: 0.80, topY: 0.60 },
            { fromPlatform: 1, toPlatform: 2, x: 0.30, bottomY: 0.60, topY: 0.40 },
            { fromPlatform: 1, toPlatform: 2, x: 0.70, bottomY: 0.60, topY: 0.40 },
            { fromPlatform: 2, toPlatform: 3, x: 0.50, bottomY: 0.40, topY: 0.20 }
        ];

        // Mario
        this.mario = {
            x: 0.15,
            y: 0.80,
            size: 20,
            state: 'walking', // walking, climbing, jumping
            direction: 1, // 1 = right, -1 = left
            currentPlatform: 0,
            targetLadderIndex: null,
            climbProgress: 0,
            walkSpeed: 0.004,
            nextAction: 'walk_to_ladder',
            targetLadder: 0,
            waitTimer: 0
        };

        // Donkey Kong
        this.donkeyKong = {
            x: 0.25,
            y: 0.13,
            size: 35,
            throwTimer: 0,
            throwInterval: 80,
            animFrame: 0
        };

        // Pauline
        this.pauline = {
            x: 0.65,
            y: 0.13,
            size: 20,
            animFrame: 0
        };

        // Barrels
        this.barrels = [];

        // Game state
        this.frame = 0;
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

    update() {
        this.frame++;

        // Update Donkey Kong
        this.donkeyKong.throwTimer++;
        if (this.donkeyKong.throwTimer >= this.donkeyKong.throwInterval) {
            this.spawnBarrel();
            this.donkeyKong.throwTimer = 0;
        }
        this.donkeyKong.animFrame = Math.floor(this.frame / 10) % 2;

        // Update Pauline
        this.pauline.animFrame = Math.floor(this.frame / 15) % 2;

        // Update Mario
        this.updateMario();

        // Update barrels
        this.updateBarrels();
    }

    updateMario() {
        const mario = this.mario;

        // Check if reached top
        if (mario.currentPlatform === 3 && mario.x > 0.55) {
            // Reset to bottom
            mario.x = 0.15;
            mario.y = 0.80;
            mario.currentPlatform = 0;
            mario.state = 'walking';
            mario.targetLadder = 0;
            mario.direction = 1;
            mario.waitTimer = 0;
            return;
        }

        if (mario.state === 'walking') {
            const platform = this.platforms[mario.currentPlatform];

            // Check for nearby barrels - jump if needed
            const dangerBarrel = this.barrels.find(b =>
                b.state === 'rolling' &&
                b.platformIndex === mario.currentPlatform &&
                Math.abs(b.x - mario.x) < 0.12 &&
                Math.abs(b.x - mario.x) > 0.02
            );

            if (dangerBarrel && mario.state === 'walking') {
                mario.state = 'jumping';
                mario.jumpTimer = 0;
                mario.jumpDuration = 20;
                return;
            }

            // Find next ladder to climb
            const availableLadders = this.ladders.filter(l => l.fromPlatform === mario.currentPlatform);

            if (availableLadders.length > 0) {
                const targetLadder = availableLadders[mario.targetLadder % availableLadders.length];
                const ladderX = targetLadder.x;

                // Move towards ladder
                if (Math.abs(mario.x - ladderX) < 0.02) {
                    // Reached ladder, start climbing
                    mario.state = 'climbing';
                    mario.climbProgress = 0;
                    mario.targetLadderIndex = targetLadder;
                    mario.x = ladderX; // Snap to ladder
                } else {
                    // Walk towards ladder
                    if (mario.x < ladderX) {
                        mario.direction = 1;
                        mario.x += mario.walkSpeed;
                    } else {
                        mario.direction = -1;
                        mario.x -= mario.walkSpeed;
                    }

                    // Update Y based on slope
                    mario.y = this.getPlatformYAtX(mario.currentPlatform, mario.x);
                }
            } else {
                // Just walk across platform
                mario.x += mario.walkSpeed * mario.direction;
                mario.y = this.getPlatformYAtX(mario.currentPlatform, mario.x);

                // Bounce at edges
                if (mario.x < platform.startX + 0.05) {
                    mario.direction = 1;
                }
                if (mario.x > platform.endX - 0.05) {
                    mario.direction = -1;
                }
            }

        } else if (mario.state === 'climbing') {
            // Climb up
            mario.climbProgress += 0.015;

            if (mario.climbProgress >= 1.0) {
                // Finished climbing
                mario.currentPlatform++;
                mario.state = 'walking';
                mario.y = this.getPlatformYAtX(mario.currentPlatform, mario.x);
                mario.climbProgress = 0;
                mario.targetLadder++;
                mario.direction = (mario.currentPlatform % 2 === 0) ? 1 : -1;
            } else {
                // Interpolate position
                const ladder = mario.targetLadderIndex;
                mario.y = ladder.bottomY - (ladder.bottomY - ladder.topY) * mario.climbProgress;
            }

        } else if (mario.state === 'jumping') {
            // Jump animation
            mario.jumpTimer++;
            if (mario.jumpTimer >= mario.jumpDuration) {
                mario.state = 'walking';
            } else {
                // Continue walking during jump
                const platform = this.platforms[mario.currentPlatform];
                mario.x += mario.walkSpeed * mario.direction * 0.5;
                mario.x = Math.max(platform.startX, Math.min(platform.endX, mario.x));
                mario.y = this.getPlatformYAtX(mario.currentPlatform, mario.x);
            }
        }
    }

    getPlatformYAtX(platformIndex, x) {
        const platform = this.platforms[platformIndex];
        const progress = (x - platform.startX) / (platform.endX - platform.startX);
        const slopeAmount = 0.05;

        if (platform.slopeRight) {
            // Right side lower, so barrels roll down to the right
            return platform.y - (1 - progress) * slopeAmount;
        } else {
            // Left side lower, so barrels roll down to the left
            return platform.y - progress * slopeAmount;
        }
    }

    spawnBarrel() {
        const topPlatform = this.platforms[3];
        // Barrel rolls in the direction of the platform slope
        this.barrels.push({
            x: this.donkeyKong.x + 0.08,
            y: topPlatform.y,
            vx: topPlatform.slopeRight ? 0.006 : -0.006,
            vy: 0,
            rotation: 0,
            platformIndex: 3,
            state: 'rolling', // rolling or falling
            size: 15
        });
    }

    updateBarrels() {
        for (let i = this.barrels.length - 1; i >= 0; i--) {
            const barrel = this.barrels[i];

            if (barrel.state === 'rolling') {
                const platform = this.platforms[barrel.platformIndex];

                // Move barrel along platform
                barrel.x += barrel.vx;
                barrel.rotation += barrel.vx * 8;

                // Update Y based on platform slope
                barrel.y = this.getPlatformYAtX(barrel.platformIndex, barrel.x);

                // Check if barrel reached the edge
                let shouldFall = false;
                let fallSide = null;

                if (platform.slopeRight && barrel.x >= platform.endX - 0.02) {
                    // Rolling right, fell off right edge
                    shouldFall = true;
                    fallSide = 'right';
                } else if (!platform.slopeRight && barrel.x <= platform.startX + 0.02) {
                    // Rolling left, fell off left edge
                    shouldFall = true;
                    fallSide = 'left';
                }

                if (shouldFall && barrel.platformIndex > 0) {
                    // Start falling to next platform down
                    barrel.state = 'falling';
                    barrel.vy = 0;
                    barrel.targetPlatform = barrel.platformIndex - 1;
                    barrel.fallSide = fallSide;

                    // Lock X position at edge for falling
                    if (fallSide === 'right') {
                        barrel.x = platform.endX;
                    } else {
                        barrel.x = platform.startX;
                    }
                } else if (shouldFall && barrel.platformIndex === 0) {
                    // Reached bottom floor, fell into void - remove barrel
                    this.barrels.splice(i, 1);
                }

            } else if (barrel.state === 'falling') {
                // Falling animation with gravity
                barrel.vy += 0.004; // gravity
                barrel.y += barrel.vy;
                barrel.rotation += 0.4;

                // Check if landed on target platform
                const targetPlatform = this.platforms[barrel.targetPlatform];
                if (barrel.y >= targetPlatform.y) {
                    // Landed on new platform
                    barrel.state = 'rolling';
                    barrel.platformIndex = barrel.targetPlatform;
                    barrel.vy = 0;

                    // Position barrel on the new platform based on where it fell from
                    if (barrel.fallSide === 'right') {
                        // Fell from right, land on right side
                        barrel.x = targetPlatform.endX - 0.05;
                    } else {
                        // Fell from left, land on left side
                        barrel.x = targetPlatform.startX + 0.05;
                    }

                    // Update Y to match platform
                    barrel.y = this.getPlatformYAtX(barrel.platformIndex, barrel.x);

                    // Set velocity direction based on new platform's slope
                    // Platforms alternate: right, left, right, left
                    const speed = 0.006;
                    if (targetPlatform.slopeRight) {
                        // Platform slopes right, barrel rolls right
                        barrel.vx = speed;
                    } else {
                        // Platform slopes left, barrel rolls left
                        barrel.vx = -speed;
                    }
                }
            }
        }
    }

    draw() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Clear background
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, w, h);

        // Draw platforms
        this.drawPlatforms();

        // Draw ladders
        this.drawLadders();

        // Draw barrels
        this.drawBarrels();

        // Draw Mario
        this.drawMario();

        // Draw Donkey Kong
        this.drawDonkeyKong();

        // Draw Pauline
        this.drawPauline();

        // Draw text
        this.drawText();
    }

    drawPlatforms() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        const girderHeight = 10 * this.scale;
        const lineWidth = 3 * this.scale;

        for (let i = 0; i < this.platforms.length; i++) {
            const platform = this.platforms[i];
            const startX = platform.startX * w;
            const endX = platform.endX * w;

            const startY = this.getPlatformYAtX(i, platform.startX) * h;
            const endY = this.getPlatformYAtX(i, platform.endX) * h;

            // Draw top girder line
            this.ctx.strokeStyle = this.colors.girder;
            this.ctx.lineWidth = lineWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();

            // Draw bottom girder line
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY + girderHeight);
            this.ctx.lineTo(endX, endY + girderHeight);
            this.ctx.stroke();

            // Draw vertical connecting supports
            const numSupports = 20;
            this.ctx.lineWidth = 2 * this.scale;
            for (let j = 0; j <= numSupports; j++) {
                const progress = j / numSupports;
                const supportX = startX + (endX - startX) * progress;
                const topY = startY + (endY - startY) * progress;
                const bottomY = topY + girderHeight;

                this.ctx.beginPath();
                this.ctx.moveTo(supportX, topY);
                this.ctx.lineTo(supportX, bottomY);
                this.ctx.stroke();
            }
        }
    }

    drawLadders() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        this.ctx.strokeStyle = this.colors.ladder;
        this.ctx.lineWidth = 4 * this.scale;

        for (const ladder of this.ladders) {
            const x = ladder.x * w;
            const topY = ladder.topY * h;
            const bottomY = ladder.bottomY * h;

            // Draw ladder sides
            this.ctx.beginPath();
            this.ctx.moveTo(x - 8 * this.scale, bottomY);
            this.ctx.lineTo(x - 8 * this.scale, topY);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(x + 8 * this.scale, bottomY);
            this.ctx.lineTo(x + 8 * this.scale, topY);
            this.ctx.stroke();

            // Draw rungs
            const numRungs = 6;
            for (let i = 0; i <= numRungs; i++) {
                const rungY = bottomY - (bottomY - topY) * (i / numRungs);
                this.ctx.beginPath();
                this.ctx.moveTo(x - 8 * this.scale, rungY);
                this.ctx.lineTo(x + 8 * this.scale, rungY);
                this.ctx.stroke();
            }
        }
    }

    drawMario() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const mario = this.mario;

        let x = mario.x * w;
        let y = mario.y * h;

        // Jump offset
        if (mario.state === 'jumping') {
            const jumpProgress = mario.jumpTimer / mario.jumpDuration;
            const jumpHeight = Math.sin(jumpProgress * Math.PI) * 30 * this.scale;
            y -= jumpHeight;
        }

        const size = mario.size * this.scale;

        // Draw Mario
        // Legs (blue overalls)
        this.ctx.fillStyle = this.colors.marioBlue;
        this.ctx.fillRect(x - size * 0.35, y - size * 0.5, size * 0.3, size * 0.5);
        this.ctx.fillRect(x + size * 0.05, y - size * 0.5, size * 0.3, size * 0.5);

        // Body (red shirt)
        this.ctx.fillStyle = this.colors.mario;
        this.ctx.fillRect(x - size * 0.4, y - size, size * 0.8, size * 0.5);

        // Head (tan)
        this.ctx.fillStyle = '#f4a460';
        this.ctx.fillRect(x - size * 0.35, y - size * 1.4, size * 0.7, size * 0.5);

        // Cap (red)
        this.ctx.fillStyle = this.colors.mario;
        this.ctx.fillRect(x - size * 0.45, y - size * 1.65, size * 0.9, size * 0.3);

        // Mustache (black)
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(x - size * 0.25, y - size * 1.15, size * 0.5, size * 0.15);

        // Eyes (white)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(x - size * 0.22, y - size * 1.25, size * 0.15, size * 0.1);
        this.ctx.fillRect(x + size * 0.07, y - size * 1.25, size * 0.15, size * 0.1);
    }

    drawDonkeyKong() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const dk = this.donkeyKong;

        const x = dk.x * w;
        const y = dk.y * h;
        const size = dk.size * this.scale;

        // Body
        this.ctx.fillStyle = this.colors.dk;
        this.ctx.fillRect(x - size * 0.45, y, size * 0.9, size);

        // Head
        this.ctx.fillRect(x - size * 0.4, y - size * 0.5, size * 0.8, size * 0.6);

        // Eyes (white)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(x - size * 0.25, y - size * 0.3, size * 0.18, size * 0.18);
        this.ctx.fillRect(x + size * 0.07, y - size * 0.3, size * 0.18, size * 0.18);

        // Pupils (black)
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(x - size * 0.18, y - size * 0.25, size * 0.08, size * 0.08);
        this.ctx.fillRect(x + size * 0.14, y - size * 0.25, size * 0.08, size * 0.08);

        // Arms (animated)
        const armOffset = dk.animFrame * 5 * this.scale;
        this.ctx.fillStyle = this.colors.dk;
        this.ctx.fillRect(x - size * 0.7, y + size * 0.2 + armOffset, size * 0.25, size * 0.6);
        this.ctx.fillRect(x + size * 0.45, y + size * 0.2 - armOffset, size * 0.25, size * 0.6);

        // Barrel in hand when about to throw
        if (dk.throwTimer > dk.throwInterval - 15) {
            this.ctx.fillStyle = this.colors.barrel;
            this.ctx.fillRect(x + size * 0.5, y + size * 0.3, size * 0.3, size * 0.3);

            // Barrel stripes
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(x + size * 0.5, y + size * 0.35, size * 0.3, size * 0.08);
        }
    }

    drawPauline() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const pauline = this.pauline;

        const x = pauline.x * w;
        const y = pauline.y * h;
        const size = pauline.size * this.scale;

        // Dress (pink)
        this.ctx.fillStyle = this.colors.pauline;
        this.ctx.fillRect(x - size * 0.5, y, size, size);

        // Head (tan)
        this.ctx.fillStyle = '#f4a460';
        this.ctx.fillRect(x - size * 0.4, y - size * 0.5, size * 0.8, size * 0.5);

        // Hair (brown)
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x - size * 0.5, y - size * 0.7, size, size * 0.25);

        // Arms waving (animated)
        const armY = y + size * 0.2 - pauline.animFrame * 8 * this.scale;
        this.ctx.fillStyle = '#f4a460';
        this.ctx.fillRect(x - size * 0.8, armY, size * 0.2, size * 0.5);
        this.ctx.fillRect(x + size * 0.6, armY, size * 0.2, size * 0.5);

        // "HELP!" text
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `bold ${14 * this.scale}px monospace`;
        this.ctx.fillText('HELP!', x - size * 0.8, y - size * 1.2);
    }

    drawBarrels() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        for (const barrel of this.barrels) {
            const x = barrel.x * w;
            const y = barrel.y * h;
            const radius = barrel.size * this.scale * 0.5;

            this.ctx.save();
            this.ctx.translate(x, y);

            // Barrel body (circle - side view)
            this.ctx.fillStyle = this.colors.barrel;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Darker edge/rim
            this.ctx.strokeStyle = '#8B4513';
            this.ctx.lineWidth = 2 * this.scale;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
            this.ctx.stroke();

            // Rolling bands - these rotate with the barrel
            this.ctx.strokeStyle = '#8B4513';
            this.ctx.lineWidth = 2 * this.scale;

            // Draw two bands that rotate
            for (let i = 0; i < 2; i++) {
                const angle = barrel.rotation + (i * Math.PI);
                const bandY = Math.sin(angle) * radius * 0.5;
                const bandWidth = Math.cos(angle);

                // Only draw band when it's visible (facing us)
                if (Math.abs(bandWidth) > 0.3) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(-radius * 0.85, bandY);
                    this.ctx.lineTo(radius * 0.85, bandY);
                    this.ctx.stroke();
                }
            }

            // Center hole/cap detail
            this.ctx.fillStyle = '#8B4513';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        }
    }

    drawText() {
        const w = this.canvas.width;

        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `bold ${16 * this.scale}px monospace`;
        this.ctx.fillText('DONKEY KONG', w * 0.05, w * 0.05);
    }
};
