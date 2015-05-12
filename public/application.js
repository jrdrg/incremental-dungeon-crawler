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

            .state('main.battle', {
                params: {
                    battle: null,
                    promise: null
                },
                templateUrl: '/partials/battle.html',
                controller: 'BattleController',
                controllerAs: 'vm'
            })

            .state('town', {})

            .state('town.inn', {})

            .state('town.blacksmith', {})

            .state('town.trainingHall', {})

            .state('town.library', {})

            .state('mapTest', {
                url: '/maptest',
                templateUrl: '/partials/mapTest.html',
                controller: 'MapTestController',
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
 * Created by john on 1/28/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     * @constructor
     */
    function BattleController($state, $scope, statusMessages, locations) {
        var battle = $state.params.battle,
            promise = $state.params.promise,
            prevState = $state.previous || 'main.actions',
            self = this;


        var tick = 0;
        var xp = 0;
        var results = null;

        this.enemies = battle.enemies;
        this.messages = battle.messages;

    }
    BattleController.$inject = ["$state", "$scope", "statusMessages", "locations"];

    angular.module('game')
        .controller('BattleController', BattleController);

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
    function MainController($scope, $state, game, actions, statusMessages, locations, upgrades) {

        var self = this;

        this.actions = actions.actionDefinitions;
        this.buyUpgrade = buyUpgrade;
        this.characterInfo = characterInfo;
        this.changeLocation = locations.changeLocation;
        this.getAvailableActions = getAvailableActions;
        this.getAvailableUpgrades = getAvailableUpgrades;
        this.getLocation = getLocation;
        this.getParty = getParty;
        this.getUpgradeDescription = getUpgradeDescription;
        this.locations = locations.locations;
        this.messages = [];
        this.resources = game.resources;

        ///////////////////////////////

        statusMessages.onMessage($scope, function (args) {
            self.messages.unshift({text: args.message});
            if (self.messages.length > 20) {
                self.messages.pop();
            }
        });


        function buyUpgrade(upgrade) {
            upgrades.buyUpgrade(upgrade);
        }


        function characterInfo(character) {
            if (!game.isInBattle()) {

                $state.go('main.characterStatus', {
                    character: character
                });

            } else {
                statusMessages.message("In a battle!");
            }
        }


        function getAvailableActions() {
            return game.location().actions;
        }


        function getAvailableUpgrades() {
            return _.sortBy(_.filter(upgrades.upgradeDefinitions, 'available'), function (u) {
                return u.active ? 0 : 1;
            });
        }


        function getLocation() {
            return game.location();
        }


        function getParty() {
            return game.party;
        }


        function getUpgradeDescription(upgrade) {
            var text = "<div>" + upgrade.description + "</div><ul class='requires'>";

            for (var require in upgrade.requires) {
                if (upgrade.requires.hasOwnProperty(require)) {
                    text += "<li>" + require + ": " + upgrade.requires[require] + "</li>";
                }
            }

            text += "</ul>";
            return text;
        }


    }
    MainController.$inject = ["$scope", "$state", "game", "actions", "statusMessages", "locations", "upgrades"];

    angular.module('game')
        .controller('MainController', MainController);
})();
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
    MapTestController.$inject = ["mapAtlas"];

    angular.module('game')
        .controller('MapTestController', MapTestController);

})();
/**
 * Created by john on 2/16/15.
 */
(function () {

    'use strict';

    var defaultDefinition = {
        hp: 1,
        minStats: {},
        wizardSpells: {
            minLevels: [0, 0, 0, 0, 0, 0, 0],
            perLevel: [0, 0, 0, 0, 0, 0, 0]
        },
        priestSpells: {
            minLevels: [0, 0, 0, 0, 0, 0, 0],
            perLevel: [0, 0, 0, 0, 0, 0, 0]
        }
    };

    /**
     * @ngInject
     */
    function classDefinitions() {

        var definitions = {

            'fighter': angular.extend({}, defaultDefinition, {
                hp: 10,
                minStats: {
                    str: 10
                }
            }),

            'wizard': angular.extend({}, defaultDefinition, {
                hp: 4,
                minStats: {
                    int: 12
                },
                wizardSpells: {
                    minLevels: [1, 3, 4, 8, 15, 30, 60],
                    perLevel: [0.5, 0.5, 0.5, 0.5, 0.5, 0.25, 0.25]
                }
            }),

            'priest': {
                hp: 6,
                minStats: {
                    con: 4,
                    wis: 12
                }
            },

            'archer': {
                hp: 8,
                minStats: {
                    dex: 14,
                    str: 8
                }
            },

            'berserker': {},

            'monk': {}
        };

        return definitions;
    }

    angular.module('game')
        .factory('classDefinitions', classDefinitions);

})();
/**
 * Created by john on 2/16/15.
 */
(function() {

    'use strict';


    var maleNames = [
        'Alberich', 'Alfwin', 'Algar', 'Angus', 'Bors', 'Caspar', 'Cedric', 'Fulk', 'Garon', 'Irmak', 'Jubal', 'Marlowe', 'Rainard', 'Sigmund'
    ];

    var femaleNames = [
        'Amaryllis', 'Aysel', 'Berenice', 'Branwen', 'Camellia', 'Clotilde', 'Fiorella', 'Isolde', 'Melanthe', 'Melpomene', 'Moana', 'Nerida', 'Safira', 'Thalia'
    ];


    function NameGenerator() {

        this.male = function() {
            return _.sample(maleNames);
        };

        this.female = function() {
            return _.sample(femaleNames);
        };
    }

    angular.module('game')
        .service('nameGenerator', NameGenerator);

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

            function explore(locations) {
                if (Math.random() <= self.enemyChance) {
                    randomBattle(locations);

                } else if (Math.random() <= self.trapChance) {
                    trap();

                } else if (Math.random() <= self.treasureChance) {
                    foundTreasure();

                }
                self.explored = true;
            }

            function randomBattle(locations) {
                statusMessages.message("Random battle!");
                self.enemyChance *= 0.8; // reduce the chance each time we visit this room

                var battle = new Battle(locations, {});
                battle.begin();
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

            function explore(totalFloors, locations) {
                var room = self.rooms[self.currentRoom];
                room.explore(locations);

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

            function explore(locations) {
                var floor = utils.clamp(self.currentFloor, 0, self.floors.length);
                self.floors[floor].explore(self.floors.length, locations);

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

    var defaults = {
        running: false,
        automated: false,
        pctComplete: 0,
        onStart: angular.noop,
        automateUpgrade: null
    };

    /**
     * @ngInject
     * @param party
     * @param statusMessages
     * @constructor
     */
    function Actions($q, utils, party, statusMessages) {

        var self = this;

        this.actionDefinitions = createDefinitions();
        this.canAutomate = canAutomate;
        this.cancelActiveActions = cancelActiveActions;
        this.doAction = doAction;
        this.processTick = processTick;


        ////////////////////////////

        function createDefinitions() {
            return {

                explore: angular.extend({}, defaults, {
                    text: 'Explore',
                    speed: 0.12,
                    onComplete: function (game) {
                        game.explore();
                    },
                    automateUpgrade: 'autoExplore'
                }),

                gatherHerbs: angular.extend({}, defaults, {
                    text: 'Gather herbs',
                    speed: 0.1,
                    onComplete: function (game) {
                        if (game.location().herbs) {
                            var amount = Math.floor(Math.random() * 5);
                            game.updateResource('herbs', amount);
                            statusMessages.message("You find " + (amount > 0 ? amount : 'no') + " herbs.");
                        }
                    },
                    automateUpgrade: 'autoGather'
                })

            };
        }


        /**
         * @description     Returns true if the appropriate upgrade has been purchased to automate this action.
         * @param action
         * @param upgrades
         */
        function canAutomate(action, upgrades) {
            if (action.automateUpgrade) {
                return upgrades[action.automateUpgrade].active;
            }
            return false;
        }


        function cancelActiveActions() {
            angular.forEach(self.actionDefinitions, function (action) {
                if (action.running) {
                    action.pctComplete = 0;
                    action.running = false;

                    if (action.deferred) {
                        var deferred = action.deferred;
                        action.deferred = null;
                        deferred.reject('canceled');
                    }
                }
            });
        }


        /**
         *
         * @param game
         * @param action
         */
        function doAction(game, action) {
            if (game.id !== "Game")
                throw "Invalid [game] parameter";

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


        /**
         *
         * @param action
         * @returns {boolean|CSSStyleDeclaration.running|defaults.running|running}
         */
        function isRunning(action) {
            return action.running;
        }


        function processTick(game) {
            angular.forEach(self.actionDefinitions, function (action) {
                if (action.pctComplete < 1 && isRunning(action)) {
                    action.pctComplete = utils.clamp(action.pctComplete + action.speed, 0, 1);
                } else {
                    if (action.deferred) {
                        action.deferred.resolve({});
                        action.deferred = null;
                        toggleState(action, false);

                    } else {

                        if (action.automated && !game.isInBattle()) {
                            doAction(game, action);
                        }

                    }
                }
            });
        }


        /**
         *
         * @param action
         * @param running
         */
        function toggleState(action, running) {
            action.running = running;
        }
    }
    Actions.$inject = ["$q", "utils", "party", "statusMessages"];

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
    function battleFactory($rootScope, $state, $q, eventLoop, statusMessages, Enemy, party, resources, upgrades) {

        return function Battle(locations, args) {
            var prevState = 'main.actions';

            var self = this,
                enemies = createEnemies();

            var tick = 0,
                deferred,
                handler,
                currentChar,
                currentTurnOrder,
                xp = 0;

            this.begin = begin;
            this.enemies = enemies;
            this.messages = [];

            handler = eventLoop.onTick($rootScope, tickHandler);

            /////////////////////////////////////

            function begin() {
                var xp = resources.xp;
                fight().then(function (result) {
                    xp.current += result.xp;
                    xp = null;
                });
            }


            function createEnemies() {
                var numEnemies = Math.ceil(Math.random() * 5);
                var enemies = [];
                for (var i = 0; i < numEnemies; i++) {
                    enemies.push(new Enemy(args.level || 1));
                }
                return enemies;
            }


            function fight() {
                if (!deferred) {
                    deferred = $q.defer();
                    $state.go('main.battle', {
                        battle: self,
                        promise: deferred
                    });
                }
                return deferred.promise;
            }


            function onComplete(message) {
                statusMessages.message(message);
                handler();
                console.log("scope destroyed");
                $state.go(prevState || 'main.actions');
            }


            function processResult(result) {
                result = result || {};

                self.messages.unshift(result);
                xp += result.xp || 0;

                if (result.victory) {
                    deferred.resolve({
                        xp: xp
                    });
                    onComplete("You are victorious and gain " + xp + " xp.");

                } else if (result.defeat) {
                    deferred.resolve({
                        xp: 0
                    });
                    onComplete("You have been defeated.");
                }

                return result.victory || result.defeat;
            }


            function processTurn(turn) {
                var result,
                    actor = currentTurnOrder[turn];

                if (!actor.isDead()) {
                    if (actor instanceof Enemy) {
                        result = actor.attack(party.characters);
                    } else {
                        result = actor.attack(enemies);
                    }
                }
                return processResult(result);
            }


            function tickHandler(args) {
                tick++;

                if (currentTurnOrder) {

                    if (tick % 3 === 0) {
                        processTurn(currentChar);
                        currentChar++;

                        if (currentChar >= currentTurnOrder.length) {
                            currentTurnOrder = null;
                        }
                    }

                } else {
                    currentTurnOrder = _.sortBy(party.characters.concat(enemies), 'speed');
                    currentChar = 0;
                }

            }
        };
    }
    battleFactory.$inject = ["$rootScope", "$state", "$q", "eventLoop", "statusMessages", "Enemy", "party", "resources", "upgrades"];

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
            apiServer: 'http://localhost:13098/',

            secondsToHealInTown: 3
        };
    }

    angular.module('game')
        .factory('config', config);

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
                {
                    name: 'Goblin',
                    hp: 10,
                    xp: 3,
                    speed: '5', atk: 3, def: 1
                },
                {
                    name: 'Kobold',
                    hp: 10,
                    xp: 1,
                    speed: '7', atk: 1, def: 1
                }
            ]
        ];

        function Enemy(level) {
            level = Math.max(0, Math.min(level, enemies.length - 1));

            var random = _.sample(enemies[level]);
            angular.extend(this, random, {hp: {current: random.hp, max: random.hp}});
        }


        /**
         * @description     Returns 1,2,3 depending on how close to 0 the enemy's HP is
         */
        Enemy.prototype.condition = function () {
            var ratio = this.hp.current / this.hp.max;
            if (ratio <= 0.33) {
                return 3;
            } else if (ratio <= 0.66) {
                return 2;
            }
            return 1;
        };


        Enemy.prototype.damage = function (amount) {
            this.hp.current -= amount;
        };


        Enemy.prototype.heal = function (amount) {
            this.hp.current = utils.clamp(this.hp.current + amount, 0, this.hp.max);
        };


        Enemy.prototype.isDead = function () {
            return this.hp.current <= 0;
        };


        Enemy.prototype.attack = function (party) {
            // todo: put in some AI here to attack a certain party member based on conditions

            var available = _.filter(party, function (p) {
                return !p.isDead();
            });

            if (available.length === 0) {
                return {
                    message: 'The party is dead!',
                    defeat: true
                };
            }

            var randomChar = _.sample(available);

            var dmg = Math.floor(Math.random() * this.atk);
            var msg;
            if (dmg > 0) {
                msg = this.name + " strikes " + randomChar.name + " for " + dmg + " damage!";
            } else {
                msg = this.name + " missed " + randomChar.name + ".";
            }

            randomChar.damage(dmg);
            if (randomChar.isDead()) {
                msg += " " + randomChar.name + " is dead!";
            }
            return {
                target: randomChar,
                damage: dmg,
                message: msg
            };
        };

        return Enemy;
    }

    angular.module('game')
        .factory('Enemy', enemyFactory);
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
            return scope.$on(TICK, function (e, args) {
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
    function Game($rootScope, $state, eventLoop, utils, party, actions, resources, locations, upgrades) {

        var self = this;

        eventLoop.onTick($rootScope, function (args) {
            actions.processTick(self);
            upgrades.processTick(self);
            locations.processTick(self);
        });


        locations.changeLocation('town')();
        locations.current().map.exploredPct = 1;    // nothing to explore in the town for now

        /////////////////////////////////////////////////////////

        this.id = "Game";
        this.explore = explore;
        this.isInBattle = isInBattle;
        this.location = currentLocation;
        this.party = party.characters;
        this.resources = availableResources;
        this.updateResource = updateResource;
        this.upgrades = upgrades.upgradeDefinitions;


        /////////////////////////////////////////////////////////

        function availableResources() {
            return _.filter(resources, 'visible');
        }


        function currentLocation() {
            return locations.current();
        }


        function explore() {
            locations.explore();
        }


        function isInBattle() {
            return $state.current.name === 'main.battle';
        }


        function updateResource(resource, amount, max) {
            var res = resources[resource];
            if (!res) {
                res = {name: resource, current: 0, max: max, visible: true};
                resources[resource] = res;
            }
            if (res.max) {
                res.current = utils.clamp(res.current + amount, 0, res.max);
            } else {
                res.current += amount;
            }
        }
    }
    Game.$inject = ["$rootScope", "$state", "eventLoop", "utils", "party", "actions", "resources", "locations", "upgrades"];

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

    function generateTickFunction(config, intervalInSeconds, handler) {
        var tick = 0;
        var intervalInTicks = intervalInSeconds * config.ticksPerSecond;
        return function (game) {
            tick++;
            if (tick >= intervalInTicks) {
                tick = 0;
                handler(game);
            }
        };
    }


    /**
     * @ngInject
     * @constructor
     */
    function Locations($state, $q, config, statusMessages, actions, Map) {

        var self = this,
            actionDefs = actions.actionDefinitions,
            currentLocation;

        this.canChangeLocation = true;
        this.changeLocation = changeLocation;
        this.current = getCurrentLocation;
        this.explore = explore;
        this.locations = createLocations();
        this.processTick = processTick;
        this.toggleCanChangeLocation = toggleCanChangeLocation;

        ////////////////////////////////////////////////

        function changeLocation(newLocation, message) {
            return function () {
                if (self.canChangeLocation) {
                    var newLoc = _.findWhere(self.locations, {id: newLocation});
                    if (newLoc !== currentLocation) {
                        actions.cancelActiveActions();
                        currentLocation = newLoc;
                        currentLocation.discovered = true;
                        statusMessages.message(message);

                    } else {
                        statusMessages.message("You are already there.");
                    }

                } else {
                    statusMessages.message("Cannot travel at this time");
                }
            };
        }

        function createLocations() {
            return [

                {
                    id: 'town',
                    name: 'Town',
                    map: new Map({level: 1, floorCount: 1, roomCount: 1}),
                    discovered: true,
                    onTick: generateTickFunction(config, config.secondsToHealInTown, function (game) {
                        var party = game.party;
                        var healAmount = 1;

                        for (var i = 0; i < party.length; i++) {
                            party[i].heal(healAmount);
                        }
                    }),
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
                    herbs: [
                        {name: 'Mushrooms', pct: 1}
                    ],
                    actions: [
                        {
                            text: 'Return to town',
                            action: changeLocation('town', 'You return to the town.')
                        },
                        actionDefs.explore,
                        actionDefs.gatherHerbs,
                        {
                            text: 'Enter dungeon',
                            hidden: true,
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
                    discovered: false,
                    treasure: [
                        {name: 'gold', pct: 1}
                    ],
                    actions: [
                        {
                            text: 'Exit the dungeon',
                            action: changeLocation('forest', 'You climb back out to the forest.')
                        }
                    ]
                }
            ];
        }


        function explore() {
            var map = currentLocation.map;
            if (map) map.explore(self);
        }

        function getCurrentLocation() {
            return currentLocation;
        }

        function processTick(game) {
            if (currentLocation.onTick) {
                currentLocation.onTick(game);
            }
        }

        function toggleCanChangeLocation(canChange) {
            self.canChangeLocation = canChange;
        }
    }
    Locations.$inject = ["$state", "$q", "config", "statusMessages", "actions", "Map"];

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
            Character.create({name: 'Jimmy Ratfingers', class: 'thief'}),
            Character.create({name: 'Boris One-shot', class: 'archer'}),
            Character.create({name: 'Lysanna Dawnbringer', class: 'sorcerer'}),
            Character.create({name: 'Lothar Greenbrook', class: 'healer'})
        ];

        this.characters = characters;
    }
    Party.$inject = ["Character"];


    /**
     *
     * @returns {boolean} true if all party members are dead
     */
    Party.prototype.isDead = function () {
        return _.all(this.characters, function (c) {
            return c.isDead();
        });
    };

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
                name: 'XP',
                visible: true,
                current: 0
            },

            food: {
                name: 'Food',
                visible: true,
                current: 0,
                max: 1000
            },

            gold: {
                name: 'Gold',
                visible: true,
                current: 0
            },

            iron: {
                name: 'Iron',
                current: 0,
                max: 100
            }
        };
    }

    angular.module('game')
        .factory('resources', resources);

})();
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
    function Upgrades(resources, actions) {

        var self = this;

        this.buyUpgrade = buyUpgrade;
        this.canBuy = canBuy;
        this.processTick = processTick;
        this.upgradeDefinitions = {

            fastExplore: {
                text: 'Perception',
                description: 'Allows you to explore faster (1.2x speed)',
                active: false,
                available: true,
                requires: {
                    xp: 20
                }
            },


            autoMap: {
                text: 'Cartographer',
                description: 'Prevents you from getting lost.',
                active: false,
                available: true,
                requires: {
                    xp: 75
                }
            },


            autoGather: {
                text: 'Auto-gather',
                description: 'Automatically gathers herbs when you are in an area that has them.',
                active: false,
                checkAvailable: function () {
                    return resources.herbs && resources.herbs.current > 1;
                },
                requires: {
                    herbs: 10
                }
            },


            autoExplore: {
                text: 'Auto-explore',
                description: 'Automatically explores an area, stopping when hit points get low.',
                active: false,
                checkAvailable: function () {
                    return true;
                },
                requires: {
                    xp: 2.00
                }
            }
        };

        ////////////////////////////////////////////////

        function processTick(game) {
            // do stuff that should happen every tick, depending on the upgrades

            checkForAvailable();

            if (!game.isInBattle()) {
                // only do this stuff if we're not fighting anybody
                //doAutoExplore(game);
            }
        }

        function doAutoExplore(game) {
            if (self.upgradeDefinitions.autoExplore.active && !game.isInBattle()) {
                var action = actions.actionDefinitions.explore;
                actions.doAction(game, action);
            }
        }

        function canBuy(upgrade) {
            if (upgrade.requires) {
                var can = true;
                for (var resource in upgrade.requires) {
                    if (upgrade.requires.hasOwnProperty(resource)) {
                        if (!resources[resource] || resources[resource].current < upgrade.requires[resource]) {
                            can = false;
                        }
                    }
                }
                return can;

            } else {
                return false;
            }
        }

        function checkForAvailable() {
            angular.forEach(self.upgradeDefinitions, function (upgrade) {
                if (!upgrade.active) {
                    if (upgrade.checkAvailable) {
                        if (upgrade.checkAvailable()) {
                            // once it's available, it always is
                            upgrade.checkAvailable = null;
                            upgrade.available = true;
                        }
                    }
                    if (upgrade.available) {
                        // check if we can purchase it
                        upgrade.canPurchase = canBuy(upgrade);
                    }
                }
            });
        }

        function buyUpgrade(upgrade) {
            if (canBuy(upgrade)) {
                for (var resource in upgrade.requires) {
                    if (upgrade.requires.hasOwnProperty(resource)) {
                        resources[resource].current -= upgrade.requires[resource];
                    }
                }
                upgrade.active = true;  //todo: need to account for upgrades with multiple levels
            }
        }


    }
    Upgrades.$inject = ["resources", "actions"];

    angular.module('game')
        .service('upgrades', Upgrades);

})();
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
/**
 * Created by john on 2/17/15.
 */
