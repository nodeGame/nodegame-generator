/**
 * # Functions used by the Client of Burden-share Game
 * Copyright(c) 2015 Stefano Balietti
 * MIT Licensed
 *
 * This file contains all the building blocks (functions, and configuration)
 * that will be sent to each connecting player.
 *
 * http://www.nodegame.org
 */
var ngc = require('nodegame-client');
var stepRules = ngc.stepRules;
var constants = ngc.constants;

// Export the game-creating function. It needs the name of the treatment and
// its options.
module.exports = function(gameRoom, treatmentName, settings) {
    var gameSequence, stager;

    // Import the stager.
    gameSequence = require(__dirname + '/../game.stages.js')(settings);
    stager = ngc.getStager(gameSequence);

    var game = {};
    var cbs = require(__dirname + '/includes/phantom/client.callbacks.js');

    stager.setOnInit(cbs.init);

    stager.extendStep('instructions', {
        cb: cbs.instructions,
        steprule: stepRules.SYNC_STAGE,
        syncOnLoaded: false,
        done: cbs.clearFrame
    });

    stager.addStep({
        id: "initialSituation",
        cb: cbs.initialSituation,
        // stepRule: cbs.syncGroup,
        timer: {
            milliseconds: settings.timer.initialSituation,
            update: 1000,
            timeup: function() {
                node.game.timeInitialSituation =
                    node.timer.getTimeSince('initialSituation');
                node.done();
            },
        }
    });

    stager.addStep({
        id: "decision",
        cb: cbs.decision,
        // stepRule: cbs.syncGroup
    });

    stager.addStep({
        id: "syncGroups",
        cb: function() {

            // Getting the player ID of the other player and the group number
            // depending on whether this player is the proposer or the responder
            // in the current round.
            node.on.data("PROPOSER", function(msg) {
                node.game.role = "PROPOSER";
                node.game.otherID = msg.data.respondent;
                node.game.nbrGroup = msg.data.groupR;
                node.done();
            });

            node.on.data("RESPONDENT", function(msg) {
                node.game.role = "RESPONDENT";
                node.game.otherID = msg.data.proposer;
                node.game.nbrGroup = msg.data.groupP;
                node.done();
            });
        },
        // stepRule: cbs.syncGroup
    });

    stager.extendStage('burdenSharingControl', {
        steps: ["syncGroups", "initialSituation", "decision"],
        steprule:  stepRules.SYNC_STEP,
        done: cbs.clearFrame
    });

    stager.extendStep('questionnaire', {
        cb: cbs.questionnaire,
        globals: {
            makeChoiceTD: cbs.makeChoiceTD,
            makeChoiceTDRow: cbs.makeChoiceTDRow,
            makeChoiceSPAN: cbs.makeChoiceSPAN,
            makeChoiceSELECT: cbs.makeChoiceSELECT
        }
    });

    stager.setDefaultGlobals({
        round: cbs.round,
        gameName: settings.GAME_NAME,
        chosenTreatment: treatmentName.substring(0,2),
        costGE: settings.COSTGE,
        timer: settings.timer,
        buildTables: cbs.buildTables,
        checkID: cbs.checkID,
        checkEntry: cbs.checkEntry,
        writeCatastrophe: cbs.writeCatastrophe,
        writeNoCatastrophe: cbs.writeNoCatastrophe,
        writeOfferRejected: cbs.writeOfferRejected,
        writeOfferAccepted: cbs.writeOfferAccepted,
        writeRoundResults: cbs.writeRoundResults
    });

    //We serialize the game sequence before sending it
    game.plot = stager.getState();

    //Other settings, optional
    game.settings = {
        publishLevel: 2
    };

    //auto: true = automatic run, auto: false = user input
    game.env = { auto: true };

    game.debug = settings.debug;

    game.verbosity = 1;

    game.events = {
        dumpEvents: true
    };

    game.window = {
        promptOnleave: !settings.debug
    };

    return game;
};
