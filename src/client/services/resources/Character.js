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

    angular.module('game')
        .factory('Character', characterFactory);
})();