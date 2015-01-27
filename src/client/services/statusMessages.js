/**
 * Created by john on 1/26/15.
 */
(function () {

    'use strict';

    var STATUS_MESSAGE = "game:statusMessage";

    /**
     * @ngInject
     * @constructor
     */
    function StatusMessages($rootScope) {

        this.message = message;
        this.onMessage = onMessage;

        function message(status) {
            $rootScope.$broadcast(STATUS_MESSAGE, {message: status});
        }

        function onMessage(scope, handler) {
            scope.$on(STATUS_MESSAGE, function (e, args) {
                handler(args);
            });
        }
    }

    angular.module('game')
        .service('statusMessages', StatusMessages);
})();