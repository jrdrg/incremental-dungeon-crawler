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

    angular.module('game')
        .controller('MainController', MainController);
})();