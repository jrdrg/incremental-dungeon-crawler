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

    angular.module('game')
        .factory('Battle', battleFactory);

})();