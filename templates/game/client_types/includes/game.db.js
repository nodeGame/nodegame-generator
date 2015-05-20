/**
 * # Open Database Connections for Game Burden-share
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Open connections to database.
 */

var Database = require('nodegame-db').Database;
var ngdb = new Database(node);
var mdb = ngdb.getLayer('MongoDB');

var node = module.parent.exports.node;

// Open the collection where the categories will be stored.
var mdbWrite_idData, mdbWrite, mdbWrite_questTime, mdbWrite_gameTime,
mdbGetProfit, mdbCheckData, mdbDelet, mdbDeletTime, mdbWriteProfit,
mdbCheckProfit, mdbgetInitEndow, mdbInstrTime;


/////////////////////////// mongoDB ///////////////////////////
// 1. Setting up database connection.
ngdb = new Database(node);

// Open the collection where the categories will be stored.
mdbWrite_idData = ngdb.getLayer('MongoDB', {
    dbName: 'burden_sharing',
    collectionName: 'bsc_idData'
});

decorateMongoObj(mdbWrite_idData);


mdbWrite = ngdb.getLayer('MongoDB', {
    dbName: 'burden_sharing',
    collectionName: 'bsc_data'
});

decorateMongoObj(mdbWrite);


mdbWrite_quest = ngdb.getLayer('MongoDB', {
    dbName: 'burden_sharing',
    collectionName: 'bsc_quest'
});

decorateMongoObj(mdbWrite_quest);


mdbWriteProfit = ngdb.getLayer('MongoDB', {
    dbName: 'burden_sharing',
    collectionName: 'bsc_profit'
});

decorateMongoObj(mdbWriteProfit);


// Connections.

// Opening the database for writing to collections.
mdbWrite.connect(function() {});
mdbWrite_idData.connect(function() {});
mdbWriteProfit.connect(function() {});
mdbWrite_quest.connect(function() {});

function decorateMongoObj(mongo) {

    mongo.update = function(msg) {
        if (!this.activeCollection) {
            this.node.err('MongoLayer.update: no active connection!');
            return false;
        }
        if (!msg.playerID || !msg.add) {
            this.node.err("MongoLayer.update: playerID or add is available !!!")
            return false;
        }
        this.activeCollection.update(msg.playerID, {$set: msg.add,});    
        return true;
    };

    mongo.updateEndow = function(msg) {
        if (!this.activeCollection) {            
            this.node.err('MongoLayer.updateEndow: no active connection!');
            return false;
        }
        this.activeCollection.update(msg.playerID, {$set: msg.addEndow,});
        return true;
    };

    mongo.deleting = function(player, round) {
        if (!this.activeCollection) {
            this.node.err('MongoLayer.deleting: no active connection!');
            return false;
        }
        this.activeCollection.remove({Player_ID: player, Current_Round: round});
        return true;
    };

    // TODO: test this method
    mongo.on = function(eventType, callback) {
        var that = this;

        this.node.events.ng.on(eventType, function(msg) {
            var data = callback(msg);

            if ('object' !== typeof data) {
                that.node.err("MongoLayer.on callback didn't return data object");
                return;
            }

            /*
              if (data.hasOwnProperty('eventType')) {
              that.node.err(
              "MongoLayer.on callback returned data with 'eventType' field");
              return;
              }
            */

            // raise error?
            data.eventType = data.eventType || eventType;
            if (msg.from) {
                data.senderID = data.senderID || msg.from;
            }

            that.store(data);
        });
    };

    mongo.getDbObj = function() {
        return this.activeDb;
    };

    mongo.getCollectionObj = function(playerID, callback) {
        if (!this.activeCollection) {
            this.node.err('MongoLayer.getCollectionObj: no active connection!');
        }
        this.activeCollection.find({
            Player_ID: playerID,
            Offer: { "$exists": true }
        },{"Profit": 1, "_id": 0}).toArray(function(err, items) {
            if (err) callback(err);
            else callback(null, items);
        });
        return true;
    };

    mongo.getInitEndow = function(playerID, callback) {
        if (!this.activeCollection) {
            this.node.err('MongoLayer.getInitEndow: no active connection!');
            return false;
        }
        this.activeCollection.find({"Player_ID": playerID }, 
                                   {"Initial_Endowment": 1, 
                                    "Climate_Risk": 1, "_id": 0}
                                  ).toArray(function(err, items) {

                                      if (err) callback(err);
                                      else { callback(null, items); }
                                  });
        return true;
    };

    mongo.checkData = function(msg, callback) {
        if (!this.activeCollection) {
            this.node.err('MongoLayer.checkData: no active connection!');
            return false;
        }
        this.activeCollection.find({
            "Player_ID": msg.Player_ID,
            "Current_Round": msg.Current_Round
        }, {
            "Current_Round": 1, 
            "_id": 0
        }).toArray(function(err, items) {
            if (err) callback(err);
            else {
                callback(null, items);
            }
        });
        return true;
    };

    mongo.checkProfit = function(playerID, callback) {
        if (!this.activeCollection) {
            this.node.err('MongoLayer.checkProfit: no active connection!');
            return false;
        }
        this.activeCollection.find({"Player_ID": playerID},
                                   {"_id": 0}).toArray(function(err, items) {
                                       if (err) callback(err);
                                       else {
                                           callback(null, items);
                                       }
                                   });
        return true;
    };
}

// Exports objects.
module.exports = {

    mdbWrite: mdbWrite,

    mdbWrite_idData: mdbWrite_idData,

    mdbWrite_quest: mdbWrite_quest,

    mdbWriteProfit: mdbWriteProfit
};
