function syncGroupStage() {
    
    // Getting the player ID of the other player and the group number
    // depending on whether this player is the proposer or the responder
    // in the current round.
    node.on.data("PROPOSER", function(msg) {
        node.game.role = "PROPOSER";
        node.game.otherID = msg.data.respondent;
        node.game.nbrGroup = msg.data.groupR;
        node.done();
    });
    
    node.on.data("RESPONDENT", function(msg) {
        node.game.role = "RESPONDENT";
        node.game.otherID = msg.data.proposer;
        node.game.nbrGroup = msg.data.groupP;
        node.done();
    });
    
    node.socket.send(node.msg.create({
        to: 'ALL',
        text: 'Round_Over',
        data: node.player.stage.round
    }));
}