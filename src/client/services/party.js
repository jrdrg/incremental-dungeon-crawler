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