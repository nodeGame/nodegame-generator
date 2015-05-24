/**
 * # Game stages definition file
 * Copyright(c) {YEAR} {AUTHOR} <{AUTHOR_EMAIL}>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

module.exports = function(stager, treatment, settings) {

     stager.init()
        .next('precache')
        .next('selectLanguage')
        .next('instructions')
        .next('quiz')
        .repeat('ultimatum', settings.REPEAT)
        .next('questionnaire')
        .next('endgame')
        .gameover();

    // Modifty the stager to skip one stage.

    // stager.skip('instructions');
    // stager.skip('questionnaire');

    return stager.getState();
};
