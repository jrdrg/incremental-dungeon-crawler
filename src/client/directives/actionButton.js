/**
 * Created by john on 1/27/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     */
    function actionButtonDirective(eventLoop, config, actions, upgrades, game) {

        return {
            restrict: 'AE',

            scope: {
                action: '='
            },

            template: "<div class='action-bar' ng-click='doAction()'>" +
            "<div class='timer-bar-progress' ng-class='getCssClasses()'</div></div>",

            link: function (scope, elem, attr) {

                if (!scope.action) {
                    throw "No action is bound to this actionButton!";
                }

                var progressBar = angular.element(elem.children()[0]).children();   // timer-bar-progress
                var bar = angular.element(elem.children()[0]).append(progressBar);
                var text = angular.element(elem.children()[0]).append("<span class='action-bar-text'>" + scope.action.text + "</span>");
                var progress = angular.element(bar.children()[0]);


                scope.doAction = doAction;
                scope.getAutomatedCssClass = getAutomatedCssClass;
                scope.getCssClasses = getCssClasses;
                scope.isActionAutomated = isActionAutomated;
                scope.percentage = scope.action.pctComplete || 0;
                scope.waiting = false;

                /////////////////////////////////////

                if (scope.action.pctComplete > 0) {
                    progress.addClass('timer-bar-running');
                    scope.waiting = true;
                }
                progress.css('width', (scope.percentage * 100) + '%');
                eventLoop.onTick(scope, onTick);


                /**
                 * Runs doAction() on the action bound to the button
                 */
                function doAction() {
                    if (!scope.waiting) {
                        if (scope.onClick) {
                            scope.onClick();
                        }
                        scope.percentage = 0;
                        scope.waiting = true;

                        var action = scope.action;
                        if (actions.canAutomate(action, upgrades.upgradeDefinitions)) {
                            action.automated = !action.automated;
                        } else {
                            actions.doAction(game, action);
                        }
                    }
                }


                /**
                 * Used to apply classes to the timer bar via ng-class
                 * @returns {{timer-bar-running: (name of style)}}
                 */
                function getCssClasses() {
                    return {
                        'timer-bar-running': isActionRunning(),
                        'timer-bar-complete': isActionCompleted()
                    };
                }

                function getAutomatedCssClass() {
                    return {
                        'automated': isActionAutomated()
                    };
                }


                /**
                 * Returns true if the action is currently running
                 * @returns {defaults.running|*|CSSStyleDeclaration.running|running}
                 */
                function isActionRunning() {
                    //return scope.percentage >= 0 && scope.percentage < 1 && scope.waiting;
                    return scope.action.running && scope.action.pctComplete > 0;
                }


                function isActionCompleted() {
                    return scope.percentage >= 1 && !scope.waiting && scope.action.pctComplete === 0;
                }


                function isActionAutomated() {
                    return scope.action.automated;
                }


                /**
                 * Tick handler for the event loop
                 * @param args
                 */
                function onTick(args) {
                    var action = scope.action;

                    if (scope.percentage === 1 && action.pctComplete === 0) {
                        scope.waiting = false;
                    }
                    scope.percentage = action.pctComplete;
                    progress.css('width', (scope.percentage * 100) + '%');
                }
            }
        };
    }

    angular.module('game')
        .directive('actionButton', actionButtonDirective);
})();