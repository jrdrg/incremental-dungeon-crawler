/**
 * Created by john on 1/27/15.
 */
(function () {

    'use strict';

    function percentageFilter($filter) {
        return function percentage(input, decimals) {
            return $filter('number')(input * 100, decimals) + '%';
        };
    }

    angular.module('game')
        .filter('percentage', percentageFilter);

})();