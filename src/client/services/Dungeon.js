/**
 * Created by john on 1/24/15.
 */
(function () {

    'use strict';

    /**
     * @ngInclude
     * @constructor
     */
    function dungeonFactory() {

        function Room() {
            this.enemyChance = Math.random();   // % of getting enemy encounter
            this.trapChance = Math.random();    // % of trap
            this.treasureChance = Math.random();
        }

        function Floor() {
            this.exploredPct = 0;
            this.rooms = [];
        }


        return function Dungeon(level, floorCount) {

            floorCount = Math.random() * level * 2;

            this.level = level;
            this.floors = [];

            for (var i = 0; i < floorCount; i++) {
                this.floors.push(new Floor());
            }
        };
    }

    angular.module('game')
        .factory('Dungeon', dungeonFactory);
})();