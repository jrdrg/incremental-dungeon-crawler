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
        //
        //eventLoop.onTick($scope, function (args) {
        //    tick++;
        //
        //    if (tick % 3 === 0) {
        //        if (results === null) {
        //            results = battle.processRound();
        //        }
        //        var res = results.shift();
        //        self.messages.unshift(res);
        //
        //        if (res.xp && res.xp > 0) {
        //            xp += res.xp;
        //        }
        //        if (results.length === 0 || res.victory) {
        //            results = null;
        //        }
        //
        //        if (res.victory) {
        //            results = null;
        //            promise.resolve({
        //                xp: xp
        //            });
        //            statusMessages.message("You are victorious and gain " + xp + " xp.");
        //            $state.go(prevState || 'main.actions');
        //        } else if (res.defeat) {
        //            results = null;
        //            promise.resolve({
        //                xp: 0
        //            });
        //            promise = null;
        //            statusMessages.message("You have been defeated.");
        //            $state.go(prevState || 'main.actions');
        //        }
        //    }
        //});

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0JhdHRsZUNvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9DaGFyYWN0ZXJTdGF0dXNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvTWFpbkNvbnRyb2xsZXIuanMiLCJkaXJlY3RpdmVzL2FjdGlvbkJ1dHRvbi5qcyIsImRpcmVjdGl2ZXMvdGltZXJCYXIuanMiLCJkaXJlY3RpdmVzL3Rvb2x0aXAuanMiLCJmaWx0ZXJzL2Rpc2NvdmVyZWRMb2NhdGlvbi5qcyIsImZpbHRlcnMvcGVyY2VudGFnZS5qcyIsInNlcnZpY2VzL0R1bmdlb24uanMiLCJzZXJ2aWNlcy9NYXAuanMiLCJzZXJ2aWNlcy9hY3Rpb25zLmpzIiwic2VydmljZXMvYmF0dGxlLmpzIiwic2VydmljZXMvY29uZmlnLmpzIiwic2VydmljZXMvZW5lbWllcy5qcyIsInNlcnZpY2VzL2V2ZW50TG9vcC5qcyIsInNlcnZpY2VzL2dhbWUuanMiLCJzZXJ2aWNlcy9sb2NhdGlvbnMuanMiLCJzZXJ2aWNlcy9wYXJ0eS5qcyIsInNlcnZpY2VzL3Jlc291cmNlcy5qcyIsInNlcnZpY2VzL3N0YXR1c01lc3NhZ2VzLmpzIiwic2VydmljZXMvdXBncmFkZXMuanMiLCJzZXJ2aWNlcy91dGlscy5qcyIsInNlcnZpY2VzL2V2ZW50cy9iYXR0bGVFdmVudHMuanMiLCJzZXJ2aWNlcy9yZXNvdXJjZXMvQ2hhcmFjdGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUFHQSxDQUFDLFlBQVk7O0lBRVQ7Ozs7Ozs7SUFPQSxTQUFTLFVBQVUsZ0JBQWdCLG9CQUFvQjs7UUFFbkQsbUJBQW1CLFVBQVU7O1FBRTdCO2FBQ0ssTUFBTSxRQUFRO2dCQUNYLFVBQVU7Z0JBQ1YsS0FBSztnQkFDTCxhQUFhO2dCQUNiLFlBQVk7Z0JBQ1osY0FBYzs7O2FBR2pCLE1BQU0sZ0JBQWdCO2dCQUNuQixLQUFLO2dCQUNMLGFBQWE7OzthQUdoQixNQUFNLHdCQUF3QjtnQkFDM0IsUUFBUTtvQkFDSixXQUFXOztnQkFFZixhQUFhO2dCQUNiLFlBQVk7Z0JBQ1osY0FBYzs7O2FBR2pCLE1BQU0sZUFBZTtnQkFDbEIsUUFBUTtvQkFDSixRQUFRO29CQUNSLFNBQVM7O2dCQUViLGFBQWE7Z0JBQ2IsWUFBWTtnQkFDWixjQUFjOzs7Ozs7SUFLMUIsUUFBUSxPQUFPLFFBQVEsQ0FBQyxhQUFhO1NBQ2hDLE9BQU87U0FDUCxJQUFJLENBQUMsY0FBYyxVQUFVLFVBQVUsWUFBWSxRQUFRO1lBQ3hELFdBQVcsSUFBSSx1QkFBdUIsVUFBVSxPQUFPLElBQUksVUFBVSxNQUFNLFlBQVk7Z0JBQ25GLE9BQU8sV0FBVztnQkFDbEIsV0FBVyxpQkFBaUI7OztLQUd2QztBQzNETDs7O0FBR0EsQ0FBQyxZQUFZOztJQUVUOzs7Ozs7SUFNQSxTQUFTLGlCQUFpQixRQUFRLFFBQVEsZ0JBQWdCLFdBQVc7UUFDakUsSUFBSSxTQUFTLE9BQU8sT0FBTztZQUN2QixVQUFVLE9BQU8sT0FBTztZQUN4QixZQUFZLE9BQU8sWUFBWTtZQUMvQixPQUFPOzs7UUFHWCxJQUFJLE9BQU87UUFDWCxJQUFJLEtBQUs7UUFDVCxJQUFJLFVBQVU7O1FBRWQsS0FBSyxVQUFVLE9BQU87UUFDdEIsS0FBSyxXQUFXLE9BQU87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBd0MzQixRQUFRLE9BQU87U0FDVixXQUFXLG9CQUFvQjs7S0FFbkM7QUNsRUw7OztBQUdBLENBQUMsWUFBWTs7SUFFVDs7Ozs7O0lBTUEsU0FBUywwQkFBMEIsUUFBUTtRQUN2QyxJQUFJLFlBQVksT0FBTyxPQUFPOztRQUU5QixLQUFLLFlBQVk7UUFDakIsS0FBSyxTQUFTOzs7O1FBSWQsU0FBUyxTQUFTO1lBQ2QsT0FBTyxHQUFHOzs7Ozs7SUFLbEIsUUFBUSxPQUFPO1NBQ1YsV0FBVyw2QkFBNkI7O0tBRTVDO0FDNUJMOzs7QUFHQSxDQUFDLFlBQVk7O0lBRVQ7Ozs7OztJQU1BLFNBQVMsZUFBZSxRQUFRLFFBQVEsTUFBTSxTQUFTLGdCQUFnQixXQUFXLFVBQVU7O1FBRXhGLElBQUksT0FBTzs7UUFFWCxLQUFLLFVBQVUsUUFBUTtRQUN2QixLQUFLLGFBQWE7UUFDbEIsS0FBSyxnQkFBZ0I7UUFDckIsS0FBSyxpQkFBaUIsVUFBVTtRQUNoQyxLQUFLLHNCQUFzQjtRQUMzQixLQUFLLHVCQUF1QjtRQUM1QixLQUFLLGNBQWM7UUFDbkIsS0FBSyxXQUFXO1FBQ2hCLEtBQUssd0JBQXdCO1FBQzdCLEtBQUssWUFBWSxVQUFVO1FBQzNCLEtBQUssV0FBVztRQUNoQixLQUFLLFlBQVksS0FBSzs7OztRQUl0QixlQUFlLFVBQVUsUUFBUSxVQUFVLE1BQU07WUFDN0MsS0FBSyxTQUFTLFFBQVEsQ0FBQyxNQUFNLEtBQUs7WUFDbEMsSUFBSSxLQUFLLFNBQVMsU0FBUyxJQUFJO2dCQUMzQixLQUFLLFNBQVM7Ozs7O1FBS3RCLFNBQVMsV0FBVyxTQUFTO1lBQ3pCLFNBQVMsV0FBVzs7OztRQUl4QixTQUFTLGNBQWMsV0FBVztZQUM5QixJQUFJLENBQUMsS0FBSyxjQUFjOztnQkFFcEIsT0FBTyxHQUFHLHdCQUF3QjtvQkFDOUIsV0FBVzs7O21CQUdaO2dCQUNILGVBQWUsUUFBUTs7Ozs7UUFLL0IsU0FBUyxzQkFBc0I7WUFDM0IsT0FBTyxLQUFLLFdBQVc7Ozs7UUFJM0IsU0FBUyx1QkFBdUI7WUFDNUIsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLFNBQVMsb0JBQW9CLGNBQWMsVUFBVSxHQUFHO2dCQUM3RSxPQUFPLEVBQUUsU0FBUyxJQUFJOzs7OztRQUs5QixTQUFTLGNBQWM7WUFDbkIsT0FBTyxLQUFLOzs7O1FBSWhCLFNBQVMsV0FBVztZQUNoQixPQUFPLEtBQUs7Ozs7UUFJaEIsU0FBUyxzQkFBc0IsU0FBUztZQUNwQyxJQUFJLE9BQU8sVUFBVSxRQUFRLGNBQWM7O1lBRTNDLEtBQUssSUFBSSxXQUFXLFFBQVEsVUFBVTtnQkFDbEMsSUFBSSxRQUFRLFNBQVMsZUFBZSxVQUFVO29CQUMxQyxRQUFRLFNBQVMsVUFBVSxPQUFPLFFBQVEsU0FBUyxXQUFXOzs7O1lBSXRFLFFBQVE7WUFDUixPQUFPOzs7Ozs7O0lBTWYsUUFBUSxPQUFPO1NBQ1YsV0FBVyxrQkFBa0I7S0FDakM7QUNoR0w7OztBQUdBLENBQUMsWUFBWTs7SUFFVDs7Ozs7SUFLQSxTQUFTLHNCQUFzQixXQUFXLFFBQVEsU0FBUyxVQUFVLE1BQU07O1FBRXZFLE9BQU87WUFDSCxVQUFVOztZQUVWLE9BQU87Z0JBQ0gsUUFBUTs7O1lBR1osVUFBVTtZQUNWOztZQUVBLE1BQU0sVUFBVSxPQUFPLE1BQU0sTUFBTTs7Z0JBRS9CLElBQUksQ0FBQyxNQUFNLFFBQVE7b0JBQ2YsTUFBTTs7O2dCQUdWLElBQUksY0FBYyxRQUFRLFFBQVEsS0FBSyxXQUFXLElBQUk7Z0JBQ3RELElBQUksTUFBTSxRQUFRLFFBQVEsS0FBSyxXQUFXLElBQUksT0FBTztnQkFDckQsSUFBSSxPQUFPLFFBQVEsUUFBUSxLQUFLLFdBQVcsSUFBSSxPQUFPLG1DQUFtQyxNQUFNLE9BQU8sT0FBTztnQkFDN0csSUFBSSxXQUFXLFFBQVEsUUFBUSxJQUFJLFdBQVc7OztnQkFHOUMsTUFBTSxXQUFXO2dCQUNqQixNQUFNLHVCQUF1QjtnQkFDN0IsTUFBTSxnQkFBZ0I7Z0JBQ3RCLE1BQU0sb0JBQW9CO2dCQUMxQixNQUFNLGFBQWEsTUFBTSxPQUFPLGVBQWU7Z0JBQy9DLE1BQU0sVUFBVTs7OztnQkFJaEIsSUFBSSxNQUFNLE9BQU8sY0FBYyxHQUFHO29CQUM5QixTQUFTLFNBQVM7b0JBQ2xCLE1BQU0sVUFBVTs7Z0JBRXBCLFNBQVMsSUFBSSxTQUFTLENBQUMsTUFBTSxhQUFhLE9BQU87Z0JBQ2pELFVBQVUsT0FBTyxPQUFPOzs7Ozs7Z0JBTXhCLFNBQVMsV0FBVztvQkFDaEIsSUFBSSxDQUFDLE1BQU0sU0FBUzt3QkFDaEIsSUFBSSxNQUFNLFNBQVM7NEJBQ2YsTUFBTTs7d0JBRVYsTUFBTSxhQUFhO3dCQUNuQixNQUFNLFVBQVU7O3dCQUVoQixJQUFJLFNBQVMsTUFBTTt3QkFDbkIsSUFBSSxRQUFRLFlBQVksUUFBUSxTQUFTLHFCQUFxQjs0QkFDMUQsT0FBTyxZQUFZLENBQUMsT0FBTzsrQkFDeEI7NEJBQ0gsUUFBUSxTQUFTLE1BQU07Ozs7Ozs7Ozs7Z0JBVW5DLFNBQVMsZ0JBQWdCO29CQUNyQixPQUFPO3dCQUNILHFCQUFxQjt3QkFDckIsc0JBQXNCOzs7O2dCQUk5QixTQUFTLHVCQUF1QjtvQkFDNUIsT0FBTzt3QkFDSCxhQUFhOzs7Ozs7Ozs7Z0JBU3JCLFNBQVMsa0JBQWtCOztvQkFFdkIsT0FBTyxNQUFNLE9BQU8sV0FBVyxNQUFNLE9BQU8sY0FBYzs7OztnQkFJOUQsU0FBUyxvQkFBb0I7b0JBQ3pCLE9BQU8sTUFBTSxjQUFjLEtBQUssQ0FBQyxNQUFNLFdBQVcsTUFBTSxPQUFPLGdCQUFnQjs7OztnQkFJbkYsU0FBUyxvQkFBb0I7b0JBQ3pCLE9BQU8sTUFBTSxPQUFPOzs7Ozs7OztnQkFReEIsU0FBUyxPQUFPLE1BQU07b0JBQ2xCLElBQUksU0FBUyxNQUFNOztvQkFFbkIsSUFBSSxNQUFNLGVBQWUsS0FBSyxPQUFPLGdCQUFnQixHQUFHO3dCQUNwRCxNQUFNLFVBQVU7O29CQUVwQixNQUFNLGFBQWEsT0FBTztvQkFDMUIsU0FBUyxJQUFJLFNBQVMsQ0FBQyxNQUFNLGFBQWEsT0FBTzs7Ozs7OztJQU1qRSxRQUFRLE9BQU87U0FDVixVQUFVLGdCQUFnQjtLQUM5QjtBQ2pJTDs7O0FBR0EsQ0FBQyxZQUFZOztJQUVUOzs7Ozs7SUFNQSxTQUFTLGtCQUFrQixXQUFXLFFBQVE7O1FBRTFDLE9BQU87WUFDSCxVQUFVOztZQUVWLFNBQVM7O1lBRVQsVUFBVTs7WUFFVixPQUFPO2dCQUNILE9BQU87Z0JBQ1AsT0FBTztnQkFDUCxTQUFTO2dCQUNULGFBQWE7OztZQUdqQixNQUFNLFVBQVUsT0FBTyxNQUFNLE1BQU07Z0JBQy9CLElBQUksQ0FBQyxNQUFNLE9BQU8sTUFBTSxJQUFJLE1BQU07Z0JBQ2xDLElBQUksQ0FBQyxNQUFNLGFBQWEsTUFBTSxJQUFJLE1BQU07O2dCQUV4QyxJQUFJLGtCQUFrQixNQUFNLFFBQVEsT0FBTztnQkFDM0MsSUFBSSxNQUFNLFFBQVEsUUFBUSxLQUFLLFdBQVcsSUFBSSxPQUFPO2dCQUNyRCxJQUFJLFdBQVcsUUFBUSxRQUFRLElBQUksV0FBVzs7Z0JBRTlDLFVBQVUsT0FBTyxPQUFPLFVBQVUsTUFBTTtvQkFDcEMsSUFBSSxNQUFNLGFBQWEsS0FBSyxNQUFNLFNBQVM7d0JBQ3ZDLE1BQU0sYUFBYSxLQUFLLElBQUksR0FBRyxNQUFNLGFBQWE7MkJBQy9DO3dCQUNILElBQUksTUFBTSxTQUFTOzRCQUNmLFNBQVMsU0FBUzs0QkFDbEIsTUFBTSxVQUFVOzRCQUNoQixNQUFNLGFBQWE7NEJBQ25CLE1BQU07OztvQkFHZCxTQUFTLElBQUksU0FBUyxDQUFDLE1BQU0sYUFBYSxPQUFPOzs7Z0JBR3JELFNBQVMsSUFBSSxTQUFTO2dCQUN0QixJQUFJLElBQUksb0JBQW9COztnQkFFNUIsTUFBTSxZQUFZO2dCQUNsQixNQUFNLGFBQWE7Ozs7Z0JBSW5CLFNBQVMsWUFBWTtvQkFDakIsSUFBSSxDQUFDLE1BQU0sU0FBUzt3QkFDaEIsSUFBSSxNQUFNLFNBQVM7NEJBQ2YsTUFBTTs7d0JBRVYsTUFBTSxhQUFhO3dCQUNuQixNQUFNLFVBQVU7d0JBQ2hCLFNBQVMsWUFBWTs7Ozs7Ozs7SUFPekMsUUFBUSxPQUFPO1NBQ1YsVUFBVSxZQUFZOztLQUUxQjtBQzFFTDs7O0FBR0EsQ0FBQyxZQUFZOztJQUVUOzs7OztJQUtBLFNBQVMsbUJBQW1COztRQUV4QixPQUFPO1lBQ0gsVUFBVTs7WUFFVixPQUFPO2dCQUNILE1BQU07Z0JBQ04sU0FBUztnQkFDVCxTQUFTOzs7WUFHYixNQUFNLFVBQVUsT0FBTyxNQUFNLE1BQU07Z0JBQy9CLElBQUksVUFBVSxRQUFRLFFBQVE7Z0JBQzlCLElBQUksY0FBYzs7Z0JBRWxCLElBQUksVUFBVSxRQUFRLE9BQU8sYUFBYSxXQUFXOztnQkFFckQsUUFBUSxZQUFZLE1BQU07Z0JBQzFCLElBQUksY0FBYyxRQUFRLFFBQVE7Z0JBQ2xDLElBQUksUUFBUSxZQUFZLElBQUk7O2dCQUU1QixRQUFRLEdBQUcsYUFBYSxVQUFVLEdBQUc7b0JBQ2pDLFlBQVksSUFBSSxPQUFPLEVBQUUsSUFBSSxJQUFJO29CQUNqQyxZQUFZLElBQUksUUFBUSxFQUFFLElBQUksSUFBSTtvQkFDbEMsWUFBWSxJQUFJLFdBQVc7O2dCQUUvQixRQUFRLEdBQUcsWUFBWSxVQUFVLEdBQUc7b0JBQ2hDLFlBQVksSUFBSSxXQUFXOzs7Ozs7SUFNM0MsUUFBUSxPQUFPO1NBQ1YsVUFBVSxXQUFXOztLQUV6QjtBQzlDTDs7O0FBR0EsQ0FBQyxZQUFZOztJQUVUOztJQUVBLFNBQVMsMkJBQTJCO1FBQ2hDLE9BQU8sU0FBUyxtQkFBbUIsV0FBVztZQUMxQyxPQUFPLEVBQUUsTUFBTSxXQUFXLENBQUMsWUFBWTs7OztJQUkvQyxRQUFRLE9BQU87U0FDVixPQUFPLHNCQUFzQjtLQUNqQztBQ2ZMOzs7QUFHQSxDQUFDLFlBQVk7O0lBRVQ7O0lBRUEsU0FBUyxpQkFBaUIsU0FBUztRQUMvQixPQUFPLFNBQVMsV0FBVyxPQUFPLFVBQVU7WUFDeEMsT0FBTyxRQUFRLFVBQVUsUUFBUSxLQUFLLFlBQVk7Ozs7O0lBSTFELFFBQVEsT0FBTztTQUNWLE9BQU8sY0FBYzs7S0FFekI7QUNoQkw7OztBQUdBLENBQUMsWUFBWTs7SUFFVDs7Ozs7O0lBTUEsU0FBUyxpQkFBaUI7O1FBRXRCLFNBQVMsT0FBTztZQUNaLEtBQUssY0FBYyxLQUFLO1lBQ3hCLEtBQUssYUFBYSxLQUFLO1lBQ3ZCLEtBQUssaUJBQWlCLEtBQUs7OztRQUcvQixTQUFTLFFBQVE7WUFDYixLQUFLLGNBQWM7WUFDbkIsS0FBSyxRQUFROzs7O1FBSWpCLE9BQU8sU0FBUyxRQUFRLE9BQU8sWUFBWTs7WUFFdkMsYUFBYSxLQUFLLFdBQVcsUUFBUTs7WUFFckMsS0FBSyxRQUFRO1lBQ2IsS0FBSyxTQUFTOztZQUVkLEtBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxZQUFZLEtBQUs7Z0JBQ2pDLEtBQUssT0FBTyxLQUFLLElBQUk7Ozs7O0lBS2pDLFFBQVEsT0FBTztTQUNWLFFBQVEsV0FBVztLQUN2QjtBQ3hDTDs7O0FBR0EsQ0FBQyxZQUFZOztJQUVUOzs7Ozs7SUFNQSxTQUFTLFdBQVcsT0FBTyxPQUFPLGdCQUFnQixVQUFVLFdBQVcsUUFBUTs7UUFFM0UsSUFBSSxnQkFBZ0I7UUFDcEIsSUFBSSxhQUFhOztRQUVqQixTQUFTLEtBQUssS0FBSyxPQUFPO1lBQ3RCLElBQUksT0FBTzs7WUFFWCxLQUFLLFVBQVU7WUFDZixLQUFLLFdBQVc7WUFDaEIsS0FBSyxjQUFjLEtBQUs7WUFDeEIsS0FBSyxZQUFZLEtBQUssV0FBVztZQUNqQyxLQUFLLGFBQWEsS0FBSztZQUN2QixLQUFLLGlCQUFpQixLQUFLOztZQUUzQixTQUFTLFFBQVEsV0FBVztnQkFDeEIsSUFBSSxLQUFLLFlBQVksS0FBSyxhQUFhO29CQUNuQyxhQUFhOzt1QkFFVixJQUFJLEtBQUssWUFBWSxLQUFLLFlBQVk7b0JBQ3pDOzt1QkFFRyxJQUFJLEtBQUssWUFBWSxLQUFLLGdCQUFnQjtvQkFDN0M7OztnQkFHSixLQUFLLFdBQVc7OztZQUdwQixTQUFTLGFBQWEsV0FBVztnQkFDN0IsZUFBZSxRQUFRO2dCQUN2QixLQUFLLGVBQWU7O2dCQUVwQixJQUFJLFNBQVMsSUFBSSxPQUFPLFdBQVc7Z0JBQ25DLE9BQU87OztZQUdYLFNBQVMsZ0JBQWdCO2dCQUNyQixlQUFlLFFBQVE7Z0JBQ3ZCLEtBQUssa0JBQWtCO2dCQUN2QixVQUFVLEtBQUssV0FBVyxLQUFLLE1BQU0sS0FBSyxXQUFXLEtBQUssSUFBSTs7O1lBR2xFLFNBQVMsT0FBTztnQkFDWixlQUFlLFFBQVE7Z0JBQ3ZCLEtBQUssY0FBYzs7Ozs7UUFLM0IsU0FBUyxNQUFNLEtBQUssV0FBVztZQUMzQixZQUFZLEtBQUssTUFBTSxhQUFhOztZQUVwQyxJQUFJLE9BQU87O1lBRVgsS0FBSyxjQUFjO1lBQ25CLEtBQUssVUFBVTtZQUNmLEtBQUssY0FBYztZQUNuQixLQUFLLGNBQWM7WUFDbkIsS0FBSyxRQUFROzs7O1lBSWIsS0FBSyxJQUFJLElBQUksR0FBRyxJQUFJLFdBQVcsS0FBSztnQkFDaEMsS0FBSyxNQUFNLEtBQUssSUFBSSxLQUFLLEtBQUs7Ozs7O1lBS2xDLFNBQVMsUUFBUSxhQUFhLFdBQVc7Z0JBQ3JDLElBQUksT0FBTyxLQUFLLE1BQU0sS0FBSztnQkFDM0IsS0FBSyxRQUFROztnQkFFYixJQUFJLFlBQVksQ0FBQyxLQUFLLGVBQWUsS0FBSyxNQUFNLFNBQVMsTUFBTSxLQUFLLFlBQVksS0FBSzs7Z0JBRXJGLElBQUksY0FBYyxLQUFLLENBQUMsS0FBSyxlQUFlLFdBQVc7b0JBQ25ELGVBQWUsUUFBUTtvQkFDdkIsS0FBSyxjQUFjOzs7Z0JBR3ZCLElBQUksQ0FBQyxTQUFTLFNBQVM7O29CQUVuQixJQUFJLEtBQUssWUFBWSxlQUFlO3dCQUNoQyxlQUFlLFFBQVE7d0JBQ3ZCLEtBQUssY0FBYyxLQUFLLE1BQU0sS0FBSyxXQUFXOzs7Z0JBR3RELElBQUksS0FBSyxjQUFjLFlBQVk7b0JBQy9CLEtBQUs7O2dCQUVULElBQUksV0FBVyxFQUFFLE9BQU8sS0FBSyxPQUFPLFlBQVk7Z0JBQ2hELEtBQUssY0FBYyxXQUFXLEtBQUssTUFBTTs7Ozs7Ozs7O1FBU2pELE9BQU8sU0FBUyxJQUFJLE1BQU07O1lBRXRCLE9BQU8sUUFBUTs7WUFFZixJQUFJLE9BQU87Z0JBQ1AsUUFBUSxLQUFLLFNBQVM7Z0JBQ3RCLGFBQWEsS0FBSyxjQUFjLEtBQUssV0FBVyxRQUFRO2dCQUN4RCxZQUFZLEtBQUssYUFBYSxLQUFLLFdBQVcsTUFBTSxLQUFLLFdBQVcsSUFBSTs7WUFFNUUsS0FBSyxlQUFlO1lBQ3BCLEtBQUssVUFBVTtZQUNmLEtBQUssY0FBYztZQUNuQixLQUFLLFNBQVM7WUFDZCxLQUFLLFFBQVE7Ozs7WUFJYixLQUFLLElBQUksSUFBSSxHQUFHLElBQUksWUFBWSxLQUFLO2dCQUNqQyxLQUFLLE9BQU8sS0FBSyxJQUFJLE1BQU0sTUFBTTs7O1lBR3JDLFNBQVMsWUFBWSxVQUFVO2dCQUMzQixLQUFLLGVBQWUsWUFBWSxLQUFLOzs7WUFHekMsU0FBUyxRQUFRLFdBQVc7Z0JBQ3hCLElBQUksUUFBUSxNQUFNLE1BQU0sS0FBSyxjQUFjLEdBQUcsS0FBSyxPQUFPO2dCQUMxRCxLQUFLLE9BQU8sT0FBTyxRQUFRLEtBQUssT0FBTyxRQUFROztnQkFFL0MsSUFBSSxXQUFXLEVBQUUsT0FBTyxLQUFLLFFBQVEsVUFBVSxLQUFLLE9BQU8sS0FBSztvQkFDNUQsUUFBUSxJQUFJLGVBQWU7b0JBQzNCLE9BQU8sTUFBTTtvQkFDYixPQUFPO21CQUNSOztnQkFFSCxJQUFJLFdBQVcsS0FBSyxhQUFhO29CQUM3QixVQUFVLEdBQUcsWUFBWSxhQUFhLFNBQVMsS0FBSyxlQUFlOztnQkFFdkUsS0FBSyxjQUFjOzs7Ozs7SUFLL0IsUUFBUSxPQUFPO1NBQ1YsUUFBUSxPQUFPO0tBQ25CO0FDNUpMOzs7QUFHQSxDQUFDLFlBQVk7O0lBRVQ7O0lBRUEsSUFBSSxXQUFXO1FBQ1gsU0FBUztRQUNULFdBQVc7UUFDWCxhQUFhO1FBQ2IsU0FBUyxRQUFRO1FBQ2pCLGlCQUFpQjs7Ozs7Ozs7O0lBU3JCLFNBQVMsUUFBUSxJQUFJLE9BQU8sT0FBTyxnQkFBZ0I7O1FBRS9DLElBQUksT0FBTzs7UUFFWCxLQUFLLG9CQUFvQjtRQUN6QixLQUFLLGNBQWM7UUFDbkIsS0FBSyxzQkFBc0I7UUFDM0IsS0FBSyxXQUFXO1FBQ2hCLEtBQUssY0FBYzs7Ozs7UUFLbkIsU0FBUyxvQkFBb0I7WUFDekIsT0FBTzs7Z0JBRUgsU0FBUyxRQUFRLE9BQU8sSUFBSSxVQUFVO29CQUNsQyxNQUFNO29CQUNOLE9BQU87b0JBQ1AsWUFBWSxVQUFVLE1BQU07d0JBQ3hCLEtBQUs7O29CQUVULGlCQUFpQjs7O2dCQUdyQixhQUFhLFFBQVEsT0FBTyxJQUFJLFVBQVU7b0JBQ3RDLE1BQU07b0JBQ04sT0FBTztvQkFDUCxZQUFZLFVBQVUsTUFBTTt3QkFDeEIsSUFBSSxLQUFLLFdBQVcsT0FBTzs0QkFDdkIsSUFBSSxTQUFTLEtBQUssTUFBTSxLQUFLLFdBQVc7NEJBQ3hDLEtBQUssZUFBZSxTQUFTOzRCQUM3QixlQUFlLFFBQVEsZUFBZSxTQUFTLElBQUksU0FBUyxRQUFROzs7b0JBRzVFLGlCQUFpQjs7Ozs7Ozs7Ozs7O1FBWTdCLFNBQVMsWUFBWSxRQUFRLFVBQVU7WUFDbkMsSUFBSSxPQUFPLGlCQUFpQjtnQkFDeEIsT0FBTyxTQUFTLE9BQU8saUJBQWlCOztZQUU1QyxPQUFPOzs7O1FBSVgsU0FBUyxzQkFBc0I7WUFDM0IsUUFBUSxRQUFRLEtBQUssbUJBQW1CLFVBQVUsUUFBUTtnQkFDdEQsSUFBSSxPQUFPLFNBQVM7b0JBQ2hCLE9BQU8sY0FBYztvQkFDckIsT0FBTyxVQUFVOztvQkFFakIsSUFBSSxPQUFPLFVBQVU7d0JBQ2pCLElBQUksV0FBVyxPQUFPO3dCQUN0QixPQUFPLFdBQVc7d0JBQ2xCLFNBQVMsT0FBTzs7Ozs7Ozs7Ozs7O1FBWWhDLFNBQVMsU0FBUyxNQUFNLFFBQVE7WUFDNUIsSUFBSSxLQUFLLE9BQU87Z0JBQ1osTUFBTTs7WUFFVixJQUFJLENBQUMsT0FBTyxTQUFTO2dCQUNqQixPQUFPLGNBQWM7Z0JBQ3JCLE9BQU8sVUFBVTtnQkFDakIsT0FBTyxXQUFXLEdBQUc7O2dCQUVyQixPQUFPLFNBQVMsUUFBUSxLQUFLLFVBQVUsVUFBVTtvQkFDN0MsT0FBTyxXQUFXO29CQUNsQixPQUFPLGNBQWM7Ozs7Ozs7Ozs7O1FBV2pDLFNBQVMsVUFBVSxRQUFRO1lBQ3ZCLE9BQU8sT0FBTzs7OztRQUlsQixTQUFTLFlBQVksTUFBTTtZQUN2QixRQUFRLFFBQVEsS0FBSyxtQkFBbUIsVUFBVSxRQUFRO2dCQUN0RCxJQUFJLE9BQU8sY0FBYyxLQUFLLFVBQVUsU0FBUztvQkFDN0MsT0FBTyxjQUFjLE1BQU0sTUFBTSxPQUFPLGNBQWMsT0FBTyxPQUFPLEdBQUc7dUJBQ3BFO29CQUNILElBQUksT0FBTyxVQUFVO3dCQUNqQixPQUFPLFNBQVMsUUFBUTt3QkFDeEIsT0FBTyxXQUFXO3dCQUNsQixZQUFZLFFBQVE7OzJCQUVqQjs7d0JBRUgsSUFBSSxPQUFPLGFBQWEsQ0FBQyxLQUFLLGNBQWM7NEJBQ3hDLFNBQVMsTUFBTTs7Ozs7Ozs7Ozs7Ozs7UUFjbkMsU0FBUyxZQUFZLFFBQVEsU0FBUztZQUNsQyxPQUFPLFVBQVU7Ozs7O0lBSXpCLFFBQVEsT0FBTztTQUNWLFFBQVEsV0FBVztLQUN2QjtBQzlKTDs7O0FBR0EsQ0FBQyxZQUFZOztJQUVUOzs7Ozs7SUFNQSxTQUFTLGNBQWMsWUFBWSxRQUFRLElBQUksV0FBVyxnQkFBZ0IsT0FBTyxPQUFPLFdBQVcsVUFBVTs7UUFFekcsT0FBTyxTQUFTLE9BQU8sV0FBVyxNQUFNO1lBQ3BDLElBQUksWUFBWTs7WUFFaEIsSUFBSSxPQUFPO2dCQUNQLFVBQVU7O1lBRWQsSUFBSSxPQUFPO2dCQUNQO2dCQUNBO2dCQUNBO2dCQUNBO2dCQUNBLEtBQUs7O1lBRVQsS0FBSyxRQUFRO1lBQ2IsS0FBSyxVQUFVO1lBQ2YsS0FBSyxXQUFXOztZQUVoQixVQUFVLFVBQVUsT0FBTyxZQUFZOzs7O1lBSXZDLFNBQVMsUUFBUTtnQkFDYixJQUFJLEtBQUssVUFBVTtnQkFDbkIsUUFBUSxLQUFLLFVBQVUsUUFBUTtvQkFDM0IsR0FBRyxXQUFXLE9BQU87b0JBQ3JCLEtBQUs7Ozs7O1lBS2IsU0FBUyxnQkFBZ0I7Z0JBQ3JCLElBQUksYUFBYSxLQUFLLEtBQUssS0FBSyxXQUFXO2dCQUMzQyxJQUFJLFVBQVU7Z0JBQ2QsS0FBSyxJQUFJLElBQUksR0FBRyxJQUFJLFlBQVksS0FBSztvQkFDakMsUUFBUSxLQUFLLElBQUksTUFBTSxLQUFLLFNBQVM7O2dCQUV6QyxPQUFPOzs7O1lBSVgsU0FBUyxRQUFRO2dCQUNiLElBQUksQ0FBQyxVQUFVO29CQUNYLFdBQVcsR0FBRztvQkFDZCxPQUFPLEdBQUcsZUFBZTt3QkFDckIsUUFBUTt3QkFDUixTQUFTOzs7Z0JBR2pCLE9BQU8sU0FBUzs7OztZQUlwQixTQUFTLFdBQVcsU0FBUztnQkFDekIsZUFBZSxRQUFRO2dCQUN2QjtnQkFDQSxRQUFRLElBQUk7Z0JBQ1osT0FBTyxHQUFHLGFBQWE7Ozs7WUFJM0IsU0FBUyxjQUFjLFFBQVE7Z0JBQzNCLFNBQVMsVUFBVTs7Z0JBRW5CLEtBQUssU0FBUyxRQUFRO2dCQUN0QixNQUFNLE9BQU8sTUFBTTs7Z0JBRW5CLElBQUksT0FBTyxTQUFTO29CQUNoQixTQUFTLFFBQVE7d0JBQ2IsSUFBSTs7b0JBRVIsV0FBVyxpQ0FBaUMsS0FBSzs7dUJBRTlDLElBQUksT0FBTyxRQUFRO29CQUN0QixTQUFTLFFBQVE7d0JBQ2IsSUFBSTs7b0JBRVIsV0FBVzs7O2dCQUdmLE9BQU8sT0FBTyxXQUFXLE9BQU87Ozs7WUFJcEMsU0FBUyxZQUFZLE1BQU07Z0JBQ3ZCLElBQUk7b0JBQ0EsUUFBUSxpQkFBaUI7O2dCQUU3QixJQUFJLENBQUMsTUFBTSxVQUFVO29CQUNqQixJQUFJLGlCQUFpQixPQUFPO3dCQUN4QixTQUFTLE1BQU0sT0FBTyxNQUFNOzJCQUN6Qjt3QkFDSCxTQUFTLE1BQU0sT0FBTzs7O2dCQUc5QixPQUFPLGNBQWM7Ozs7WUFJekIsU0FBUyxZQUFZLE1BQU07Z0JBQ3ZCOztnQkFFQSxJQUFJLGtCQUFrQjs7b0JBRWxCLElBQUksT0FBTyxNQUFNLEdBQUc7d0JBQ2hCLFlBQVk7d0JBQ1o7O3dCQUVBLElBQUksZUFBZSxpQkFBaUIsUUFBUTs0QkFDeEMsbUJBQW1COzs7O3VCQUl4QjtvQkFDSCxtQkFBbUIsRUFBRSxPQUFPLE1BQU0sV0FBVyxPQUFPLFVBQVU7b0JBQzlELGNBQWM7Ozs7Ozs7O0lBTzlCLFFBQVEsT0FBTztTQUNWLFFBQVEsVUFBVTs7S0FFdEI7QUN6SUw7OztBQUdBLENBQUMsWUFBWTs7SUFFVDs7SUFFQSxTQUFTLFNBQVM7UUFDZCxPQUFPO1lBQ0gsZ0JBQWdCO1lBQ2hCLFdBQVc7O1lBRVgscUJBQXFCOzs7O0lBSTdCLFFBQVEsT0FBTztTQUNWLFFBQVEsVUFBVTs7S0FFdEI7QUNuQkw7OztBQUdBLENBQUMsWUFBWTs7SUFFVDs7Ozs7SUFLQSxTQUFTLGVBQWU7O1FBRXBCLElBQUksVUFBVTtZQUNWO2dCQUNJO29CQUNJLE1BQU07b0JBQ04sSUFBSTtvQkFDSixJQUFJO29CQUNKLE9BQU8sS0FBSyxLQUFLLEdBQUcsS0FBSzs7Z0JBRTdCO29CQUNJLE1BQU07b0JBQ04sSUFBSTtvQkFDSixJQUFJO29CQUNKLE9BQU8sS0FBSyxLQUFLLEdBQUcsS0FBSzs7Ozs7UUFLckMsU0FBUyxNQUFNLE9BQU87WUFDbEIsUUFBUSxLQUFLLElBQUksR0FBRyxLQUFLLElBQUksT0FBTyxRQUFRLFNBQVM7O1lBRXJELElBQUksU0FBUyxFQUFFLE9BQU8sUUFBUTtZQUM5QixRQUFRLE9BQU8sTUFBTSxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsT0FBTyxJQUFJLEtBQUssT0FBTzs7Ozs7OztRQU92RSxNQUFNLFVBQVUsWUFBWSxZQUFZO1lBQ3BDLElBQUksUUFBUSxLQUFLLEdBQUcsVUFBVSxLQUFLLEdBQUc7WUFDdEMsSUFBSSxTQUFTLE1BQU07Z0JBQ2YsT0FBTzttQkFDSixJQUFJLFNBQVMsTUFBTTtnQkFDdEIsT0FBTzs7WUFFWCxPQUFPOzs7O1FBSVgsTUFBTSxVQUFVLFNBQVMsVUFBVSxRQUFRO1lBQ3ZDLEtBQUssR0FBRyxXQUFXOzs7O1FBSXZCLE1BQU0sVUFBVSxPQUFPLFVBQVUsUUFBUTtZQUNyQyxLQUFLLEdBQUcsVUFBVSxNQUFNLE1BQU0sS0FBSyxHQUFHLFVBQVUsUUFBUSxHQUFHLEtBQUssR0FBRzs7OztRQUl2RSxNQUFNLFVBQVUsU0FBUyxZQUFZO1lBQ2pDLE9BQU8sS0FBSyxHQUFHLFdBQVc7Ozs7UUFJOUIsTUFBTSxVQUFVLFNBQVMsVUFBVSxPQUFPOzs7WUFHdEMsSUFBSSxZQUFZLEVBQUUsT0FBTyxPQUFPLFVBQVUsR0FBRztnQkFDekMsT0FBTyxDQUFDLEVBQUU7OztZQUdkLElBQUksVUFBVSxXQUFXLEdBQUc7Z0JBQ3hCLE9BQU87b0JBQ0gsU0FBUztvQkFDVCxRQUFROzs7O1lBSWhCLElBQUksYUFBYSxFQUFFLE9BQU87O1lBRTFCLElBQUksTUFBTSxLQUFLLE1BQU0sS0FBSyxXQUFXLEtBQUs7WUFDMUMsSUFBSTtZQUNKLElBQUksTUFBTSxHQUFHO2dCQUNULE1BQU0sS0FBSyxPQUFPLGNBQWMsV0FBVyxPQUFPLFVBQVUsTUFBTTttQkFDL0Q7Z0JBQ0gsTUFBTSxLQUFLLE9BQU8sYUFBYSxXQUFXLE9BQU87OztZQUdyRCxXQUFXLE9BQU87WUFDbEIsSUFBSSxXQUFXLFVBQVU7Z0JBQ3JCLE9BQU8sTUFBTSxXQUFXLE9BQU87O1lBRW5DLE9BQU87Z0JBQ0gsUUFBUTtnQkFDUixRQUFRO2dCQUNSLFNBQVM7Ozs7UUFJakIsT0FBTzs7O0lBR1gsUUFBUSxPQUFPO1NBQ1YsUUFBUSxTQUFTOztBQUUxQjtBQzNHQTs7O0FBR0EsQ0FBQyxZQUFZOztJQUVUOztJQUVBLElBQUksT0FBTzs7Ozs7SUFLWCxTQUFTLFVBQVUsWUFBWSxXQUFXLFFBQVE7O1FBRTlDLEtBQUssU0FBUzs7OztRQUlkLElBQUksUUFBUSxVQUFVLFlBQVk7WUFDOUI7V0FDRCxPQUFPLE9BQU87O1FBRWpCLFdBQVcsSUFBSSxZQUFZLFlBQVk7WUFDbkMsVUFBVSxPQUFPOzs7OztRQUtyQixTQUFTLE9BQU8sT0FBTyxTQUFTO1lBQzVCLE9BQU8sTUFBTSxJQUFJLE1BQU0sVUFBVSxHQUFHLE1BQU07Z0JBQ3RDLFFBQVE7Ozs7UUFJaEIsU0FBUyxPQUFPO1lBQ1osV0FBVyxXQUFXLE1BQU07Ozs7O0lBSXBDLFFBQVEsT0FBTztTQUNWLFFBQVEsYUFBYTs7S0FFekI7QUMxQ0w7OztBQUdBLENBQUMsWUFBWTs7SUFFVDs7Ozs7O0lBTUEsU0FBUyxLQUFLLFlBQVksUUFBUSxXQUFXLE9BQU8sT0FBTyxTQUFTLFdBQVcsV0FBVyxVQUFVOztRQUVoRyxJQUFJLE9BQU87O1FBRVgsVUFBVSxPQUFPLFlBQVksVUFBVSxNQUFNO1lBQ3pDLFFBQVEsWUFBWTtZQUNwQixTQUFTLFlBQVk7WUFDckIsVUFBVSxZQUFZOzs7O1FBSTFCLFVBQVUsZUFBZTtRQUN6QixVQUFVLFVBQVUsSUFBSSxjQUFjOzs7O1FBSXRDLEtBQUssS0FBSztRQUNWLEtBQUssVUFBVTtRQUNmLEtBQUssYUFBYTtRQUNsQixLQUFLLFdBQVc7UUFDaEIsS0FBSyxRQUFRLE1BQU07UUFDbkIsS0FBSyxZQUFZO1FBQ2pCLEtBQUssaUJBQWlCO1FBQ3RCLEtBQUssV0FBVyxTQUFTOzs7OztRQUt6QixTQUFTLHFCQUFxQjtZQUMxQixPQUFPLEVBQUUsT0FBTyxXQUFXOzs7O1FBSS9CLFNBQVMsa0JBQWtCO1lBQ3ZCLE9BQU8sVUFBVTs7OztRQUlyQixTQUFTLFVBQVU7WUFDZixVQUFVOzs7O1FBSWQsU0FBUyxhQUFhO1lBQ2xCLE9BQU8sT0FBTyxRQUFRLFNBQVM7Ozs7UUFJbkMsU0FBUyxlQUFlLFVBQVUsUUFBUSxLQUFLO1lBQzNDLElBQUksTUFBTSxVQUFVO1lBQ3BCLElBQUksQ0FBQyxLQUFLO2dCQUNOLE1BQU0sQ0FBQyxNQUFNLFVBQVUsU0FBUyxHQUFHLEtBQUssS0FBSyxTQUFTO2dCQUN0RCxVQUFVLFlBQVk7O1lBRTFCLElBQUksSUFBSSxLQUFLO2dCQUNULElBQUksVUFBVSxNQUFNLE1BQU0sSUFBSSxVQUFVLFFBQVEsR0FBRyxJQUFJO21CQUNwRDtnQkFDSCxJQUFJLFdBQVc7Ozs7OztJQUszQixRQUFRLE9BQU87U0FDVixRQUFRLFFBQVE7OztBQUd6QjtBQzdFQTs7O0FBR0EsQ0FBQyxZQUFZOztJQUVUOztJQUVBLFNBQVMsV0FBVyxRQUFRLFVBQVU7UUFDbEMsT0FBTyxZQUFZO1lBQ2YsT0FBTzs7OztJQUlmLFNBQVMscUJBQXFCLFFBQVEsbUJBQW1CLFNBQVM7UUFDOUQsSUFBSSxPQUFPO1FBQ1gsSUFBSSxrQkFBa0Isb0JBQW9CLE9BQU87UUFDakQsT0FBTyxVQUFVLE1BQU07WUFDbkI7WUFDQSxJQUFJLFFBQVEsaUJBQWlCO2dCQUN6QixPQUFPO2dCQUNQLFFBQVE7Ozs7Ozs7Ozs7SUFVcEIsU0FBUyxVQUFVLFFBQVEsSUFBSSxRQUFRLGdCQUFnQixTQUFTLEtBQUs7O1FBRWpFLElBQUksT0FBTztZQUNQLGFBQWEsUUFBUTtZQUNyQjs7UUFFSixLQUFLLG9CQUFvQjtRQUN6QixLQUFLLGlCQUFpQjtRQUN0QixLQUFLLFVBQVU7UUFDZixLQUFLLFVBQVU7UUFDZixLQUFLLFlBQVk7UUFDakIsS0FBSyxjQUFjO1FBQ25CLEtBQUssMEJBQTBCOzs7O1FBSS9CLFNBQVMsZUFBZSxhQUFhLFNBQVM7WUFDMUMsT0FBTyxZQUFZO2dCQUNmLElBQUksS0FBSyxtQkFBbUI7b0JBQ3hCLElBQUksU0FBUyxFQUFFLFVBQVUsS0FBSyxXQUFXLENBQUMsSUFBSTtvQkFDOUMsSUFBSSxXQUFXLGlCQUFpQjt3QkFDNUIsUUFBUTt3QkFDUixrQkFBa0I7d0JBQ2xCLGdCQUFnQixhQUFhO3dCQUM3QixlQUFlLFFBQVE7OzJCQUVwQjt3QkFDSCxlQUFlLFFBQVE7Ozt1QkFHeEI7b0JBQ0gsZUFBZSxRQUFROzs7OztRQUtuQyxTQUFTLGtCQUFrQjtZQUN2QixPQUFPOztnQkFFSDtvQkFDSSxJQUFJO29CQUNKLE1BQU07b0JBQ04sS0FBSyxJQUFJLElBQUksQ0FBQyxPQUFPLEdBQUcsWUFBWSxHQUFHLFdBQVc7b0JBQ2xELFlBQVk7b0JBQ1osUUFBUSxxQkFBcUIsUUFBUSxPQUFPLHFCQUFxQixVQUFVLE1BQU07d0JBQzdFLElBQUksUUFBUSxLQUFLO3dCQUNqQixJQUFJLGFBQWE7O3dCQUVqQixLQUFLLElBQUksSUFBSSxHQUFHLElBQUksTUFBTSxRQUFRLEtBQUs7NEJBQ25DLE1BQU0sR0FBRyxLQUFLOzs7b0JBR3RCLFNBQVM7d0JBQ0w7NEJBQ0ksTUFBTTs0QkFDTixRQUFRLFlBQVk7O2dDQUVoQixlQUFlLFFBQVE7Ozt3QkFHL0I7NEJBQ0ksTUFBTTs0QkFDTixRQUFRLFlBQVk7Ozs7d0JBSXhCOzRCQUNJLE1BQU07NEJBQ04sUUFBUSxlQUFlLFVBQVU7Ozs7OztnQkFNN0M7b0JBQ0ksSUFBSTtvQkFDSixNQUFNO29CQUNOLEtBQUssSUFBSSxJQUFJLENBQUMsT0FBTyxHQUFHLFlBQVksR0FBRyxXQUFXLE9BQU8sS0FBSyxXQUFXO29CQUN6RSxZQUFZO29CQUNaLFVBQVU7d0JBQ04sQ0FBQyxNQUFNLFFBQVEsS0FBSzs7b0JBRXhCLE9BQU87d0JBQ0gsQ0FBQyxNQUFNLGFBQWEsS0FBSzs7b0JBRTdCLFNBQVM7d0JBQ0w7NEJBQ0ksTUFBTTs0QkFDTixRQUFRLGVBQWUsUUFBUTs7d0JBRW5DLFdBQVc7d0JBQ1gsV0FBVzt3QkFDWDs0QkFDSSxNQUFNOzRCQUNOLFFBQVE7NEJBQ1IsWUFBWTs0QkFDWixTQUFTOzRCQUNULFFBQVEsZUFBZSxtQkFBbUI7Ozs7OztnQkFNdEQ7b0JBQ0ksSUFBSTtvQkFDSixNQUFNO29CQUNOLEtBQUssSUFBSSxJQUFJLENBQUMsT0FBTyxHQUFHLFlBQVksSUFBSSxXQUFXO29CQUNuRCxZQUFZO29CQUNaLFVBQVU7d0JBQ04sQ0FBQyxNQUFNLFFBQVEsS0FBSzs7b0JBRXhCLFNBQVM7d0JBQ0w7NEJBQ0ksTUFBTTs0QkFDTixRQUFRLGVBQWUsVUFBVTs7Ozs7Ozs7UUFRckQsU0FBUyxVQUFVO1lBQ2YsSUFBSSxNQUFNLGdCQUFnQjtZQUMxQixJQUFJLEtBQUssSUFBSSxRQUFROzs7UUFHekIsU0FBUyxxQkFBcUI7WUFDMUIsT0FBTzs7O1FBR1gsU0FBUyxZQUFZLE1BQU07WUFDdkIsSUFBSSxnQkFBZ0IsUUFBUTtnQkFDeEIsZ0JBQWdCLE9BQU87Ozs7UUFJL0IsU0FBUyx3QkFBd0IsV0FBVztZQUN4QyxLQUFLLG9CQUFvQjs7Ozs7SUFJakMsUUFBUSxPQUFPO1NBQ1YsUUFBUSxhQUFhO0tBQ3pCO0FDOUtMOzs7QUFHQSxDQUFDLFlBQVk7O0lBRVQ7Ozs7OztJQU1BLFNBQVMsTUFBTSxXQUFXOztRQUV0QixJQUFJLGFBQWE7WUFDYixVQUFVLE9BQU8sQ0FBQyxNQUFNLGNBQWMsT0FBTztZQUM3QyxVQUFVLE9BQU8sQ0FBQyxNQUFNLHNCQUFzQixPQUFPO1lBQ3JELFVBQVUsT0FBTyxDQUFDLE1BQU0sb0JBQW9CLE9BQU87WUFDbkQsVUFBVSxPQUFPLENBQUMsTUFBTSxrQkFBa0IsT0FBTztZQUNqRCxVQUFVLE9BQU8sQ0FBQyxNQUFNLHVCQUF1QixPQUFPO1lBQ3RELFVBQVUsT0FBTyxDQUFDLE1BQU0scUJBQXFCLE9BQU87OztRQUd4RCxLQUFLLGFBQWE7Ozs7Ozs7OztJQVF0QixNQUFNLFVBQVUsU0FBUyxZQUFZO1FBQ2pDLE9BQU8sRUFBRSxJQUFJLEtBQUssWUFBWSxVQUFVLEdBQUc7WUFDdkMsT0FBTyxFQUFFOzs7O0lBSWpCLFFBQVEsT0FBTztTQUNWLFFBQVEsU0FBUzs7S0FFckI7QUN2Q0w7OztBQUdBLENBQUMsWUFBWTs7SUFFVDs7SUFFQSxTQUFTLFlBQVk7O1FBRWpCLE9BQU87WUFDSCxJQUFJO2dCQUNBLE1BQU07Z0JBQ04sU0FBUztnQkFDVCxTQUFTOzs7WUFHYixNQUFNO2dCQUNGLE1BQU07Z0JBQ04sU0FBUztnQkFDVCxTQUFTO2dCQUNULEtBQUs7OztZQUdULE1BQU07Z0JBQ0YsTUFBTTtnQkFDTixTQUFTO2dCQUNULFNBQVM7OztZQUdiLE1BQU07Z0JBQ0YsTUFBTTtnQkFDTixTQUFTO2dCQUNULEtBQUs7Ozs7O0lBS2pCLFFBQVEsT0FBTztTQUNWLFFBQVEsYUFBYTs7S0FFekI7QUN4Q0w7OztBQUdBLENBQUMsWUFBWTs7SUFFVDs7SUFFQSxJQUFJLGlCQUFpQjs7Ozs7O0lBTXJCLFNBQVMsZUFBZSxZQUFZOztRQUVoQyxLQUFLLFVBQVU7UUFDZixLQUFLLFlBQVk7O1FBRWpCLFNBQVMsUUFBUSxRQUFRO1lBQ3JCLFdBQVcsV0FBVyxnQkFBZ0IsQ0FBQyxTQUFTOzs7UUFHcEQsU0FBUyxVQUFVLE9BQU8sU0FBUztZQUMvQixNQUFNLElBQUksZ0JBQWdCLFVBQVUsR0FBRyxNQUFNO2dCQUN6QyxRQUFROzs7Ozs7SUFLcEIsUUFBUSxPQUFPO1NBQ1YsUUFBUSxrQkFBa0I7S0FDOUI7QUMvQkw7OztBQUdBLENBQUMsWUFBWTs7SUFFVDs7Ozs7SUFLQSxTQUFTLFNBQVMsV0FBVyxTQUFTOztRQUVsQyxJQUFJLE9BQU87O1FBRVgsS0FBSyxhQUFhO1FBQ2xCLEtBQUssU0FBUztRQUNkLEtBQUssY0FBYztRQUNuQixLQUFLLHFCQUFxQjs7WUFFdEIsYUFBYTtnQkFDVCxNQUFNO2dCQUNOLGFBQWE7Z0JBQ2IsUUFBUTtnQkFDUixXQUFXO2dCQUNYLFVBQVU7b0JBQ04sSUFBSTs7Ozs7WUFLWixTQUFTO2dCQUNMLE1BQU07Z0JBQ04sYUFBYTtnQkFDYixRQUFRO2dCQUNSLFdBQVc7Z0JBQ1gsVUFBVTtvQkFDTixJQUFJOzs7OztZQUtaLFlBQVk7Z0JBQ1IsTUFBTTtnQkFDTixhQUFhO2dCQUNiLFFBQVE7Z0JBQ1IsZ0JBQWdCLFlBQVk7b0JBQ3hCLE9BQU8sVUFBVSxTQUFTLFVBQVUsTUFBTSxVQUFVOztnQkFFeEQsVUFBVTtvQkFDTixPQUFPOzs7OztZQUtmLGFBQWE7Z0JBQ1QsTUFBTTtnQkFDTixhQUFhO2dCQUNiLFFBQVE7Z0JBQ1IsZ0JBQWdCLFlBQVk7b0JBQ3hCLE9BQU87O2dCQUVYLFVBQVU7b0JBQ04sSUFBSTs7Ozs7OztRQU9oQixTQUFTLFlBQVksTUFBTTs7O1lBR3ZCOztZQUVBLElBQUksQ0FBQyxLQUFLLGNBQWM7Ozs7OztRQU01QixTQUFTLGNBQWMsTUFBTTtZQUN6QixJQUFJLEtBQUssbUJBQW1CLFlBQVksVUFBVSxDQUFDLEtBQUssY0FBYztnQkFDbEUsSUFBSSxTQUFTLFFBQVEsa0JBQWtCO2dCQUN2QyxRQUFRLFNBQVMsTUFBTTs7OztRQUkvQixTQUFTLE9BQU8sU0FBUztZQUNyQixJQUFJLFFBQVEsVUFBVTtnQkFDbEIsSUFBSSxNQUFNO2dCQUNWLEtBQUssSUFBSSxZQUFZLFFBQVEsVUFBVTtvQkFDbkMsSUFBSSxRQUFRLFNBQVMsZUFBZSxXQUFXO3dCQUMzQyxJQUFJLENBQUMsVUFBVSxhQUFhLFVBQVUsVUFBVSxVQUFVLFFBQVEsU0FBUyxXQUFXOzRCQUNsRixNQUFNOzs7O2dCQUlsQixPQUFPOzttQkFFSjtnQkFDSCxPQUFPOzs7O1FBSWYsU0FBUyxvQkFBb0I7WUFDekIsUUFBUSxRQUFRLEtBQUssb0JBQW9CLFVBQVUsU0FBUztnQkFDeEQsSUFBSSxDQUFDLFFBQVEsUUFBUTtvQkFDakIsSUFBSSxRQUFRLGdCQUFnQjt3QkFDeEIsSUFBSSxRQUFRLGtCQUFrQjs7NEJBRTFCLFFBQVEsaUJBQWlCOzRCQUN6QixRQUFRLFlBQVk7OztvQkFHNUIsSUFBSSxRQUFRLFdBQVc7O3dCQUVuQixRQUFRLGNBQWMsT0FBTzs7Ozs7O1FBTTdDLFNBQVMsV0FBVyxTQUFTO1lBQ3pCLElBQUksT0FBTyxVQUFVO2dCQUNqQixLQUFLLElBQUksWUFBWSxRQUFRLFVBQVU7b0JBQ25DLElBQUksUUFBUSxTQUFTLGVBQWUsV0FBVzt3QkFDM0MsVUFBVSxVQUFVLFdBQVcsUUFBUSxTQUFTOzs7Z0JBR3hELFFBQVEsU0FBUzs7Ozs7Ozs7SUFPN0IsUUFBUSxPQUFPO1NBQ1YsUUFBUSxZQUFZOztLQUV4QjtBQzNJTDs7O0FBR0EsQ0FBQyxZQUFZOztJQUVUOztJQUVBLFNBQVMsUUFBUTs7UUFFYixLQUFLLFFBQVE7UUFDYixLQUFLLFlBQVk7UUFDakIsS0FBSyxnQkFBZ0I7UUFDckIsS0FBSyxjQUFjOzs7O1FBSW5CLFNBQVMsTUFBTSxPQUFPLEtBQUssS0FBSztZQUM1QixPQUFPLEtBQUssSUFBSSxLQUFLLElBQUksS0FBSyxRQUFROzs7UUFHMUMsU0FBUyxVQUFVLEtBQUssS0FBSztZQUN6QixJQUFJLE9BQU8sTUFBTTtZQUNqQixPQUFPLEtBQUssTUFBTSxDQUFDLEtBQUssV0FBVyxRQUFROzs7UUFHL0MsU0FBUyxZQUFZLEtBQUssS0FBSztZQUMzQixJQUFJLE9BQU8sTUFBTTtZQUNqQixPQUFPLENBQUMsS0FBSyxXQUFXLFFBQVE7OztRQUdwQyxTQUFTLGNBQWMsT0FBTyxnQkFBZ0IsWUFBWTtZQUN0RCxJQUFJLFlBQVksVUFBVSxNQUFNO2dCQUM1QixJQUFJLFNBQVM7Z0JBQ2IsSUFBSSxZQUFZO29CQUNaLFVBQVUsS0FBSzt1QkFDWjtvQkFDSCxVQUFVLEtBQUs7O2dCQUVuQixPQUFPOztZQUVYLElBQUksZUFBZSxFQUFFLE9BQU8sT0FBTyxVQUFVLFFBQVEsR0FBRyxLQUFLO2dCQUN6RCxVQUFVLFVBQVU7Z0JBQ3BCLE9BQU87ZUFDUjtZQUNILElBQUksY0FBYyxVQUFVLEdBQUc7WUFDL0IsSUFBSSxRQUFRO1lBQ1osS0FBSyxJQUFJLElBQUksR0FBRyxJQUFJLE1BQU0sUUFBUSxLQUFLO2dCQUNuQyxTQUFTLFVBQVUsTUFBTTtnQkFDekIsSUFBSSxTQUFTO29CQUNULE9BQU8sTUFBTTs7WUFFckIsT0FBTyxNQUFNLE1BQU0sU0FBUzs7OztJQUlwQyxRQUFRLE9BQU87U0FDVixRQUFRLFNBQVM7O0tBRXJCO0FDMURMOzs7QUFHQSxDQUFDLFdBQVc7O0lBRVI7Ozs7S0FJQztBQ1RMOzs7QUFHQSxDQUFDLFlBQVk7O0lBRVQ7Ozs7OztJQU1BLFNBQVMsaUJBQWlCLFFBQVEsT0FBTyxXQUFXO1FBQ2hELElBQUksTUFBTSxPQUFPLFlBQVk7UUFDN0IsSUFBSSxZQUFZLFVBQVUsS0FBSyxDQUFDLElBQUk7UUFDcEMsSUFBSSxLQUFLOztRQUVULFFBQVEsT0FBTyxXQUFXOztZQUV0QixRQUFRLFVBQVUsTUFBTTtnQkFDcEIsT0FBTyxRQUFRO2dCQUNmLElBQUksT0FBTyxJQUFJLFVBQVUsQ0FBQyxJQUFJLEtBQUssTUFBTTs7Z0JBRXpDLEtBQUssT0FBTyxLQUFLLFFBQVE7Z0JBQ3pCLEtBQUssUUFBUSxLQUFLO2dCQUNsQixLQUFLLFFBQVE7Z0JBQ2IsS0FBSyxLQUFLLENBQUMsU0FBUyxJQUFJLEtBQUs7Z0JBQzdCLEtBQUssS0FBSyxDQUFDLFNBQVMsSUFBSSxLQUFLO2dCQUM3QixLQUFLLE1BQU07Z0JBQ1gsS0FBSyxNQUFNO2dCQUNYLEtBQUssUUFBUTtnQkFDYixLQUFLLFFBQVE7Z0JBQ2IsS0FBSyxLQUFLOztnQkFFVixPQUFPOzs7O1FBSWYsVUFBVSxVQUFVLFNBQVMsVUFBVSxRQUFRO1lBQzNDLEtBQUssR0FBRyxXQUFXOzs7UUFHdkIsVUFBVSxVQUFVLE9BQU8sVUFBVSxRQUFRO1lBQ3pDLEtBQUssR0FBRyxVQUFVLE1BQU0sTUFBTSxLQUFLLEdBQUcsVUFBVSxRQUFRLEdBQUcsS0FBSyxHQUFHOzs7UUFHdkUsVUFBVSxVQUFVLFNBQVMsWUFBWTtZQUNyQyxPQUFPLEtBQUssR0FBRyxXQUFXOzs7UUFHOUIsVUFBVSxVQUFVLFNBQVMsVUFBVSxTQUFTO1lBQzVDLElBQUksQ0FBQyxXQUFXLFFBQVEsV0FBVyxHQUFHO2dCQUNsQyxPQUFPO29CQUNILFNBQVM7b0JBQ1QsU0FBUzs7Ozs7O1lBTWpCLElBQUksY0FBYyxNQUFNLGNBQWMsU0FBUyxhQUFhOztZQUU1RCxJQUFJLE1BQU0sS0FBSyxNQUFNLEtBQUssV0FBVyxLQUFLO1lBQzFDLElBQUk7WUFDSixJQUFJLE1BQU0sR0FBRztnQkFDVCxNQUFNLEtBQUssT0FBTyxjQUFjLFlBQVksT0FBTyxVQUFVLE1BQU07bUJBQ2hFO2dCQUNILE1BQU0sS0FBSyxPQUFPLGFBQWEsWUFBWSxPQUFPOztZQUV0RCxJQUFJLEtBQUs7O1lBRVQsWUFBWSxPQUFPO1lBQ25CLElBQUksWUFBWSxVQUFVO2dCQUN0QixLQUFLLElBQUksSUFBSSxHQUFHLElBQUksUUFBUSxRQUFRLEtBQUs7b0JBQ3JDLElBQUksUUFBUSxPQUFPLGFBQWE7d0JBQzVCLFFBQVEsT0FBTyxHQUFHOzs7Z0JBRzFCLE9BQU8sTUFBTSxZQUFZLE9BQU87Z0JBQ2hDLEtBQUssWUFBWTs7WUFFckIsT0FBTztnQkFDSCxRQUFRO2dCQUNSLFFBQVE7Z0JBQ1IsU0FBUztnQkFDVCxJQUFJOzs7O1FBSVosT0FBTzs7OztJQUdYLFFBQVEsT0FBTztTQUNWLFFBQVEsYUFBYTtLQUN6QiIsImZpbGUiOiJhcHBsaWNhdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjIvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKiBAcGFyYW0gJHN0YXRlUHJvdmlkZXJcbiAgICAgKiBAcGFyYW0gJHVybFJvdXRlclByb3ZpZGVyXG4gICAgICovXG4gICAgZnVuY3Rpb24gYXBwQ29uZmlnKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcblxuICAgICAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvbWFpbicpO1xuXG4gICAgICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgICAgICAgICAuc3RhdGUoJ21haW4nLCB7XG4gICAgICAgICAgICAgICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgICAgICAgICAgICAgdXJsOiAnL21haW4nLFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3BhcnRpYWxzL21haW4uaHRtbCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ01haW5Db250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyQXM6ICd2bSdcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIC5zdGF0ZSgnbWFpbi5hY3Rpb25zJywge1xuICAgICAgICAgICAgICAgIHVybDogJycsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvYWN0aW9ucy5odG1sJ1xuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgLnN0YXRlKCdtYWluLmNoYXJhY3RlclN0YXR1cycsIHtcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgICAgICAgICAgY2hhcmFjdGVyOiBudWxsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy9jaGFyYWN0ZXJTdGF0dXMuaHRtbCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0NoYXJhY3RlclN0YXR1c0NvbnRyb2xsZXInLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJ3ZtJ1xuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgLnN0YXRlKCdtYWluLmJhdHRsZScsIHtcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgICAgICAgICAgYmF0dGxlOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlOiBudWxsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy9iYXR0bGUuaHRtbCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0JhdHRsZUNvbnRyb2xsZXInLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJ3ZtJ1xuICAgICAgICAgICAgfSlcbiAgICAgICAgO1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJywgWyd1aS5yb3V0ZXInLCAnbmdSZXNvdXJjZSddKVxuICAgICAgICAuY29uZmlnKGFwcENvbmZpZylcbiAgICAgICAgLnJ1bihbJyRyb290U2NvcGUnLCAnJHN0YXRlJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRzdGF0ZSkge1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbiAoZXZlbnQsIHRvLCB0b1BhcmFtcywgZnJvbSwgZnJvbVBhcmFtcykge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5wcmV2aW91cyA9IGZyb207XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kcHJldmlvdXNTdGF0ZSA9IGZyb207XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfV0pO1xufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzI4LzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyoqXG4gICAgICogQG5nSW5qZWN0XG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgZnVuY3Rpb24gQmF0dGxlQ29udHJvbGxlcigkc3RhdGUsICRzY29wZSwgc3RhdHVzTWVzc2FnZXMsIGxvY2F0aW9ucykge1xuICAgICAgICB2YXIgYmF0dGxlID0gJHN0YXRlLnBhcmFtcy5iYXR0bGUsXG4gICAgICAgICAgICBwcm9taXNlID0gJHN0YXRlLnBhcmFtcy5wcm9taXNlLFxuICAgICAgICAgICAgcHJldlN0YXRlID0gJHN0YXRlLnByZXZpb3VzIHx8ICdtYWluLmFjdGlvbnMnLFxuICAgICAgICAgICAgc2VsZiA9IHRoaXM7XG5cblxuICAgICAgICB2YXIgdGljayA9IDA7XG4gICAgICAgIHZhciB4cCA9IDA7XG4gICAgICAgIHZhciByZXN1bHRzID0gbnVsbDtcblxuICAgICAgICB0aGlzLmVuZW1pZXMgPSBiYXR0bGUuZW5lbWllcztcbiAgICAgICAgdGhpcy5tZXNzYWdlcyA9IGJhdHRsZS5tZXNzYWdlcztcbiAgICAgICAgLy9cbiAgICAgICAgLy9ldmVudExvb3Aub25UaWNrKCRzY29wZSwgZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgLy8gICAgdGljaysrO1xuICAgICAgICAvL1xuICAgICAgICAvLyAgICBpZiAodGljayAlIDMgPT09IDApIHtcbiAgICAgICAgLy8gICAgICAgIGlmIChyZXN1bHRzID09PSBudWxsKSB7XG4gICAgICAgIC8vICAgICAgICAgICAgcmVzdWx0cyA9IGJhdHRsZS5wcm9jZXNzUm91bmQoKTtcbiAgICAgICAgLy8gICAgICAgIH1cbiAgICAgICAgLy8gICAgICAgIHZhciByZXMgPSByZXN1bHRzLnNoaWZ0KCk7XG4gICAgICAgIC8vICAgICAgICBzZWxmLm1lc3NhZ2VzLnVuc2hpZnQocmVzKTtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gICAgICAgIGlmIChyZXMueHAgJiYgcmVzLnhwID4gMCkge1xuICAgICAgICAvLyAgICAgICAgICAgIHhwICs9IHJlcy54cDtcbiAgICAgICAgLy8gICAgICAgIH1cbiAgICAgICAgLy8gICAgICAgIGlmIChyZXN1bHRzLmxlbmd0aCA9PT0gMCB8fCByZXMudmljdG9yeSkge1xuICAgICAgICAvLyAgICAgICAgICAgIHJlc3VsdHMgPSBudWxsO1xuICAgICAgICAvLyAgICAgICAgfVxuICAgICAgICAvL1xuICAgICAgICAvLyAgICAgICAgaWYgKHJlcy52aWN0b3J5KSB7XG4gICAgICAgIC8vICAgICAgICAgICAgcmVzdWx0cyA9IG51bGw7XG4gICAgICAgIC8vICAgICAgICAgICAgcHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgeHA6IHhwXG4gICAgICAgIC8vICAgICAgICAgICAgfSk7XG4gICAgICAgIC8vICAgICAgICAgICAgc3RhdHVzTWVzc2FnZXMubWVzc2FnZShcIllvdSBhcmUgdmljdG9yaW91cyBhbmQgZ2FpbiBcIiArIHhwICsgXCIgeHAuXCIpO1xuICAgICAgICAvLyAgICAgICAgICAgICRzdGF0ZS5nbyhwcmV2U3RhdGUgfHwgJ21haW4uYWN0aW9ucycpO1xuICAgICAgICAvLyAgICAgICAgfSBlbHNlIGlmIChyZXMuZGVmZWF0KSB7XG4gICAgICAgIC8vICAgICAgICAgICAgcmVzdWx0cyA9IG51bGw7XG4gICAgICAgIC8vICAgICAgICAgICAgcHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgeHA6IDBcbiAgICAgICAgLy8gICAgICAgICAgICB9KTtcbiAgICAgICAgLy8gICAgICAgICAgICBwcm9taXNlID0gbnVsbDtcbiAgICAgICAgLy8gICAgICAgICAgICBzdGF0dXNNZXNzYWdlcy5tZXNzYWdlKFwiWW91IGhhdmUgYmVlbiBkZWZlYXRlZC5cIik7XG4gICAgICAgIC8vICAgICAgICAgICAgJHN0YXRlLmdvKHByZXZTdGF0ZSB8fCAnbWFpbi5hY3Rpb25zJyk7XG4gICAgICAgIC8vICAgICAgICB9XG4gICAgICAgIC8vICAgIH1cbiAgICAgICAgLy99KTtcblxuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmNvbnRyb2xsZXIoJ0JhdHRsZUNvbnRyb2xsZXInLCBCYXR0bGVDb250cm9sbGVyKTtcblxufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzI3LzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyoqXG4gICAgICogQG5nSW5qZWN0XG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgZnVuY3Rpb24gQ2hhcmFjdGVyU3RhdHVzQ29udHJvbGxlcigkc3RhdGUpIHtcbiAgICAgICAgdmFyIGNoYXJhY3RlciA9ICRzdGF0ZS5wYXJhbXMuY2hhcmFjdGVyO1xuXG4gICAgICAgIHRoaXMuY2hhcmFjdGVyID0gY2hhcmFjdGVyO1xuICAgICAgICB0aGlzLmdvQmFjayA9IGdvQmFjaztcblxuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgIGZ1bmN0aW9uIGdvQmFjaygpIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnbWFpbi5hY3Rpb25zJyk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmNvbnRyb2xsZXIoJ0NoYXJhY3RlclN0YXR1c0NvbnRyb2xsZXInLCBDaGFyYWN0ZXJTdGF0dXNDb250cm9sbGVyKTtcblxufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzIyLzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyoqXG4gICAgICogQG5nSW5qZWN0XG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgZnVuY3Rpb24gTWFpbkNvbnRyb2xsZXIoJHNjb3BlLCAkc3RhdGUsIGdhbWUsIGFjdGlvbnMsIHN0YXR1c01lc3NhZ2VzLCBsb2NhdGlvbnMsIHVwZ3JhZGVzKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMuYWN0aW9ucyA9IGFjdGlvbnMuYWN0aW9uRGVmaW5pdGlvbnM7XG4gICAgICAgIHRoaXMuYnV5VXBncmFkZSA9IGJ1eVVwZ3JhZGU7XG4gICAgICAgIHRoaXMuY2hhcmFjdGVySW5mbyA9IGNoYXJhY3RlckluZm87XG4gICAgICAgIHRoaXMuY2hhbmdlTG9jYXRpb24gPSBsb2NhdGlvbnMuY2hhbmdlTG9jYXRpb247XG4gICAgICAgIHRoaXMuZ2V0QXZhaWxhYmxlQWN0aW9ucyA9IGdldEF2YWlsYWJsZUFjdGlvbnM7XG4gICAgICAgIHRoaXMuZ2V0QXZhaWxhYmxlVXBncmFkZXMgPSBnZXRBdmFpbGFibGVVcGdyYWRlcztcbiAgICAgICAgdGhpcy5nZXRMb2NhdGlvbiA9IGdldExvY2F0aW9uO1xuICAgICAgICB0aGlzLmdldFBhcnR5ID0gZ2V0UGFydHk7XG4gICAgICAgIHRoaXMuZ2V0VXBncmFkZURlc2NyaXB0aW9uID0gZ2V0VXBncmFkZURlc2NyaXB0aW9uO1xuICAgICAgICB0aGlzLmxvY2F0aW9ucyA9IGxvY2F0aW9ucy5sb2NhdGlvbnM7XG4gICAgICAgIHRoaXMubWVzc2FnZXMgPSBbXTtcbiAgICAgICAgdGhpcy5yZXNvdXJjZXMgPSBnYW1lLnJlc291cmNlcztcblxuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgc3RhdHVzTWVzc2FnZXMub25NZXNzYWdlKCRzY29wZSwgZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgIHNlbGYubWVzc2FnZXMudW5zaGlmdCh7dGV4dDogYXJncy5tZXNzYWdlfSk7XG4gICAgICAgICAgICBpZiAoc2VsZi5tZXNzYWdlcy5sZW5ndGggPiAyMCkge1xuICAgICAgICAgICAgICAgIHNlbGYubWVzc2FnZXMucG9wKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgZnVuY3Rpb24gYnV5VXBncmFkZSh1cGdyYWRlKSB7XG4gICAgICAgICAgICB1cGdyYWRlcy5idXlVcGdyYWRlKHVwZ3JhZGUpO1xuICAgICAgICB9XG5cblxuICAgICAgICBmdW5jdGlvbiBjaGFyYWN0ZXJJbmZvKGNoYXJhY3Rlcikge1xuICAgICAgICAgICAgaWYgKCFnYW1lLmlzSW5CYXR0bGUoKSkge1xuXG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdtYWluLmNoYXJhY3RlclN0YXR1cycsIHtcbiAgICAgICAgICAgICAgICAgICAgY2hhcmFjdGVyOiBjaGFyYWN0ZXJcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdGF0dXNNZXNzYWdlcy5tZXNzYWdlKFwiSW4gYSBiYXR0bGUhXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICBmdW5jdGlvbiBnZXRBdmFpbGFibGVBY3Rpb25zKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdhbWUubG9jYXRpb24oKS5hY3Rpb25zO1xuICAgICAgICB9XG5cblxuICAgICAgICBmdW5jdGlvbiBnZXRBdmFpbGFibGVVcGdyYWRlcygpIHtcbiAgICAgICAgICAgIHJldHVybiBfLnNvcnRCeShfLmZpbHRlcih1cGdyYWRlcy51cGdyYWRlRGVmaW5pdGlvbnMsICdhdmFpbGFibGUnKSwgZnVuY3Rpb24gKHUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdS5hY3RpdmUgPyAwIDogMTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cblxuICAgICAgICBmdW5jdGlvbiBnZXRMb2NhdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBnYW1lLmxvY2F0aW9uKCk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIGZ1bmN0aW9uIGdldFBhcnR5KCkge1xuICAgICAgICAgICAgcmV0dXJuIGdhbWUucGFydHk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIGZ1bmN0aW9uIGdldFVwZ3JhZGVEZXNjcmlwdGlvbih1cGdyYWRlKSB7XG4gICAgICAgICAgICB2YXIgdGV4dCA9IFwiPGRpdj5cIiArIHVwZ3JhZGUuZGVzY3JpcHRpb24gKyBcIjwvZGl2Pjx1bCBjbGFzcz0ncmVxdWlyZXMnPlwiO1xuXG4gICAgICAgICAgICBmb3IgKHZhciByZXF1aXJlIGluIHVwZ3JhZGUucmVxdWlyZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAodXBncmFkZS5yZXF1aXJlcy5oYXNPd25Qcm9wZXJ0eShyZXF1aXJlKSkge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0ICs9IFwiPGxpPlwiICsgcmVxdWlyZSArIFwiOiBcIiArIHVwZ3JhZGUucmVxdWlyZXNbcmVxdWlyZV0gKyBcIjwvbGk+XCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0ZXh0ICs9IFwiPC91bD5cIjtcbiAgICAgICAgICAgIHJldHVybiB0ZXh0O1xuICAgICAgICB9XG5cblxuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmNvbnRyb2xsZXIoJ01haW5Db250cm9sbGVyJywgTWFpbkNvbnRyb2xsZXIpO1xufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzI3LzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyoqXG4gICAgICogQG5nSW5qZWN0XG4gICAgICovXG4gICAgZnVuY3Rpb24gYWN0aW9uQnV0dG9uRGlyZWN0aXZlKGV2ZW50TG9vcCwgY29uZmlnLCBhY3Rpb25zLCB1cGdyYWRlcywgZ2FtZSkge1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0FFJyxcblxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBhY3Rpb246ICc9J1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgdGVtcGxhdGU6IFwiPGRpdiBjbGFzcz0nYWN0aW9uLWJhcicgbmctY2xpY2s9J2RvQWN0aW9uKCknPlwiICtcbiAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0ndGltZXItYmFyLXByb2dyZXNzJyBuZy1jbGFzcz0nZ2V0Q3NzQ2xhc3NlcygpJzwvZGl2PjwvZGl2PlwiLFxuXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW0sIGF0dHIpIHtcblxuICAgICAgICAgICAgICAgIGlmICghc2NvcGUuYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IFwiTm8gYWN0aW9uIGlzIGJvdW5kIHRvIHRoaXMgYWN0aW9uQnV0dG9uIVwiO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBwcm9ncmVzc0JhciA9IGFuZ3VsYXIuZWxlbWVudChlbGVtLmNoaWxkcmVuKClbMF0pLmNoaWxkcmVuKCk7ICAgLy8gdGltZXItYmFyLXByb2dyZXNzXG4gICAgICAgICAgICAgICAgdmFyIGJhciA9IGFuZ3VsYXIuZWxlbWVudChlbGVtLmNoaWxkcmVuKClbMF0pLmFwcGVuZChwcm9ncmVzc0Jhcik7XG4gICAgICAgICAgICAgICAgdmFyIHRleHQgPSBhbmd1bGFyLmVsZW1lbnQoZWxlbS5jaGlsZHJlbigpWzBdKS5hcHBlbmQoXCI8c3BhbiBjbGFzcz0nYWN0aW9uLWJhci10ZXh0Jz5cIiArIHNjb3BlLmFjdGlvbi50ZXh0ICsgXCI8L3NwYW4+XCIpO1xuICAgICAgICAgICAgICAgIHZhciBwcm9ncmVzcyA9IGFuZ3VsYXIuZWxlbWVudChiYXIuY2hpbGRyZW4oKVswXSk7XG5cblxuICAgICAgICAgICAgICAgIHNjb3BlLmRvQWN0aW9uID0gZG9BY3Rpb247XG4gICAgICAgICAgICAgICAgc2NvcGUuZ2V0QXV0b21hdGVkQ3NzQ2xhc3MgPSBnZXRBdXRvbWF0ZWRDc3NDbGFzcztcbiAgICAgICAgICAgICAgICBzY29wZS5nZXRDc3NDbGFzc2VzID0gZ2V0Q3NzQ2xhc3NlcztcbiAgICAgICAgICAgICAgICBzY29wZS5pc0FjdGlvbkF1dG9tYXRlZCA9IGlzQWN0aW9uQXV0b21hdGVkO1xuICAgICAgICAgICAgICAgIHNjb3BlLnBlcmNlbnRhZ2UgPSBzY29wZS5hY3Rpb24ucGN0Q29tcGxldGUgfHwgMDtcbiAgICAgICAgICAgICAgICBzY29wZS53YWl0aW5nID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgICAgICAgICBpZiAoc2NvcGUuYWN0aW9uLnBjdENvbXBsZXRlID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBwcm9ncmVzcy5hZGRDbGFzcygndGltZXItYmFyLXJ1bm5pbmcnKTtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUud2FpdGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHByb2dyZXNzLmNzcygnd2lkdGgnLCAoc2NvcGUucGVyY2VudGFnZSAqIDEwMCkgKyAnJScpO1xuICAgICAgICAgICAgICAgIGV2ZW50TG9vcC5vblRpY2soc2NvcGUsIG9uVGljayk7XG5cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJ1bnMgZG9BY3Rpb24oKSBvbiB0aGUgYWN0aW9uIGJvdW5kIHRvIHRoZSBidXR0b25cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBkb0FjdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzY29wZS53YWl0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NvcGUub25DbGljaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLm9uQ2xpY2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLnBlcmNlbnRhZ2UgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUud2FpdGluZyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhY3Rpb24gPSBzY29wZS5hY3Rpb247XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aW9ucy5jYW5BdXRvbWF0ZShhY3Rpb24sIHVwZ3JhZGVzLnVwZ3JhZGVEZWZpbml0aW9ucykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb24uYXV0b21hdGVkID0gIWFjdGlvbi5hdXRvbWF0ZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbnMuZG9BY3Rpb24oZ2FtZSwgYWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogVXNlZCB0byBhcHBseSBjbGFzc2VzIHRvIHRoZSB0aW1lciBiYXIgdmlhIG5nLWNsYXNzXG4gICAgICAgICAgICAgICAgICogQHJldHVybnMge3t0aW1lci1iYXItcnVubmluZzogKG5hbWUgb2Ygc3R5bGUpfX1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBnZXRDc3NDbGFzc2VzKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ3RpbWVyLWJhci1ydW5uaW5nJzogaXNBY3Rpb25SdW5uaW5nKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAndGltZXItYmFyLWNvbXBsZXRlJzogaXNBY3Rpb25Db21wbGV0ZWQoKVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGdldEF1dG9tYXRlZENzc0NsYXNzKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2F1dG9tYXRlZCc6IGlzQWN0aW9uQXV0b21hdGVkKClcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgYWN0aW9uIGlzIGN1cnJlbnRseSBydW5uaW5nXG4gICAgICAgICAgICAgICAgICogQHJldHVybnMge2RlZmF1bHRzLnJ1bm5pbmd8KnxDU1NTdHlsZURlY2xhcmF0aW9uLnJ1bm5pbmd8cnVubmluZ31cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBpc0FjdGlvblJ1bm5pbmcoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vcmV0dXJuIHNjb3BlLnBlcmNlbnRhZ2UgPj0gMCAmJiBzY29wZS5wZXJjZW50YWdlIDwgMSAmJiBzY29wZS53YWl0aW5nO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2NvcGUuYWN0aW9uLnJ1bm5pbmcgJiYgc2NvcGUuYWN0aW9uLnBjdENvbXBsZXRlID4gMDtcbiAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGlzQWN0aW9uQ29tcGxldGVkKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2NvcGUucGVyY2VudGFnZSA+PSAxICYmICFzY29wZS53YWl0aW5nICYmIHNjb3BlLmFjdGlvbi5wY3RDb21wbGV0ZSA9PT0gMDtcbiAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGlzQWN0aW9uQXV0b21hdGVkKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2NvcGUuYWN0aW9uLmF1dG9tYXRlZDtcbiAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFRpY2sgaGFuZGxlciBmb3IgdGhlIGV2ZW50IGxvb3BcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0gYXJnc1xuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIG9uVGljayhhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhY3Rpb24gPSBzY29wZS5hY3Rpb247XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3BlLnBlcmNlbnRhZ2UgPT09IDEgJiYgYWN0aW9uLnBjdENvbXBsZXRlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS53YWl0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2NvcGUucGVyY2VudGFnZSA9IGFjdGlvbi5wY3RDb21wbGV0ZTtcbiAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3MuY3NzKCd3aWR0aCcsIChzY29wZS5wZXJjZW50YWdlICogMTAwKSArICclJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmRpcmVjdGl2ZSgnYWN0aW9uQnV0dG9uJywgYWN0aW9uQnV0dG9uRGlyZWN0aXZlKTtcbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yMy8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuXG4gICAgLyoqXG4gICAgICogQG5nSW5qZWN0XG4gICAgICovXG4gICAgZnVuY3Rpb24gdGltZXJCYXJEaXJlY3RpdmUoZXZlbnRMb29wLCBjb25maWcpIHtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBRScsXG5cbiAgICAgICAgICAgIHJlcGxhY2U6IHRydWUsXG5cbiAgICAgICAgICAgIHRlbXBsYXRlOiAnPGRpdiBjbGFzcz1cInRpbWVyLWJhci1idXR0b25cIj48YSBjbGFzcz1cInRpbWVyLWJhci10ZXh0XCIgbmctY2xpY2s9XCJjb3VudGRvd24oKVwiPnt7bGFiZWx9fTwvYT4gPGRpdiBjbGFzcz1cInRpbWVyLWJhclwiPjwvZGl2PjwvZGl2PicsXG5cbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgbGFiZWw6ICdAJyxcbiAgICAgICAgICAgICAgICBzcGVlZDogJz0nLFxuICAgICAgICAgICAgICAgIG9uQ2xpY2s6ICcmPycsXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZWQ6ICcmJ1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtLCBhdHRyKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFzY29wZS5zcGVlZCkgdGhyb3cgbmV3IEVycm9yKCdzcGVlZCBub3QgZGVmaW5lZCcpO1xuICAgICAgICAgICAgICAgIGlmICghc2NvcGUub25Db21wbGV0ZWQpIHRocm93IG5ldyBFcnJvcignb25Db21wbGV0ZWQgbm90IGRlZmluZWQnKTtcblxuICAgICAgICAgICAgICAgIHZhciBpbmNyZWFzZVBlclRpY2sgPSBzY29wZS5zcGVlZCAvIGNvbmZpZy50aWNrc1BlclNlY29uZDtcbiAgICAgICAgICAgICAgICB2YXIgYmFyID0gYW5ndWxhci5lbGVtZW50KGVsZW0uY2hpbGRyZW4oKVsxXSkuYXBwZW5kKCc8ZGl2IGNsYXNzPVwidGltZXItYmFyLXByb2dyZXNzXCI+PC9kaXY+Jyk7XG4gICAgICAgICAgICAgICAgdmFyIHByb2dyZXNzID0gYW5ndWxhci5lbGVtZW50KGJhci5jaGlsZHJlbigpWzBdKTtcblxuICAgICAgICAgICAgICAgIGV2ZW50TG9vcC5vblRpY2soc2NvcGUsIGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY29wZS5wZXJjZW50YWdlIDwgMSAmJiBzY29wZS53YWl0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5wZXJjZW50YWdlID0gTWF0aC5taW4oMSwgc2NvcGUucGVyY2VudGFnZSArIGluY3JlYXNlUGVyVGljayk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NvcGUud2FpdGluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzLmFkZENsYXNzKCd0aW1lci1iYXItY29tcGxldGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZS53YWl0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUucGVyY2VudGFnZSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUub25Db21wbGV0ZWQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBwcm9ncmVzcy5jc3MoJ3dpZHRoJywgKHNjb3BlLnBlcmNlbnRhZ2UgKiAxMDApICsgJyUnKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHByb2dyZXNzLmNzcygnd2lkdGgnLCAnMCUnKTtcbiAgICAgICAgICAgICAgICBiYXIuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgJ2JsYWNrJyk7XG5cbiAgICAgICAgICAgICAgICBzY29wZS5jb3VudGRvd24gPSBjb3VudGRvd247XG4gICAgICAgICAgICAgICAgc2NvcGUucGVyY2VudGFnZSA9IDA7XG5cbiAgICAgICAgICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBjb3VudGRvd24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghc2NvcGUud2FpdGluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3BlLm9uQ2xpY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5vbkNsaWNrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5wZXJjZW50YWdlID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLndhaXRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3MucmVtb3ZlQ2xhc3MoJ3RpbWVyLWJhci1jb21wbGV0ZScpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmRpcmVjdGl2ZSgndGltZXJCYXInLCB0aW1lckJhckRpcmVjdGl2ZSk7XG5cbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yOC8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8qKlxuICAgICAqIEBuZ0luamVjdFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRvb2x0aXBEaXJlY3RpdmUoKSB7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQUUnLFxuXG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIHRleHQ6ICc9JyxcbiAgICAgICAgICAgICAgICB4T2Zmc2V0OiAnQD8nLFxuICAgICAgICAgICAgICAgIHlPZmZzZXQ6ICdAPydcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbSwgYXR0cikge1xuICAgICAgICAgICAgICAgIHZhciBlbGVtZW50ID0gYW5ndWxhci5lbGVtZW50KGVsZW0pO1xuICAgICAgICAgICAgICAgIHZhciB0b29sdGlwSHRtbCA9IFwiPGRpdiBjbGFzcz0ndG9vbHRpcCc+PC9kaXY+XCI7XG5cbiAgICAgICAgICAgICAgICB2YXIgdG9vbHRpcCA9IGVsZW1lbnQuYXBwZW5kKHRvb2x0aXBIdG1sKS5jaGlsZHJlbigpWzFdO1xuXG4gICAgICAgICAgICAgICAgdG9vbHRpcC5pbm5lckhUTUwgPSBzY29wZS50ZXh0O1xuICAgICAgICAgICAgICAgIHZhciB0b29sdGlwRWxlbSA9IGFuZ3VsYXIuZWxlbWVudCh0b29sdGlwKTtcbiAgICAgICAgICAgICAgICB2YXIgd2lkdGggPSB0b29sdGlwRWxlbS5jc3MoJ3dpZHRoJyk7XG5cbiAgICAgICAgICAgICAgICBlbGVtZW50Lm9uKCdtb3VzZW1vdmUnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICB0b29sdGlwRWxlbS5jc3MoJ3RvcCcsIGUueSArIDEgKyAncHgnKTtcbiAgICAgICAgICAgICAgICAgICAgdG9vbHRpcEVsZW0uY3NzKCdsZWZ0JywgZS54ICsgMSArICdweCcpO1xuICAgICAgICAgICAgICAgICAgICB0b29sdGlwRWxlbS5jc3MoJ2Rpc3BsYXknLCAnaW5saW5lLWJsb2NrJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5vbignbW91c2VvdXQnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICB0b29sdGlwRWxlbS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmRpcmVjdGl2ZSgndG9vbHRpcCcsIHRvb2x0aXBEaXJlY3RpdmUpO1xuXG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjcvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBmdW5jdGlvbiBkaXNjb3ZlcmVkTG9jYXRpb25GaWx0ZXIoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBkaXNjb3ZlcmVkTG9jYXRpb24obG9jYXRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gXy53aGVyZShsb2NhdGlvbnMsIHtkaXNjb3ZlcmVkOiB0cnVlfSk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuZmlsdGVyKCdkaXNjb3ZlcmVkTG9jYXRpb24nLCBkaXNjb3ZlcmVkTG9jYXRpb25GaWx0ZXIpO1xufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzI3LzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgZnVuY3Rpb24gcGVyY2VudGFnZUZpbHRlcigkZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBwZXJjZW50YWdlKGlucHV0LCBkZWNpbWFscykge1xuICAgICAgICAgICAgcmV0dXJuICRmaWx0ZXIoJ251bWJlcicpKGlucHV0ICogMTAwLCBkZWNpbWFscykgKyAnJSc7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuZmlsdGVyKCdwZXJjZW50YWdlJywgcGVyY2VudGFnZUZpbHRlcik7XG5cbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yNC8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8qKlxuICAgICAqIEBuZ0luY2x1ZGVcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBkdW5nZW9uRmFjdG9yeSgpIHtcblxuICAgICAgICBmdW5jdGlvbiBSb29tKCkge1xuICAgICAgICAgICAgdGhpcy5lbmVteUNoYW5jZSA9IE1hdGgucmFuZG9tKCk7ICAgLy8gJSBvZiBnZXR0aW5nIGVuZW15IGVuY291bnRlclxuICAgICAgICAgICAgdGhpcy50cmFwQ2hhbmNlID0gTWF0aC5yYW5kb20oKTsgICAgLy8gJSBvZiB0cmFwXG4gICAgICAgICAgICB0aGlzLnRyZWFzdXJlQ2hhbmNlID0gTWF0aC5yYW5kb20oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIEZsb29yKCkge1xuICAgICAgICAgICAgdGhpcy5leHBsb3JlZFBjdCA9IDA7XG4gICAgICAgICAgICB0aGlzLnJvb21zID0gW107XG4gICAgICAgIH1cblxuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBEdW5nZW9uKGxldmVsLCBmbG9vckNvdW50KSB7XG5cbiAgICAgICAgICAgIGZsb29yQ291bnQgPSBNYXRoLnJhbmRvbSgpICogbGV2ZWwgKiAyO1xuXG4gICAgICAgICAgICB0aGlzLmxldmVsID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLmZsb29ycyA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZsb29yQ291bnQ7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuZmxvb3JzLnB1c2gobmV3IEZsb29yKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmZhY3RvcnkoJ0R1bmdlb24nLCBkdW5nZW9uRmFjdG9yeSk7XG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjQvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmNsdWRlXG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgZnVuY3Rpb24gbWFwRmFjdG9yeSh1dGlscywgcGFydHksIHN0YXR1c01lc3NhZ2VzLCB1cGdyYWRlcywgcmVzb3VyY2VzLCBCYXR0bGUpIHtcblxuICAgICAgICB2YXIgZ2V0TG9zdENoYW5jZSA9IDAuMjsgICAgLy8gdG9kbzogY2hhbmdlIHRoaXM/XG4gICAgICAgIHZhciByb29tWHBCYXNlID0gMTtcblxuICAgICAgICBmdW5jdGlvbiBSb29tKG1hcCwgZmxvb3IpIHtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAgICAgdGhpcy5leHBsb3JlID0gZXhwbG9yZTtcbiAgICAgICAgICAgIHRoaXMuZXhwbG9yZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuZW5lbXlDaGFuY2UgPSBNYXRoLnJhbmRvbSgpOyAgIC8vICUgb2YgZ2V0dGluZyBlbmVteSBlbmNvdW50ZXJcbiAgICAgICAgICAgIHRoaXMuaGFzU3RhaXJzID0gTWF0aC5yYW5kb20oKSAvIDEwOyAgICAgLy8gJSBvZiBmaW5kaW5nIHN0YWlycyBkb3duIGhlcmUsIG9uY2UgdGhpcyBpcyBzZXQgdGhlbiBubyBvdGhlciByb29tIGNhbiBoYXZlIGl0XG4gICAgICAgICAgICB0aGlzLnRyYXBDaGFuY2UgPSBNYXRoLnJhbmRvbSgpOyAgICAvLyAlIG9mIHRyYXBcbiAgICAgICAgICAgIHRoaXMudHJlYXN1cmVDaGFuY2UgPSBNYXRoLnJhbmRvbSgpO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBleHBsb3JlKGxvY2F0aW9ucykge1xuICAgICAgICAgICAgICAgIGlmIChNYXRoLnJhbmRvbSgpIDw9IHNlbGYuZW5lbXlDaGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmFuZG9tQmF0dGxlKGxvY2F0aW9ucyk7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKE1hdGgucmFuZG9tKCkgPD0gc2VsZi50cmFwQ2hhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYXAoKTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoTWF0aC5yYW5kb20oKSA8PSBzZWxmLnRyZWFzdXJlQ2hhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvdW5kVHJlYXN1cmUoKTtcblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmLmV4cGxvcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcmFuZG9tQmF0dGxlKGxvY2F0aW9ucykge1xuICAgICAgICAgICAgICAgIHN0YXR1c01lc3NhZ2VzLm1lc3NhZ2UoXCJSYW5kb20gYmF0dGxlIVwiKTtcbiAgICAgICAgICAgICAgICBzZWxmLmVuZW15Q2hhbmNlICo9IDAuODsgLy8gcmVkdWNlIHRoZSBjaGFuY2UgZWFjaCB0aW1lIHdlIHZpc2l0IHRoaXMgcm9vbVxuXG4gICAgICAgICAgICAgICAgdmFyIGJhdHRsZSA9IG5ldyBCYXR0bGUobG9jYXRpb25zLCB7fSk7XG4gICAgICAgICAgICAgICAgYmF0dGxlLmJlZ2luKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGZvdW5kVHJlYXN1cmUoKSB7XG4gICAgICAgICAgICAgICAgc3RhdHVzTWVzc2FnZXMubWVzc2FnZShcIkZvdW5kIHRyZWFzdXJlIVwiKTtcbiAgICAgICAgICAgICAgICBzZWxmLnRyZWFzdXJlQ2hhbmNlICo9IDAuNzU7XG4gICAgICAgICAgICAgICAgcmVzb3VyY2VzLmdvbGQuY3VycmVudCArPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMCAqIG1hcC5sZXZlbCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHRyYXAoKSB7XG4gICAgICAgICAgICAgICAgc3RhdHVzTWVzc2FnZXMubWVzc2FnZShcIlRyaWdnZXJlZCBhIHRyYXAhXCIpO1xuICAgICAgICAgICAgICAgIHNlbGYudHJhcENoYW5jZSAqPSAwLjg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICAgIGZ1bmN0aW9uIEZsb29yKG1hcCwgcm9vbUNvdW50KSB7XG4gICAgICAgICAgICByb29tQ291bnQgPSBNYXRoLmZsb29yKHJvb21Db3VudCB8fCAxKTtcblxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRSb29tID0gMDtcbiAgICAgICAgICAgIHRoaXMuZXhwbG9yZSA9IGV4cGxvcmU7XG4gICAgICAgICAgICB0aGlzLmV4cGxvcmVkUGN0ID0gMDtcbiAgICAgICAgICAgIHRoaXMuZm91bmRTdGFpcnMgPSBmYWxzZTsgICAvLyBjYW4gZ28gdG8gbmV4dCBmbG9vcj9cbiAgICAgICAgICAgIHRoaXMucm9vbXMgPSBbXTtcblxuICAgICAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJvb21Db3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yb29tcy5wdXNoKG5ldyBSb29tKG1hcCwgc2VsZikpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGV4cGxvcmUodG90YWxGbG9vcnMsIGxvY2F0aW9ucykge1xuICAgICAgICAgICAgICAgIHZhciByb29tID0gc2VsZi5yb29tc1tzZWxmLmN1cnJlbnRSb29tXTtcbiAgICAgICAgICAgICAgICByb29tLmV4cGxvcmUobG9jYXRpb25zKTtcblxuICAgICAgICAgICAgICAgIHZhciBoYXNTdGFpcnMgPSAoc2VsZi5jdXJyZW50Um9vbSA9PSBzZWxmLnJvb21zLmxlbmd0aCAtIDEpIHx8IE1hdGgucmFuZG9tKCkgPD0gcm9vbS5oYXNTdGFpcnM7XG5cbiAgICAgICAgICAgICAgICBpZiAodG90YWxGbG9vcnMgPiAxICYmICFzZWxmLmZvdW5kU3RhaXJzICYmIGhhc1N0YWlycykge1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXNNZXNzYWdlcy5tZXNzYWdlKFwiRm91bmQgc3RhaXJzIHRvIHRoZSBuZXh0IGxldmVsLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5mb3VuZFN0YWlycyA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCF1cGdyYWRlcy5hdXRvTWFwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIGF1dG9tYXAsIHdlIGRvbid0IGdldCBsb3N0XG4gICAgICAgICAgICAgICAgICAgIGlmIChNYXRoLnJhbmRvbSgpIDw9IGdldExvc3RDaGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1c01lc3NhZ2VzLm1lc3NhZ2UoXCJZb3UgZ2V0IGxvc3QhXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jdXJyZW50Um9vbSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHJvb21Db3VudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuY3VycmVudFJvb20gPCByb29tQ291bnQgLSAxKVxuICAgICAgICAgICAgICAgICAgICBzZWxmLmN1cnJlbnRSb29tKys7XG5cbiAgICAgICAgICAgICAgICB2YXIgZXhwbG9yZWQgPSBfLmZpbHRlcihzZWxmLnJvb21zLCAnZXhwbG9yZWQnKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgc2VsZi5leHBsb3JlZFBjdCA9IGV4cGxvcmVkIC8gc2VsZi5yb29tcy5sZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcGFyYW0ge051bWJlcn0gbGV2ZWwgLSB0aGUgbGV2ZWwgb2YgZGlmZmljdWx0eSBvZiB0aGUgZHVuZ2VvblxuICAgICAgICAgKiBAcGFyYW0ge051bWJlcn0gZmxvb3JDb3VudCAtIHRoZSBudW1iZXIgb2YgZmxvb3JzXG4gICAgICAgICAqL1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gTWFwKGFyZ3MpIHtcblxuICAgICAgICAgICAgYXJncyA9IGFyZ3MgfHwge307XG5cbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgICAgICAgICBsZXZlbCA9IGFyZ3MubGV2ZWwgfHwgMSxcbiAgICAgICAgICAgICAgICBmbG9vckNvdW50ID0gYXJncy5mbG9vckNvdW50IHx8IE1hdGgucmFuZG9tKCkgKiBsZXZlbCAqIDIsXG4gICAgICAgICAgICAgICAgcm9vbUNvdW50ID0gYXJncy5yb29tQ291bnQgfHwgTWF0aC5yYW5kb20oKSAqIDUwICsgKE1hdGgucmFuZG9tKCkgKiA1ICsgMTApO1xuXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRGbG9vciA9IDA7XG4gICAgICAgICAgICB0aGlzLmV4cGxvcmUgPSBleHBsb3JlO1xuICAgICAgICAgICAgdGhpcy5leHBsb3JlZFBjdCA9IDA7XG4gICAgICAgICAgICB0aGlzLmZsb29ycyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5sZXZlbCA9IGxldmVsO1xuXG4gICAgICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZsb29yQ291bnQ7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuZmxvb3JzLnB1c2gobmV3IEZsb29yKHNlbGYsIHJvb21Db3VudCkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBjaGFuZ2VGbG9vcihuZXdGbG9vcikge1xuICAgICAgICAgICAgICAgIHNlbGYuY3VycmVudEZsb29yID0gbmV3Rmxvb3IgfHwgc2VsZi5jdXJyZW50Rmxvb3I7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGV4cGxvcmUobG9jYXRpb25zKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZsb29yID0gdXRpbHMuY2xhbXAoc2VsZi5jdXJyZW50Rmxvb3IsIDAsIHNlbGYuZmxvb3JzLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgc2VsZi5mbG9vcnNbZmxvb3JdLmV4cGxvcmUoc2VsZi5mbG9vcnMubGVuZ3RoLCBsb2NhdGlvbnMpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGV4cGxvcmVkID0gXy5yZWR1Y2Uoc2VsZi5mbG9vcnMsIGZ1bmN0aW9uIChwY3QsIGZsb29yLCBpZHgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJFWFBMT1JFRDogXCIgKyBmbG9vcik7XG4gICAgICAgICAgICAgICAgICAgIHBjdCArPSBmbG9vci5leHBsb3JlZFBjdDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBjdDtcbiAgICAgICAgICAgICAgICB9LCAwKTtcblxuICAgICAgICAgICAgICAgIGlmIChleHBsb3JlZCA+IHNlbGYuZXhwbG9yZWRQY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzLnhwLmN1cnJlbnQgKz0gKHJvb21YcEJhc2UgKiBsZXZlbCAqIChzZWxmLmN1cnJlbnRGbG9vciArIDEpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2VsZi5leHBsb3JlZFBjdCA9IGV4cGxvcmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLmZhY3RvcnkoJ01hcCcsIG1hcEZhY3RvcnkpO1xufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzIzLzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICBydW5uaW5nOiBmYWxzZSxcbiAgICAgICAgYXV0b21hdGVkOiBmYWxzZSxcbiAgICAgICAgcGN0Q29tcGxldGU6IDAsXG4gICAgICAgIG9uU3RhcnQ6IGFuZ3VsYXIubm9vcCxcbiAgICAgICAgYXV0b21hdGVVcGdyYWRlOiBudWxsXG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEBuZ0luamVjdFxuICAgICAqIEBwYXJhbSBwYXJ0eVxuICAgICAqIEBwYXJhbSBzdGF0dXNNZXNzYWdlc1xuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIEFjdGlvbnMoJHEsIHV0aWxzLCBwYXJ0eSwgc3RhdHVzTWVzc2FnZXMpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5hY3Rpb25EZWZpbml0aW9ucyA9IGNyZWF0ZURlZmluaXRpb25zKCk7XG4gICAgICAgIHRoaXMuY2FuQXV0b21hdGUgPSBjYW5BdXRvbWF0ZTtcbiAgICAgICAgdGhpcy5jYW5jZWxBY3RpdmVBY3Rpb25zID0gY2FuY2VsQWN0aXZlQWN0aW9ucztcbiAgICAgICAgdGhpcy5kb0FjdGlvbiA9IGRvQWN0aW9uO1xuICAgICAgICB0aGlzLnByb2Nlc3NUaWNrID0gcHJvY2Vzc1RpY2s7XG5cblxuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlRGVmaW5pdGlvbnMoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuXG4gICAgICAgICAgICAgICAgZXhwbG9yZTogYW5ndWxhci5leHRlbmQoe30sIGRlZmF1bHRzLCB7XG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICdFeHBsb3JlJyxcbiAgICAgICAgICAgICAgICAgICAgc3BlZWQ6IDAuMTIsXG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6IGZ1bmN0aW9uIChnYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnYW1lLmV4cGxvcmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgYXV0b21hdGVVcGdyYWRlOiAnYXV0b0V4cGxvcmUnXG4gICAgICAgICAgICAgICAgfSksXG5cbiAgICAgICAgICAgICAgICBnYXRoZXJIZXJiczogYW5ndWxhci5leHRlbmQoe30sIGRlZmF1bHRzLCB7XG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICdHYXRoZXIgaGVyYnMnLFxuICAgICAgICAgICAgICAgICAgICBzcGVlZDogMC4xLFxuICAgICAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiBmdW5jdGlvbiAoZ2FtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdhbWUubG9jYXRpb24oKS5oZXJicykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhbW91bnQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA1KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lLnVwZGF0ZVJlc291cmNlKCdoZXJicycsIGFtb3VudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzTWVzc2FnZXMubWVzc2FnZShcIllvdSBmaW5kIFwiICsgKGFtb3VudCA+IDAgPyBhbW91bnQgOiAnbm8nKSArIFwiIGhlcmJzLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgYXV0b21hdGVVcGdyYWRlOiAnYXV0b0dhdGhlcidcbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogQGRlc2NyaXB0aW9uICAgICBSZXR1cm5zIHRydWUgaWYgdGhlIGFwcHJvcHJpYXRlIHVwZ3JhZGUgaGFzIGJlZW4gcHVyY2hhc2VkIHRvIGF1dG9tYXRlIHRoaXMgYWN0aW9uLlxuICAgICAgICAgKiBAcGFyYW0gYWN0aW9uXG4gICAgICAgICAqIEBwYXJhbSB1cGdyYWRlc1xuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gY2FuQXV0b21hdGUoYWN0aW9uLCB1cGdyYWRlcykge1xuICAgICAgICAgICAgaWYgKGFjdGlvbi5hdXRvbWF0ZVVwZ3JhZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdXBncmFkZXNbYWN0aW9uLmF1dG9tYXRlVXBncmFkZV0uYWN0aXZlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cblxuICAgICAgICBmdW5jdGlvbiBjYW5jZWxBY3RpdmVBY3Rpb25zKCkge1xuICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKHNlbGYuYWN0aW9uRGVmaW5pdGlvbnMsIGZ1bmN0aW9uIChhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uLnJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uLnBjdENvbXBsZXRlID0gMDtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uLnJ1bm5pbmcgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aW9uLmRlZmVycmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSBhY3Rpb24uZGVmZXJyZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb24uZGVmZXJyZWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KCdjYW5jZWxlZCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gZ2FtZVxuICAgICAgICAgKiBAcGFyYW0gYWN0aW9uXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBkb0FjdGlvbihnYW1lLCBhY3Rpb24pIHtcbiAgICAgICAgICAgIGlmIChnYW1lLmlkICE9PSBcIkdhbWVcIilcbiAgICAgICAgICAgICAgICB0aHJvdyBcIkludmFsaWQgW2dhbWVdIHBhcmFtZXRlclwiO1xuXG4gICAgICAgICAgICBpZiAoIWFjdGlvbi5ydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgYWN0aW9uLnBjdENvbXBsZXRlID0gMDtcbiAgICAgICAgICAgICAgICBhY3Rpb24ucnVubmluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgYWN0aW9uLmRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgICAgICAgICAgIGFjdGlvbi5kZWZlcnJlZC5wcm9taXNlLnRoZW4oZnVuY3Rpb24gKHJlc29sdmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbi5vbkNvbXBsZXRlKGdhbWUpO1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb24ucGN0Q29tcGxldGUgPSAwO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICAvKipcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIGFjdGlvblxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbnxDU1NTdHlsZURlY2xhcmF0aW9uLnJ1bm5pbmd8ZGVmYXVsdHMucnVubmluZ3xydW5uaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gaXNSdW5uaW5nKGFjdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIGFjdGlvbi5ydW5uaW5nO1xuICAgICAgICB9XG5cblxuICAgICAgICBmdW5jdGlvbiBwcm9jZXNzVGljayhnYW1lKSB7XG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goc2VsZi5hY3Rpb25EZWZpbml0aW9ucywgZnVuY3Rpb24gKGFjdGlvbikge1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24ucGN0Q29tcGxldGUgPCAxICYmIGlzUnVubmluZyhhY3Rpb24pKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbi5wY3RDb21wbGV0ZSA9IHV0aWxzLmNsYW1wKGFjdGlvbi5wY3RDb21wbGV0ZSArIGFjdGlvbi5zcGVlZCwgMCwgMSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGlvbi5kZWZlcnJlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uLmRlZmVycmVkLnJlc29sdmUoe30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uLmRlZmVycmVkID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZVN0YXRlKGFjdGlvbiwgZmFsc2UpO1xuXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3Rpb24uYXV0b21hdGVkICYmICFnYW1lLmlzSW5CYXR0bGUoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvQWN0aW9uKGdhbWUsIGFjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cblxuICAgICAgICAvKipcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIGFjdGlvblxuICAgICAgICAgKiBAcGFyYW0gcnVubmluZ1xuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gdG9nZ2xlU3RhdGUoYWN0aW9uLCBydW5uaW5nKSB7XG4gICAgICAgICAgICBhY3Rpb24ucnVubmluZyA9IHJ1bm5pbmc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5zZXJ2aWNlKCdhY3Rpb25zJywgQWN0aW9ucyk7XG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjUvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259XG4gICAgICovXG4gICAgZnVuY3Rpb24gYmF0dGxlRmFjdG9yeSgkcm9vdFNjb3BlLCAkc3RhdGUsICRxLCBldmVudExvb3AsIHN0YXR1c01lc3NhZ2VzLCBFbmVteSwgcGFydHksIHJlc291cmNlcywgdXBncmFkZXMpIHtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gQmF0dGxlKGxvY2F0aW9ucywgYXJncykge1xuICAgICAgICAgICAgdmFyIHByZXZTdGF0ZSA9ICdtYWluLmFjdGlvbnMnO1xuXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgICAgICAgZW5lbWllcyA9IGNyZWF0ZUVuZW1pZXMoKTtcblxuICAgICAgICAgICAgdmFyIHRpY2sgPSAwLFxuICAgICAgICAgICAgICAgIGRlZmVycmVkLFxuICAgICAgICAgICAgICAgIGhhbmRsZXIsXG4gICAgICAgICAgICAgICAgY3VycmVudENoYXIsXG4gICAgICAgICAgICAgICAgY3VycmVudFR1cm5PcmRlcixcbiAgICAgICAgICAgICAgICB4cCA9IDA7XG5cbiAgICAgICAgICAgIHRoaXMuYmVnaW4gPSBiZWdpbjtcbiAgICAgICAgICAgIHRoaXMuZW5lbWllcyA9IGVuZW1pZXM7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VzID0gW107XG5cbiAgICAgICAgICAgIGhhbmRsZXIgPSBldmVudExvb3Aub25UaWNrKCRyb290U2NvcGUsIHRpY2tIYW5kbGVyKTtcblxuICAgICAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBiZWdpbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgeHAgPSByZXNvdXJjZXMueHA7XG4gICAgICAgICAgICAgICAgZmlnaHQoKS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgeHAuY3VycmVudCArPSByZXN1bHQueHA7XG4gICAgICAgICAgICAgICAgICAgIHhwID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICBmdW5jdGlvbiBjcmVhdGVFbmVtaWVzKCkge1xuICAgICAgICAgICAgICAgIHZhciBudW1FbmVtaWVzID0gTWF0aC5jZWlsKE1hdGgucmFuZG9tKCkgKiA1KTtcbiAgICAgICAgICAgICAgICB2YXIgZW5lbWllcyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtRW5lbWllczsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVuZW1pZXMucHVzaChuZXcgRW5lbXkoYXJncy5sZXZlbCB8fCAxKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBlbmVtaWVzO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGZpZ2h0KCkge1xuICAgICAgICAgICAgICAgIGlmICghZGVmZXJyZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ21haW4uYmF0dGxlJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmF0dGxlOiBzZWxmLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZTogZGVmZXJyZWRcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIG9uQ29tcGxldGUobWVzc2FnZSkge1xuICAgICAgICAgICAgICAgIHN0YXR1c01lc3NhZ2VzLm1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgaGFuZGxlcigpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic2NvcGUgZGVzdHJveWVkXCIpO1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbyhwcmV2U3RhdGUgfHwgJ21haW4uYWN0aW9ucycpO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHByb2Nlc3NSZXN1bHQocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0IHx8IHt9O1xuXG4gICAgICAgICAgICAgICAgc2VsZi5tZXNzYWdlcy51bnNoaWZ0KHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgeHAgKz0gcmVzdWx0LnhwIHx8IDA7XG5cbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnZpY3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICB4cDogeHBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcGxldGUoXCJZb3UgYXJlIHZpY3RvcmlvdXMgYW5kIGdhaW4gXCIgKyB4cCArIFwiIHhwLlwiKTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzdWx0LmRlZmVhdCkge1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHhwOiAwXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBvbkNvbXBsZXRlKFwiWW91IGhhdmUgYmVlbiBkZWZlYXRlZC5cIik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC52aWN0b3J5IHx8IHJlc3VsdC5kZWZlYXQ7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgZnVuY3Rpb24gcHJvY2Vzc1R1cm4odHVybikge1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQsXG4gICAgICAgICAgICAgICAgICAgIGFjdG9yID0gY3VycmVudFR1cm5PcmRlclt0dXJuXTtcblxuICAgICAgICAgICAgICAgIGlmICghYWN0b3IuaXNEZWFkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFjdG9yIGluc3RhbmNlb2YgRW5lbXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGFjdG9yLmF0dGFjayhwYXJ0eS5jaGFyYWN0ZXJzKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGFjdG9yLmF0dGFjayhlbmVtaWVzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvY2Vzc1Jlc3VsdChyZXN1bHQpO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHRpY2tIYW5kbGVyKGFyZ3MpIHtcbiAgICAgICAgICAgICAgICB0aWNrKys7XG5cbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudFR1cm5PcmRlcikge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aWNrICUgMyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc1R1cm4oY3VycmVudENoYXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudENoYXIrKztcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRDaGFyID49IGN1cnJlbnRUdXJuT3JkZXIubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFR1cm5PcmRlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRUdXJuT3JkZXIgPSBfLnNvcnRCeShwYXJ0eS5jaGFyYWN0ZXJzLmNvbmNhdChlbmVtaWVzKSwgJ3NwZWVkJyk7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRDaGFyID0gMDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5mYWN0b3J5KCdCYXR0bGUnLCBiYXR0bGVGYWN0b3J5KTtcblxufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzIyLzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgZnVuY3Rpb24gY29uZmlnKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGlja3NQZXJTZWNvbmQ6IDUsXG4gICAgICAgICAgICBhcGlTZXJ2ZXI6ICdodHRwOi8vbG9jYWxob3N0OjEzMDk4LycsXG5cbiAgICAgICAgICAgIHNlY29uZHNUb0hlYWxJblRvd246IDNcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5mYWN0b3J5KCdjb25maWcnLCBjb25maWcpO1xuXG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjUvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBlbmVteUZhY3RvcnkoKSB7XG5cbiAgICAgICAgdmFyIGVuZW1pZXMgPSBbXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnR29ibGluJyxcbiAgICAgICAgICAgICAgICAgICAgaHA6IDEwLFxuICAgICAgICAgICAgICAgICAgICB4cDogMyxcbiAgICAgICAgICAgICAgICAgICAgc3BlZWQ6ICc1JywgYXRrOiAzLCBkZWY6IDFcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ0tvYm9sZCcsXG4gICAgICAgICAgICAgICAgICAgIGhwOiAxMCxcbiAgICAgICAgICAgICAgICAgICAgeHA6IDEsXG4gICAgICAgICAgICAgICAgICAgIHNwZWVkOiAnNycsIGF0azogMSwgZGVmOiAxXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICBdO1xuXG4gICAgICAgIGZ1bmN0aW9uIEVuZW15KGxldmVsKSB7XG4gICAgICAgICAgICBsZXZlbCA9IE1hdGgubWF4KDAsIE1hdGgubWluKGxldmVsLCBlbmVtaWVzLmxlbmd0aCAtIDEpKTtcblxuICAgICAgICAgICAgdmFyIHJhbmRvbSA9IF8uc2FtcGxlKGVuZW1pZXNbbGV2ZWxdKTtcbiAgICAgICAgICAgIGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHJhbmRvbSwge2hwOiB7Y3VycmVudDogcmFuZG9tLmhwLCBtYXg6IHJhbmRvbS5ocH19KTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBkZXNjcmlwdGlvbiAgICAgUmV0dXJucyAxLDIsMyBkZXBlbmRpbmcgb24gaG93IGNsb3NlIHRvIDAgdGhlIGVuZW15J3MgSFAgaXNcbiAgICAgICAgICovXG4gICAgICAgIEVuZW15LnByb3RvdHlwZS5jb25kaXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcmF0aW8gPSB0aGlzLmhwLmN1cnJlbnQgLyB0aGlzLmhwLm1heDtcbiAgICAgICAgICAgIGlmIChyYXRpbyA8PSAwLjMzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDM7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJhdGlvIDw9IDAuNjYpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9O1xuXG5cbiAgICAgICAgRW5lbXkucHJvdG90eXBlLmRhbWFnZSA9IGZ1bmN0aW9uIChhbW91bnQpIHtcbiAgICAgICAgICAgIHRoaXMuaHAuY3VycmVudCAtPSBhbW91bnQ7XG4gICAgICAgIH07XG5cblxuICAgICAgICBFbmVteS5wcm90b3R5cGUuaGVhbCA9IGZ1bmN0aW9uIChhbW91bnQpIHtcbiAgICAgICAgICAgIHRoaXMuaHAuY3VycmVudCA9IHV0aWxzLmNsYW1wKHRoaXMuaHAuY3VycmVudCArIGFtb3VudCwgMCwgdGhpcy5ocC5tYXgpO1xuICAgICAgICB9O1xuXG5cbiAgICAgICAgRW5lbXkucHJvdG90eXBlLmlzRGVhZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmhwLmN1cnJlbnQgPD0gMDtcbiAgICAgICAgfTtcblxuXG4gICAgICAgIEVuZW15LnByb3RvdHlwZS5hdHRhY2sgPSBmdW5jdGlvbiAocGFydHkpIHtcbiAgICAgICAgICAgIC8vIHRvZG86IHB1dCBpbiBzb21lIEFJIGhlcmUgdG8gYXR0YWNrIGEgY2VydGFpbiBwYXJ0eSBtZW1iZXIgYmFzZWQgb24gY29uZGl0aW9uc1xuXG4gICAgICAgICAgICB2YXIgYXZhaWxhYmxlID0gXy5maWx0ZXIocGFydHksIGZ1bmN0aW9uIChwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICFwLmlzRGVhZCgpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChhdmFpbGFibGUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ1RoZSBwYXJ0eSBpcyBkZWFkIScsXG4gICAgICAgICAgICAgICAgICAgIGRlZmVhdDogdHJ1ZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciByYW5kb21DaGFyID0gXy5zYW1wbGUoYXZhaWxhYmxlKTtcblxuICAgICAgICAgICAgdmFyIGRtZyA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHRoaXMuYXRrKTtcbiAgICAgICAgICAgIHZhciBtc2c7XG4gICAgICAgICAgICBpZiAoZG1nID4gMCkge1xuICAgICAgICAgICAgICAgIG1zZyA9IHRoaXMubmFtZSArIFwiIHN0cmlrZXMgXCIgKyByYW5kb21DaGFyLm5hbWUgKyBcIiBmb3IgXCIgKyBkbWcgKyBcIiBkYW1hZ2UhXCI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1zZyA9IHRoaXMubmFtZSArIFwiIG1pc3NlZCBcIiArIHJhbmRvbUNoYXIubmFtZSArIFwiLlwiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByYW5kb21DaGFyLmRhbWFnZShkbWcpO1xuICAgICAgICAgICAgaWYgKHJhbmRvbUNoYXIuaXNEZWFkKCkpIHtcbiAgICAgICAgICAgICAgICBtc2cgKz0gXCIgXCIgKyByYW5kb21DaGFyLm5hbWUgKyBcIiBpcyBkZWFkIVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IHJhbmRvbUNoYXIsXG4gICAgICAgICAgICAgICAgZGFtYWdlOiBkbWcsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogbXNnXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBFbmVteTtcbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5mYWN0b3J5KCdFbmVteScsIGVuZW15RmFjdG9yeSk7XG59KSgpO1xuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yMi8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBUSUNLID0gXCJldmVudDp0aWNrXCI7XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBFdmVudExvb3AoJHJvb3RTY29wZSwgJGludGVydmFsLCBjb25maWcpIHtcblxuICAgICAgICB0aGlzLm9uVGljayA9IG9uVGljaztcblxuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgdmFyIHRpbWVyID0gJGludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRpY2soKTtcbiAgICAgICAgfSwgMTAwMCAvIGNvbmZpZy50aWNrc1BlclNlY29uZCk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJGludGVydmFsLmNhbmNlbCh0aW1lcik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICBmdW5jdGlvbiBvblRpY2soc2NvcGUsIGhhbmRsZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBzY29wZS4kb24oVElDSywgZnVuY3Rpb24gKGUsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBoYW5kbGVyKGFyZ3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiB0aWNrKCkge1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KFRJQ0ssIHt9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLnNlcnZpY2UoJ2V2ZW50TG9vcCcsIEV2ZW50TG9vcCk7XG5cbn0pKCk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yMi8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8qKlxuICAgICAqIEBuZ0luamVjdFxuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIEdhbWUoJHJvb3RTY29wZSwgJHN0YXRlLCBldmVudExvb3AsIHV0aWxzLCBwYXJ0eSwgYWN0aW9ucywgcmVzb3VyY2VzLCBsb2NhdGlvbnMsIHVwZ3JhZGVzKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGV2ZW50TG9vcC5vblRpY2soJHJvb3RTY29wZSwgZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgIGFjdGlvbnMucHJvY2Vzc1RpY2soc2VsZik7XG4gICAgICAgICAgICB1cGdyYWRlcy5wcm9jZXNzVGljayhzZWxmKTtcbiAgICAgICAgICAgIGxvY2F0aW9ucy5wcm9jZXNzVGljayhzZWxmKTtcbiAgICAgICAgfSk7XG5cblxuICAgICAgICBsb2NhdGlvbnMuY2hhbmdlTG9jYXRpb24oJ3Rvd24nKSgpO1xuICAgICAgICBsb2NhdGlvbnMuY3VycmVudCgpLm1hcC5leHBsb3JlZFBjdCA9IDE7ICAgIC8vIG5vdGhpbmcgdG8gZXhwbG9yZSBpbiB0aGUgdG93biBmb3Igbm93XG5cbiAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgdGhpcy5pZCA9IFwiR2FtZVwiO1xuICAgICAgICB0aGlzLmV4cGxvcmUgPSBleHBsb3JlO1xuICAgICAgICB0aGlzLmlzSW5CYXR0bGUgPSBpc0luQmF0dGxlO1xuICAgICAgICB0aGlzLmxvY2F0aW9uID0gY3VycmVudExvY2F0aW9uO1xuICAgICAgICB0aGlzLnBhcnR5ID0gcGFydHkuY2hhcmFjdGVycztcbiAgICAgICAgdGhpcy5yZXNvdXJjZXMgPSBhdmFpbGFibGVSZXNvdXJjZXM7XG4gICAgICAgIHRoaXMudXBkYXRlUmVzb3VyY2UgPSB1cGRhdGVSZXNvdXJjZTtcbiAgICAgICAgdGhpcy51cGdyYWRlcyA9IHVwZ3JhZGVzLnVwZ3JhZGVEZWZpbml0aW9ucztcblxuXG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgIGZ1bmN0aW9uIGF2YWlsYWJsZVJlc291cmNlcygpIHtcbiAgICAgICAgICAgIHJldHVybiBfLmZpbHRlcihyZXNvdXJjZXMsICd2aXNpYmxlJyk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIGZ1bmN0aW9uIGN1cnJlbnRMb2NhdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBsb2NhdGlvbnMuY3VycmVudCgpO1xuICAgICAgICB9XG5cblxuICAgICAgICBmdW5jdGlvbiBleHBsb3JlKCkge1xuICAgICAgICAgICAgbG9jYXRpb25zLmV4cGxvcmUoKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgZnVuY3Rpb24gaXNJbkJhdHRsZSgpIHtcbiAgICAgICAgICAgIHJldHVybiAkc3RhdGUuY3VycmVudC5uYW1lID09PSAnbWFpbi5iYXR0bGUnO1xuICAgICAgICB9XG5cblxuICAgICAgICBmdW5jdGlvbiB1cGRhdGVSZXNvdXJjZShyZXNvdXJjZSwgYW1vdW50LCBtYXgpIHtcbiAgICAgICAgICAgIHZhciByZXMgPSByZXNvdXJjZXNbcmVzb3VyY2VdO1xuICAgICAgICAgICAgaWYgKCFyZXMpIHtcbiAgICAgICAgICAgICAgICByZXMgPSB7bmFtZTogcmVzb3VyY2UsIGN1cnJlbnQ6IDAsIG1heDogbWF4LCB2aXNpYmxlOiB0cnVlfTtcbiAgICAgICAgICAgICAgICByZXNvdXJjZXNbcmVzb3VyY2VdID0gcmVzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlcy5tYXgpIHtcbiAgICAgICAgICAgICAgICByZXMuY3VycmVudCA9IHV0aWxzLmNsYW1wKHJlcy5jdXJyZW50ICsgYW1vdW50LCAwLCByZXMubWF4KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzLmN1cnJlbnQgKz0gYW1vdW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuc2VydmljZSgnZ2FtZScsIEdhbWUpO1xuXG59KSgpO1xuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGpvaG4gb24gMS8yNi8xNS5cbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGZ1bmN0aW9uIGJpbmRBY3Rpb24oYWN0aW9uLCB0b09iamVjdCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgYWN0aW9uKHRvT2JqZWN0KTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5lcmF0ZVRpY2tGdW5jdGlvbihjb25maWcsIGludGVydmFsSW5TZWNvbmRzLCBoYW5kbGVyKSB7XG4gICAgICAgIHZhciB0aWNrID0gMDtcbiAgICAgICAgdmFyIGludGVydmFsSW5UaWNrcyA9IGludGVydmFsSW5TZWNvbmRzICogY29uZmlnLnRpY2tzUGVyU2Vjb25kO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGdhbWUpIHtcbiAgICAgICAgICAgIHRpY2srKztcbiAgICAgICAgICAgIGlmICh0aWNrID49IGludGVydmFsSW5UaWNrcykge1xuICAgICAgICAgICAgICAgIHRpY2sgPSAwO1xuICAgICAgICAgICAgICAgIGhhbmRsZXIoZ2FtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBMb2NhdGlvbnMoJHN0YXRlLCAkcSwgY29uZmlnLCBzdGF0dXNNZXNzYWdlcywgYWN0aW9ucywgTWFwKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgICAgYWN0aW9uRGVmcyA9IGFjdGlvbnMuYWN0aW9uRGVmaW5pdGlvbnMsXG4gICAgICAgICAgICBjdXJyZW50TG9jYXRpb247XG5cbiAgICAgICAgdGhpcy5jYW5DaGFuZ2VMb2NhdGlvbiA9IHRydWU7XG4gICAgICAgIHRoaXMuY2hhbmdlTG9jYXRpb24gPSBjaGFuZ2VMb2NhdGlvbjtcbiAgICAgICAgdGhpcy5jdXJyZW50ID0gZ2V0Q3VycmVudExvY2F0aW9uO1xuICAgICAgICB0aGlzLmV4cGxvcmUgPSBleHBsb3JlO1xuICAgICAgICB0aGlzLmxvY2F0aW9ucyA9IGNyZWF0ZUxvY2F0aW9ucygpO1xuICAgICAgICB0aGlzLnByb2Nlc3NUaWNrID0gcHJvY2Vzc1RpY2s7XG4gICAgICAgIHRoaXMudG9nZ2xlQ2FuQ2hhbmdlTG9jYXRpb24gPSB0b2dnbGVDYW5DaGFuZ2VMb2NhdGlvbjtcblxuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICBmdW5jdGlvbiBjaGFuZ2VMb2NhdGlvbihuZXdMb2NhdGlvbiwgbWVzc2FnZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5jYW5DaGFuZ2VMb2NhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3TG9jID0gXy5maW5kV2hlcmUoc2VsZi5sb2NhdGlvbnMsIHtpZDogbmV3TG9jYXRpb259KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5ld0xvYyAhPT0gY3VycmVudExvY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb25zLmNhbmNlbEFjdGl2ZUFjdGlvbnMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRMb2NhdGlvbiA9IG5ld0xvYztcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRMb2NhdGlvbi5kaXNjb3ZlcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1c01lc3NhZ2VzLm1lc3NhZ2UobWVzc2FnZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1c01lc3NhZ2VzLm1lc3NhZ2UoXCJZb3UgYXJlIGFscmVhZHkgdGhlcmUuXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXNNZXNzYWdlcy5tZXNzYWdlKFwiQ2Fubm90IHRyYXZlbCBhdCB0aGlzIHRpbWVcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZUxvY2F0aW9ucygpIHtcbiAgICAgICAgICAgIHJldHVybiBbXG5cbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiAndG93bicsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdUb3duJyxcbiAgICAgICAgICAgICAgICAgICAgbWFwOiBuZXcgTWFwKHtsZXZlbDogMSwgZmxvb3JDb3VudDogMSwgcm9vbUNvdW50OiAxfSksXG4gICAgICAgICAgICAgICAgICAgIGRpc2NvdmVyZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG9uVGljazogZ2VuZXJhdGVUaWNrRnVuY3Rpb24oY29uZmlnLCBjb25maWcuc2Vjb25kc1RvSGVhbEluVG93biwgZnVuY3Rpb24gKGdhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwYXJ0eSA9IGdhbWUucGFydHk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaGVhbEFtb3VudCA9IDE7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFydHkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJ0eVtpXS5oZWFsKGhlYWxBbW91bnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdJbm4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBnbyB0byB0aGUgaW5uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1c01lc3NhZ2VzLm1lc3NhZ2UoXCJDYW4ndCBnbyB0byB0aGUgaW5uIHlldC4uLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdTdXBwbGllcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGdvIHRvIHRoZSBzdG9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0xlYXZlIHRvd24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogY2hhbmdlTG9jYXRpb24oJ2ZvcmVzdCcsICdZb3UgbGVhdmUgdG93biBhbmQgZW50ZXIgdGhlIGZvcmVzdC4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgfSxcblxuXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZDogJ2ZvcmVzdCcsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdGb3Jlc3QnLFxuICAgICAgICAgICAgICAgICAgICBtYXA6IG5ldyBNYXAoe2xldmVsOiAxLCBmbG9vckNvdW50OiAxLCByb29tQ291bnQ6IDYwMCArIChNYXRoLnJhbmRvbSgpICogMTAwKX0pLFxuICAgICAgICAgICAgICAgICAgICBkaXNjb3ZlcmVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgdHJlYXN1cmU6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtuYW1lOiAnZ29sZCcsIHBjdDogMX1cbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgaGVyYnM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtuYW1lOiAnTXVzaHJvb21zJywgcGN0OiAxfVxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ1JldHVybiB0byB0b3duJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IGNoYW5nZUxvY2F0aW9uKCd0b3duJywgJ1lvdSByZXR1cm4gdG8gdGhlIHRvd24uJylcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb25EZWZzLmV4cGxvcmUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb25EZWZzLmdhdGhlckhlcmJzLFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdFbnRlciBkdW5nZW9uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaWRkZW46IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwbG9yZVBjdDogMC40LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdZb3UgZGlzY292ZXJlZCB0aGUgc3RhcnRpbmcgZHVuZ2VvbiEnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogY2hhbmdlTG9jYXRpb24oJ3N0YXJ0aW5nRHVuZ2VvbicsICdZb3UgZW50ZXIgdGhlIGR1bmdlb24uJylcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIH0sXG5cblxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6ICdzdGFydGluZ0R1bmdlb24nLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnU3RhcnRpbmcgRHVuZ2VvbicsXG4gICAgICAgICAgICAgICAgICAgIG1hcDogbmV3IE1hcCh7bGV2ZWw6IDEsIGZsb29yQ291bnQ6IDEwLCByb29tQ291bnQ6IDEwMH0pLFxuICAgICAgICAgICAgICAgICAgICBkaXNjb3ZlcmVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgdHJlYXN1cmU6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtuYW1lOiAnZ29sZCcsIHBjdDogMX1cbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdFeGl0IHRoZSBkdW5nZW9uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IGNoYW5nZUxvY2F0aW9uKCdmb3Jlc3QnLCAnWW91IGNsaW1iIGJhY2sgb3V0IHRvIHRoZSBmb3Jlc3QuJylcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF07XG4gICAgICAgIH1cblxuXG4gICAgICAgIGZ1bmN0aW9uIGV4cGxvcmUoKSB7XG4gICAgICAgICAgICB2YXIgbWFwID0gY3VycmVudExvY2F0aW9uLm1hcDtcbiAgICAgICAgICAgIGlmIChtYXApIG1hcC5leHBsb3JlKHNlbGYpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0Q3VycmVudExvY2F0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRMb2NhdGlvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHByb2Nlc3NUaWNrKGdhbWUpIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50TG9jYXRpb24ub25UaWNrKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudExvY2F0aW9uLm9uVGljayhnYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHRvZ2dsZUNhbkNoYW5nZUxvY2F0aW9uKGNhbkNoYW5nZSkge1xuICAgICAgICAgICAgc2VsZi5jYW5DaGFuZ2VMb2NhdGlvbiA9IGNhbkNoYW5nZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLnNlcnZpY2UoJ2xvY2F0aW9ucycsIExvY2F0aW9ucyk7XG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjcvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBQYXJ0eShDaGFyYWN0ZXIpIHtcblxuICAgICAgICB2YXIgY2hhcmFjdGVycyA9IFtcbiAgICAgICAgICAgIENoYXJhY3Rlci5jcmVhdGUoe25hbWU6ICdTaXIgSmVldmVzJywgY2xhc3M6ICdrbmlnaHQnfSksXG4gICAgICAgICAgICBDaGFyYWN0ZXIuY3JlYXRlKHtuYW1lOiAnVGhvcmdyaW1tIEF4ZWJlYXJkJywgY2xhc3M6ICdiZXJzZXJrZXInfSksXG4gICAgICAgICAgICBDaGFyYWN0ZXIuY3JlYXRlKHtuYW1lOiAnSmltbXkgUmF0ZmluZ2VycycsIGNsYXNzOiAndGhpZWYnfSksXG4gICAgICAgICAgICBDaGFyYWN0ZXIuY3JlYXRlKHtuYW1lOiAnQm9yaXMgT25lLXNob3QnLCBjbGFzczogJ2FyY2hlcid9KSxcbiAgICAgICAgICAgIENoYXJhY3Rlci5jcmVhdGUoe25hbWU6ICdMeXNhbm5hIERhd25icmluZ2VyJywgY2xhc3M6ICdzb3JjZXJlcid9KSxcbiAgICAgICAgICAgIENoYXJhY3Rlci5jcmVhdGUoe25hbWU6ICdMb3RoYXIgR3JlZW5icm9vaycsIGNsYXNzOiAnaGVhbGVyJ30pXG4gICAgICAgIF07XG5cbiAgICAgICAgdGhpcy5jaGFyYWN0ZXJzID0gY2hhcmFjdGVycztcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWYgYWxsIHBhcnR5IG1lbWJlcnMgYXJlIGRlYWRcbiAgICAgKi9cbiAgICBQYXJ0eS5wcm90b3R5cGUuaXNEZWFkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXy5hbGwodGhpcy5jaGFyYWN0ZXJzLCBmdW5jdGlvbiAoYykge1xuICAgICAgICAgICAgcmV0dXJuIGMuaXNEZWFkKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5zZXJ2aWNlKCdwYXJ0eScsIFBhcnR5KTtcblxufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzI1LzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgZnVuY3Rpb24gcmVzb3VyY2VzKCkge1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4cDoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdYUCcsXG4gICAgICAgICAgICAgICAgdmlzaWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjdXJyZW50OiAwXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBmb29kOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ0Zvb2QnLFxuICAgICAgICAgICAgICAgIHZpc2libGU6IHRydWUsXG4gICAgICAgICAgICAgICAgY3VycmVudDogMCxcbiAgICAgICAgICAgICAgICBtYXg6IDEwMDBcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGdvbGQ6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnR29sZCcsXG4gICAgICAgICAgICAgICAgdmlzaWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjdXJyZW50OiAwXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBpcm9uOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ0lyb24nLFxuICAgICAgICAgICAgICAgIGN1cnJlbnQ6IDAsXG4gICAgICAgICAgICAgICAgbWF4OiAxMDBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5mYWN0b3J5KCdyZXNvdXJjZXMnLCByZXNvdXJjZXMpO1xuXG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjYvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgU1RBVFVTX01FU1NBR0UgPSBcImdhbWU6c3RhdHVzTWVzc2FnZVwiO1xuXG4gICAgLyoqXG4gICAgICogQG5nSW5qZWN0XG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgZnVuY3Rpb24gU3RhdHVzTWVzc2FnZXMoJHJvb3RTY29wZSkge1xuXG4gICAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgIHRoaXMub25NZXNzYWdlID0gb25NZXNzYWdlO1xuXG4gICAgICAgIGZ1bmN0aW9uIG1lc3NhZ2Uoc3RhdHVzKSB7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoU1RBVFVTX01FU1NBR0UsIHttZXNzYWdlOiBzdGF0dXN9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIG9uTWVzc2FnZShzY29wZSwgaGFuZGxlcikge1xuICAgICAgICAgICAgc2NvcGUuJG9uKFNUQVRVU19NRVNTQUdFLCBmdW5jdGlvbiAoZSwgYXJncykge1xuICAgICAgICAgICAgICAgIGhhbmRsZXIoYXJncyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLnNlcnZpY2UoJ3N0YXR1c01lc3NhZ2VzJywgU3RhdHVzTWVzc2FnZXMpO1xufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzI0LzE1LlxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyoqXG4gICAgICogQG5nSW5qZWN0XG4gICAgICovXG4gICAgZnVuY3Rpb24gVXBncmFkZXMocmVzb3VyY2VzLCBhY3Rpb25zKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMuYnV5VXBncmFkZSA9IGJ1eVVwZ3JhZGU7XG4gICAgICAgIHRoaXMuY2FuQnV5ID0gY2FuQnV5O1xuICAgICAgICB0aGlzLnByb2Nlc3NUaWNrID0gcHJvY2Vzc1RpY2s7XG4gICAgICAgIHRoaXMudXBncmFkZURlZmluaXRpb25zID0ge1xuXG4gICAgICAgICAgICBmYXN0RXhwbG9yZToge1xuICAgICAgICAgICAgICAgIHRleHQ6ICdQZXJjZXB0aW9uJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FsbG93cyB5b3UgdG8gZXhwbG9yZSBmYXN0ZXIgKDEuMnggc3BlZWQpJyxcbiAgICAgICAgICAgICAgICBhY3RpdmU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGF2YWlsYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICByZXF1aXJlczoge1xuICAgICAgICAgICAgICAgICAgICB4cDogMjBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG5cbiAgICAgICAgICAgIGF1dG9NYXA6IHtcbiAgICAgICAgICAgICAgICB0ZXh0OiAnQ2FydG9ncmFwaGVyJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ByZXZlbnRzIHlvdSBmcm9tIGdldHRpbmcgbG9zdC4nLFxuICAgICAgICAgICAgICAgIGFjdGl2ZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgYXZhaWxhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIHJlcXVpcmVzOiB7XG4gICAgICAgICAgICAgICAgICAgIHhwOiA3NVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cblxuICAgICAgICAgICAgYXV0b0dhdGhlcjoge1xuICAgICAgICAgICAgICAgIHRleHQ6ICdBdXRvLWdhdGhlcicsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBdXRvbWF0aWNhbGx5IGdhdGhlcnMgaGVyYnMgd2hlbiB5b3UgYXJlIGluIGFuIGFyZWEgdGhhdCBoYXMgdGhlbS4nLFxuICAgICAgICAgICAgICAgIGFjdGl2ZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgY2hlY2tBdmFpbGFibGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc291cmNlcy5oZXJicyAmJiByZXNvdXJjZXMuaGVyYnMuY3VycmVudCA+IDE7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByZXF1aXJlczoge1xuICAgICAgICAgICAgICAgICAgICBoZXJiczogMTBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG5cbiAgICAgICAgICAgIGF1dG9FeHBsb3JlOiB7XG4gICAgICAgICAgICAgICAgdGV4dDogJ0F1dG8tZXhwbG9yZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBdXRvbWF0aWNhbGx5IGV4cGxvcmVzIGFuIGFyZWEsIHN0b3BwaW5nIHdoZW4gaGl0IHBvaW50cyBnZXQgbG93LicsXG4gICAgICAgICAgICAgICAgYWN0aXZlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBjaGVja0F2YWlsYWJsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJlcXVpcmVzOiB7XG4gICAgICAgICAgICAgICAgICAgIHhwOiAyLjAwXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgIGZ1bmN0aW9uIHByb2Nlc3NUaWNrKGdhbWUpIHtcbiAgICAgICAgICAgIC8vIGRvIHN0dWZmIHRoYXQgc2hvdWxkIGhhcHBlbiBldmVyeSB0aWNrLCBkZXBlbmRpbmcgb24gdGhlIHVwZ3JhZGVzXG5cbiAgICAgICAgICAgIGNoZWNrRm9yQXZhaWxhYmxlKCk7XG5cbiAgICAgICAgICAgIGlmICghZ2FtZS5pc0luQmF0dGxlKCkpIHtcbiAgICAgICAgICAgICAgICAvLyBvbmx5IGRvIHRoaXMgc3R1ZmYgaWYgd2UncmUgbm90IGZpZ2h0aW5nIGFueWJvZHlcbiAgICAgICAgICAgICAgICAvL2RvQXV0b0V4cGxvcmUoZ2FtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBkb0F1dG9FeHBsb3JlKGdhbWUpIHtcbiAgICAgICAgICAgIGlmIChzZWxmLnVwZ3JhZGVEZWZpbml0aW9ucy5hdXRvRXhwbG9yZS5hY3RpdmUgJiYgIWdhbWUuaXNJbkJhdHRsZSgpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFjdGlvbiA9IGFjdGlvbnMuYWN0aW9uRGVmaW5pdGlvbnMuZXhwbG9yZTtcbiAgICAgICAgICAgICAgICBhY3Rpb25zLmRvQWN0aW9uKGdhbWUsIGFjdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjYW5CdXkodXBncmFkZSkge1xuICAgICAgICAgICAgaWYgKHVwZ3JhZGUucmVxdWlyZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2FuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciByZXNvdXJjZSBpbiB1cGdyYWRlLnJlcXVpcmVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1cGdyYWRlLnJlcXVpcmVzLmhhc093blByb3BlcnR5KHJlc291cmNlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvdXJjZXNbcmVzb3VyY2VdIHx8IHJlc291cmNlc1tyZXNvdXJjZV0uY3VycmVudCA8IHVwZ3JhZGUucmVxdWlyZXNbcmVzb3VyY2VdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbjtcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjaGVja0ZvckF2YWlsYWJsZSgpIHtcbiAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChzZWxmLnVwZ3JhZGVEZWZpbml0aW9ucywgZnVuY3Rpb24gKHVwZ3JhZGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXVwZ3JhZGUuYWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1cGdyYWRlLmNoZWNrQXZhaWxhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodXBncmFkZS5jaGVja0F2YWlsYWJsZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb25jZSBpdCdzIGF2YWlsYWJsZSwgaXQgYWx3YXlzIGlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBncmFkZS5jaGVja0F2YWlsYWJsZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBncmFkZS5hdmFpbGFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh1cGdyYWRlLmF2YWlsYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgd2UgY2FuIHB1cmNoYXNlIGl0XG4gICAgICAgICAgICAgICAgICAgICAgICB1cGdyYWRlLmNhblB1cmNoYXNlID0gY2FuQnV5KHVwZ3JhZGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBidXlVcGdyYWRlKHVwZ3JhZGUpIHtcbiAgICAgICAgICAgIGlmIChjYW5CdXkodXBncmFkZSkpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciByZXNvdXJjZSBpbiB1cGdyYWRlLnJlcXVpcmVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1cGdyYWRlLnJlcXVpcmVzLmhhc093blByb3BlcnR5KHJlc291cmNlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzW3Jlc291cmNlXS5jdXJyZW50IC09IHVwZ3JhZGUucmVxdWlyZXNbcmVzb3VyY2VdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHVwZ3JhZGUuYWN0aXZlID0gdHJ1ZTsgIC8vdG9kbzogbmVlZCB0byBhY2NvdW50IGZvciB1cGdyYWRlcyB3aXRoIG11bHRpcGxlIGxldmVsc1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgIH1cblxuICAgIGFuZ3VsYXIubW9kdWxlKCdnYW1lJylcbiAgICAgICAgLnNlcnZpY2UoJ3VwZ3JhZGVzJywgVXBncmFkZXMpO1xuXG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjcvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBmdW5jdGlvbiBVdGlscygpIHtcblxuICAgICAgICB0aGlzLmNsYW1wID0gY2xhbXA7XG4gICAgICAgIHRoaXMucmFuZG9tSW50ID0gcmFuZG9tSW50O1xuICAgICAgICB0aGlzLnJhbmRvbUVsZW1lbnQgPSByYW5kb21FbGVtZW50O1xuICAgICAgICB0aGlzLnJhbmRvbUZsb2F0ID0gcmFuZG9tRmxvYXQ7XG5cbiAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICBmdW5jdGlvbiBjbGFtcCh2YWx1ZSwgbWluLCBtYXgpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLm1pbihNYXRoLm1heChtaW4sIHZhbHVlKSwgbWF4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHJhbmRvbUludChtaW4sIG1heCkge1xuICAgICAgICAgICAgdmFyIGRpZmYgPSBtYXggLSBtaW47XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcigoTWF0aC5yYW5kb20oKSAqIGRpZmYpICsgbWluKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHJhbmRvbUZsb2F0KG1pbiwgbWF4KSB7XG4gICAgICAgICAgICB2YXIgZGlmZiA9IG1heCAtIG1pbjtcbiAgICAgICAgICAgIHJldHVybiAoTWF0aC5yYW5kb20oKSAqIGRpZmYpICsgbWluO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcmFuZG9tRWxlbWVudChhcnJheSwgd2VpZ2h0UHJvcGVydHksIGlzRnVuY3Rpb24pIHtcbiAgICAgICAgICAgIHZhciBnZXRXZWlnaHQgPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSAwO1xuICAgICAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBpdGVtW3dlaWdodFByb3BlcnR5XSgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBpdGVtW3dlaWdodFByb3BlcnR5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgdG90YWxXZWlnaHRzID0gXy5yZWR1Y2UoYXJyYXksIGZ1bmN0aW9uIChyZXN1bHQsIG4sIGlkeCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCArPSBnZXRXZWlnaHQobik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgdmFyIHJhbmRvbUluZGV4ID0gcmFuZG9tSW50KDAsIHRvdGFsV2VpZ2h0cyk7XG4gICAgICAgICAgICB2YXIgY291bnQgPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvdW50ICs9IGdldFdlaWdodChhcnJheVtpXSk7XG4gICAgICAgICAgICAgICAgaWYgKGNvdW50ID49IHJhbmRvbUluZGV4KVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXJyYXlbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYXJyYXlbYXJyYXkubGVuZ3RoIC0gMV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnZ2FtZScpXG4gICAgICAgIC5zZXJ2aWNlKCd1dGlscycsIFV0aWxzKTtcblxufSkoKTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgam9obiBvbiAxLzMxLzE1LlxuICovXG4oZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cblxuXG59KSgpOyIsIi8qKlxuICogQ3JlYXRlZCBieSBqb2huIG9uIDEvMjIvMTUuXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKipcbiAgICAgKiBAbmdJbmplY3RcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjaGFyYWN0ZXJGYWN0b3J5KGNvbmZpZywgdXRpbHMsICRyZXNvdXJjZSkge1xuICAgICAgICB2YXIgdXJsID0gY29uZmlnLmFwaVNlcnZlciArICdjaGFyYWN0ZXIvOmlkJztcbiAgICAgICAgdmFyIENoYXJhY3RlciA9ICRyZXNvdXJjZSh1cmwsIHtpZDogJ0BpZCd9KTtcbiAgICAgICAgdmFyIGlkID0gMTtcblxuICAgICAgICBhbmd1bGFyLmV4dGVuZChDaGFyYWN0ZXIsIHtcblxuICAgICAgICAgICAgY3JlYXRlOiBmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgICAgIGFyZ3MgPSBhcmdzIHx8IHt9O1xuICAgICAgICAgICAgICAgIHZhciBjaGFyID0gbmV3IENoYXJhY3Rlcih7aWQ6IGFyZ3MuaWQgfHwgaWQrK30pO1xuXG4gICAgICAgICAgICAgICAgY2hhci5uYW1lID0gYXJncy5uYW1lIHx8ICdjaGFyYWN0ZXInO1xuICAgICAgICAgICAgICAgIGNoYXIuY2xhc3MgPSBhcmdzLmNsYXNzO1xuICAgICAgICAgICAgICAgIGNoYXIubGV2ZWwgPSAxO1xuICAgICAgICAgICAgICAgIGNoYXIuaHAgPSB7Y3VycmVudDogMTAsIG1heDogMTB9O1xuICAgICAgICAgICAgICAgIGNoYXIubXAgPSB7Y3VycmVudDogMTAsIG1heDogMTB9O1xuICAgICAgICAgICAgICAgIGNoYXIuYXRrID0gMTA7XG4gICAgICAgICAgICAgICAgY2hhci5kZWYgPSAxMDtcbiAgICAgICAgICAgICAgICBjaGFyLm1hZ2ljID0gMTA7XG4gICAgICAgICAgICAgICAgY2hhci5zcGVlZCA9IDEwO1xuICAgICAgICAgICAgICAgIGNoYXIuYWMgPSAxMDtcblxuICAgICAgICAgICAgICAgIHJldHVybiBjaGFyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBDaGFyYWN0ZXIucHJvdG90eXBlLmRhbWFnZSA9IGZ1bmN0aW9uIChhbW91bnQpIHtcbiAgICAgICAgICAgIHRoaXMuaHAuY3VycmVudCAtPSBhbW91bnQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgQ2hhcmFjdGVyLnByb3RvdHlwZS5oZWFsID0gZnVuY3Rpb24gKGFtb3VudCkge1xuICAgICAgICAgICAgdGhpcy5ocC5jdXJyZW50ID0gdXRpbHMuY2xhbXAodGhpcy5ocC5jdXJyZW50ICsgYW1vdW50LCAwLCB0aGlzLmhwLm1heCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgQ2hhcmFjdGVyLnByb3RvdHlwZS5pc0RlYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5ocC5jdXJyZW50IDw9IDA7XG4gICAgICAgIH07XG5cbiAgICAgICAgQ2hhcmFjdGVyLnByb3RvdHlwZS5hdHRhY2sgPSBmdW5jdGlvbiAoZW5lbWllcykge1xuICAgICAgICAgICAgaWYgKCFlbmVtaWVzIHx8IGVuZW1pZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogXCJBbGwgZW5lbWllcyBoYXZlIGJlZW4gZGVmZWF0ZWQuXCIsXG4gICAgICAgICAgICAgICAgICAgIHZpY3Rvcnk6IHRydWVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpbXBsZW1lbnQgc29tZSBraW5kIG9mIHdheSB0byBjaG9vc2Ugd2hpY2ggZW5lbXkgdG8gZmlnaHQsIG9yIGFsbG93IGNob29zaW5nIHNvbWUga2luZCBvZiBBSVxuICAgICAgICAgICAgLy92YXIgcmFuZG9tRW5lbXkgPSBfLnNhbXBsZShlbmVtaWVzKTtcbiAgICAgICAgICAgIHZhciByYW5kb21FbmVteSA9IHV0aWxzLnJhbmRvbUVsZW1lbnQoZW5lbWllcywgJ2NvbmRpdGlvbicsIHRydWUpO1xuXG4gICAgICAgICAgICB2YXIgZG1nID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogdGhpcy5hdGspO1xuICAgICAgICAgICAgdmFyIG1zZztcbiAgICAgICAgICAgIGlmIChkbWcgPiAwKSB7XG4gICAgICAgICAgICAgICAgbXNnID0gdGhpcy5uYW1lICsgXCIgc3RyaWtlcyBcIiArIHJhbmRvbUVuZW15Lm5hbWUgKyBcIiBmb3IgXCIgKyBkbWcgKyBcIiBkYW1hZ2UhXCI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1zZyA9IHRoaXMubmFtZSArIFwiIG1pc3NlZCBcIiArIHJhbmRvbUVuZW15Lm5hbWUgKyBcIi5cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB4cCA9IDA7XG5cbiAgICAgICAgICAgIHJhbmRvbUVuZW15LmRhbWFnZShkbWcpO1xuICAgICAgICAgICAgaWYgKHJhbmRvbUVuZW15LmlzRGVhZCgpKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbmVtaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbmVtaWVzW2ldID09PSByYW5kb21FbmVteSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5lbWllcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbXNnICs9IFwiIFwiICsgcmFuZG9tRW5lbXkubmFtZSArIFwiIGlzIGRlYWQhXCI7XG4gICAgICAgICAgICAgICAgeHAgPSByYW5kb21FbmVteS54cDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0OiByYW5kb21FbmVteSxcbiAgICAgICAgICAgICAgICBkYW1hZ2U6IGRtZyxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBtc2csXG4gICAgICAgICAgICAgICAgeHA6IHhwXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBDaGFyYWN0ZXI7XG4gICAgfVxuXG4gICAgYW5ndWxhci5tb2R1bGUoJ2dhbWUnKVxuICAgICAgICAuZmFjdG9yeSgnQ2hhcmFjdGVyJywgY2hhcmFjdGVyRmFjdG9yeSk7XG59KSgpOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==