/**
 * Created by john on 1/25/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     * @returns {Function}
     */
    function battleFactory($rootScope, $state, $q, eventLoop, statusMessages, Enemy, party, resources, upgrades) {

        return function Battle(locations, args) {
            var prevState = 'main.actions';

            var self = this,
                enemies = createEnemies();

            var tick = 0,
                deferred,
                handler,
                currentChar,
                currentTurnOrder,
                xp = 0;

            this.begin = begin;
            this.enemies = enemies;
            this.messages = [];

            handler = eventLoop.onTick($rootScope, tickHandler);

            /////////////////////////////////////

            function begin() {
                var xp = resources.xp;
                fight().then(function (result) {
                    xp.current += result.xp;
                    xp = null;
                });
            }


            function createEnemies() {
                var numEnemies = Math.ceil(Math.random() * 5);
                var enemies = [];
                for (var i = 0; i < numEnemies; i++) {
                    enemies.push(new Enemy(args.level || 1));
                }
                return enemies;
            }


            function fight() {
                if (!deferred) {
                    deferred = $q.defer();
                    $state.go('main.battle', {
                        battle: self,
                        promise: deferred
                    });
                }
                return deferred.promise;
            }


            function onComplete(message) {
                statusMessages.message(message);
                handler();
                console.log("scope destroyed");
                $state.go(prevState || 'main.actions');
            }


            function processResult(result) {
                result = result || {};

                self.messages.unshift(result);
                xp += result.xp || 0;

                if (result.victory) {
                    deferred.resolve({
                        xp: xp
                    });
                    onComplete("You are victorious and gain " + xp + " xp.");

                } else if (result.defeat) {
                    deferred.resolve({
                        xp: 0
                    });
                    onComplete("You have been defeated.");
                }

                return result.victory || result.defeat;
            }


            function processTurn(turn) {
                var result,
                    actor = currentTurnOrder[turn];

                if (!actor.isDead()) {
                    if (actor instanceof Enemy) {
                        result = actor.attack(party.characters);
                    } else {
                        result = actor.attack(enemies);
                    }
                }
                return processResult(result);
            }


            function tickHandler(args) {
                tick++;

                if (currentTurnOrder) {

                    if (tick % 3 === 0) {
                        processTurn(currentChar);
                        currentChar++;

                        if (currentChar >= currentTurnOrder.length) {
                            currentTurnOrder = null;
                        }
                    }

                } else {
                    currentTurnOrder = _.sortBy(party.characters.concat(enemies), 'speed');
                    currentChar = 0;
                }

            }
        };
    }

    angular.module('game')
        .factory('Battle', battleFactory);

})();