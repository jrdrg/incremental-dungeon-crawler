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

    }

    angular.module('game')
        .controller('BattleController', BattleController);

})();