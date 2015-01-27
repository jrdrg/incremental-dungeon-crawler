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