(function () {

    'use strict';

    var WIDTH = 400;
    var HEIGHT = 400;

    /**
     * @ngInject
     */
    function MapDisplay() {

        return {
            restrict: 'E',

            replace: 'true',

            scope: {
                id: '@?',
                map: '=',
                position: '='
            },

            template: '<canvas id="c" width="' + WIDTH + '" height="' + HEIGHT + '"></canvas>',

            controller: ["$scope", function ($scope) {
                $scope.id = $scope.id || 'mapCanvas';
            }],

            link: function (scope, elem, attr) {

                var yMax = scope.map.length;
                var xMax = scope.map[0].length;

                var blockX = WIDTH / xMax;
                var blockY = HEIGHT / yMax;

                console.log("x=" + xMax + "," + "y=" + yMax);

                var canvas = elem[0];
                if (canvas.getContext) {
                    var ctx = canvas.getContext("2d");

                    //ctx.fillStyle = "rgb(200,0,0)";
                    //ctx.fillStyle = "rgba(0, 0, 200, 0.5)";

                    var border = 6;
                    var corrWidth = 12;

                    for (var y = 0; y < yMax; y++) {
                        for (var x = 0; x < xMax; x++) {

                            var xc = x * blockX;
                            var yc = y * blockY;

                            ctx.fillStyle = scope.map[y][x] === 1 ? 'rgb(200,0,0)' : 'rgb(0,200,0)';

                            ctx.fillRect(xc + border, yc + border, blockX - (border * 2), blockY - (border * 2));

                            ctx.fillStyle = 'rgb(100,100,100)';


                            ctx.fillRect(xc + (blockX / 2) - (corrWidth / 2), yc, corrWidth, border);
                            ctx.fillRect(xc, yc + (blockY / 2) - (corrWidth / 2), border, corrWidth);
                            ctx.fillRect(xc + (blockX / 2) - (corrWidth / 2), yc + blockY - border, corrWidth, border);
                            ctx.fillRect(xc + blockX - border, yc + (blockY / 2) - (corrWidth / 2), border, corrWidth);
                        }
                    }
                }
            }
        };

    }

    angular.module('game')
        .directive('mapDisplay', MapDisplay);

})();
/**
 * Created by john on 1/31/15.
 */
(function() {

    'use strict';



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
    function characterFactory(config, utils, $resource) {
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

        Character.prototype.damage = function (amount) {
            this.hp.current -= amount;
        };

        Character.prototype.heal = function (amount) {
            this.hp.current = utils.clamp(this.hp.current + amount, 0, this.hp.max);
        };

        Character.prototype.isDead = function () {
            return this.hp.current <= 0;
        };

        Character.prototype.attack = function (enemies) {
            if (!enemies || enemies.length === 0) {
                return {
                    message: "All enemies have been defeated.",
                    victory: true
                };
            }

            // implement some kind of way to choose which enemy to fight, or allow choosing some kind of AI
            //var randomEnemy = _.sample(enemies);
            var randomEnemy = utils.randomElement(enemies, 'condition', true);

            var dmg = Math.floor(Math.random() * this.atk);
            var msg;
            if (dmg > 0) {
                msg = this.name + " strikes " + randomEnemy.name + " for " + dmg + " damage!";
            } else {
                msg = this.name + " missed " + randomEnemy.name + ".";
            }
            var xp = 0;

            randomEnemy.damage(dmg);
            if (randomEnemy.isDead()) {
                for (var i = 0; i < enemies.length; i++) {
                    if (enemies[i] === randomEnemy) {
                        enemies.splice(i, 1);
                    }
                }
                msg += " " + randomEnemy.name + " is dead!";
                xp = randomEnemy.xp;
            }
            return {
                target: randomEnemy,
                damage: dmg,
                message: msg,
                xp: xp
            };
        };

        return Character;
    }
    characterFactory.$inject = ["config", "utils", "$resource"];

    angular.module('game')
        .factory('Character', characterFactory);
})();
/**
 * Created by john on 1/27/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     */
    function actionButtonDirective(eventLoop, config, actions, upgrades, game) {

        return {
            restrict: 'AE',

            scope: {
                action: '='
            },

            template: "<div class='action-bar' ng-click='doAction()'>" +
            "<div class='timer-bar-progress' ng-class='getCssClasses()'</div></div>",

            link: function (scope, elem, attr) {

                if (!scope.action) {
                    throw "No action is bound to this actionButton!";
                }

                var progressBar = angular.element(elem.children()[0]).children();   // timer-bar-progress
                var bar = angular.element(elem.children()[0]).append(progressBar);
                var text = angular.element(elem.children()[0]).append("<span class='action-bar-text'>" + scope.action.text + "</span>");
                var progress = angular.element(bar.children()[0]);


                scope.doAction = doAction;
                scope.getAutomatedCssClass = getAutomatedCssClass;
                scope.getCssClasses = getCssClasses;
                scope.isActionAutomated = isActionAutomated;
                scope.percentage = scope.action.pctComplete || 0;
                scope.waiting = false;

                /////////////////////////////////////

                if (scope.action.pctComplete > 0) {
                    progress.addClass('timer-bar-running');
                    scope.waiting = true;
                }
                progress.css('width', (scope.percentage * 100) + '%');
                eventLoop.onTick(scope, onTick);


                /**
                 * Runs doAction() on the action bound to the button
                 */
                function doAction() {
                    if (!scope.waiting) {
                        if (scope.onClick) {
                            scope.onClick();
                        }
                        scope.percentage = 0;
                        scope.waiting = true;

                        var action = scope.action;
                        if (actions.canAutomate(action, upgrades.upgradeDefinitions)) {
                            action.automated = !action.automated;
                        } else {
                            actions.doAction(game, action);
                        }
                    }
                }


                /**
                 * Used to apply classes to the timer bar via ng-class
                 * @returns {{timer-bar-running: (name of style)}}
                 */
                function getCssClasses() {
                    return {
                        'timer-bar-running': isActionRunning(),
                        'timer-bar-complete': isActionCompleted()
                    };
                }

                function getAutomatedCssClass() {
                    return {
                        'automated': isActionAutomated()
                    };
                }


                /**
                 * Returns true if the action is currently running
                 * @returns {defaults.running|*|CSSStyleDeclaration.running|running}
                 */
                function isActionRunning() {
                    //return scope.percentage >= 0 && scope.percentage < 1 && scope.waiting;
                    return scope.action.running && scope.action.pctComplete > 0;
                }


                function isActionCompleted() {
                    return scope.percentage >= 1 && !scope.waiting && scope.action.pctComplete === 0;
                }


                function isActionAutomated() {
                    return scope.action.automated;
                }


                /**
                 * Tick handler for the event loop
                 * @param args
                 */
                function onTick(args) {
                    var action = scope.action;

                    if (scope.percentage === 1 && action.pctComplete === 0) {
                        scope.waiting = false;
                    }
                    scope.percentage = action.pctComplete;
                    progress.css('width', (scope.percentage * 100) + '%');
                }
            }
        };
    }
    actionButtonDirective.$inject = ["eventLoop", "config", "actions", "upgrades", "game"];

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
 * Created by john on 1/28/15.
 */
