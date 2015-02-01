/**
 * Created by john on 1/28/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     * @constructor
     */
    function BattleController($state, $scope, statusMessages, locations) {
        var battle = $state.params.battle,
            promise = $state.params.promise,
            prevState = $state.previous || 'main.actions',
            self = this;


        var tick = 0;
        var xp = 0;
        var results = null;

        this.enemies = battle.enemies;
        this.messages = battle.messages;
        //
        //eventLoop.onTick($scope, function (args) {
        //    tick++;
        //
        //    if (tick % 3 === 0) {
        //        if (results === null) {
        //            results = battle.processRound();
        //        }
        //        var res = results.shift();
        //        self.messages.unshift(res);
        //
        //        if (res.xp && res.xp > 0) {
        //            xp += res.xp;
        //        }
        //        if (results.length === 0 || res.victory) {
        //            results = null;
        //        }
        //
        //        if (res.victory) {
        //            results = null;
        //            promise.resolve({
        //                xp: xp
        //            });
        //            statusMessages.message("You are victorious and gain " + xp + " xp.");
        //            $state.go(prevState || 'main.actions');
        //        } else if (res.defeat) {
        //            results = null;
        //            promise.resolve({
        //                xp: 0
        //            });
        //            promise = null;
        //            statusMessages.message("You have been defeated.");
        //            $state.go(prevState || 'main.actions');
        //        }
        //    }
        //});

    }

    angular.module('game')
        .controller('BattleController', BattleController);

})();