/**
 * # Functions used by the Logic and Client of Burden-share Game
 * Copyright(c) 2015 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 */

module.exports = {
    round: require('./logic.callbacks').round,

    // Stages callbacks.
    instructions: require('./client.instructions'),
    init: require('./client.init'),
    initialSituation: require('./client.initialSituation'),
    decision: require('./client.decision'),
    questionnaire: require('./client.quest'),

    // Helper - high-level.
    clearFrame: clearFrame,
    syncGroup: syncGroup,

    // Helper - Check Data.
    checkID: checkID,
    checkEntry: checkEntry,

    // Helper - DOM write.
    buildTables: buildTables,
    writeOfferAccepted: writeOfferAccepted,
    writeOfferRejected: writeOfferRejected,
    writeCatastrophe: writeCatastrophe,
    writeNoCatastrophe: writeNoCatastrophe,
    writeRoundResults: writeRoundResults,

    // Questionnaire.
    makeChoiceTD: makeChoiceTD,
    makeChoiceTDRow: makeChoiceTDRow,
    makeChoiceSPAN: makeChoiceSPAN,
    makeChoiceSELECT: makeChoiceSELECT

};

function clearFrame() {
    node.emit('INPUT_DISABLE');
    return true;
}

function syncGroup(stage, myStageLevel, pl, game) {
    var p = node.game.pl.get(node.game.otherID);
    if (p.stageLevel === node.constants.stageLevels.DONE) {
        if (myStageLevel === node.constants.stageLevels.DONE) {
            return true;
        }
    }
}

function writeOfferAccepted() {

    var result1, result2;
    result1 = W.getElementById('result1');
    result2 = W.getElementById('result2');

    var propOffer = W.getElementById('propOffer');
    W.write(node.game.offer, propOffer);
    var resp = node.game.costGE - node.game.offer;
    node.game.respPay =  resp.toString();
    if (node.player.stage.round !== 1) {
        W.sprintf('You have %strongaccepted%strong the offer.', {
            '%strong': {}
        }, result1);
        W.write('You have successfully reached an agreement against global warming.', result2);
    }
    node.game.decision =  'Accept';
    node.game.agreement =  'Yes';
    node.game.catastrophe =  'No';
    var respDecision = W.getElementById('respDecision');
    node.game.decision =  'Accept';
    W.write('Accept',respDecision);
    var remain = node.game.endowment_own - resp;
    if (remain < 0) remain = 0;
    node.game.remainResp = remain.toString();
    node.game.remainNum = remain;
    var remainResp = W.getElementById('remainResp');
    W.write(remain,remainResp);
    remProp = node.game.endowment_responder - node.game.offer;
    if (remProp < 0) remProp = 0;
    var remainProp = W.getElementById('remainProp');
    W.write(remProp, remainProp);

}

function writeCatastrophe() {
    if (node.player.stage.round !== 1) {
        W.sprintf('A %strongclimate catastrophe has happened%strong and ' +
                  ' destroyed a part of your endowment.', null,
                  W.getElementById('result3'));
    }
    var remainProp = W.getElementById('remainProp');
    W.write(node.game.endowment_responder / 2, remainProp);

}

function writeNoCatastrophe() {
    if (node.player.stage.round !== 1) {
        W.sprintf('However, %strongno climate catastrophe%strong has happened.', {
            '%strong': {}
        }, W.getElementById('result3'));
    }
    var remainProp = W.getElementById('remainProp');
    W.write(node.game.endowment_responder, remainProp);
}

function writeOfferRejected() {
    var result1, result2, id;

    if (node.game.catastrophe ===  'Yes') {
        id = '';
        node.game.remainResp = node.game.endowment_own / 2;
        node.game.globals.writeCatastrophe();
    }
    else {
        id = 'No';
        node.game.remainResp = node.game.endowment_own;
        node.game.globals.writeNoCatastrophe();
    }

    if (node.player.stage.round !== 1) {
        result1 = W.getElementById('result1');
        result2 = W.getElementById('result2');

        // W.write('You have rejected the offer.', result1);
        W.sprintf('You have %strongrejected%strong the offer.', {
            '%strong': {}
        }, result1);

        W.write('You have not been able to reach an ' +
                'agreement against global warming.', result2);
    }
    else {
        // Practice round.
        W.getElementById('practice' + id + 'Catastrophe').style.display = '';
    }


    node.game.decision =  'Reject';
    node.game.agreement =  'No';

    var respDecision = W.getElementById('respDecision');
    W.write('Reject', respDecision);


    var remainResp = W.getElementById('remainResp');
    W.write(node.game.remainResp, remainResp);
}

