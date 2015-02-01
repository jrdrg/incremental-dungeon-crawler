/**
 * Created by john on 1/27/15.
 */
(function () {

    'use strict';

    function Utils() {

        this.clamp = clamp;
        this.randomInt = randomInt;
        this.randomElement = randomElement;
        this.randomFloat = randomFloat;

        ////////////////////////////////

        function clamp(value, min, max) {
            return Math.min(Math.max(min, value), max);
        }

        function randomInt(min, max) {
            var diff = max - min;
            return Math.floor((Math.random() * diff) + min);
        }

        function randomFloat(min, max) {
            var diff = max - min;
            return (Math.random() * diff) + min;
        }

        function randomElement(array, weightProperty, isFunction) {
            var getWeight = function (item) {
                var result = 0;
                if (isFunction) {
                    result += item[weightProperty]();
                } else {
                    result += item[weightProperty];
                }
                return result;
            };
            var totalWeights = _.reduce(array, function (result, n, idx) {
                result += getWeight(n);
                return result;
            }, 0);
            var randomIndex = randomInt(0, totalWeights);
            var count = 0;
            for (var i = 0; i < array.length; i++) {
                count += getWeight(array[i]);
                if (count >= randomIndex)
                    return array[i];
            }
            return array[array.length - 1];
        }
    }

    angular.module('game')
        .service('utils', Utils);

})();