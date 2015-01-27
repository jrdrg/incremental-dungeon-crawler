/**
 * Created by john on 1/26/15.
 */
(function () {

    'use strict';

    function bindAction(action, toObject) {
        return function () {
            action(toObject);
        };
    }

    /**
     * @ngInject
     * @constructor
     */
    function Locations($state, $q, actions, statusMessages, Map) {

        var self = this,
            loc;

        this.changeLocation = changeLocation;
        this.current = currentLocation;
        this.explore = explore;
        this.locations = [

            {
                id: 'town',
                name: 'Town',
                map: new Map({level: 1, floorCount: 1, roomCount: 1}),
                discovered: true,
                actions: [
                    {
                        text: 'Inn',
                        action: function () {
                            // go to the inn
                            statusMessages.message("Can't go to the inn yet...");
                        }
                    },
                    {
                        text: 'Supplies',
                        action: function () {
                            // go to the store
                        }
                    },
                    {
                        text: 'Leave town',
                        action: changeLocation('forest', 'You leave town and enter the forest.')
                    }
                ]
            },


            {
                id: 'forest',
                name: 'Forest',
                map: new Map({level: 1, floorCount: 1, roomCount: 600 + (Math.random() * 100)}),
                discovered: false,
                treasure: [
                    {name: 'gold', pct: 1}
                ],
                actions: [
                    {
                        text: 'Return to town',
                        action: changeLocation('town', 'You return to the town.')
                    },
                    {
                        text: 'Explore',
                        action: function () {
                            // explore
                            self.explore();
                        }
                    },
                    {
                        text: 'Gather herbs',
                        action: function () {
                            // gather some herbs
                        }
                    },
                    {
                        text: 'Enter dungeon',
                        explorePct: 0.4,
                        message: 'You discovered the starting dungeon!',
                        action: changeLocation('startingDungeon', 'You enter the dungeon.')
                    }
                ]
            },


            {
                id: 'startingDungeon',
                name: 'Starting Dungeon',
                map: new Map({level: 1, floorCount: 10, roomCount: 100}),
                discovered: false
            }
        ];

        ////////////////////////////////////////////////

        function changeLocation(newLocation, message) {
            return function () {
                loc = _.findWhere(self.locations, {id: newLocation});
                statusMessages.message(message);
            };
        }

        function currentLocation() {
            return loc;
        }

        function explore() {
            var map = loc.map;
            map.explore(loc);
        }
    }

    angular.module('game')
        .service('locations', Locations);
})();