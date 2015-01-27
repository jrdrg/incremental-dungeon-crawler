/**
 * Created by john on 1/22/15.
 */

function Character(id) {

    this.name = "Character " + id;

    this.hp = 10;
    this.atk = 10;
    this.def = 5;

    console.log("created character " + id);
}

module.exports = Character;