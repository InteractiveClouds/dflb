global.CFG = {
    tenantsMapPath : '/var/lib/dreamface/data/tenants.map',
    instanceImageName : 'dfx',
    dfm : {
        port      : 3049,
        prototcol : 'http',
        camtime   : 5,
    },
    my : {
        port : 3050,
        protocol : 'http', // TODO use it while creating server
    },
    events : new (require('./lib/events'))(true),
    WAIT_FOR_DFMUP : 10000,
    WAIT_FOR_CUP   : 10000,
    loadLevels : {
        regular : {
            idle : 1,
            high : 9
        },
        master : {
            idle : -1,
            high : 6
        }
    },
    cConfigs : {
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
                //"X-DREAMFACE-SERVER" : cloud.servers[0].name,
                "redis_config" : {
                    "host" : "192.168.1.119"
                },
                compiler : {
                    host: '192.168.99.100',
                    port: 3002
                }
            }
        },
        "dep" : {
            "config" : {
                "server_host" : "0.0.0.0",
                "edition"     : "deployment",
                "storage"     : "file",
                "server_port" : 3001,
                "deploy_path" : "/var/lib/dreamface/data/deploy",
                "fsdb_path"   : "/var/lib/dreamface/data/app_fsdb",
                "tempDir"     : "/var/lib/dreamface/data/tmp",
                "auth_conf_path" : "/var/lib/dreamface/data/.auth.conf",
                "redis_config" : {
                    "host" : "192.168.1.119"
                }
            }
        },
        "dfc" : {
            "config" : {
                "server_port" : 3002,
                "dfx_path" : "/Users/surr/d/p/dfx",
                "dfx_servers" : [
                    {
                        "name" : "dfx",
                        "cfg"  : {
                            "address"        : "http://192.168.99.100:3000/",
                            "auth_conf_path" : "/var/lib/dreamface/data/.auth.conf"
                        }
                    }
                ],
                "target_dir" : "/var/lib/dreamface/data/comptasks",
                "tmp_dir"    : "/var/lib/dreamface/data/comptmp"
            }
        }
    }
};

const
    app  = require('express')(),
    bodyParser = require('body-parser'),
    http = require('http'),
    Q = require('q'),
    fs = require('fs'),
    PAPI = require('./lib/PAPI').init({
        docker_daemon : {
            useDefaultSettings: false,
            protocol: 'https',
            checkServerIdentity : false,
            host : '192.168.99.100',
            port : process.env.DOCKER_PORT || 2376,
            ca   : fs.readFileSync('/var/lib/dreamface/data/lbdata/docker.certs/ca.pem').toString('utf8'),
            cert : fs.readFileSync('/var/lib/dreamface/data/lbdata/docker.certs/cert.pem').toString('utf8'),
            key  : fs.readFileSync('/var/lib/dreamface/data/lbdata/docker.certs/key.pem').toString('utf8')
        }
    }),
    NGINX = require('./lib/NGINX'),
    AR = require('./lib/authRequest').getRequestInstance({}),
    
    RGX_ERROR_URL = /^\/errors\/([^\/]+)\/?/,
    PATH_TO_NGINX_CONFIG = '/usr/local/nginx-perl/conf/nginx-perl.conf',
    errors = {
            fallback : function ( req, res, next ) {
                    console.log(req.headers);
                    res.status(503).end('DreamFace Load Balancer: Repeat the request later.');
                }
        };


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
    const eventName = utils.convertToEventName(req.body.type, req.ip);
    if ( eventName ) CFG.events.publish(eventName, req.body);
    res.end();
});

app.get('/dump', function (req, res, next){
    res.json(cloud.dump());
});

http.createServer(app).listen(3050, '0.0.0.0');

const utils = {
    convertToEventName : function ( type, ip ) {
        return type + '_' + ip;
    }
};

