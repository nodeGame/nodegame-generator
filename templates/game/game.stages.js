/**
 * # Game stages definition file
 * Copyright(c) {YEAR} {AUTHOR} <{AUTHOR_EMAIL}>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

module.exports = function(stager, settings) {

     stager.init()
        .next('instructions')
        .repeat('game', settings.REPEAT)
        .gameover();

    // Modifty the stager to skip one stage.

    // stager.skip('instructions');
    // stager.skip('questionnaire');

    return stager.getState();
};
