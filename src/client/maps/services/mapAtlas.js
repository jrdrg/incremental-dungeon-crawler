/**
 * Created by john on 2/17/15.
 */
(function () {

    'use strict';

    var UP = 1;
    var DOWN = 2;
    var LEFT = 4;
    var RIGHT = 8;

    var map = [
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 1, 1, 1, 1, 0],
        [1, 1, 1, 1, 1, 1, 0, 0, 1, 0],
        [1, 0, 0, 0, 0, 0, 1, 1, 1, 1],
        [0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
        [0, 0, 1, 1, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0]
    ];


    /**
     * @ngInject
     * @constructor
     */
    function MapAtlas() {

        this.maps = [
            {
                name: 'Starting map',
                rooms: map
            }
        ];
    }

    angular.module('game')
        .service('mapAtlas', MapAtlas);

})();