const serverNames = (function(){
    const 
        free = [
            'Alfred_Binet',
            'Gottlieb_Daimler',
            'Max_Delbruck',
            'Otto_Hahn',
            'John_Dalton',
            'Carl_Sagan',
            'Steven_Chu'
        ],
        assigned = {};

    var counter = 0;

    return {
        get : function(){
            var name = '';
            while ( free.length && !name ) {
                name = free.splice( random(free.length - 1), 1 )[0];
                if ( assigned.hasOwnProperty(name) ) name = '';
            }
            if ( !name ) while ( !name ) {
                name = ++counter;
                if ( assigned.hasOwnProperty(name) ) name = '';
            }
            assigned[name] = true;
            return name;
        },

        markAsAssigned : function ( name ) {
            return name
                ? (assigned[name] = true) && name
                : ''
        },

        release : function ( name ) {
            delete assigned[name];
            free.push(name);
        }
    }

    function random ( min, max ) {
        if ( !max ) { max = min; min = 0; }
        return min + Math.round(Math.random() * (max - min) );
    }

})();

//var bindPort = 4001;

const serversList = {};
function Server ( o ) {

    o = o || {};

    const
        server = this,
        started = Q.defer();

    server.name = serverNames.markAsAssigned(o.name) || serverNames.get();

    if ( serversList.hasOwnProperty(server.name) ) return started.reject(
        'the server ' + server.name + ' already exists'
    );

    serversList[server.name] = true;

    server.components = {};
    server.isReconfiguring = false;
    server.CPU = 0;



    if ( o.ip ) { // if server exists
        server.ip = o.ip;
        server.id = o.id;

        CFG.events.subscribe(
            utils.convertToEventName('CPU', server.ip),
            function (event, data) {
                server.updateCPU(event, data)
            }
        );

        return server.getHealth().then(function(res){
            started.resolve(server);
            return server;
        });
    }

    // if server does not exist
    PAPI.createInstance({
        image : CFG.instanceImageName,
        name  : server.name,
        dfm   : {
                //bindPort  : ++bindPort + '', // TODO remove
                camtime   : CFG.dfm.camtime,
                notifyURL : CFG.my.protocol + '://' + CFG.my.localIP + ':' + CFG.my.port + '/notify'
            }
    })
    .then(function(res){
        server.id = res.id;
        server.ip = res.ip;

        CFG.events.subscribe(
            utils.convertToEventName('CPU', server.ip),
            function (event, data) {
                server.updateCPU(event, data)
            }
        );

        console.log('[INFO] created instanse %s, at %s', server.name, server.ip);

        const timeout = setTimeout(
            function(){
                server.reject('DFMUP timeout')
            },
            CFG.WAIT_FOR_DFMUP
        );

        CFG.events.subscribe(
            utils.convertToEventName('DFMUP', server.ip),
            function onDFMUP (event, data){
                clearTimeout(timeout);
                console.log('server %s sent DFMUP', server.ip);
                CFG.events.unsubscribe(utils.convertToEventName('DFMUP', server.ip), onDFMUP);

                server.changeConfiguration(o)
                .then(function(){
                    started.resolve(server)
                })
                .done();
            }
        );

    })
    .fail(function(error){ started.reject(error) })

    return started.promise;
}

