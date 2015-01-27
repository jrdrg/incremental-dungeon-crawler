/**
 * Created by john on 1/22/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     * @param $stateProvider
     * @param $urlRouterProvider
     */
    function appConfig($stateProvider, $urlRouterProvider) {

        $urlRouterProvider.otherwise('/main');

        $stateProvider
            .state('main', {
                abstract: true,
                url: '/main',
                templateUrl: '/partials/main.html',
                controller: 'MainController',
                controllerAs: 'vm'
            })

            .state('main.actions', {
                url: '',
                templateUrl: '/partials/actions.html'
            })

            .state('main.characterStatus', {
                params: {
                    character: null
                },
                templateUrl: '/partials/characterStatus.html',
                controller: 'CharacterStatusController',
                controllerAs: 'vm'
            })
        ;
    }
    appConfig.$inject = ["$stateProvider", "$urlRouterProvider"];

    angular.module('game', ['ui.router', 'ngResource'])
        .config(appConfig)
        .run(['$rootScope', '$state', function ($rootScope, $state) {
            $rootScope.$on('$stateChangeSuccess', function (event, to, toParams, from, fromParams) {
                $state.previous = from;
                $rootScope.$previousState = from;
            });
        }]);
})();
/**
 * Created by john on 1/27/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     * @constructor
     */
    function CharacterStatusController($state) {
        var character = $state.params.character;

        this.character = character;
        this.goBack = goBack;

        ///////////////////////

        function goBack() {
            $state.go('main.actions');
        }

    }
    CharacterStatusController.$inject = ["$state"];

    angular.module('game')
        .controller('CharacterStatusController', CharacterStatusController);

})();
/**
 * Created by john on 1/22/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     * @constructor
     */
    function MainController($scope, $state, game, actions, statusMessages, locations) {

        var self = this;

        this.actionSpeed = game.actionSpeed;
        this.actions = actions.actionDefinitions;
        this.characterInfo = characterInfo;
        this.explore = explore;
        this.exploreStart = exploreStart;
        this.location = game.location;
        this.locations = locations.locations;
        this.messages = [];
        this.party = game.party;
        this.resources = game.resources;
        this.search = search;
        this.text = 'test';

        this.party[0].$save();

        ///////////////////////////////

        statusMessages.onMessage($scope, function (args) {
            self.messages.unshift({text: args.message});
            if (self.messages.length > 20) {
                self.messages.pop();
            }
        });

        function exploreStart(){
            statusMessages.message('Exploring...');
        }

        function explore() {
            statusMessages.message('You found some stuff.');
        }

        function search() {
            console.log("search");
        }

        function characterInfo(character) {
            $state.go('main.characterStatus', {
                character: character
            });
        }
    }
    MainController.$inject = ["$scope", "$state", "game", "actions", "statusMessages", "locations"];

    angular.module('game')
        .controller('MainController', MainController);
})();
/**
 * Created by john on 1/25/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     */
    function enemyFactory() {

        var enemies = [
            [
                {name: 'goblin', speed: '5', atk: 3, def: 1},
                {name: 'kobold', speed: '7', atk: 1, def: 1}
            ]
        ];

        return function Enemy(level) {
            level = Math.max(0, Math.min(level, enemies.length - 1));

            var random = _.sample(enemies[level]);

            angular.extend(this, random);
        };
    }

    angular.module('game')
        .factory('Enemy', enemyFactory);
})();

/**
 * Created by john on 1/23/15.
 */
(function () {

    'use strict';


    /**
     * @ngInject
     */
    function timerBarDirective(eventLoop, config) {

        return {
            restrict: 'AE',

            replace: true,

            template: '<div class="timer-bar-button"><a class="timer-bar-text" ng-click="countdown()">{{label}}</a> <div class="timer-bar"></div></div>',

            scope: {
                label: '@',
                speed: '=',
                onClick: '&?',
                onCompleted: '&'
            },

            link: function (scope, elem, attr) {
                if (!scope.speed) throw new Error('speed not defined');
                if (!scope.onCompleted) throw new Error('onCompleted not defined');

                var increasePerTick = scope.speed / config.ticksPerSecond;
                var bar = angular.element(elem.children()[1]).append('<div class="timer-bar-progress"></div>');
                var progress = angular.element(bar.children()[0]);

                eventLoop.onTick(scope, function (args) {
                    if (scope.percentage < 1 && scope.waiting) {
                        scope.percentage = Math.min(1, scope.percentage + increasePerTick);
                    } else {
                        if (scope.waiting) {
                            progress.addClass('timer-bar-complete');
                            scope.waiting = false;
                            scope.percentage = 0;
                            scope.onCompleted();
                        }
                    }
                    progress.css('width', (scope.percentage * 100) + '%');
                });

                progress.css('width', '0%');
                bar.css('background-color', 'black');

                scope.countdown = countdown;
                scope.percentage = 0;

                /////////////////////////////////////

                function countdown() {
                    if (!scope.waiting) {
                        if (scope.onClick) {
                            scope.onClick();
                        }
                        scope.percentage = 0;
                        scope.waiting = true;
                        progress.removeClass('timer-bar-complete');
                    }
                }
            }
        };
    }
    timerBarDirective.$inject = ["eventLoop", "config"];

    angular.module('game')
        .directive('timerBar', timerBarDirective);

})();
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
    percentageFilter.$inject = ["$filter"];

    angular.module('game')
        .filter('percentage', percentageFilter);

})();
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
    mapFactory.$inject = ["utils", "actions", "party", "statusMessages", "upgrades", "resources", "Battle"];

    angular.module('game')
        .factory('Map', mapFactory);
})();
/**
 * Created by john on 1/23/15.
 */
(function () {

    'use strict';

    function Actions(party) {

        var self = this;

        this.actionDefinitions = {

            explore: {
                pctComplete: 1,
                speed: 0.02,
                action: function (map) {
                    var exploredPct = ((Math.random() * 5) + 5) / 100;  // random pct between 5-10%

                    if (map.secretDoorPct > 0) {

                    } else {
                        map.explore();
                    }
                }
            }

        };
        this.processTick = processTick;


        ////////////////////////////

        function processTick() {
            angular.forEach(self.actionDefinitions, function (action) {
                if (action.pctComplete < 1) {
                    action.pctComplete += action.speed;
                }
            });
        }
    }
    Actions.$inject = ["party"];

    angular.module('game')
        .service('actions', Actions);
})();
/**
 * Created by john on 1/25/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     * @returns {Function}
     */
    function battleFactory(party, resources, upgrades) {

        return function Battle(enemies) {

            var sorted = _.sortBy(party.characters.concat(enemies), 'speed');

            this.fight = fight;

            /////////////////////////////////////

            function fight() {
                resources.xp.current += sorted.length;
            }
        };
    }
    battleFactory.$inject = ["party", "resources", "upgrades"];

    angular.module('game')
        .factory('Battle', battleFactory);

})();
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
/**
 * Created by john on 1/22/15.
 */
(function () {

    'use strict';

    var TICK = "event:tick";

    /**
     * @ngInject
     */
    function EventLoop($rootScope, $interval, config) {

        this.onTick = onTick;

        //////////////////////////////////////////////

        var timer = $interval(function () {
            tick();
        }, 1000 / config.ticksPerSecond);

        $rootScope.$on('$destroy', function () {
            $interval.cancel(timer);
        });

        //////////////////////////////////////////////

        function onTick(scope, handler) {
            scope.$on(TICK, function (e, args) {
                handler(args);
            });
        }

        function tick() {
            $rootScope.$broadcast(TICK, {});
        }
    }
    EventLoop.$inject = ["$rootScope", "$interval", "config"];

    angular.module('game')
        .service('eventLoop', EventLoop);

})();
/**
 * Created by john on 1/22/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     * @constructor
     */
    function Game($rootScope, eventLoop, party, actions, resources, locations, upgrades) {

        eventLoop.onTick($rootScope, function (args) {
            console.log("tick");

            actions.processTick();
            upgrades.processTick();
        });


        locations.changeLocation('town')();
        locations.explore();

        /////////////////////////////////////////////////////////

        this.party = party.characters;
        this.actionSpeed = {
            explore: 1,
            gather: 1
        };
        this.location = currentLocation;
        this.resources = availableResources;


        /////////////////////////////////////////////////////////

        function availableResources() {
            var filtered = _.filter(resources, 'visible');
            return filtered;
        }

        function currentLocation() {
            return locations.current();
        }

    }
    Game.$inject = ["$rootScope", "eventLoop", "party", "actions", "resources", "locations", "upgrades"];

    angular.module('game')
        .service('game', Game);

})();

