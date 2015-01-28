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
        this.changeLocation = locations.changeLocation;
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
 * Created by john on 1/27/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     */
    function actionButtonDirective(eventLoop, config, actions, game) {

        return {
            restrict: 'AE',

            scope: {
                action: '='
            },

            template: "<div class='action-bar' ng-click='doAction()'></div>",
            //template: "<div class='action-bar' ng-click='doAction()'>{{action.text}}</div>",

            link: function (scope, elem, attr) {
                var x = scope.action;

                var increasePerTick = scope.speed / config.ticksPerSecond;
                var bar = angular.element(elem.children()[0]).append('<div class="timer-bar-progress"></div>');
                var text = angular.element(elem.children()[0]).append("<span class='action-bar-text'>" + scope.action.text + "</span>");
                var progress = angular.element(bar.children()[0]);

                eventLoop.onTick(scope, function (args) {
                    var action = scope.action;

                    if (!(scope.percentage < 1 && scope.waiting)) {
                        if (scope.waiting) {
                            progress.removeClass('timer-bar-running');
                            progress.addClass('timer-bar-complete');
                            scope.waiting = false;
                        }
                    }
                    if (scope.percentage === 1 && action.pctComplete === 0) {
                        progress.removeClass('timer-bar-complete');
                    }
                    scope.percentage = action.pctComplete;
                    progress.css('width', (scope.percentage * 100) + '%');
                });

                progress.css('width', '0%');
                bar.css('background-color', 'black');

                scope.doAction = doAction;
                scope.percentage = 0;
                scope.waiting = false;

                /////////////////////////////////////

                function doAction() {
                    if (!scope.waiting) {
                        if (scope.onClick) {
                            scope.onClick();
                        }
                        scope.percentage = 0;
                        scope.waiting = true;
                        progress.addClass('timer-bar-running');
                        progress.removeClass('timer-bar-complete');

                        actions.doAction(game, scope.action);
                    }
                }
            }
        };
    }
    actionButtonDirective.$inject = ["eventLoop", "config", "actions", "game"];

    angular.module('game')
        .directive('actionButton', actionButtonDirective);
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
    function mapFactory(utils, party, statusMessages, upgrades, resources, Battle) {

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
    mapFactory.$inject = ["utils", "party", "statusMessages", "upgrades", "resources", "Battle"];

    angular.module('game')
        .factory('Map', mapFactory);
})();
/**
 * Created by john on 1/23/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     * @param party
     * @param statusMessages
     * @constructor
     */
    function Actions($q, party, statusMessages) {

        var self = this;

        this.actionDefinitions = {

            explore: {
                text: 'Explore',
                pctComplete: 0,
                speed: 0.2,
                onStart: function () {

                },
                onComplete: function (game) {
                    game.locations.explore();
                }
            }

        };
        this.doAction = doAction;
        this.processTick = processTick;


        ////////////////////////////

        function doAction(game, action) {
            if (!action.running) {
                action.pctComplete = 0;
                action.running = true;
                action.deferred = $q.defer();

                action.deferred.promise.then(function (resolved) {
                    action.onComplete(game);
                    action.pctComplete = 0;
                });
            }
        }

        function processTick() {
            angular.forEach(self.actionDefinitions, function (action) {
                if (action.pctComplete < 1 && action.running) {
                    action.pctComplete += action.speed;
                } else {
                    if (action.deferred) {
                        action.deferred.resolve({});
                        action.deferred = null;
                        action.running = false;
                    }
                }
            });
        }
    }
    Actions.$inject = ["$q", "party", "statusMessages"];

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
        this.locations = locations;
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
    function Locations($state, $q, statusMessages, actions, Map) {

        var self = this,
            actionDefs = actions.actionDefinitions,
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
                    actionDefs.explore,
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
                loc.discovered = true;
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
    Locations.$inject = ["$state", "$q", "statusMessages", "actions", "Map"];

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0NoYXJhY3RlclN0YXR1c0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9NYWluQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL2VuZW1pZXMuanMiLCJkaXJlY3RpdmVzL2FjdGlvbkJ1dHRvbi5qcyIsImRpcmVjdGl2ZXMvdGltZXJCYXIuanMiLCJmaWx0ZXJzL2Rpc2NvdmVyZWRMb2NhdGlvbi5qcyIsImZpbHRlcnMvcGVyY2VudGFnZS5qcyIsInNlcnZpY2VzL0R1bmdlb24uanMiLCJzZXJ2aWNlcy9NYXAuanMiLCJzZXJ2aWNlcy9hY3Rpb25zLmpzIiwic2VydmljZXMvYmF0dGxlLmpzIiwic2VydmljZXMvY29uZmlnLmpzIiwic2VydmljZXMvZXZlbnRMb29wLmpzIiwic2VydmljZXMvZ2FtZS5qcyIsInNlcnZpY2VzL2xvY2F0aW9ucy5qcyIsInNlcnZpY2VzL3BhcnR5LmpzIiwic2VydmljZXMvcmVzb3VyY2VzLmpzIiwic2VydmljZXMvc3RhdHVzTWVzc2FnZXMuanMiLCJzZXJ2aWNlcy91cGdyYWRlcy5qcyIsInNlcnZpY2VzL3V0aWxzLmpzIiwic2VydmljZXMvcmVzb3VyY2VzL0NoYXJhY3Rlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FBR0EsQ0FBQyxZQUFZOztJQUVUOzs7Ozs7O0lBT0EsU0FBUyxVQUFVLGdCQUFnQixvQkFBb0I7O1FBRW5ELG1CQUFtQixVQUFVOztRQUU3QjthQUNLLE1BQU0sUUFBUTtnQkFDWCxVQUFVO2dCQUNWLEtBQUs7Z0JBQ0wsYUFBYTtnQkFDYixZQUFZO2dCQUNaLGNBQWM7OzthQUdqQixNQUFNLGdCQUFnQjtnQkFDbkIsS0FBSztnQkFDTCxhQUFhOzs7YUFHaEIsTUFBTSx3QkFBd0I7Z0JBQzNCLFFBQVE7b0JBQ0osV0FBVzs7Z0JBRWYsYUFBYTtnQkFDYixZQUFZO2dCQUNaLGNBQWM7Ozs7OztJQUsxQixRQUFRLE9BQU8sUUFBUSxDQUFDLGFBQWE7U0FDaEMsT0FBTztTQUNQLElBQUksQ0FBQyxjQUFjLFVBQVUsVUFBVSxZQUFZLFFBQVE7WUFDeEQsV0FBVyxJQUFJLHVCQUF1QixVQUFVLE9BQU8sSUFBSSxVQUFVLE1BQU0sWUFBWTtnQkFDbkYsT0FBTyxXQUFXO2dCQUNsQixXQUFXLGlCQUFpQjs7O0tBR3ZDO0FDakRMOzs7QUFHQSxDQUFDLFlBQVk7O0lBRVQ7Ozs7OztJQU1BLFNBQVMsMEJBQTBCLFFBQVE7UUFDdkMsSUFBSSxZQUFZLE9BQU8sT0FBTzs7UUFFOUIsS0FBSyxZQUFZO1FBQ2pCLEtBQUssU0FBUzs7OztRQUlkLFNBQVMsU0FBUztZQUNkLE9BQU8sR0FBRzs7Ozs7O0lBS2xCLFFBQVEsT0FBTztTQUNWLFdBQVcsNkJBQTZCOztLQUU1QztBQzVCTDs7O0FBR0EsQ0FBQyxZQUFZOztJQUVUOzs7Ozs7SUFNQSxTQUFTLGVBQWUsUUFBUSxRQUFRLE1BQU0sU0FBUyxnQkFBZ0IsV0FBVzs7UUFFOUUsSUFBSSxPQUFPOztRQUVYLEtBQUssY0FBYyxLQUFLO1FBQ3hCLEtBQUssVUFBVSxRQUFRO1FBQ3ZCLEtBQUssZ0JBQWdCO1FBQ3JCLEtBQUssaUJBQWlCLFVBQVU7UUFDaEMsS0FBSyxVQUFVO1FBQ2YsS0FBSyxlQUFlO1FBQ3BCLEtBQUssV0FBVyxLQUFLO1FBQ3JCLEtBQUssWUFBWSxVQUFVO1FBQzNCLEtBQUssV0FBVztRQUNoQixLQUFLLFFBQVEsS0FBSztRQUNsQixLQUFLLFlBQVksS0FBSztRQUN0QixLQUFLLFNBQVM7UUFDZCxLQUFLLE9BQU87O1FBRVosS0FBSyxNQUFNLEdBQUc7Ozs7UUFJZCxlQUFlLFVBQVUsUUFBUSxVQUFVLE1BQU07WUFDN0MsS0FBSyxTQUFTLFFBQVEsQ0FBQyxNQUFNLEtBQUs7WUFDbEMsSUFBSSxLQUFLLFNBQVMsU0FBUyxJQUFJO2dCQUMzQixLQUFLLFNBQVM7Ozs7UUFJdEIsU0FBUyxjQUFjO1lBQ25CLGVBQWUsUUFBUTs7O1FBRzNCLFNBQVMsVUFBVTtZQUNmLGVBQWUsUUFBUTs7O1FBRzNCLFNBQVMsU0FBUztZQUNkLFFBQVEsSUFBSTs7O1FBR2hCLFNBQVMsY0FBYyxXQUFXO1lBQzlCLE9BQU8sR0FBRyx3QkFBd0I7Z0JBQzlCLFdBQVc7Ozs7OztJQUt2QixRQUFRLE9BQU87U0FDVixXQUFXLGtCQUFrQjtLQUNqQztBQzdETDs7O0FBR0EsQ0FBQyxZQUFZOztJQUVUOzs7OztJQUtBLFNBQVMsZUFBZTs7UUFFcEIsSUFBSSxVQUFVO1lBQ1Y7Z0JBQ0ksQ0FBQyxNQUFNLFVBQVUsT0FBTyxLQUFLLEtBQUssR0FBRyxLQUFLO2dCQUMxQyxDQUFDLE1BQU0sVUFBVSxPQUFPLEtBQUssS0FBSyxHQUFHLEtBQUs7Ozs7UUFJbEQsT0FBTyxTQUFTLE1BQU0sT0FBTztZQUN6QixRQUFRLEtBQUssSUFBSSxHQUFHLEtBQUssSUFBSSxPQUFPLFFBQVEsU0FBUzs7WUFFckQsSUFBSSxTQUFTLEVBQUUsT0FBTyxRQUFROztZQUU5QixRQUFRLE9BQU8sTUFBTTs7OztJQUk3QixRQUFRLE9BQU87U0FDVixRQUFRLFNBQVM7O0FBRTFCO0FDL0JBOzs7QUFHQSxDQUFDLFlBQVk7O0lBRVQ7Ozs7O0lBS0EsU0FBUyxzQkFBc0IsV0FBVyxRQUFRLFNBQVMsTUFBTTs7UUFFN0QsT0FBTztZQUNILFVBQVU7O1lBRVYsT0FBTztnQkFDSCxRQUFROzs7WUFHWixVQUFVOzs7WUFHVixNQUFNLFVBQVUsT0FBTyxNQUFNLE1BQU07Z0JBQy9CLElBQUksSUFBSSxNQUFNOztnQkFFZCxJQUFJLGtCQUFrQixNQUFNLFFBQVEsT0FBTztnQkFDM0MsSUFBSSxNQUFNLFFBQVEsUUFBUSxLQUFLLFdBQVcsSUFBSSxPQUFPO2dCQUNyRCxJQUFJLE9BQU8sUUFBUSxRQUFRLEtBQUssV0FBVyxJQUFJLE9BQU8sbUNBQW1DLE1BQU0sT0FBTyxPQUFPO2dCQUM3RyxJQUFJLFdBQVcsUUFBUSxRQUFRLElBQUksV0FBVzs7Z0JBRTlDLFVBQVUsT0FBTyxPQUFPLFVBQVUsTUFBTTtvQkFDcEMsSUFBSSxTQUFTLE1BQU07O29CQUVuQixJQUFJLEVBQUUsTUFBTSxhQUFhLEtBQUssTUFBTSxVQUFVO3dCQUMxQyxJQUFJLE1BQU0sU0FBUzs0QkFDZixTQUFTLFlBQVk7NEJBQ3JCLFNBQVMsU0FBUzs0QkFDbEIsTUFBTSxVQUFVOzs7b0JBR3hCLElBQUksTUFBTSxlQUFlLEtBQUssT0FBTyxnQkFBZ0IsR0FBRzt3QkFDcEQsU0FBUyxZQUFZOztvQkFFekIsTUFBTSxhQUFhLE9BQU87b0JBQzFCLFNBQVMsSUFBSSxTQUFTLENBQUMsTUFBTSxhQUFhLE9BQU87OztnQkFHckQsU0FBUyxJQUFJLFNBQVM7Z0JBQ3RCLElBQUksSUFBSSxvQkFBb0I7O2dCQUU1QixNQUFNLFdBQVc7Z0JBQ2pCLE1BQU0sYUFBYTtnQkFDbkIsTUFBTSxVQUFVOzs7O2dCQUloQixTQUFTLFdBQVc7b0JBQ2hCLElBQUksQ0FBQyxNQUFNLFNBQVM7d0JBQ2hCLElBQUksTUFBTSxTQUFTOzRCQUNmLE1BQU07O3dCQUVWLE1BQU0sYUFBYTt3QkFDbkIsTUFBTSxVQUFVO3dCQUNoQixTQUFTLFNBQVM7d0JBQ2xCLFNBQVMsWUFBWTs7d0JBRXJCLFFBQVEsU0FBUyxNQUFNLE1BQU07Ozs7Ozs7O0lBT2pELFFBQVEsT0FBTztTQUNWLFVBQVUsZ0JBQWdCO0tBQzlCO0FDM0VMOzs7QUFHQSxDQUFDLFlBQVk7O0lBRVQ7Ozs7OztJQU1BLFNBQVMsa0JBQWtCLFdBQVcsUUFBUTs7UUFFMUMsT0FBTztZQUNILFVBQVU7O1lBRVYsU0FBUzs7WUFFVCxVQUFVOztZQUVWLE9BQU87Z0JBQ0gsT0FBTztnQkFDUCxPQUFPO2dCQUNQLFNBQVM7Z0JBQ1QsYUFBYTs7O1lBR2pCLE1BQU0sVUFBVSxPQUFPLE1BQU0sTUFBTTtnQkFDL0IsSUFBSSxDQUFDLE1BQU0sT0FBTyxNQUFNLElBQUksTUFBTTtnQkFDbEMsSUFBSSxDQUFDLE1BQU0sYUFBYSxNQUFNLElBQUksTUFBTTs7Z0JBRXhDLElBQUksa0JBQWtCLE1BQU0sUUFBUSxPQUFPO2dCQUMzQyxJQUFJLE1BQU0sUUFBUSxRQUFRLEtBQUssV0FBVyxJQUFJLE9BQU87Z0JBQ3JELElBQUksV0FBVyxRQUFRLFFBQVEsSUFBSSxXQUFXOztnQkFFOUMsVUFBVSxPQUFPLE9BQU8sVUFBVSxNQUFNO29CQUNwQyxJQUFJLE1BQU0sYUFBYSxLQUFLLE1BQU0sU0FBUzt3QkFDdkMsTUFBTSxhQUFhLEtBQUssSUFBSSxHQUFHLE1BQU0sYUFBYTsyQkFDL0M7d0JBQ0gsSUFBSSxNQUFNLFNBQVM7NEJBQ2YsU0FBUyxTQUFTOzRCQUNsQixNQUFNLFVBQVU7NEJBQ2hCLE1BQU0sYUFBYTs0QkFDbkIsTUFBTTs7O29CQUdkLFNBQVMsSUFBSSxTQUFTLENBQUMsTUFBTSxhQUFhLE9BQU87OztnQkFHckQsU0FBUyxJQUFJLFNBQVM7Z0JBQ3RCLElBQUksSUFBSSxvQkFBb0I7O2dCQUU1QixNQUFNLFlBQVk7Z0JBQ2xCLE1BQU0sYUFBYTs7OztnQkFJbkIsU0FBUyxZQUFZO29CQUNqQixJQUFJLENBQUMsTUFBTSxTQUFTO3dCQUNoQixJQUFJLE1BQU0sU0FBUzs0QkFDZixNQUFNOzt3QkFFVixNQUFNLGFBQWE7d0JBQ25CLE1BQU0sVUFBVTt3QkFDaEIsU0FBUyxZQUFZOzs7Ozs7OztJQU96QyxRQUFRLE9BQU87U0FDVixVQUFVLFlBQVk7O0tBRTFCO0FDMUVMOzs7QUFHQSxDQUFDLFlBQVk7O0lBRVQ7O0lBRUEsU0FBUywyQkFBMkI7UUFDaEMsT0FBTyxTQUFTLG1CQUFtQixXQUFXO1lBQzFDLE9BQU8sRUFBRSxNQUFNLFdBQVcsQ0FBQyxZQUFZOzs7O0lBSS9DLFFBQVEsT0FBTztTQUNWLE9BQU8sc0JBQXNCO0tBQ2pDO0FDZkw7OztBQUdBLENBQUMsWUFBWTs7SUFFVDs7SUFFQSxTQUFTLGlCQUFpQixTQUFTO1FBQy9CLE9BQU8sU0FBUyxXQUFXLE9BQU8sVUFBVTtZQUN4QyxPQUFPLFFBQVEsVUFBVSxRQUFRLEtBQUssWUFBWTs7Ozs7SUFJMUQsUUFBUSxPQUFPO1NBQ1YsT0FBTyxjQUFjOztLQUV6QjtBQ2hCTDs7O0FBR0EsQ0FBQyxZQUFZOztJQUVUOzs7Ozs7SUFNQSxTQUFTLGlCQUFpQjs7UUFFdEIsU0FBUyxPQUFPO1lBQ1osS0FBSyxjQUFjLEtBQUs7WUFDeEIsS0FBSyxhQUFhLEtBQUs7WUFDdkIsS0FBSyxpQkFBaUIsS0FBSzs7O1FBRy9CLFNBQVMsUUFBUTtZQUNiLEtBQUssY0FBYztZQUNuQixLQUFLLFFBQVE7Ozs7UUFJakIsT0FBTyxTQUFTLFFBQVEsT0FBTyxZQUFZOztZQUV2QyxhQUFhLEtBQUssV0FBVyxRQUFROztZQUVyQyxLQUFLLFFBQVE7WUFDYixLQUFLLFNBQVM7O1lBRWQsS0FBSyxJQUFJLElBQUksR0FBRyxJQUFJLFlBQVksS0FBSztnQkFDakMsS0FBSyxPQUFPLEtBQUssSUFBSTs7Ozs7SUFLakMsUUFBUSxPQUFPO1NBQ1YsUUFBUSxXQUFXO0tBQ3ZCO0FDeENMOzs7QUFHQSxDQUFDLFlBQVk7O0lBRVQ7Ozs7OztJQU1BLFNBQVMsV0FBVyxPQUFPLE9BQU8sZ0JBQWdCLFVBQVUsV0FBVyxRQUFROztRQUUzRSxJQUFJLGdCQUFnQjtRQUNwQixJQUFJLGFBQWE7O1FBRWpCLFNBQVMsS0FBSyxLQUFLLE9BQU87WUFDdEIsSUFBSSxPQUFPOztZQUVYLEtBQUssVUFBVTtZQUNmLEtBQUssV0FBVztZQUNoQixLQUFLLGNBQWMsS0FBSztZQUN4QixLQUFLLFlBQVksS0FBSyxXQUFXO1lBQ2pDLEtBQUssYUFBYSxLQUFLO1lBQ3ZCLEtBQUssaUJBQWlCLEtBQUs7O1lBRTNCLFNBQVMsVUFBVTtnQkFDZixJQUFJLEtBQUssWUFBWSxLQUFLLGFBQWE7b0JBQ25DOzt1QkFFRyxJQUFJLEtBQUssWUFBWSxLQUFLLFlBQVk7b0JBQ3pDOzt1QkFFRyxJQUFJLEtBQUssWUFBWSxLQUFLLGdCQUFnQjtvQkFDN0M7OztnQkFHSixLQUFLLFdBQVc7OztZQUdwQixTQUFTLGVBQWU7Z0JBQ3BCLGVBQWUsUUFBUTtnQkFDdkIsS0FBSyxlQUFlOztnQkFFcEIsSUFBSSxVQUFVLENBQUMsQ0FBQyxNQUFNLFVBQVUsSUFBSSxHQUFHLEtBQUssR0FBRyxLQUFLOztnQkFFcEQsSUFBSSxTQUFTLElBQUksT0FBTztnQkFDeEIsT0FBTzs7O1lBR1gsU0FBUyxnQkFBZ0I7Z0JBQ3JCLGVBQWUsUUFBUTtnQkFDdkIsS0FBSyxrQkFBa0I7Z0JBQ3ZCLFVBQVUsS0FBSyxXQUFXLEtBQUssTUFBTSxLQUFLLFdBQVcsS0FBSyxJQUFJOzs7WUFHbEUsU0FBUyxPQUFPO2dCQUNaLGVBQWUsUUFBUTtnQkFDdkIsS0FBSyxjQUFjOzs7OztRQUszQixTQUFTLE1BQU0sS0FBSyxXQUFXO1lBQzNCLFlBQVksS0FBSyxNQUFNLGFBQWE7O1lBRXBDLElBQUksT0FBTzs7WUFFWCxLQUFLLGNBQWM7WUFDbkIsS0FBSyxVQUFVO1lBQ2YsS0FBSyxjQUFjO1lBQ25CLEtBQUssY0FBYztZQUNuQixLQUFLLFFBQVE7Ozs7WUFJYixLQUFLLElBQUksSUFBSSxHQUFHLElBQUksV0FBVyxLQUFLO2dCQUNoQyxLQUFLLE1BQU0sS0FBSyxJQUFJLEtBQUssS0FBSzs7Ozs7WUFLbEMsU0FBUyxRQUFRLGFBQWE7Z0JBQzFCLElBQUksT0FBTyxLQUFLLE1BQU0sS0FBSztnQkFDM0IsS0FBSzs7Z0JBRUwsSUFBSSxZQUFZLENBQUMsS0FBSyxlQUFlLEtBQUssTUFBTSxTQUFTLE1BQU0sS0FBSyxZQUFZLEtBQUs7O2dCQUVyRixJQUFJLGNBQWMsS0FBSyxDQUFDLEtBQUssZUFBZSxXQUFXO29CQUNuRCxlQUFlLFFBQVE7b0JBQ3ZCLEtBQUssY0FBYzs7O2dCQUd2QixJQUFJLENBQUMsU0FBUyxTQUFTOztvQkFFbkIsSUFBSSxLQUFLLFlBQVksZUFBZTt3QkFDaEMsZUFBZSxRQUFRO3dCQUN2QixLQUFLLGNBQWMsS0FBSyxNQUFNLEtBQUssV0FBVzs7O2dCQUd0RCxJQUFJLEtBQUssY0FBYyxZQUFZO29CQUMvQixLQUFLOztnQkFFVCxJQUFJLFdBQVcsRUFBRSxPQUFPLEtBQUssT0FBTyxZQUFZO2dCQUNoRCxLQUFLLGNBQWMsV0FBVyxLQUFLLE1BQU07Ozs7Ozs7OztRQVNqRCxPQUFPLFNBQVMsSUFBSSxNQUFNOztZQUV0QixPQUFPLFFBQVE7O1lBRWYsSUFBSSxPQUFPO2dCQUNQLFFBQVEsS0FBSyxTQUFTO2dCQUN0QixhQUFhLEtBQUssY0FBYyxLQUFLLFdBQVcsUUFBUTtnQkFDeEQsWUFBWSxLQUFLLGFBQWEsS0FBSyxXQUFXLE1BQU0sS0FBSyxXQUFXLElBQUk7O1lBRTVFLEtBQUssZUFBZTtZQUNwQixLQUFLLFVBQVU7WUFDZixLQUFLLGNBQWM7WUFDbkIsS0FBSyxTQUFTO1lBQ2QsS0FBSyxRQUFROzs7O1lBSWIsS0FBSyxJQUFJLElBQUksR0FBRyxJQUFJLFlBQVksS0FBSztnQkFDakMsS0FBSyxPQUFPLEtBQUssSUFBSSxNQUFNLE1BQU07OztZQUdyQyxTQUFTLFlBQVksVUFBVTtnQkFDM0IsS0FBSyxlQUFlLFlBQVksS0FBSzs7O1lBR3pDLFNBQVMsVUFBVTtnQkFDZixJQUFJLFFBQVEsTUFBTSxNQUFNLEtBQUssY0FBYyxHQUFHLEtBQUssT0FBTztnQkFDMUQsS0FBSyxPQUFPLE9BQU8sUUFBUSxLQUFLLE9BQU87O2dCQUV2QyxJQUFJLFdBQVcsRUFBRSxPQUFPLEtBQUssUUFBUSxVQUFVLEtBQUssT0FBTyxLQUFLO29CQUM1RCxRQUFRLElBQUksZUFBZTtvQkFDM0IsT0FBTyxNQUFNO29CQUNiLE9BQU87bUJBQ1I7O2dCQUVILElBQUksV0FBVyxLQUFLLGFBQWE7b0JBQzdCLFVBQVUsR0FBRyxZQUFZLGFBQWEsU0FBUyxLQUFLLGVBQWU7O2dCQUV2RSxLQUFLLGNBQWM7Ozs7OztJQUsvQixRQUFRLE9BQU87U0FDVixRQUFRLE9BQU87S0FDbkI7QUM5Skw7OztBQUdBLENBQUMsWUFBWTs7SUFFVDs7Ozs7Ozs7SUFRQSxTQUFTLFFBQVEsSUFBSSxPQUFPLGdCQUFnQjs7UUFFeEMsSUFBSSxPQUFPOztRQUVYLEtBQUssb0JBQW9COztZQUVyQixTQUFTO2dCQUNMLE1BQU07Z0JBQ04sYUFBYTtnQkFDYixPQUFPO2dCQUNQLFNBQVMsWUFBWTs7O2dCQUdyQixZQUFZLFVBQVUsTUFBTTtvQkFDeEIsS0FBSyxVQUFVOzs7OztRQUszQixLQUFLLFdBQVc7UUFDaEIsS0FBSyxjQUFjOzs7OztRQUtuQixTQUFTLFNBQVMsTUFBTSxRQUFRO1lBQzVCLElBQUksQ0FBQyxPQUFPLFNBQVM7Z0JBQ2pCLE9BQU8sY0FBYztnQkFDckIsT0FBTyxVQUFVO2dCQUNqQixPQUFPLFdBQVcsR0FBRzs7Z0JBRXJCLE9BQU8sU0FBUyxRQUFRLEtBQUssVUFBVSxVQUFVO29CQUM3QyxPQUFPLFdBQVc7b0JBQ2xCLE9BQU8sY0FBYzs7Ozs7UUFLakMsU0FBUyxjQUFjO1lBQ25CLFFBQVEsUUFBUSxLQUFLLG1CQUFtQixVQUFVLFFBQVE7Z0JBQ3RELElBQUksT0FBTyxjQUFjLEtBQUssT0FBTyxTQUFTO29CQUMxQyxPQUFPLGVBQWUsT0FBTzt1QkFDMUI7b0JBQ0gsSUFBSSxPQUFPLFVBQVU7d0JBQ2pCLE9BQU8sU0FBUyxRQUFRO3dCQUN4QixPQUFPLFdBQVc7d0JBQ2xCLE9BQU8sVUFBVTs7Ozs7Ozs7SUFPckMsUUFBUSxPQUFPO1NBQ1YsUUFBUSxXQUFXO0tBQ3ZCO0FDcEVMOzs7QUFHQSxDQUFDLFlBQVk7O0lBRVQ7Ozs7OztJQU1BLFNBQVMsY0FBYyxPQUFPLFdBQVcsVUFBVTs7UUFFL0MsT0FBTyxTQUFTLE9BQU8sU0FBUzs7WUFFNUIsSUFBSSxTQUFTLEVBQUUsT0FBTyxNQUFNLFdBQVcsT0FBTyxVQUFVOztZQUV4RCxLQUFLLFFBQVE7Ozs7WUFJYixTQUFTLFFBQVE7Z0JBQ2IsVUFBVSxHQUFHLFdBQVcsT0FBTzs7Ozs7O0lBSzNDLFFBQVEsT0FBTztTQUNWLFFBQVEsVUFBVTs7S0FFdEI7QUM5Qkw7OztBQUdBLENBQUMsWUFBWTs7SUFFVDs7SUFFQSxTQUFTLFNBQVM7UUFDZCxPQUFPO1lBQ0gsZ0JBQWdCO1lBQ2hCLFdBQVc7Ozs7SUFJbkIsUUFBUSxPQUFPO1NBQ1YsUUFBUSxVQUFVOztLQUV0QjtBQ2pCTDs7O0FBR0EsQ0FBQyxZQUFZOztJQUVUOztJQUVBLElBQUksT0FBTzs7Ozs7SUFLWCxTQUFTLFVBQVUsWUFBWSxXQUFXLFFBQVE7O1FBRTlDLEtBQUssU0FBUzs7OztRQUlkLElBQUksUUFBUSxVQUFVLFlBQVk7WUFDOUI7V0FDRCxPQUFPLE9BQU87O1FBRWpCLFdBQVcsSUFBSSxZQUFZLFlBQVk7WUFDbkMsVUFBVSxPQUFPOzs7OztRQUtyQixTQUFTLE9BQU8sT0FBTyxTQUFTO1lBQzVCLE1BQU0sSUFBSSxNQUFNLFVBQVUsR0FBRyxNQUFNO2dCQUMvQixRQUFROzs7O1FBSWhCLFNBQVMsT0FBTztZQUNaLFdBQVcsV0FBVyxNQUFNOzs7OztJQUlwQyxRQUFRLE9BQU87U0FDVixRQUFRLGFBQWE7O0tBRXpCO0FDMUNMOzs7QUFHQSxDQUFDLFlBQVk7O0lBRVQ7Ozs7OztJQU1BLFNBQVMsS0FBSyxZQUFZLFdBQVcsT0FBTyxTQUFTLFdBQVcsV0FBVyxVQUFVOztRQUVqRixVQUFVLE9BQU8sWUFBWSxVQUFVLE1BQU07WUFDekMsUUFBUSxJQUFJOztZQUVaLFFBQVE7WUFDUixTQUFTOzs7O1FBSWIsVUFBVSxlQUFlO1FBQ3pCLFVBQVU7Ozs7UUFJVixLQUFLLFFBQVEsTUFBTTtRQUNuQixLQUFLLGNBQWM7WUFDZixTQUFTO1lBQ1QsUUFBUTs7UUFFWixLQUFLLFlBQVk7UUFDakIsS0FBSyxXQUFXO1FBQ2hCLEtBQUssWUFBWTs7Ozs7UUFLakIsU0FBUyxxQkFBcUI7WUFDMUIsSUFBSSxXQUFXLEVBQUUsT0FBTyxXQUFXO1lBQ25DLE9BQU87OztRQUdYLFNBQVMsa0JBQWtCO1lBQ3ZCLE9BQU8sVUFBVTs7Ozs7O0lBS3pCLFFBQVEsT0FBTztTQUNWLFFBQVEsUUFBUTs7O0FBR3pCO0FDckRBOzs7QUFHQSxDQUFDLFlBQVk7O0lBRVQ7O0lBRUEsU0FBUyxXQUFXLFFBQVEsVUFBVTtRQUNsQyxPQUFPLFlBQVk7WUFDZixPQUFPOzs7Ozs7Ozs7SUFTZixTQUFTLFVBQVUsUUFBUSxJQUFJLGdCQUFnQixTQUFTLEtBQUs7O1FBRXpELElBQUksT0FBTztZQUNQLGFBQWEsUUFBUTtZQUNyQjs7UUFFSixLQUFLLGlCQUFpQjtRQUN0QixLQUFLLFVBQVU7UUFDZixLQUFLLFVBQVU7UUFDZixLQUFLLFlBQVk7O1lBRWI7Z0JBQ0ksSUFBSTtnQkFDSixNQUFNO2dCQUNOLEtBQUssSUFBSSxJQUFJLENBQUMsT0FBTyxHQUFHLFlBQVksR0FBRyxXQUFXO2dCQUNsRCxZQUFZO2dCQUNaLFNBQVM7b0JBQ0w7d0JBQ0ksTUFBTTt3QkFDTixRQUFRLFlBQVk7OzRCQUVoQixlQUFlLFFBQVE7OztvQkFHL0I7d0JBQ0ksTUFBTTt3QkFDTixRQUFRLFlBQVk7Ozs7b0JBSXhCO3dCQUNJLE1BQU07d0JBQ04sUUFBUSxlQUFlLFVBQVU7Ozs7OztZQU03QztnQkFDSSxJQUFJO2dCQUNKLE1BQU07Z0JBQ04sS0FBSyxJQUFJLElBQUksQ0FBQyxPQUFPLEdBQUcsWUFBWSxHQUFHLFdBQVcsT0FBTyxLQUFLLFdBQVc7Z0JBQ3pFLFlBQVk7Z0JBQ1osVUFBVTtvQkFDTixDQUFDLE1BQU0sUUFBUSxLQUFLOztnQkFFeEIsU0FBUztvQkFDTDt3QkFDSSxNQUFNO3dCQUNOLFFBQVEsZUFBZSxRQUFROztvQkFFbkMsV0FBVztvQkFDWDt3QkFDSSxNQUFNO3dCQUNOLFFBQVEsWUFBWTs7OztvQkFJeEI7d0JBQ0ksTUFBTTt3QkFDTixZQUFZO3dCQUNaLFNBQVM7d0JBQ1QsUUFBUSxlQUFlLG1CQUFtQjs7Ozs7O1lBTXREO2dCQUNJLElBQUk7Z0JBQ0osTUFBTTtnQkFDTixLQUFLLElBQUksSUFBSSxDQUFDLE9BQU8sR0FBRyxZQUFZLElBQUksV0FBVztnQkFDbkQsWUFBWTs7Ozs7O1FBTXBCLFNBQVMsZUFBZSxhQUFhLFNBQVM7WUFDMUMsT0FBTyxZQUFZO2dCQUNmLE1BQU0sRUFBRSxVQUFVLEtBQUssV0FBVyxDQUFDLElBQUk7Z0JBQ3ZDLElBQUksYUFBYTtnQkFDakIsZUFBZSxRQUFROzs7O1FBSS9CLFNBQVMsa0JBQWtCO1lBQ3ZCLE9BQU87OztRQUdYLFNBQVMsVUFBVTtZQUNmLElBQUksTUFBTSxJQUFJO1lBQ2QsSUFBSSxRQUFROzs7OztJQUlwQixRQUFRLE9BQU87U0FDVixRQUFRLGFBQWE7S0FDekI7QUNwSEw7OztBQUdBLENBQUMsWUFBWTs7SUFFVDs7Ozs7O0lBTUEsU0FBUyxNQUFNLFdBQVc7O1FBRXRCLElBQUksYUFBYTtZQUNiLFVBQVUsT0FBTyxDQUFDLE1BQU0sY0FBYyxPQUFPO1lBQzdDLFVBQVUsT0FBTyxDQUFDLE1BQU0sc0JBQXNCLE9BQU87WUFDckQsVUFBVSxPQUFPLENBQUMsTUFBTSxxQkFBcUIsT0FBTztZQUNwRCxVQUFVLE9BQU8sQ0FBQyxNQUFNLGtCQUFrQixPQUFPO1lBQ2pELFVBQVUsT0FBTyxDQUFDLE1BQU0sdUJBQXVCLE9BQU87WUFDdEQsVUFBVSxPQUFPLENBQUMsTUFBTSxxQkFBcUIsT0FBTzs7O1FBR3hELEtBQUssYUFBYTs7OztJQUd0QixRQUFRLE9BQU87U0FDVixRQUFRLFNBQVM7O0tBRXJCO0FDNUJMOzs7QUFHQSxDQUFDLFlBQVk7O0lBRVQ7O0lBRUEsU0FBUyxZQUFZOztRQUVqQixPQUFPO1lBQ0gsSUFBSTtnQkFDQSxNQUFNO2dCQUNOLFNBQVM7Z0JBQ1QsU0FBUzs7O1lBR2IsTUFBTTtnQkFDRixNQUFNO2dCQUNOLFNBQVM7Z0JBQ1QsU0FBUztnQkFDVCxLQUFLOzs7WUFHVCxNQUFNO2dCQUNGLE1BQU07Z0JBQ04sU0FBUztnQkFDVCxTQUFTOzs7WUFHYixNQUFNO2dCQUNGLE1BQU07Z0JBQ04sU0FBUztnQkFDVCxLQUFLOzs7OztJQUtqQixRQUFRLE9BQU87U0FDVixRQUFRLGFBQWE7OztHQUczQjtBQ3pDSDs7O0FBR0EsQ0FBQyxZQUFZOztJQUVUOztJQUVBLElBQUksaUJBQWlCOzs7Ozs7SUFNckIsU0FBUyxlQUFlLFlBQVk7O1FBRWhDLEtBQUssVUFBVTtRQUNmLEtBQUssWUFBWTs7UUFFakIsU0FBUyxRQUFRLFFBQVE7WUFDckIsV0FBVyxXQUFXLGdCQUFnQixDQUFDLFNBQVM7OztRQUdwRCxTQUFTLFVBQVUsT0FBTyxTQUFTO1lBQy9CLE1BQU0sSUFBSSxnQkFBZ0IsVUFBVSxHQUFHLE1BQU07Z0JBQ3pDLFFBQVE7Ozs7OztJQUtwQixRQUFRLE9BQU87U0FDVixRQUFRLGtCQUFrQjtLQUM5QjtBQy9CTDs7O0FBR0EsQ0FBQyxZQUFZOztJQUVUOzs7OztJQUtBLFNBQVMsV0FBVzs7UUFFaEIsS0FBSyxjQUFjO1FBQ25CLEtBQUsscUJBQXFCOztZQUV0QixTQUFTO2dCQUNMLFFBQVE7Z0JBQ1IsV0FBVztnQkFDWCxNQUFNO2dCQUNOLE1BQU07Z0JBQ04sYUFBYTs7Ozs7O1FBTXJCLFNBQVMsY0FBYzs7Ozs7SUFLM0IsUUFBUSxPQUFPO1NBQ1YsUUFBUSxZQUFZOztLQUV4QjtBQ2xDTDs7O0FBR0EsQ0FBQyxZQUFZOztJQUVUOztJQUVBLFNBQVMsUUFBUTs7UUFFYixLQUFLLFFBQVE7Ozs7UUFJYixTQUFTLE1BQU0sT0FBTyxLQUFLLEtBQUs7WUFDNUIsT0FBTyxLQUFLLElBQUksS0FBSyxJQUFJLEtBQUssUUFBUTs7OztJQUk5QyxRQUFRLE9BQU87U0FDVixRQUFRLFNBQVM7O0tBRXJCO0FDckJMOzs7QUFHQSxDQUFDLFlBQVk7O0lBRVQ7Ozs7OztJQU1BLFNBQVMsaUJBQWlCLFFBQVEsV0FBVztRQUN6QyxJQUFJLE1BQU0sT0FBTyxZQUFZO1FBQzdCLElBQUksWUFBWSxVQUFVLEtBQUssQ0FBQyxJQUFJO1FBQ3BDLElBQUksS0FBSzs7UUFFVCxRQUFRLE9BQU8sV0FBVzs7WUFFdEIsUUFBUSxVQUFVLE1BQU07Z0JBQ3BCLE9BQU8sUUFBUTtnQkFDZixJQUFJLE9BQU8sSUFBSSxVQUFVLENBQUMsSUFBSSxLQUFLLE1BQU07O2dCQUV6QyxLQUFLLE9BQU8sS0FBSyxRQUFRO2dCQUN6QixLQUFLLFFBQVEsS0FBSztnQkFDbEIsS0FBSyxRQUFRO2dCQUNiLEtBQUssS0FBSyxDQUFDLFNBQVMsSUFBSSxLQUFLO2dCQUM3QixLQUFLLEtBQUssQ0FBQyxTQUFTLElBQUksS0FBSztnQkFDN0IsS0FBSyxNQUFNO2dCQUNYLEtBQUssTUFBTTtnQkFDWCxLQUFLLFFBQVE7Z0JBQ2IsS0FBSyxRQUFRO2dCQUNiLEtBQUssS0FBSzs7Z0JBRVYsT0FBTzs7OztRQUlmLE9BQU87Ozs7SUFHWCxRQUFRLE9BQU87U0FDVixRQUFRLGFBQWE7S0FDekIiLCJmaWxlIjoiYXBwbGljYXRpb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzIyLzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyoqXG4gICAgICogQG5nSW5qZWN0XG4gICAgICogQHBhcmFtICRzdGF0ZVByb3ZpZGVyXG4gICAgICogQHBhcmFtICR1cmxSb3V0ZXJQcm92aWRlclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGFwcENvbmZpZygkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG5cbiAgICAgICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnL21haW4nKTtcblxuICAgICAgICAkc3RhdGVQcm92aWRlclxuICAgICAgICAgICAgLnN0YXRlKCdtYWluJywge1xuICAgICAgICAgICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICAgICAgICAgIHVybDogJy9tYWluJyxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy9tYWluLmh0bWwnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdNYWluQ29udHJvbGxlcicsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlckFzOiAndm0nXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAuc3RhdGUoJ21haW4uYWN0aW9ucycsIHtcbiAgICAgICAgICAgICAgICB1cmw6ICcnLFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3BhcnRpYWxzL2FjdGlvbnMuaHRtbCdcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIC5zdGF0ZSgnbWFpbi5jaGFyYWN0ZXJTdGF0dXMnLCB7XG4gICAgICAgICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgICAgIGNoYXJhY3RlcjogbnVsbFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvY2hhcmFjdGVyU3RhdHVzLmh0bWwnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDaGFyYWN0ZXJTdGF0dXNDb250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyQXM6ICd2bSdcbiAgICAgICAgICAgIH0pXG4gICAgICAgIDtcbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScsIFsndWkucm91dGVyJywgJ25nUmVzb3VyY2UnXSlcbiAgICAgICAgLmNvbmZpZyhhcHBDb25maWcpXG4gICAgICAgIC5ydW4oWyckcm9vdFNjb3BlJywgJyRzdGF0ZScsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkc3RhdGUpIHtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24gKGV2ZW50LCB0bywgdG9QYXJhbXMsIGZyb20sIGZyb21QYXJhbXMpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUucHJldmlvdXMgPSBmcm9tO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJHByZXZpb3VzU3RhdGUgPSBmcm9tO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1dKTtcbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yNy8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8qKlxuICAgICAqIEBuZ0luamVjdFxuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIENoYXJhY3RlclN0YXR1c0NvbnRyb2xsZXIoJHN0YXRlKSB7XG4gICAgICAgIHZhciBjaGFyYWN0ZXIgPSAkc3RhdGUucGFyYW1zLmNoYXJhY3RlcjtcblxuICAgICAgICB0aGlzLmNoYXJhY3RlciA9IGNoYXJhY3RlcjtcbiAgICAgICAgdGhpcy5nb0JhY2sgPSBnb0JhY2s7XG5cbiAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICBmdW5jdGlvbiBnb0JhY2soKSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ21haW4uYWN0aW9ucycpO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5jb250cm9sbGVyKCdDaGFyYWN0ZXJTdGF0dXNDb250cm9sbGVyJywgQ2hhcmFjdGVyU3RhdHVzQ29udHJvbGxlcik7XG5cbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yMi8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8qKlxuICAgICAqIEBuZ0luamVjdFxuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIE1haW5Db250cm9sbGVyKCRzY29wZSwgJHN0YXRlLCBnYW1lLCBhY3Rpb25zLCBzdGF0dXNNZXNzYWdlcywgbG9jYXRpb25zKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMuYWN0aW9uU3BlZWQgPSBnYW1lLmFjdGlvblNwZWVkO1xuICAgICAgICB0aGlzLmFjdGlvbnMgPSBhY3Rpb25zLmFjdGlvbkRlZmluaXRpb25zO1xuICAgICAgICB0aGlzLmNoYXJhY3RlckluZm8gPSBjaGFyYWN0ZXJJbmZvO1xuICAgICAgICB0aGlzLmNoYW5nZUxvY2F0aW9uID0gbG9jYXRpb25zLmNoYW5nZUxvY2F0aW9uO1xuICAgICAgICB0aGlzLmV4cGxvcmUgPSBleHBsb3JlO1xuICAgICAgICB0aGlzLmV4cGxvcmVTdGFydCA9IGV4cGxvcmVTdGFydDtcbiAgICAgICAgdGhpcy5sb2NhdGlvbiA9IGdhbWUubG9jYXRpb247XG4gICAgICAgIHRoaXMubG9jYXRpb25zID0gbG9jYXRpb25zLmxvY2F0aW9ucztcbiAgICAgICAgdGhpcy5tZXNzYWdlcyA9IFtdO1xuICAgICAgICB0aGlzLnBhcnR5ID0gZ2FtZS5wYXJ0eTtcbiAgICAgICAgdGhpcy5yZXNvdXJjZXMgPSBnYW1lLnJlc291cmNlcztcbiAgICAgICAgdGhpcy5zZWFyY2ggPSBzZWFyY2g7XG4gICAgICAgIHRoaXMudGV4dCA9ICd0ZXN0JztcblxuICAgICAgICB0aGlzLnBhcnR5WzBdLiRzYXZlKCk7XG5cbiAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgIHN0YXR1c01lc3NhZ2VzLm9uTWVzc2FnZSgkc2NvcGUsIGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICBzZWxmLm1lc3NhZ2VzLnVuc2hpZnQoe3RleHQ6IGFyZ3MubWVzc2FnZX0pO1xuICAgICAgICAgICAgaWYgKHNlbGYubWVzc2FnZXMubGVuZ3RoID4gMjApIHtcbiAgICAgICAgICAgICAgICBzZWxmLm1lc3NhZ2VzLnBvcCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBmdW5jdGlvbiBleHBsb3JlU3RhcnQoKXtcbiAgICAgICAgICAgIHN0YXR1c01lc3NhZ2VzLm1lc3NhZ2UoJ0V4cGxvcmluZy4uLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZXhwbG9yZSgpIHtcbiAgICAgICAgICAgIHN0YXR1c01lc3NhZ2VzLm1lc3NhZ2UoJ1lvdSBmb3VuZCBzb21lIHN0dWZmLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gc2VhcmNoKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJzZWFyY2hcIik7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjaGFyYWN0ZXJJbmZvKGNoYXJhY3Rlcikge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdtYWluLmNoYXJhY3RlclN0YXR1cycsIHtcbiAgICAgICAgICAgICAgICBjaGFyYWN0ZXI6IGNoYXJhY3RlclxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5jb250cm9sbGVyKCdNYWluQ29udHJvbGxlcicsIE1haW5Db250cm9sbGVyKTtcbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yNS8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8qKlxuICAgICAqIEBuZ0luamVjdFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGVuZW15RmFjdG9yeSgpIHtcblxuICAgICAgICB2YXIgZW5lbWllcyA9IFtcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7bmFtZTogJ2dvYmxpbicsIHNwZWVkOiAnNScsIGF0azogMywgZGVmOiAxfSxcbiAgICAgICAgICAgICAgICB7bmFtZTogJ2tvYm9sZCcsIHNwZWVkOiAnNycsIGF0azogMSwgZGVmOiAxfVxuICAgICAgICAgICAgXVxuICAgICAgICBdO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBFbmVteShsZXZlbCkge1xuICAgICAgICAgICAgbGV2ZWwgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihsZXZlbCwgZW5lbWllcy5sZW5ndGggLSAxKSk7XG5cbiAgICAgICAgICAgIHZhciByYW5kb20gPSBfLnNhbXBsZShlbmVtaWVzW2xldmVsXSk7XG5cbiAgICAgICAgICAgIGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHJhbmRvbSk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuZmFjdG9yeSgnRW5lbXknLCBlbmVteUZhY3RvcnkpO1xufSkoKTtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjcvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBhY3Rpb25CdXR0b25EaXJlY3RpdmUoZXZlbnRMb29wLCBjb25maWcsIGFjdGlvbnMsIGdhbWUpIHtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBRScsXG5cbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnPSdcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9J2FjdGlvbi1iYXInIG5nLWNsaWNrPSdkb0FjdGlvbigpJz48L2Rpdj5cIixcbiAgICAgICAgICAgIC8vdGVtcGxhdGU6IFwiPGRpdiBjbGFzcz0nYWN0aW9uLWJhcicgbmctY2xpY2s9J2RvQWN0aW9uKCknPnt7YWN0aW9uLnRleHR9fTwvZGl2PlwiLFxuXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW0sIGF0dHIpIHtcbiAgICAgICAgICAgICAgICB2YXIgeCA9IHNjb3BlLmFjdGlvbjtcblxuICAgICAgICAgICAgICAgIHZhciBpbmNyZWFzZVBlclRpY2sgPSBzY29wZS5zcGVlZCAvIGNvbmZpZy50aWNrc1BlclNlY29uZDtcbiAgICAgICAgICAgICAgICB2YXIgYmFyID0gYW5ndWxhci5lbGVtZW50KGVsZW0uY2hpbGRyZW4oKVswXSkuYXBwZW5kKCc8ZGl2IGNsYXNzPVwidGltZXItYmFyLXByb2dyZXNzXCI+PC9kaXY+Jyk7XG4gICAgICAgICAgICAgICAgdmFyIHRleHQgPSBhbmd1bGFyLmVsZW1lbnQoZWxlbS5jaGlsZHJlbigpWzBdKS5hcHBlbmQoXCI8c3BhbiBjbGFzcz0nYWN0aW9uLWJhci10ZXh0Jz5cIiArIHNjb3BlLmFjdGlvbi50ZXh0ICsgXCI8L3NwYW4+XCIpO1xuICAgICAgICAgICAgICAgIHZhciBwcm9ncmVzcyA9IGFuZ3VsYXIuZWxlbWVudChiYXIuY2hpbGRyZW4oKVswXSk7XG5cbiAgICAgICAgICAgICAgICBldmVudExvb3Aub25UaWNrKHNjb3BlLCBmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYWN0aW9uID0gc2NvcGUuYWN0aW9uO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghKHNjb3BlLnBlcmNlbnRhZ2UgPCAxICYmIHNjb3BlLndhaXRpbmcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NvcGUud2FpdGluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzLnJlbW92ZUNsYXNzKCd0aW1lci1iYXItcnVubmluZycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzLmFkZENsYXNzKCd0aW1lci1iYXItY29tcGxldGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZS53YWl0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3BlLnBlcmNlbnRhZ2UgPT09IDEgJiYgYWN0aW9uLnBjdENvbXBsZXRlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzcy5yZW1vdmVDbGFzcygndGltZXItYmFyLWNvbXBsZXRlJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2NvcGUucGVyY2VudGFnZSA9IGFjdGlvbi5wY3RDb21wbGV0ZTtcbiAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3MuY3NzKCd3aWR0aCcsIChzY29wZS5wZXJjZW50YWdlICogMTAwKSArICclJyk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBwcm9ncmVzcy5jc3MoJ3dpZHRoJywgJzAlJyk7XG4gICAgICAgICAgICAgICAgYmFyLmNzcygnYmFja2dyb3VuZC1jb2xvcicsICdibGFjaycpO1xuXG4gICAgICAgICAgICAgICAgc2NvcGUuZG9BY3Rpb24gPSBkb0FjdGlvbjtcbiAgICAgICAgICAgICAgICBzY29wZS5wZXJjZW50YWdlID0gMDtcbiAgICAgICAgICAgICAgICBzY29wZS53YWl0aW5nID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBkb0FjdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzY29wZS53YWl0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NvcGUub25DbGljaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLm9uQ2xpY2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLnBlcmNlbnRhZ2UgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUud2FpdGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzcy5hZGRDbGFzcygndGltZXItYmFyLXJ1bm5pbmcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzLnJlbW92ZUNsYXNzKCd0aW1lci1iYXItY29tcGxldGUnKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9ucy5kb0FjdGlvbihnYW1lLCBzY29wZS5hY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmRpcmVjdGl2ZSgnYWN0aW9uQnV0dG9uJywgYWN0aW9uQnV0dG9uRGlyZWN0aXZlKTtcbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yMy8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuXG4gICAgLyoqXG4gICAgICogQG5nSW5qZWN0XG4gICAgICovXG4gICAgZnVuY3Rpb24gdGltZXJCYXJEaXJlY3RpdmUoZXZlbnRMb29wLCBjb25maWcpIHtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBRScsXG5cbiAgICAgICAgICAgIHJlcGxhY2U6IHRydWUsXG5cbiAgICAgICAgICAgIHRlbXBsYXRlOiAnPGRpdiBjbGFzcz1cInRpbWVyLWJhci1idXR0b25cIj48YSBjbGFzcz1cInRpbWVyLWJhci10ZXh0XCIgbmctY2xpY2s9XCJjb3VudGRvd24oKVwiPnt7bGFiZWx9fTwvYT4gPGRpdiBjbGFzcz1cInRpbWVyLWJhclwiPjwvZGl2PjwvZGl2PicsXG5cbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgbGFiZWw6ICdAJyxcbiAgICAgICAgICAgICAgICBzcGVlZDogJz0nLFxuICAgICAgICAgICAgICAgIG9uQ2xpY2s6ICcmPycsXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZWQ6ICcmJ1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtLCBhdHRyKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFzY29wZS5zcGVlZCkgdGhyb3cgbmV3IEVycm9yKCdzcGVlZCBub3QgZGVmaW5lZCcpO1xuICAgICAgICAgICAgICAgIGlmICghc2NvcGUub25Db21wbGV0ZWQpIHRocm93IG5ldyBFcnJvcignb25Db21wbGV0ZWQgbm90IGRlZmluZWQnKTtcblxuICAgICAgICAgICAgICAgIHZhciBpbmNyZWFzZVBlclRpY2sgPSBzY29wZS5zcGVlZCAvIGNvbmZpZy50aWNrc1BlclNlY29uZDtcbiAgICAgICAgICAgICAgICB2YXIgYmFyID0gYW5ndWxhci5lbGVtZW50KGVsZW0uY2hpbGRyZW4oKVsxXSkuYXBwZW5kKCc8ZGl2IGNsYXNzPVwidGltZXItYmFyLXByb2dyZXNzXCI+PC9kaXY+Jyk7XG4gICAgICAgICAgICAgICAgdmFyIHByb2dyZXNzID0gYW5ndWxhci5lbGVtZW50KGJhci5jaGlsZHJlbigpWzBdKTtcblxuICAgICAgICAgICAgICAgIGV2ZW50TG9vcC5vblRpY2soc2NvcGUsIGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY29wZS5wZXJjZW50YWdlIDwgMSAmJiBzY29wZS53YWl0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5wZXJjZW50YWdlID0gTWF0aC5taW4oMSwgc2NvcGUucGVyY2VudGFnZSArIGluY3JlYXNlUGVyVGljayk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NvcGUud2FpdGluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzLmFkZENsYXNzKCd0aW1lci1iYXItY29tcGxldGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZS53YWl0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUucGVyY2VudGFnZSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUub25Db21wbGV0ZWQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBwcm9ncmVzcy5jc3MoJ3dpZHRoJywgKHNjb3BlLnBlcmNlbnRhZ2UgKiAxMDApICsgJyUnKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHByb2dyZXNzLmNzcygnd2lkdGgnLCAnMCUnKTtcbiAgICAgICAgICAgICAgICBiYXIuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgJ2JsYWNrJyk7XG5cbiAgICAgICAgICAgICAgICBzY29wZS5jb3VudGRvd24gPSBjb3VudGRvd247XG4gICAgICAgICAgICAgICAgc2NvcGUucGVyY2VudGFnZSA9IDA7XG5cbiAgICAgICAgICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBjb3VudGRvd24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghc2NvcGUud2FpdGluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3BlLm9uQ2xpY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5vbkNsaWNrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5wZXJjZW50YWdlID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLndhaXRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3MucmVtb3ZlQ2xhc3MoJ3RpbWVyLWJhci1jb21wbGV0ZScpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmRpcmVjdGl2ZSgndGltZXJCYXInLCB0aW1lckJhckRpcmVjdGl2ZSk7XG5cbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yNy8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGZ1bmN0aW9uIGRpc2NvdmVyZWRMb2NhdGlvbkZpbHRlcigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGRpc2NvdmVyZWRMb2NhdGlvbihsb2NhdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBfLndoZXJlKGxvY2F0aW9ucywge2Rpc2NvdmVyZWQ6IHRydWV9KTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5maWx0ZXIoJ2Rpc2NvdmVyZWRMb2NhdGlvbicsIGRpc2NvdmVyZWRMb2NhdGlvbkZpbHRlcik7XG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjcvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBmdW5jdGlvbiBwZXJjZW50YWdlRmlsdGVyKCRmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIHBlcmNlbnRhZ2UoaW5wdXQsIGRlY2ltYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGZpbHRlcignbnVtYmVyJykoaW5wdXQgKiAxMDAsIGRlY2ltYWxzKSArICclJztcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5maWx0ZXIoJ3BlcmNlbnRhZ2UnLCBwZXJjZW50YWdlRmlsdGVyKTtcblxufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzI0LzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyoqXG4gICAgICogQG5nSW5jbHVkZVxuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGR1bmdlb25GYWN0b3J5KCkge1xuXG4gICAgICAgIGZ1bmN0aW9uIFJvb20oKSB7XG4gICAgICAgICAgICB0aGlzLmVuZW15Q2hhbmNlID0gTWF0aC5yYW5kb20oKTsgICAvLyAlIG9mIGdldHRpbmcgZW5lbXkgZW5jb3VudGVyXG4gICAgICAgICAgICB0aGlzLnRyYXBDaGFuY2UgPSBNYXRoLnJhbmRvbSgpOyAgICAvLyAlIG9mIHRyYXBcbiAgICAgICAgICAgIHRoaXMudHJlYXN1cmVDaGFuY2UgPSBNYXRoLnJhbmRvbSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gRmxvb3IoKSB7XG4gICAgICAgICAgICB0aGlzLmV4cGxvcmVkUGN0ID0gMDtcbiAgICAgICAgICAgIHRoaXMucm9vbXMgPSBbXTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIER1bmdlb24obGV2ZWwsIGZsb29yQ291bnQpIHtcblxuICAgICAgICAgICAgZmxvb3JDb3VudCA9IE1hdGgucmFuZG9tKCkgKiBsZXZlbCAqIDI7XG5cbiAgICAgICAgICAgIHRoaXMubGV2ZWwgPSBsZXZlbDtcbiAgICAgICAgICAgIHRoaXMuZmxvb3JzID0gW107XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmxvb3JDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mbG9vcnMucHVzaChuZXcgRmxvb3IoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuZmFjdG9yeSgnRHVuZ2VvbicsIGR1bmdlb25GYWN0b3J5KTtcbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yNC8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8qKlxuICAgICAqIEBuZ0luY2x1ZGVcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBtYXBGYWN0b3J5KHV0aWxzLCBwYXJ0eSwgc3RhdHVzTWVzc2FnZXMsIHVwZ3JhZGVzLCByZXNvdXJjZXMsIEJhdHRsZSkge1xuXG4gICAgICAgIHZhciBnZXRMb3N0Q2hhbmNlID0gMC4yOyAgICAvLyB0b2RvOiBjaGFuZ2UgdGhpcz9cbiAgICAgICAgdmFyIHJvb21YcEJhc2UgPSAxO1xuXG4gICAgICAgIGZ1bmN0aW9uIFJvb20obWFwLCBmbG9vcikge1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICAgICB0aGlzLmV4cGxvcmUgPSBleHBsb3JlO1xuICAgICAgICAgICAgdGhpcy5leHBsb3JlZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5lbmVteUNoYW5jZSA9IE1hdGgucmFuZG9tKCk7ICAgLy8gJSBvZiBnZXR0aW5nIGVuZW15IGVuY291bnRlclxuICAgICAgICAgICAgdGhpcy5oYXNTdGFpcnMgPSBNYXRoLnJhbmRvbSgpIC8gMTA7ICAgICAvLyAlIG9mIGZpbmRpbmcgc3RhaXJzIGRvd24gaGVyZSwgb25jZSB0aGlzIGlzIHNldCB0aGVuIG5vIG90aGVyIHJvb20gY2FuIGhhdmUgaXRcbiAgICAgICAgICAgIHRoaXMudHJhcENoYW5jZSA9IE1hdGgucmFuZG9tKCk7ICAgIC8vICUgb2YgdHJhcFxuICAgICAgICAgICAgdGhpcy50cmVhc3VyZUNoYW5jZSA9IE1hdGgucmFuZG9tKCk7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGV4cGxvcmUoKSB7XG4gICAgICAgICAgICAgICAgaWYgKE1hdGgucmFuZG9tKCkgPD0gc2VsZi5lbmVteUNoYW5jZSkge1xuICAgICAgICAgICAgICAgICAgICByYW5kb21CYXR0bGUoKTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoTWF0aC5yYW5kb20oKSA8PSBzZWxmLnRyYXBDaGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhcCgpO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChNYXRoLnJhbmRvbSgpIDw9IHNlbGYudHJlYXN1cmVDaGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgZm91bmRUcmVhc3VyZSgpO1xuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNlbGYuZXhwbG9yZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiByYW5kb21CYXR0bGUoKSB7XG4gICAgICAgICAgICAgICAgc3RhdHVzTWVzc2FnZXMubWVzc2FnZShcIlJhbmRvbSBiYXR0bGUhXCIpO1xuICAgICAgICAgICAgICAgIHNlbGYuZW5lbXlDaGFuY2UgKj0gMC44OyAvLyByZWR1Y2UgdGhlIGNoYW5jZSBlYWNoIHRpbWUgd2UgdmlzaXQgdGhpcyByb29tXG5cbiAgICAgICAgICAgICAgICB2YXIgZW5lbWllcyA9IFt7bmFtZTogJ2dvYmxpbicsIGhwOiA1LCBhdGs6IDEsIGRlZjogMX1dO1xuXG4gICAgICAgICAgICAgICAgdmFyIGJhdHRsZSA9IG5ldyBCYXR0bGUoZW5lbWllcyk7XG4gICAgICAgICAgICAgICAgYmF0dGxlLmZpZ2h0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGZvdW5kVHJlYXN1cmUoKSB7XG4gICAgICAgICAgICAgICAgc3RhdHVzTWVzc2FnZXMubWVzc2FnZShcIkZvdW5kIHRyZWFzdXJlIVwiKTtcbiAgICAgICAgICAgICAgICBzZWxmLnRyZWFzdXJlQ2hhbmNlICo9IDAuNzU7XG4gICAgICAgICAgICAgICAgcmVzb3VyY2VzLmdvbGQuY3VycmVudCArPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMCAqIG1hcC5sZXZlbCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHRyYXAoKSB7XG4gICAgICAgICAgICAgICAgc3RhdHVzTWVzc2FnZXMubWVzc2FnZShcIlRyaWdnZXJlZCBhIHRyYXAhXCIpO1xuICAgICAgICAgICAgICAgIHNlbGYudHJhcENoYW5jZSAqPSAwLjg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICAgIGZ1bmN0aW9uIEZsb29yKG1hcCwgcm9vbUNvdW50KSB7XG4gICAgICAgICAgICByb29tQ291bnQgPSBNYXRoLmZsb29yKHJvb21Db3VudCB8fCAxKTtcblxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRSb29tID0gMDtcbiAgICAgICAgICAgIHRoaXMuZXhwbG9yZSA9IGV4cGxvcmU7XG4gICAgICAgICAgICB0aGlzLmV4cGxvcmVkUGN0ID0gMDtcbiAgICAgICAgICAgIHRoaXMuZm91bmRTdGFpcnMgPSBmYWxzZTsgICAvLyBjYW4gZ28gdG8gbmV4dCBmbG9vcj9cbiAgICAgICAgICAgIHRoaXMucm9vbXMgPSBbXTtcblxuICAgICAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJvb21Db3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yb29tcy5wdXNoKG5ldyBSb29tKG1hcCwgc2VsZikpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGV4cGxvcmUodG90YWxGbG9vcnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgcm9vbSA9IHNlbGYucm9vbXNbc2VsZi5jdXJyZW50Um9vbV07XG4gICAgICAgICAgICAgICAgcm9vbS5leHBsb3JlKCk7XG5cbiAgICAgICAgICAgICAgICB2YXIgaGFzU3RhaXJzID0gKHNlbGYuY3VycmVudFJvb20gPT0gc2VsZi5yb29tcy5sZW5ndGggLSAxKSB8fCBNYXRoLnJhbmRvbSgpIDw9IHJvb20uaGFzU3RhaXJzO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRvdGFsRmxvb3JzID4gMSAmJiAhc2VsZi5mb3VuZFN0YWlycyAmJiBoYXNTdGFpcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzTWVzc2FnZXMubWVzc2FnZShcIkZvdW5kIHN0YWlycyB0byB0aGUgbmV4dCBsZXZlbC5cIik7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZm91bmRTdGFpcnMgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghdXBncmFkZXMuYXV0b01hcCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiBhdXRvbWFwLCB3ZSBkb24ndCBnZXQgbG9zdFxuICAgICAgICAgICAgICAgICAgICBpZiAoTWF0aC5yYW5kb20oKSA8PSBnZXRMb3N0Q2hhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXNNZXNzYWdlcy5tZXNzYWdlKFwiWW91IGdldCBsb3N0IVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY3VycmVudFJvb20gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiByb29tQ291bnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzZWxmLmN1cnJlbnRSb29tIDwgcm9vbUNvdW50IC0gMSlcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jdXJyZW50Um9vbSsrO1xuXG4gICAgICAgICAgICAgICAgdmFyIGV4cGxvcmVkID0gXy5maWx0ZXIoc2VsZi5yb29tcywgJ2V4cGxvcmVkJykubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHNlbGYuZXhwbG9yZWRQY3QgPSBleHBsb3JlZCAvIHNlbGYucm9vbXMubGVuZ3RoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogQHBhcmFtIHtOdW1iZXJ9IGxldmVsIC0gdGhlIGxldmVsIG9mIGRpZmZpY3VsdHkgb2YgdGhlIGR1bmdlb25cbiAgICAgICAgICogQHBhcmFtIHtOdW1iZXJ9IGZsb29yQ291bnQgLSB0aGUgbnVtYmVyIG9mIGZsb29yc1xuICAgICAgICAgKi9cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIE1hcChhcmdzKSB7XG5cbiAgICAgICAgICAgIGFyZ3MgPSBhcmdzIHx8IHt9O1xuXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgICAgICAgbGV2ZWwgPSBhcmdzLmxldmVsIHx8IDEsXG4gICAgICAgICAgICAgICAgZmxvb3JDb3VudCA9IGFyZ3MuZmxvb3JDb3VudCB8fCBNYXRoLnJhbmRvbSgpICogbGV2ZWwgKiAyLFxuICAgICAgICAgICAgICAgIHJvb21Db3VudCA9IGFyZ3Mucm9vbUNvdW50IHx8IE1hdGgucmFuZG9tKCkgKiA1MCArIChNYXRoLnJhbmRvbSgpICogNSArIDEwKTtcblxuICAgICAgICAgICAgdGhpcy5jdXJyZW50Rmxvb3IgPSAwO1xuICAgICAgICAgICAgdGhpcy5leHBsb3JlID0gZXhwbG9yZTtcbiAgICAgICAgICAgIHRoaXMuZXhwbG9yZWRQY3QgPSAwO1xuICAgICAgICAgICAgdGhpcy5mbG9vcnMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMubGV2ZWwgPSBsZXZlbDtcblxuICAgICAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmbG9vckNvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZsb29ycy5wdXNoKG5ldyBGbG9vcihzZWxmLCByb29tQ291bnQpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gY2hhbmdlRmxvb3IobmV3Rmxvb3IpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmN1cnJlbnRGbG9vciA9IG5ld0Zsb29yIHx8IHNlbGYuY3VycmVudEZsb29yO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBleHBsb3JlKCkge1xuICAgICAgICAgICAgICAgIHZhciBmbG9vciA9IHV0aWxzLmNsYW1wKHNlbGYuY3VycmVudEZsb29yLCAwLCBzZWxmLmZsb29ycy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIHNlbGYuZmxvb3JzW2Zsb29yXS5leHBsb3JlKHNlbGYuZmxvb3JzLmxlbmd0aCk7XG5cbiAgICAgICAgICAgICAgICB2YXIgZXhwbG9yZWQgPSBfLnJlZHVjZShzZWxmLmZsb29ycywgZnVuY3Rpb24gKHBjdCwgZmxvb3IsIGlkeCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkVYUExPUkVEOiBcIiArIGZsb29yKTtcbiAgICAgICAgICAgICAgICAgICAgcGN0ICs9IGZsb29yLmV4cGxvcmVkUGN0O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGN0O1xuICAgICAgICAgICAgICAgIH0sIDApO1xuXG4gICAgICAgICAgICAgICAgaWYgKGV4cGxvcmVkID4gc2VsZi5leHBsb3JlZFBjdCkge1xuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZXMueHAuY3VycmVudCArPSAocm9vbVhwQmFzZSAqIGxldmVsICogKHNlbGYuY3VycmVudEZsb29yICsgMSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmLmV4cGxvcmVkUGN0ID0gZXhwbG9yZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuZmFjdG9yeSgnTWFwJywgbWFwRmFjdG9yeSk7XG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjMvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKiBAcGFyYW0gcGFydHlcbiAgICAgKiBAcGFyYW0gc3RhdHVzTWVzc2FnZXNcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBBY3Rpb25zKCRxLCBwYXJ0eSwgc3RhdHVzTWVzc2FnZXMpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5hY3Rpb25EZWZpbml0aW9ucyA9IHtcblxuICAgICAgICAgICAgZXhwbG9yZToge1xuICAgICAgICAgICAgICAgIHRleHQ6ICdFeHBsb3JlJyxcbiAgICAgICAgICAgICAgICBwY3RDb21wbGV0ZTogMCxcbiAgICAgICAgICAgICAgICBzcGVlZDogMC4yLFxuICAgICAgICAgICAgICAgIG9uU3RhcnQ6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogZnVuY3Rpb24gKGdhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZ2FtZS5sb2NhdGlvbnMuZXhwbG9yZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmRvQWN0aW9uID0gZG9BY3Rpb247XG4gICAgICAgIHRoaXMucHJvY2Vzc1RpY2sgPSBwcm9jZXNzVGljaztcblxuXG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICBmdW5jdGlvbiBkb0FjdGlvbihnYW1lLCBhY3Rpb24pIHtcbiAgICAgICAgICAgIGlmICghYWN0aW9uLnJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBhY3Rpb24ucGN0Q29tcGxldGUgPSAwO1xuICAgICAgICAgICAgICAgIGFjdGlvbi5ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBhY3Rpb24uZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgICAgICAgICAgYWN0aW9uLmRlZmVycmVkLnByb21pc2UudGhlbihmdW5jdGlvbiAocmVzb2x2ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uLm9uQ29tcGxldGUoZ2FtZSk7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbi5wY3RDb21wbGV0ZSA9IDA7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBwcm9jZXNzVGljaygpIHtcbiAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChzZWxmLmFjdGlvbkRlZmluaXRpb25zLCBmdW5jdGlvbiAoYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbi5wY3RDb21wbGV0ZSA8IDEgJiYgYWN0aW9uLnJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uLnBjdENvbXBsZXRlICs9IGFjdGlvbi5zcGVlZDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aW9uLmRlZmVycmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb24uZGVmZXJyZWQucmVzb2x2ZSh7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb24uZGVmZXJyZWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuc2VydmljZSgnYWN0aW9ucycsIEFjdGlvbnMpO1xufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzI1LzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyoqXG4gICAgICogQG5nSW5qZWN0XG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGJhdHRsZUZhY3RvcnkocGFydHksIHJlc291cmNlcywgdXBncmFkZXMpIHtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gQmF0dGxlKGVuZW1pZXMpIHtcblxuICAgICAgICAgICAgdmFyIHNvcnRlZCA9IF8uc29ydEJ5KHBhcnR5LmNoYXJhY3RlcnMuY29uY2F0KGVuZW1pZXMpLCAnc3BlZWQnKTtcblxuICAgICAgICAgICAgdGhpcy5maWdodCA9IGZpZ2h0O1xuXG4gICAgICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGZpZ2h0KCkge1xuICAgICAgICAgICAgICAgIHJlc291cmNlcy54cC5jdXJyZW50ICs9IHNvcnRlZC5sZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuZmFjdG9yeSgnQmF0dGxlJywgYmF0dGxlRmFjdG9yeSk7XG5cbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yMi8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGZ1bmN0aW9uIGNvbmZpZygpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRpY2tzUGVyU2Vjb25kOiA1LFxuICAgICAgICAgICAgYXBpU2VydmVyOiAnaHR0cDovL2xvY2FsaG9zdDoxMzA5OC8nXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuZmFjdG9yeSgnY29uZmlnJywgY29uZmlnKTtcblxufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzIyLzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIFRJQ0sgPSBcImV2ZW50OnRpY2tcIjtcblxuICAgIC8qKlxuICAgICAqIEBuZ0luamVjdFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIEV2ZW50TG9vcCgkcm9vdFNjb3BlLCAkaW50ZXJ2YWwsIGNvbmZpZykge1xuXG4gICAgICAgIHRoaXMub25UaWNrID0gb25UaWNrO1xuXG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICB2YXIgdGltZXIgPSAkaW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGljaygpO1xuICAgICAgICB9LCAxMDAwIC8gY29uZmlnLnRpY2tzUGVyU2Vjb25kKTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uVGljayhzY29wZSwgaGFuZGxlcikge1xuICAgICAgICAgICAgc2NvcGUuJG9uKFRJQ0ssIGZ1bmN0aW9uIChlLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlcihhcmdzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gdGljaygpIHtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChUSUNLLCB7fSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5zZXJ2aWNlKCdldmVudExvb3AnLCBFdmVudExvb3ApO1xuXG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjIvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBHYW1lKCRyb290U2NvcGUsIGV2ZW50TG9vcCwgcGFydHksIGFjdGlvbnMsIHJlc291cmNlcywgbG9jYXRpb25zLCB1cGdyYWRlcykge1xuXG4gICAgICAgIGV2ZW50TG9vcC5vblRpY2soJHJvb3RTY29wZSwgZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwidGlja1wiKTtcblxuICAgICAgICAgICAgYWN0aW9ucy5wcm9jZXNzVGljaygpO1xuICAgICAgICAgICAgdXBncmFkZXMucHJvY2Vzc1RpY2soKTtcbiAgICAgICAgfSk7XG5cblxuICAgICAgICBsb2NhdGlvbnMuY2hhbmdlTG9jYXRpb24oJ3Rvd24nKSgpO1xuICAgICAgICBsb2NhdGlvbnMuZXhwbG9yZSgpO1xuXG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgIHRoaXMucGFydHkgPSBwYXJ0eS5jaGFyYWN0ZXJzO1xuICAgICAgICB0aGlzLmFjdGlvblNwZWVkID0ge1xuICAgICAgICAgICAgZXhwbG9yZTogMSxcbiAgICAgICAgICAgIGdhdGhlcjogMVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmxvY2F0aW9ucyA9IGxvY2F0aW9ucztcbiAgICAgICAgdGhpcy5sb2NhdGlvbiA9IGN1cnJlbnRMb2NhdGlvbjtcbiAgICAgICAgdGhpcy5yZXNvdXJjZXMgPSBhdmFpbGFibGVSZXNvdXJjZXM7XG5cblxuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICBmdW5jdGlvbiBhdmFpbGFibGVSZXNvdXJjZXMoKSB7XG4gICAgICAgICAgICB2YXIgZmlsdGVyZWQgPSBfLmZpbHRlcihyZXNvdXJjZXMsICd2aXNpYmxlJyk7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjdXJyZW50TG9jYXRpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gbG9jYXRpb25zLmN1cnJlbnQoKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuc2VydmljZSgnZ2FtZScsIEdhbWUpO1xuXG59KSgpO1xuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yNi8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGZ1bmN0aW9uIGJpbmRBY3Rpb24oYWN0aW9uLCB0b09iamVjdCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgYWN0aW9uKHRvT2JqZWN0KTtcbiAgICAgICAgfTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIEBuZ0luamVjdFxuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIExvY2F0aW9ucygkc3RhdGUsICRxLCBzdGF0dXNNZXNzYWdlcywgYWN0aW9ucywgTWFwKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgICAgYWN0aW9uRGVmcyA9IGFjdGlvbnMuYWN0aW9uRGVmaW5pdGlvbnMsXG4gICAgICAgICAgICBsb2M7XG5cbiAgICAgICAgdGhpcy5jaGFuZ2VMb2NhdGlvbiA9IGNoYW5nZUxvY2F0aW9uO1xuICAgICAgICB0aGlzLmN1cnJlbnQgPSBjdXJyZW50TG9jYXRpb247XG4gICAgICAgIHRoaXMuZXhwbG9yZSA9IGV4cGxvcmU7XG4gICAgICAgIHRoaXMubG9jYXRpb25zID0gW1xuXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWQ6ICd0b3duJyxcbiAgICAgICAgICAgICAgICBuYW1lOiAnVG93bicsXG4gICAgICAgICAgICAgICAgbWFwOiBuZXcgTWFwKHtsZXZlbDogMSwgZmxvb3JDb3VudDogMSwgcm9vbUNvdW50OiAxfSksXG4gICAgICAgICAgICAgICAgZGlzY292ZXJlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdJbm4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ28gdG8gdGhlIGlublxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1c01lc3NhZ2VzLm1lc3NhZ2UoXCJDYW4ndCBnbyB0byB0aGUgaW5uIHlldC4uLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ1N1cHBsaWVzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGdvIHRvIHRoZSBzdG9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnTGVhdmUgdG93bicsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IGNoYW5nZUxvY2F0aW9uKCdmb3Jlc3QnLCAnWW91IGxlYXZlIHRvd24gYW5kIGVudGVyIHRoZSBmb3Jlc3QuJylcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0sXG5cblxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlkOiAnZm9yZXN0JyxcbiAgICAgICAgICAgICAgICBuYW1lOiAnRm9yZXN0JyxcbiAgICAgICAgICAgICAgICBtYXA6IG5ldyBNYXAoe2xldmVsOiAxLCBmbG9vckNvdW50OiAxLCByb29tQ291bnQ6IDYwMCArIChNYXRoLnJhbmRvbSgpICogMTAwKX0pLFxuICAgICAgICAgICAgICAgIGRpc2NvdmVyZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHRyZWFzdXJlOiBbXG4gICAgICAgICAgICAgICAgICAgIHtuYW1lOiAnZ29sZCcsIHBjdDogMX1cbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ1JldHVybiB0byB0b3duJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogY2hhbmdlTG9jYXRpb24oJ3Rvd24nLCAnWW91IHJldHVybiB0byB0aGUgdG93bi4nKVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb25EZWZzLmV4cGxvcmUsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdHYXRoZXIgaGVyYnMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ2F0aGVyIHNvbWUgaGVyYnNcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0VudGVyIGR1bmdlb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhwbG9yZVBjdDogMC40LFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ1lvdSBkaXNjb3ZlcmVkIHRoZSBzdGFydGluZyBkdW5nZW9uIScsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IGNoYW5nZUxvY2F0aW9uKCdzdGFydGluZ0R1bmdlb24nLCAnWW91IGVudGVyIHRoZSBkdW5nZW9uLicpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9LFxuXG5cbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZDogJ3N0YXJ0aW5nRHVuZ2VvbicsXG4gICAgICAgICAgICAgICAgbmFtZTogJ1N0YXJ0aW5nIER1bmdlb24nLFxuICAgICAgICAgICAgICAgIG1hcDogbmV3IE1hcCh7bGV2ZWw6IDEsIGZsb29yQ291bnQ6IDEwLCByb29tQ291bnQ6IDEwMH0pLFxuICAgICAgICAgICAgICAgIGRpc2NvdmVyZWQ6IGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG5cbiAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgZnVuY3Rpb24gY2hhbmdlTG9jYXRpb24obmV3TG9jYXRpb24sIG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbG9jID0gXy5maW5kV2hlcmUoc2VsZi5sb2NhdGlvbnMsIHtpZDogbmV3TG9jYXRpb259KTtcbiAgICAgICAgICAgICAgICBsb2MuZGlzY292ZXJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgc3RhdHVzTWVzc2FnZXMubWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjdXJyZW50TG9jYXRpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gbG9jO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZXhwbG9yZSgpIHtcbiAgICAgICAgICAgIHZhciBtYXAgPSBsb2MubWFwO1xuICAgICAgICAgICAgbWFwLmV4cGxvcmUobG9jKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLnNlcnZpY2UoJ2xvY2F0aW9ucycsIExvY2F0aW9ucyk7XG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjcvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBQYXJ0eShDaGFyYWN0ZXIpIHtcblxuICAgICAgICB2YXIgY2hhcmFjdGVycyA9IFtcbiAgICAgICAgICAgIENoYXJhY3Rlci5jcmVhdGUoe25hbWU6ICdTaXIgSmVldmVzJywgY2xhc3M6ICdrbmlnaHQnfSksXG4gICAgICAgICAgICBDaGFyYWN0ZXIuY3JlYXRlKHtuYW1lOiAnVGhvcmdyaW1tIEF4ZWJlYXJkJywgY2xhc3M6ICdiZXJzZXJrZXInfSksXG4gICAgICAgICAgICBDaGFyYWN0ZXIuY3JlYXRlKHtuYW1lOiAnRmVucmlzIFJhdGZpbmdlcnMnLCBjbGFzczogJ3RoaWVmJ30pLFxuICAgICAgICAgICAgQ2hhcmFjdGVyLmNyZWF0ZSh7bmFtZTogJ0JvcmlzIE9uZS1zaG90JywgY2xhc3M6ICdhcmNoZXInfSksXG4gICAgICAgICAgICBDaGFyYWN0ZXIuY3JlYXRlKHtuYW1lOiAnTHlzYW5uYSBEYXduYnJpbmdlcicsIGNsYXNzOiAnc29yY2VyZXInfSksXG4gICAgICAgICAgICBDaGFyYWN0ZXIuY3JlYXRlKHtuYW1lOiAnTG90aGFyIEdyZWVuYnJvb2snLCBjbGFzczogJ2hlYWxlcid9KVxuICAgICAgICBdO1xuXG4gICAgICAgIHRoaXMuY2hhcmFjdGVycyA9IGNoYXJhY3RlcnM7XG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuc2VydmljZSgncGFydHknLCBQYXJ0eSk7XG5cbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yNS8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGZ1bmN0aW9uIHJlc291cmNlcygpIHtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeHA6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAneHAnLFxuICAgICAgICAgICAgICAgIHZpc2libGU6IHRydWUsXG4gICAgICAgICAgICAgICAgY3VycmVudDogMFxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZm9vZDoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdmb29kJyxcbiAgICAgICAgICAgICAgICB2aXNpYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGN1cnJlbnQ6IDAsXG4gICAgICAgICAgICAgICAgbWF4OiAxMDAwXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBnb2xkOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2dvbGQnLFxuICAgICAgICAgICAgICAgIHZpc2libGU6IHRydWUsXG4gICAgICAgICAgICAgICAgY3VycmVudDogMFxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgaXJvbjoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdpcm9uJyxcbiAgICAgICAgICAgICAgICBjdXJyZW50OiAwLFxuICAgICAgICAgICAgICAgIG1heDogMTAwXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuZmFjdG9yeSgncmVzb3VyY2VzJywgcmVzb3VyY2VzKTtcblxufSlcbigpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjYvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgU1RBVFVTX01FU1NBR0UgPSBcImdhbWU6c3RhdHVzTWVzc2FnZVwiO1xuXG4gICAgLyoqXG4gICAgICogQG5nSW5qZWN0XG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgZnVuY3Rpb24gU3RhdHVzTWVzc2FnZXMoJHJvb3RTY29wZSkge1xuXG4gICAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgIHRoaXMub25NZXNzYWdlID0gb25NZXNzYWdlO1xuXG4gICAgICAgIGZ1bmN0aW9uIG1lc3NhZ2Uoc3RhdHVzKSB7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoU1RBVFVTX01FU1NBR0UsIHttZXNzYWdlOiBzdGF0dXN9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIG9uTWVzc2FnZShzY29wZSwgaGFuZGxlcikge1xuICAgICAgICAgICAgc2NvcGUuJG9uKFNUQVRVU19NRVNTQUdFLCBmdW5jdGlvbiAoZSwgYXJncykge1xuICAgICAgICAgICAgICAgIGhhbmRsZXIoYXJncyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLnNlcnZpY2UoJ3N0YXR1c01lc3NhZ2VzJywgU3RhdHVzTWVzc2FnZXMpO1xufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzI0LzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyoqXG4gICAgICogQG5nSW5qZWN0XG4gICAgICovXG4gICAgZnVuY3Rpb24gVXBncmFkZXMoKSB7XG5cbiAgICAgICAgdGhpcy5wcm9jZXNzVGljayA9IHByb2Nlc3NUaWNrO1xuICAgICAgICB0aGlzLnVwZ3JhZGVEZWZpbml0aW9ucyA9IHtcblxuICAgICAgICAgICAgYXV0b21hcDoge1xuICAgICAgICAgICAgICAgIGFjdGl2ZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgYXZhaWxhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvc3Q6IDMwMCxcbiAgICAgICAgICAgICAgICB0ZXh0OiAnQXV0b21hcCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQcmV2ZW50cyB5b3UgZnJvbSBnZXR0aW5nIGxvc3QuJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgIGZ1bmN0aW9uIHByb2Nlc3NUaWNrKCkge1xuICAgICAgICAgICAgLy8gZG8gc3R1ZmYgdGhhdCBzaG91bGQgaGFwcGVuIGV2ZXJ5IHRpY2ssIGRlcGVuZGluZyBvbiB0aGUgdXBncmFkZXNcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLnNlcnZpY2UoJ3VwZ3JhZGVzJywgVXBncmFkZXMpO1xuXG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjcvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBmdW5jdGlvbiBVdGlscygpIHtcblxuICAgICAgICB0aGlzLmNsYW1wID0gY2xhbXA7XG5cbiAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICBmdW5jdGlvbiBjbGFtcCh2YWx1ZSwgbWluLCBtYXgpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLm1pbihNYXRoLm1heChtaW4sIHZhbHVlKSwgbWF4KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLnNlcnZpY2UoJ3V0aWxzJywgVXRpbHMpO1xuXG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjIvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjaGFyYWN0ZXJGYWN0b3J5KGNvbmZpZywgJHJlc291cmNlKSB7XG4gICAgICAgIHZhciB1cmwgPSBjb25maWcuYXBpU2VydmVyICsgJ2NoYXJhY3Rlci86aWQnO1xuICAgICAgICB2YXIgQ2hhcmFjdGVyID0gJHJlc291cmNlKHVybCwge2lkOiAnQGlkJ30pO1xuICAgICAgICB2YXIgaWQgPSAxO1xuXG4gICAgICAgIGFuZ3VsYXIuZXh0ZW5kKENoYXJhY3Rlciwge1xuXG4gICAgICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICAgICAgYXJncyA9IGFyZ3MgfHwge307XG4gICAgICAgICAgICAgICAgdmFyIGNoYXIgPSBuZXcgQ2hhcmFjdGVyKHtpZDogYXJncy5pZCB8fCBpZCsrfSk7XG5cbiAgICAgICAgICAgICAgICBjaGFyLm5hbWUgPSBhcmdzLm5hbWUgfHwgJ2NoYXJhY3Rlcic7XG4gICAgICAgICAgICAgICAgY2hhci5jbGFzcyA9IGFyZ3MuY2xhc3M7XG4gICAgICAgICAgICAgICAgY2hhci5sZXZlbCA9IDE7XG4gICAgICAgICAgICAgICAgY2hhci5ocCA9IHtjdXJyZW50OiAxMCwgbWF4OiAxMH07XG4gICAgICAgICAgICAgICAgY2hhci5tcCA9IHtjdXJyZW50OiAxMCwgbWF4OiAxMH07XG4gICAgICAgICAgICAgICAgY2hhci5hdGsgPSAxMDtcbiAgICAgICAgICAgICAgICBjaGFyLmRlZiA9IDEwO1xuICAgICAgICAgICAgICAgIGNoYXIubWFnaWMgPSAxMDtcbiAgICAgICAgICAgICAgICBjaGFyLnNwZWVkID0gMTA7XG4gICAgICAgICAgICAgICAgY2hhci5hYyA9IDEwO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNoYXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBDaGFyYWN0ZXI7XG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuZmFjdG9yeSgnQ2hhcmFjdGVyJywgY2hhcmFjdGVyRmFjdG9yeSk7XG59KSgpOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==