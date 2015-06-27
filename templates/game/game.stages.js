/**
 * # Game stages definition file
 * Copyright(c) {YEAR} {AUTHOR} <{AUTHOR_EMAIL}>
 * MIT Licensed
 *
 * Stages are defined using the stager API
 *
 * http://www.nodegame.org
 * ---
 */

module.exports = function(stager, settings) {

     stager.init()
        .next('instructions')
        .repeat('game', 1)//settings.REPEAT)
        .next('end')
        .gameover();

    // Modifty the stager to skip one stage.

    stager.skip('instructions');

    return stager.getState();
};
