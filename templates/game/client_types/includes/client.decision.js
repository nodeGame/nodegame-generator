/**
 * # Functions used by the Client of Burden-share Game
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 */

module.exports = decision;

function decision() {

    node.game.visualRound.setDisplayMode(['COUNT_UP_STAGES_TO_TOTAL',
                                          'COUNT_UP_ROUNDS_TO_TOTAL']);

    var gameName = node.game.globals.gameName;
    var chosenTreatment = node.game.globals.chosenTreatment;

    var that = this;

    node.game.decisionMade = 0;
    /////////////////////////////////// PROPOSER ///////////////////////////////////

    if (node.game.role == 'PROPOSER') {
        W.loadFrame(node.game.url_bidder, function() {
            var options;

            W.getElementById("instructionsFrame").setAttribute(
                "src", node.game.url_instructionsFrame);

            if (node.player.stage.round === 1) {
                // Test Round
                W.getElementById('practice2').style.display = '';
            }

            W.getElementById("offer").selectedIndex = -1;
            node.timer.setTimestamp('readyToBid');


            var submitoffer = W.getElementById('submitOffer');

            options = {
                milliseconds: node.game.globals.timer.proposer,
                timeup: function() {
                    W.getElementById("fieldset").disabled = true;
                    submitoffer.onclick = null;
                    node.game.timer.stop();
                    var randnum = JSUS.randomInt(-1, node.game.costGE);
                    node.emit('BID_DONE', randnum, node.game.otherID);
                }
            };
            node.game.timer.restart(options);

            var propEndow = W.getElementById('propEndow');
            var respEndow = W.getElementById('respEndow');
            var costGHGE = W.getElementById('costGHGE');
            var clRiskOwn = W.getElementById('clRiskOwn');
            var clRiskOther = W.getElementById('clRiskOther');
            var clRisk = W.getElementById('clRisk');

            W.write(node.game.endowment_proposer, propEndow);
            W.write(node.game.endowment_responder, respEndow);
            W.write(node.game.costGE, costGHGE);
            W.write(node.game.riskOwn, clRiskOwn);
            W.write(node.game.riskOther, clRiskOther);
            W.write(node.game.ClimateRisk, clRisk);

            submitoffer.onclick = function() {
                var offerInput, offer;
                offerInput = W.getElementById('offer');

                if (!that.isValidBid(offerInput.value)) {
                    var msg = 'Please choose an integer number between 0 and ' +
                        node.game.costGE;
                    node.game.globals.checkID(msg);
                    return;
                }
                offer = parseInt(offerInput.value, 10);

                node.game.timer.stop();
                node.game.timer.setToZero();
                W.getElementById("fieldset").disabled = true;
                submitoffer.onclick = null;
                node.game.decisionMade = 1;
                node.emit('BID_DONE', offer, node.game.otherID);
            };

            node.on.data("ACCEPT", function(msg) {
                W.loadFrame('html/resultProposer.html', function() {

                    var result1 = W.getElementById('result1');
                    var result2 = W.getElementById('result2');
                    var result3 = W.getElementById('result3');
                    var propOffer = W.getElementById('propOffer');            
                    var remainProp = W.getElementById('remainProp');            
                    var remainResp = W.getElementById('remainResp');
                    var respDecision = W.getElementById('respDecision');

                    // Unhide stuff.
                    if (node.player.stage.round === 1) {
                        // Test Round
                        W.getElementById('practice3').style.display = '';
                        W.getElementById("practiceAccept").style.display = "";
                    }

                    node.timer.setTimestamp('resultDisplayed');
                    // Start the timer.
                    var options = {
                        milliseconds: node.game.globals.timer.reply2Prop,
                        timeup: function() {
                            node.game.timer.stop();
                            node.emit('PROPOSER_DONE');
                        }
                    };

                    node.game.timer.restart(options);

                    if (node.player.stage.round !== 1) {
                        W.sprintf('The other player has %strongaccepted%strong your offer.', {
                            '%strong': {}  
                        } , result1);
                        W.write('You have successfully reached an agreement against global warming.', result2);
                    }
                    
                    // What the respondent has to pay.
                    var payProp = node.game.offer;
                    var payResp = node.game.costGE - payProp;            
                    node.game.respPay = payResp;

                    // Check this.
                    var remainPropValue = node.game.endowment_proposer - payProp;
                    var remainRespValue = node.game.endowment_responder - payResp;
                    // TODO: see what to do when offer goes negative.
                    if (remainPropValue < 0) remainPropValue = 0;
                    if (remainRespValue < 0) remainRespValue = 0;

                    node.game.decision =  'Accept';
                    node.game.agreement =  'Yes';
                    node.game.catastrophe =  'No';

                    W.write(payProp, propOffer);
                    W.write('Accept', respDecision);

                    node.game.remainProp = remainPropValue;
                    node.game.remainResp = remainRespValue;

                    W.write(remainPropValue, remainProp);
                    W.write(remainRespValue, remainResp);

                    // Write Round Results.
                    node.game.globals.writeRoundResults(msg.data,
                                                        1,
                                                        remainPropValue,
                                                        'PROPOSER');

                });
            });

            node.on.data("REJECT", function(msg) {
                W.loadFrame('html/resultProposer.html', function () {
                    if (node.player.stage.round === 1) {
                        // Test Round
                        var practice3 = W.getElementById('practice3');
                        practice3.style.display = '';
                        W.getElementById("practiceReject").style.display = "";
                        W.getElementById('practice' + (msg.data.cc === 0 ? 'No':'') +
                        'Catastrophe').style.display = '';
                    }

                    node.timer.setTimestamp('resultDisplayed');
                    // Start the timer.
                    var options = {
                        milliseconds: node.game.globals.timer.reply2Prop,
                        timeup: function() {
                            node.game.timer.stop();
                            this.disabled = "disabled";
                            node.emit('PROPOSER_DONE');
                        }
                    };
                    node.game.timer.restart(options);
                    
                    var result1 = W.getElementById('result1');
                    var result2 = W.getElementById('result2');
                    var result3 = W.getElementById('result3');
                    var propOffer = W.getElementById('propOffer');            
                    var remainProp = W.getElementById('remainProp');            
                    var remainResp = W.getElementById('remainResp');
                    var respDecision = W.getElementById('respDecision');


                    // What the respondent has to pay.
                    var payProp = node.game.offer;
                    var payResp = node.game.costGE - payProp;            
                    node.game.respPay = payResp;

                    // Check this.
                    var remainPropValue = node.game.endowment_proposer - payProp;
                    //remResp = node.game.endowment_responder - resp;
                    var remainRespValue = node.game.endowment_responder - payResp;
                    // TODO: see what to do when offer goes negative.
                    if (remainPropValue < 0) remainPropValue = 0;
                    if (remainRespValue < 0) remainRespValue = 0;

                    W.write(payProp, propOffer);


                    if (node.player.stage.round !== 1) {
                        W.sprintf('The other player has %strongrejected%strong your offer.', {
                            '%strong': {}
                        }, result1);
                        W.write('You have not been able to reach an agreement against global warming.', result2);
                    }

                    if (msg.data.cc === 0) {
                        if (node.player.stage.round !== 1) {
                            W.sprintf('However, %strongno climate catastrophe%strong has happened.', {
                                '%strong': {}
                            }, result3);
                        }
                        node.game.catastrophe =  'No';
                        node.game.remainProp = node.game.endowment_proposer;
                        W.write(node.game.remainProp, remainProp);
                        W.write(node.game.endowment_responder, remainResp);
                    }
                    else {
                        if (node.player.stage.round !== 1) {
                            // W.write('A climate catastrophe has happened and destroyed a part of your endowment.', result3); 
                            W.sprintf('A %strongclimate catastrophe has happened%strong and destroyed a part of your endowment.', 
                                      { '%strong': {} }, result3);
                        }
                        node.game.catastrophe =  'Yes';

                        node.game.remainProp = node.game.endowment_proposer/2;
                        W.write(node.game.remainProp, remainProp);
                        W.write(node.game.endowment_responder / 2, remainResp);
                    }

                    node.game.decision =  'Reject';
                    node.game.agreement =  'No';

                    W.write('Reject', respDecision);
                    
                    // Write Round Results.
                    node.game.globals.writeRoundResults(msg.data,
                                                        0,
                                                        node.game.remainProp,
                                                        'PROPOSER');
                });
            });

        });
    }



    /////////////////////////////////// RESPONDENT ///////////////////////////////////

    else if (node.game.role == 'RESPONDENT') {
        W.loadFrame(node.game.url_resp, function() {
            W.getElementById("instructionsFrame").setAttribute(
                "src", node.game.url_instructionsFrame);

            var span_dot = W.getElementById('span_dot');
            // Refreshing the dots...
            setInterval(function() {
                if (span_dot.innerHTML !== '......') {
                    span_dot.innerHTML = span_dot.innerHTML + '.';
                }
                else {
                    span_dot.innerHTML = '.';
                }
            }, 1000);

            var propEndow = W.getElementById('propEndow');
            var respEndow = W.getElementById('respEndow');
            var costGHGE = W.getElementById('costGHGE');
            var clRiskOwn = W.getElementById('clRiskOwn');
            var clRiskOther = W.getElementById('clRiskOther');
            var clRisk = W.getElementById('clRisk');

            // Naming inverted, but correct.
            W.write(node.game.endowment_responder, propEndow);
            W.write(node.game.endowment_proposer, respEndow);

            W.write(node.game.costGE, costGHGE);
            W.write(node.game.riskOwn,clRiskOwn);
            W.write(node.game.riskOther, clRiskOther);
            W.write(node.game.ClimateRisk, clRisk);

            node.on.data('OFFER', function(msg) {
                node.timer.setTimestamp('offerArrived');

                var options = {
                    milliseconds: node.game.globals.timer.respondent,
                    timeup: function() {
                        node.game.timer.stop();
                        that.randomAccept(msg.data, node.game.otherID);
                    }
                };

                node.game.timer.init(options);
                node.game.timer.updateDisplay();
                node.game.timer.start(options);

                var dots =  W.getElementById('dots');
                dots.style.display = 'none';
                var text =  W.getElementById('text');
                text.style.display = '';
                var offered = W.getElementById('offered');
                offered.style.display = '';
                var proposer = W.getElementById('proposer');
                var respondent = W.getElementById('respondent');

                
                node.game.offer = msg.data;
                var respPay = node.game.costGE - node.game.offer;

                W.write(node.game.offer, proposer);
                W.write(respPay, respondent);

                var accept = W.getElementById('accept');
                var reject = W.getElementById('reject');

                if (node.player.stage.round == 1) {
                    // Test Round
                    W.getElementById('practice3').style.display = '';

                    W.getElementById('otherContribution').innerHTML = msg.data;
                    W.getElementById('yourContribution').innerHTML = respPay;
                    W.getElementById('climateRisk').innerHTML =
                        node.game.ClimateRisk;
                }

                node.game.respPay = "" + respPay;

                accept.onclick = function() {
                    node.game.response = 'accept';
                    node.game.timer.stop();
                    // It was not a timeout.
                    node.game.decisionMade = 1;
                    node.emit('RESPONSE_DONE', 'ACCEPT');
                };

                reject.onclick = function() {
                    node.game.response = 'reject';
                    node.game.timer.stop();
                    // It was not a timeout.
                    node.game.decisionMade = 1;
                    node.emit('RESPONSE_DONE', 'REJECT');
                };
                
            });
        });
    }
    return true;
}
