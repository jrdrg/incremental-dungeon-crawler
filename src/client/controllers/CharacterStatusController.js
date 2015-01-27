/**
 * Created by john on 1/27/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     * @constructor
     */
    function CharacterStatusController($state) {
        var character = $state.params.character;

        this.character = character;
        this.goBack = goBack;

        ///////////////////////

        function goBack() {
            $state.go('main.actions');
        }

    }

    angular.module('game')
        .controller('CharacterStatusController', CharacterStatusController);

})();