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