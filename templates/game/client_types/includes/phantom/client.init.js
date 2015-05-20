/**
 * # Functions used by the Client of Burden-share Game
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 */

module.exports = init;

function init() {

    console.log('INIT PLAYER!');

    // Polyfills

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now
    if (!Date.now) {
        Date.now = function now() {
            return new Date().getTime();
        };
    }

    // http://stackoverflow.com/questions/2790001/fixing-javascript-array-functions-in-internet-explorer-indexof-foreach-etc
    if (!('indexOf' in Array.prototype)) {
        Array.prototype.indexOf= function(find, i /*opt*/) {
            if (i===undefined) i= 0;
            if (i<0) i+= this.length;
            if (i<0) i= 0;
            for (var n= this.length; i<n; i++)
                if (i in this && this[i]===find)
                    return i;
            return -1;
        };
    }
    if (!('lastIndexOf' in Array.prototype)) {
        Array.prototype.lastIndexOf= function(find, i /*opt*/) {
            if (i===undefined) i= this.length-1;
            if (i<0) i+= this.length;
            if (i>this.length-1) i= this.length-1;
            for (i++; i-->0;) /* i++ because from-argument is sadly inclusive */
                if (i in this && this[i]===find)
                    return i;
            return -1;
        };
    }

    if (typeof Object.create != 'function') {
        Object.create = (function() {
            var Temp = function() {};
            return function (prototype) {
                if (arguments.length > 1) {
                    throw Error('Second argument not supported');
                }
                if (typeof prototype != 'object') {
                    throw TypeError('Argument must be an object');
                }
                Temp.prototype = prototype;
                var result = new Temp();
                Temp.prototype = null;
                return result;
            };
        })();
    }

    // Clear the WaitPage, if still there.
    var waitingForPlayers = W.getElementById('waitingForPlayers');
    var that = this;

    var gameName = node.game.globals.gameName;
    var chosenTreatment = node.game.globals.chosenTreatment;

    // Hide unused div from waiting room.
    if (waitingForPlayers) {
        waitingForPlayers.style.display = 'none';
    }

    // Clear countdown interval.
    if ('undefined' !== typeof timeCheck) {
        clearInterval(timeCheck);
    }

    function sendDataToServer() {
        var dataExist, answerQR;

        answerQR = W.getElementById('questRounds').value;
        node.game.results.questionRound = answerQR;

        // Check if data for playerID
        // and current round already exists.
        dataExist = {
            Player_ID: node.player.id,
            Current_Round: node.player.stage.round
        };

        // Call data base and check existence of data.
        // Triggers a msg CheckData.
        node.set('check_Data', dataExist);

        node.on.data('CheckData', function(msg) {
            console.log('Current Round: ' + msg.data[0]);
            if ('undefined' !== typeof msg.data[0]) {
                // If data already exists, delete and save the new data
                console.log('Data Exist: ' + dataExist.Player_ID);
                node.set('delete_data', dataExist);
                console.log('Player already finished this round.');
            }
            // if (node.game.results.Decision_Response === 0) debugger
            node.set('bsc_data', node.game.results);
            that.endOfQuestionsround();
        });
    }


    // basic amount of own endowment (here 25).
    node.game.endowment_own = 25;
    node.game.endowment_responder = 0;
    node.game.endowment_proposer = 0;

    // cost green house gas emmisions, two Versions: 30 or 80 ECU
    node.game.costGE = node.game.globals.costGE;
    // number of rounds including the test round
    node.game.nbrRounds = 4;
    // initialization first round
    node.game.currentRound = 0;
    // own player id
    node.game.ownID = node.player.id;
    // player id opponent
    node.game.otherID = node.game.pl.db[0].id;
    // decision taken by person = 1, decision taken by computer due to time out = 0
    node.game.decisionMade = 0;

    if (chosenTreatment === 'sa') {
        // counter: number of rounds during the self selection of risk and economic growth in the first part
        node.game.pgCounter = 0;
        node.game.EGRnd = [];
        // 3 levels (first index of array) of economic growth
        // for each chosen level a a number is selected randomly (second index of array)
        node.game.growth = [
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
            [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
        ];
    }

    // ground level of climate risk
    node.game.risk = 7.5;
    node.game.ClimateRisk = 0;

    // node.game.response is either "accept" or "reject", used at the end of each round in a short question for the participant
    node.game.response = '';

    // condition for one of the two game versions
    if (node.game.costGE === 30) {
        node.game.url_bidder = '/burdenshare/html/bidder_30.html';
        node.game.url_resp = '/burdenshare/html/resp_30.html';
        node.game.url_initprop = '/burdenshare/html/initialSituationProp_30.htm';
        node.game.url_initresp = '/burdenshare/html/initialSituationResp_30.htm';
        node.game.url_preGame = '/burdenshare/html/preGame_30.html';
        node.game.url_instructionsFrame = '/burdenshare/html/' + gameName +
            '/instructions_full_30.html';
    }
    else if (node.game.costGE === 80) {
        node.game.url_bidder = '/burdenshare/html/bidder_80.html';
        node.game.url_resp = '/burdenshare/html/resp_80.html';
        node.game.url_initprop = '/burdenshare/html/initialSituationProp_80.htm';
        node.game.url_initresp = '/burdenshare/html/initialSituationResp_80.htm';
        node.game.url_preGame = '/burdenshare/html/preGame_80.html';
        node.game.url_instructionsFrame = '/burdenshare/html/' + gameName +
            '/instructions_full_80.html';
    }

    // Generate header and frame.
    W.generateHeader();
    W.generateFrame();

    node.game.visualRound = node.widgets.append('VisualRound', W.getHeader());
    node.game.timer = node.widgets.append('VisualTimer', W.getHeader());


    // Function called as soon as proposer made his offer (bid).
    node.on('BID_DONE', function(offer, to) {
        var bidDone, span_dots;

        node.game.timeMakingOffer = node.timer.getTimeSince('readyToBid');

        node.game.offer = offer;

        W.getElementById('submitOffer').disabled = 'disabled';
        bidDone = W.getElementById('offered');
        bidDone.innerHTML = ' You offer to pay ' + offer.toString() +
            '. Please wait until the experiment continues <br> <span id="span_dots">.</span> ';

        span_dots = W.getElementById('span_dots');
        // Refreshing the dots...
        setInterval(function() {
            if (span_dots.innerHTML !== '......') {
                span_dots.innerHTML = span_dots.innerHTML + '.';
            }
            else {
                span_dots.innerHTML = '.';
            }
        }, 1000);

        node.say('OFFER', node.game.otherID, offer);
    });

    // Function called as soon as proposer has finished the current round.
    node.on('PROPOSER_DONE', function() {

        node.game.timeResultProp = node.timer.getTimeSince('resultDisplayed');

        // short question at the end of each round
        W.loadFrame('/burdenshare/html/questionRounds_prop.html', function() {
            var options, quest, string, next;

            node.timer.setTimestamp('questionRound');

            options = {
                // Count down time.
                milliseconds: node.game.globals.timer.proposerDone,
                // if count down elapsed and no action has been taken by participant function is called
                timeup: function() {

                    node.game.timequestionsRounds =
                        node.timer.getTimeSince('questionRound');

                    node.game.timer.stop();
                    this.disabled = "disabled";

                    sendDataToServer();
                }
            };

            node.game.timer.init(options);
            node.game.timer.updateDisplay();
            node.game.timer.start(options);

            // Build Tables for presentation and results - 2
            node.game.globals.buildTables();

            // Short question at the end of each round
            quest = W.getElementById("quest");
            if (node.game.decisionMade === 1) {
                string = 'Why did you propose ' + node.game.offer + ' ECU ?';
                W.write(string, quest);
            }
            else {
                quest.style.display = 'none';
                W.getElementById("questRounds").style.display = 'none';
            }

            next = W.getElementById("continue");
            next.onclick = function() {
                this.disabled = "disabled";
                sendDataToServer();
            };

            // AUTO-PLAY
            node.timer.randomExec(function() {
                W.getElementById('questRounds').value = '' + Math.random();
                next.click();
            }, 3000);

        });
    });


    // Function called as soon as responder has finished the current round.
    node.on('RESPONDER_DONE', function() {
        var quest, string, next;

        node.timer.setTimestamp('resultDisplayed');

        // Check if data for playerID
        // and current round already exists.
        W.loadFrame('/burdenshare/html/questionRounds_resp.html', function() {
            var options, next, quest, string;

            node.timer.setTimestamp('questionRound');

            options = {
                milliseconds: node.game.globals.timer.respondentDone,
                timeup: function() {
                    sendDataToServer();
                }
            };

            node.game.timer.init(options);
            node.game.timer.updateDisplay();
            node.game.timer.start(options);

            // Build Tables for presentation and results. - 1
            node.game.globals.buildTables();

            // Short question at the end of each round
            quest = W.getElementById("quest");
            if (node.game.decisionMade === 1) {
                string = 'Why did you ' + node.game.response + ' the proposal ?';
                W.write(string, quest);
            }
            else {
                quest.style.display = 'none';
                W.getElementById("questRounds").style.display = 'none';
            }

            next = W.getElementById("continue");
            next.onclick = function() {
                // TODO: see if we need this timer,
                // or if we can move it inside the func.
                node.game.timequestionsRounds =
                        node.timer.getTimeSince('questionRound');
                node.game.timer.stop();
                sendDataToServer();
            };


        // AUTO-PLAY
        node.timer.randomExec(function() {
            W.getElementById('questRounds').value = '' + Math.random();
            next.click();
        }, 3000);

        });
    });

    // Function called as soon as responder made his descision (accept or reject the offer)
    node.on('RESPONSE_DONE', function(response) {
        node.game.timeResponse = node.timer.getTimeSince('offerArrived');

        W.loadFrame('/burdenshare/html/resultResponder.html', function() {
            var options, proceed;
            var catastrObj;

            if (node.player.stage.round == 1) {
                // Test Round.
                W.getElementById('practice3').style.display = '';
                W.getElementById('practice' +
                    (response ==='ACCEPT' ? 'Accept' : 'Reject')
                ).style.display = '';
            }
            node.timer.setTimestamp('resultDisplayed')

            // Start the timer.
            options = {
                milliseconds: node.game.globals.timer.responseDone,
                timeup: function() {
                    node.game.timer.stop();
                    this.disabled = "disabled";
                    node.emit('RESPONDER_DONE');
                }
            };

            node.game.timer.restart(options);

            catastrObj = {
                cc: 0,
                offer: node.game.offer
            };

            if (response === 'ACCEPT') {
                // Display catastrophe to the user.
                node.game.globals.writeOfferAccepted();
            }
            // REJECT.
            else {

                // A climate catastrophe will happen with a
                // probability of node.game.ClimateRisk.
                if (Math.random() <= (node.game.ClimateRisk/100)) {
                    // Climate catastrophy happened.
                    node.game.catastrophe =  'Yes';
                    catastrObj.cc = 1;
                    catastrObj.remainEndowResp = node.game.endowment_responder/2;
                }
                else {
                    // Climate catastrophy did not happen.
                    node.game.catastrophe =  'No';
                    catastrObj.remainEndowResp = node.game.endowment_responder;
                }

                // Display catastrophe to the user.
                node.game.globals.writeOfferRejected();
            }

            // Send reply to other player.
            node.say(response, node.game.otherID, catastrObj);

            node.game.globals.writeRoundResults(catastrObj,
                                                response === 'ACCEPT' ? 1 : 0,
                                                node.game.remainResp,
                                                'RESPONDER');
        });
    });

    this.endOfQuestionsround = function() {
        var options = {};

        if (node.player.stage.round !== 1) {
            node.done();
        }
        else {
            node.game.timer.stop();
            node.game.timer.setToZero();

            options.milliseconds = node.game.globals.timer.endOfPractice;
            options.timeup = function() {
                node.game.timer.stop();
                node.done();
            };

            node.game.timer.init(options);
            node.game.timer.updateDisplay();
            node.game.timer.start(options);

            W.loadFrame('/burdenshare/html/practiceDone.html', function() {
                var next = W.getElementById('continue');
                next.onclick = function() {
                    node.done();
                };

                // AUTO-PLAY
                node.timer.randomExec(function() {
                    next.click();
                }, 3000);

            });
        }
    };

    /**
     * ## randomAccept
     *
     * creates a random number "accepted" between 0 and 1 and rounds it to 0 or 1
     *
     * accepted = 1: offer accepted
     * accepted = 0: offer rejected
     *
     * @param {object} dataResp
     * @param {number} other The player ID of the other player
     */
    this.randomAccept = function(dataResp, other) {
        var accepted = Math.round(Math.random());
        console.log('randomaccept');
        console.log(dataResp + ' ' + other);
        if (accepted) {
            node.game.response = 'accept';
            node.emit('RESPONSE_DONE', 'ACCEPT', dataResp, other);
        }
        else {
            node.game.response = 'reject';
            node.emit('RESPONSE_DONE', 'REJECT', dataResp, other);
        }
    };

    /**
     * ## isValidBid
     *
     * checks whether the offer made by the proposer is valid
     *
     * only integer between 0 and node.game.costGE are allowed
     *
     * @param {number} n The offer made by the proposer
     * @return {boolean} true or false
     *
     */
    this.isValidBid = function(n) {
        // Only numbers, no decimals.
        var regex = /^[0-9\b]+$/;
        if (!regex.test(n)) return false;

        var r = parseFloat(n);
        n = parseInt(n, 10);

        return !isNaN(n) && isFinite(n) && (r === n) && n >= 0 &&
            n <= node.game.costGE;
    };
}
