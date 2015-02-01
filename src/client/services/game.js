/**
 * Created by john on 1/22/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     * @constructor
     */
    function Game($rootScope, $state, eventLoop, utils, party, actions, resources, locations, upgrades) {

        var self = this;

        eventLoop.onTick($rootScope, function (args) {
            actions.processTick(self);
            upgrades.processTick(self);
            locations.processTick(self);
        });


        locations.changeLocation('town')();
        locations.current().map.exploredPct = 1;    // nothing to explore in the town for now

        /////////////////////////////////////////////////////////

        this.id = "Game";
        this.explore = explore;
        this.isInBattle = isInBattle;
        this.location = currentLocation;
        this.party = party.characters;
        this.resources = availableResources;
        this.updateResource = updateResource;
        this.upgrades = upgrades.upgradeDefinitions;


        /////////////////////////////////////////////////////////

        function availableResources() {
            return _.filter(resources, 'visible');
        }


        function currentLocation() {
            return locations.current();
        }


        function explore() {
            locations.explore();
        }


        function isInBattle() {
            return $state.current.name === 'main.battle';
        }


        function updateResource(resource, amount, max) {
            var res = resources[resource];
            if (!res) {
                res = {name: resource, current: 0, max: max, visible: true};
                resources[resource] = res;
            }
            if (res.max) {
                res.current = utils.clamp(res.current + amount, 0, res.max);
            } else {
                res.current += amount;
            }
        }
    }

    angular.module('game')
        .service('game', Game);

})();
