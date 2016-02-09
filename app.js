var express = require('express');

var app = express();
app.get('/', function(req, res){
    res.send('Can I haz AMEIS?');
});

var WebServerPort = 8080;
app.listen(WebServerPort, function() {
    console.log('Express webserver running on ' + WebServerPort);;
});
