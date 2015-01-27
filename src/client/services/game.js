/**
 * Created by john on 1/22/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     * @constructor
     */
    function Game($rootScope, eventLoop, party, actions, resources, locations, upgrades) {

        eventLoop.onTick($rootScope, function (args) {
            console.log("tick");

            actions.processTick();
            upgrades.processTick();
        });


        locations.changeLocation('town')();
        locations.explore();

        /////////////////////////////////////////////////////////

        this.party = party.characters;
        this.actionSpeed = {
            explore: 1,
            gather: 1
        };
        this.location = currentLocation;
        this.resources = availableResources;


        /////////////////////////////////////////////////////////

        function availableResources() {
            var filtered = _.filter(resources, 'visible');
            return filtered;
        }

        function currentLocation() {
            return locations.current();
        }

    }

    angular.module('game')
        .service('game', Game);

})();
