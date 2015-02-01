/**
 * Created by john on 1/23/15.
 */
(function () {

    'use strict';

    var defaults = {
        running: false,
        automated: false,
        pctComplete: 0,
        onStart: angular.noop,
        automateUpgrade: null
    };

    /**
     * @ngInject
     * @param party
     * @param statusMessages
     * @constructor
     */
    function Actions($q, utils, party, statusMessages) {

        var self = this;

        this.actionDefinitions = createDefinitions();
        this.canAutomate = canAutomate;
        this.cancelActiveActions = cancelActiveActions;
        this.doAction = doAction;
        this.processTick = processTick;


        ////////////////////////////

        function createDefinitions() {
            return {

                explore: angular.extend({}, defaults, {
                    text: 'Explore',
                    speed: 0.12,
                    onComplete: function (game) {
                        game.explore();
                    },
                    automateUpgrade: 'autoExplore'
                }),

                gatherHerbs: angular.extend({}, defaults, {
                    text: 'Gather herbs',
                    speed: 0.1,
                    onComplete: function (game) {
                        if (game.location().herbs) {
                            var amount = Math.floor(Math.random() * 5);
                            game.updateResource('herbs', amount);
                            statusMessages.message("You find " + (amount > 0 ? amount : 'no') + " herbs.");
                        }
                    },
                    automateUpgrade: 'autoGather'
                })

            };
        }


        /**
         * @description     Returns true if the appropriate upgrade has been purchased to automate this action.
         * @param action
         * @param upgrades
         */
        function canAutomate(action, upgrades) {
            if (action.automateUpgrade) {
                return upgrades[action.automateUpgrade].active;
            }
            return false;
        }


        function cancelActiveActions() {
            angular.forEach(self.actionDefinitions, function (action) {
                if (action.running) {
                    action.pctComplete = 0;
                    action.running = false;

                    if (action.deferred) {
                        var deferred = action.deferred;
                        action.deferred = null;
                        deferred.reject('canceled');
                    }
                }
            });
        }


        /**
         *
         * @param game
         * @param action
         */
        function doAction(game, action) {
            if (game.id !== "Game")
                throw "Invalid [game] parameter";

            if (!action.running) {
                action.pctComplete = 0;
                action.running = true;
                action.deferred = $q.defer();

                action.deferred.promise.then(function (resolved) {
                    action.onComplete(game);
                    action.pctComplete = 0;
                });
            }
        }


        /**
         *
         * @param action
         * @returns {boolean|CSSStyleDeclaration.running|defaults.running|running}
         */
        function isRunning(action) {
            return action.running;
        }


        function processTick(game) {
            angular.forEach(self.actionDefinitions, function (action) {
                if (action.pctComplete < 1 && isRunning(action)) {
                    action.pctComplete = utils.clamp(action.pctComplete + action.speed, 0, 1);
                } else {
                    if (action.deferred) {
                        action.deferred.resolve({});
                        action.deferred = null;
                        toggleState(action, false);

                    } else {

                        if (action.automated && !game.isInBattle()) {
                            doAction(game, action);
                        }

                    }
                }
            });
        }


        /**
         *
         * @param action
         * @param running
         */
        function toggleState(action, running) {
            action.running = running;
        }
    }

    angular.module('game')
        .service('actions', Actions);
})();