/**
 * Created by john on 1/22/15.
 */
(function () {

    'use strict';

    function config() {
        return {
            ticksPerSecond: 5,
            apiServer: 'http://localhost:13098/'
        };
    }

    angular.module('game')
        .factory('config', config);

})();