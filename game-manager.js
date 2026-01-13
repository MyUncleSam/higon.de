// Game Manager - Koordiniert alle Retro-Spiel-Animationen
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Canvas-Größe an Fenster anpassen
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Liste aller verfügbaren Spiele in fester Reihenfolge
    // Beginnt immer mit Pac-Man, da es jeder kennt
    const games = [
        window.PacManGame,
        window.SpaceInvadersGame,
        window.AsteroidsGame,
        window.GalagaGame,
        window.DonkeyKongGame,
        window.FroggerGame,
        window.CentipedeGame
    ];

    let currentGame = null;
    let currentGameIndex = -1; // Startet bei -1, damit das erste Spiel Index 0 hat

    // Spiel wechseln
    function switchGame() {
        // Altes Spiel stoppen
        if (currentGame && currentGame.stop) {
            currentGame.stop();
        }

        // Canvas leeren
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Zum nächsten Spiel in der Reihenfolge wechseln
        currentGameIndex = (currentGameIndex + 1) % games.length;
        const GameClass = games[currentGameIndex];

        if (GameClass) {
            currentGame = new GameClass(canvas, ctx);
            if (currentGame.start) {
                currentGame.start();
            }
        }
    }

    // Erstes Spiel starten
    switchGame();

    // Alle 5 Sekunden das Spiel wechseln
    setInterval(switchGame, 5000);
})();
