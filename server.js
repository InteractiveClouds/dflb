const
    app  = require('express')(),
    bodyParser = require('body-parser'),
    http = require('http'),
    Q = require('q'),
    PAPI = require('./lib/PAPI'),
    NGINX = require('./lib/NGINX'),
    AR = require('./lib/authRequest').getRequestInstance({}),
    
    RGX_ERROR_URL = /^\/errors\/([^\/]+)\/?/,
    PATH_TO_NGINX_CONFIG = '/usr/local/nginx-perl/conf/nginx-perl.conf',
    PATH_TO_TENANTS_MAP  = '/var/lib/dreamface/lbdata/tenants.map',
    errors = {
            fallback : function ( req, res, next ) {
                    console.log(req.headers);
                    res.status(503).end('DreamFace Load Balancer: Repeat the request later.');
                }
        },
    CFG = {};


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
    console.log('GOT DFM NOTIFICATION : ', req.body);
    res.end();

    //run2();
});

http.createServer(app).listen(3050, '0.0.0.0');


// ------------------------------------------------------------ TODO

const
    INSTANCE_ONE_NAME = 'dfx_instance_1',
    INSTANCE_TWO_NAME = 'dfx_instance_2';

var
    instanceOneIP, instanceTwoIP;

PAPI.runInstance({
    image : 'l_dfx',
    name  : INSTANCE_ONE_NAME,
    dfm   : {
            bindPort  : '4001',
            camtime   : '5',
            notifyURL : 'http://172.17.0.2:3050/notify'
        }
})
.then(function(ip){
    instanceOneIP = ip;
    console.log('new instance IP : %s', ip);

    return Q.delay(5000).then(function(){
        return AR.post({
            url: 'http://' + ip + ':3049/start',
            headers: {'Content-Type': 'application/json; charset=utf-8'},
            body: JSON.stringify({
                "components" : {
                    "dev" : {
                        "config" : {
                            "server_host" : "0.0.0.0",
                            "server_port" : 3000,
                            "edition": "development",
                            "storage": "mongod",
                            "external_server_host": "192.168.99.100",
                            "external_server_port": 3000,
                            "docker_daemon" : {
                                "useDefaultSettings" : true
                            },
                            "studio_version": 3,
                            "resources_development_path": "/var/lib/dreamface/data/resources",
                            "tempDirForTemplates" : "/var/lib/dreamface/data/temptemplates",
                            "tempDir" : "/var/lib/dreamface/data/tmp",
                            "app_build_path": "/var/lib/dreamface/data/app_builds",
                            "auth_conf_path" : "/var/lib/dreamface/data/.auth.conf",
                            "mdbw_options" : {
                                "host" : "192.168.1.119",
                                "port" : 27017
                            },
                            "X-DREAMFACE-SERVER" : INSTANCE_ONE_NAME,
                            "redis_config" : {
                                "host" : "192.168.1.119"
                            }
                        }
                    }
                }
            })
        })
        .then(function(res){
            console.log('instance 1 start dev response : ', res.body.toString('utf-8'));
            NGINX.changeConfig(PATH_TO_TENANTS_MAP, {
                '*' : instanceOneIP
            });
        });
    });
})
.fail(function(error){
    console.log('ERROR : ', error);
});



function run2 () {
    return PAPI.runInstance({
        image : 'l_dfx',
        name  : INSTANCE_TWO_NAME,
        dfm   : {
                bindPort  : '4002',
                camtime   : '5',
                notifyURL : 'http://172.17.0.2:3050/notify'
            }
    })
    .then(function(ip){
        instanceTwoIP = ip;
        console.log('new instance IP : %s', ip);
    
        return Q.delay(5000).then(function(){
            return AR.post({
                url: 'http://' + ip + ':3049/start',
                headers: {'Content-Type': 'application/json; charset=utf-8'},
                body: JSON.stringify({
                    "components" : {
                        "dev" : {
                            "config" : {
                                "server_host" : "0.0.0.0",
                                "server_port" : 3000,
                                "edition": "development",
                                "storage": "mongod",
                                "external_server_host": "192.168.99.100",
                                "external_server_port": 3000,
                                "docker_daemon" : {
                                    "useDefaultSettings" : true
                                },
                                "studio_version": 3,
                                "resources_development_path": "/var/lib/dreamface/data/resources",
                                "tempDirForTemplates" : "/var/lib/dreamface/data/temptemplates",
                                "tempDir" : "/var/lib/dreamface/data/tmp",
                                "app_build_path": "/var/lib/dreamface/data/app_builds",
                                "auth_conf_path" : "/var/lib/dreamface/data/.auth.conf",
                                "mdbw_options" : {
                                    "host" : "192.168.1.119",
                                    "port" : 27017
                                },
                                "X-DREAMFACE-SERVER" : INSTANCE_TWO_NAME,
                                "redis_config" : {
                                    "host" : "192.168.1.119"
                                }
                            }
                        }
                    }
                })
            })
            .then(function(res){
                console.log('instance 2 start dev response : ', res.body.toString('utf-8'));
                return NGINX.changeConfig(PATH_TO_TENANTS_MAP, {
                    'com' : instanceTwoIP,
                    '*'   : instanceOneIP
                });
            });
        });
    })
    .fail(function(error){
        console.log('ERROR : ', error);
    });
};
