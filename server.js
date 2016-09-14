require('./config');
global.CFG.events = new (require('./lib/events'))(true);

const
    app  = require('express')(),
    bodyParser = require('body-parser'),
    http = require('http'),
    Q = require('q'),
    U = require('./lib/utils'),
    RGX_ERROR_URL = /^\/errors\/([^\/]+)\/?/,
    errors = {
            fallback : function ( req, res, next ) {
                    console.log(req.headers);
                    res.status(503).end('DreamFace Load Balancer: Repeat the request later.');
                }
        },
    cloud = require('./cloud');

app.use(bodyParser.json({limit:'50mb'}));
app.use(function(req, res, next){

    // it handles all requests for /errors/[Object.keys(errors)]
    // for all HTTP methods
    // TODO run another server for the errors

    const error = ( RGX_ERROR_URL.exec(req.originalUrl) || [] )[1];

    if ( error && errors.hasOwnProperty(error) ) {
        errors[error](req, res, next);
    } else {
        next();
    }
});

app.post('/notify', function (req, res, next){
    console.log('got %s notification from %s : ', req.body.type, req.ip, req.body);
    const eventName = U.convertToEventName(req.body.type, req.ip);
    if ( eventName ) CFG.events.publish(eventName, req.body);
    res.end();
});

// TODO remove
app.get('/dump', function (req, res, next){ res.json(cloud.dump()) });

http.createServer(app).listen(CFG.my.port, '0.0.0.0');


cloud.init({
    U     : U,
    AR    : require('./lib/authRequest').getRequestInstance({}), // TODO --> modem
    NGINX : require('./lib/NGINX'),
    PAPI  : require('./lib/PAPI').init({ docker_daemon : CFG.docker_daemon }),
    modem : require('./lib/modem'),

})
//.then(cloud.startBalancing)
.done();
