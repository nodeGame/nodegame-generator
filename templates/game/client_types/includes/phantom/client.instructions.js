/**
 * # Functions used by the Client of Burden-share Game
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 */

module.exports = instructions;

function instructions() {
    node.game.visualRound.setDisplayMode(['COUNT_UP_STAGES_TO_TOTAL']);

    var gameName = node.game.globals.gameName;
    var chosenTreatment = node.game.globals.chosenTreatment;

    console.log('instructions');

    function sendTimeInstr(page) {
        node.game.timeInstruction = node.timer.getTimeSince('instr' + page);
        node.set('bsc_data', {
            Player_ID: node.game.ownID,
            Current_Round: "Instructions" + page,
            timeDecision: node.game.timeInstruction
        });
    }

    W.loadFrame('/burdenshare/html/instructions.html', function() {
        node.timer.setTimestamp('instr1');
        var options = {
            milliseconds: node.game.globals.timer.instructions1,
            timeup: function() {
                sendTimeInstr(1);
                instructions2();
            }
        };
        node.game.timer.init(options);
        node.game.timer.updateDisplay();
        node.game.timer.start(options);

        W.getElementById("cost").innerHTML = node.game.costGE;

        var next;
        next = W.getElementById("continue");
        next.onclick = function() {
            node.game.timer.stop();
            this.disabled = "disabled";
            sendTimeInstr(1);
            instructions2();
        };

        // AUTO-PLAY
        node.timer.randomExec(function() {
            next.click();
        }, 3000);

    });

    function instructions2() {
        W.loadFrame('/burdenshare/html/' + gameName + '/instructions2.html', function() {

            node.timer.setTimestamp('instr2');
            var options = {
                milliseconds: node.game.globals.timer.instructions2,
                timeup: function() {
                    sendTimeInstr(2);
                    instructions3();
                }
            };
            node.game.timer.init(options);
            node.game.timer.updateDisplay();
            node.game.timer.start(options);

            console.log('Instructions Page 2');
            if (chosenTreatment === 'ra') {
                W.getElementById("cost").innerHTML = node.game.costGE;
            }

            var next;
            next = W.getElementById("continue");
            next.onclick = function() {
                node.game.timer.stop();
                this.disabled = "disabled";
                sendTimeInstr(2);
                instructions3();
            };

            // AUTO-PLAY
            node.timer.randomExec(function() {
                next.click();
            }, 3000);

        });
    }

    function instructions3() {
        W.loadFrame('/burdenshare/html/' + gameName + '/instructions3.html', function() {
            node.timer.setTimestamp('instr3');
            var options = {
                milliseconds: node.game.globals.timer.instructions3,
                timeup: function() {
                    sendTimeInstr(3);
                    if (node.game.globals.chosenTreatment === 'ra') {
                        EconGrowthAndRisk();
                    }
                    else if (node.game.globals.chosenTreatment === 'sa') {
                        instructions4();
                    }
                }
            };
            node.game.timer.init(options);
            node.game.timer.updateDisplay();
            node.game.timer.start(options);
            console.log('Instructions Page 3');
            if (chosenTreatment === 'sa') {
                W.getElementById("cost").innerHTML = node.game.costGE;
            }

            var next;
            next = W.getElementById("continue");
            next.onclick = function() {
                node.game.timer.stop();
                this.disabled = "disabled";
                sendTimeInstr(3);
                if (chosenTreatment === 'ra') {
                    EconGrowthAndRisk();
                }
                else if (chosenTreatment === 'sa') {
                    instructions4();
                }
            };

            // AUTO-PLAY
            node.timer.randomExec(function() {
                next.click();
            }, 3000);

        });
    }

    function instructions4() { 

        W.loadFrame('/burdenshare/html/instructions4.html', function() {
            node.timer.setTimestamp('instr4');
            var options = {
                milliseconds: node.game.globals.timer.instructions4,
                timeup: initEndowFunc
            };
            node.game.timer.init(options);
            node.game.timer.updateDisplay();
            node.game.timer.start(options);
            console.log('Instructions Page 4');

            var next;
            next = W.getElementById("continue");
            next.onclick = initEndowFunc;
            
            // AUTO-PLAY
            node.timer.randomExec(function() {
                next.click();
            }, 3000);

        });
    }

    function initEndowFunc() {
        var setDBEconGrowth, j;
        var next;

        var initEndow = {
            playerID: { Player_ID: node.player.id },
            addEndow: { 
                Initial_Endowment: node.game.endowment_own,
                Climate_Risk: node.game.risk
            }
        };
        
        next = W.getElementById("continue");
        if (next) next.disabled = "disabled";
        
        node.game.timer.stop();        

        // Set back values in database in case of a disconnection - reconnection.
        node.game.pgCounter = 0;
        node.game.endowment_own = 25;
        node.game.risk = 7.5;
        initEndow.addEndow.Initial_Endowment = 0;
        initEndow.addEndow.Climate_Risk = 0;

        node.set('initEndow', initEndow);

        setDBEconGrowth = {
            playerID : { Player_ID: node.player.id },
            add: {}
        };

        for (j = 1; j <= 5; j++) {
            node.game.EGRnd[j] = 0;
            setDBEconGrowth.add['EGRnd' + j] = node.game.EGRnd[j];
        }
        node.set("econGrowth", setDBEconGrowth);
        chooseEconGrowth();
    }

    /**
     * ## chooseEconGrowth
     *
     * participant has to choose the economic growth during 5 rounds
     *
     */
    function chooseEconGrowth() {
        W.loadFrame(node.game.url_preGame, function() {
            W.getElementById("instructionsFrame").setAttribute(
                "src", node.game.url_instructionsFrame);

            if (node.game.pgCounter === 0) {
                // Test Round
                var practice0 = W.getElementById('practice0');
                practice0.style.display = '';
            }

            var cumEndow = W.getElementById("propEndow");
            var cumRisk =  W.getElementById("clRiskOwn");
            W.write(node.game.endowment_own, cumEndow);

            if (node.game.risk - 7.5 <= 0) {
                W.write("0", cumRisk);
            }
            else {
                W.write(node.game.risk - 7.5, cumRisk);
            }

            node.game.pgCounter++;

            var options = {
                milliseconds: node.game.globals.timer.econGrowth,
                timeup: function() {           
                    var found = checkSelfGrowth();
                    
                    if (!found) {
                        // If count down elapsed the computer will randomly
                        // choose one of 3 options.
                        var randnum = Math.floor(1+(Math.random()*3));
                        node.game.EGRnd[node.game.pgCounter] = randnum;
                        switch(randnum) {
                        case 1: node.game.risk = node.game.risk + 0; break;
                        case 2: node.game.risk = node.game.risk + 2.5; break;
                        case 3: node.game.risk = node.game.risk + 5; break;
                        }
                    }

                    setGrowthAndDecide();
                }
            };


            node.game.timer.init(options);
            node.game.timer.updateDisplay();
            node.game.timer.start(options);
            console.log('Choose Economy Growth');

            var next;
            next = W.getElementById("submitGrowth");
            next.onclick = function() {
                var found;
                found = checkSelfGrowth();

                if (found) {
                    setGrowthAndDecide();
                }
                else {
                    node.game.globals.checkEntry('Please choose one of the ' +
                                                 'three options of economic ' +
                                                 'growth and then continue.');
                }

            };

            // AUTO-PLAY
            node.timer.randomExec(function() {
                var randnum = Math.floor(1+(Math.random()*3));
                W.getElementById("pg" + randnum).checked = true;
                next.click();
            }, 3000);

        });
    }

    function checkSelfGrowth() {
        var found;
        if (W.getElementById("pg1").checked) {
            node.game.EGRnd[node.game.pgCounter] = 1;
            node.game.risk = node.game.risk + 0;
            found = true;
        }
        else if (W.getElementById("pg2").checked) {
            node.game.EGRnd[node.game.pgCounter] = 2;
            node.game.risk = node.game.risk + 2.5;
            found = true;
        }
        else if (W.getElementById("pg3").checked) {
            node.game.EGRnd[node.game.pgCounter] = 3;
            node.game.risk = node.game.risk + 5;
            found = true;
        }
        return found;
    }

    function setGrowthAndDecide() {
        var initEndow = {
            playerID: { Player_ID: node.player.id },
            addEndow: {
                Initial_Endowment: node.game.endowment_own,
                Climate_Risk: node.game.risk
            }
        };

        // Randomly chooses on of the values
        // within the chosen economy growth level.
        var ind = node.game.EGRnd[node.game.pgCounter] - 1;
        var rnd = Math.floor((Math.random()*node.game.growth[ind].length)+1) - 1;

        node.game.endowment_own = node.game.endowment_own + node.game.growth[ind][rnd];

        var setDBEconGrowth = {
            playerID : { Player_ID: node.player.id }, 
            add: {}
        };

        setDBEconGrowth.add['EGRnd' + node.game.pgCounter] = 
            node.game.EGRnd[node.game.pgCounter];

        node.set("econGrowth", setDBEconGrowth);

        node.game.timer.stop();

        var next;
        next = W.getElementById("submitGrowth");
        next.disabled = "disabled";

        if (node.game.pgCounter < 5) {
            chooseEconGrowth();
        }
        else {
            sendTimeInstr(4);
            W.getElementById("propEndow").innerHTML = node.game.endowment_own;
            W.getElementById("clRiskOwn").innerHTML = node.game.risk - 7.5;
            initEndow.addEndow.Initial_Endowment = node.game.endowment_own;
            initEndow.addEndow.Climate_Risk = node.game.risk;
            node.set('initEndow', initEndow);
            node.game.pgCounter = 0;
            node.done();
        }
    }

    /**
     * ## EconGrowthAndRisk
     *
     * the economic growth and corresponding climate risk is chosen randomly by the computer
     *
     * TODO: should be moved on the server.
     */
    function EconGrowthAndRisk() {
        var initEndow = {
            playerID: { Player_ID: node.player.id },
            addEndow: { 
                Initial_Endowment: node.game.endowment_own,
                Climate_Risk: node.game.risk
            }
        };
        // randomly assigned value of historical growth between 5 and 100
        var endowment_assigned = Math.floor((Math.random() * 96) + 1) + 4;
        // assign the historical responsibility
        if (endowment_assigned >= 5 && endowment_assigned < 25) {
            node.game.risk += 0;
        }
        else if (endowment_assigned >= 25 && endowment_assigned <= 50) {
            node.game.risk += (Math.floor(Math.random() * 5)) * 2.5;
        }
        else if (endowment_assigned > 50 && endowment_assigned <= 75) {
            node.game.risk += ((Math.floor(Math.random() * 5)) * 2.5) + 12.5;
        }
        else if (endowment_assigned > 75 && endowment_assigned <= 100) {
            node.game.risk += 25;
        }
        initEndow.addEndow.Initial_Endowment = node.game.endowment_own + endowment_assigned;
        node.game.endowment_own += endowment_assigned;
        initEndow.addEndow.Climate_Risk = node.game.risk;
        node.set('initEndow', initEndow);
        node.done();
    }

    return true;
}
