/**
 * # Channel settings
 * Copyright(c) 2015 {AUTHOR} <{AUTHOR_EMAIL}>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */
module.exports = {

    // By default the name of the game in the package.json file
    // is the name of the channel. Here you can add aliases.
    // alias: []

    // The channel is divided into two internal servers: player and admin.
    // Each of those grants different privileges upon connection.
    //
    // The options for player and admin server are specified by the
    // `playerServer` and `adminServer` properties here.
    
    // If they share the same options, then just  a string with
    // the name of the two different connection endpoints must be specified.

    // If different options apply to each server, they must be specified
    // as objects, with the name of the _endpoint_ specified as a key.

    // Name of the endpoint for socket.io player connections
    playerServer: '{NAME}',

    // Name of the endpoint for the socket.io admin connections
    adminServer: '{ADMIN}',

    // All options below are shared by player and admin servers.

    // Default verbosity for node instances running in the channel,
    // e.g.: logics, bots, etc.
    verbosity: 100,

    // If TRUE, players can invoke GET commands on admins.
    getFromAdmins: true,

    // Unauthorized clients will be redirected here.
    // (defaults: "/pages/accessdenied.htm")
    accessDeniedUrl: 'unauth.htm',
    
    // When players 
    notify: {
        
        onConnect: false,

        onStageUpdate: true,

        // A client changes stageLevel (e.g. INIT, CALLBACK_EXECUTED);
        onStageLevelUpdate: true,

        onStageLoadedUpdate: false
    },

    enableReconnections: true

};
