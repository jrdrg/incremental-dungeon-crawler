/**
 * Created by john on 1/22/15.
 */
(function () {

    'use strict';

    var TICK = "event:tick";

    /**
     * @ngInject
     */
    function EventLoop($rootScope, $interval, config) {

        this.onTick = onTick;

        //////////////////////////////////////////////

        var timer = $interval(function () {
            tick();
        }, 1000 / config.ticksPerSecond);

        $rootScope.$on('$destroy', function () {
            $interval.cancel(timer);
        });

        //////////////////////////////////////////////

        function onTick(scope, handler) {
            return scope.$on(TICK, function (e, args) {
                handler(args);
            });
        }

        function tick() {
            $rootScope.$broadcast(TICK, {});
        }
    }

    angular.module('game')
        .service('eventLoop', EventLoop);

})();