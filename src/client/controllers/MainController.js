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

    angular.module('game')
        .controller('MainController', MainController);
})();