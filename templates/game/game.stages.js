/**
 * Stages definition for the Burden Game.
 *
 * They will be extended in game.logic, and game.client.
 *
 */
var ngc = require('nodegame-client');

module.exports = function(settings) {
    var stager = ngc.getStager();

    stager.init()
    .next('instructions')
    .repeat('burdenSharingControl', settings.REPEAT)
    .repeat('questionnaire', 23);

    // Modifty the stager to skip one stage.
    // stager.skip('instructions');
    // stager.skip('burdenSharingControl');

    return stager.getState();
};
