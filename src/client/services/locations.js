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

    function generateTickFunction(config, intervalInSeconds, handler) {
        var tick = 0;
        var intervalInTicks = intervalInSeconds * config.ticksPerSecond;
        return function (game) {
            tick++;
            if (tick >= intervalInTicks) {
                tick = 0;
                handler(game);
            }
        };
    }


    /**
     * @ngInject
     * @constructor
     */
    function Locations($state, $q, config, statusMessages, actions, Map) {

        var self = this,
            actionDefs = actions.actionDefinitions,
            currentLocation;

        this.canChangeLocation = true;
        this.changeLocation = changeLocation;
        this.current = getCurrentLocation;
        this.explore = explore;
        this.locations = createLocations();
        this.processTick = processTick;
        this.toggleCanChangeLocation = toggleCanChangeLocation;

        ////////////////////////////////////////////////

        function changeLocation(newLocation, message) {
            return function () {
                if (self.canChangeLocation) {
                    var newLoc = _.findWhere(self.locations, {id: newLocation});
                    if (newLoc !== currentLocation) {
                        actions.cancelActiveActions();
                        currentLocation = newLoc;
                        currentLocation.discovered = true;
                        statusMessages.message(message);

                    } else {
                        statusMessages.message("You are already there.");
                    }

                } else {
                    statusMessages.message("Cannot travel at this time");
                }
            };
        }

        function createLocations() {
            return [

                {
                    id: 'town',
                    name: 'Town',
                    map: new Map({level: 1, floorCount: 1, roomCount: 1}),
                    discovered: true,
                    onTick: generateTickFunction(config, config.secondsToHealInTown, function (game) {
                        var party = game.party;
                        var healAmount = 1;

                        for (var i = 0; i < party.length; i++) {
                            party[i].heal(healAmount);
                        }
                    }),
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
                    herbs: [
                        {name: 'Mushrooms', pct: 1}
                    ],
                    actions: [
                        {
                            text: 'Return to town',
                            action: changeLocation('town', 'You return to the town.')
                        },
                        actionDefs.explore,
                        actionDefs.gatherHerbs,
                        {
                            text: 'Enter dungeon',
                            hidden: true,
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
                    discovered: false,
                    treasure: [
                        {name: 'gold', pct: 1}
                    ],
                    actions: [
                        {
                            text: 'Exit the dungeon',
                            action: changeLocation('forest', 'You climb back out to the forest.')
                        }
                    ]
                }
            ];
        }


        function explore() {
            var map = currentLocation.map;
            if (map) map.explore(self);
        }

        function getCurrentLocation() {
            return currentLocation;
        }

        function processTick(game) {
            if (currentLocation.onTick) {
                currentLocation.onTick(game);
            }
        }

        function toggleCanChangeLocation(canChange) {
            self.canChangeLocation = canChange;
        }
    }

    angular.module('game')
        .service('locations', Locations);
})();