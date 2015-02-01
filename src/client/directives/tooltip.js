/**
 * Created by john on 1/28/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     */
    function tooltipDirective() {

        return {
            restrict: 'AE',

            scope: {
                text: '=',
                xOffset: '@?',
                yOffset: '@?'
            },

            link: function (scope, elem, attr) {
                var element = angular.element(elem);
                var tooltipHtml = "<div class='tooltip'></div>";

                var tooltip = element.append(tooltipHtml).children()[1];

                tooltip.innerHTML = scope.text;
                var tooltipElem = angular.element(tooltip);
                var width = tooltipElem.css('width');

                element.on('mousemove', function (e) {
                    tooltipElem.css('top', e.y + 1 + 'px');
                    tooltipElem.css('left', e.x + 1 + 'px');
                    tooltipElem.css('display', 'inline-block');
                });
                element.on('mouseout', function (e) {
                    tooltipElem.css('display', 'none');
                });
            }
        };
    }

    angular.module('game')
        .directive('tooltip', tooltipDirective);

})();