/**
 * Created by john on 1/26/15.
 */
(function () {

    'use strict';

    function bindAction(action, toObject) {
        return function () {
            action(toObject);
        };
    }

    /**
     * @ngInject
     * @constructor
     */
    function Locations($state, $q, actions, statusMessages, Map) {

        var self = this,
            loc;

        this.changeLocation = changeLocation;
        this.current = currentLocation;
        this.explore = explore;
        this.locations = [

            {
                id: 'town',
                name: 'Town',
                map: new Map({level: 1, floorCount: 1, roomCount: 1}),
                discovered: true,
                actions: [
                    {
                        text: 'Inn',
                        action: function () {
                            // go to the inn
                            statusMessages.message("Can't go to the inn yet...");
                        }
                    },
                    {
                        text: 'Supplies',
                        action: function () {
                            // go to the store
                        }
                    },
                    {
                        text: 'Leave town',
                        action: changeLocation('forest', 'You leave town and enter the forest.')
                    }
                ]
            },


            {
                id: 'forest',
                name: 'Forest',
                map: new Map({level: 1, floorCount: 1, roomCount: 600 + (Math.random() * 100)}),
                discovered: false,
                treasure: [
                    {name: 'gold', pct: 1}
                ],
                actions: [
                    {
                        text: 'Return to town',
                        action: changeLocation('town', 'You return to the town.')
                    },
                    {
                        text: 'Explore',
                        action: function () {
                            // explore
                            self.explore();
                        }
                    },
                    {
                        text: 'Gather herbs',
                        action: function () {
                            // gather some herbs
                        }
                    },
                    {
                        text: 'Enter dungeon',
                        explorePct: 0.4,
                        message: 'You discovered the starting dungeon!',
                        action: changeLocation('startingDungeon', 'You enter the dungeon.')
                    }
                ]
            },


            {
                id: 'startingDungeon',
                name: 'Starting Dungeon',
                map: new Map({level: 1, floorCount: 10, roomCount: 100}),
                discovered: false
            }
        ];

        ////////////////////////////////////////////////

        function changeLocation(newLocation, message) {
            return function () {
                loc = _.findWhere(self.locations, {id: newLocation});
                statusMessages.message(message);
            };
        }

        function currentLocation() {
            return loc;
        }

        function explore() {
            var map = loc.map;
            map.explore(loc);
        }
    }
    Locations.$inject = ["$state", "$q", "actions", "statusMessages", "Map"];

    angular.module('game')
        .service('locations', Locations);
})();
/**
 * Created by john on 1/27/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     * @constructor
     */
    function Party(Character) {

        var characters = [
            Character.create({name: 'Sir Jeeves', class: 'knight'}),
            Character.create({name: 'Thorgrimm Axebeard', class: 'berserker'}),
            Character.create({name: 'Fenris Ratfingers', class: 'thief'}),
            Character.create({name: 'Boris One-shot', class: 'archer'}),
            Character.create({name: 'Lysanna Dawnbringer', class: 'sorcerer'}),
            Character.create({name: 'Lothar Greenbrook', class: 'healer'})
        ];

        this.characters = characters;
    }
    Party.$inject = ["Character"];

    angular.module('game')
        .service('party', Party);

})();
/**
 * Created by john on 1/25/15.
 */
(function () {

    'use strict';

    function resources() {

        return {
            xp: {
                name: 'xp',
                visible: true,
                current: 0
            },

            food: {
                name: 'food',
                visible: true,
                current: 0,
                max: 1000
            },

            gold: {
                name: 'gold',
                visible: true,
                current: 0
            },

            iron: {
                name: 'iron',
                current: 0,
                max: 100
            }
        };
    }

    angular.module('game')
        .factory('resources', resources);

})
();
/**
 * Created by john on 1/26/15.
 */
(function () {

    'use strict';

    var STATUS_MESSAGE = "game:statusMessage";

    /**
     * @ngInject
     * @constructor
     */
    function StatusMessages($rootScope) {

        this.message = message;
        this.onMessage = onMessage;

        function message(status) {
            $rootScope.$broadcast(STATUS_MESSAGE, {message: status});
        }

        function onMessage(scope, handler) {
            scope.$on(STATUS_MESSAGE, function (e, args) {
                handler(args);
            });
        }
    }
    StatusMessages.$inject = ["$rootScope"];

    angular.module('game')
        .service('statusMessages', StatusMessages);
})();
/**
 * Created by john on 1/24/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     */
    function Upgrades() {

        this.processTick = processTick;
        this.upgradeDefinitions = {

            automap: {
                active: false,
                available: true,
                cost: 300,
                text: 'Automap',
                description: 'Prevents you from getting lost.'
            }
        };

        ////////////////////////////////////////////////

        function processTick() {
            // do stuff that should happen every tick, depending on the upgrades
        }
    }

    angular.module('game')
        .service('upgrades', Upgrades);

})();
/**
 * Created by john on 1/27/15.
 */