Server.prototype.changeConfiguration = function (_config) {

    const
        server = this,
        cnames_toStart = _config.components,
        cnames_toStop = [],
        cnames_Started = Object.keys(server.components),
        config = {components:{}},
        starting = Q.defer(),
        stopping = Q.defer();

    if ( server.isReconfiguring ) return Q.reject('is reconfiguring');

    server.isReconfiguring = true;

    cnames_Started.forEach(function(cname){
        const index = cnames_toStart.indexOf(cname);
        if ( !!~index ) cnames_toStart.splice(index, 1);
        if ( !~_config.components.indexOf(cname) ) cnames_toStop.push(cname);
    });

    cnames_toStart.forEach(function(cname){
        config.components[cname] = JSON.parse(JSON.stringify(CFG.cConfigs[cname]));
        config.components[cname].config['X-DREAMFACE-SERVER'] = server.name;
    });

    if ( cnames_toStop.length ) {
        console.log('[INFO] CHANGE CONFIGURATION : stopping ', cnames_toStop);
        AR.post({
            url : CFG.dfm.prototcol + '://' + server.ip + ':' + CFG.dfm.port + '/stop',
            headers: {'Content-Type': 'application/json; charset=utf-8'},
            body : JSON.stringify({components : cnames_toStop})
        })
        .then(function(){stopping.resolve()})
        .fail(function(error){stopping.reject(error)});
    } else {
        stopping.resolve();
    }

    if ( cnames_toStart.length ) {
        console.log('[INFO] CHANGE CONFIGURATION : starting ', cnames_toStart);
        AR.post({
            url : CFG.dfm.prototcol + '://' + server.ip + ':' + CFG.dfm.port + '/start',
            headers: {'Content-Type': 'application/json; charset=utf-8'},
            body : JSON.stringify(config)
        })
        .then(function(response){
            try {
                const answer = JSON.parse(response.body.toString('utf8'));
            } catch (error) {
                //console.log('RESPONSE : ', response.body.toString('utf8'));
                server.isReconfiguring = false;
                return Q.reject('can not parse CUP response');
            }

            if ( response.status*1 !== 202 ) {
                server.isReconfiguring = false;
                return Q.reject('server returned non 202');
            }


            // subscribe on CUP
            const
                eventName = utils.convertToEventName('CUP', server.ip),
                D = Q.defer(),
                timeout = setTimeout(
                        function(){
                            server.isReconfiguring = false;
                            CFG.events.unsubscribe( eventName, onCUP);
                            D.reject('CUP timeout');
                        },
                        CFG.WAIT_FOR_CUP
                    );
            
            function onCUP (event, answer) {
                //console.log(typeof answer, answer);
                CFG.events.unsubscribe( eventName, onCUP);
                clearTimeout(timeout);
                server.isReconfiguring = false;
                if ( answer.status !== 'done' ) return D.reject('CUP status is failed');

                server.getHealth()
                .then(function(){D.resolve()})
                .fail(function(error){D.reject(error)})
            }
            CFG.events.subscribe( eventName, onCUP);

            return D.promise;
        })
        .then(function(){starting.resolve()})
        .fail(function(error){starting.reject(error)});
    } else {
        starting.resolve();
    }

    return Q.all([starting, stopping]);
}


Server.prototype.getHealth = function () {

    const server = this;

    return AR.get({
        url : CFG.dfm.prototcol + '://' + this.ip + ':' + CFG.dfm.port + '/health'
    })
    .then(function(response){

        try {
            const health = JSON.parse(response.body.toString('utf8'));
        } catch (error) {
            return console.error('[ERROR] getHealth parse : ', error);
        }

        server.updateCPU(null, health);
    })
};

Server.prototype.updateCPU = function (event, _status) {
    // 'event' argument is not used
    const
        server = this,
        list = _status.componentsStatus || _status.stat,
        CPU  = _status.currentTotalCPULevel || _status.level || 0;

    for ( var cname in list ) {
        server.components[cname] = {
            CPU : list[cname].CPU < 0 ? 0 : list[cname]
        };
    }
    server.CPU = CPU < 0 ? 0 : CPU;
};

Server.prototype.remove = function () {
    const server = this;

    return server.changeConfiguration({components:[]})
    .then(function(){
        return PAPI.removeInstance(server.id);
    })
};


