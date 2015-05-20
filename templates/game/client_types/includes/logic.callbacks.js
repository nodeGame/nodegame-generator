/**
 * # Functions used by the Logic and Client of Burden-share Game
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 */

module.exports = {
    round: round,
    playerReconnects: playerReconnects,
    //    writePlayerData: writePlayerData
};

var node = module.parent.exports.node;
var channel = module.parent.exports.channel;
var gameRoom = module.parent.exports.gameRoom;
var settings = module.parent.exports.settings;
var dk = module.parent.exports.dk;
var client = module.parent.exports.client;
var autoplay = module.parent.exports.autoplay;
var ngc = module.parent.exports.ngc;

function playerReconnects(p) {
    var code, isQuest;
    var GameStage = ngc.GameStage;

    console.log('Oh...somebody reconnected!', p);
    code = dk.codeExists(p.id);

    if (!code) {
        console.log('game.logic: reconnecting player not found in ' +
                    'code db: ' + p.id);
        return;
    }

    if (!code.disconnected) {
        console.log('game.logic: reconnecting player that was not ' +
                    'marked disconnected: ' + p.id);
        return;
    }

    isQuest = node.game.getCurrentStepObj().id === 'questionnaire';

    // Mark code as connected.
    code.disconnected = false;

    if (!isQuest) {
        // Delete countdown to terminate the game.
        clearTimeout(this.countdown);
        // Clear any message in the buffer from.
        node.remoteCommand('erase_buffer', 'ROOM');
    }

    // Notify other player he is back.
    // TODO: add it automatically if we return TRUE? It must be done
    // both in the alias and the real event handler
    node.game.pl.each(function(player) {
        node.socket.send(node.msg.create({
            target: 'PCONNECT',
            data: { id: p.id },
            to: player.id
        }));
    });

    // Send currently connected players to reconnecting one.
    node.socket.send(node.msg.create({
        target: 'PLIST',
        // TODO: this sends a bit too much.
        data: node.game.pl.db,
        to: p.id
    }));
    

    // We could slice the game plot, and send just what we need
    // however here we resend all the stages, and move their game plot.
    console.log('** Player reconnected: ' + p.id + ' **');
    // Setting metadata, settings, and plot.

    // TODO: better way of recovering the client type settings.
    if (p.clientType === 'autoplay') {
        node.remoteSetup('game_metadata',  p.id, autoplay.metadata);
        node.remoteSetup('game_settings', p.id, autoplay.settings);
        node.remoteSetup('plot', p.id, autoplay.plot);
        node.remoteSetup('env', p.id, autoplay.env);
    }
    else {
        node.remoteSetup('game_metadata',  p.id, client.metadata);
        node.remoteSetup('game_settings', p.id, client.settings);
        node.remoteSetup('plot', p.id, client.plot);
        node.remoteSetup('env', p.id, client.env);
    }

    // Start the game on the reconnecting client.
    node.remoteCommand('start', p.id, { step: false });

    // It is not added automatically.
    // TODO: add it automatically if we return TRUE? It must be done
    // both in the alias and the real event handler
    node.game.pl.add(p);

    var RECON_STAGE = node.player.stage;

    // If logic is in questionnaire send WIN message and exit.
    if (isQuest) {

        // IF ALREADY CHECKOUT.
        if (code.checkout) {
            node.remoteAlert('Hi! It looks like you have already completed ' +
                             'this game. This is your Exit code: ' + 
                             code.ExitCode, p.id);
//            setTimeout(function() {
//                node.say("win", p.id, code.ExitCode);
//            }, 1000);
        }
        else {            
            node.remoteCommand('goto_step', p.id, RECON_STAGE);
        }

    }

    else {
   
        if (!node.game.checkPlistSize()) {
            console.log('Player reconnected, but not yet enough players');
            return;
        }
        

        if (!GameStage.compare(node.player.stage, '2.2.1') ||
            !GameStage.compare(node.player.stage, '2.2.2') ||
            !GameStage.compare(node.player.stage, '2.2.3')) {

            RECON_STAGE = node.game.plot.previous(RECON_STAGE);
        }
        else if (!GameStage.compare(node.player.stage, '2.3.1') ||
                 !GameStage.compare(node.player.stage, '2.3.2') ||
                 !GameStage.compare(node.player.stage, '2.3.3')) {

            RECON_STAGE = node.game.plot.jump(RECON_STAGE, -2);
        }


        // Unpause ALL players.
        node.game.pl.each(function(player) {
            node.remoteCommand('goto_step', player.id, RECON_STAGE);
            if (player.id !== p.id) {
                node.remoteCommand('resume', player.id);
            }
        });

        // TODO: When moving the logic depends on whether the logic
        // handles the synchronization or not. If so, it should maybe 
        // be recovered before
        // Move logic to previous stage.
        node.game.gotoStep(RECON_STAGE);
    }
}

/**
 * ## round
 *
 * rounds a given number to a specified number of decimal places
 *
 * @param {number} value the floating point number to be rounded
 * @param {number} exp the number of decimal places
 *
 * @see http://stackoverflow.com/a/21323513
 */
function round(value, exp) {
    if (typeof exp === 'undefined' || +exp === 0)
        return Math.round(value);

    value = +value;
    exp  = +exp;

    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0))
        return NaN;

    // Shift
    value = value.toString().split('e');
    value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));

    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
}
