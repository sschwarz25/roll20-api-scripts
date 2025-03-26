var API_Meta = API_Meta || {};
API_Meta.Gambler = { offset: Number.MAX_SAFE_INTEGER, lineCount: -1 };
{ try { throw new Error(''); } catch (e) { API_Meta.Gambler.offset = (parseInt(e.stack.split(/\n/)[1].replace(/^.*:(\d+):.*$/, '$1'), 10) - 6); } }

// USES:
// HtmlBuilder - Add CSS to Menus
// ChatSetAttr - Set Currency Values

const Gambler = (() => {
    /* -------------------------------------------------------------------------- */
    /*                      Check dependencies are installed                      */
    /* -------------------------------------------------------------------------- */
    if (!state.ChatSetAttr && !state['ChatSetAttr']) {
        log("Gambler requires the ChatSetAttr script. Please install and try again.");
        return;
    }

    if (!state.hasOwnProperty("htmlBuilder") && !HtmlBuilder) {
        log("Gambler requires the HtmlBuilder script. Please install and try again.");
        return;
    }

    /* -------------------------------------------------------------------------- */
    /*                                    Vars                                    */
    /* -------------------------------------------------------------------------- */
    const NAME = "Gambler";
    const VERSION = '1.0.0';
    const AUTHOR = 'Scott E. Schwarz';

    let errorMessage = "";
    let listingVars = false;
    let isTesting = true; // If this is published as true, this script will reset all games on load

    const GAMES = [{
        // gameId: "1d100-Under_a8j23jkl1", // Game.name + "_" + randomString(10)
        gameType: "Dice",
        name: "1d100_Under", // Spaces break everything!
        description: "Dealer rolls 1d100 as target number. Players and dealer try to roll Nd20s to get closest under the target number. Closest wins.",
        minPlayers: 1,
        maxPlayers: 10,
        minBet: 1,
        maxBet: -1, // -1 = no max
        playerDiceOptions: [
            "1d20",
        ],
        dealerDiceOptions: [
            "1d20",
        ],
        gameDiceOptions: [
            "1d100",
        ],
        dealerPlays: true,
        dealerWinsOnTie: false,
        gameCycleFunctions: [
            (game) => {
                game.gameDice = [];
                game.gameDice.push({
                    diceId: "1d100",
                    value: randomInteger(100),
                });
            },
        ],
        determineBust: (player, game) => {
            return player.diceTotal > game.gameDice[0].value;
        },
        determineInstantWinner: (player, game) => {
            return player.diceTotal === game.gameDice[0].value;
        },
        determineWinnersFunction: (game) => {
            let winner = undefined;
            let winners = [];
            let winnerDistance = undefined;
            game.players.forEach((player) => {
                let distance = game.gameDice[0].value - player.diceTotal;
                if (winner === undefined || distance < winnerDistance) {
                    winner = player;
                    winnerDistance = distance;
                }
            });

            game.players.forEach((player) => {
                if (player.diceTotal === winner.diceTotal) {
                    winners.push(player);
                }
            });

            return winners;
        },
        determineIfGameIsOver: (game) => {
            return game.players.every((player) => {
                return player.status === "bust" || player.status === "fold" || player.status === "hold";
            }) && (game.dealer.status === "bust" || game.dealer.status === "hold" || game.dealer.status === "fold");
        }
    }, {
        // gameId: "1d100-Under_a8j23jkl1", // Game.name + "_" + randomString(10)
        gameType: "Dice",
        name: "1d100 Over",
        description: "Dealer rolls 1d100 as target number. Players and dealer try to roll Nd20s to get closest over the target number. Closest wins.",
        minPlayers: 1,
        maxPlayers: 10,
        minBet: 1,
        maxBet: -1, // -1 = no max
        playerDiceOptions: [
            "1d20",
        ],
        dealerDiceOptions: [
            "1d20",
        ],
        gameDiceOptions: [
            "1d100",
        ],
        dealerPlays: true,
        dealerWinsOnTie: false,
        gameCycleFunctions: [
            (game) => {
                game.gameDice = [];
                game.gameDice.push({
                    diceId: "1d100",
                    value: randomInteger(100),
                });
            },
        ],
        determineBust: (player, game) => {
            return player.diceTotal > game.gameDice[0].value;
        },
        determineInstantWinner: (player, game) => {
            return player.diceTotal === game.gameDice[0].value;
        },
        determineWinnersFunction: (game) => {
            let winner = undefined;
            let winners = [];
            let winnerDistance = undefined;
            game.players.forEach((player) => {
                let distance = game.gameDice[0].value - player.diceTotal;
                if (winner === undefined || distance < winnerDistance) {
                    winner = player;
                    winnerDistance = distance;
                }
            });

            game.players.forEach((player) => {
                if (player.diceTotal === winner.diceTotal) {
                    winners.push(player);
                }
            });

            return winners;
        },
        determineIfGameIsOver: (game) => {
            return game.players.every((player) => {
                return player.status === "bust" || player.status === "fold" || player.status === "hold";
            }) && (game.dealer.status === "bust" || game.dealer.status === "hold" || game.dealer.status === "fold");
        }
    }];

    const HANDOUT_CSS = {
        "heading": {
            "font-size": "1.5em",
            "color": "#00f",
            "text-align": "center",
        },
        "info": {
            "font-size": "1em",
            "color": "#000",
            "margin-bottom": "10px",
        }
    };

    const MENU_CSS = {
        'optionsTable': {
            'width': '100%'
        },
        'menu': {
            'background': '#33658A',
            'border': 'solid 1px #000',
            'border-radius': '5px',
            'font-weight': 'bold',
            'margin-bottom': '1em',
            'overflow': 'hidden',
            'color': '#fff',
            'justify-content': 'space-evenly',
        },
        'menuBody': {
            'padding': '5px',
            'text-align': 'center'
        },
        'menuLabel': {
            'color': '#F6AE2D',
            'margin-top': '5px',
        },
        'menuHeader': {
            'background': '#000',
            'color': '#fff',
            'text-align': 'center',
        },
        'usageHeader': {
            'background': '#000',
            'color': '#fff',
            'text-align': 'center',
        },
        'usage': {
            'background': '#000',
            'color': '#fff',
            'text-align': 'center',
        },
        'subLabel': {
            'color': '#F26419',
            'font-size': '0.8em',
        },
        'patreon': {
            'color': '#F6AE2D',
            'font-size': '1.1em',
            'text-align': 'center',
            'margin-top': '10px',
            'margin-bottom': '10px'
        }
    };

    /* -------------------------------------------------------------------------- */
    /*                               Event Handlers                               */
    /* -------------------------------------------------------------------------- */
    on('ready', function () {
        setup();

        log(`--${NAME}--> (${VERSION}) by ${AUTHOR} --> Ready! --> Meta Offset : ${API_Meta.Gambler.offset}`);

        createMainMenu();
    });

    on("chat:message", function (msg) {
        try {
            if (msg.type === "api" && msg.content.toLowerCase().startsWith("!gambler") || msg.content.toLowerCase().startsWith("!gamba")) {

                if (isTesting) {
                    log(`--${NAME}--> INBOUND MESSAGE :: ${JSON.stringify(msg)}`);
                }

                /* -------------------------------- Backouts -------------------------------- */
                if (!playerIsGM(msg.playerid)) {
                    sendChat(`${NAME}`, "/w " + msg.who + " You do not have permission to use this command.");
                    return;
                }

                /* -------------------------------- Commands -------------------------------- */
                const args = msg.content.split(/\s+/);

                if (args.length == 1) {
                    createMainMenu();
                    return;
                }

                const command = args[1];

                switch (command.toLowerCase()) {
                    case "setup":
                        setup();
                        break;
                    case "rebuild":
                        state[NAME].rebuildHandouts = true;
                        state[NAME].rebuildMacros = true;
                        break;
                    case "create-game":
                        const selectedGameType = args[2];

                        let bet = Number.parseInt(args[3]);

                        let givenName = "";

                        if (isNaN(bet)) {
                            bet = 0;

                            if (args.length > 3) {
                                givenName = args.slice(3).join(" ");
                            }
                        } else {
                            if (args.length > 4) {
                                givenName = args.slice(4).join(" ");
                            }
                        }

                        if (isTesting) {
                            log(`--${NAME}--> create-game --> selectedGameType: ${selectedGameType}`);
                            log(`--${NAME}--> create-game --> givenName: ${givenName}`);
                            log(`--${NAME}--> create-game --> bet: ${bet}`);
                        }

                        const gameRules = GAMES.find((game) => {
                            return game.name.toLowerCase() === selectedGameType.toLowerCase();
                        });

                        if (!gameRules) {
                            sendChat(`${NAME}`, "/w " + msg.who + " Game not found.");
                            return;
                        }

                        if (!msg.selected || msg.selected.length == 0) {
                            sendChat(`${NAME}`, "/w GM No Dealer token selected.");
                            return;
                        }

                        createGame(gameRules, bet, givenName, msg.selected[0]._id);
                        break;
                    case "join-game":
                        // args[2] = game id
                        addPlayerToGame(args[2], msg.selected[0]._id, msg.playerid, msg.who);
                        break;
                    case "set-bet":
                        break;
                    case "game-menu":
                        // args[2] = game id
                        createGameMenu(args[2]);
                        break;
                    case "announce-game":
                        // args[2] = game id
                        createAnnouncementMenuFromGameId(args[2]);
                        break;
                    case "set-currency":
                        setGameCurrency(args[2], args.slice(3).join(" "));
                        break;
                    case "cancel-game":
                        if (!playerIsGM(msg.playerid)) {
                            if (isTesting) {
                                log(`--${NAME}--> PLAYER IS NOT GM :: Player ID: ${state[NAME].storedVariables.playerId}`);
                            }
                            return;
                        } else if (isTesting) {
                            log(`--${NAME}--> PLAYER IS GM :: Player ID: ${state[NAME].storedVariables.playerId}`);
                        }

                        cancelGame(args[2]);
                        break;
                    case "remove-player":
                        const gameId = args[2];
                        const playerId = args[3];

                        // If not GM or Owner, return
                        if (!playerIsGM(msg.playerid) || msg.playerid !== playerId) {
                            if (isTesting) {
                                log(`--${NAME}--> PLAYER IS NOT GM :: Player ID: ${state[NAME].storedVariables.playerId}`);
                            }
                            return;
                        } else if (isTesting) {
                            log(`--${NAME}--> PLAYER IS GM :: Player ID: ${state[NAME].storedVariables.playerId}`);
                        }

                        removePlayer(gameId, playerId);

                        break;
                    case "start-game":
                        // args[2] = game id
                        if (!playerIsGM(msg.playerid)) {
                            if (isTesting) {
                                log(`--${NAME}--> PLAYER IS NOT GM :: Player ID: ${state[NAME].storedVariables.playerId}`);
                            }
                            return;
                        } else if (isTesting) {
                            log(`--${NAME}--> PLAYER IS GM :: Player ID: ${state[NAME].storedVariables.playerId}`);
                        }

                        startGame(args[2]);
                        break;
                }
            }
        } catch (err) {
            log(`--${NAME}--> ERROR :: ${err}<br/>${errorMessage}`);
            errorMessage = "";
        }
    });

    /* -------------------------------------------------------------------------- */
    /*                                    Menus                                   */
    /* -------------------------------------------------------------------------- */
    function createLobbyMenu() {

    };

    function createGameMenu(gameId) {
        let menu = new HtmlBuilder('.menu');
        menu.append('.menuHeader', 'Gambler Controls');

        let content = menu.append('div');

        content.append('.menuLabel', 'Game Menu');



        sendChat(NAME, menu.toString({
            'optionsTable': {
                'width': '100%'
            },
            'menu': {
                'background': '#33658A',
                'border': 'solid 1px #000',
                'border-radius': '5px',
                'font-weight': 'bold',
                'margin-bottom': '1em',
                'overflow': 'hidden',
                'color': '#fff',
                'justify-content': 'space-evenly',
            },
            'menuBody': {
                'padding': '5px',
                'text-align': 'center'
            },
            'menuLabel': {
                'color': '#F6AE2D',
                'margin-top': '5px',
            },
            'menuHeader': {
                'background': '#000',
                'color': '#fff',
                'text-align': 'center',
            },
            'usageHeader': {
                'background': '#000',
                'color': '#fff',
                'text-align': 'center',
            },
            'usage': {
                'background': '#000',
                'color': '#fff',
                'text-align': 'center',
            },
            'subLabel': {
                'color': '#F26419',
                'font-size': '0.8em',
            },
            'patreon': {
                'color': '#F6AE2D',
                'font-size': '1.1em',
                'text-align': 'center',
                'margin-top': '10px',
                'margin-bottom': '10px'
            }
        })
            .replace(/\?{\s*(.*?)\s*}/g, '<span class="subLabel">$1</span>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
        );
    };

    function createMainMenu() {
        let menu = new HtmlBuilder('.menu');
        menu.append('.menuHeader', 'Gambler Controls');

        let content = menu.append('div');

        const gameTypes = GAMES.map(game => game.name + ", " + game.name).join('|');

        content.append('.menuLabel', '[Create Game](!gambler create-game ?{Game Type|' + gameTypes + '} ?{Set Starting Bet|0} ?{Game Name})');

        content.append('.menuLabel', '[Set Currency](!gambler set-currency ?{Currency Name in C. Sheet|gp} ?{Currency Name|Gold Pounds})');

        // Add a Header for Active Games, then list them as buttons that, when click, will generate and send that games menu (createGameMenu(gameId))
        content.append('.menuLabel', 'Active Games:');
        content.append('.subLabel', 'Expand chat window until all vertical bars and horizontal dashes are on one line.');
        let table = content.append('table');
        let thead = table.append('thead');
        let headers = thead.append('tr');
        headers.append('th', 'Name');
        headers.append('th', 'Status');
        headers.append('th', 'Players');
        headers.append('th', 'Action');

        let row = table.append('tr');
        row.append('td', "|--------------------|");
        row.append('td', "--------------------|");
        row.append('td', "--------------------|");
        row.append('td', "--------------------|");

        state[NAME].storedVariables.activeGames.forEach(game => {
            let name = game.givenName ?? game.name;
            // If name is > 15 characters, truncate it and add ellipses
            if (name.length > 15) {
                name = name.substring(0, 15) + '...';
            }

            let row = table.append('tr');
            row.append('td .td', '[' + name + '](!gambler announce-game ' + game.id + ')');
            row.append('td', game.status.toUpperCase());
            row.append('td', game.players.length + '/' + (GAMES.find(g => g.name === game.name)?.maxPlayers ?? "Any"));
            row.append('td', game.status === 'lobby'
                ? ' [\`\`Start\`\`](!gambler start-game ' + game.id + ')'
                : ' [\`\`Resume\`\`](!gambler game-menu ' + game.id + ')'
                + ' [\`\`End\`\`](!gambler end-game ' + game.id + ')');
        });

        sendChat(NAME, '/w GM ' + menu.toString(MENU_CSS));
    };

    function createAnnouncementMenuFromGameId(gameId) {  // Announce game to players
        const activeGame = state[NAME].storedVariables.activeGames.find(game => game.id === gameId);

        createAnnouncementMenu(activeGame);
    };

    function createAnnouncementMenu(game, isCancelled = false) {
        if (!game) {
            sendChat(NAME, '/w gm Game not found.');
            return;
        }

        let menu = new HtmlBuilder('.menu');
        menu.append('.menuHeader', (isCancelled ? 'Nevermind on: ' : 'Join me for: ') + game.givenName ?? game.name);

        let content = menu.append('div');

        content.append('.menuLabel', 'Game Type: ' + game.name);
        content.append('.menuLabel', 'Status: ' + game.status.toUpperCase());
        content.append('.menuLabel', 'Players: ' + game.players.length + '/' + (GAMES.find(g => g.name === game.name)?.maxPlayers ?? "Any"));
        content.append('.menuLabel', 'Bet: ' + game.bet + ' ' + state[NAME].storedVariables.currencyName);

        if (isCancelled) {
            content.append('.menuLabel', 'Game Cancelled. All bets returned.');
        } else {
            const dealerToken = getObj('graphic', game.dealer.tokenId);
            content.append('.menuLabel', 'Dealer: ');
            content.append('p', dealerToken ? dealerToken.get('name') : 'GM');

            content.append('.menuLabel', 'Players:');
            game.players.forEach(player => {
                const playerToken = getObj('graphic', player.tokenId);
                content.append('p', '[' + (playerToken ? playerToken.get('name') : player.name) + '](!gambler remove-player ' + game.id + ' ' + player.id + ')');
            });

            let table = content.append('table');
            let row = table.append('tr');
            row.append('td', '[Join Game](!gambler join-game ' + game.id + ')');
            // Add a vertical bar
            row.append('td', "|");
            row.append('td', '[\`\`Start\`\`](!gambler start-game ' + game.id + ')');
            row.append('td', '[\`\`Cancel\`\`](!gambler cancel-game ' + game.id + ')');
        }

        sendChat(NAME, menu.toString(MENU_CSS));
    };

    /* -------------------------------------------------------------------------- */
    /*                              State Transitions                             */
    /* -------------------------------------------------------------------------- */
    function createGame(gameRules, bet, givenName, dealerTokenId) {
        const gameId = gameRules.name + "_" + randomString(10);
        const newActiveGame = {
            id: gameId,
            name: gameRules.name,
            givenName: givenName,
            status: "lobby",
            round: 0,
            pot: 0,
            bet: bet,
            players: [],
            dealer: {
                tokenId: dealerTokenId,
                status: "lobby",
                diceTotal: 0,
                dice: []
            },
            gameDice: gameRules.gameDiceOptions.map(dice => {
                return {
                    diceId: dice,
                    value: 0
                };
            })
        };

        state[NAME].storedVariables.activeGames.push(newActiveGame);

        if (isTesting) {
            log(`--${NAME}--> GAME CREATED :: Active Games:  ${JSON.stringify(state[NAME].storedVariables.activeGames)}`);
        }

        createAnnouncementMenu(newActiveGame);
    };

    function addPlayerToGame(gameId, tokenId, playerId, playerName) {
        if (isTesting) {
            log(`--${NAME}--> PLAYER JOINING :: Game ID: ${gameId} | Token ID: ${tokenId} | Player ID: ${playerId} | Player Name: ${playerName}`);
        }

        const game = state[NAME].storedVariables.activeGames.find(game => game.id === gameId);

        if (!game) {
            sendChat(NAME, '/w gm Game not found.');
            return;
        }

        const player = game.players.find(player => player.id === playerId);
        if (player) {
            sendChat(NAME, '/w gm Player already joined.');
            return;
        }

        // Get Player Sheet and check for sufficient gold
        const playerSheet = getObj('character', getObj('graphic', tokenId).get('represents'));
        if (!playerSheet) {
            sendChat(NAME, '/w gm Player sheet not found on player selected token.');
            sendChat(NAME, '/w ' + playerName + ' Player sheet not found on token.');
            return;
        }

        const playerGold = getAttrByName(playerSheet.id, state[NAME].storedVariables.currency);
        if (!playerGold || Number.isNaN(playerGold)) {
            sendChat(NAME, `/w gm ${playerName} does not have a ${state[NAME].storedVariables.currency} attribute.`);
            sendChat(NAME, `/w ${playerName} You do not have a ${state[NAME].storedVariables.currency} attribute.`);
            return;
        }
        else if (playerGold < game.bet) {
            sendChat(NAME, `/w gm ${playerName} does not have enough ${state[NAME].storedVariables.currency}.`);
            sendChat(NAME, `/w ${playerName} You do not have enough ${state[NAME].storedVariables.currency} to join this game.`);
            return;
        } else {
            if (!modifyCurrencyByTokenId(tokenId, -game.bet)) {
                sendChat(NAME, `/w gm ${playerName} does not have enough ${state[NAME].storedVariables.currency}.`);
                sendChat(NAME, `/w ${playerName} You do not have enough ${state[NAME].storedVariables.currency} to join this game.`);
                return;
            }
        }

        game.players.push({
            id: playerId,
            name: playerName,
            tokenId: tokenId,
            bet: 0,
            status: "lobby",
            diceTotal: 0,
            dice: []
        });

        sendChat(NAME, '/w ' + playerName + ' You have joined the game: ' + game.givenName ?? game.name);

        createAnnouncementMenuFromGameId(gameId);
    };

    function startGame(gameId) {
        const game = state[NAME].storedVariables.activeGames.find(game => game.id === gameId);
        if (!game) {
            sendChat(NAME, '/w gm Game not found.');
            return;
        }

        const gameRules = GAMES.find(game => game.name === game.name);
        if (!gameRules) {
            sendChat(NAME, '/w gm Game rules not found.');
            return;
        }

        if (game.status !== "lobby") {
            sendChat(NAME, '/w gm Game is already in progress.');
            return;
        }

        game.status = "ongoing";

        if (isTesting) {
            log(`--${NAME}--> GAME STARTING :: Game ID: ${gameId} | Game Name: ${game.name}`);
        }

        if (!!gameRules.gameCycleFunctions && !!gameRules.gameCycleFunctions[game.round]) {
            gameRules.gameCycleFunctions[game.round](game);
        }

        if (isTesting) {
            log(`--${NAME}--> GAME STARTED :: Active Games:  ${JSON.stringify(state[NAME].storedVariables.activeGames)}`);
        }

        game.round = 1;
    };

    function startTurn(game) {

    };

    function endTurn(game) {

    };

    function endGame(game) {

    };

    function cancelGame(gameId) {

        const game = state[NAME].storedVariables.activeGames.find(game => game.id === gameId);

        if (!game) {
            sendChat(NAME, '/w gm Game not found.');
            return;
        }

        if (game.status !== "lobby") {
            sendChat(NAME, '/w gm Game is already in progress.');
            return;
        }

        game.players.forEach(player => {
            modifyCurrencyByTokenId(player.tokenId, game.bet);
        });

        state[NAME].storedVariables.activeGames = state[NAME].storedVariables.activeGames.filter(game => game.id !== gameId);

        if (isTesting) {
            log(`--${NAME}--> GAME CANCELLED :: Active Games:  ${JSON.stringify(state[NAME].storedVariables.activeGames)}`);
        }

        createAnnouncementMenu(game, true);
    };

    function removePlayer(gameId, playerId) {
        const game = state[NAME].storedVariables.activeGames.find(game => game.id === gameId);

        if (!game) {
            sendChat(NAME, '/w gm Game not found.');
            return;
        }

        if (game.status !== "lobby") {
            sendChat(NAME, '/w gm Game is already in progress.');
            return;
        }

        const player = game.players.find(player => player.id === playerId);
        if (!player) {
            sendChat(NAME, '/w gm Player not found.');
            return;
        }

        modifyCurrencyByTokenId(player.tokenId, game.bet);

        game.players = game.players.filter(player => player.id !== playerId);

        if (isTesting) {
            log(`--${NAME}--> PLAYER REMOVED :: Active Games:  ${JSON.stringify(state[NAME].storedVariables.activeGames)}`);
        }

        createAnnouncementMenuFromGameId(gameId);
    };

    /* -------------------------------------------------------------------------- */
    /*                                Game Helpers                                */
    /* -------------------------------------------------------------------------- */
    function setup() {
        if (!state[NAME]
            || isTesting
        ) {
            state[NAME] = {
                module: NAME,
                schemaVersion: VERSION,
                iteration: undefined,
                storedVariables: undefined,
                rebuildHandouts: true,
                rebuildMacros: true,
            };

            log(`--${NAME}--> SETUP :: ${JSON.stringify(state[NAME])}`);
        }

        if (state[NAME].iteration === undefined) {
            state[NAME].iteration = 0;
        } else {
            state[NAME].iteration++;
        }

        if (state[NAME].module != NAME) {
            state[NAME].iteration = 0;
            state[NAME].module = NAME;
        }

        if (!state[NAME].schemaVersion
            || !state[NAME].storedVariables
            || state[NAME].schemaVersion != VERSION
        ) {
            state[NAME].rebuildHandouts = true;
            state[NAME].rebuildMacros = true;
            state[NAME].schemaVersion = VERSION;
            state[NAME].storedVariables = {
                currency: "gp",
                currencyName: "Gold",
                activeGames: isTesting
                    ? [{
                        id: "1d100-Under_a8j23jkl1", // Game.name + "_" + randomString(10)
                        name: "1d100-Under",  // Game type like 'blackjack', 'poker', etc.
                        givenName: "Example in third round ongoing", // DM given name for the game
                        status: "ongoing",  // lobby | ongoing | complete
                        round: 3,  // Current Round (0 for lobby)
                        pot: 300,  // Current Pot (total of all player bets)
                        bet: 150,  // Current Bet (minimum bet for the game)
                        players: [{
                            id: "player1",
                            name: "Player 1",
                            tokenId: "token1",
                            bet: 100,
                            status: "hold", // active | hold | fold | bust | win | lose
                            diceTotal: 35,
                            dice: [{
                                diceId: "1d20",
                                value: 10,
                            }, {
                                diceId: "1d20",
                                value: 6,
                            }, {
                                diceId: "1d20",
                                value: 19,
                            }]
                        }, {
                            id: "player2",
                            name: "Player 2",
                            tokenId: "token2",
                            bet: 200,
                            status: "fold",
                            diceTotal: 31,
                            dice: [{
                                diceId: "1d20",
                                value: 10
                            }, {
                                diceId: "1d20",
                                value: 14
                            }, {
                                diceId: "1d20",
                                value: 7
                            }]
                        }],
                        dealer: {
                            tokenId: "dealerToken1",
                            status: "bust",
                            diceTotal: 41,
                            dice: [{
                                diceId: "1d20",
                                value: 10
                            }, {
                                diceId: "1d20",
                                value: 6
                            }, {
                                diceId: "1d20",
                                value: 19
                            }, {
                                diceId: "1d20",
                                value: 6
                            }]
                        },
                        gameDice: [{
                            diceId: "1d100",
                            value: 40,
                        }]
                    }]
                    : []
            };
        }

        if (state[NAME].rebuildMacros) {
            log(`--${NAME}--> Rebuilding macros`);

            setupMacros();
            state[NAME].rebuildMacros = false;

            log(`--${NAME}--> Macros rebuilt`);
            sendChat(NAME, '/w gm Gambler: Macros rebuilt');
        }

        if (state[NAME].rebuildHandouts) {
            log(`--${NAME}--> Rebuilding handouts`);

            const usageHandout = findObjs({ type: 'handout', name: 'Gambler Usage Guide' });
            const gmPlayers = findObjs({ _type: 'player' }).filter(player => playerIsGM(player.get("_id")));

            if (gmPlayers.length > 0) {
                setupHandouts(gmPlayers[0]);
            }

            if (usageHandout.length > 1) {
                for (let i = 1; i < usageHandout.length; i++) {
                    usageHandout[i].remove();
                }
            }

            state[NAME].rebuildHandouts = false;

            log(`--${NAME}--> Handouts rebuilt`);
            sendChat(NAME, '/w gm Gambler: Handouts rebuilt');
        }
    };

    function setupMacros() {

        let oldMenuMacro = findObjs({ type: 'macro', name: 'Gambler_Menu' });
        if (oldMenuMacro.length > 0) {
            oldMenuMacro[0].remove();
        }

        let menuMacro = findObjs({ type: 'macro', name: 'Gambler_Menu' });

        const gmPlayers = findObjs({ _type: 'player' }).filter(player => playerIsGM(player.get("_id")));

        if (!menuMacro || menuMacro.length < 1) {
            _.each(gmPlayers, function (player) {
                createObj('macro', {
                    name: 'Gambler_Menu',
                    action: '!gambler',
                    playerid: player.get("_id"),

                });
            });
        } else if (menuMacro.length > 1) {
            for (let i = 1; i < menuMacro.length; i++) {
                menuMacro[i].remove();
            }
        }

        // Set Macro to In-Bar for GM
        let menuMacroGM = findObjs({ type: 'macro', name: 'Gambler_Menu', playerid: gmPlayers[0].get("_id") });
        if (menuMacroGM.length > 0) {
            menuMacroGM[0].set('inbar', true);
        }
    };

    function setupHandouts(player) {
        var handout = createObj('handout', {
            name: 'Gambler Usage Guide',
            inplayerjournals: 'all',
            archived: false
        });

        let content = new HtmlBuilder('div');
        content.append('.heading', 'Hi, I\'m Gambler!');
        content.append('.info', [
            'Gambler\'s goal is to bring new ways for your players to interact with your VTT world.',
        ].join('<br>'));

        content.append('.heading', 'Games');
        content.append('.info', [
            'Games Info',
        ].join('<br>'));

        content.append('.heading', 'Playing');
        content.append('.info', [
            'Playing Info',
        ].join('<br>'));

        content.append('.heading', 'Other Stuff');
        content.append('.info', [
            'Other Stuff Info',
        ].join('<br>'));

        handout.set({ notes: content.toString(HANDOUT_CSS) });
    };

    function setGameCurrency(shortHand, name) {
        state[NAME].storedVariables.currency = shortHand;
        state[NAME].storedVariables.currencyName = name;
    };

    function modifyCurrencyByTokenId(tokenId, amount) {
        const playerSheet = getObj('character', getObj('graphic', tokenId).get('represents'));
        if (!playerSheet) {
            sendChat(NAME, '/w gm Player sheet not found on player selected token.');
            return false;
        } else if (isTesting) {
            log(`--${NAME}--> ${playerSheet.get('name') ?? tokenId} has a character sheet.`);
        }

        const playerGold = Number.parseInt(getAttrByName(playerSheet.id, state[NAME].storedVariables.currency));
        if (!playerGold || Number.isNaN(playerGold)) {
            sendChat(NAME, `/w gm ${tokenId} does not have a ${state[NAME].storedVariables.currency} attribute.`);
            return false;
        } else if (isTesting) {
            log(`--${NAME}--> ${playerSheet.get('name') ?? tokenId} has ${playerGold} ${state[NAME].storedVariables.currency}`);
        }

        const total = playerGold + amount;

        if (isTesting) {
            log(`--${NAME}--> ${playerSheet.get('name') ?? tokenId} adding (${amount}) to ${playerGold} ${state[NAME].storedVariables.currency}, resulting in ${total} ${state[NAME].storedVariables.currency}`);
        }

        sendChat(NAME, `!setattr --silent --charid ${playerSheet.id} --${state[NAME].storedVariables.currency}|${total}`);
        return true;
    };

    function randomString(length) {
        var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var result = '';
        for (var i = length; i > 0; --i) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    };
})();

{ try { throw new Error(''); } catch (e) { API_Meta.Gambler.lineCount = (parseInt(e.stack.split(/\n/)[1].replace(/^.*:(\d+):.*$/, '$1'), 10) - API_Meta.Gambler.offset); } }