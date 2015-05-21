/**
 * # Game stages definition file
 * Copyright(c) {YEAR} {AUTHOR} <{AUTHOR_EMAIL}>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */
var ngc = require('nodegame-client');

module.exports = function(settings) {
    var stager = ngc.getStager();

    stager.init()
        .next('instructions')
        .repeat('game', settings.REPEAT)
        .next('questionnaire');

    // Modifty the stager to skip one stage.

    // stager.skip('instructions');
    // stager.skip('questionnaire');

    return stager.getState();
};
