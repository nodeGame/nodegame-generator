/**
 * # Game stages definition file
 * Copyright(c) {YEAR} {AUTHOR} <{AUTHOR_EMAIL}>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */
module.exports = function(game) {

    // Other settings, optional
    game.settings = {
        publishLevel: 2
    };

    game.env = {
        auto: false
    };

    game.debug = settings.debug;

    game.verbosity = 1;

    game.window = {
        promptOnleave: !settings.debug
    };
};
