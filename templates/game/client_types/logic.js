/**
 * # Logic type implementation of the game stages
 * Copyright(c) {YEAR} {AUTHOR} <{AUTHOR_EMAIL}>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */
var ngc = require('nodegame-client');
var stepRules = ngc.stepRules;
var constants = ngc.constants;
var counter = 0;

module.exports = function(game, settings, treatmentName, gameRoom) {

    // Must implement the stages here.

    // Increment counter.
    counter = counter ? ++counter : settings.SESSION_ID;

    var client = gameRoom.getClientType('player');

    // Reads in descil-mturk configuration.
    var basedir = channel.resolveGameDir('ultimatum');
   
    var stager = game.stager;

    // Import other functions used in the game.
    // Some objects are shared.
    // Flag to not cache required files.
    var nocache = true;
    var cbs = channel.require(__dirname + '/includes/logic.callbacks.js', {
        node: node,
        gameRoom: gameRoom,
        settings: settings,
        dk: dk,
        client: client,
        counter: counter
        // Reference to channel added by default.
    }, nocache);

    // Event handler registered in the init function are always valid.
    stager.setOnInit(cbs.init);

    // Event handler registered in the init function are always valid.
    stager.setOnGameOver(cbs.gameover);

    // Extending default stages.

    // Set default step rule.
    stager.setDefaultStepRule(stepRules.OTHERS_SYNC_STEP);

    stager.setDefaultProperty('minPlayers', [ 
        settings.MIN_PLAYERS,
        cbs.notEnoughPlayers 
    ]);

    // All this should be avoided.

    stager.extendStep('precache', {
        cb: function() {}
    });
    
    stager.extendStep('selectLanguage', {
        cb: function() {}
    });
    
    stager.extendStep('instructions', {
        cb: function() {}
    });
    
    stager.extendStep('quiz', {
        cb: function() {}
    });

    stager.extendStep('questionnaire', {
        cb: function() {},
        minPlayers: undefined
    });

    stager.extendStep('ultimatum', {
        cb: function() {
            this.node.log('Ultimatum');
            cbs.doMatch();
        }
    });

    stager.extendStep('endgame', {
        cb: cbs.endgame,
        minPlayers: undefined,
        steprule: stepRules.SOLO
    });

    // Here we group together the definition of the game logic.
    return {
        nodename: 'lgc' + counter,
        game_settings: {
            // Will not publish any update of stage / stageLevel, etc.
            publishLevel: 0,
            // Will send a start / step command to ALL the clients when
            // the logic will start / step through the game.
            // This option requires that the game plots of the clients
            // and logic are symmetric or anyway compatible.
            syncStepping: true
        },
        // Extracts, and compacts the game plot that we defined above.
        plot: stager.getState(),
        
    };

};
