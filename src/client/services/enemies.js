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
