/**
 * # Functions used by the Client of Burden-share Game
 * Copyright(c) 2015 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 */

module.exports = questionnaire;

function questionnaire() {

    // Updates the bonus received from questionnaire.
    node.on.data('ADDED_QUESTIONNAIRE_BONUS', function(msg) {
        console.log("Profit Adjustment" + msg.data.oldAmountUCE +
                    "+" + msg.data.newAmountUCE);

        node.game.bonus = msg.data;
    });

    // Displays the last page.
    node.on.data("win", function(msg) {
        W.loadFrame('/burdenshare/html/ended.html', function() {
            W.writeln("Exit code: " + msg.data);
            node.game.timer.stop();
            node.game.timer.setToZero();
        });
    });

    var gameName = node.game.globals.gameName;
    var chosenTreatment = node.game.globals.chosenTreatment;
    var randomBlockExecutor;
    var socialValueOrientation, newEcologicalParadigm, risk;
    var makePageLoad, makeBlockArray;
    var Page, SVOPage, RiskPage, NEPPage, DemographicsPage;

    // The first time this stage is executed, we set all listeners and callbacks
    // We also initialize node.game.questionnaire, which is why we use it for
    // this check.
    // If questionnaire is defined, we are repeating the stage.
    if ('undefined' !== typeof node.game.questionnaire) {
        node.game.questionnaire.pageExecutor.next();
        return;
    }

    function autoPlayTD() {
        node.timer.randomExec(function() {
            var inputs, randnu;
            inputs = W.getElementsByTagName('td');
            randnu = JSUS.randomInt(-1, inputs.length-1);
            node.game.globals.makeChoiceTD(randnu, inputs[randnu]);
            W.getElementById('done').click();
        }, node.game.globals.timer.randomExec);
    }

    function autoPlayTR(offsetX, offsetY) {
        // offset allows to skip a certain number of cells from left to right.
        // For example, the first cell could be TH, and can be skipped
        // with offsetX = 1. The first row could be a title and can be
        // skipped with offsetY = 1, or leaving it undefined.
        offsetX = offsetX || 0;
        offsetY = offsetY || 1;
        node.timer.randomExec(function() {
            var randnu, i, inputs, td, trChildren, qID, curBlock;

            curBlock = node.game.questionnaire.blocks[
                node.game.questionnaire.blocks.length-1];

            inputs = W.getElementsByTagName('tr');
            // We take into account headers;
            for (i = offsetY; i < inputs.length ; ++i) {
                if (inputs[i].style.display === 'none') continue;
                trChildren = inputs[i].children.length;
                randnu = JSUS.randomInt((-1 + offsetX), (trChildren-1));
                td = inputs[i].children[randnu];

                // Ugly condition..                    
                if (curBlock === 'newEcologicalParadigm') {                
                    qID = inputs[i].id.split('Question')[1];
                }
                else {
                    qID = i - offsetX;
                }

                node.game.globals.makeChoiceTDRow((randnu-offsetX),
                                                  qID,
                                                  td);
            }
            W.getElementById('done').click();

        }, node.game.globals.timer.randomExec);
    }

    node.timer.setTimestamp("BEGIN_QUESTIONNAIRE");
    node.game.visualRound.setDisplayMode(['COUNT_UP_STAGES_TO_TOTAL',
                                          'COUNT_UP_ROUNDS_TO_TOTAL']);

    // Initializing storage.
    node.game.questionnaire = {
        blocks: [],
        SVOChoices: {length: 0},
        oldSelected: null,
        numberOfClicks: 0
    };

    randomBlockExecutor = new RandomOrderExecutor();

    // Makes a callback which loads a single questionnaire page and
    // listens to onclick of the element with id 'done', to write
    // currentAnswer to database and emit "DONE".

    makePageLoad = function(page) {
        return function() {
            page.load();
        };
    };

    Page = function(block, name) {
        this.name = block + '_' + name;
        this.html = '/burdenshare/html/questionnaire/' + block + '/' +
            name + '.html';
    };

    Page.prototype.load = function() {
        var that = this;
        W.loadFrame(this.html, function() {
            that.onLoad();
            W.getElementById('done').onclick = function() {
                that.onDone();
            };
        });
    };

    Page.prototype.onLoad = function() {
        node.timer.setTimestamp(this.name);
    };

    Page.prototype.onDone = function() {
        if (this.checkAnswer()) {
            this.onValidAnswer();
        }
        else {
            this.onInvalidAnswer();
        }
    };

    Page.prototype.checkAnswer = function() {
        return 'undefined' !== typeof node.game.questionnaire.currentAnswer;
    };

    Page.prototype.onValidAnswer = function() {
        var q = node.game.questionnaire;
        node.set('bsc_quest', {
            player:         node.player.id,
            question:       this.name,
            answer:         q.currentAnswer,
            timeElapsed:    node.timer.getTimeSince(this.name),
            clicks:         q.numberOfClicks,
            pageOrder:      q.pageExecutor.index
        });
        this.cleanUp();
    };

    Page.prototype.cleanUp = function() {
        node.game.questionnaire.currentAnswer = undefined;
        node.game.questionnaire.numberOfClicks = 0;
        node.game.questionnaire.oldSelected = null;
        node.done();
    };

    Page.prototype.onInvalidAnswer = function() {
        node.game.globals.checkID('Please select an option.');
    };

    SVOPage = function(number) {
        this.number = number;
        Page.call(this, 'socialValueOrientation', this.number);
    };

    SVOPage.prototype = Object.create(Page.prototype);
    SVOPage.prototype.constructor = SVOPage;

    SVOPage.prototype.onLoad = function() {
        node.env('auto', autoPlayTD);
        Page.prototype.onLoad.call(this);
    };

    SVOPage.prototype.onValidAnswer = function() {
        node.game.questionnaire.SVOChoices[this.number] =
            node.game.questionnaire.currentAnswer;
        node.game.questionnaire.SVOChoices.length++;
        Page.prototype.onValidAnswer.call(this);
    };

    RiskPage = function(name) {
        Page.call(this, 'risk', name);
    };

    RiskPage.prototype = Object.create(Page.prototype);
    RiskPage.prototype.constructor = RiskPage;

    RiskPage.prototype.onLoad = function() {
        // gambles has own onLoad.
        if (this.name === 'risk_charity') {
            node.env('auto', function() {
                node.timer.randomExec(function() {
                    var randnu = node.JSUS.randomInt(-1, 1000);
                    W.getElementById('offer').value = randnu;
                    W.getElementById('done').click();

                }, node.game.globals.timer.randomExec);
            });
        }
        else {
            node.env('auto', autoPlayTD);
        }
        Page.prototype.onLoad.call(this);
    };

    NEPPage = function(executor) {
        this.executor = executor;
        this.numberOfQuestions = 15;
        this.questionsPerPage = 5;
        this.questionsDone = 0;
        this.order = null;
        Page.call(this, 'newEcologicalParadigm', 'allNEP');
    };

    NEPPage.prototype = Object.create(Page.prototype);
    NEPPage.prototype.constructor = NEPPage;

    NEPPage.prototype.onLoad = function() {
        var i = 0;
        var questionsBody = W.getElementById('Questions');
        var questions = questionsBody.children;

        // Shuffle the nodes (randomly the first time).
        if (!this.order) {
            this.order = W.shuffleElements(questionsBody);
            node.game.questionnaire.currentAnswer = {};
            node.game.questionnaire.numberOfClicks = {};
            node.game.questionnaire.oldSelected = {};
        }
        else {
            W.shuffleElements(questionsBody, this.order);
        }

        // Hide some questions such that only `questionsPerPage` questions
        // remain visible.
        for (i = 0; i < this.questionsDone; ++i) {
            questions[i].style.display = 'none';
        }
        for (i = this.questionsDone + this.questionsPerPage;
             i < this.numberOfQuestions; ++i) {
            questions[i].style.display = 'none';
        }

        node.env('auto', autoPlayTR, window, [1]);

        Page.prototype.onLoad.call(this);
    };

    NEPPage.prototype.checkAnswer = function() {
        var i,
        currentAnswer = node.game.questionnaire.currentAnswer;
        for (i = 0; i < this.questionsPerPage; ++i) {
            if ('undefined' ===
                typeof currentAnswer[this.order[i + this.questionsDone]]) {
                return false;
            }
        }
        return true;
    };

    NEPPage.prototype.onValidAnswer = function() {
        this.questionsDone += this.questionsPerPage;
        if (this.questionsDone >= this.numberOfQuestions) {            
            node.set('bsc_quest',{
                player: node.player.id,
                question: this.name,
                answer: node.game.questionnaire.currentAnswer,
                timeElapsed:
                node.timer.getTimeSince(this.name),
                clicks: node.game.questionnaire.numberOfClicks,
                order: this.order
            });
            this.cleanUp();
        }
        else {
            node.done();
        }
    };

    NEPPage.prototype.cleanUp = function() {
        node.game.questionnaire.pageExecutor = this.executor;
        Page.prototype.cleanUp.call(this);
    };

    NEPPage.prototype.onInvalidAnswer = function() {
        node.game.globals.checkID(
            'Please select an option for each row.'
        );
    };

    DemographicsPage = function(name, next) {
        this.next = next;
        Page.call(this, 'demographics', name);
    };

    DemographicsPage.prototype = Object.create(Page.prototype);
    DemographicsPage.prototype.constructor = DemographicsPage;

    DemographicsPage.prototype.cleanUp = function() {
        node.game.questionnaire.pageExecutor = { next: this.next };
        Page.prototype.cleanUp.call(this);
    };

    DemographicsPage.prototype.onLoad = function() {
        if (this.name === 'demographics_education' ||
            this.name === 'demographics_gender' ||
            this.name === 'demographics_participation' ||
            this.name === 'demographics_politics') {

            node.env('auto', function() {
                node.timer.randomExec(function() {
                    var inputs, randnu;

                    inputs = W.getElementsByTagName('span');
                    randnu = JSUS.randomInt(-1, inputs.length-1);
                    node.game.globals.makeChoiceSPAN(randnu, inputs[randnu]);
                    W.getElementById('done').click();

                }, node.game.globals.timer.randomExec);
            });
        }
        else {
            node.env('auto', function() {
                node.timer.randomExec(function() {
                    var inputs, randnu;
                    inputs = W.getElementsByTagName('option');
                    // We do not want the first option.
                    var randnu = JSUS.randomInt(0, inputs.length-1);
                    node.game.globals.makeChoiceSELECT(randnu);
                    node.window.getElementById('done').click();

                }, node.game.globals.timer.randomExec);
            });
        }
        Page.prototype.onLoad.call(this);
    };

    // Callback for the Social Value Orientation block.
    // Loads all of the SVO questions in an random order.
    socialValueOrientation = function(randomBlockExecutor) {
        var randomPageExecutor = new RandomOrderExecutor();
        var callbacks = [];
        var i;

        node.game.questionnaire.blocks.push('socialValueOrientation');

        node.game.questionnaire.pageExecutor = randomPageExecutor;

        for (i = 1; i < 7; ++i) {
            callbacks[i - 1] = makePageLoad(new SVOPage(i));
        }
        randomPageExecutor.setCallbacks(callbacks);

        randomPageExecutor.setOnDone(function() {
            node.set('add_questionnaire_bonus',{
                choices: node.game.questionnaire.SVOChoices,
                player: node.player.id
            });
            randomBlockExecutor.next();
        });

        // At the beginning of the block is an instructions page.
        W.loadFrame('/burdenshare/html/questionnaire/' +
                    'socialValueOrientation/instructions.html', function() {
                        W.getElementById('done').onclick = function() {
                            randomPageExecutor.execute();
                        };
                        // AUTO-PLAY
                        node.timer.randomExec(function() {
                            W.getElementById('done').click();
                        }, 3000);

                    });
    };

    // Callback for the New Ecological Paradigm block.
    // Loads all of the NEP questions in an random order.
    newEcologicalParadigm = function(randomBlockExecutor) {
        var loadAllNEP = makePageLoad(new NEPPage(randomBlockExecutor));

        node.game.questionnaire.blocks.push('newEcologicalParadigm');

        node.game.questionnaire.pageExecutor = {
            next: loadAllNEP
        };

        // At the beginning of the block is an instructions page.
        W.loadFrame('/burdenshare/html/questionnaire/' +
                    'newEcologicalParadigm/instructions.html', function() {
                        W.getElementById('done').onclick = function() {
                            loadAllNEP();
                        };
                        // AUTO-PLAY
                        node.timer.randomExec(function() {
                            W.getElementById('done').click();
                        }, 3000);

                    });

    };

    // Callback for the Risk block.
    risk = function(randomBlockExecutor) {
        var name, names = [
            'doubleOrNothing', 'patience', 'riskTaking', 'trusting'
        ];
        var callbacks = [];
        var charityPage = new RiskPage('charity');
        var gamblesPage = new RiskPage('gambles');
        var randomPageExecutor = new RandomOrderExecutor();
        node.game.questionnaire.pageExecutor = randomPageExecutor;

        node.game.questionnaire.blocks.push('risk');

        for (name in names) {
            callbacks.push(makePageLoad(new RiskPage(names[name])));
        }

        charityPage.checkAnswer = function() {
            // Checks if the value in the textfield is an integer in [min, max].
            var max = 1000;
            var min = 0;
            var value = W.getElementById('offer').value;
            var r = parseFloat(value);
            var n = parseInt(value, 10);

            if (isNaN(n) || !isFinite(n) || (r !== n) || n < min || n > max) {
                return false;
            }
            else {
                return true;
            }
        };

        charityPage.onValidAnswer = function() {
            node.game.questionnaire.currentAnswer =
                W.getElementById('offer').value;
            node.game.questionnaire.numberOfClicks = 'NA';
            Page.prototype.onValidAnswer.call(this);
        };

        charityPage.onInvalidAnswer = function() {
            node.game.globals.checkID('Please choose a whole ' +
                                      'number between 0 and 1000');
        };

        callbacks.push(makePageLoad(charityPage));

        gamblesPage.onLoad = function() {
            node.game.questionnaire.currentAnswer = {};
            node.game.questionnaire.numberOfClicks = {};
            node.game.questionnaire.oldSelected = {};
            node.env('auto', autoPlayTR, window, [1]);
            Page.prototype.onLoad.call(this);
        };

        gamblesPage.checkAnswer = function() {
            var i, len, a;
            a = node.game.questionnaire.currentAnswer;
            i = -1, len = 6;
            for ( ; ++i < len ; ) {
                if ('undefined' === typeof a['Question' + i]) {
                    return false;
                }
            }
            return true;
        };

        gamblesPage.onInvalidAnswer = function() {
            node.game.globals.checkID('Please select an option for each row.');
        };

        // Ste: was missing.
        callbacks.push(makePageLoad(gamblesPage));

        randomPageExecutor.setCallbacks(callbacks);

        randomPageExecutor.setOnDone(function () {
            randomBlockExecutor.next();
        });
        randomPageExecutor.execute();
    };

    // Callback for the demographics block.
    // This block is NOT randomized!
    demographics = function() {
        var name, names = [
            'gender', 'education', 'dateOfBirth', 'politics', 'income',
            'occupation', 'participation'
        ];
        var i;
        var finalize = function() {
            node.set('bsc_quest', {
                player:         node.player.id,
                timeElapsed:    node.timer.getTimeSince("BEGIN_QUESTIONNAIRE"),
                blockOrder:     node.game.questionnaire.blocks
            });
            W.loadFrame('/burdenshare/html/questionnaire' +
                        '/profit_adjustment.html', function() {

                            W.getElementById('continue').onclick = function() {
                                node.game.timer.stop();
                                node.say("QUEST_DONE", "SERVER",
                                         node.game.bonus.newAmountUSD);
                            };
                            W.write(node.game.bonus.newAmountUCE,
                                    W.getElementById("amountECU")
                                   );
                            W.write(node.game.bonus.oldAmountUCE,
                                    W.getElementById("ECUfromGame")
                                   );
                            W.write(
                                node.game.bonus.newAmountUCE -
                                    node.game.bonus.oldAmountUCE,
                                W.getElementById("ECUfromQuest")
                            );
                            W.write((node.game.bonus.newAmountUSD + 1.0).toFixed(2) + ' $',
                                    W.getElementById("amountUSD")
                                   );
                            // AUTO-PLAY
                            node.timer.randomExec(function() {
                                W.getElementById('continue').click();
                            }, 3000);

                        });
        };

        var begin = new DemographicsPage(names[names.length - 1], finalize);

        node.game.questionnaire.blocks.push('demographics');

        for (i = 2; i <= names.length; ++i) {
            begin = new DemographicsPage(names[names.length - i],
                                         makePageLoad(begin));
            // Politics page.
            if (i == 4) {
                begin.onValidAnswer = function() {
                    var other, answer;
                    // If option 'other' is selected
                    if (node.game.questionnaire.currentAnswer == 5) {
                        answer = 'other';
                        other = W.getElementById('textForOther').value;
                        if (!other && Math.random() > 0.3) {
                            other = Math.random();
                        }
                        if (other) answer += ': ' + other;
                        node.game.questionnaire.currentAnswer = answer;
                    }
                    Page.prototype.onValidAnswer.call(this);
                };
            }
        }
        begin.load();
    };

    // Setup to execute the SVO, NEP and RISK block in random order, then
    // execute demographics.
    randomBlockExecutor.setCallbacks(
        [
            newEcologicalParadigm,
            socialValueOrientation,
            risk
        ]
    );
    randomBlockExecutor.setOnDone(
        demographics
    );


    function displayWin() {
        node.game.timeResult = Date.now();

        var options = {
            milliseconds:  node.game.globals.timer.questProfit,
            timeup: function() {
                node.game.timeResult =
                    Math.round(Math.abs(node.game.timeResult - Date.now())/1000);
                var timeResultProp = {
                    Player_ID : node.player.id,
                    timeResult: node.game.timeResult
                };
                questionnaire(1);
            }
        };

        node.game.timer.init(options);
        node.game.timer.updateDisplay();
        node.game.timer.start(options);

        var quest2 = W.getElementById('continue');
        quest2.onclick = function () {
            node.game.timeResult = Math.round(Math.abs(node.game.timeResult - Date.now())/1000);
            var timeResultProp = {
                Player_ID : node.player.id,
                timeResult: node.game.timeResult
            };
            node.game.timer.stop();
            questionnaire(0);
        };

        // AUTO-PLAY
        node.timer.randomExec(function() {
            quest2.click();
        }, 3000);

    }

    // Goto questionnaire.
    function questionnaire(timeout) {
        console.log("Bonus: " + node.game.bonus);

        var options = {
            milliseconds: node.game.globals.timer.questionnaire,
            timeup: function() {
                node.game.timeQuest1 = node.timer.getTimeSince('questionnaire');

                // At the moment this is not used.
                var timeResultProp = {
                    playerID : {Player_ID: node.player.id},
                    add: {timeQuest1: node.game.timeQuest1}
                };

                node.say("QUEST_DONE", "SERVER", node.game.bonus);
            },
            stopOnDone: false
        };
        node.game.timer.init(options);
        node.game.timer.updateDisplay();
        node.game.timer.start(options);

        node.timer.setTimestamp('questionnaire');

        randomBlockExecutor.execute();
    }

    // Listeners for PROFIT DATA in the very first round.
    node.on.data('PROFIT', function(msg) {
        var bonus;

        console.log(msg.text);
        console.log("Payout round: " + msg.data.Payout_Round);
        console.log("Profit: " + msg.data.Profit);

        if (msg.data.Payout_Round !== "none") {
            node.game.bonus = node.game.globals.round((msg.data.Profit/50),2);
            console.log("Bonus: " + node.game.bonus);
            W.loadFrame('/burdenshare/html/questionnaire1.html', function() {

                var round = W.getElementById("payoutRound");
                W.write(msg.data.Payout_Round , round);
                var amountUCE = W.getElementById("amountECU");
                W.write(msg.data.Profit + " ECU" , amountUCE);
                var amountUSD = W.getElementById("amountUSD");
                var profitUSD = (node.game.bonus + 1.0).toFixed(2);
                console.log("Profit" + profitUSD);
                W.write(profitUSD + " $" , amountUSD);

                displayWin();
            });
        }

        else {
            node.game.bonus = 0.0;
            W.loadFrame('/burdenshare/html/questionnaire12.html', function() {
                displayWin();
            });

            console.log('Postgame including Questionaire');
        }
    });

    // Request profit. Triggers a PROFIT message.
    node.set('get_Profit', node.player.id);
}