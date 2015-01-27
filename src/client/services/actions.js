/**
 * Created by john on 1/23/15.
 */
(function () {

    'use strict';

    function Actions(party) {

        var self = this;

        this.actionDefinitions = {

            explore: {
                pctComplete: 1,
                speed: 0.02,
                action: function (map) {
                    var exploredPct = ((Math.random() * 5) + 5) / 100;  // random pct between 5-10%

                    if (map.secretDoorPct > 0) {

                    } else {
                        map.explore();
                    }
                }
            }

        };
        this.processTick = processTick;


        ////////////////////////////

        function processTick() {
            angular.forEach(self.actionDefinitions, function (action) {
                if (action.pctComplete < 1) {
                    action.pctComplete += action.speed;
                }
            });
        }
    }

    angular.module('game')
        .service('actions', Actions);
})();