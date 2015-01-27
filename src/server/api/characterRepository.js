/**
 * Created by john on 1/22/15.
 */

var Character = require('./../character');

function getCharacter(req, res) {
    var id = req.params.id;
    var char = new Character(id);
    res.send(char);
}

function newCharacter(req, res) {
    console.log("newCharacter");
    console.log(JSON.stringify(req.body));
}

function updateCharacter(req, res) {
    var id = req.params.id;
}


module.exports = {
    getCharacter: getCharacter,
    newCharacter: newCharacter,
    updateCharacter: updateCharacter
};