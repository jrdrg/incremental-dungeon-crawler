/**
 * Created by john on 1/27/15.
 */
(function () {

    'use strict';

    function discoveredLocationFilter() {
        return function discoveredLocation(locations) {
            return _.where(locations, {discovered: true});
        };
    }

    angular.module('game')
        .filter('discoveredLocation', discoveredLocationFilter);
})();