function buildTables() {
    // Show table with initial situation.
    var propEndow = W.getElementById('propEndow');
    var respEndow = W.getElementById('respEndow');
    var costGHGE = W.getElementById('costGHGE');
    var clRiskOwn = W.getElementById('clRiskOwn');
    var clRiskOther = W.getElementById('clRiskOther');
    var clRisk = W.getElementById('clRisk');

    // Show table with result after negatiation has been finished.
    var propOffer = W.getElementById('propOffer');
    var respToPay = W.getElementById('respToPay');
    var respDecision = W.getElementById('respDecision');
    var agreement = W.getElementById('agreement');
    var climateCatastrophe = W.getElementById('climateCatastrophe');
    var remainProp = W.getElementById('remainProp');
    var remainResp = W.getElementById('remainResp');

    var propEnd, respEnd;
    var propRemain, respRemain;

    if (node.game.role == 'PROPOSER') {
        W.write(node.game.remainProp, remainProp);

        propEnd = node.game.endowment_own;
        respEnd = node.game.endowment_responder;
    }
    // RESPONDER
    else {
        W.write(node.game.remainResp, remainResp);

        respEnd = node.game.endowment_own;
        propEnd = node.game.endowment_responder;
    }

    W.write(propEnd, propEndow);
    W.write(respEnd, respEndow);

    W.write(node.game.costGE, costGHGE);
    W.write(node.game.riskOwn, clRiskOwn);
    W.write(node.game.riskOther, clRiskOther);
    W.write(node.game.ClimateRisk, clRisk);


    W.write(node.game.offer, propOffer);
    W.write(node.game.respPay, respToPay);
    W.write(node.game.decision, respDecision);
    W.write(node.game.agreement, agreement);
    W.write(node.game.catastrophe, climateCatastrophe);
}

/**
 * ## checkEntry
 *
 * checks whether the question has been answered or not
 *
 * if not a warning message is shown
 *
 * @param {string} msg The text to be shown in the warning message window
 *
 */
function checkEntry(msg){
    bootbox.dialog({
        message: msg,
        buttons: {
            danger: {
                label: "Return to Question",
                className: "btn-danger",
                callback: function() {
                }
            },
        }
    });
}



/**
 * ## checkID
 *
 * checks whether the correct qualtrix id has been entered
 *
 * if not a warning message is shown
 *
 * @param {string} msg The text to be shown in the warning message window
 *
 */
function checkID(msg) {
    bootbox.dialog({
        message: msg,
        buttons: {
            danger: {
                label: "Return to Question",
                className: "btn-danger",
                callback: function() {
                }
            },
        }
    });
}

function writeRoundResults(data, accept, remain, who) {
    var proceed, timeDecision;

    timeDecision = who === 'PROPOSER' ?
        node.game.timeMakingOffer : node.game.timeResponse;

    node.game.results = {
        Player_ID: node.player.id,
        Current_Round: node.player.stage.round,
        GroupNumber: node.game.nbrGroup,
        Role_Of_Player: node.game.role,

        // Risk.
        riskOwn: node.game.riskOwn,
        riskOther: node.game.riskOther,
        riskGroup: (node.game.riskOwn + node.game.riskOther + 15),

        // Endow.
        endowOwn: node.game.endowment_own,
        endowOther: node.game.endowment_responder,

        // Offer.
        Offer: node.game.offer,
        questionRound: '',

        // Decision.
        Decision_Accept1_Reject0: accept,
        Decision_Response: node.game.decisionMade,
        Climate_Catastrophy: data.cc,

        Profit: remain,

        // Time.
        timeInitSitua: node.game.timeInitialSituation,
        timeDecision: timeDecision,
    };

    proceed = W.getElementById('continue');
    proceed.onclick = function() {
        node.game.timer.stop();
        this.disabled = "disabled";
        node.emit(who + '_DONE');
    };

    // AUTO-PLAY
    node.timer.randomExec(function() {
        proceed.click();
    }, 3000);
}


// Questionnaire


function makeChoiceTD(i, td) {
    var input, questionnaire, oldSelected;
    questionnaire = node.game.questionnaire;
    oldSelected = questionnaire.oldSelected;

    ++questionnaire.numberOfClicks;
    questionnaire.currentAnswer = i;
    if (oldSelected) {
        oldSelected.style.border = '1px solid black';
        oldSelected.style.background = 'white';
    }
    input = td.children[0];
    input.checked = true;
    td.style.border = '3px solid #CCC';
    td.style.background = 'yellow';
    questionnaire.oldSelected = td;
}

// i is answer to question number j.
function makeChoiceTDRow(i, j, td) {
    var input, questionnaire;
    questionnaire = node.game.questionnaire;
    oldSelected = questionnaire.oldSelected;

    if ('undefined' === typeof questionnaire.numberOfClicks['Question' + j]) {
        questionnaire.numberOfClicks["Question" + j] = 1;
    }
    else {
        questionnaire.numberOfClicks["Question" + j] += 1;
    }
    questionnaire.currentAnswer["Question" + j] = i;

    if (oldSelected[''+j]) {
        oldSelected[''+j].style.border = '1px solid black';
        oldSelected[''+j].style.background = 'white';
    }
    input = td.children[0];
    input.checked = true;
    td.style.border = '3px solid #CCC';
    td.style.background = 'yellow';
    questionnaire.oldSelected[''+j] = td;
}

function makeChoiceSPAN(i, td) {
    var input, questionnaire, oldSelected;
    questionnaire = node.game.questionnaire;
    oldSelected = questionnaire.oldSelected;

    questionnaire.numberOfClicks =
        questionnaire.numberOfClicks + 1 || 1;
    questionnaire.currentAnswer = i;

    if (oldSelected) {
        oldSelected.style['font-weight'] = 'normal';
    }

    input = td.children[0];
    input.checked = true;
    td.style['font-weight'] = 'bold';
    questionnaire.oldSelected = td;
}

function makeChoiceSELECT(i) {
    var input, questionnaire;
    questionnaire = node.game.questionnaire;
    ++questionnaire.numberOfClicks;
    if (i == 0) return;
    questionnaire.currentAnswer = i;
}