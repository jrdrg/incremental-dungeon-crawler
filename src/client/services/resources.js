/**
 * Created by john on 1/25/15.
 */
(function () {

    'use strict';

    function resources() {

        return {
            xp: {
                name: 'xp',
                visible: true,
                current: 0
            },

            food: {
                name: 'food',
                visible: true,
                current: 0,
                max: 1000
            },

            gold: {
                name: 'gold',
                visible: true,
                current: 0
            },

            iron: {
                name: 'iron',
                current: 0,
                max: 100
            }
        };
    }

    angular.module('game')
        .factory('resources', resources);

})
();