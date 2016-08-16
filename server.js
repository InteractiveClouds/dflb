const
    app  = require('express')(),
    bodyParser = require('body-parser'),
    http = require('http');


app.use(bodyParser.json({limit:'50mb'}));

app.post('/notify', function (req, res, next){
    console.log(req.body);
    res.end();
});

http.createServer(app).listen(3050, '0.0.0.0');
