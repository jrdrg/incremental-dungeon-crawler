/**
 * Created by john on 1/23/15.
 */
(function () {

    'use strict';


    /**
     * @ngInject
     */
    function timerBarDirective(eventLoop, config) {

        return {
            restrict: 'AE',

            replace: true,

            template: '<div class="timer-bar-button"><a class="timer-bar-text" ng-click="countdown()">{{label}}</a> <div class="timer-bar"></div></div>',

            scope: {
                label: '@',
                speed: '=',
                onClick: '&?',
                onCompleted: '&'
            },

            link: function (scope, elem, attr) {
                if (!scope.speed) throw new Error('speed not defined');
                if (!scope.onCompleted) throw new Error('onCompleted not defined');

                var increasePerTick = scope.speed / config.ticksPerSecond;
                var bar = angular.element(elem.children()[1]).append('<div class="timer-bar-progress"></div>');
                var progress = angular.element(bar.children()[0]);

                eventLoop.onTick(scope, function (args) {
                    if (scope.percentage < 1 && scope.waiting) {
                        scope.percentage = Math.min(1, scope.percentage + increasePerTick);
                    } else {
                        if (scope.waiting) {
                            progress.addClass('timer-bar-complete');
                            scope.waiting = false;
                            scope.percentage = 0;
                            scope.onCompleted();
                        }
                    }
                    progress.css('width', (scope.percentage * 100) + '%');
                });

                progress.css('width', '0%');
                bar.css('background-color', 'black');

                scope.countdown = countdown;
                scope.percentage = 0;

                /////////////////////////////////////

                function countdown() {
                    if (!scope.waiting) {
                        if (scope.onClick) {
                            scope.onClick();
                        }
                        scope.percentage = 0;
                        scope.waiting = true;
                        progress.removeClass('timer-bar-complete');
                    }
                }
            }
        };
    }

    angular.module('game')
        .directive('timerBar', timerBarDirective);

})();