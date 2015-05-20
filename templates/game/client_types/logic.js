var path = require('path');
var channel = module.parent.exports.channel;
var ngc = require('nodegame-client');
var stepRules = ngc.stepRules;
var GameStage = ngc.GameStage;
var J = ngc.JSUS;

var counter = 0;
var PLAYING_STAGE = 1;

// Round 1 of 4 is a test round.

var DUMP_DIR = path.resolve(__dirname, '..', '/data');

// Here we export the logic function. Receives three parameters:
// - node: the NodeGameClient object.
// - channel: the ServerChannel object in which this logic will be running.
// - gameRoom: the GameRoom object in which this logic will be running.
module.exports = function(node, channel, gameRoom, treatmentName, settings) {

    var REPEAT, MIN_PLAYERS;

    // Client game to send to reconnecting players.
    var client = gameRoom.clientTypes.player(gameRoom,
                                             treatmentName,
                                             settings);
    
    var autoplay = gameRoom.clientTypes.autoplay(gameRoom, 
                                                 treatmentName,
                                                 settings);

    // Reads in descil-mturk configuration.
    var dk = require('descil-mturk')();

    // Requiring additiinal functions.
    var cbs = channel.require(__dirname + '/includes/logic.callbacks.js', {
        ngc: ngc,
        client: client,
        autoplay: autoplay,
        dk: dk,
        settings: settings,
        gameRoom: gameRoom,
        node: node
    }, true);

    // Import the stager.
    var gameSequence = require(__dirname + '/../game.stages.js')(settings);
    var stager = ngc.getStager(gameSequence);

    // DBS functions. Open Connections.
    // Objects are cached for further use by require.
    channel.require(__dirname + '/includes/game.db.js', { node : node });
    // Objects were created and cached in previous call in game.room.
    var dbs = require(__dirname + '/includes/game.db.js');

    // Settings variables.

    REPEAT = settings.REPEAT;
    MIN_PLAYERS = settings.N_PLAYERS;

    // If PostPayoffs has been already called.
    var checkoutFlag;

    //The stages / steps of the logic are defined here
    // but could be loaded from the database
    stager.setOnInit(function() {
        console.log('********************** Burden-Sharing-Control - SessionID: ' +
                    gameRoom.name);

        console.log('init');

        ++counter;

        var disconnectedState;

        // Register player disconnection, and wait for him...
        node.on.pdisconnect(function(p) {
            dk.updateCode(p.id, {
                disconnected: true,
                // stage: p.stage
                stage: node.player.stage

            });

            console.log('Disconnection in Stage: ' + node.player.stage);
        });

        var disconnected;
        disconnected = {};

        // Contains the bonuses that players assign to other players
        // in the questionnaire.
        node.game.otherBonus = [,,,];

        node.game.playerIDs = [];

        // LISTENERS
        ////////////

        // Adds treatment name to incoming SET messages.
        // Must be registered before other listeners.
        node.on('in.set.DATA', function(msg) {
            msg.data.treatment = treatmentName;
            msg.data.costGE = settings.COSTGE;
            msg.data.Session_ID = gameRoom.name;
        });


        // Stores the SELF BONUS to DB, and keeps a copy of the BONUS TO OTHER
        // in node.game.otherBonus. Sends a message to client.
        function addQuestionnaireBonus(msg) {
            dbs.mdbWriteProfit.checkProfit(msg.data.player, function(rows, items) {
                // Adds to the profit a bonus depending on the
                // choice made in the SVO questionnaire block.
                var choicesMade = msg.data.choices;

                // TODO: This is a direct copy-paste from the context file for the html
                // page used in the experiment. This should not be hard-coded.
                var SVOChoices =  {
                    1 :  {
                        topRow :  [85, 85, 85, 85, 85, 85, 85, 85, 85],
                        bottomRow :  [85, 76, 68, 59, 50, 41, 33, 24, 15]
                    },
                    2 :  {
                        topRow :  [85, 87, 89, 91, 93, 94, 96, 98, 100],
                        bottomRow :  [15, 19, 24, 28, 33, 37, 41, 46, 50]
                    },
                    3 :  {
                        topRow :  [50, 54, 59, 63, 68, 72, 76, 81, 85],
                        bottomRow :  [100, 98, 96, 94, 93, 91, 89, 87, 85]
                    },
                    4 :  {
                        topRow :  [50, 54, 59, 63, 68, 72, 76, 81, 85],
                        bottomRow :  [100, 89, 79, 68, 58, 47, 36, 26, 15]
                    },
                    5 :  {
                        topRow :  [100, 94, 88, 81, 75, 69, 63, 56, 50],
                        bottomRow :  [50, 56, 63, 69, 75, 81, 88, 94, 100]
                    },
                    6 :  {
                        topRow :  [100, 98, 96, 94, 93, 91, 89, 87, 85],
                        bottomRow :  [50, 54, 59, 63, 68, 72, 76, 81, 85]
                    }
                };

                var profit = items[0];

                // Selecting one of the own choices at random.
                var selectedRound = J.randomInt(0,6);

                // Exchange rate: 4 Points = 1 ECU.
                var bonusFromSelf = SVOChoices[selectedRound].topRow[
                    choicesMade[selectedRound]
                ]/4;

                var bonusToOther = SVOChoices[selectedRound].bottomRow[
                    choicesMade[selectedRound]
                ]/4;

                node.game.otherBonus[
                    node.game.pl.id.resolve[msg.data.player]
                ] = bonusToOther;

                var oldUCE = profit.Amount_UCE === "NA" ? 0 : profit.Amount_UCE;

                var newAmountUCE = oldUCE + bonusFromSelf;
                var newAmountUSD = cbs.round((newAmountUCE/50),2);

                dbs.mdbWriteProfit.update({
                    playerID: {
                        "Player_ID": msg.data.player
                    },
                    add: {
                        SelfBonus_UCE: bonusFromSelf,
                    },
                });

                node.say('ADDED_QUESTIONNAIRE_BONUS', msg.data.player, {
                    oldAmountUCE: oldUCE || 0,
                    newAmountUCE: newAmountUCE || 0,
                    newAmountUSD: newAmountUSD || 0
                });
            });
        }

        // Player reconnecting.
        // Reconnections must be handled by the game developer.
        node.on.preconnect(cbs.playerReconnects);

        node.on.data('add_questionnaire_bonus', function(msg) {
            var code = dk.codes.id.get(msg.from);
            if (checkoutFlag || code.checkout) {
                console.log('Already checked-out, **not** adding quest bonus.');
                return;
            }
            console.log('Adding questionnaire bonus.');
            addQuestionnaireBonus(msg);
        });

        node.on.data('bsc_data', function(msg) {
            // console.log('Writing Result Data!!!');
            dbs.mdbWrite.store(msg.data);
        });

        node.on.data('bsc_quest', function(msg) {
            var code = dk.codes.id.get(msg.from);
            if (checkoutFlag || code.checkout) {
                console.log('Already checked-out, **not** adding quest data.');
                return;
            }
            // console.log('Writing Questionnaire Data!!!');
            dbs.mdbWrite_quest.store(msg.data);            
        });

        node.on.data('check_Data', function(msg) {
            dbs.mdbWrite.checkData(msg.data, function(rows, items) {
                node.say('CheckData', msg.data.Player_ID, items);
            });
        });

        // Delete data from the database.
        node.on.data('delete_data', function(msg) {
            dbs.mdbWrite.deleting(msg.from, msg.data.Current_Round);
            //dbs.mdbDelet.deleting(msg.data.Player_ID, msg.data.Current_Round);
        });

        // Check whether profit data has been saved already.
        // If not, save it, otherwise ignore it
        node.on.data('get_Profit', function(msg) {
            dbs.mdbWriteProfit.checkProfit(msg.data, function(rows, items) {
                var profit_data;

                // Client has already a payoff assigned.
                if (typeof items[0] !== 'undefined') {
                    profit_data = {
                        Payout_Round: items[0].Payout_Round,
                        Profit: items[0].Amount_UCE
                    };
                    // Sending to client.
                    node.say('PROFIT', msg.data, profit_data);
                }
                // Payoff must be computed.
                else {
                    dbs.mdbWrite.getCollectionObj(msg.data, function(
                        rows, items) {

                        var profit, nbrRounds, write_profit, profit_data;
                        var payoutRound, profitRound;

                        profit = items;
                        console.log(profit);

                        // Base values. More info will be added.
                        write_profit = {
                            treatment: treatmentName,
                            costGE: settings.COSTGE,
                            Player_ID: msg.data,
                            Session_ID: gameRoom.name
                        };

                        // Determine how many rounds the player played.
                        if (profit.length > 1 && profit.length <= 4) {
                            nbrRounds = profit.length - 1;
                        }
                        else if (profit.length > 4) {
                            nbrRounds = 4 - 1;
                        }
                        else {
                            nbrRounds = 0;
                        }
                        console.log("Number Rounds: " + nbrRounds);

                        // Choose a random round to extract payoff.
                        if (nbrRounds >= 1) {
                            // Possible payout rounds: 2,3,4.
                            payoutRound = J.randomInt(1, (nbrRounds+1));
                            profitRound = profit[payoutRound-1].Profit;

                            if ('undefined' === typeof profitRound) {
                                console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
                            }

                            J.mixin(write_profit, {
                                Payout_Round: payoutRound,
                                Amount_UCE: profitRound,
                                Amount_USD: cbs.round((profitRound / 50), 2),
                                Nbr_Completed_Rounds: nbrRounds,
                            });

                            profit_data = {
                                Payout_Round: payoutRound,
                                Profit: profitRound
                            };
                        }
                        else {

                            J.mixin(write_profit, {
                                Payout_Round: "NA",
                                Amount_UCE: "NA",
                                Amount_USD: "NA",
                                Nbr_Completed_Rounds: 0
                            });

                            profit_data = {
                                Payout_Round: "none",
                                Profit: "show up fee"
                            };
                        }

                        console.log('Writing Profit Data!!!');
                        console.log(write_profit);

                        dbs.mdbWriteProfit.store(write_profit);

                        // Sending to client.
                        node.say('PROFIT', msg.data, profit_data);
                    });
                }

            });
        });

        node.on.data("econGrowth", function(msg) {
            dbs.mdbWrite_idData.update(msg.data);
        });

        node.on.data("initEndow", function(msg) {
            dbs.mdbWrite_idData.updateEndow(msg.data);
        });

        node.on.data('get_InitEndow', function(msg) {
            dbs.mdbWrite_idData.getInitEndow(msg.data.otherPlayerId, function(rows, items) {
                var data;
                data = -1;
                if (!J.isEmpty(items[0])) {
                    data = {
                        init_Endow: items[0].Initial_Endowment,
                        cl_Risk: items[0].Climate_Risk
                    };
                }
                node.say('Endow', msg.from, data);
            });
        });

        setTimeout(function() {

            // Write players data.
            (function writePlayerData() {
                var i, len, idData, db;
                db = node.game.pl.db;
                i = -1, len = db.length;
                for ( ; ++i < len ; ) {
                    idData = {
                        Player_ID: db[i].id,
                        userAgent: db[i].userAgent,
                        Session_ID: gameRoom.name,
                        treatment: treatmentName,
                        costGE: settings.COSTGE
                    };
                    dbs.mdbWrite_idData.store(idData);
                }
            })();

        }, 2000);
    });

    function notEnoughPlayers() {
        var msg, secs;
        console.log('Warning: not enough players!!');
        node.timer.setTimestamp('burden_paused');

        secs = Math.floor(settings.timer.notEnoughPlayers / 1000);
        msg = 'One player disconnected. We are now waiting to see if ' +
            'he or she reconnects. If there is no reconnection ' +
            'within ' + secs + ' seconds the game will be terminated and ' +
            'you will be forwarded to the questionnaire.'

        // Pause all other players. (TODO: Should be ROOM_PLAYERS?)
        node.remoteCommand('pause', 'ROOM', msg);

        this.countdown = setTimeout(function() {
            console.log('Countdown fired. Going to Step: questionnaire.');
            node.remoteCommand('resume', 'ROOM');
            // if syncStepping = false
            node.remoteCommand('goto_step', 'ROOM', '3.1');
            node.game.gotoStep(new GameStage('3.1'));
        }, settings.timer.notEnoughPlayers);
    }

    // Adds an 'other'-bonus to all players, and upload payoff.
    function adjustPayoffAndCheckout() {
        var i, profit, idList;

        console.log(gameRoom.name, ': Checking out!');

        checkoutFlag = true;

        idList = J.shuffle(node.game.playerIDs);

        // Gets profit for all players.
        dbs.mdbWriteProfit.checkProfit({ $in : idList}, function(rows, items) {
            var j;
            var item;
            var bonus;
            var bonusSVO;
            var code;
            var otherBonus = node.game.otherBonus || [,,,];
            var otherPlayer;
            var postPayoffs = [];
            var bonusFromOther;
            var bonusFromSelf;
            var writeProfitUpdate;

            for (i = 0; i < idList.length; ++i) {
                code = dk.codes.id.get(idList[i]);

                // Player disconnected before finishing the questionnaire.
                if (!code.checkout) {
                    writeProfitUpdate = {
                        OtherBonus_UCE: "NA",
                        SelfBonus_UCE: "NA",
                        randomBonus: 0
                    };
                    dbs.mdbWriteProfit.update({
                        playerID: {
                            "Player_ID": idList[i]
                        },
                        add: writeProfitUpdate
                    });
                    continue;
                }

                // Find the right item, without using a loop.
                if (items[0].Player_ID === idList[i]) {
                    item = items[0];
                }
                else if (items[1].Player_ID === idList[i]) {
                    item = items[1];
                }
                else if (items[2].Player_ID === idList[i]) {
                    item = items[2];
                }
                else {
                    item = items[3];
                }

                // Bonus from the game.
                bonus = item.Amount_USD;

                // In case something was not
                // filled in correctly in the game.
                if ('number' !== typeof bonus) bonus = 0;

                // Self bonus from SVO.
                bonusFromSelf = item.SelfBonus_UCE;

                // In case the SVO was not filled in.
                if ('number' !== typeof bonusFromSelf) {
                    profit = bonus;
                }
                // SVO filled in.
                else {
                    // Given that the players are shuffled, there is a chance
                    // that a player gets back his own bonus to other.
                    otherPlayer = (i + 1) % idList.length;
                    bonusFromOther = otherBonus[otherPlayer];

                    writeProfitUpdate = { randomBonus: 0 };

                    if ('undefined' === typeof bonusFromOther) {
                        // Random value 0-100 if other person did not give
                        // a bonus to other. 0.75 discounts the fact that
                        // is unlikely that bonus to other is very high.
                        bonusFromOther = J.randomInt(-1, 100) * 0.75;
                        writeProfitUpdate.randomBonus = 1;
                    }

                    writeProfitUpdate.OtherBonus_UCE = bonusFromOther;

                    bonusSVO = bonusFromSelf + bonusFromOther;

                    profit = cbs.round((bonus + (bonusSVO / 50)), 2);

                    dbs.mdbWriteProfit.update({
                        playerID: {
                            "Player_ID": idList[i]
                        },
                        add: writeProfitUpdate
                    });
                }

                console.log(idList[i], ' bonus: ', profit);

                postPayoffs.push({
                    "AccessCode": code.AccessCode,
                    "Bonus": profit,
                    "BonusReason": "Full Bonus"
                });
            }

            console.log(postPayoffs);

            // Post payoffs.
            dk.postPayoffs(postPayoffs, function(err, response, body) {
                if (err) {
                    console.log("adjustPayoffAndCheckout: " +
                                "dk.postPayoff: " + err);
                };
            });
        });
    }

    // Set default step rule.
    stager.setDefaultStepRule(stepRules.OTHERS_SYNC_STEP);

    stager.extendStep('instructions', {
        cb: function() {
            console.log('********************** Instructions - SessionID: ' +
                            gameRoom.name);

            var players, groups, proposer, respondent;
            node.game.groups = [[],[]];

            // Players initially connected.
            node.game.playerIDs = node.game.pl.id.getAllKeys();
            node.game.playerID = J.shuffle(node.game.playerIDs);

            node.game.groups[0][0] = node.game.playerID[0];
            node.game.groups[0][1] = node.game.playerID[1];
            node.game.groups[1][0] = node.game.playerID[2];
            node.game.groups[1][1] = node.game.playerID[3];

            console.log("Show Groups 1: ");
            console.log(node.game.groups[0][0]);
            console.log(node.game.groups[0][1]);
            console.log("Show Groups 2: ");
            console.log(node.game.groups[1][0]);
            console.log(node.game.groups[1][1]);
        },
        minPlayers: [ MIN_PLAYERS, notEnoughPlayers ]
    });

    stager.addStep({
        id: 'syncGroups',
        cb: function() {
            console.log('********************** Syncing all Players - ' +
                        'SessionID: ' + gameRoom.name);

            var group, proposer, respondent;
            var props, resps;
            var round, i;

            round = node.player.stage.round;

            // Round 1 is a testround for the player
            // (The same matching of players and groups in
            // round 1 will be repeated in round 4)
            // Round 1 will be evaluated

            if (round === 1 || round === 4) {
                node.game.groups[0][0] = node.game.playerID[0];
                node.game.groups[0][1] = node.game.playerID[1];
                node.game.groups[1][0] = node.game.playerID[2];
                node.game.groups[1][1] = node.game.playerID[3];

            }

            else if (round === 2) {
                node.game.groups[0][0] = node.game.playerID[0];
                node.game.groups[0][1] = node.game.playerID[2];
                node.game.groups[1][0] = node.game.playerID[1];
                node.game.groups[1][1] = node.game.playerID[3];

            }

            // Round 3.
            else {

                if (round !== 3) console.log('Weird round: ', round);

                node.game.groups[0][0] = node.game.playerID[3];
                node.game.groups[0][1] = node.game.playerID[0];
                node.game.groups[1][0] = node.game.playerID[1];
                node.game.groups[1][1] = node.game.playerID[2];

            }

            for (i = 0; i < node.game.groups.length; i++) {
                group = node.game.groups[i];
                props = {
                    groupP: i+1,
                    proposer: node.game.groups[i][0]
                };
                resps = {
                    groupR: i+1,
                    respondent: node.game.groups[i][1]
                };
                proposer = node.game.groups[i][0];
                respondent = node.game.groups[i][1];

                node.say('RESPONDENT', respondent, props);
                node.say('PROPOSER', proposer, resps);
            }
        },
    });


    stager.addStep({
        id: "initialSituation",
        cb: function() {
            console.log('********************** Initial Situation - SessionID: ' +
                gameRoom.name
            );
        }
    });

    stager.addStep({
        id: "decision",
        cb: function() {
            var round = node.player.stage.round;
            console.log('********************** Burden-Sharing-Control stage ' +
                round + ' - SessionID: ' + gameRoom.name
            );
        }
    });

    stager.extendStage('burdenSharingControl', {
        steps: ["syncGroups", "initialSituation", "decision"],
        minPlayers: [ MIN_PLAYERS, notEnoughPlayers ],
        stepRule: node.stepRules.SYNC_STAGE
    });

    var questTimer;
    stager.extendStep('questionnaire', {
        cb: function() {

            // Upon reconnection the stage is repeated, not sure why.
            if (!questTimer) {
                questTimer = node.timer.createTimer({
                    milliseconds: settings.timer.questionnaire +
                        settings.timer.questProfit + 10000,
                    timeup: adjustPayoffAndCheckout
                });

                questTimer.start();
            }

            node.on.data('QUEST_DONE', function(msg) {
                var i, len, id, code;

                // Checkout the player code.
                code = dk.codes.id.get(msg.from);
                console.log('Checkout code of player: ' + msg.from);
                code.checkout = true;

                node.say('win', msg.from, code.ExitCode);

                if (checkoutFlag) {
                    console.log('Already checked-out, returning.');
                    return;
                }

                // Check if all players have finished the quest.
                // If one or more players are missing, we wait until
                // the timer expires.
                i = -1, len = node.game.playerIDs.length;
                for ( ; ++i < len ; ) {
                    id = node.game.playerIDs[i];
                    if (id === msg.from) continue;
                    if (!dk.codes.id.get(id).checkout) return;
                }
                questTimer.stop();
                adjustPayoffAndCheckout();
            });
            console.log('********************** Questionaire - SessionID: ' +
                            gameRoom.name);
        }
    });

    return {
        nodename: 'lgc' + counter,
        game_metadata: {
            name: 'burdenSharingControl',
            version: '0.2.0'
        },
        game_settings: {
            publishLevel: 0,
            syncStepping: false
        },
        plot: stager.getState(),
        verbosity: 0
    };
};
