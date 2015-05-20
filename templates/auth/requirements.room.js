/**
 * # Requierements Room for Burden-share Game
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Handles incoming connections, validates authorization tokens
 * check browser requirements, and collect feedbacks.
 * ---
 */
module.exports = function(settings, node, channel, room) {

    // Reads in descil-mturk configuration.
    var basedir = channel.resolveGameDir('burdenshare');
    var confPath = basedir + '/auth/descil.conf.js';

    var dk = require('descil-mturk')();

    // Creates a stager object to define the game stages.
    var stager = new node.Stager();

    // Functions

    var pinged = {};

    function init() {
        var that = this;

        console.log('********Requirements Room Created*****************');

        node.on.preconnect(function(player) {
            console.log('Player connected to Requirements room.');
            node.game.pl.add(player);
            node.remoteCommand('start', player.id);
        });

        node.on.pconnect(function(player) {
            console.log('Player connected to Requirements room.');
            node.remoteCommand('start', player.id);
        });

        node.on.pdisconnect(function(player) {
            console.log('Player disconnected from Requirements room: ' + player.id);
        });

        // Results of the requirements check.
        node.on.data('requirements', function(msg) {
            console.log('requirements');
            console.log(msg.data);
        });

        // In case a user is using the feedback form display the action.
        node.on.data('FEEDBACK', function(msg) {
            console.log('Feedback received.');
            console.log(msg.data);
        });
    }

    stager.addStage({
        id: 'requirements',
        cb: function() {
            node.on('get.MTID', function(msg) {
                var mtid, errUri, code;

                console.log('MTID');

                pinged[msg.from] = {};

                // Test Speed here.
                var ping, count, LIMIT, totalTime, pingMore;

                count = 1;
                LIMIT = 10;
                pingMore = true;
                pingId = 'ping_' + msg.from;

                ping = function() {
                    node.get('PING', function(msg) {
                        if (pingMore) {
                            if (++count >= LIMIT) {
                                pingMore = false;
                            }
                            ping();
                        }
                        else {
                            totalTime = node.timer.getTimeSince(pingId);
                            console.log('-----> Total time: ' + totalTime);
                        }
                    }, msg.from);
                };

                node.timer.setTimestamp(pingId);
                ping();

                if (settings.AUTH === 'none') {

                    return {
                        success: true,
                        msg: 'Code validated.',
                        gameLink: '/burdenshare/html/informedConsent.html'
                    };
                }

                // M-Turk id
                mtid = msg.data;

                if ('string' !== typeof mtid) {
                    return {
                        success: false,
                        msg: 'Malformed or empty code received.'
                    };
                }

                code = dk.codeExists(mtid);

                if (!code) {
                    // errUri = '/ultimatum/unauth.html?id=' + mtid + '&err0=1';
                    // node.redirect(errUri, msg.data.id);
                    return {
                        success: false,
                        msg: 'Code not found: ' + mtid
                    };
                }

                // usage is for LOCAL check, IsUsed for MTURK
                if ((code.usage || code.IsUsed) && !code.disconnected) {
                    return {
                        success: false,
                        msg: 'Code already in use: ' + mtid
                    };
                }

                return {
                    success: true,
                    msg: 'Code validated.',
                    gameLink: '/burdenshare/html/informedConsent.html'
                    // gameLink: '/burdenHR/index.htm'
                };
            });            
        }
    });

    // Define stager.

    stager.setOnInit(init);

    stager
        .init()
        .next('requirements');

    // Return the game.
    game = {};

    game.metadata = {
        name: 'Requirements check room for Burde-Sharing-Control-AMT',
        description: 'Validates players entry codes with an internal database.',
        version: '0.1'
    };

    // Throws errors if true.
    game.debug = true;

    game.plot = stager.getState();

    game.nodename = 'requirements';

    // game.verbosity = 100;

    return game;
};
