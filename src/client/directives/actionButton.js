/**
 * Created by john on 1/27/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     */
    function actionButtonDirective(eventLoop, config, actions, game) {

        return {
            restrict: 'AE',

            scope: {
                action: '='
            },

            template: "<div class='action-bar' ng-click='doAction()'></div>",
            //template: "<div class='action-bar' ng-click='doAction()'>{{action.text}}</div>",

            link: function (scope, elem, attr) {
                var x = scope.action;

                var increasePerTick = scope.speed / config.ticksPerSecond;
                var bar = angular.element(elem.children()[0]).append('<div class="timer-bar-progress"></div>');
                var text = angular.element(elem.children()[0]).append("<span class='action-bar-text'>" + scope.action.text + "</span>");
                var progress = angular.element(bar.children()[0]);

                eventLoop.onTick(scope, function (args) {
                    var action = scope.action;

                    if (!(scope.percentage < 1 && scope.waiting)) {
                        if (scope.waiting) {
                            progress.removeClass('timer-bar-running');
                            progress.addClass('timer-bar-complete');
                            scope.waiting = false;
                        }
                    }
                    if (scope.percentage === 1 && action.pctComplete === 0) {
                        progress.removeClass('timer-bar-complete');
                    }
                    scope.percentage = action.pctComplete;
                    progress.css('width', (scope.percentage * 100) + '%');
                });

                progress.css('width', '0%');
                bar.css('background-color', 'black');

                scope.doAction = doAction;
                scope.percentage = 0;
                scope.waiting = false;

                /////////////////////////////////////

                function doAction() {
                    if (!scope.waiting) {
                        if (scope.onClick) {
                            scope.onClick();
                        }
                        scope.percentage = 0;
                        scope.waiting = true;
                        progress.addClass('timer-bar-running');
                        progress.removeClass('timer-bar-complete');

                        actions.doAction(game, scope.action);
                    }
                }
            }
        };
    }

    angular.module('game')
        .directive('actionButton', actionButtonDirective);
})();