/**
 * # Game settings
 * Copyright(c) {YEAR} {AUTHOR} <{AUTHOR_EMAIL}>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */
module.exports = {

    // Variables commons to all treatments.

    REPEAT: 4,

    timer: {
        instructions: 180000, // 3 minutes
        game: 20000
        questionnaire: 3000
    },

    debug: true,

    // Treatments.

    treatments: {

        treatment1: {
            name: "treatment1",
            fullName: "Full name treatment 1",
            description: "Treatment 1 description",

            // Additional variables as needed.

        },

        treatment2: {
            name: "treatment2",
            fullName: "Full name treatment 2",
            description: "Treatment 2 description",

            // Additional variables as needed.

        },
    }
};
