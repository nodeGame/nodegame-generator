/**
 * # Game settings definition file
 * Copyright(c) {YEAR} {AUTHOR} <{AUTHOR_EMAIL}>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */
module.exports = function(game) {

    
    // Variables commons to all treatments.

    game.SESSION_ID: 1,

    game.REPEAT: 4,

    game.timer: {
        instructions: 180000, // 3 minutes
        game: 20000
        questionnaire: 3000
    },

    game.env = {
        auto: false
    };

    game.debug = false;

    game.verbosity = 1;

    game.window = {
        promptOnleave: !game.debug
    };

    // Other settings, optional
    game.settings = {
        publishLevel: 2
    };

};
