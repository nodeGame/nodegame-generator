/**
 * # Channels definition file for Ultimatum Game
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Defines two channels, one to test the requirements,
 * and one to actually play an Ultimatum game.
 *
 * http://www.nodegame.org
 * ---
 */
module.exports = [

    // Game channel.
    {
        name: 'burdenshare',

        admin: 'burdenshare/admin',

        player: 'burdenshare',

        verbosity: 100,

        // If TRUE, players can invoke GET commands on admins.
        getFromAdmins: true,

        // Unauthorized clients will be redirected here.
        // (defaults: "/pages/accessdenied.htm")
        accessDeniedUrl: '/burdenshare/unauth.htm',
       
        notify: {
            onStageUpdate: true,

            // A client changes stageLevel (e.g. INIT, CALLBACK_EXECUTED);
            onStageLevelUpdate: true,
        },

        enableReconnections: true
    }

    ,

    // Requirements channel.
    {
        name: 'requirements',

        admin: 'requirements/admin',

        player: 'requirements',

        verbosity: 100,

        getFromAdmins: true,

        waitingRoom: {
            logicPath: 'requirements.room.js',
            name: 'requirementsBurden'
        },

        notify: {
            onConnect: false,
            onStageUpdate: false,
            onStageLevelUpdate: false,
            onStageLoadedUpdate: false
        },

        enableReconnections: false

    }
];
