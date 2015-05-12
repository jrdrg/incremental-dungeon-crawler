/**
 * Created by john on 2/17/15.
 */
(function () {

    'use strict';

    var WIDTH = 400;
    var HEIGHT = 400;

    /**
     * @ngInject
     */
    function MapDisplay() {

        return {
            restrict: 'E',

            replace: 'true',

            scope: {
                id: '@?',
                map: '=',
                position: '='
            },

            template: '<canvas id="c" width="' + WIDTH + '" height="' + HEIGHT + '"></canvas>',

            controller: function ($scope) {
                $scope.id = $scope.id || 'mapCanvas';
            },

            link: function (scope, elem, attr) {

                var yMax = scope.map.length;
                var xMax = scope.map[0].length;

                var blockX = WIDTH / xMax;
                var blockY = HEIGHT / yMax;

                console.log("x=" + xMax + "," + "y=" + yMax);

                var canvas = elem[0];
                if (canvas.getContext) {
                    var ctx = canvas.getContext("2d");

                    //ctx.fillStyle = "rgb(200,0,0)";
                    //ctx.fillStyle = "rgba(0, 0, 200, 0.5)";

                    var border = 6;
                    var corrWidth = 12;

                    for (var y = 0; y < yMax; y++) {
                        for (var x = 0; x < xMax; x++) {

                            var xc = x * blockX;
                            var yc = y * blockY;

                            ctx.fillStyle = scope.map[y][x] === 1 ? 'rgb(200,0,0)' : 'rgb(0,200,0)';

                            ctx.fillRect(xc + border, yc + border, blockX - (border * 2), blockY - (border * 2));

                            ctx.fillStyle = 'rgb(100,100,100)';


                            ctx.fillRect(xc + (blockX / 2) - (corrWidth / 2), yc, corrWidth, border);
                            ctx.fillRect(xc, yc + (blockY / 2) - (corrWidth / 2), border, corrWidth);
                            ctx.fillRect(xc + (blockX / 2) - (corrWidth / 2), yc + blockY - border, corrWidth, border);
                            ctx.fillRect(xc + blockX - border, yc + (blockY / 2) - (corrWidth / 2), border, corrWidth);
                        }
                    }
                }
            }
        };

    }

    angular.module('game')
        .directive('mapDisplay', MapDisplay);

})();