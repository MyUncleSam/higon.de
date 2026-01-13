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

    // Liste aller verfügbaren Spiele
    const games = [
        window.SpaceInvadersGame,
        window.PacManGame,
        window.AsteroidsGame,
        window.GalagaGame,
        window.DonkeyKongGame,
        window.FroggerGame,
        window.CentipedeGame
    ];

    let currentGame = null;
    let currentGameIndex = 0;

    // Spiel wechseln
    function switchGame() {
        // Altes Spiel stoppen
        if (currentGame && currentGame.stop) {
            currentGame.stop();
        }

        // Canvas leeren
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Neues Spiel starten
        currentGameIndex = Math.floor(Math.random() * games.length);
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