(function () {

    'use strict';

    function Utils() {

        this.clamp = clamp;

        ////////////////////////////////

        function clamp(value, min, max) {
            return Math.min(Math.max(min, value), max);
        }
    }

    angular.module('game')
        .service('utils', Utils);

})();
/**
 * Created by john on 1/22/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     * @constructor
     */
    function characterFactory(config, $resource) {
        var url = config.apiServer + 'character/:id';
        var Character = $resource(url, {id: '@id'});
        var id = 1;

        angular.extend(Character, {

            create: function (args) {
                args = args || {};
                var char = new Character({id: args.id || id++});

                char.name = args.name || 'character';
                char.class = args.class;
                char.level = 1;
                char.hp = {current: 10, max: 10};
                char.mp = {current: 10, max: 10};
                char.atk = 10;
                char.def = 10;
                char.magic = 10;
                char.speed = 10;
                char.ac = 10;

                return char;
            }
        });

        return Character;
    }
    characterFactory.$inject = ["config", "$resource"];

    angular.module('game')
        .factory('Character', characterFactory);
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0NoYXJhY3RlclN0YXR1c0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9NYWluQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL2VuZW1pZXMuanMiLCJkaXJlY3RpdmVzL3RpbWVyQmFyLmpzIiwiZmlsdGVycy9kaXNjb3ZlcmVkTG9jYXRpb24uanMiLCJmaWx0ZXJzL3BlcmNlbnRhZ2UuanMiLCJzZXJ2aWNlcy9EdW5nZW9uLmpzIiwic2VydmljZXMvTWFwLmpzIiwic2VydmljZXMvYWN0aW9ucy5qcyIsInNlcnZpY2VzL2JhdHRsZS5qcyIsInNlcnZpY2VzL2NvbmZpZy5qcyIsInNlcnZpY2VzL2V2ZW50TG9vcC5qcyIsInNlcnZpY2VzL2dhbWUuanMiLCJzZXJ2aWNlcy9sb2NhdGlvbnMuanMiLCJzZXJ2aWNlcy9wYXJ0eS5qcyIsInNlcnZpY2VzL3Jlc291cmNlcy5qcyIsInNlcnZpY2VzL3N0YXR1c01lc3NhZ2VzLmpzIiwic2VydmljZXMvdXBncmFkZXMuanMiLCJzZXJ2aWNlcy91dGlscy5qcyIsInNlcnZpY2VzL3Jlc291cmNlcy9DaGFyYWN0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQUdBLENBQUMsWUFBWTs7SUFFVDs7Ozs7OztJQU9BLFNBQVMsVUFBVSxnQkFBZ0Isb0JBQW9COztRQUVuRCxtQkFBbUIsVUFBVTs7UUFFN0I7YUFDSyxNQUFNLFFBQVE7Z0JBQ1gsVUFBVTtnQkFDVixLQUFLO2dCQUNMLGFBQWE7Z0JBQ2IsWUFBWTtnQkFDWixjQUFjOzs7YUFHakIsTUFBTSxnQkFBZ0I7Z0JBQ25CLEtBQUs7Z0JBQ0wsYUFBYTs7O2FBR2hCLE1BQU0sd0JBQXdCO2dCQUMzQixRQUFRO29CQUNKLFdBQVc7O2dCQUVmLGFBQWE7Z0JBQ2IsWUFBWTtnQkFDWixjQUFjOzs7Ozs7SUFLMUIsUUFBUSxPQUFPLFFBQVEsQ0FBQyxhQUFhO1NBQ2hDLE9BQU87U0FDUCxJQUFJLENBQUMs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OUMsUUFBUSxPQUFPO1NBQ1YsUUFBUSxTQUFTOztLQUVyQjtBQ3JCTDs7O0FBR0EsQ0FBQyxZQUFZOztJQUVUOzs7Ozs7SUFNQSxTQUFTLGlCQUFpQixRQUFRLFdBQVc7UUFDekMsSUFBSSxNQUFNLE9BQU8sWUFBWTtRQUM3QixJQUFJLFlBQVksVUFBVSxLQUFLLENBQUMsSUFBSTtRQUNwQyxJQUFJLEtBQUs7O1FBRVQsUUFBUSxPQUFPLFdBQVc7O1lBRXRCLFFBQVEsVUFBVSxNQUFNO2dCQUNwQixPQUFPLFFBQVE7Z0JBQ2YsSUFBSSxPQUFPLElBQUksVUFBVSxDQUFDLElBQUksS0FBSyxNQUFNOztnQkFFekMsS0FBSyxPQUFPLEtBQUssUUFBUTtnQkFDekIsS0FBSyxRQUFRLEtBQUs7Z0JBQ2xCLEtBQUssUUFBUTtnQkFDYixLQUFLLEtBQUssQ0FBQyxTQUFTLElBQUksS0FBSztnQkFDN0IsS0FBSyxLQUFLLENBQUMsU0FBUyxJQUFJLEtBQUs7Z0JBQzdCLEtBQUssTUFBTTtnQkFDWCxLQUFLLE1BQU07Z0JBQ1gsS0FBSyxRQUFRO2dCQUNiLEtBQUssUUFBUTtnQkFDYixLQUFLLEtBQUs7O2dCQUVWLE9BQU87Ozs7UUFJZixPQUFPOzs7O0lBR1gsUUFBUSxPQUFPO1NBQ1YsUUFBUSxhQUFhO0tBQ3pCIiwiZmlsZSI6ImFwcGxpY2F0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yMi8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8qKlxuICAgICAqIEBuZ0luamVjdFxuICAgICAqIEBwYXJhbSAkc3RhdGVQcm92aWRlclxuICAgICAqIEBwYXJhbSAkdXJsUm91dGVyUHJvdmlkZXJcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBhcHBDb25maWcoJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuXG4gICAgICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy9tYWluJyk7XG5cbiAgICAgICAgJHN0YXRlUHJvdmlkZXJcbiAgICAgICAgICAgIC5zdGF0ZSgnbWFpbicsIHtcbiAgICAgICAgICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICAgICAgICAgICAgICB1cmw6ICcvbWFpbicsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvbWFpbi5odG1sJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnTWFpbkNvbnRyb2xsZXInLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJ3ZtJ1xuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgLnN0YXRlKCdtYWluLmFjdGlvbnMnLCB7XG4gICAgICAgICAgICAgICAgdXJsOiAnJyxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy9hY3Rpb25zLmh0bWwnXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAuc3RhdGUoJ21haW4uY2hhcmFjdGVyU3RhdHVzJywge1xuICAgICAgICAgICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgICAgICAgICBjaGFyYWN0ZXI6IG51bGxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3BhcnRpYWxzL2NoYXJhY3RlclN0YXR1cy5odG1sJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnQ2hhcmFjdGVyU3RhdHVzQ29udHJvbGxlcicsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlckFzOiAndm0nXG4gICAgICAgICAgICB9KVxuICAgICAgICA7XG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnLCBbJ3VpLnJvdXRlcicsICduZ1Jlc291cmNlJ10pXG4gICAgICAgIC5jb25maWcoYXBwQ29uZmlnKVxuICAgICAgICAucnVuKFsnJHJvb3RTY29wZScsICckc3RhdGUnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHN0YXRlKSB7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uIChldmVudCwgdG8sIHRvUGFyYW1zLCBmcm9tLCBmcm9tUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLnByZXZpb3VzID0gZnJvbTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRwcmV2aW91c1N0YXRlID0gZnJvbTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XSk7XG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjcvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBDaGFyYWN0ZXJTdGF0dXNDb250cm9sbGVyKCRzdGF0ZSkge1xuICAgICAgICB2YXIgY2hhcmFjdGVyID0gJHN0YXRlLnBhcmFtcy5jaGFyYWN0ZXI7XG5cbiAgICAgICAgdGhpcy5jaGFyYWN0ZXIgPSBjaGFyYWN0ZXI7XG4gICAgICAgIHRoaXMuZ29CYWNrID0gZ29CYWNrO1xuXG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgZnVuY3Rpb24gZ29CYWNrKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdtYWluLmFjdGlvbnMnKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuY29udHJvbGxlcignQ2hhcmFjdGVyU3RhdHVzQ29udHJvbGxlcicsIENoYXJhY3RlclN0YXR1c0NvbnRyb2xsZXIpO1xuXG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjIvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBNYWluQ29udHJvbGxlcigkc2NvcGUsICRzdGF0ZSwgZ2FtZSwgYWN0aW9ucywgc3RhdHVzTWVzc2FnZXMsIGxvY2F0aW9ucykge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICB0aGlzLmFjdGlvblNwZWVkID0gZ2FtZS5hY3Rpb25TcGVlZDtcbiAgICAgICAgdGhpcy5hY3Rpb25zID0gYWN0aW9ucy5hY3Rpb25EZWZpbml0aW9ucztcbiAgICAgICAgdGhpcy5jaGFyYWN0ZXJJbmZvID0gY2hhcmFjdGVySW5mbztcbiAgICAgICAgdGhpcy5leHBsb3JlID0gZXhwbG9yZTtcbiAgICAgICAgdGhpcy5leHBsb3JlU3RhcnQgPSBleHBsb3JlU3RhcnQ7XG4gICAgICAgIHRoaXMubG9jYXRpb24gPSBnYW1lLmxvY2F0aW9uO1xuICAgICAgICB0aGlzLmxvY2F0aW9ucyA9IGxvY2F0aW9ucy5sb2NhdGlvbnM7XG4gICAgICAgIHRoaXMubWVzc2FnZXMgPSBbXTtcbiAgICAgICAgdGhpcy5wYXJ0eSA9IGdhbWUucGFydHk7XG4gICAgICAgIHRoaXMucmVzb3VyY2VzID0gZ2FtZS5yZXNvdXJjZXM7XG4gICAgICAgIHRoaXMuc2VhcmNoID0gc2VhcmNoO1xuICAgICAgICB0aGlzLnRleHQgPSAndGVzdCc7XG5cbiAgICAgICAgdGhpcy5wYXJ0eVswXS4kc2F2ZSgpO1xuXG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICBzdGF0dXNNZXNzYWdlcy5vbk1lc3NhZ2UoJHNjb3BlLCBmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgc2VsZi5tZXNzYWdlcy51bnNoaWZ0KHt0ZXh0OiBhcmdzLm1lc3NhZ2V9KTtcbiAgICAgICAgICAgIGlmIChzZWxmLm1lc3NhZ2VzLmxlbmd0aCA+IDIwKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5tZXNzYWdlcy5wb3AoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgZnVuY3Rpb24gZXhwbG9yZVN0YXJ0KCl7XG4gICAgICAgICAgICBzdGF0dXNNZXNzYWdlcy5tZXNzYWdlKCdFeHBsb3JpbmcuLi4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGV4cGxvcmUoKSB7XG4gICAgICAgICAgICBzdGF0dXNNZXNzYWdlcy5tZXNzYWdlKCdZb3UgZm91bmQgc29tZSBzdHVmZi4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHNlYXJjaCgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic2VhcmNoXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY2hhcmFjdGVySW5mbyhjaGFyYWN0ZXIpIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnbWFpbi5jaGFyYWN0ZXJTdGF0dXMnLCB7XG4gICAgICAgICAgICAgICAgY2hhcmFjdGVyOiBjaGFyYWN0ZXJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuY29udHJvbGxlcignTWFpbkNvbnRyb2xsZXInLCBNYWluQ29udHJvbGxlcik7XG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjUvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBlbmVteUZhY3RvcnkoKSB7XG5cbiAgICAgICAgdmFyIGVuZW1pZXMgPSBbXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge25hbWU6ICdnb2JsaW4nLCBzcGVlZDogJzUnLCBhdGs6IDMsIGRlZjogMX0sXG4gICAgICAgICAgICAgICAge25hbWU6ICdrb2JvbGQnLCBzcGVlZDogJzcnLCBhdGs6IDEsIGRlZjogMX1cbiAgICAgICAgICAgIF1cbiAgICAgICAgXTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gRW5lbXkobGV2ZWwpIHtcbiAgICAgICAgICAgIGxldmVsID0gTWF0aC5tYXgoMCwgTWF0aC5taW4obGV2ZWwsIGVuZW1pZXMubGVuZ3RoIC0gMSkpO1xuXG4gICAgICAgICAgICB2YXIgcmFuZG9tID0gXy5zYW1wbGUoZW5lbWllc1tsZXZlbF0pO1xuXG4gICAgICAgICAgICBhbmd1bGFyLmV4dGVuZCh0aGlzLCByYW5kb20pO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmZhY3RvcnkoJ0VuZW15JywgZW5lbXlGYWN0b3J5KTtcbn0pKCk7XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzIzLzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0aW1lckJhckRpcmVjdGl2ZShldmVudExvb3AsIGNvbmZpZykge1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0FFJyxcblxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcblxuICAgICAgICAgICAgdGVtcGxhdGU6ICc8ZGl2IGNsYXNzPVwidGltZXItYmFyLWJ1dHRvblwiPjxhIGNsYXNzPVwidGltZXItYmFyLXRleHRcIiBuZy1jbGljaz1cImNvdW50ZG93bigpXCI+e3tsYWJlbH19PC9hPiA8ZGl2IGNsYXNzPVwidGltZXItYmFyXCI+PC9kaXY+PC9kaXY+JyxcblxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBsYWJlbDogJ0AnLFxuICAgICAgICAgICAgICAgIHNwZWVkOiAnPScsXG4gICAgICAgICAgICAgICAgb25DbGljazogJyY/JyxcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlZDogJyYnXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW0sIGF0dHIpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXNjb3BlLnNwZWVkKSB0aHJvdyBuZXcgRXJyb3IoJ3NwZWVkIG5vdCBkZWZpbmVkJyk7XG4gICAgICAgICAgICAgICAgaWYgKCFzY29wZS5vbkNvbXBsZXRlZCkgdGhyb3cgbmV3IEVycm9yKCdvbkNvbXBsZXRlZCBub3QgZGVmaW5lZCcpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGluY3JlYXNlUGVyVGljayA9IHNjb3BlLnNwZWVkIC8gY29uZmlnLnRpY2tzUGVyU2Vjb25kO1xuICAgICAgICAgICAgICAgIHZhciBiYXIgPSBhbmd1bGFyLmVsZW1lbnQoZWxlbS5jaGlsZHJlbigpWzFdKS5hcHBlbmQoJzxkaXYgY2xhc3M9XCJ0aW1lci1iYXItcHJvZ3Jlc3NcIj48L2Rpdj4nKTtcbiAgICAgICAgICAgICAgICB2YXIgcHJvZ3Jlc3MgPSBhbmd1bGFyLmVsZW1lbnQoYmFyLmNoaWxkcmVuKClbMF0pO1xuXG4gICAgICAgICAgICAgICAgZXZlbnRMb29wLm9uVGljayhzY29wZSwgZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3BlLnBlcmNlbnRhZ2UgPCAxICYmIHNjb3BlLndhaXRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLnBlcmNlbnRhZ2UgPSBNYXRoLm1pbigxLCBzY29wZS5wZXJjZW50YWdlICsgaW5jcmVhc2VQZXJUaWNrKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY29wZS53YWl0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3MuYWRkQ2xhc3MoJ3RpbWVyLWJhci1jb21wbGV0ZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLndhaXRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5wZXJjZW50YWdlID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5vbkNvbXBsZXRlZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHByb2dyZXNzLmNzcygnd2lkdGgnLCAoc2NvcGUucGVyY2VudGFnZSAqIDEwMCkgKyAnJScpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3MuY3NzKCd3aWR0aCcsICcwJScpO1xuICAgICAgICAgICAgICAgIGJhci5jc3MoJ2JhY2tncm91bmQtY29sb3InLCAnYmxhY2snKTtcblxuICAgICAgICAgICAgICAgIHNjb3BlLmNvdW50ZG93biA9IGNvdW50ZG93bjtcbiAgICAgICAgICAgICAgICBzY29wZS5wZXJjZW50YWdlID0gMDtcblxuICAgICAgICAgICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGNvdW50ZG93bigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzY29wZS53YWl0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NvcGUub25DbGljaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLm9uQ2xpY2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLnBlcmNlbnRhZ2UgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUud2FpdGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzcy5yZW1vdmVDbGFzcygndGltZXItYmFyLWNvbXBsZXRlJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuZGlyZWN0aXZlKCd0aW1lckJhcicsIHRpbWVyQmFyRGlyZWN0aXZlKTtcblxufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzI3LzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgZnVuY3Rpb24gZGlzY292ZXJlZExvY2F0aW9uRmlsdGVyKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gZGlzY292ZXJlZExvY2F0aW9uKGxvY2F0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIF8ud2hlcmUobG9jYXRpb25zLCB7ZGlzY292ZXJlZDogdHJ1ZX0pO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmZpbHRlcignZGlzY292ZXJlZExvY2F0aW9uJywgZGlzY292ZXJlZExvY2F0aW9uRmlsdGVyKTtcbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yNy8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGZ1bmN0aW9uIHBlcmNlbnRhZ2VGaWx0ZXIoJGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gcGVyY2VudGFnZShpbnB1dCwgZGVjaW1hbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkZmlsdGVyKCdudW1iZXInKShpbnB1dCAqIDEwMCwgZGVjaW1hbHMpICsgJyUnO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmZpbHRlcigncGVyY2VudGFnZScsIHBlcmNlbnRhZ2VGaWx0ZXIpO1xuXG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjQvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmNsdWRlXG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgZnVuY3Rpb24gZHVuZ2VvbkZhY3RvcnkoKSB7XG5cbiAgICAgICAgZnVuY3Rpb24gUm9vbSgpIHtcbiAgICAgICAgICAgIHRoaXMuZW5lbXlDaGFuY2UgPSBNYXRoLnJhbmRvbSgpOyAgIC8vICUgb2YgZ2V0dGluZyBlbmVteSBlbmNvdW50ZXJcbiAgICAgICAgICAgIHRoaXMudHJhcENoYW5jZSA9IE1hdGgucmFuZG9tKCk7ICAgIC8vICUgb2YgdHJhcFxuICAgICAgICAgICAgdGhpcy50cmVhc3VyZUNoYW5jZSA9IE1hdGgucmFuZG9tKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBGbG9vcigpIHtcbiAgICAgICAgICAgIHRoaXMuZXhwbG9yZWRQY3QgPSAwO1xuICAgICAgICAgICAgdGhpcy5yb29tcyA9IFtdO1xuICAgICAgICB9XG5cblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gRHVuZ2VvbihsZXZlbCwgZmxvb3JDb3VudCkge1xuXG4gICAgICAgICAgICBmbG9vckNvdW50ID0gTWF0aC5yYW5kb20oKSAqIGxldmVsICogMjtcblxuICAgICAgICAgICAgdGhpcy5sZXZlbCA9IGxldmVsO1xuICAgICAgICAgICAgdGhpcy5mbG9vcnMgPSBbXTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmbG9vckNvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZsb29ycy5wdXNoKG5ldyBGbG9vcigpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5mYWN0b3J5KCdEdW5nZW9uJywgZHVuZ2VvbkZhY3RvcnkpO1xufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzI0LzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyoqXG4gICAgICogQG5nSW5jbHVkZVxuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIG1hcEZhY3RvcnkodXRpbHMsIGFjdGlvbnMsIHBhcnR5LCBzdGF0dXNNZXNzYWdlcywgdXBncmFkZXMsIHJlc291cmNlcywgQmF0dGxlKSB7XG5cbiAgICAgICAgdmFyIGdldExvc3RDaGFuY2UgPSAwLjI7ICAgIC8vIHRvZG86IGNoYW5nZSB0aGlzP1xuICAgICAgICB2YXIgcm9vbVhwQmFzZSA9IDE7XG5cbiAgICAgICAgZnVuY3Rpb24gUm9vbShtYXAsIGZsb29yKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgICAgIHRoaXMuZXhwbG9yZSA9IGV4cGxvcmU7XG4gICAgICAgICAgICB0aGlzLmV4cGxvcmVkID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmVuZW15Q2hhbmNlID0gTWF0aC5yYW5kb20oKTsgICAvLyAlIG9mIGdldHRpbmcgZW5lbXkgZW5jb3VudGVyXG4gICAgICAgICAgICB0aGlzLmhhc1N0YWlycyA9IE1hdGgucmFuZG9tKCkgLyAxMDsgICAgIC8vICUgb2YgZmluZGluZyBzdGFpcnMgZG93biBoZXJlLCBvbmNlIHRoaXMgaXMgc2V0IHRoZW4gbm8gb3RoZXIgcm9vbSBjYW4gaGF2ZSBpdFxuICAgICAgICAgICAgdGhpcy50cmFwQ2hhbmNlID0gTWF0aC5yYW5kb20oKTsgICAgLy8gJSBvZiB0cmFwXG4gICAgICAgICAgICB0aGlzLnRyZWFzdXJlQ2hhbmNlID0gTWF0aC5yYW5kb20oKTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gZXhwbG9yZSgpIHtcbiAgICAgICAgICAgICAgICBpZiAoTWF0aC5yYW5kb20oKSA8PSBzZWxmLmVuZW15Q2hhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJhbmRvbUJhdHRsZSgpO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChNYXRoLnJhbmRvbSgpIDw9IHNlbGYudHJhcENoYW5jZSkge1xuICAgICAgICAgICAgICAgICAgICB0cmFwKCk7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKE1hdGgucmFuZG9tKCkgPD0gc2VsZi50cmVhc3VyZUNoYW5jZSkge1xuICAgICAgICAgICAgICAgICAgICBmb3VuZFRyZWFzdXJlKCk7XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2VsZi5leHBsb3JlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHJhbmRvbUJhdHRsZSgpIHtcbiAgICAgICAgICAgICAgICBzdGF0dXNNZXNzYWdlcy5tZXNzYWdlKFwiUmFuZG9tIGJhdHRsZSFcIik7XG4gICAgICAgICAgICAgICAgc2VsZi5lbmVteUNoYW5jZSAqPSAwLjg7IC8vIHJlZHVjZSB0aGUgY2hhbmNlIGVhY2ggdGltZSB3ZSB2aXNpdCB0aGlzIHJvb21cblxuICAgICAgICAgICAgICAgIHZhciBlbmVtaWVzID0gW3tuYW1lOiAnZ29ibGluJywgaHA6IDUsIGF0azogMSwgZGVmOiAxfV07XG5cbiAgICAgICAgICAgICAgICB2YXIgYmF0dGxlID0gbmV3IEJhdHRsZShlbmVtaWVzKTtcbiAgICAgICAgICAgICAgICBiYXR0bGUuZmlnaHQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gZm91bmRUcmVhc3VyZSgpIHtcbiAgICAgICAgICAgICAgICBzdGF0dXNNZXNzYWdlcy5tZXNzYWdlKFwiRm91bmQgdHJlYXN1cmUhXCIpO1xuICAgICAgICAgICAgICAgIHNlbGYudHJlYXN1cmVDaGFuY2UgKj0gMC43NTtcbiAgICAgICAgICAgICAgICByZXNvdXJjZXMuZ29sZC5jdXJyZW50ICs9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwICogbWFwLmxldmVsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gdHJhcCgpIHtcbiAgICAgICAgICAgICAgICBzdGF0dXNNZXNzYWdlcy5tZXNzYWdlKFwiVHJpZ2dlcmVkIGEgdHJhcCFcIik7XG4gICAgICAgICAgICAgICAgc2VsZi50cmFwQ2hhbmNlICo9IDAuODtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgICAgZnVuY3Rpb24gRmxvb3IobWFwLCByb29tQ291bnQpIHtcbiAgICAgICAgICAgIHJvb21Db3VudCA9IE1hdGguZmxvb3Iocm9vbUNvdW50IHx8IDEpO1xuXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgICAgIHRoaXMuY3VycmVudFJvb20gPSAwO1xuICAgICAgICAgICAgdGhpcy5leHBsb3JlID0gZXhwbG9yZTtcbiAgICAgICAgICAgIHRoaXMuZXhwbG9yZWRQY3QgPSAwO1xuICAgICAgICAgICAgdGhpcy5mb3VuZFN0YWlycyA9IGZhbHNlOyAgIC8vIGNhbiBnbyB0byBuZXh0IGZsb29yP1xuICAgICAgICAgICAgdGhpcy5yb29tcyA9IFtdO1xuXG4gICAgICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcm9vbUNvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJvb21zLnB1c2gobmV3IFJvb20obWFwLCBzZWxmKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICAgICAgZnVuY3Rpb24gZXhwbG9yZSh0b3RhbEZsb29ycykge1xuICAgICAgICAgICAgICAgIHZhciByb29tID0gc2VsZi5yb29tc1tzZWxmLmN1cnJlbnRSb29tXTtcbiAgICAgICAgICAgICAgICByb29tLmV4cGxvcmUoKTtcblxuICAgICAgICAgICAgICAgIHZhciBoYXNTdGFpcnMgPSAoc2VsZi5jdXJyZW50Um9vbSA9PSBzZWxmLnJvb21zLmxlbmd0aCAtIDEpIHx8IE1hdGgucmFuZG9tKCkgPD0gcm9vbS5oYXNTdGFpcnM7XG5cbiAgICAgICAgICAgICAgICBpZiAodG90YWxGbG9vcnMgPiAxICYmICFzZWxmLmZvdW5kU3RhaXJzICYmIGhhc1N0YWlycykge1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXNNZXNzYWdlcy5tZXNzYWdlKFwiRm91bmQgc3RhaXJzIHRvIHRoZSBuZXh0IGxldmVsLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5mb3VuZFN0YWlycyA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCF1cGdyYWRlcy5hdXRvTWFwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIGF1dG9tYXAsIHdlIGRvbid0IGdldCBsb3N0XG4gICAgICAgICAgICAgICAgICAgIGlmIChNYXRoLnJhbmRvbSgpIDw9IGdldExvc3RDaGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1c01lc3NhZ2VzLm1lc3NhZ2UoXCJZb3UgZ2V0IGxvc3QhXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jdXJyZW50Um9vbSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHJvb21Db3VudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuY3VycmVudFJvb20gPCByb29tQ291bnQgLSAxKVxuICAgICAgICAgICAgICAgICAgICBzZWxmLmN1cnJlbnRSb29tKys7XG5cbiAgICAgICAgICAgICAgICB2YXIgZXhwbG9yZWQgPSBfLmZpbHRlcihzZWxmLnJvb21zLCAnZXhwbG9yZWQnKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgc2VsZi5leHBsb3JlZFBjdCA9IGV4cGxvcmVkIC8gc2VsZi5yb29tcy5sZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcGFyYW0ge051bWJlcn0gbGV2ZWwgLSB0aGUgbGV2ZWwgb2YgZGlmZmljdWx0eSBvZiB0aGUgZHVuZ2VvblxuICAgICAgICAgKiBAcGFyYW0ge051bWJlcn0gZmxvb3JDb3VudCAtIHRoZSBudW1iZXIgb2YgZmxvb3JzXG4gICAgICAgICAqL1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gTWFwKGFyZ3MpIHtcblxuICAgICAgICAgICAgYXJncyA9IGFyZ3MgfHwge307XG5cbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgICAgICAgICBsZXZlbCA9IGFyZ3MubGV2ZWwgfHwgMSxcbiAgICAgICAgICAgICAgICBmbG9vckNvdW50ID0gYXJncy5mbG9vckNvdW50IHx8IE1hdGgucmFuZG9tKCkgKiBsZXZlbCAqIDIsXG4gICAgICAgICAgICAgICAgcm9vbUNvdW50ID0gYXJncy5yb29tQ291bnQgfHwgTWF0aC5yYW5kb20oKSAqIDUwICsgKE1hdGgucmFuZG9tKCkgKiA1ICsgMTApO1xuXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRGbG9vciA9IDA7XG4gICAgICAgICAgICB0aGlzLmV4cGxvcmUgPSBleHBsb3JlO1xuICAgICAgICAgICAgdGhpcy5leHBsb3JlZFBjdCA9IDA7XG4gICAgICAgICAgICB0aGlzLmZsb29ycyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5sZXZlbCA9IGxldmVsO1xuXG4gICAgICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZsb29yQ291bnQ7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuZmxvb3JzLnB1c2gobmV3IEZsb29yKHNlbGYsIHJvb21Db3VudCkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBjaGFuZ2VGbG9vcihuZXdGbG9vcikge1xuICAgICAgICAgICAgICAgIHNlbGYuY3VycmVudEZsb29yID0gbmV3Rmxvb3IgfHwgc2VsZi5jdXJyZW50Rmxvb3I7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGV4cGxvcmUoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZsb29yID0gdXRpbHMuY2xhbXAoc2VsZi5jdXJyZW50Rmxvb3IsIDAsIHNlbGYuZmxvb3JzLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgc2VsZi5mbG9vcnNbZmxvb3JdLmV4cGxvcmUoc2VsZi5mbG9vcnMubGVuZ3RoKTtcblxuICAgICAgICAgICAgICAgIHZhciBleHBsb3JlZCA9IF8ucmVkdWNlKHNlbGYuZmxvb3JzLCBmdW5jdGlvbiAocGN0LCBmbG9vciwgaWR4KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRVhQTE9SRUQ6IFwiICsgZmxvb3IpO1xuICAgICAgICAgICAgICAgICAgICBwY3QgKz0gZmxvb3IuZXhwbG9yZWRQY3Q7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwY3Q7XG4gICAgICAgICAgICAgICAgfSwgMCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoZXhwbG9yZWQgPiBzZWxmLmV4cGxvcmVkUGN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlcy54cC5jdXJyZW50ICs9IChyb29tWHBCYXNlICogbGV2ZWwgKiAoc2VsZi5jdXJyZW50Rmxvb3IgKyAxKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNlbGYuZXhwbG9yZWRQY3QgPSBleHBsb3JlZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5mYWN0b3J5KCdNYXAnLCBtYXBGYWN0b3J5KTtcbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yMy8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGZ1bmN0aW9uIEFjdGlvbnMocGFydHkpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5hY3Rpb25EZWZpbml0aW9ucyA9IHtcblxuICAgICAgICAgICAgZXhwbG9yZToge1xuICAgICAgICAgICAgICAgIHBjdENvbXBsZXRlOiAxLFxuICAgICAgICAgICAgICAgIHNwZWVkOiAwLjAyLFxuICAgICAgICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24gKG1hcCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZXhwbG9yZWRQY3QgPSAoKE1hdGgucmFuZG9tKCkgKiA1KSArIDUpIC8gMTAwOyAgLy8gcmFuZG9tIHBjdCBiZXR3ZWVuIDUtMTAlXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hcC5zZWNyZXREb29yUGN0ID4gMCkge1xuXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXAuZXhwbG9yZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMucHJvY2Vzc1RpY2sgPSBwcm9jZXNzVGljaztcblxuXG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICBmdW5jdGlvbiBwcm9jZXNzVGljaygpIHtcbiAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChzZWxmLmFjdGlvbkRlZmluaXRpb25zLCBmdW5jdGlvbiAoYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbi5wY3RDb21wbGV0ZSA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uLnBjdENvbXBsZXRlICs9IGFjdGlvbi5zcGVlZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLnNlcnZpY2UoJ2FjdGlvbnMnLCBBY3Rpb25zKTtcbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yNS8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8qKlxuICAgICAqIEBuZ0luamVjdFxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBiYXR0bGVGYWN0b3J5KHBhcnR5LCByZXNvdXJjZXMsIHVwZ3JhZGVzKSB7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIEJhdHRsZShlbmVtaWVzKSB7XG5cbiAgICAgICAgICAgIHZhciBzb3J0ZWQgPSBfLnNvcnRCeShwYXJ0eS5jaGFyYWN0ZXJzLmNvbmNhdChlbmVtaWVzKSwgJ3NwZWVkJyk7XG5cbiAgICAgICAgICAgIHRoaXMuZmlnaHQgPSBmaWdodDtcblxuICAgICAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBmaWdodCgpIHtcbiAgICAgICAgICAgICAgICByZXNvdXJjZXMueHAuY3VycmVudCArPSBzb3J0ZWQubGVuZ3RoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmZhY3RvcnkoJ0JhdHRsZScsIGJhdHRsZUZhY3RvcnkpO1xuXG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjIvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBmdW5jdGlvbiBjb25maWcoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0aWNrc1BlclNlY29uZDogNSxcbiAgICAgICAgICAgIGFwaVNlcnZlcjogJ2h0dHA6Ly9sb2NhbGhvc3Q6MTMwOTgvJ1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmZhY3RvcnkoJ2NvbmZpZycsIGNvbmZpZyk7XG5cbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yMi8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBUSUNLID0gXCJldmVudDp0aWNrXCI7XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBFdmVudExvb3AoJHJvb3RTY29wZSwgJGludGVydmFsLCBjb25maWcpIHtcblxuICAgICAgICB0aGlzLm9uVGljayA9IG9uVGljaztcblxuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgdmFyIHRpbWVyID0gJGludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRpY2soKTtcbiAgICAgICAgfSwgMTAwMCAvIGNvbmZpZy50aWNrc1BlclNlY29uZCk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJGludGVydmFsLmNhbmNlbCh0aW1lcik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICBmdW5jdGlvbiBvblRpY2soc2NvcGUsIGhhbmRsZXIpIHtcbiAgICAgICAgICAgIHNjb3BlLiRvbihUSUNLLCBmdW5jdGlvbiAoZSwgYXJncykge1xuICAgICAgICAgICAgICAgIGhhbmRsZXIoYXJncyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHRpY2soKSB7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoVElDSywge30pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuc2VydmljZSgnZXZlbnRMb29wJywgRXZlbnRMb29wKTtcblxufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzIyLzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyoqXG4gICAgICogQG5nSW5qZWN0XG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgZnVuY3Rpb24gR2FtZSgkcm9vdFNjb3BlLCBldmVudExvb3AsIHBhcnR5LCBhY3Rpb25zLCByZXNvdXJjZXMsIGxvY2F0aW9ucywgdXBncmFkZXMpIHtcblxuICAgICAgICBldmVudExvb3Aub25UaWNrKCRyb290U2NvcGUsIGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInRpY2tcIik7XG5cbiAgICAgICAgICAgIGFjdGlvbnMucHJvY2Vzc1RpY2soKTtcbiAgICAgICAgICAgIHVwZ3JhZGVzLnByb2Nlc3NUaWNrKCk7XG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgbG9jYXRpb25zLmNoYW5nZUxvY2F0aW9uKCd0b3duJykoKTtcbiAgICAgICAgbG9jYXRpb25zLmV4cGxvcmUoKTtcblxuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICB0aGlzLnBhcnR5ID0gcGFydHkuY2hhcmFjdGVycztcbiAgICAgICAgdGhpcy5hY3Rpb25TcGVlZCA9IHtcbiAgICAgICAgICAgIGV4cGxvcmU6IDEsXG4gICAgICAgICAgICBnYXRoZXI6IDFcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5sb2NhdGlvbiA9IGN1cnJlbnRMb2NhdGlvbjtcbiAgICAgICAgdGhpcy5yZXNvdXJjZXMgPSBhdmFpbGFibGVSZXNvdXJjZXM7XG5cblxuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICBmdW5jdGlvbiBhdmFpbGFibGVSZXNvdXJjZXMoKSB7XG4gICAgICAgICAgICB2YXIgZmlsdGVyZWQgPSBfLmZpbHRlcihyZXNvdXJjZXMsICd2aXNpYmxlJyk7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjdXJyZW50TG9jYXRpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gbG9jYXRpb25zLmN1cnJlbnQoKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuc2VydmljZSgnZ2FtZScsIEdhbWUpO1xuXG59KSgpO1xuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yNi8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGZ1bmN0aW9uIGJpbmRBY3Rpb24oYWN0aW9uLCB0b09iamVjdCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgYWN0aW9uKHRvT2JqZWN0KTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBMb2NhdGlvbnMoJHN0YXRlLCAkcSwgYWN0aW9ucywgc3RhdHVzTWVzc2FnZXMsIE1hcCkge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgICAgIGxvYztcblxuICAgICAgICB0aGlzLmNoYW5nZUxvY2F0aW9uID0gY2hhbmdlTG9jYXRpb247XG4gICAgICAgIHRoaXMuY3VycmVudCA9IGN1cnJlbnRMb2NhdGlvbjtcbiAgICAgICAgdGhpcy5leHBsb3JlID0gZXhwbG9yZTtcbiAgICAgICAgdGhpcy5sb2NhdGlvbnMgPSBbXG5cbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZDogJ3Rvd24nLFxuICAgICAgICAgICAgICAgIG5hbWU6ICdUb3duJyxcbiAgICAgICAgICAgICAgICBtYXA6IG5ldyBNYXAoe2xldmVsOiAxLCBmbG9vckNvdW50OiAxLCByb29tQ291bnQ6IDF9KSxcbiAgICAgICAgICAgICAgICBkaXNjb3ZlcmVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0lubicsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBnbyB0byB0aGUgaW5uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzTWVzc2FnZXMubWVzc2FnZShcIkNhbid0IGdvIHRvIHRoZSBpbm4geWV0Li4uXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnU3VwcGxpZXMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ28gdG8gdGhlIHN0b3JlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdMZWF2ZSB0b3duJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogY2hhbmdlTG9jYXRpb24oJ2ZvcmVzdCcsICdZb3UgbGVhdmUgdG93biBhbmQgZW50ZXIgdGhlIGZvcmVzdC4nKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSxcblxuXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWQ6ICdmb3Jlc3QnLFxuICAgICAgICAgICAgICAgIG5hbWU6ICdGb3Jlc3QnLFxuICAgICAgICAgICAgICAgIG1hcDogbmV3IE1hcCh7bGV2ZWw6IDEsIGZsb29yQ291bnQ6IDEsIHJvb21Db3VudDogNjAwICsgKE1hdGgucmFuZG9tKCkgKiAxMDApfSksXG4gICAgICAgICAgICAgICAgZGlzY292ZXJlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgdHJlYXN1cmU6IFtcbiAgICAgICAgICAgICAgICAgICAge25hbWU6ICdnb2xkJywgcGN0OiAxfVxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnUmV0dXJuIHRvIHRvd24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBjaGFuZ2VMb2NhdGlvbigndG93bicsICdZb3UgcmV0dXJuIHRvIHRoZSB0b3duLicpXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdFeHBsb3JlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGV4cGxvcmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmV4cGxvcmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0dhdGhlciBoZXJicycsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBnYXRoZXIgc29tZSBoZXJic1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnRW50ZXIgZHVuZ2VvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICBleHBsb3JlUGN0OiAwLjQsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnWW91IGRpc2NvdmVyZWQgdGhlIHN0YXJ0aW5nIGR1bmdlb24hJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogY2hhbmdlTG9jYXRpb24oJ3N0YXJ0aW5nRHVuZ2VvbicsICdZb3UgZW50ZXIgdGhlIGR1bmdlb24uJylcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0sXG5cblxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlkOiAnc3RhcnRpbmdEdW5nZW9uJyxcbiAgICAgICAgICAgICAgICBuYW1lOiAnU3RhcnRpbmcgRHVuZ2VvbicsXG4gICAgICAgICAgICAgICAgbWFwOiBuZXcgTWFwKHtsZXZlbDogMSwgZmxvb3JDb3VudDogMTAsIHJvb21Db3VudDogMTAwfSksXG4gICAgICAgICAgICAgICAgZGlzY292ZXJlZDogZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgXTtcblxuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICBmdW5jdGlvbiBjaGFuZ2VMb2NhdGlvbihuZXdMb2NhdGlvbiwgbWVzc2FnZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBsb2MgPSBfLmZpbmRXaGVyZShzZWxmLmxvY2F0aW9ucywge2lkOiBuZXdMb2NhdGlvbn0pO1xuICAgICAgICAgICAgICAgIHN0YXR1c01lc3NhZ2VzLm1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY3VycmVudExvY2F0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGxvYztcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGV4cGxvcmUoKSB7XG4gICAgICAgICAgICB2YXIgbWFwID0gbG9jLm1hcDtcbiAgICAgICAgICAgIG1hcC5leHBsb3JlKGxvYyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5zZXJ2aWNlKCdsb2NhdGlvbnMnLCBMb2NhdGlvbnMpO1xufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzI3LzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyoqXG4gICAgICogQG5nSW5qZWN0XG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgZnVuY3Rpb24gUGFydHkoQ2hhcmFjdGVyKSB7XG5cbiAgICAgICAgdmFyIGNoYXJhY3RlcnMgPSBbXG4gICAgICAgICAgICBDaGFyYWN0ZXIuY3JlYXRlKHtuYW1lOiAnU2lyIEplZXZlcycsIGNsYXNzOiAna25pZ2h0J30pLFxuICAgICAgICAgICAgQ2hhcmFjdGVyLmNyZWF0ZSh7bmFtZTogJ1Rob3JncmltbSBBeGViZWFyZCcsIGNsYXNzOiAnYmVyc2Vya2VyJ30pLFxuICAgICAgICAgICAgQ2hhcmFjdGVyLmNyZWF0ZSh7bmFtZTogJ0ZlbnJpcyBSYXRmaW5nZXJzJywgY2xhc3M6ICd0aGllZid9KSxcbiAgICAgICAgICAgIENoYXJhY3Rlci5jcmVhdGUoe25hbWU6ICdCb3JpcyBPbmUtc2hvdCcsIGNsYXNzOiAnYXJjaGVyJ30pLFxuICAgICAgICAgICAgQ2hhcmFjdGVyLmNyZWF0ZSh7bmFtZTogJ0x5c2FubmEgRGF3bmJyaW5nZXInLCBjbGFzczogJ3NvcmNlcmVyJ30pLFxuICAgICAgICAgICAgQ2hhcmFjdGVyLmNyZWF0ZSh7bmFtZTogJ0xvdGhhciBHcmVlbmJyb29rJywgY2xhc3M6ICdoZWFsZXInfSlcbiAgICAgICAgXTtcblxuICAgICAgICB0aGlzLmNoYXJhY3RlcnMgPSBjaGFyYWN0ZXJzO1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLnNlcnZpY2UoJ3BhcnR5JywgUGFydHkpO1xuXG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjUvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBmdW5jdGlvbiByZXNvdXJjZXMoKSB7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHhwOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3hwJyxcbiAgICAgICAgICAgICAgICB2aXNpYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGN1cnJlbnQ6IDBcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGZvb2Q6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnZm9vZCcsXG4gICAgICAgICAgICAgICAgdmlzaWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjdXJyZW50OiAwLFxuICAgICAgICAgICAgICAgIG1heDogMTAwMFxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZ29sZDoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdnb2xkJyxcbiAgICAgICAgICAgICAgICB2aXNpYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGN1cnJlbnQ6IDBcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGlyb246IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnaXJvbicsXG4gICAgICAgICAgICAgICAgY3VycmVudDogMCxcbiAgICAgICAgICAgICAgICBtYXg6IDEwMFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmZhY3RvcnkoJ3Jlc291cmNlcycsIHJlc291cmNlcyk7XG5cbn0pXG4oKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzI2LzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIFNUQVRVU19NRVNTQUdFID0gXCJnYW1lOnN0YXR1c01lc3NhZ2VcIjtcblxuICAgIC8qKlxuICAgICAqIEBuZ0luamVjdFxuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIFN0YXR1c01lc3NhZ2VzKCRyb290U2NvcGUpIHtcblxuICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgICB0aGlzLm9uTWVzc2FnZSA9IG9uTWVzc2FnZTtcblxuICAgICAgICBmdW5jdGlvbiBtZXNzYWdlKHN0YXR1cykge1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KFNUQVRVU19NRVNTQUdFLCB7bWVzc2FnZTogc3RhdHVzfSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBvbk1lc3NhZ2Uoc2NvcGUsIGhhbmRsZXIpIHtcbiAgICAgICAgICAgIHNjb3BlLiRvbihTVEFUVVNfTUVTU0FHRSwgZnVuY3Rpb24gKGUsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBoYW5kbGVyKGFyZ3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5zZXJ2aWNlKCdzdGF0dXNNZXNzYWdlcycsIFN0YXR1c01lc3NhZ2VzKTtcbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yNC8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8qKlxuICAgICAqIEBuZ0luamVjdFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIFVwZ3JhZGVzKCkge1xuXG4gICAgICAgIHRoaXMucHJvY2Vzc1RpY2sgPSBwcm9jZXNzVGljaztcbiAgICAgICAgdGhpcy51cGdyYWRlRGVmaW5pdGlvbnMgPSB7XG5cbiAgICAgICAgICAgIGF1dG9tYXA6IHtcbiAgICAgICAgICAgICAgICBhY3RpdmU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGF2YWlsYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb3N0OiAzMDAsXG4gICAgICAgICAgICAgICAgdGV4dDogJ0F1dG9tYXAnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUHJldmVudHMgeW91IGZyb20gZ2V0dGluZyBsb3N0LidcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICBmdW5jdGlvbiBwcm9jZXNzVGljaygpIHtcbiAgICAgICAgICAgIC8vIGRvIHN0dWZmIHRoYXQgc2hvdWxkIGhhcHBlbiBldmVyeSB0aWNrLCBkZXBlbmRpbmcgb24gdGhlIHVwZ3JhZGVzXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5zZXJ2aWNlKCd1cGdyYWRlcycsIFVwZ3JhZGVzKTtcblxufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzI3LzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgZnVuY3Rpb24gVXRpbHMoKSB7XG5cbiAgICAgICAgdGhpcy5jbGFtcCA9IGNsYW1wO1xuXG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgZnVuY3Rpb24gY2xhbXAodmFsdWUsIG1pbiwgbWF4KSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5taW4oTWF0aC5tYXgobWluLCB2YWx1ZSksIG1heCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5zZXJ2aWNlKCd1dGlscycsIFV0aWxzKTtcblxufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzIyLzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyoqXG4gICAgICogQG5nSW5qZWN0XG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgZnVuY3Rpb24gY2hhcmFjdGVyRmFjdG9yeShjb25maWcsICRyZXNvdXJjZSkge1xuICAgICAgICB2YXIgdXJsID0gY29uZmlnLmFwaVNlcnZlciArICdjaGFyYWN0ZXIvOmlkJztcbiAgICAgICAgdmFyIENoYXJhY3RlciA9ICRyZXNvdXJjZSh1cmwsIHtpZDogJ0BpZCd9KTtcbiAgICAgICAgdmFyIGlkID0gMTtcblxuICAgICAgICBhbmd1bGFyLmV4dGVuZChDaGFyYWN0ZXIsIHtcblxuICAgICAgICAgICAgY3JlYXRlOiBmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgICAgIGFyZ3MgPSBhcmdzIHx8IHt9O1xuICAgICAgICAgICAgICAgIHZhciBjaGFyID0gbmV3IENoYXJhY3Rlcih7aWQ6IGFyZ3MuaWQgfHwgaWQrK30pO1xuXG4gICAgICAgICAgICAgICAgY2hhci5uYW1lID0gYXJncy5uYW1lIHx8ICdjaGFyYWN0ZXInO1xuICAgICAgICAgICAgICAgIGNoYXIuY2xhc3MgPSBhcmdzLmNsYXNzO1xuICAgICAgICAgICAgICAgIGNoYXIubGV2ZWwgPSAxO1xuICAgICAgICAgICAgICAgIGNoYXIuaHAgPSB7Y3VycmVudDogMTAsIG1heDogMTB9O1xuICAgICAgICAgICAgICAgIGNoYXIubXAgPSB7Y3VycmVudDogMTAsIG1heDogMTB9O1xuICAgICAgICAgICAgICAgIGNoYXIuYXRrID0gMTA7XG4gICAgICAgICAgICAgICAgY2hhci5kZWYgPSAxMDtcbiAgICAgICAgICAgICAgICBjaGFyLm1hZ2ljID0gMTA7XG4gICAgICAgICAgICAgICAgY2hhci5zcGVlZCA9IDEwO1xuICAgICAgICAgICAgICAgIGNoYXIuYWMgPSAxMDtcblxuICAgICAgICAgICAgICAgIHJldHVybiBjaGFyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gQ2hhcmFjdGVyO1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmZhY3RvcnkoJ0NoYXJhY3RlcicsIGNoYXJhY3RlckZhY3RvcnkpO1xufSkoKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=