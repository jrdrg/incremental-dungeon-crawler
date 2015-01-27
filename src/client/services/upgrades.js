/**
 * Created by john on 1/24/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     */
    function Upgrades() {

        this.processTick = processTick;
        this.upgradeDefinitions = {

            automap: {
                active: false,
                available: true,
                cost: 300,
                text: 'Automap',
                description: 'Prevents you from getting lost.'
            }
        };

        ////////////////////////////////////////////////

        function processTick() {
            // do stuff that should happen every tick, depending on the upgrades
        }
    }

    angular.module('game')
        .service('upgrades', Upgrades);

})();