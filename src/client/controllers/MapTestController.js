/**
 * Created by john on 2/17/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     * @constructor
     */
    function MapTestController(mapAtlas) {


        this.map = mapAtlas.maps[0].rooms;
        this.position = {x: 0, y: 0};
    }

    angular.module('game')
        .controller('MapTestController', MapTestController);

})();