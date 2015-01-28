/**
 * Created by john on 1/23/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     * @param party
     * @param statusMessages
     * @constructor
     */
    function Actions($q, party, statusMessages) {

        var self = this;

        this.actionDefinitions = {

            explore: {
                text: 'Explore',
                pctComplete: 0,
                speed: 0.2,
                onStart: function () {

                },
                onComplete: function (game) {
                    game.locations.explore();
                }
            }

        };
        this.doAction = doAction;
        this.processTick = processTick;


        ////////////////////////////

        function doAction(game, action) {
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

        function processTick() {
            angular.forEach(self.actionDefinitions, function (action) {
                if (action.pctComplete < 1 && action.running) {
                    action.pctComplete += action.speed;
                } else {
                    if (action.deferred) {
                        action.deferred.resolve({});
                        action.deferred = null;
                        action.running = false;
                    }
                }
            });
        }
    }

    angular.module('game')
        .service('actions', Actions);
})();