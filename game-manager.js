// Game Manager - Koordiniert alle Retro-Spiel-Animationen
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Variablen deklarieren (vor resizeCanvas, da diese dort verwendet werden)
    let currentGame = null;
    let currentGameIndex = -1;
    let autoSwitchInterval = null;
    let manualSwitchTimeout = null;
    let isManualMode = false;

    // Liste aller verfügbaren Spiele in fester Reihenfolge
    // Beginnt immer mit Pac-Man, da es jeder kennt
    const gameList = [
        { name: 'Pac-Man', class: window.PacManGame, key: '1' },
        { name: 'Space Invaders', class: window.SpaceInvadersGame, key: '2' },
        { name: 'Asteroids', class: window.AsteroidsGame, key: '3' },
        { name: 'Galaga', class: window.GalagaGame, key: '4' },
        { name: 'Frogger', class: window.FroggerGame, key: '5' },
        { name: 'Centipede', class: window.CentipedeGame, key: '6' },
        { name: 'Q*bert', class: window.QbertGame, key: '7' }
    ];

    // Canvas-Größe an Fenster anpassen
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Benachrichtige das aktuelle Spiel über die Größenänderung
        if (currentGame && currentGame.resize) {
            currentGame.resize();
        }
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // UI-Element für Spielliste aktualisieren
    function updateGameList() {
        const gameListElement = document.getElementById('gameList');
        if (!gameListElement) return;

        gameListElement.innerHTML = '';
        gameList.forEach((game, index) => {
            const item = document.createElement('div');
            item.className = 'game-list-item' + (index === currentGameIndex ? ' active' : '');
            item.innerHTML = `<span class="key">${game.key}</span> ${game.name}`;

            // Klick-Handler für direkten Wechsel
            item.addEventListener('click', () => {
                handleManualSwitch(index);
            });

            gameListElement.appendChild(item);
        });
    }

    // Spiel wechseln
    function switchGame(index = null) {
        // Altes Spiel stoppen
        if (currentGame && currentGame.stop) {
            currentGame.stop();
        }

        // Canvas leeren
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Zum nächsten oder spezifischen Spiel wechseln
        if (index !== null) {
            currentGameIndex = index;
        } else {
            currentGameIndex = (currentGameIndex + 1) % gameList.length;
        }

        const gameInfo = gameList[currentGameIndex];
        const GameClass = gameInfo.class;

        if (GameClass) {
            currentGame = new GameClass(canvas, ctx);
            if (currentGame.start) {
                currentGame.start();
            }
        }

        // UI aktualisieren
        updateGameList();
    }

    // Automatischen Wechsel starten
    function startAutoSwitch() {
        if (autoSwitchInterval) {
            clearInterval(autoSwitchInterval);
        }
        autoSwitchInterval = setInterval(() => {
            if (!isManualMode) {
                switchGame();
            }
        }, 5000);
    }

    // Manuellen Wechsel behandeln
    function handleManualSwitch(index) {
        // Setze manuellen Modus
        isManualMode = true;

        // Wechsle zum gewählten Spiel
        switchGame(index);

        // Lösche alten Timeout
        if (manualSwitchTimeout) {
            clearTimeout(manualSwitchTimeout);
        }

        // Nach 15 Sekunden zurück zum automatischen Modus
        manualSwitchTimeout = setTimeout(() => {
            isManualMode = false;
        }, 15000);
    }

    // Tastatursteuerung
    window.addEventListener('keydown', (event) => {
        const key = event.key;

        // Prüfe ob eine Nummerntaste gedrückt wurde
        const gameIndex = gameList.findIndex(game => game.key === key);

        if (gameIndex !== -1) {
            handleManualSwitch(gameIndex);
            event.preventDefault();
        }
    });

    // Erstes Spiel starten
    switchGame();

    // Automatischen Wechsel starten
    startAutoSwitch();

    // Initiale UI-Aktualisierung
    updateGameList();

    // Exportiere für externe Nutzung
    window.gameManager = {
        switchToGame: handleManualSwitch,
        getCurrentGameIndex: () => currentGameIndex,
        getGameList: () => gameList
    };
})();
