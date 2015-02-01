/**
 * Created by john on 1/24/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     */
    function Upgrades(resources, actions) {

        var self = this;

        this.buyUpgrade = buyUpgrade;
        this.canBuy = canBuy;
        this.processTick = processTick;
        this.upgradeDefinitions = {

            fastExplore: {
                text: 'Perception',
                description: 'Allows you to explore faster (1.2x speed)',
                active: false,
                available: true,
                requires: {
                    xp: 20
                }
            },


            autoMap: {
                text: 'Cartographer',
                description: 'Prevents you from getting lost.',
                active: false,
                available: true,
                requires: {
                    xp: 75
                }
            },


            autoGather: {
                text: 'Auto-gather',
                description: 'Automatically gathers herbs when you are in an area that has them.',
                active: false,
                checkAvailable: function () {
                    return resources.herbs && resources.herbs.current > 1;
                },
                requires: {
                    herbs: 10
                }
            },


            autoExplore: {
                text: 'Auto-explore',
                description: 'Automatically explores an area, stopping when hit points get low.',
                active: false,
                checkAvailable: function () {
                    return true;
                },
                requires: {
                    xp: 2.00
                }
            }
        };

        ////////////////////////////////////////////////

        function processTick(game) {
            // do stuff that should happen every tick, depending on the upgrades

            checkForAvailable();

            if (!game.isInBattle()) {
                // only do this stuff if we're not fighting anybody
                //doAutoExplore(game);
            }
        }

        function doAutoExplore(game) {
            if (self.upgradeDefinitions.autoExplore.active && !game.isInBattle()) {
                var action = actions.actionDefinitions.explore;
                actions.doAction(game, action);
            }
        }

        function canBuy(upgrade) {
            if (upgrade.requires) {
                var can = true;
                for (var resource in upgrade.requires) {
                    if (upgrade.requires.hasOwnProperty(resource)) {
                        if (!resources[resource] || resources[resource].current < upgrade.requires[resource]) {
                            can = false;
                        }
                    }
                }
                return can;

            } else {
                return false;
            }
        }

        function checkForAvailable() {
            angular.forEach(self.upgradeDefinitions, function (upgrade) {
                if (!upgrade.active) {
                    if (upgrade.checkAvailable) {
                        if (upgrade.checkAvailable()) {
                            // once it's available, it always is
                            upgrade.checkAvailable = null;
                            upgrade.available = true;
                        }
                    }
                    if (upgrade.available) {
                        // check if we can purchase it
                        upgrade.canPurchase = canBuy(upgrade);
                    }
                }
            });
        }

        function buyUpgrade(upgrade) {
            if (canBuy(upgrade)) {
                for (var resource in upgrade.requires) {
                    if (upgrade.requires.hasOwnProperty(resource)) {
                        resources[resource].current -= upgrade.requires[resource];
                    }
                }
                upgrade.active = true;  //todo: need to account for upgrades with multiple levels
            }
        }


    }

    angular.module('game')
        .service('upgrades', Upgrades);

})();