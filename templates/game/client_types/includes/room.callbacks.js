/**
 * # Functions used by the waiting room of Burden-share game.
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 */

module.exports = {
    makeTimeOut: makeTimeOut,
    clearTimeOut: clearTimeOut,
    connectingPlayer: connectingPlayer
};

var node = module.parent.exports.node;
var channel = module.parent.exports.channel;
var gameRoom = module.parent.exports.gameRoom;
var settings = module.parent.exports.settings;
var dk = module.parent.exports.dk;
var timeOuts = module.parent.exports.timeOuts;
var J = require('JSUS').JSUS;

// Game Rooms counter.
var counter = 1;

function makeTimeOut(playerID) {

    var code = dk.codes.id.get(playerID);

    var timeOutData = {
        over: "Time elapsed!!!",
        exit: code.ExitCode
    };

    timeOuts[playerID] = setTimeout(function() {
        // console.log("Timeout has not been cleared!!!");
        dk.checkOut(code.AccessCode, code.ExitCode, 0.0, function(err, response,
                                                                  body) {

            if (err) {
                // Retry the Checkout
                setTimeout(function() {
                    dk.checkOut(code.AccessCode, code.ExitCode, 0.0);
                }, 2000);
            }
        });

        node.say("TIME", playerID, timeOutData);

        for (i = 0; i < channel.waitingRoom.clients.player.size(); i++) {
            if (channel.waitingRoom.clients.player.db[i].id == playerID) {
                delete channel.waitingRoom.clients.player.db[i];
                channel.waitingRoom.clients.player.db =
                    channel.waitingRoom.clients.player.db.filter(
                        function(a) {
                            return typeof a !== 'undefined';
                        }
                    );
            }
        }

    }, settings.WAIT_ROOM_TIMEOUT);
}

function clearTimeOut(playerID) {
    clearTimeout(timeOuts[playerID]);
    delete timeOuts[playerID];
}


var treatments = Object.keys(settings.treatments);
var tLen = treatments.length;

function decideTreatment(t) {
    if (t === "rotate") {
        return treatmentName = treatments[(counter-1) % tLen]; 
    }
    if (t === "random") {
        return treatmentName = treatments[J.randomInt(-1,tLen-1)];
    }
    return t;
}

function connectingPlayer(p) {
    var room, wRoom;
    var NPLAYERS;
    var code;
    var i;
    var timeOutData;
    var treatmentName;

    NPLAYERS = settings.N_PLAYERS;

    code = dk.codes.id.get(p.id);
    dk.checkIn(code.AccessCode);

    console.log('-----------Player connected ' + p.id);

    dk.markInvalid(p.id);

    wRoom = channel.waitingRoom.clients.player;
    
    // Send the number of minutes to wait.
    node.say('WAITTIME', p.id, settings.WAIT_ROOM_TIMEOUT);

    for (i = 0; i < wRoom.size(); i++) {
        node.say("PLAYERSCONNECTED", wRoom.db[i].id, wRoom.size());
    }

    makeTimeOut(p.id);

    // Wait for all players to connect.
    if (wRoom.size() < NPLAYERS) {
//         channel.connectBot({
//             room: gameRoom,
//             clientType: 'bot',
//             loadGame: false
//         });
        // channel.connectPhantom();
        return;
    }

    for (i = 0; i < wRoom.size(); i++) {
        timeOutData = {
            over: "AllPlayersConnected",
            exit: 0
        };
        node.say("TIME", wRoom.db[i].id, timeOutData);

        // Clear timeout for players.
        clearTimeout(timeOuts[i]);
    }

    console.log('-----------We have four players-----Game Room ID: ' + counter);

    tmpPlayerList = wRoom.shuffle().limit(NPLAYERS);

    // Decide treatment.
    treatmentName = decideTreatment(settings.CHOSEN_TREATMENT);   

    console.log('Chosen treatment: ' + treatmentName);

    room = channel.createGameRoom({
        group: 'burdenshare',
        clients: tmpPlayerList,
        gameName: 'burdenshare',
        treatmentName: treatmentName

    });

    room.setupGame();
    room.startGame(true, tmpPlayerList.id.getAllKeys());

    counter++;
}