(function () {

    'use strict';

    /**
     * @ngInject
     */
    function tooltipDirective() {

        return {
            restrict: 'AE',

            scope: {
                text: '=',
                xOffset: '@?',
                yOffset: '@?'
            },

            link: function (scope, elem, attr) {
                var element = angular.element(elem);
                var tooltipHtml = "<div class='tooltip'></div>";

                var tooltip = element.append(tooltipHtml).children()[1];

                tooltip.innerHTML = scope.text;
                var tooltipElem = angular.element(tooltip);
                var width = tooltipElem.css('width');

                element.on('mousemove', function (e) {
                    tooltipElem.css('top', e.y + 1 + 'px');
                    tooltipElem.css('left', e.x + 1 + 'px');
                    tooltipElem.css('display', 'inline-block');
                });
                element.on('mouseout', function (e) {
                    tooltipElem.css('display', 'none');
                });
            }
        };
    }

    angular.module('game')
        .directive('tooltip', tooltipDirective);

})();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0JhdHRsZUNvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9DaGFyYWN0ZXJTdGF0dXNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvTWFpbkNvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9NYXBUZXN0Q29udHJvbGxlci5qcyIsImNoYXJhY3RlcnMvY2xhc3NEZWZpbml0aW9ucy5qcyIsImNoYXJhY3RlcnMvbmFtZUdlbmVyYXRvci5qcyIsImZpbHRlcnMvZGlzY292ZXJlZExvY2F0aW9uLmpzIiwiZmlsdGVycy9wZXJjZW50YWdlLmpzIiwic2VydmljZXMvRHVuZ2Vvbi5qcyIsInNlcnZpY2VzL01hcC5qcyIsInNlcnZpY2VzL2FjdGlvbnMuanMiLCJzZXJ2aWNlcy9iYXR0bGUuanMiLCJzZXJ2aWNlcy9jb25maWcuanMiLCJzZXJ2aWNlcy9lbmVtaWVzLmpzIiwic2VydmljZXMvZXZlbnRMb29wLmpzIiwic2VydmljZXMvZ2FtZS5qcyIsInNlcnZpY2VzL2xvY2F0aW9ucy5qcyIsInNlcnZpY2VzL3BhcnR5LmpzIiwic2VydmljZXMvcmVzb3VyY2VzLmpzIiwic2VydmljZXMvc3RhdHVzTWVzc2FnZXMuanMiLCJzZXJ2aWNlcy91cGdyYWRlcy5qcyIsIm1hcHMvc2VydmljZXMvbWFwQXRsYXMuanMiLCJtYXBzL2RpcmVjdGl2ZXMvbWFwRGlzcGxheS5qcyIsInNlcnZpY2VzL2V2ZW50cy9iYXR0bGVFdmVudHMuanMiLCJzZXJ2aWNlcy9yZXNvdXJjZXMvQ2hhcmFjdGVyLmpzIiwidXRpbHMvZGlyZWN0aXZlcy9hY3Rpb25CdXR0b24uanMiLCJ1dGlscy9kaXJlY3RpdmVzL3RpbWVyQmFyLmpzIiwidXRpbHMvZGlyZWN0aXZlcy90b29sdGlwLmpzIiwidXRpbHMvc2VydmljZXMvdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQUdBLENBQUMsWUFBWTs7SUFFVDs7Ozs7OztJQU9BLFNB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UTs7O1FBR3BDLFNBQVMsY0FBYyxPQUFPLGdCQUFnQixZQUFZO1lBQ3RELElBQUksWUFBWSxVQUFVLE1BQU07Z0JBQzVCLElBQUksU0FBUztnQkFDYixJQUFJLFlBQVk7b0JBQ1osVUFBVSxLQUFLO3VCQUNaO29CQUNILFVBQVUsS0FBSzs7Z0JBRW5CLE9BQU87O1lBRVgsSUFBSSxlQUFlLEVBQUUsT0FBTyxPQUFPLFVBQVUsUUFBUSxHQUFHLEtBQUs7Z0JBQ3pELFVBQVUsVUFBVTtnQkFDcEIsT0FBTztlQUNSO1lBQ0gsSUFBSSxjQUFjLFVBQVUsR0FBRztZQUMvQixJQUFJLFFBQVE7WUFDWixLQUFLLElBQUksSUFBSSxHQUFHLElBQUksTUFBTSxRQUFRLEtBQUs7Z0JBQ25DLFNBQVMsVUFBVSxNQUFNO2dCQUN6QixJQUFJLFNBQVM7b0JBQ1QsT0FBTyxNQUFNOztZQUVyQixPQUFPLE1BQU0sTUFBTSxTQUFTOzs7O0lBSXBDLFFBQVEsT0FBTztTQUNWLFFBQVEsU0FBUzs7S0FFckIiLCJmaWxlIjoiYXBwbGljYXRpb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzIyLzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyoqXG4gICAgICogQG5nSW5qZWN0XG4gICAgICogQHBhcmFtICRzdGF0ZVByb3ZpZGVyXG4gICAgICogQHBhcmFtICR1cmxSb3V0ZXJQcm92aWRlclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGFwcENvbmZpZygkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG5cbiAgICAgICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnL21haW4nKTtcblxuICAgICAgICAkc3RhdGVQcm92aWRlclxuICAgICAgICAgICAgLnN0YXRlKCdtYWluJywge1xuICAgICAgICAgICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICAgICAgICAgIHVybDogJy9tYWluJyxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy9tYWluLmh0bWwnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdNYWluQ29udHJvbGxlcicsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlckFzOiAndm0nXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAuc3RhdGUoJ21haW4uYWN0aW9ucycsIHtcbiAgICAgICAgICAgICAgICB1cmw6ICcnLFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3BhcnRpYWxzL2FjdGlvbnMuaHRtbCdcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIC5zdGF0ZSgnbWFpbi5jaGFyYWN0ZXJTdGF0dXMnLCB7XG4gICAgICAgICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgICAgIGNoYXJhY3RlcjogbnVsbFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvY2hhcmFjdGVyU3RhdHVzLmh0bWwnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDaGFyYWN0ZXJTdGF0dXNDb250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyQXM6ICd2bSdcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIC5zdGF0ZSgnbWFpbi5iYXR0bGUnLCB7XG4gICAgICAgICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgICAgIGJhdHRsZTogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZTogbnVsbFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvYmF0dGxlLmh0bWwnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdCYXR0bGVDb250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyQXM6ICd2bSdcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIC5zdGF0ZSgndG93bicsIHt9KVxuXG4gICAgICAgICAgICAuc3RhdGUoJ3Rvd24uaW5uJywge30pXG5cbiAgICAgICAgICAgIC5zdGF0ZSgndG93bi5ibGFja3NtaXRoJywge30pXG5cbiAgICAgICAgICAgIC5zdGF0ZSgndG93bi50cmFpbmluZ0hhbGwnLCB7fSlcblxuICAgICAgICAgICAgLnN0YXRlKCd0b3duLmxpYnJhcnknLCB7fSlcblxuICAgICAgICAgICAgLnN0YXRlKCdtYXBUZXN0Jywge1xuICAgICAgICAgICAgICAgIHVybDogJy9tYXB0ZXN0JyxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy9tYXBUZXN0Lmh0bWwnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdNYXBUZXN0Q29udHJvbGxlcicsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlckFzOiAndm0nXG4gICAgICAgICAgICB9KVxuICAgICAgICA7XG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnLCBbJ3VpLnJvdXRlcicsICduZ1Jlc291cmNlJ10pXG4gICAgICAgIC5jb25maWcoYXBwQ29uZmlnKVxuICAgICAgICAucnVuKFsnJHJvb3RTY29wZScsICckc3RhdGUnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHN0YXRlKSB7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uIChldmVudCwgdG8sIHRvUGFyYW1zLCBmcm9tLCBmcm9tUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLnByZXZpb3VzID0gZnJvbTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRwcmV2aW91c1N0YXRlID0gZnJvbTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XSk7XG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjgvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBCYXR0bGVDb250cm9sbGVyKCRzdGF0ZSwgJHNjb3BlLCBzdGF0dXNNZXNzYWdlcywgbG9jYXRpb25zKSB7XG4gICAgICAgIHZhciBiYXR0bGUgPSAkc3RhdGUucGFyYW1zLmJhdHRsZSxcbiAgICAgICAgICAgIHByb21pc2UgPSAkc3RhdGUucGFyYW1zLnByb21pc2UsXG4gICAgICAgICAgICBwcmV2U3RhdGUgPSAkc3RhdGUucHJldmlvdXMgfHwgJ21haW4uYWN0aW9ucycsXG4gICAgICAgICAgICBzZWxmID0gdGhpcztcblxuXG4gICAgICAgIHZhciB0aWNrID0gMDtcbiAgICAgICAgdmFyIHhwID0gMDtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuZW5lbWllcyA9IGJhdHRsZS5lbmVtaWVzO1xuICAgICAgICB0aGlzLm1lc3NhZ2VzID0gYmF0dGxlLm1lc3NhZ2VzO1xuXG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuY29udHJvbGxlcignQmF0dGxlQ29udHJvbGxlcicsIEJhdHRsZUNvbnRyb2xsZXIpO1xuXG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjcvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBDaGFyYWN0ZXJTdGF0dXNDb250cm9sbGVyKCRzdGF0ZSkge1xuICAgICAgICB2YXIgY2hhcmFjdGVyID0gJHN0YXRlLnBhcmFtcy5jaGFyYWN0ZXI7XG5cbiAgICAgICAgdGhpcy5jaGFyYWN0ZXIgPSBjaGFyYWN0ZXI7XG4gICAgICAgIHRoaXMuZ29CYWNrID0gZ29CYWNrO1xuXG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgZnVuY3Rpb24gZ29CYWNrKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdtYWluLmFjdGlvbnMnKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuY29udHJvbGxlcignQ2hhcmFjdGVyU3RhdHVzQ29udHJvbGxlcicsIENoYXJhY3RlclN0YXR1c0NvbnRyb2xsZXIpO1xuXG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjIvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBNYWluQ29udHJvbGxlcigkc2NvcGUsICRzdGF0ZSwgZ2FtZSwgYWN0aW9ucywgc3RhdHVzTWVzc2FnZXMsIGxvY2F0aW9ucywgdXBncmFkZXMpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5hY3Rpb25zID0gYWN0aW9ucy5hY3Rpb25EZWZpbml0aW9ucztcbiAgICAgICAgdGhpcy5idXlVcGdyYWRlID0gYnV5VXBncmFkZTtcbiAgICAgICAgdGhpcy5jaGFyYWN0ZXJJbmZvID0gY2hhcmFjdGVySW5mbztcbiAgICAgICAgdGhpcy5jaGFuZ2VMb2NhdGlvbiA9IGxvY2F0aW9ucy5jaGFuZ2VMb2NhdGlvbjtcbiAgICAgICAgdGhpcy5nZXRBdmFpbGFibGVBY3Rpb25zID0gZ2V0QXZhaWxhYmxlQWN0aW9ucztcbiAgICAgICAgdGhpcy5nZXRBdmFpbGFibGVVcGdyYWRlcyA9IGdldEF2YWlsYWJsZVVwZ3JhZGVzO1xuICAgICAgICB0aGlzLmdldExvY2F0aW9uID0gZ2V0TG9jYXRpb247XG4gICAgICAgIHRoaXMuZ2V0UGFydHkgPSBnZXRQYXJ0eTtcbiAgICAgICAgdGhpcy5nZXRVcGdyYWRlRGVzY3JpcHRpb24gPSBnZXRVcGdyYWRlRGVzY3JpcHRpb247XG4gICAgICAgIHRoaXMubG9jYXRpb25zID0gbG9jYXRpb25zLmxvY2F0aW9ucztcbiAgICAgICAgdGhpcy5tZXNzYWdlcyA9IFtdO1xuICAgICAgICB0aGlzLnJlc291cmNlcyA9IGdhbWUucmVzb3VyY2VzO1xuXG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICBzdGF0dXNNZXNzYWdlcy5vbk1lc3NhZ2UoJHNjb3BlLCBmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgc2VsZi5tZXNzYWdlcy51bnNoaWZ0KHt0ZXh0OiBhcmdzLm1lc3NhZ2V9KTtcbiAgICAgICAgICAgIGlmIChzZWxmLm1lc3NhZ2VzLmxlbmd0aCA+IDIwKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5tZXNzYWdlcy5wb3AoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cblxuICAgICAgICBmdW5jdGlvbiBidXlVcGdyYWRlKHVwZ3JhZGUpIHtcbiAgICAgICAgICAgIHVwZ3JhZGVzLmJ1eVVwZ3JhZGUodXBncmFkZSk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIGZ1bmN0aW9uIGNoYXJhY3RlckluZm8oY2hhcmFjdGVyKSB7XG4gICAgICAgICAgICBpZiAoIWdhbWUuaXNJbkJhdHRsZSgpKSB7XG5cbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ21haW4uY2hhcmFjdGVyU3RhdHVzJywge1xuICAgICAgICAgICAgICAgICAgICBjaGFyYWN0ZXI6IGNoYXJhY3RlclxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0YXR1c01lc3NhZ2VzLm1lc3NhZ2UoXCJJbiBhIGJhdHRsZSFcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICAgIGZ1bmN0aW9uIGdldEF2YWlsYWJsZUFjdGlvbnMoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2FtZS5sb2NhdGlvbigpLmFjdGlvbnM7XG4gICAgICAgIH1cblxuXG4gICAgICAgIGZ1bmN0aW9uIGdldEF2YWlsYWJsZVVwZ3JhZGVzKCkge1xuICAgICAgICAgICAgcmV0dXJuIF8uc29ydEJ5KF8uZmlsdGVyKHVwZ3JhZGVzLnVwZ3JhZGVEZWZpbml0aW9ucywgJ2F2YWlsYWJsZScpLCBmdW5jdGlvbiAodSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB1LmFjdGl2ZSA/IDAgOiAxO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIGZ1bmN0aW9uIGdldExvY2F0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdhbWUubG9jYXRpb24oKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0UGFydHkoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2FtZS5wYXJ0eTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0VXBncmFkZURlc2NyaXB0aW9uKHVwZ3JhZGUpIHtcbiAgICAgICAgICAgIHZhciB0ZXh0ID0gXCI8ZGl2PlwiICsgdXBncmFkZS5kZXNjcmlwdGlvbiArIFwiPC9kaXY+PHVsIGNsYXNzPSdyZXF1aXJlcyc+XCI7XG5cbiAgICAgICAgICAgIGZvciAodmFyIHJlcXVpcmUgaW4gdXBncmFkZS5yZXF1aXJlcykge1xuICAgICAgICAgICAgICAgIGlmICh1cGdyYWRlLnJlcXVpcmVzLmhhc093blByb3BlcnR5KHJlcXVpcmUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRleHQgKz0gXCI8bGk+XCIgKyByZXF1aXJlICsgXCI6IFwiICsgdXBncmFkZS5yZXF1aXJlc1tyZXF1aXJlXSArIFwiPC9saT5cIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRleHQgKz0gXCI8L3VsPlwiO1xuICAgICAgICAgICAgcmV0dXJuIHRleHQ7XG4gICAgICAgIH1cblxuXG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuY29udHJvbGxlcignTWFpbkNvbnRyb2xsZXInLCBNYWluQ29udHJvbGxlcik7XG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDIvMTcvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBNYXBUZXN0Q29udHJvbGxlcihtYXBBdGxhcykge1xuXG5cbiAgICAgICAgdGhpcy5tYXAgPSBtYXBBdGxhcy5tYXBzWzBdLnJvb21zO1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0ge3g6IDAsIHk6IDB9O1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmNvbnRyb2xsZXIoJ01hcFRlc3RDb250cm9sbGVyJywgTWFwVGVzdENvbnRyb2xsZXIpO1xuXG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDIvMTYvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgZGVmYXVsdERlZmluaXRpb24gPSB7XG4gICAgICAgIGhwOiAxLFxuICAgICAgICBtaW5TdGF0czoge30sXG4gICAgICAgIHdpemFyZFNwZWxsczoge1xuICAgICAgICAgICAgbWluTGV2ZWxzOiBbMCwgMCwgMCwgMCwgMCwgMCwgMF0sXG4gICAgICAgICAgICBwZXJMZXZlbDogWzAsIDAsIDAsIDAsIDAsIDAsIDBdXG4gICAgICAgIH0sXG4gICAgICAgIHByaWVzdFNwZWxsczoge1xuICAgICAgICAgICAgbWluTGV2ZWxzOiBbMCwgMCwgMCwgMCwgMCwgMCwgMF0sXG4gICAgICAgICAgICBwZXJMZXZlbDogWzAsIDAsIDAsIDAsIDAsIDAsIDBdXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQG5nSW5qZWN0XG4gICAgICovXG4gICAgZnVuY3Rpb24gY2xhc3NEZWZpbml0aW9ucygpIHtcblxuICAgICAgICB2YXIgZGVmaW5pdGlvbnMgPSB7XG5cbiAgICAgICAgICAgICdmaWdodGVyJzogYW5ndWxhci5leHRlbmQoe30sIGRlZmF1bHREZWZpbml0aW9uLCB7XG4gICAgICAgICAgICAgICAgaHA6IDEwLFxuICAgICAgICAgICAgICAgIG1pblN0YXRzOiB7XG4gICAgICAgICAgICAgICAgICAgIHN0cjogMTBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSxcblxuICAgICAgICAgICAgJ3dpemFyZCc6IGFuZ3VsYXIuZXh0ZW5kKHt9LCBkZWZhdWx0RGVmaW5pdGlvbiwge1xuICAgICAgICAgICAgICAgIGhwOiA0LFxuICAgICAgICAgICAgICAgIG1pblN0YXRzOiB7XG4gICAgICAgICAgICAgICAgICAgIGludDogMTJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHdpemFyZFNwZWxsczoge1xuICAgICAgICAgICAgICAgICAgICBtaW5MZXZlbHM6IFsxLCAzLCA0LCA4LCAxNSwgMzAsIDYwXSxcbiAgICAgICAgICAgICAgICAgICAgcGVyTGV2ZWw6IFswLjUsIDAuNSwgMC41LCAwLjUsIDAuNSwgMC4yNSwgMC4yNV1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSxcblxuICAgICAgICAgICAgJ3ByaWVzdCc6IHtcbiAgICAgICAgICAgICAgICBocDogNixcbiAgICAgICAgICAgICAgICBtaW5TdGF0czoge1xuICAgICAgICAgICAgICAgICAgICBjb246IDQsXG4gICAgICAgICAgICAgICAgICAgIHdpczogMTJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAnYXJjaGVyJzoge1xuICAgICAgICAgICAgICAgIGhwOiA4LFxuICAgICAgICAgICAgICAgIG1pblN0YXRzOiB7XG4gICAgICAgICAgICAgICAgICAgIGRleDogMTQsXG4gICAgICAgICAgICAgICAgICAgIHN0cjogOFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICdiZXJzZXJrZXInOiB7fSxcblxuICAgICAgICAgICAgJ21vbmsnOiB7fVxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBkZWZpbml0aW9ucztcbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5mYWN0b3J5KCdjbGFzc0RlZmluaXRpb25zJywgY2xhc3NEZWZpbml0aW9ucyk7XG5cbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMi8xNi8xNS5cbiAqL1xuKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG5cbiAgICB2YXIgbWFsZU5hbWVzID0gW1xuICAgICAgICAnQWxiZXJpY2gnLCAnQWxmd2luJywgJ0FsZ2FyJywgJ0FuZ3VzJywgJ0JvcnMnLCAnQ2FzcGFyJywgJ0NlZHJpYycsICdGdWxrJywgJ0dhcm9uJywgJ0lybWFrJywgJ0p1YmFsJywgJ01hcmxvd2UnLCAnUmFpbmFyZCcsICdTaWdtdW5kJ1xuICAgIF07XG5cbiAgICB2YXIgZmVtYWxlTmFtZXMgPSBbXG4gICAgICAgICdBbWFyeWxsaXMnLCAnQXlzZWwnLCAnQmVyZW5pY2UnLCAnQnJhbndlbicsICdDYW1lbGxpYScsICdDbG90aWxkZScsICdGaW9yZWxsYScsICdJc29sZGUnLCAnTWVsYW50aGUnLCAnTWVscG9tZW5lJywgJ01vYW5hJywgJ05lcmlkYScsICdTYWZpcmEnLCAnVGhhbGlhJ1xuICAgIF07XG5cblxuICAgIGZ1bmN0aW9uIE5hbWVHZW5lcmF0b3IoKSB7XG5cbiAgICAgICAgdGhpcy5tYWxlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gXy5zYW1wbGUobWFsZU5hbWVzKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmZlbWFsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIF8uc2FtcGxlKGZlbWFsZU5hbWVzKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5zZXJ2aWNlKCduYW1lR2VuZXJhdG9yJywgTmFtZUdlbmVyYXRvcik7XG5cbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yNy8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGZ1bmN0aW9uIGRpc2NvdmVyZWRMb2NhdGlvbkZpbHRlcigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGRpc2NvdmVyZWRMb2NhdGlvbihsb2NhdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBfLndoZXJlKGxvY2F0aW9ucywge2Rpc2NvdmVyZWQ6IHRydWV9KTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5maWx0ZXIoJ2Rpc2NvdmVyZWRMb2NhdGlvbicsIGRpc2NvdmVyZWRMb2NhdGlvbkZpbHRlcik7XG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjcvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBmdW5jdGlvbiBwZXJjZW50YWdlRmlsdGVyKCRmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIHBlcmNlbnRhZ2UoaW5wdXQsIGRlY2ltYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGZpbHRlcignbnVtYmVyJykoaW5wdXQgKiAxMDAsIGRlY2ltYWxzKSArICclJztcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5maWx0ZXIoJ3BlcmNlbnRhZ2UnLCBwZXJjZW50YWdlRmlsdGVyKTtcblxufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzI0LzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyoqXG4gICAgICogQG5nSW5jbHVkZVxuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGR1bmdlb25GYWN0b3J5KCkge1xuXG4gICAgICAgIGZ1bmN0aW9uIFJvb20oKSB7XG4gICAgICAgICAgICB0aGlzLmVuZW15Q2hhbmNlID0gTWF0aC5yYW5kb20oKTsgICAvLyAlIG9mIGdldHRpbmcgZW5lbXkgZW5jb3VudGVyXG4gICAgICAgICAgICB0aGlzLnRyYXBDaGFuY2UgPSBNYXRoLnJhbmRvbSgpOyAgICAvLyAlIG9mIHRyYXBcbiAgICAgICAgICAgIHRoaXMudHJlYXN1cmVDaGFuY2UgPSBNYXRoLnJhbmRvbSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gRmxvb3IoKSB7XG4gICAgICAgICAgICB0aGlzLmV4cGxvcmVkUGN0ID0gMDtcbiAgICAgICAgICAgIHRoaXMucm9vbXMgPSBbXTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIER1bmdlb24obGV2ZWwsIGZsb29yQ291bnQpIHtcblxuICAgICAgICAgICAgZmxvb3JDb3VudCA9IE1hdGgucmFuZG9tKCkgKiBsZXZlbCAqIDI7XG5cbiAgICAgICAgICAgIHRoaXMubGV2ZWwgPSBsZXZlbDtcbiAgICAgICAgICAgIHRoaXMuZmxvb3JzID0gW107XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmxvb3JDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mbG9vcnMucHVzaChuZXcgRmxvb3IoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuZmFjdG9yeSgnRHVuZ2VvbicsIGR1bmdlb25GYWN0b3J5KTtcbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yNC8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8qKlxuICAgICAqIEBuZ0luY2x1ZGVcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBtYXBGYWN0b3J5KHV0aWxzLCBwYXJ0eSwgc3RhdHVzTWVzc2FnZXMsIHVwZ3JhZGVzLCByZXNvdXJjZXMsIEJhdHRsZSkge1xuXG4gICAgICAgIHZhciBnZXRMb3N0Q2hhbmNlID0gMC4yOyAgICAvLyB0b2RvOiBjaGFuZ2UgdGhpcz9cbiAgICAgICAgdmFyIHJvb21YcEJhc2UgPSAxO1xuXG4gICAgICAgIGZ1bmN0aW9uIFJvb20obWFwLCBmbG9vcikge1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICAgICB0aGlzLmV4cGxvcmUgPSBleHBsb3JlO1xuICAgICAgICAgICAgdGhpcy5leHBsb3JlZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5lbmVteUNoYW5jZSA9IE1hdGgucmFuZG9tKCk7ICAgLy8gJSBvZiBnZXR0aW5nIGVuZW15IGVuY291bnRlclxuICAgICAgICAgICAgdGhpcy5oYXNTdGFpcnMgPSBNYXRoLnJhbmRvbSgpIC8gMTA7ICAgICAvLyAlIG9mIGZpbmRpbmcgc3RhaXJzIGRvd24gaGVyZSwgb25jZSB0aGlzIGlzIHNldCB0aGVuIG5vIG90aGVyIHJvb20gY2FuIGhhdmUgaXRcbiAgICAgICAgICAgIHRoaXMudHJhcENoYW5jZSA9IE1hdGgucmFuZG9tKCk7ICAgIC8vICUgb2YgdHJhcFxuICAgICAgICAgICAgdGhpcy50cmVhc3VyZUNoYW5jZSA9IE1hdGgucmFuZG9tKCk7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGV4cGxvcmUobG9jYXRpb25zKSB7XG4gICAgICAgICAgICAgICAgaWYgKE1hdGgucmFuZG9tKCkgPD0gc2VsZi5lbmVteUNoYW5jZSkge1xuICAgICAgICAgICAgICAgICAgICByYW5kb21CYXR0bGUobG9jYXRpb25zKTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoTWF0aC5yYW5kb20oKSA8PSBzZWxmLnRyYXBDaGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhcCgpO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChNYXRoLnJhbmRvbSgpIDw9IHNlbGYudHJlYXN1cmVDaGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgZm91bmRUcmVhc3VyZSgpO1xuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNlbGYuZXhwbG9yZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiByYW5kb21CYXR0bGUobG9jYXRpb25zKSB7XG4gICAgICAgICAgICAgICAgc3RhdHVzTWVzc2FnZXMubWVzc2FnZShcIlJhbmRvbSBiYXR0bGUhXCIpO1xuICAgICAgICAgICAgICAgIHNlbGYuZW5lbXlDaGFuY2UgKj0gMC44OyAvLyByZWR1Y2UgdGhlIGNoYW5jZSBlYWNoIHRpbWUgd2UgdmlzaXQgdGhpcyByb29tXG5cbiAgICAgICAgICAgICAgICB2YXIgYmF0dGxlID0gbmV3IEJhdHRsZShsb2NhdGlvbnMsIHt9KTtcbiAgICAgICAgICAgICAgICBiYXR0bGUuYmVnaW4oKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gZm91bmRUcmVhc3VyZSgpIHtcbiAgICAgICAgICAgICAgICBzdGF0dXNNZXNzYWdlcy5tZXNzYWdlKFwiRm91bmQgdHJlYXN1cmUhXCIpO1xuICAgICAgICAgICAgICAgIHNlbGYudHJlYXN1cmVDaGFuY2UgKj0gMC43NTtcbiAgICAgICAgICAgICAgICByZXNvdXJjZXMuZ29sZC5jdXJyZW50ICs9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwICogbWFwLmxldmVsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gdHJhcCgpIHtcbiAgICAgICAgICAgICAgICBzdGF0dXNNZXNzYWdlcy5tZXNzYWdlKFwiVHJpZ2dlcmVkIGEgdHJhcCFcIik7XG4gICAgICAgICAgICAgICAgc2VsZi50cmFwQ2hhbmNlICo9IDAuODtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgICAgZnVuY3Rpb24gRmxvb3IobWFwLCByb29tQ291bnQpIHtcbiAgICAgICAgICAgIHJvb21Db3VudCA9IE1hdGguZmxvb3Iocm9vbUNvdW50IHx8IDEpO1xuXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgICAgIHRoaXMuY3VycmVudFJvb20gPSAwO1xuICAgICAgICAgICAgdGhpcy5leHBsb3JlID0gZXhwbG9yZTtcbiAgICAgICAgICAgIHRoaXMuZXhwbG9yZWRQY3QgPSAwO1xuICAgICAgICAgICAgdGhpcy5mb3VuZFN0YWlycyA9IGZhbHNlOyAgIC8vIGNhbiBnbyB0byBuZXh0IGZsb29yP1xuICAgICAgICAgICAgdGhpcy5yb29tcyA9IFtdO1xuXG4gICAgICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcm9vbUNvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJvb21zLnB1c2gobmV3IFJvb20obWFwLCBzZWxmKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICAgICAgZnVuY3Rpb24gZXhwbG9yZSh0b3RhbEZsb29ycywgbG9jYXRpb25zKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJvb20gPSBzZWxmLnJvb21zW3NlbGYuY3VycmVudFJvb21dO1xuICAgICAgICAgICAgICAgIHJvb20uZXhwbG9yZShsb2NhdGlvbnMpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGhhc1N0YWlycyA9IChzZWxmLmN1cnJlbnRSb29tID09IHNlbGYucm9vbXMubGVuZ3RoIC0gMSkgfHwgTWF0aC5yYW5kb20oKSA8PSByb29tLmhhc1N0YWlycztcblxuICAgICAgICAgICAgICAgIGlmICh0b3RhbEZsb29ycyA+IDEgJiYgIXNlbGYuZm91bmRTdGFpcnMgJiYgaGFzU3RhaXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1c01lc3NhZ2VzLm1lc3NhZ2UoXCJGb3VuZCBzdGFpcnMgdG8gdGhlIG5leHQgbGV2ZWwuXCIpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmZvdW5kU3RhaXJzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIXVwZ3JhZGVzLmF1dG9NYXApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgYXV0b21hcCwgd2UgZG9uJ3QgZ2V0IGxvc3RcbiAgICAgICAgICAgICAgICAgICAgaWYgKE1hdGgucmFuZG9tKCkgPD0gZ2V0TG9zdENoYW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzTWVzc2FnZXMubWVzc2FnZShcIllvdSBnZXQgbG9zdCFcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmN1cnJlbnRSb29tID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcm9vbUNvdW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5jdXJyZW50Um9vbSA8IHJvb21Db3VudCAtIDEpXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY3VycmVudFJvb20rKztcblxuICAgICAgICAgICAgICAgIHZhciBleHBsb3JlZCA9IF8uZmlsdGVyKHNlbGYucm9vbXMsICdleHBsb3JlZCcpLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBzZWxmLmV4cGxvcmVkUGN0ID0gZXhwbG9yZWQgLyBzZWxmLnJvb21zLmxlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwYXJhbSB7TnVtYmVyfSBsZXZlbCAtIHRoZSBsZXZlbCBvZiBkaWZmaWN1bHR5IG9mIHRoZSBkdW5nZW9uXG4gICAgICAgICAqIEBwYXJhbSB7TnVtYmVyfSBmbG9vckNvdW50IC0gdGhlIG51bWJlciBvZiBmbG9vcnNcbiAgICAgICAgICovXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBNYXAoYXJncykge1xuXG4gICAgICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcblxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgICAgICAgIGxldmVsID0gYXJncy5sZXZlbCB8fCAxLFxuICAgICAgICAgICAgICAgIGZsb29yQ291bnQgPSBhcmdzLmZsb29yQ291bnQgfHwgTWF0aC5yYW5kb20oKSAqIGxldmVsICogMixcbiAgICAgICAgICAgICAgICByb29tQ291bnQgPSBhcmdzLnJvb21Db3VudCB8fCBNYXRoLnJhbmRvbSgpICogNTAgKyAoTWF0aC5yYW5kb20oKSAqIDUgKyAxMCk7XG5cbiAgICAgICAgICAgIHRoaXMuY3VycmVudEZsb29yID0gMDtcbiAgICAgICAgICAgIHRoaXMuZXhwbG9yZSA9IGV4cGxvcmU7XG4gICAgICAgICAgICB0aGlzLmV4cGxvcmVkUGN0ID0gMDtcbiAgICAgICAgICAgIHRoaXMuZmxvb3JzID0gW107XG4gICAgICAgICAgICB0aGlzLmxldmVsID0gbGV2ZWw7XG5cbiAgICAgICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmxvb3JDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mbG9vcnMucHVzaChuZXcgRmxvb3Ioc2VsZiwgcm9vbUNvdW50KSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGNoYW5nZUZsb29yKG5ld0Zsb29yKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5jdXJyZW50Rmxvb3IgPSBuZXdGbG9vciB8fCBzZWxmLmN1cnJlbnRGbG9vcjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gZXhwbG9yZShsb2NhdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgZmxvb3IgPSB1dGlscy5jbGFtcChzZWxmLmN1cnJlbnRGbG9vciwgMCwgc2VsZi5mbG9vcnMubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICBzZWxmLmZsb29yc1tmbG9vcl0uZXhwbG9yZShzZWxmLmZsb29ycy5sZW5ndGgsIGxvY2F0aW9ucyk7XG5cbiAgICAgICAgICAgICAgICB2YXIgZXhwbG9yZWQgPSBfLnJlZHVjZShzZWxmLmZsb29ycywgZnVuY3Rpb24gKHBjdCwgZmxvb3IsIGlkeCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkVYUExPUkVEOiBcIiArIGZsb29yKTtcbiAgICAgICAgICAgICAgICAgICAgcGN0ICs9IGZsb29yLmV4cGxvcmVkUGN0O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGN0O1xuICAgICAgICAgICAgICAgIH0sIDApO1xuXG4gICAgICAgICAgICAgICAgaWYgKGV4cGxvcmVkID4gc2VsZi5leHBsb3JlZFBjdCkge1xuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZXMueHAuY3VycmVudCArPSAocm9vbVhwQmFzZSAqIGxldmVsICogKHNlbGYuY3VycmVudEZsb29yICsgMSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmLmV4cGxvcmVkUGN0ID0gZXhwbG9yZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuZmFjdG9yeSgnTWFwJywgbWFwRmFjdG9yeSk7XG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjMvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIHJ1bm5pbmc6IGZhbHNlLFxuICAgICAgICBhdXRvbWF0ZWQ6IGZhbHNlLFxuICAgICAgICBwY3RDb21wbGV0ZTogMCxcbiAgICAgICAgb25TdGFydDogYW5ndWxhci5ub29wLFxuICAgICAgICBhdXRvbWF0ZVVwZ3JhZGU6IG51bGxcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQG5nSW5qZWN0XG4gICAgICogQHBhcmFtIHBhcnR5XG4gICAgICogQHBhcmFtIHN0YXR1c01lc3NhZ2VzXG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgZnVuY3Rpb24gQWN0aW9ucygkcSwgdXRpbHMsIHBhcnR5LCBzdGF0dXNNZXNzYWdlcykge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICB0aGlzLmFjdGlvbkRlZmluaXRpb25zID0gY3JlYXRlRGVmaW5pdGlvbnMoKTtcbiAgICAgICAgdGhpcy5jYW5BdXRvbWF0ZSA9IGNhbkF1dG9tYXRlO1xuICAgICAgICB0aGlzLmNhbmNlbEFjdGl2ZUFjdGlvbnMgPSBjYW5jZWxBY3RpdmVBY3Rpb25zO1xuICAgICAgICB0aGlzLmRvQWN0aW9uID0gZG9BY3Rpb247XG4gICAgICAgIHRoaXMucHJvY2Vzc1RpY2sgPSBwcm9jZXNzVGljaztcblxuXG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVEZWZpbml0aW9ucygpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG5cbiAgICAgICAgICAgICAgICBleHBsb3JlOiBhbmd1bGFyLmV4dGVuZCh7fSwgZGVmYXVsdHMsIHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0V4cGxvcmUnLFxuICAgICAgICAgICAgICAgICAgICBzcGVlZDogMC4xMixcbiAgICAgICAgICAgICAgICAgICAgb25Db21wbGV0ZTogZnVuY3Rpb24gKGdhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdhbWUuZXhwbG9yZSgpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBhdXRvbWF0ZVVwZ3JhZGU6ICdhdXRvRXhwbG9yZSdcbiAgICAgICAgICAgICAgICB9KSxcblxuICAgICAgICAgICAgICAgIGdhdGhlckhlcmJzOiBhbmd1bGFyLmV4dGVuZCh7fSwgZGVmYXVsdHMsIHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0dhdGhlciBoZXJicycsXG4gICAgICAgICAgICAgICAgICAgIHNwZWVkOiAwLjEsXG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6IGZ1bmN0aW9uIChnYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2FtZS5sb2NhdGlvbigpLmhlcmJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFtb3VudCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWUudXBkYXRlUmVzb3VyY2UoJ2hlcmJzJywgYW1vdW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXNNZXNzYWdlcy5tZXNzYWdlKFwiWW91IGZpbmQgXCIgKyAoYW1vdW50ID4gMCA/IGFtb3VudCA6ICdubycpICsgXCIgaGVyYnMuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBhdXRvbWF0ZVVwZ3JhZGU6ICdhdXRvR2F0aGVyJ1xuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAZGVzY3JpcHRpb24gICAgIFJldHVybnMgdHJ1ZSBpZiB0aGUgYXBwcm9wcmlhdGUgdXBncmFkZSBoYXMgYmVlbiBwdXJjaGFzZWQgdG8gYXV0b21hdGUgdGhpcyBhY3Rpb24uXG4gICAgICAgICAqIEBwYXJhbSBhY3Rpb25cbiAgICAgICAgICogQHBhcmFtIHVwZ3JhZGVzXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBjYW5BdXRvbWF0ZShhY3Rpb24sIHVwZ3JhZGVzKSB7XG4gICAgICAgICAgICBpZiAoYWN0aW9uLmF1dG9tYXRlVXBncmFkZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB1cGdyYWRlc1thY3Rpb24uYXV0b21hdGVVcGdyYWRlXS5hY3RpdmU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuXG4gICAgICAgIGZ1bmN0aW9uIGNhbmNlbEFjdGl2ZUFjdGlvbnMoKSB7XG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goc2VsZi5hY3Rpb25EZWZpbml0aW9ucywgZnVuY3Rpb24gKGFjdGlvbikge1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24ucnVubmluZykge1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb24ucGN0Q29tcGxldGUgPSAwO1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb24ucnVubmluZyA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhY3Rpb24uZGVmZXJyZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9IGFjdGlvbi5kZWZlcnJlZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbi5kZWZlcnJlZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoJ2NhbmNlbGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSBnYW1lXG4gICAgICAgICAqIEBwYXJhbSBhY3Rpb25cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGRvQWN0aW9uKGdhbWUsIGFjdGlvbikge1xuICAgICAgICAgICAgaWYgKGdhbWUuaWQgIT09IFwiR2FtZVwiKVxuICAgICAgICAgICAgICAgIHRocm93IFwiSW52YWxpZCBbZ2FtZV0gcGFyYW1ldGVyXCI7XG5cbiAgICAgICAgICAgIGlmICghYWN0aW9uLnJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBhY3Rpb24ucGN0Q29tcGxldGUgPSAwO1xuICAgICAgICAgICAgICAgIGFjdGlvbi5ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBhY3Rpb24uZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgICAgICAgICAgYWN0aW9uLmRlZmVycmVkLnByb21pc2UudGhlbihmdW5jdGlvbiAocmVzb2x2ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uLm9uQ29tcGxldGUoZ2FtZSk7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbi5wY3RDb21wbGV0ZSA9IDA7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gYWN0aW9uXG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufENTU1N0eWxlRGVjbGFyYXRpb24ucnVubmluZ3xkZWZhdWx0cy5ydW5uaW5nfHJ1bm5pbmd9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBpc1J1bm5pbmcoYWN0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gYWN0aW9uLnJ1bm5pbmc7XG4gICAgICAgIH1cblxuXG4gICAgICAgIGZ1bmN0aW9uIHByb2Nlc3NUaWNrKGdhbWUpIHtcbiAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChzZWxmLmFjdGlvbkRlZmluaXRpb25zLCBmdW5jdGlvbiAoYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbi5wY3RDb21wbGV0ZSA8IDEgJiYgaXNSdW5uaW5nKGFjdGlvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uLnBjdENvbXBsZXRlID0gdXRpbHMuY2xhbXAoYWN0aW9uLnBjdENvbXBsZXRlICsgYWN0aW9uLnNwZWVkLCAwLCAxKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aW9uLmRlZmVycmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb24uZGVmZXJyZWQucmVzb2x2ZSh7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb24uZGVmZXJyZWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9nZ2xlU3RhdGUoYWN0aW9uLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGlvbi5hdXRvbWF0ZWQgJiYgIWdhbWUuaXNJbkJhdHRsZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9BY3Rpb24oZ2FtZSwgYWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gYWN0aW9uXG4gICAgICAgICAqIEBwYXJhbSBydW5uaW5nXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiB0b2dnbGVTdGF0ZShhY3Rpb24sIHJ1bm5pbmcpIHtcbiAgICAgICAgICAgIGFjdGlvbi5ydW5uaW5nID0gcnVubmluZztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLnNlcnZpY2UoJ2FjdGlvbnMnLCBBY3Rpb25zKTtcbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yNS8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8qKlxuICAgICAqIEBuZ0luamVjdFxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBiYXR0bGVGYWN0b3J5KCRyb290U2NvcGUsICRzdGF0ZSwgJHEsIGV2ZW50TG9vcCwgc3RhdHVzTWVzc2FnZXMsIEVuZW15LCBwYXJ0eSwgcmVzb3VyY2VzLCB1cGdyYWRlcykge1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBCYXR0bGUobG9jYXRpb25zLCBhcmdzKSB7XG4gICAgICAgICAgICB2YXIgcHJldlN0YXRlID0gJ21haW4uYWN0aW9ucyc7XG5cbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgICAgICAgICBlbmVtaWVzID0gY3JlYXRlRW5lbWllcygpO1xuXG4gICAgICAgICAgICB2YXIgdGljayA9IDAsXG4gICAgICAgICAgICAgICAgZGVmZXJyZWQsXG4gICAgICAgICAgICAgICAgaGFuZGxlcixcbiAgICAgICAgICAgICAgICBjdXJyZW50Q2hhcixcbiAgICAgICAgICAgICAgICBjdXJyZW50VHVybk9yZGVyLFxuICAgICAgICAgICAgICAgIHhwID0gMDtcblxuICAgICAgICAgICAgdGhpcy5iZWdpbiA9IGJlZ2luO1xuICAgICAgICAgICAgdGhpcy5lbmVtaWVzID0gZW5lbWllcztcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZXMgPSBbXTtcblxuICAgICAgICAgICAgaGFuZGxlciA9IGV2ZW50TG9vcC5vblRpY2soJHJvb3RTY29wZSwgdGlja0hhbmRsZXIpO1xuXG4gICAgICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGJlZ2luKCkge1xuICAgICAgICAgICAgICAgIHZhciB4cCA9IHJlc291cmNlcy54cDtcbiAgICAgICAgICAgICAgICBmaWdodCgpLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICB4cC5jdXJyZW50ICs9IHJlc3VsdC54cDtcbiAgICAgICAgICAgICAgICAgICAgeHAgPSBudWxsO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGNyZWF0ZUVuZW1pZXMoKSB7XG4gICAgICAgICAgICAgICAgdmFyIG51bUVuZW1pZXMgPSBNYXRoLmNlaWwoTWF0aC5yYW5kb20oKSAqIDUpO1xuICAgICAgICAgICAgICAgIHZhciBlbmVtaWVzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1FbmVtaWVzOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgZW5lbWllcy5wdXNoKG5ldyBFbmVteShhcmdzLmxldmVsIHx8IDEpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVuZW1pZXM7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgZnVuY3Rpb24gZmlnaHQoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFkZWZlcnJlZCkge1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbWFpbi5iYXR0bGUnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYXR0bGU6IHNlbGYsXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlOiBkZWZlcnJlZFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgZnVuY3Rpb24gb25Db21wbGV0ZShtZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgc3RhdHVzTWVzc2FnZXMubWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICBoYW5kbGVyKCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJzY29wZSBkZXN0cm95ZWRcIik7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKHByZXZTdGF0ZSB8fCAnbWFpbi5hY3Rpb25zJyk7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgZnVuY3Rpb24gcHJvY2Vzc1Jlc3VsdChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHQgfHwge307XG5cbiAgICAgICAgICAgICAgICBzZWxmLm1lc3NhZ2VzLnVuc2hpZnQocmVzdWx0KTtcbiAgICAgICAgICAgICAgICB4cCArPSByZXN1bHQueHAgfHwgMDtcblxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQudmljdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHhwOiB4cFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgb25Db21wbGV0ZShcIllvdSBhcmUgdmljdG9yaW91cyBhbmQgZ2FpbiBcIiArIHhwICsgXCIgeHAuXCIpO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXN1bHQuZGVmZWF0KSB7XG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgeHA6IDBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcGxldGUoXCJZb3UgaGF2ZSBiZWVuIGRlZmVhdGVkLlwiKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LnZpY3RvcnkgfHwgcmVzdWx0LmRlZmVhdDtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICBmdW5jdGlvbiBwcm9jZXNzVHVybih0dXJuKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCxcbiAgICAgICAgICAgICAgICAgICAgYWN0b3IgPSBjdXJyZW50VHVybk9yZGVyW3R1cm5dO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFhY3Rvci5pc0RlYWQoKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYWN0b3IgaW5zdGFuY2VvZiBFbmVteSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gYWN0b3IuYXR0YWNrKHBhcnR5LmNoYXJhY3RlcnMpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gYWN0b3IuYXR0YWNrKGVuZW1pZXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBwcm9jZXNzUmVzdWx0KHJlc3VsdCk7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgZnVuY3Rpb24gdGlja0hhbmRsZXIoYXJncykge1xuICAgICAgICAgICAgICAgIHRpY2srKztcblxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50VHVybk9yZGVyKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRpY2sgJSAzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzVHVybihjdXJyZW50Q2hhcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Q2hhcisrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudENoYXIgPj0gY3VycmVudFR1cm5PcmRlci5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VHVybk9yZGVyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFR1cm5PcmRlciA9IF8uc29ydEJ5KHBhcnR5LmNoYXJhY3RlcnMuY29uY2F0KGVuZW1pZXMpLCAnc3BlZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudENoYXIgPSAwO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmZhY3RvcnkoJ0JhdHRsZScsIGJhdHRsZUZhY3RvcnkpO1xuXG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjIvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBmdW5jdGlvbiBjb25maWcoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0aWNrc1BlclNlY29uZDogNSxcbiAgICAgICAgICAgIGFwaVNlcnZlcjogJ2h0dHA6Ly9sb2NhbGhvc3Q6MTMwOTgvJyxcblxuICAgICAgICAgICAgc2Vjb25kc1RvSGVhbEluVG93bjogM1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmZhY3RvcnkoJ2NvbmZpZycsIGNvbmZpZyk7XG5cbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yNS8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8qKlxuICAgICAqIEBuZ0luamVjdFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGVuZW15RmFjdG9yeSgpIHtcblxuICAgICAgICB2YXIgZW5lbWllcyA9IFtcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdHb2JsaW4nLFxuICAgICAgICAgICAgICAgICAgICBocDogMTAsXG4gICAgICAgICAgICAgICAgICAgIHhwOiAzLFxuICAgICAgICAgICAgICAgICAgICBzcGVlZDogJzUnLCBhdGs6IDMsIGRlZjogMVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnS29ib2xkJyxcbiAgICAgICAgICAgICAgICAgICAgaHA6IDEwLFxuICAgICAgICAgICAgICAgICAgICB4cDogMSxcbiAgICAgICAgICAgICAgICAgICAgc3BlZWQ6ICc3JywgYXRrOiAxLCBkZWY6IDFcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIF07XG5cbiAgICAgICAgZnVuY3Rpb24gRW5lbXkobGV2ZWwpIHtcbiAgICAgICAgICAgIGxldmVsID0gTWF0aC5tYXgoMCwgTWF0aC5taW4obGV2ZWwsIGVuZW1pZXMubGVuZ3RoIC0gMSkpO1xuXG4gICAgICAgICAgICB2YXIgcmFuZG9tID0gXy5zYW1wbGUoZW5lbWllc1tsZXZlbF0pO1xuICAgICAgICAgICAgYW5ndWxhci5leHRlbmQodGhpcywgcmFuZG9tLCB7aHA6IHtjdXJyZW50OiByYW5kb20uaHAsIG1heDogcmFuZG9tLmhwfX0pO1xuICAgICAgICB9XG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogQGRlc2NyaXB0aW9uICAgICBSZXR1cm5zIDEsMiwzIGRlcGVuZGluZyBvbiBob3cgY2xvc2UgdG8gMCB0aGUgZW5lbXkncyBIUCBpc1xuICAgICAgICAgKi9cbiAgICAgICAgRW5lbXkucHJvdG90eXBlLmNvbmRpdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciByYXRpbyA9IHRoaXMuaHAuY3VycmVudCAvIHRoaXMuaHAubWF4O1xuICAgICAgICAgICAgaWYgKHJhdGlvIDw9IDAuMzMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmF0aW8gPD0gMC42Nikge1xuICAgICAgICAgICAgICAgIHJldHVybiAyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH07XG5cblxuICAgICAgICBFbmVteS5wcm90b3R5cGUuZGFtYWdlID0gZnVuY3Rpb24gKGFtb3VudCkge1xuICAgICAgICAgICAgdGhpcy5ocC5jdXJyZW50IC09IGFtb3VudDtcbiAgICAgICAgfTtcblxuXG4gICAgICAgIEVuZW15LnByb3RvdHlwZS5oZWFsID0gZnVuY3Rpb24gKGFtb3VudCkge1xuICAgICAgICAgICAgdGhpcy5ocC5jdXJyZW50ID0gdXRpbHMuY2xhbXAodGhpcy5ocC5jdXJyZW50ICsgYW1vdW50LCAwLCB0aGlzLmhwLm1heCk7XG4gICAgICAgIH07XG5cblxuICAgICAgICBFbmVteS5wcm90b3R5cGUuaXNEZWFkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaHAuY3VycmVudCA8PSAwO1xuICAgICAgICB9O1xuXG5cbiAgICAgICAgRW5lbXkucHJvdG90eXBlLmF0dGFjayA9IGZ1bmN0aW9uIChwYXJ0eSkge1xuICAgICAgICAgICAgLy8gdG9kbzogcHV0IGluIHNvbWUgQUkgaGVyZSB0byBhdHRhY2sgYSBjZXJ0YWluIHBhcnR5IG1lbWJlciBiYXNlZCBvbiBjb25kaXRpb25zXG5cbiAgICAgICAgICAgIHZhciBhdmFpbGFibGUgPSBfLmZpbHRlcihwYXJ0eSwgZnVuY3Rpb24gKHApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gIXAuaXNEZWFkKCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKGF2YWlsYWJsZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnVGhlIHBhcnR5IGlzIGRlYWQhJyxcbiAgICAgICAgICAgICAgICAgICAgZGVmZWF0OiB0cnVlXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHJhbmRvbUNoYXIgPSBfLnNhbXBsZShhdmFpbGFibGUpO1xuXG4gICAgICAgICAgICB2YXIgZG1nID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogdGhpcy5hdGspO1xuICAgICAgICAgICAgdmFyIG1zZztcbiAgICAgICAgICAgIGlmIChkbWcgPiAwKSB7XG4gICAgICAgICAgICAgICAgbXNnID0gdGhpcy5uYW1lICsgXCIgc3RyaWtlcyBcIiArIHJhbmRvbUNoYXIubmFtZSArIFwiIGZvciBcIiArIGRtZyArIFwiIGRhbWFnZSFcIjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbXNnID0gdGhpcy5uYW1lICsgXCIgbWlzc2VkIFwiICsgcmFuZG9tQ2hhci5uYW1lICsgXCIuXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJhbmRvbUNoYXIuZGFtYWdlKGRtZyk7XG4gICAgICAgICAgICBpZiAocmFuZG9tQ2hhci5pc0RlYWQoKSkge1xuICAgICAgICAgICAgICAgIG1zZyArPSBcIiBcIiArIHJhbmRvbUNoYXIubmFtZSArIFwiIGlzIGRlYWQhXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHRhcmdldDogcmFuZG9tQ2hhcixcbiAgICAgICAgICAgICAgICBkYW1hZ2U6IGRtZyxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBtc2dcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIEVuZW15O1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmZhY3RvcnkoJ0VuZW15JywgZW5lbXlGYWN0b3J5KTtcbn0pKCk7XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzIyLzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIFRJQ0sgPSBcImV2ZW50OnRpY2tcIjtcblxuICAgIC8qKlxuICAgICAqIEBuZ0luamVjdFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIEV2ZW50TG9vcCgkcm9vdFNjb3BlLCAkaW50ZXJ2YWwsIGNvbmZpZykge1xuXG4gICAgICAgIHRoaXMub25UaWNrID0gb25UaWNrO1xuXG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICB2YXIgdGltZXIgPSAkaW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGljaygpO1xuICAgICAgICB9LCAxMDAwIC8gY29uZmlnLnRpY2tzUGVyU2Vjb25kKTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkaW50ZXJ2YWwuY2FuY2VsKHRpbWVyKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uVGljayhzY29wZSwgaGFuZGxlcikge1xuICAgICAgICAgICAgcmV0dXJuIHNjb3BlLiRvbihUSUNLLCBmdW5jdGlvbiAoZSwgYXJncykge1xuICAgICAgICAgICAgICAgIGhhbmRsZXIoYXJncyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHRpY2soKSB7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoVElDSywge30pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuc2VydmljZSgnZXZlbnRMb29wJywgRXZlbnRMb29wKTtcblxufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzIyLzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyoqXG4gICAgICogQG5nSW5qZWN0XG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgZnVuY3Rpb24gR2FtZSgkcm9vdFNjb3BlLCAkc3RhdGUsIGV2ZW50TG9vcCwgdXRpbHMsIHBhcnR5LCBhY3Rpb25zLCByZXNvdXJjZXMsIGxvY2F0aW9ucywgdXBncmFkZXMpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgZXZlbnRMb29wLm9uVGljaygkcm9vdFNjb3BlLCBmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgYWN0aW9ucy5wcm9jZXNzVGljayhzZWxmKTtcbiAgICAgICAgICAgIHVwZ3JhZGVzLnByb2Nlc3NUaWNrKHNlbGYpO1xuICAgICAgICAgICAgbG9jYXRpb25zLnByb2Nlc3NUaWNrKHNlbGYpO1xuICAgICAgICB9KTtcblxuXG4gICAgICAgIGxvY2F0aW9ucy5jaGFuZ2VMb2NhdGlvbigndG93bicpKCk7XG4gICAgICAgIGxvY2F0aW9ucy5jdXJyZW50KCkubWFwLmV4cGxvcmVkUGN0ID0gMTsgICAgLy8gbm90aGluZyB0byBleHBsb3JlIGluIHRoZSB0b3duIGZvciBub3dcblxuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICB0aGlzLmlkID0gXCJHYW1lXCI7XG4gICAgICAgIHRoaXMuZXhwbG9yZSA9IGV4cGxvcmU7XG4gICAgICAgIHRoaXMuaXNJbkJhdHRsZSA9IGlzSW5CYXR0bGU7XG4gICAgICAgIHRoaXMubG9jYXRpb24gPSBjdXJyZW50TG9jYXRpb247XG4gICAgICAgIHRoaXMucGFydHkgPSBwYXJ0eS5jaGFyYWN0ZXJzO1xuICAgICAgICB0aGlzLnJlc291cmNlcyA9IGF2YWlsYWJsZVJlc291cmNlcztcbiAgICAgICAgdGhpcy51cGRhdGVSZXNvdXJjZSA9IHVwZGF0ZVJlc291cmNlO1xuICAgICAgICB0aGlzLnVwZ3JhZGVzID0gdXBncmFkZXMudXBncmFkZURlZmluaXRpb25zO1xuXG5cbiAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgZnVuY3Rpb24gYXZhaWxhYmxlUmVzb3VyY2VzKCkge1xuICAgICAgICAgICAgcmV0dXJuIF8uZmlsdGVyKHJlc291cmNlcywgJ3Zpc2libGUnKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgZnVuY3Rpb24gY3VycmVudExvY2F0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2F0aW9ucy5jdXJyZW50KCk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIGZ1bmN0aW9uIGV4cGxvcmUoKSB7XG4gICAgICAgICAgICBsb2NhdGlvbnMuZXhwbG9yZSgpO1xuICAgICAgICB9XG5cblxuICAgICAgICBmdW5jdGlvbiBpc0luQmF0dGxlKCkge1xuICAgICAgICAgICAgcmV0dXJuICRzdGF0ZS5jdXJyZW50Lm5hbWUgPT09ICdtYWluLmJhdHRsZSc7XG4gICAgICAgIH1cblxuXG4gICAgICAgIGZ1bmN0aW9uIHVwZGF0ZVJlc291cmNlKHJlc291cmNlLCBhbW91bnQsIG1heCkge1xuICAgICAgICAgICAgdmFyIHJlcyA9IHJlc291cmNlc1tyZXNvdXJjZV07XG4gICAgICAgICAgICBpZiAoIXJlcykge1xuICAgICAgICAgICAgICAgIHJlcyA9IHtuYW1lOiByZXNvdXJjZSwgY3VycmVudDogMCwgbWF4OiBtYXgsIHZpc2libGU6IHRydWV9O1xuICAgICAgICAgICAgICAgIHJlc291cmNlc1tyZXNvdXJjZV0gPSByZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVzLm1heCkge1xuICAgICAgICAgICAgICAgIHJlcy5jdXJyZW50ID0gdXRpbHMuY2xhbXAocmVzLmN1cnJlbnQgKyBhbW91bnQsIDAsIHJlcy5tYXgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXMuY3VycmVudCArPSBhbW91bnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5zZXJ2aWNlKCdnYW1lJywgR2FtZSk7XG5cbn0pKCk7XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzI2LzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgZnVuY3Rpb24gYmluZEFjdGlvbihhY3Rpb24sIHRvT2JqZWN0KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBhY3Rpb24odG9PYmplY3QpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbmVyYXRlVGlja0Z1bmN0aW9uKGNvbmZpZywgaW50ZXJ2YWxJblNlY29uZHMsIGhhbmRsZXIpIHtcbiAgICAgICAgdmFyIHRpY2sgPSAwO1xuICAgICAgICB2YXIgaW50ZXJ2YWxJblRpY2tzID0gaW50ZXJ2YWxJblNlY29uZHMgKiBjb25maWcudGlja3NQZXJTZWNvbmQ7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZ2FtZSkge1xuICAgICAgICAgICAgdGljaysrO1xuICAgICAgICAgICAgaWYgKHRpY2sgPj0gaW50ZXJ2YWxJblRpY2tzKSB7XG4gICAgICAgICAgICAgICAgdGljayA9IDA7XG4gICAgICAgICAgICAgICAgaGFuZGxlcihnYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIEBuZ0luamVjdFxuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIExvY2F0aW9ucygkc3RhdGUsICRxLCBjb25maWcsIHN0YXR1c01lc3NhZ2VzLCBhY3Rpb25zLCBNYXApIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgICBhY3Rpb25EZWZzID0gYWN0aW9ucy5hY3Rpb25EZWZpbml0aW9ucyxcbiAgICAgICAgICAgIGN1cnJlbnRMb2NhdGlvbjtcblxuICAgICAgICB0aGlzLmNhbkNoYW5nZUxvY2F0aW9uID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5jaGFuZ2VMb2NhdGlvbiA9IGNoYW5nZUxvY2F0aW9uO1xuICAgICAgICB0aGlzLmN1cnJlbnQgPSBnZXRDdXJyZW50TG9jYXRpb247XG4gICAgICAgIHRoaXMuZXhwbG9yZSA9IGV4cGxvcmU7XG4gICAgICAgIHRoaXMubG9jYXRpb25zID0gY3JlYXRlTG9jYXRpb25zKCk7XG4gICAgICAgIHRoaXMucHJvY2Vzc1RpY2sgPSBwcm9jZXNzVGljaztcbiAgICAgICAgdGhpcy50b2dnbGVDYW5DaGFuZ2VMb2NhdGlvbiA9IHRvZ2dsZUNhbkNoYW5nZUxvY2F0aW9uO1xuXG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgIGZ1bmN0aW9uIGNoYW5nZUxvY2F0aW9uKG5ld0xvY2F0aW9uLCBtZXNzYWdlKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmNhbkNoYW5nZUxvY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdMb2MgPSBfLmZpbmRXaGVyZShzZWxmLmxvY2F0aW9ucywge2lkOiBuZXdMb2NhdGlvbn0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAobmV3TG9jICE9PSBjdXJyZW50TG9jYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbnMuY2FuY2VsQWN0aXZlQWN0aW9ucygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudExvY2F0aW9uID0gbmV3TG9jO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudExvY2F0aW9uLmRpc2NvdmVyZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzTWVzc2FnZXMubWVzc2FnZShtZXNzYWdlKTtcblxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzTWVzc2FnZXMubWVzc2FnZShcIllvdSBhcmUgYWxyZWFkeSB0aGVyZS5cIik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1c01lc3NhZ2VzLm1lc3NhZ2UoXCJDYW5ub3QgdHJhdmVsIGF0IHRoaXMgdGltZVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlTG9jYXRpb25zKCkge1xuICAgICAgICAgICAgcmV0dXJuIFtcblxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6ICd0b3duJyxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ1Rvd24nLFxuICAgICAgICAgICAgICAgICAgICBtYXA6IG5ldyBNYXAoe2xldmVsOiAxLCBmbG9vckNvdW50OiAxLCByb29tQ291bnQ6IDF9KSxcbiAgICAgICAgICAgICAgICAgICAgZGlzY292ZXJlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgb25UaWNrOiBnZW5lcmF0ZVRpY2tGdW5jdGlvbihjb25maWcsIGNvbmZpZy5zZWNvbmRzVG9IZWFsSW5Ub3duLCBmdW5jdGlvbiAoZ2FtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBhcnR5ID0gZ2FtZS5wYXJ0eTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBoZWFsQW1vdW50ID0gMTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJ0eS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnR5W2ldLmhlYWwoaGVhbEFtb3VudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0lubicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGdvIHRvIHRoZSBpbm5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzTWVzc2FnZXMubWVzc2FnZShcIkNhbid0IGdvIHRvIHRoZSBpbm4geWV0Li4uXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ1N1cHBsaWVzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ28gdG8gdGhlIHN0b3JlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnTGVhdmUgdG93bicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBjaGFuZ2VMb2NhdGlvbignZm9yZXN0JywgJ1lvdSBsZWF2ZSB0b3duIGFuZCBlbnRlciB0aGUgZm9yZXN0LicpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICB9LFxuXG5cbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiAnZm9yZXN0JyxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ0ZvcmVzdCcsXG4gICAgICAgICAgICAgICAgICAgIG1hcDogbmV3IE1hcCh7bGV2ZWw6IDEsIGZsb29yQ291bnQ6IDEsIHJvb21Db3VudDogNjAwICsgKE1hdGgucmFuZG9tKCkgKiAxMDApfSksXG4gICAgICAgICAgICAgICAgICAgIGRpc2NvdmVyZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB0cmVhc3VyZTogW1xuICAgICAgICAgICAgICAgICAgICAgICAge25hbWU6ICdnb2xkJywgcGN0OiAxfVxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICBoZXJiczogW1xuICAgICAgICAgICAgICAgICAgICAgICAge25hbWU6ICdNdXNocm9vbXMnLCBwY3Q6IDF9XG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnUmV0dXJuIHRvIHRvd24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogY2hhbmdlTG9jYXRpb24oJ3Rvd24nLCAnWW91IHJldHVybiB0byB0aGUgdG93bi4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbkRlZnMuZXhwbG9yZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbkRlZnMuZ2F0aGVySGVyYnMsXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0VudGVyIGR1bmdlb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpZGRlbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBsb3JlUGN0OiAwLjQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ1lvdSBkaXNjb3ZlcmVkIHRoZSBzdGFydGluZyBkdW5nZW9uIScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBjaGFuZ2VMb2NhdGlvbignc3RhcnRpbmdEdW5nZW9uJywgJ1lvdSBlbnRlciB0aGUgZHVuZ2Vvbi4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgfSxcblxuXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZDogJ3N0YXJ0aW5nRHVuZ2VvbicsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdTdGFydGluZyBEdW5nZW9uJyxcbiAgICAgICAgICAgICAgICAgICAgbWFwOiBuZXcgTWFwKHtsZXZlbDogMSwgZmxvb3JDb3VudDogMTAsIHJvb21Db3VudDogMTAwfSksXG4gICAgICAgICAgICAgICAgICAgIGRpc2NvdmVyZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB0cmVhc3VyZTogW1xuICAgICAgICAgICAgICAgICAgICAgICAge25hbWU6ICdnb2xkJywgcGN0OiAxfVxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0V4aXQgdGhlIGR1bmdlb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogY2hhbmdlTG9jYXRpb24oJ2ZvcmVzdCcsICdZb3UgY2xpbWIgYmFjayBvdXQgdG8gdGhlIGZvcmVzdC4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgZnVuY3Rpb24gZXhwbG9yZSgpIHtcbiAgICAgICAgICAgIHZhciBtYXAgPSBjdXJyZW50TG9jYXRpb24ubWFwO1xuICAgICAgICAgICAgaWYgKG1hcCkgbWFwLmV4cGxvcmUoc2VsZik7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXRDdXJyZW50TG9jYXRpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudExvY2F0aW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcHJvY2Vzc1RpY2soZ2FtZSkge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRMb2NhdGlvbi5vblRpY2spIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50TG9jYXRpb24ub25UaWNrKGdhbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gdG9nZ2xlQ2FuQ2hhbmdlTG9jYXRpb24oY2FuQ2hhbmdlKSB7XG4gICAgICAgICAgICBzZWxmLmNhbkNoYW5nZUxvY2F0aW9uID0gY2FuQ2hhbmdlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuc2VydmljZSgnbG9jYXRpb25zJywgTG9jYXRpb25zKTtcbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yNy8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8qKlxuICAgICAqIEBuZ0luamVjdFxuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIFBhcnR5KENoYXJhY3Rlcikge1xuXG4gICAgICAgIHZhciBjaGFyYWN0ZXJzID0gW1xuICAgICAgICAgICAgQ2hhcmFjdGVyLmNyZWF0ZSh7bmFtZTogJ1NpciBKZWV2ZXMnLCBjbGFzczogJ2tuaWdodCd9KSxcbiAgICAgICAgICAgIENoYXJhY3Rlci5jcmVhdGUoe25hbWU6ICdUaG9yZ3JpbW0gQXhlYmVhcmQnLCBjbGFzczogJ2JlcnNlcmtlcid9KSxcbiAgICAgICAgICAgIENoYXJhY3Rlci5jcmVhdGUoe25hbWU6ICdKaW1teSBSYXRmaW5nZXJzJywgY2xhc3M6ICd0aGllZid9KSxcbiAgICAgICAgICAgIENoYXJhY3Rlci5jcmVhdGUoe25hbWU6ICdCb3JpcyBPbmUtc2hvdCcsIGNsYXNzOiAnYXJjaGVyJ30pLFxuICAgICAgICAgICAgQ2hhcmFjdGVyLmNyZWF0ZSh7bmFtZTogJ0x5c2FubmEgRGF3bmJyaW5nZXInLCBjbGFzczogJ3NvcmNlcmVyJ30pLFxuICAgICAgICAgICAgQ2hhcmFjdGVyLmNyZWF0ZSh7bmFtZTogJ0xvdGhhciBHcmVlbmJyb29rJywgY2xhc3M6ICdoZWFsZXInfSlcbiAgICAgICAgXTtcblxuICAgICAgICB0aGlzLmNoYXJhY3RlcnMgPSBjaGFyYWN0ZXJzO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZiBhbGwgcGFydHkgbWVtYmVycyBhcmUgZGVhZFxuICAgICAqL1xuICAgIFBhcnR5LnByb3RvdHlwZS5pc0RlYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBfLmFsbCh0aGlzLmNoYXJhY3RlcnMsIGZ1bmN0aW9uIChjKSB7XG4gICAgICAgICAgICByZXR1cm4gYy5pc0RlYWQoKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLnNlcnZpY2UoJ3BhcnR5JywgUGFydHkpO1xuXG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjUvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBmdW5jdGlvbiByZXNvdXJjZXMoKSB7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHhwOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ1hQJyxcbiAgICAgICAgICAgICAgICB2aXNpYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGN1cnJlbnQ6IDBcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGZvb2Q6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnRm9vZCcsXG4gICAgICAgICAgICAgICAgdmlzaWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjdXJyZW50OiAwLFxuICAgICAgICAgICAgICAgIG1heDogMTAwMFxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZ29sZDoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdHb2xkJyxcbiAgICAgICAgICAgICAgICB2aXNpYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGN1cnJlbnQ6IDBcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGlyb246IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnSXJvbicsXG4gICAgICAgICAgICAgICAgY3VycmVudDogMCxcbiAgICAgICAgICAgICAgICBtYXg6IDEwMFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmZhY3RvcnkoJ3Jlc291cmNlcycsIHJlc291cmNlcyk7XG5cbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yNi8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBTVEFUVVNfTUVTU0FHRSA9IFwiZ2FtZTpzdGF0dXNNZXNzYWdlXCI7XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBTdGF0dXNNZXNzYWdlcygkcm9vdFNjb3BlKSB7XG5cbiAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgdGhpcy5vbk1lc3NhZ2UgPSBvbk1lc3NhZ2U7XG5cbiAgICAgICAgZnVuY3Rpb24gbWVzc2FnZShzdGF0dXMpIHtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChTVEFUVVNfTUVTU0FHRSwge21lc3NhZ2U6IHN0YXR1c30pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gb25NZXNzYWdlKHNjb3BlLCBoYW5kbGVyKSB7XG4gICAgICAgICAgICBzY29wZS4kb24oU1RBVFVTX01FU1NBR0UsIGZ1bmN0aW9uIChlLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlcihhcmdzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuc2VydmljZSgnc3RhdHVzTWVzc2FnZXMnLCBTdGF0dXNNZXNzYWdlcyk7XG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjQvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBVcGdyYWRlcyhyZXNvdXJjZXMsIGFjdGlvbnMpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5idXlVcGdyYWRlID0gYnV5VXBncmFkZTtcbiAgICAgICAgdGhpcy5jYW5CdXkgPSBjYW5CdXk7XG4gICAgICAgIHRoaXMucHJvY2Vzc1RpY2sgPSBwcm9jZXNzVGljaztcbiAgICAgICAgdGhpcy51cGdyYWRlRGVmaW5pdGlvbnMgPSB7XG5cbiAgICAgICAgICAgIGZhc3RFeHBsb3JlOiB7XG4gICAgICAgICAgICAgICAgdGV4dDogJ1BlcmNlcHRpb24nLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQWxsb3dzIHlvdSB0byBleHBsb3JlIGZhc3RlciAoMS4yeCBzcGVlZCknLFxuICAgICAgICAgICAgICAgIGFjdGl2ZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgYXZhaWxhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIHJlcXVpcmVzOiB7XG4gICAgICAgICAgICAgICAgICAgIHhwOiAyMFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cblxuICAgICAgICAgICAgYXV0b01hcDoge1xuICAgICAgICAgICAgICAgIHRleHQ6ICdDYXJ0b2dyYXBoZXInLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUHJldmVudHMgeW91IGZyb20gZ2V0dGluZyBsb3N0LicsXG4gICAgICAgICAgICAgICAgYWN0aXZlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBhdmFpbGFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgcmVxdWlyZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgeHA6IDc1XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuXG4gICAgICAgICAgICBhdXRvR2F0aGVyOiB7XG4gICAgICAgICAgICAgICAgdGV4dDogJ0F1dG8tZ2F0aGVyJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0F1dG9tYXRpY2FsbHkgZ2F0aGVycyBoZXJicyB3aGVuIHlvdSBhcmUgaW4gYW4gYXJlYSB0aGF0IGhhcyB0aGVtLicsXG4gICAgICAgICAgICAgICAgYWN0aXZlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBjaGVja0F2YWlsYWJsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb3VyY2VzLmhlcmJzICYmIHJlc291cmNlcy5oZXJicy5jdXJyZW50ID4gMTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJlcXVpcmVzOiB7XG4gICAgICAgICAgICAgICAgICAgIGhlcmJzOiAxMFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cblxuICAgICAgICAgICAgYXV0b0V4cGxvcmU6IHtcbiAgICAgICAgICAgICAgICB0ZXh0OiAnQXV0by1leHBsb3JlJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0F1dG9tYXRpY2FsbHkgZXhwbG9yZXMgYW4gYXJlYSwgc3RvcHBpbmcgd2hlbiBoaXQgcG9pbnRzIGdldCBsb3cuJyxcbiAgICAgICAgICAgICAgICBhY3RpdmU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGNoZWNrQXZhaWxhYmxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcmVxdWlyZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgeHA6IDIuMDBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgZnVuY3Rpb24gcHJvY2Vzc1RpY2soZ2FtZSkge1xuICAgICAgICAgICAgLy8gZG8gc3R1ZmYgdGhhdCBzaG91bGQgaGFwcGVuIGV2ZXJ5IHRpY2ssIGRlcGVuZGluZyBvbiB0aGUgdXBncmFkZXNcblxuICAgICAgICAgICAgY2hlY2tGb3JBdmFpbGFibGUoKTtcblxuICAgICAgICAgICAgaWYgKCFnYW1lLmlzSW5CYXR0bGUoKSkge1xuICAgICAgICAgICAgICAgIC8vIG9ubHkgZG8gdGhpcyBzdHVmZiBpZiB3ZSdyZSBub3QgZmlnaHRpbmcgYW55Ym9keVxuICAgICAgICAgICAgICAgIC8vZG9BdXRvRXhwbG9yZShnYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGRvQXV0b0V4cGxvcmUoZ2FtZSkge1xuICAgICAgICAgICAgaWYgKHNlbGYudXBncmFkZURlZmluaXRpb25zLmF1dG9FeHBsb3JlLmFjdGl2ZSAmJiAhZ2FtZS5pc0luQmF0dGxlKCkpIHtcbiAgICAgICAgICAgICAgICB2YXIgYWN0aW9uID0gYWN0aW9ucy5hY3Rpb25EZWZpbml0aW9ucy5leHBsb3JlO1xuICAgICAgICAgICAgICAgIGFjdGlvbnMuZG9BY3Rpb24oZ2FtZSwgYWN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNhbkJ1eSh1cGdyYWRlKSB7XG4gICAgICAgICAgICBpZiAodXBncmFkZS5yZXF1aXJlcykge1xuICAgICAgICAgICAgICAgIHZhciBjYW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIHJlc291cmNlIGluIHVwZ3JhZGUucmVxdWlyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHVwZ3JhZGUucmVxdWlyZXMuaGFzT3duUHJvcGVydHkocmVzb3VyY2UpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc291cmNlc1tyZXNvdXJjZV0gfHwgcmVzb3VyY2VzW3Jlc291cmNlXS5jdXJyZW50IDwgdXBncmFkZS5yZXF1aXJlc1tyZXNvdXJjZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY2FuO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNoZWNrRm9yQXZhaWxhYmxlKCkge1xuICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKHNlbGYudXBncmFkZURlZmluaXRpb25zLCBmdW5jdGlvbiAodXBncmFkZSkge1xuICAgICAgICAgICAgICAgIGlmICghdXBncmFkZS5hY3RpdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHVwZ3JhZGUuY2hlY2tBdmFpbGFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1cGdyYWRlLmNoZWNrQXZhaWxhYmxlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvbmNlIGl0J3MgYXZhaWxhYmxlLCBpdCBhbHdheXMgaXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGdyYWRlLmNoZWNrQXZhaWxhYmxlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGdyYWRlLmF2YWlsYWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHVwZ3JhZGUuYXZhaWxhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiB3ZSBjYW4gcHVyY2hhc2UgaXRcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwZ3JhZGUuY2FuUHVyY2hhc2UgPSBjYW5CdXkodXBncmFkZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGJ1eVVwZ3JhZGUodXBncmFkZSkge1xuICAgICAgICAgICAgaWYgKGNhbkJ1eSh1cGdyYWRlKSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIHJlc291cmNlIGluIHVwZ3JhZGUucmVxdWlyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHVwZ3JhZGUucmVxdWlyZXMuaGFzT3duUHJvcGVydHkocmVzb3VyY2UpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZXNbcmVzb3VyY2VdLmN1cnJlbnQgLT0gdXBncmFkZS5yZXF1aXJlc1tyZXNvdXJjZV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdXBncmFkZS5hY3RpdmUgPSB0cnVlOyAgLy90b2RvOiBuZWVkIHRvIGFjY291bnQgZm9yIHVwZ3JhZGVzIHdpdGggbXVsdGlwbGUgbGV2ZWxzXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuc2VydmljZSgndXBncmFkZXMnLCBVcGdyYWRlcyk7XG5cbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMi8xNy8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBVUCA9IDE7XG4gICAgdmFyIERPV04gPSAyO1xuICAgIHZhciBMRUZUID0gNDtcbiAgICB2YXIgUklHSFQgPSA4O1xuXG4gICAgdmFyIG1hcCA9IFtcbiAgICAgICAgWzAsIDEsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdLFxuICAgICAgICBbMCwgMSwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF0sXG4gICAgICAgIFswLCAxLCAxLCAxLCAxLCAxLCAwLCAwLCAwLCAwXSxcbiAgICAgICAgWzAsIDAsIDEsIDAsIDAsIDEsIDAsIDAsIDAsIDBdLFxuICAgICAgICBbMCwgMCwgMSwgMCwgMCwgMSwgMSwgMSwgMSwgMF0sXG4gICAgICAgIFsxLCAxLCAxLCAxLCAxLCAxLCAwLCAwLCAxLCAwXSxcbiAgICAgICAgWzEsIDAsIDAsIDAsIDAsIDAsIDEsIDEsIDEsIDFdLFxuICAgICAgICBbMCwgMCwgMCwgMCwgMSwgMSwgMSwgMCwgMCwgMF0sXG4gICAgICAgIFswLCAwLCAxLCAxLCAxLCAwLCAwLCAwLCAwLCAwXSxcbiAgICAgICAgWzAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDBdXG4gICAgXTtcblxuXG4gICAgLyoqXG4gICAgICogQG5nSW5qZWN0XG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgZnVuY3Rpb24gTWFwQXRsYXMoKSB7XG5cbiAgICAgICAgdGhpcy5tYXBzID0gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdTdGFydGluZyBtYXAnLFxuICAgICAgICAgICAgICAgIHJvb21zOiBtYXBcbiAgICAgICAgICAgIH1cbiAgICAgICAgXTtcbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5zZXJ2aWNlKCdtYXBBdGxhcycsIE1hcEF0bGFzKTtcblxufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAyLzE3LzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIFdJRFRIID0gNDAwO1xuICAgIHZhciBIRUlHSFQgPSA0MDA7XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBNYXBEaXNwbGF5KCkge1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuXG4gICAgICAgICAgICByZXBsYWNlOiAndHJ1ZScsXG5cbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgaWQ6ICdAPycsXG4gICAgICAgICAgICAgICAgbWFwOiAnPScsXG4gICAgICAgICAgICAgICAgcG9zaXRpb246ICc9J1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgdGVtcGxhdGU6ICc8Y2FudmFzIGlkPVwiY1wiIHdpZHRoPVwiJyArIFdJRFRIICsgJ1wiIGhlaWdodD1cIicgKyBIRUlHSFQgKyAnXCI+PC9jYW52YXM+JyxcblxuICAgICAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSkge1xuICAgICAgICAgICAgICAgICRzY29wZS5pZCA9ICRzY29wZS5pZCB8fCAnbWFwQ2FudmFzJztcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbSwgYXR0cikge1xuXG4gICAgICAgICAgICAgICAgdmFyIHlNYXggPSBzY29wZS5tYXAubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHZhciB4TWF4ID0gc2NvcGUubWFwWzBdLmxlbmd0aDtcblxuICAgICAgICAgICAgICAgIHZhciBibG9ja1ggPSBXSURUSCAvIHhNYXg7XG4gICAgICAgICAgICAgICAgdmFyIGJsb2NrWSA9IEhFSUdIVCAvIHlNYXg7XG5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIng9XCIgKyB4TWF4ICsgXCIsXCIgKyBcInk9XCIgKyB5TWF4KTtcblxuICAgICAgICAgICAgICAgIHZhciBjYW52YXMgPSBlbGVtWzBdO1xuICAgICAgICAgICAgICAgIGlmIChjYW52YXMuZ2V0Q29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcblxuICAgICAgICAgICAgICAgICAgICAvL2N0eC5maWxsU3R5bGUgPSBcInJnYigyMDAsMCwwKVwiO1xuICAgICAgICAgICAgICAgICAgICAvL2N0eC5maWxsU3R5bGUgPSBcInJnYmEoMCwgMCwgMjAwLCAwLjUpXCI7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGJvcmRlciA9IDY7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb3JyV2lkdGggPSAxMjtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciB5ID0gMDsgeSA8IHlNYXg7IHkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgeCA9IDA7IHggPCB4TWF4OyB4KyspIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB4YyA9IHggKiBibG9ja1g7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHljID0geSAqIGJsb2NrWTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBzY29wZS5tYXBbeV1beF0gPT09IDEgPyAncmdiKDIwMCwwLDApJyA6ICdyZ2IoMCwyMDAsMCknO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0KHhjICsgYm9yZGVyLCB5YyArIGJvcmRlciwgYmxvY2tYIC0gKGJvcmRlciAqIDIpLCBibG9ja1kgLSAoYm9yZGVyICogMikpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9ICdyZ2IoMTAwLDEwMCwxMDApJztcblxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0KHhjICsgKGJsb2NrWCAvIDIpIC0gKGNvcnJXaWR0aCAvIDIpLCB5YywgY29ycldpZHRoLCBib3JkZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCh4YywgeWMgKyAoYmxvY2tZIC8gMikgLSAoY29ycldpZHRoIC8gMiksIGJvcmRlciwgY29ycldpZHRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QoeGMgKyAoYmxvY2tYIC8gMikgLSAoY29ycldpZHRoIC8gMiksIHljICsgYmxvY2tZIC0gYm9yZGVyLCBjb3JyV2lkdGgsIGJvcmRlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0KHhjICsgYmxvY2tYIC0gYm9yZGVyLCB5YyArIChibG9ja1kgLyAyKSAtIChjb3JyV2lkdGggLyAyKSwgYm9yZGVyLCBjb3JyV2lkdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuZGlyZWN0aXZlKCdtYXBEaXNwbGF5JywgTWFwRGlzcGxheSk7XG5cbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8zMS8xNS5cbiAqL1xuKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG5cblxufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzIyLzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyoqXG4gICAgICogQG5nSW5qZWN0XG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgZnVuY3Rpb24gY2hhcmFjdGVyRmFjdG9yeShjb25maWcsIHV0aWxzLCAkcmVzb3VyY2UpIHtcbiAgICAgICAgdmFyIHVybCA9IGNvbmZpZy5hcGlTZXJ2ZXIgKyAnY2hhcmFjdGVyLzppZCc7XG4gICAgICAgIHZhciBDaGFyYWN0ZXIgPSAkcmVzb3VyY2UodXJsLCB7aWQ6ICdAaWQnfSk7XG4gICAgICAgIHZhciBpZCA9IDE7XG5cbiAgICAgICAgYW5ndWxhci5leHRlbmQoQ2hhcmFjdGVyLCB7XG5cbiAgICAgICAgICAgIGNyZWF0ZTogZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcbiAgICAgICAgICAgICAgICB2YXIgY2hhciA9IG5ldyBDaGFyYWN0ZXIoe2lkOiBhcmdzLmlkIHx8IGlkKyt9KTtcblxuICAgICAgICAgICAgICAgIGNoYXIubmFtZSA9IGFyZ3MubmFtZSB8fCAnY2hhcmFjdGVyJztcbiAgICAgICAgICAgICAgICBjaGFyLmNsYXNzID0gYXJncy5jbGFzcztcbiAgICAgICAgICAgICAgICBjaGFyLmxldmVsID0gMTtcbiAgICAgICAgICAgICAgICBjaGFyLmhwID0ge2N1cnJlbnQ6IDEwLCBtYXg6IDEwfTtcbiAgICAgICAgICAgICAgICBjaGFyLm1wID0ge2N1cnJlbnQ6IDEwLCBtYXg6IDEwfTtcbiAgICAgICAgICAgICAgICBjaGFyLmF0ayA9IDEwO1xuICAgICAgICAgICAgICAgIGNoYXIuZGVmID0gMTA7XG4gICAgICAgICAgICAgICAgY2hhci5tYWdpYyA9IDEwO1xuICAgICAgICAgICAgICAgIGNoYXIuc3BlZWQgPSAxMDtcbiAgICAgICAgICAgICAgICBjaGFyLmFjID0gMTA7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gY2hhcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgQ2hhcmFjdGVyLnByb3RvdHlwZS5kYW1hZ2UgPSBmdW5jdGlvbiAoYW1vdW50KSB7XG4gICAgICAgICAgICB0aGlzLmhwLmN1cnJlbnQgLT0gYW1vdW50O1xuICAgICAgICB9O1xuXG4gICAgICAgIENoYXJhY3Rlci5wcm90b3R5cGUuaGVhbCA9IGZ1bmN0aW9uIChhbW91bnQpIHtcbiAgICAgICAgICAgIHRoaXMuaHAuY3VycmVudCA9IHV0aWxzLmNsYW1wKHRoaXMuaHAuY3VycmVudCArIGFtb3VudCwgMCwgdGhpcy5ocC5tYXgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIENoYXJhY3Rlci5wcm90b3R5cGUuaXNEZWFkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaHAuY3VycmVudCA8PSAwO1xuICAgICAgICB9O1xuXG4gICAgICAgIENoYXJhY3Rlci5wcm90b3R5cGUuYXR0YWNrID0gZnVuY3Rpb24gKGVuZW1pZXMpIHtcbiAgICAgICAgICAgIGlmICghZW5lbWllcyB8fCBlbmVtaWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IFwiQWxsIGVuZW1pZXMgaGF2ZSBiZWVuIGRlZmVhdGVkLlwiLFxuICAgICAgICAgICAgICAgICAgICB2aWN0b3J5OiB0cnVlXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaW1wbGVtZW50IHNvbWUga2luZCBvZiB3YXkgdG8gY2hvb3NlIHdoaWNoIGVuZW15IHRvIGZpZ2h0LCBvciBhbGxvdyBjaG9vc2luZyBzb21lIGtpbmQgb2YgQUlcbiAgICAgICAgICAgIC8vdmFyIHJhbmRvbUVuZW15ID0gXy5zYW1wbGUoZW5lbWllcyk7XG4gICAgICAgICAgICB2YXIgcmFuZG9tRW5lbXkgPSB1dGlscy5yYW5kb21FbGVtZW50KGVuZW1pZXMsICdjb25kaXRpb24nLCB0cnVlKTtcblxuICAgICAgICAgICAgdmFyIGRtZyA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHRoaXMuYXRrKTtcbiAgICAgICAgICAgIHZhciBtc2c7XG4gICAgICAgICAgICBpZiAoZG1nID4gMCkge1xuICAgICAgICAgICAgICAgIG1zZyA9IHRoaXMubmFtZSArIFwiIHN0cmlrZXMgXCIgKyByYW5kb21FbmVteS5uYW1lICsgXCIgZm9yIFwiICsgZG1nICsgXCIgZGFtYWdlIVwiO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtc2cgPSB0aGlzLm5hbWUgKyBcIiBtaXNzZWQgXCIgKyByYW5kb21FbmVteS5uYW1lICsgXCIuXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgeHAgPSAwO1xuXG4gICAgICAgICAgICByYW5kb21FbmVteS5kYW1hZ2UoZG1nKTtcbiAgICAgICAgICAgIGlmIChyYW5kb21FbmVteS5pc0RlYWQoKSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZW5lbWllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZW5lbWllc1tpXSA9PT0gcmFuZG9tRW5lbXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZW1pZXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG1zZyArPSBcIiBcIiArIHJhbmRvbUVuZW15Lm5hbWUgKyBcIiBpcyBkZWFkIVwiO1xuICAgICAgICAgICAgICAgIHhwID0gcmFuZG9tRW5lbXkueHA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHRhcmdldDogcmFuZG9tRW5lbXksXG4gICAgICAgICAgICAgICAgZGFtYWdlOiBkbWcsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogbXNnLFxuICAgICAgICAgICAgICAgIHhwOiB4cFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gQ2hhcmFjdGVyO1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmZhY3RvcnkoJ0NoYXJhY3RlcicsIGNoYXJhY3RlckZhY3RvcnkpO1xufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzI3LzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyoqXG4gICAgICogQG5nSW5qZWN0XG4gICAgICovXG4gICAgZnVuY3Rpb24gYWN0aW9uQnV0dG9uRGlyZWN0aXZlKGV2ZW50TG9vcCwgY29uZmlnLCBhY3Rpb25zLCB1cGdyYWRlcywgZ2FtZSkge1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0FFJyxcblxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBhY3Rpb246ICc9J1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgdGVtcGxhdGU6IFwiPGRpdiBjbGFzcz0nYWN0aW9uLWJhcicgbmctY2xpY2s9J2RvQWN0aW9uKCknPlwiICtcbiAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0ndGltZXItYmFyLXByb2dyZXNzJyBuZy1jbGFzcz0nZ2V0Q3NzQ2xhc3NlcygpJzwvZGl2PjwvZGl2PlwiLFxuXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW0sIGF0dHIpIHtcblxuICAgICAgICAgICAgICAgIGlmICghc2NvcGUuYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IFwiTm8gYWN0aW9uIGlzIGJvdW5kIHRvIHRoaXMgYWN0aW9uQnV0dG9uIVwiO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBwcm9ncmVzc0JhciA9IGFuZ3VsYXIuZWxlbWVudChlbGVtLmNoaWxkcmVuKClbMF0pLmNoaWxkcmVuKCk7ICAgLy8gdGltZXItYmFyLXByb2dyZXNzXG4gICAgICAgICAgICAgICAgdmFyIGJhciA9IGFuZ3VsYXIuZWxlbWVudChlbGVtLmNoaWxkcmVuKClbMF0pLmFwcGVuZChwcm9ncmVzc0Jhcik7XG4gICAgICAgICAgICAgICAgdmFyIHRleHQgPSBhbmd1bGFyLmVsZW1lbnQoZWxlbS5jaGlsZHJlbigpWzBdKS5hcHBlbmQoXCI8c3BhbiBjbGFzcz0nYWN0aW9uLWJhci10ZXh0Jz5cIiArIHNjb3BlLmFjdGlvbi50ZXh0ICsgXCI8L3NwYW4+XCIpO1xuICAgICAgICAgICAgICAgIHZhciBwcm9ncmVzcyA9IGFuZ3VsYXIuZWxlbWVudChiYXIuY2hpbGRyZW4oKVswXSk7XG5cblxuICAgICAgICAgICAgICAgIHNjb3BlLmRvQWN0aW9uID0gZG9BY3Rpb247XG4gICAgICAgICAgICAgICAgc2NvcGUuZ2V0QXV0b21hdGVkQ3NzQ2xhc3MgPSBnZXRBdXRvbWF0ZWRDc3NDbGFzcztcbiAgICAgICAgICAgICAgICBzY29wZS5nZXRDc3NDbGFzc2VzID0gZ2V0Q3NzQ2xhc3NlcztcbiAgICAgICAgICAgICAgICBzY29wZS5pc0FjdGlvbkF1dG9tYXRlZCA9IGlzQWN0aW9uQXV0b21hdGVkO1xuICAgICAgICAgICAgICAgIHNjb3BlLnBlcmNlbnRhZ2UgPSBzY29wZS5hY3Rpb24ucGN0Q29tcGxldGUgfHwgMDtcbiAgICAgICAgICAgICAgICBzY29wZS53YWl0aW5nID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgICAgICAgICBpZiAoc2NvcGUuYWN0aW9uLnBjdENvbXBsZXRlID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBwcm9ncmVzcy5hZGRDbGFzcygndGltZXItYmFyLXJ1bm5pbmcnKTtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUud2FpdGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHByb2dyZXNzLmNzcygnd2lkdGgnLCAoc2NvcGUucGVyY2VudGFnZSAqIDEwMCkgKyAnJScpO1xuICAgICAgICAgICAgICAgIGV2ZW50TG9vcC5vblRpY2soc2NvcGUsIG9uVGljayk7XG5cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJ1bnMgZG9BY3Rpb24oKSBvbiB0aGUgYWN0aW9uIGJvdW5kIHRvIHRoZSBidXR0b25cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBkb0FjdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzY29wZS53YWl0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NvcGUub25DbGljaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLm9uQ2xpY2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLnBlcmNlbnRhZ2UgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUud2FpdGluZyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhY3Rpb24gPSBzY29wZS5hY3Rpb247XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aW9ucy5jYW5BdXRvbWF0ZShhY3Rpb24sIHVwZ3JhZGVzLnVwZ3JhZGVEZWZpbml0aW9ucykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb24uYXV0b21hdGVkID0gIWFjdGlvbi5hdXRvbWF0ZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbnMuZG9BY3Rpb24oZ2FtZSwgYWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogVXNlZCB0byBhcHBseSBjbGFzc2VzIHRvIHRoZSB0aW1lciBiYXIgdmlhIG5nLWNsYXNzXG4gICAgICAgICAgICAgICAgICogQHJldHVybnMge3t0aW1lci1iYXItcnVubmluZzogKG5hbWUgb2Ygc3R5bGUpfX1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBnZXRDc3NDbGFzc2VzKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ3RpbWVyLWJhci1ydW5uaW5nJzogaXNBY3Rpb25SdW5uaW5nKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAndGltZXItYmFyLWNvbXBsZXRlJzogaXNBY3Rpb25Db21wbGV0ZWQoKVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGdldEF1dG9tYXRlZENzc0NsYXNzKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2F1dG9tYXRlZCc6IGlzQWN0aW9uQXV0b21hdGVkKClcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgYWN0aW9uIGlzIGN1cnJlbnRseSBydW5uaW5nXG4gICAgICAgICAgICAgICAgICogQHJldHVybnMge2RlZmF1bHRzLnJ1bm5pbmd8KnxDU1NTdHlsZURlY2xhcmF0aW9uLnJ1bm5pbmd8cnVubmluZ31cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBpc0FjdGlvblJ1bm5pbmcoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vcmV0dXJuIHNjb3BlLnBlcmNlbnRhZ2UgPj0gMCAmJiBzY29wZS5wZXJjZW50YWdlIDwgMSAmJiBzY29wZS53YWl0aW5nO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2NvcGUuYWN0aW9uLnJ1bm5pbmcgJiYgc2NvcGUuYWN0aW9uLnBjdENvbXBsZXRlID4gMDtcbiAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGlzQWN0aW9uQ29tcGxldGVkKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2NvcGUucGVyY2VudGFnZSA+PSAxICYmICFzY29wZS53YWl0aW5nICYmIHNjb3BlLmFjdGlvbi5wY3RDb21wbGV0ZSA9PT0gMDtcbiAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGlzQWN0aW9uQXV0b21hdGVkKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2NvcGUuYWN0aW9uLmF1dG9tYXRlZDtcbiAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFRpY2sgaGFuZGxlciBmb3IgdGhlIGV2ZW50IGxvb3BcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gYXJnc1xuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIG9uVGljayhhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhY3Rpb24gPSBzY29wZS5hY3Rpb247XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3BlLnBlcmNlbnRhZ2UgPT09IDEgJiYgYWN0aW9uLnBjdENvbXBsZXRlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS53YWl0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2NvcGUucGVyY2VudGFnZSA9IGFjdGlvbi5wY3RDb21wbGV0ZTtcbiAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3MuY3NzKCd3aWR0aCcsIChzY29wZS5wZXJjZW50YWdlICogMTAwKSArICclJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmRpcmVjdGl2ZSgnYWN0aW9uQnV0dG9uJywgYWN0aW9uQnV0dG9uRGlyZWN0aXZlKTtcbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yMy8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuXG4gICAgLyoqXG4gICAgICogQG5nSW5qZWN0XG4gICAgICovXG4gICAgZnVuY3Rpb24gdGltZXJCYXJEaXJlY3RpdmUoZXZlbnRMb29wLCBjb25maWcpIHtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBRScsXG5cbiAgICAgICAgICAgIHJlcGxhY2U6IHRydWUsXG5cbiAgICAgICAgICAgIHRlbXBsYXRlOiAnPGRpdiBjbGFzcz1cInRpbWVyLWJhci1idXR0b25cIj48YSBjbGFzcz1cInRpbWVyLWJhci10ZXh0XCIgbmctY2xpY2s9XCJjb3VudGRvd24oKVwiPnt7bGFiZWx9fTwvYT4gPGRpdiBjbGFzcz1cInRpbWVyLWJhclwiPjwvZGl2PjwvZGl2PicsXG5cbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgbGFiZWw6ICdAJyxcbiAgICAgICAgICAgICAgICBzcGVlZDogJz0nLFxuICAgICAgICAgICAgICAgIG9uQ2xpY2s6ICcmPycsXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZWQ6ICcmJ1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtLCBhdHRyKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFzY29wZS5zcGVlZCkgdGhyb3cgbmV3IEVycm9yKCdzcGVlZCBub3QgZGVmaW5lZCcpO1xuICAgICAgICAgICAgICAgIGlmICghc2NvcGUub25Db21wbGV0ZWQpIHRocm93IG5ldyBFcnJvcignb25Db21wbGV0ZWQgbm90IGRlZmluZWQnKTtcblxuICAgICAgICAgICAgICAgIHZhciBpbmNyZWFzZVBlclRpY2sgPSBzY29wZS5zcGVlZCAvIGNvbmZpZy50aWNrc1BlclNlY29uZDtcbiAgICAgICAgICAgICAgICB2YXIgYmFyID0gYW5ndWxhci5lbGVtZW50KGVsZW0uY2hpbGRyZW4oKVsxXSkuYXBwZW5kKCc8ZGl2IGNsYXNzPVwidGltZXItYmFyLXByb2dyZXNzXCI+PC9kaXY+Jyk7XG4gICAgICAgICAgICAgICAgdmFyIHByb2dyZXNzID0gYW5ndWxhci5lbGVtZW50KGJhci5jaGlsZHJlbigpWzBdKTtcblxuICAgICAgICAgICAgICAgIGV2ZW50TG9vcC5vblRpY2soc2NvcGUsIGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY29wZS5wZXJjZW50YWdlIDwgMSAmJiBzY29wZS53YWl0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5wZXJjZW50YWdlID0gTWF0aC5taW4oMSwgc2NvcGUucGVyY2VudGFnZSArIGluY3JlYXNlUGVyVGljayk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NvcGUud2FpdGluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzLmFkZENsYXNzKCd0aW1lci1iYXItY29tcGxldGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZS53YWl0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUucGVyY2VudGFnZSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUub25Db21wbGV0ZWQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBwcm9ncmVzcy5jc3MoJ3dpZHRoJywgKHNjb3BlLnBlcmNlbnRhZ2UgKiAxMDApICsgJyUnKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHByb2dyZXNzLmNzcygnd2lkdGgnLCAnMCUnKTtcbiAgICAgICAgICAgICAgICBiYXIuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgJ2JsYWNrJyk7XG5cbiAgICAgICAgICAgICAgICBzY29wZS5jb3VudGRvd24gPSBjb3VudGRvd247XG4gICAgICAgICAgICAgICAgc2NvcGUucGVyY2VudGFnZSA9IDA7XG5cbiAgICAgICAgICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBjb3VudGRvd24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghc2NvcGUud2FpdGluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3BlLm9uQ2xpY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5vbkNsaWNrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5wZXJjZW50YWdlID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLndhaXRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3MucmVtb3ZlQ2xhc3MoJ3RpbWVyLWJhci1jb21wbGV0ZScpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmRpcmVjdGl2ZSgndGltZXJCYXInLCB0aW1lckJhckRpcmVjdGl2ZSk7XG5cbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yOC8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8qKlxuICAgICAqIEBuZ0luamVjdFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRvb2x0aXBEaXJlY3RpdmUoKSB7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQUUnLFxuXG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIHRleHQ6ICc9JyxcbiAgICAgICAgICAgICAgICB4T2Zmc2V0OiAnQD8nLFxuICAgICAgICAgICAgICAgIHlPZmZzZXQ6ICdAPydcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbSwgYXR0cikge1xuICAgICAgICAgICAgICAgIHZhciBlbGVtZW50ID0gYW5ndWxhci5lbGVtZW50KGVsZW0pO1xuICAgICAgICAgICAgICAgIHZhciB0b29sdGlwSHRtbCA9IFwiPGRpdiBjbGFzcz0ndG9vbHRpcCc+PC9kaXY+XCI7XG5cbiAgICAgICAgICAgICAgICB2YXIgdG9vbHRpcCA9IGVsZW1lbnQuYXBwZW5kKHRvb2x0aXBIdG1sKS5jaGlsZHJlbigpWzFdO1xuXG4gICAgICAgICAgICAgICAgdG9vbHRpcC5pbm5lckhUTUwgPSBzY29wZS50ZXh0O1xuICAgICAgICAgICAgICAgIHZhciB0b29sdGlwRWxlbSA9IGFuZ3VsYXIuZWxlbWVudCh0b29sdGlwKTtcbiAgICAgICAgICAgICAgICB2YXIgd2lkdGggPSB0b29sdGlwRWxlbS5jc3MoJ3dpZHRoJyk7XG5cbiAgICAgICAgICAgICAgICBlbGVtZW50Lm9uKCdtb3VzZW1vdmUnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICB0b29sdGlwRWxlbS5jc3MoJ3RvcCcsIGUueSArIDEgKyAncHgnKTtcbiAgICAgICAgICAgICAgICAgICAgdG9vbHRpcEVsZW0uY3NzKCdsZWZ0JywgZS54ICsgMSArICdweCcpO1xuICAgICAgICAgICAgICAgICAgICB0b29sdGlwRWxlbS5jc3MoJ2Rpc3BsYXknLCAnaW5saW5lLWJsb2NrJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5vbignbW91c2VvdXQnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICB0b29sdGlwRWxlbS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmRpcmVjdGl2ZSgndG9vbHRpcCcsIHRvb2x0aXBEaXJlY3RpdmUpO1xuXG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjcvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBmdW5jdGlvbiBVdGlscygpIHtcblxuICAgICAgICB0aGlzLmNsYW1wID0gY2xhbXA7XG4gICAgICAgIHRoaXMucmFuZG9tSW50ID0gcmFuZG9tSW50O1xuICAgICAgICB0aGlzLnJhbmRvbUVsZW1lbnQgPSByYW5kb21FbGVtZW50O1xuICAgICAgICB0aGlzLnJhbmRvbUZsb2F0ID0gcmFuZG9tRmxvYXQ7XG5cbiAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICBmdW5jdGlvbiBjbGFtcCh2YWx1ZSwgbWluLCBtYXgpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLm1pbihNYXRoLm1heChtaW4sIHZhbHVlKSwgbWF4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHJhbmRvbUludChtaW4sIG1heCkge1xuICAgICAgICAgICAgdmFyIGRpZmYgPSBtYXggLSBtaW47XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcigoTWF0aC5yYW5kb20oKSAqIGRpZmYpICsgbWluKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHJhbmRvbUZsb2F0KG1pbiwgbWF4KSB7XG4gICAgICAgICAgICB2YXIgZGlmZiA9IG1heCAtIG1pbjtcbiAgICAgICAgICAgIHJldHVybiAoTWF0aC5yYW5kb20oKSAqIGRpZmYpICsgbWluO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcmFuZG9tRWxlbWVudChhcnJheSwgd2VpZ2h0UHJvcGVydHksIGlzRnVuY3Rpb24pIHtcbiAgICAgICAgICAgIHZhciBnZXRXZWlnaHQgPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSAwO1xuICAgICAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBpdGVtW3dlaWdodFByb3BlcnR5XSgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBpdGVtW3dlaWdodFByb3BlcnR5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgdG90YWxXZWlnaHRzID0gXy5yZWR1Y2UoYXJyYXksIGZ1bmN0aW9uIChyZXN1bHQsIG4sIGlkeCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCArPSBnZXRXZWlnaHQobik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgdmFyIHJhbmRvbUluZGV4ID0gcmFuZG9tSW50KDAsIHRvdGFsV2VpZ2h0cyk7XG4gICAgICAgICAgICB2YXIgY291bnQgPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvdW50ICs9IGdldFdlaWdodChhcnJheVtpXSk7XG4gICAgICAgICAgICAgICAgaWYgKGNvdW50ID49IHJhbmRvbUluZGV4KVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXJyYXlbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYXJyYXlbYXJyYXkubGVuZ3RoIC0gMV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5zZXJ2aWNlKCd1dGlscycsIFV0aWxzKTtcblxufSkoKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=