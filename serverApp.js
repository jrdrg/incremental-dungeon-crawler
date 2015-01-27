var express = require('express');
var bodyParser = require('body-parser');
var characters = require('./src/server/api/characterRepository');
var app = express();

app.use(bodyParser.json({}));
app.use('/public', express.static(__dirname + '/public'));
app.use('/partials', express.static(__dirname + '/views/partials'));


app.get('/character/:id', characters.getCharacter);
app.post('/character/:id', characters.newCharacter);


app.all('/*', function (req, res, next) {

    // Sends the index.html for other files to support HTML5Mode
    res.sendFile('/views/index.html', {root: __dirname});
});

var port = process.env.PORT || 13098;
app.listen(port);
