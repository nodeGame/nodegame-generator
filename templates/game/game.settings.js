/**
 * # Game settings definition file
 * Copyright(c) {YEAR} {AUTHOR} <{AUTHOR_EMAIL}>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */
module.exports = {

    // Variables shared by all treatments.

    REPEAT: 4,

    timer: {
        instructions: 180000, // 3 minutes
        game: 20000
        questionnaire: 3000
    },

    // Treatments definition.

    // They can contain any number of properties, and also overwrite
    // those defined above.

    treatments: {

        sa: {
            fullName: "Self Assigned 30",
            description:
            "Players assign the historical responsibility themselves",
            gameName: '/burdenHR/'
        },

        ra: {
            fullName: "Randomly Assigned 30",
            description:
            "Players get the historical responsibility assigned randomly",
            gameName: '/burdenRAHR/'
        },

    }
};
