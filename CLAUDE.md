# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

higon.de is a static website featuring 9 classic arcade/NES game animations rendered in the browser using vanilla JavaScript and HTML5 Canvas. No build tools, bundler, or dependencies are used - files run directly in the browser.

Games are **AI-driven demonstrations** (not player-controlled) that run as background decorations at 40% opacity behind the main content.

## Development

**Running locally:** Open `index.html` in a browser. No build step required.

**No package manager, tests, or linting configured.**

## Architecture

### Script Load Order (Critical)
In `index.html`, game scripts must load **before** `game-manager.js` because the manager references `window.*Game` classes at initialization:
1. All game JS files (pacman.js, space-invaders.js, etc.)
2. game-manager.js (last)

### Game Class Pattern
Each game is a self-contained ES6 class exposed on `window` (e.g., `window.PacManGame`, `window.SpaceInvadersGame`). All games implement:
- `constructor(canvas, ctx)` - Initialize with canvas and 2D context
- `start()` - Begin animation loop via `requestAnimationFrame`
- `stop()` - Cancel animation frame and cleanup
- `update()` - Game logic tick (AI movement, collisions)
- `draw()` - Canvas rendering
- `gameLoop()` - Internal loop calling update() then draw()

Common patterns across games:
- `this.scale = Math.min(canvas.width, canvas.height) / 400` - Responsive scaling
- `this.colors = {...}` - Color palette object
- `this.animationVariant = Math.floor(Math.random() * 3)` - Visual variation per instance
- `this.animationFrame` - Stores requestAnimationFrame ID for cleanup

### Game Manager (game-manager.js)
IIFE that orchestrates game switching. Exposes `window.gameManager` API:
- `switchToGame(index)` - Switch to specific game
- `getCurrentGameIndex()` - Get current game index
- `getGameList()` - Get array of game info objects

Behavior:
- Fixed game order: Pac-Man(1), Space Invaders(2), Asteroids(3), Galaga(4), Frogger(5), Centipede(6), Q*bert(7), Donkey Kong(8), Mario Land(9)
- Auto-rotates every 5 seconds
- Manual selection (keyboard 1-9 or click) triggers 15-second pause before auto-rotation resumes
- Calls `currentGame.resize()` on window resize (if method exists)

### Canvas Setup
- Full-screen fixed position canvas (`#gameCanvas`)
- Rendered at 40% opacity as decorative background
- Resized dynamically to match window dimensions

## Notes

- UI and code comments are in German
- All rendering uses Canvas 2D API with requestAnimationFrame loops
- Games simulate "mid-game" state on init (e.g., some dots already eaten in Pac-Man, coins pre-collected in Mario)
