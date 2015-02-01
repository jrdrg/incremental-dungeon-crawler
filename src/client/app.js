/**
 * Created by john on 1/22/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     * @param $stateProvider
     * @param $urlRouterProvider
     */
    function appConfig($stateProvider, $urlRouterProvider) {

        $urlRouterProvider.otherwise('/main');

        $stateProvider
            .state('main', {
                abstract: true,
                url: '/main',
                templateUrl: '/partials/main.html',
                controller: 'MainController',
                controllerAs: 'vm'
            })

            .state('main.actions', {
                url: '',
                templateUrl: '/partials/actions.html'
            })

            .state('main.characterStatus', {
                params: {
                    character: null
                },
                templateUrl: '/partials/characterStatus.html',
                controller: 'CharacterStatusController',
                controllerAs: 'vm'
            })

            .state('main.battle', {
                params: {
                    battle: null,
                    promise: null
                },
                templateUrl: '/partials/battle.html',
                controller: 'BattleController',
                controllerAs: 'vm'
            })
        ;
    }

    angular.module('game', ['ui.router', 'ngResource'])
        .config(appConfig)
        .run(['$rootScope', '$state', function ($rootScope, $state) {
            $rootScope.$on('$stateChangeSuccess', function (event, to, toParams, from, fromParams) {
                $state.previous = from;
                $rootScope.$previousState = from;
            });
        }]);
})();