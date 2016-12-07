/**
 * # Logic type implementation of the game stages
 * Copyright(c) {YEAR} {AUTHOR} <{AUTHOR_EMAIL}>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

"use strict";

var ngc = require('nodegame-client');
var stepRules = ngc.stepRules;
var constants = ngc.constants;
var counter = 0;

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var node = gameRoom.node;
    var channel =  gameRoom.channel;

    // Must implement the stages here.

    // Increment counter.
    counter = counter ? ++counter : settings.SESSION_ID || 1;

    stager.setOnInit(function() {

        // Initialize the client.

    });

    stager.extendStep('instructions', {
        cb: function() {
            console.log('Instructions.');
        }
    });

    stager.extendStep('game', {
        matcher: {
            roles: [ 'DICTATOR', 'OBSERVER' ],
            match: 'rounddobin',
            cycle: 'repeat_mirror',
            // skipBye: false,
            // sayPartner: false
        },
        cb: function() {
            console.log('Game round: ' + node.player.stage.round);
        }
    });

    stager.extendStep('end', {
        cb: function() {
            node.game.memory.save(channel.getGameDir() + 'data/data_' +
                                  node.nodename + '.json');
        }
    });

    stager.setOnGameOver(function() {

        // Something to do.

    });

    // Here we group together the definition of the game logic.
    return {
        nodename: 'lgc' + counter,
        // Extracts, and compacts the game plot that we defined above.
        plot: stager.getState(),

    };

};