const cloud = {
    isReorganizing : true,
    servers : [],
    mapIpToServer : {},
    tenants : {}, // .map = {}

    createInstance : function ( config ) {
        return (new Server(config))
        .then(function(server){
            cloud.mapIpToServer[server.ip] = server;
            cloud.servers.push(server);

            var map = cloud.tenants.map;
            config.tenants.forEach(function(tenant){
                map.dev[tenant] = server.ip;
                map.dep[tenant] = server.ip;
                map.dfc[tenant] = server.ip;
            });
            return NGINX.changeConfig(map);
        });
    },

    includeInstance : function ( item ) {
        return (new Server(item)).then(function(server){
            cloud.mapIpToServer[server.ip] = server;
            cloud.servers.push(server);
        });
    },

    removeInstance : function ( server ) {
        return server.remove()
        .then(function(){
            const index = cloud.servers.indexOf(server);
            if ( !!~index ) cloud.servers.splice(index, 1);
            delete cloud.mapIpToServer[server.ip]

            const
                tenantsToRemoveFromMap = [],
                devMap = cloud.tenants.map.dev;
            for ( var tenant in devMap ) {
                if ( devMap[tenant] === server.ip ) {
                    tenantsToRemoveFromMap.push(tenant);
                }
            }

            tenantsToRemoveFromMap.forEach(function(tenant){
                delete cloud.tenants.map.dev[tenant];
                delete cloud.tenants.map.dep[tenant];
                delete cloud.tenants.map.dfc[tenant];
            });

            if ( tenantsToRemoveFromMap.length ) {
                return NGINX.changeConfig(cloud.tenants.map);
            }
        })
    },

    init : function () {
    
        return getMyLocalIP().then(function(ip){
            console.log('my IP is ', ip);
            CFG.my.localIP = ip;

            return Q.all([

                NGINX.readConfig().then(function(map){
                    cloud.tenants.map = map;
                }),
    
                PAPI.listInstances().then(function(list){
                    list = list || [];
                    if ( list.length ) {
                        return Q.all(list.map(function(item){
                            return cloud.includeInstance(item);
                        }))
                        .then(function(){
                            cloud.masterServer = cloud.mapIpToServer[
                                    cloud.tenants.map.dev['*']
                                ];
                        });
                    } else {
                        return cloud.createInstance({
                            components : ['dev', 'dep', 'dfc'],
                            tenants    : ['*']
                        })
                        .then(function(){
                            cloud.masterServer = cloud.servers[0];
                        })
                    }
                })
            ])
        })
        .then(function(){ cloud.isReorganizing = false});
    },

    dump : function () {
        const
            idles   = [],
            highs   = [],
            normals = [],
            servers = [];
        var cloudCPU = 0;
        cloud.servers.forEach(function(server){
            cloudCPU += server.CPU;
            const
                isMaster = cloud.masterServer === server,
                load = isMaster
                    ? server.CPU <= CFG.loadLevels.master.idle
                        ? 'idle'
                        : server.CPU >= CFG.loadLevels.master.high
                            ? 'high'
                            : 'normal'
                    : server.CPU <= CFG.loadLevels.regular.idle
                        ? 'idle'
                        : server.CPU >= CFG.loadLevels.regular.high
                            ? 'high'
                            : 'normal';
            servers.push({
                name       : server.name,
                ip         : server.ip,
                id         : server.id,
                components : server.components,
                cpu        : server.CPU,
                load       : load
            });

            if ( load === 'idle' ) idles.push(server.ip);
            else if ( load === 'high' ) highs.push(server.ip)
            else normals.push(server.ip)
        });

        cloudCPU = cloudCPU / cloud.servers.length;
        const cloudLevel = cloudCPU <= CFG.loadLevels.regular.idle
                    ? 'idle'
                    : cloudCPU >= CFG.loadLevels.regular.high
                        ? 'high'
                        : 'normal';

        return {
            servers : servers,
            cloud : {
                tenantsMap : JSON.stringify(cloud.tenants.map),
                master     : cloud.masterServer.name,
                CPU        : cloudCPU,
                level      : cloudLevel,
                idles      : idles,
                normals    : normals,
                highs      : highs
            }
        };
    },

    balance : function () {
        const
            tasks = [],
            dump = cloud.dump();

        if ( dump.cloud.level === 'idle' ) {
            dump.cloud.idles.forEach(function(ip){
                tasks.push(cloud.removeInstance(cloud.mapIpToServer[ip]));
            });
        }

        return Q.all(tasks);
    }
};

cloud.init()
.then(function(){
    return cloud.createInstance({components:['dev', 'dep'], tenants : ['com', 'test']})
    .then(function(){
        console.log('------------------------------ created');
        console.log(cloud.dump());

        setInterval(function(){
            cloud.balance().then(function(){
                console.log('---------------------------------- balanced :');
                console.log(cloud.dump());
            })
            .done();
        }, 60000);
    })

    //        AR.get({
    //            url : 'http://localhost:40009/stat/'+encodeURIComponent(server.ip)
    //        })
    //        .then(function(res){
    //            console.log('\n\nSTAT : ', res.body.toString('utf8'));
    //        })


})
.done();


function getMyLocalIP () {
    const D = Q.defer();
    require('child_process').exec('hostname -I', {timeout:5000}, function (error, stdout, stderr){
        error || stderr
            ? D.reject(error || stderr)
            : D.resolve(stdout.replace(/[\s\r\n]+$/, ''));
    });
    return D.promise;
}
