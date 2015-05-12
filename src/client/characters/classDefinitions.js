/**
 * Created by john on 2/16/15.
 */
(function () {

    'use strict';

    var defaultDefinition = {
        hp: 1,
        minStats: {},
        wizardSpells: {
            minLevels: [0, 0, 0, 0, 0, 0, 0],
            perLevel: [0, 0, 0, 0, 0, 0, 0]
        },
        priestSpells: {
            minLevels: [0, 0, 0, 0, 0, 0, 0],
            perLevel: [0, 0, 0, 0, 0, 0, 0]
        }
    };

    /**
     * @ngInject
     */
    function classDefinitions() {

        var definitions = {

            'fighter': angular.extend({}, defaultDefinition, {
                hp: 10,
                minStats: {
                    str: 10
                }
            }),

            'wizard': angular.extend({}, defaultDefinition, {
                hp: 4,
                minStats: {
                    int: 12
                },
                wizardSpells: {
                    minLevels: [1, 3, 4, 8, 15, 30, 60],
                    perLevel: [0.5, 0.5, 0.5, 0.5, 0.5, 0.25, 0.25]
                }
            }),

            'priest': {
                hp: 6,
                minStats: {
                    con: 4,
                    wis: 12
                }
            },

            'archer': {
                hp: 8,
                minStats: {
                    dex: 14,
                    str: 8
                }
            },

            'berserker': {},

            'monk': {}
        };

        return definitions;
    }

    angular.module('game')
        .factory('classDefinitions', classDefinitions);

})();