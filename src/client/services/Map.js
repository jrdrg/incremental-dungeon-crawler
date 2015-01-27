/**
 * Created by john on 1/24/15.
 */
(function () {

    'use strict';

    /**
     * @ngInclude
     * @constructor
     */
    function mapFactory(utils, actions, party, statusMessages, upgrades, resources, Battle) {

        var getLostChance = 0.2;    // todo: change this?
        var roomXpBase = 1;

        function Room(map, floor) {
            var self = this;

            this.explore = explore;
            this.explored = false;
            this.enemyChance = Math.random();   // % of getting enemy encounter
            this.hasStairs = Math.random() / 10;     // % of finding stairs down here, once this is set then no other room can have it
            this.trapChance = Math.random();    // % of trap
            this.treasureChance = Math.random();

            function explore() {
                if (Math.random() <= self.enemyChance) {
                    randomBattle();

                } else if (Math.random() <= self.trapChance) {
                    trap();

                } else if (Math.random() <= self.treasureChance) {
                    foundTreasure();

                }
                self.explored = true;
            }

            function randomBattle() {
                statusMessages.message("Random battle!");
                self.enemyChance *= 0.8; // reduce the chance each time we visit this room

                var enemies = [{name: 'goblin', hp: 5, atk: 1, def: 1}];

                var battle = new Battle(enemies);
                battle.fight();
            }

            function foundTreasure() {
                statusMessages.message("Found treasure!");
                self.treasureChance *= 0.75;
                resources.gold.current += Math.floor(Math.random() * 10 * map.level);
            }

            function trap() {
                statusMessages.message("Triggered a trap!");
                self.trapChance *= 0.8;
            }
        }


        function Floor(map, roomCount) {
            roomCount = Math.floor(roomCount || 1);

            var self = this;

            this.currentRoom = 0;
            this.explore = explore;
            this.exploredPct = 0;
            this.foundStairs = false;   // can go to next floor?
            this.rooms = [];

            ///////////////////////////////

            for (var i = 0; i < roomCount; i++) {
                this.rooms.push(new Room(map, self));
            }

            ///////////////////////////////

            function explore(totalFloors) {
                var room = self.rooms[self.currentRoom];
                room.explore();

                var hasStairs = (self.currentRoom == self.rooms.length - 1) || Math.random() <= room.hasStairs;

                if (totalFloors > 1 && !self.foundStairs && hasStairs) {
                    statusMessages.message("Found stairs to the next level.");
                    self.foundStairs = true;
                }

                if (!upgrades.autoMap) {
                    // if automap, we don't get lost
                    if (Math.random() <= getLostChance) {
                        statusMessages.message("You get lost!");
                        self.currentRoom = Math.floor(Math.random() * roomCount);
                    }
                }
                if (self.currentRoom < roomCount - 1)
                    self.currentRoom++;

                var explored = _.filter(self.rooms, 'explored').length;
                self.exploredPct = explored / self.rooms.length;
            }
        }


        /**
         * @param {Number} level - the level of difficulty of the dungeon
         * @param {Number} floorCount - the number of floors
         */
        return function Map(args) {

            args = args || {};

            var self = this,
                level = args.level || 1,
                floorCount = args.floorCount || Math.random() * level * 2,
                roomCount = args.roomCount || Math.random() * 50 + (Math.random() * 5 + 10);

            this.currentFloor = 0;
            this.explore = explore;
            this.exploredPct = 0;
            this.floors = [];
            this.level = level;

            //////////////////////////////////////////////////

            for (var i = 0; i < floorCount; i++) {
                this.floors.push(new Floor(self, roomCount));
            }

            function changeFloor(newFloor) {
                self.currentFloor = newFloor || self.currentFloor;
            }

            function explore() {
                var floor = utils.clamp(self.currentFloor, 0, self.floors.length);
                self.floors[floor].explore(self.floors.length);

                var explored = _.reduce(self.floors, function (pct, floor, idx) {
                    console.log("EXPLORED: " + floor);
                    pct += floor.exploredPct;
                    return pct;
                }, 0);

                if (explored > self.exploredPct) {
                    resources.xp.current += (roomXpBase * level * (self.currentFloor + 1));
                }
                self.exploredPct = explored;
            }
        };
    }

    angular.module('game')
        .factory('Map', mapFactory);
})();