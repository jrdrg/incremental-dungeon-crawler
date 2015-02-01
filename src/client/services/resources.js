/**
 * Created by john on 1/25/15.
 */
(function () {

    'use strict';

    function resources() {

        return {
            xp: {
                name: 'XP',
                visible: true,
                current: 0
            },

            food: {
                name: 'Food',
                visible: true,
                current: 0,
                max: 1000
            },

            gold: {
                name: 'Gold',
                visible: true,
                current: 0
            },

            iron: {
                name: 'Iron',
                current: 0,
                max: 100
            }
        };
    }

    angular.module('game')
        .factory('resources', resources);

})();