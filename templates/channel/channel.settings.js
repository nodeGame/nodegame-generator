/**
 * # Channels definition file
 * Copyright(c) 2015 {AUTHOR} <{AUTHOR_EMAIL}>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */
module.exports = [

    // Game channel.
    {
        name: '{NAME}',

        player: '{NAME}',

        admin: '{ADMIN}',
        
        // Add channel aliases as needed.
        // alias: []

        verbosity: 100,

        // If TRUE, players can invoke GET commands on admins.
        getFromAdmins: true,

        // Unauthorized clients will be redirected here.
        // (defaults: "/pages/accessdenied.htm")
        accessDeniedUrl: 'unauth.htm',
       
        notify: {
            
            onConnect: false,

            onStageUpdate: true,

            // A client changes stageLevel (e.g. INIT, CALLBACK_EXECUTED);
            onStageLevelUpdate: true,

            onStageLoadedUpdate: false
        },

        enableReconnections: true
    }

    // Other channels as needed.
        
];
