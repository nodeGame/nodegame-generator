/**
 * # Player type implementation of the game stages
 * Copyright(c) {YEAR} {AUTHOR} <{AUTHOR_EMAIL}>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */
var ngc = require('nodegame-client');
var stepRules = ngc.stepRules;
var constants = ngc.constants;

module.exports = function(game, treatmentName, gameRoom) {

    var stager, MIN_PLAYERS;
    var callbacks;
    
    callbacks = require(__dirname + '/includes/callbacks.js');

    stager = game.stager;

    // Init callback.
    stager.setOnInit(callbacks.init);

    stager.setDefaultStepRule(stepRules.WAIT);

    stager.setDefaultProperty('done', callbacks.clearFrame);
    
    MIN_PLAYERS = [ settings.MIN_PLAYERS, callbacks.notEnoughPlayers ];

    stager.extendStep('instructions', {
        cb: callbacks.instructions,
        minPlayers: MIN_PLAYERS,
        // syncOnLoaded: true,
        timer: 90000
    });


    stager.extendStep('ultimatum', {
        cb: callbacks.ultimatum,
        minPlayers: MIN_PLAYERS,
        // `syncOnLoaded` forces the clients to wait for all the others to be
        // fully loaded before releasing the control of the screen to the
        // players.  This options introduces a little overhead in
        // communications and delay in the execution of a stage. It is probably
        // not necessary in local networks, and it is FALSE by default.
        // syncOnLoaded: true
    });

    stager.extendStep('endgame', {
        cb: callbacks.endgame
    });

    stager.extendStep('questionnaire', {
        cb: callbacks.postgame,
        timer: 90000,
        // `done` is a callback function that is executed as soon as a
        // _DONE_ event is emitted. It can perform clean-up operations (such
        // as disabling all the forms) and only if it returns true, the
        // client will enter the _DONE_ stage level, and the step rule
        // will be evaluated.
        done: function() {
            var q1, q2, q2checked, i, isTimeup;
            q1 = W.getElementById('comment').value;
            q2 = W.getElementById('disconnect_form');
            q2checked = -1;

            for (i = 0; i < q2.length; i++) {
                if (q2[i].checked) {
                    q2checked = i;
                    break;
                }
            }

            isTimeUp = node.game.timer.gameTimer.timeLeft <= 0;

            // If there is still some time left, let's ask the player
            // to complete at least the second question.
            if (q2checked === -1 && !isTimeUp) {
                alert('Please answer Question 2');
                return false;
            }

            node.set('questionnaire', {
                q1: q1 || '',
                q2: q2checked
            });

            node.emit('INPUT_DISABLE');
            node.set('timestep', {
                time: node.timer.getTimeSince('step'),
                timeup: isTimeUp
            });
            return true;
        }
    });

    // We serialize the game sequence before sending it.
    game.plot = stager.getState();

    return game;
};
