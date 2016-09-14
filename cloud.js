const
    Q = require('q'),
    COMPS_LIST = Object.keys(CFG.cConfigs),
    serversList = {};

//var bindPort = 4001;

function Server ( o ) {

    o = o || {};

    const
        server = this,
        started = Q.defer();

    server.name = cloud.U.serverNames.markAsAssigned(o.name) || cloud.U.serverNames.get();

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
            cloud.U.convertToEventName('CPU', server.ip),
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
    cloud.PAPI.createInstance({
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
            cloud.U.convertToEventName('CPU', server.ip),
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
            cloud.U.convertToEventName('DFMUP', server.ip),
            function onDFMUP (event, data){
                clearTimeout(timeout);
                console.log('server %s sent DFMUP', server.ip);
                CFG.events.unsubscribe(cloud.U.convertToEventName('DFMUP', server.ip), onDFMUP);

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
        cloud.AR.post({
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
        cloud.AR.post({
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
                eventName = cloud.U.convertToEventName('CUP', server.ip),
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

    return cloud.AR.get({
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
        return cloud.PAPI.removeInstance(server.id)
        .then(function(){
            delete serversList[server.name];
        })
    })
};


const cloud = {};

cloud.isReorganizing = true;
cloud.servers = [];
cloud.mapIpToServer = {};
cloud.tenants = {}; // .map = {}

cloud.createInstance = function ( config ) {
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
        return cloud.NGINX.changeConfig(map);
    });
};

cloud.includeInstance = function ( item ) {
    return (new Server(item)).then(function(server){
        cloud.mapIpToServer[server.ip] = server;
        cloud.servers.push(server);
    });
};

cloud.removeInstance = function ( server ) {
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
            return cloud.NGINX.changeConfig(cloud.tenants.map);
        }
    })
};

cloud.init = function ( o ) {

    delete cloud.init;

    cloud.modem = o.modem;
    cloud.U     = o.U;
    cloud.AR    = o.AR;
    cloud.NGINX = o.NGINX;
    cloud.PAPI  = o.PAPI;

    return cloud.U.getMyLocalIP().then(function(ip){
        console.log('my IP is ', ip);
        CFG.my.localIP = ip;

        return Q.all([

            cloud.NGINX.readConfig().then(function(map){
                cloud.tenants.map = map;
            }),

            cloud.PAPI.listInstances().then(function(list){
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
};

cloud.dump = function () {
    const
        idles   = [],
        highs   = [],
        normals = [],
        servers = [],
        mapServerByIP = {};

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

        servers.push(mapServerByIP[server.ip] = {
            name       : server.name,
            ip         : server.ip,
            id         : server.id,
            components : server.components,
            cpu        : server.CPU,
            isMaster   : isMaster,
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
        mapServerByIP : mapServerByIP,
        cloud : {
            tenantsMap : JSON.parse(JSON.stringify(cloud.tenants.map)),
            master     : cloud.masterServer.name,
            CPU        : cloudCPU,
            level      : cloudLevel,
            idles      : idles,
            normals    : normals,
            highs      : highs
        }
    };
};

cloud.statServer = {
    getStat : function () {
        return cloud.modem.stat_all_servers().then(function(stat){

            const ips = Object.keys(stat);

            for ( var i = 0, l = ips.length; i < l; i++ ) {
                var serv = stat[ips[i]];
                serv._totalForServer = 0;
                serv._totalPerTenant = {};
                serv._tenantsWeights = {};

                for ( var k = 0, cl = COMPS_LIST.length; k < cl; k++ ) {
                    var compName = compName = COMPS_LIST[k],
                        comp = serv[compName];
                    if ( !comp ) continue;
                    for ( var tenant in comp ) {
                        var quantity = comp[tenant];
                        serv._totalForServer += quantity;

                        serv._totalPerTenant[tenant] =
                            (serv._totalPerTenant[tenant] || 0) + quantity;
                    }
                }

                Object.keys(serv._totalPerTenant).forEach(function(tenant){
                    serv._tenantsWeights[tenant] = (
                        (serv._totalPerTenant[tenant] || 0) / serv._totalForServer
                    ) || 0;
                });
            }

            return stat;
        });
    }
};


cloud.balance = (function(){
    return function () {
        const dump = cloud.dump();

        return dump.cloud.highs.length || dump.cloud.idles.length
            ? unloadOverloaded(dump).then(removeIdles)
            : Q.resolve();
    }

    function removeIdles (dump){
        return Q.all(dump.cloud.idles.map(function(ip){
            return cloud.removeInstance(cloud.mapIpToServer[ip]);
        }));
    }

    function unloadOverloaded (dump){
        const highs = dump.cloud.highs;

        if ( !highs.length ) return Q.resolve(dump);

        return cloud.statServer.getStat()
        .then(function(stat){
            var toAllocate = [];

            dump._newMap = {remove:{}, add:{}}

            highs.forEach(function(ip){
                const
                    CPUPerTenant = [],
                    server = cloud.mapIpToServer[ip],
                    dserver = dump.mapServerByIP[server.ip],
                    totalServerCPU = server.cpu,
                    isMaster = dserver.isMaster,
                    role = isMaster ? 'master' : 'regular',
                    weights = stat[ip]._tenantsWeights;

                var element,
                    toLeft = [],
                    maxCPUValue = CFG.loadLevels[role].high * 10;

                for ( var tenant in weights ) {
                    element = {
                        ip     : ip,
                        tenant : tenant,
                        cpu    : totalServerCPU * weights[tenant]
                    };

                    if ( isMaster && tenant === '*' ) {
                        toLeft.push(element);
                        maxCPUValue -= element.cpu;
                    } else CPUPerTenant.push(element);
                }


                if ( maxCPUValue > 0 ) cloud.U.findSubsetForSum(
                    CPUPerTenant,
                    toLeft,
                    maxCPUValue,
                    function ( obj ) { return obj.cpu }
                );

                if ( isMaster ) toLeft = [{tenant:'*'}];

                dump._newMap.add[ip]    = toLeft.map(function(item){return item.tenant});
                dump._newMap.remove[ip] = CPUPerTenant.map(function(item){
                    dserver.cpu -= item.cpu;
                    return item.tenant
                });

                cloud._updateLoadLabel_dumped(dserver, dump);

                toAllocate = toAllocate.concat(CPUPerTenant);
            });

            const freeServers = cloud._getFreeServers(dump);

            dump.__toAllocate = toAllocate;
            dump.__freeServers = freeServers;

            freeServers.forEach(function(dserver, index){
                var toMove = [];

                cloud.U.findSubsetForSum(
                    toAllocate,
                    toMove,
                    dserver._leftCPU,
                    function ( item ) { return item.cpu }
                );

                if ( !toMove.length ) return;

                dump._newMap.add[dserver.ip] = toMove.map(function(item){
                    dserver.cpu      += item.cpu;
                    dserver._leftCPU -= item.cpu;

                    return item.tenant;
                });

                cloud._updateLoadLabel_dumped(dserver, dump);
            });

            if ( !toAllocate.length ) return updateNGINX(dump); // successfully redistributed

            const newServers = [];

            while ( toAllocate.length ) {

                var toCreate = [];
                
                cloud.U.findSubsetForSum(
                    toAllocate,
                    toCreate,
                    CFG.loadLevels.regular.high * 10 * 0.9,
                    function ( item ) { return item.cpu }
                );

                newServers.push({
                    tenants : toCreate.map(function(item){return item.tenant})
                });
            }

            dump._toCreate = newServers;

            return createNewServers(dump).then(updateNGINX);
        });
    }

    function createNewServers (dump) {
        return Q.all(dump._toCreate.map(function(item){
            return cloud.createInstance({
                components : ['dev', 'dep', 'dfc'],
                tenants    : item.tenants
            })
        }))
        .then(function(){ return dump });
    }
    function updateNGINX (dump) {

        const
            toRm = Object.keys(dump._newMap.remove),
            toAdd = Object.keys(dump._newMap.add);

        var
            map = cloud.tenants.map;

        toRm.forEach(function(ip){
            dump._newMap.remove[ip].forEach(function(tenant){
                delete map.dev[tenant];
                delete map.dep[tenant];
                delete map.dfc[tenant];
            });
        });

        toAdd.forEach(function(ip){
            dump._newMap.add[ip].forEach(function(tenant){
                map.dev[tenant] = ip;
                map.dep[tenant] = ip;
                map.dfc[tenant] = ip;
            });
        });

        return cloud.NGINX.changeConfig(map).then(function(){
            return dump
        });
    }
})();

cloud._updateLoadLabel_dumped = function (server, dump) {
    const
        role = cloud.masterServer === cloud.mapIpToServer[server.ip]
                ? 'master'
                : 'regular',
        loadWas = server.load;

    server.load = server.cpu <= CFG.loadLevels[role].idle * 10
            ? 'idle'
            : server.cpu >= CFG.loadLevels[role].high * 10
                ? 'high'
                : 'normal';
    
    if ( loadWas !== server.load ) {
        dump.cloud[loadWas+'s'].splice(dump.cloud[loadWas+'s'].indexOf(server.ip), 1);
        dump.cloud[server.load+'s'].push(server.ip);
    }
};

cloud._getFreeServers = function (dump) {
    return [].concat(dump.cloud.normals, dump.cloud.idles)
                .map(function(ip){
                    const
                        server = cloud.mapIpToServer[ip],
                        role = server === cloud.masterServer
                                ? 'master'
                                : 'regular',
                        maxCPU = CFG.loadLevels[role].high * 10;
                        dserver = dump.mapServerByIP[ip];
    
                    dserver._leftCPU = maxCPU * 0.9 - dserver.cpu;
    
                    return dserver;
                })
                .filter(function(item){ return item._leftCPU > 0 })
                .sort(function(a, b){ b._leftCPU - a._leftCPU });
};

cloud.startBalancing = function () {
    setInterval(function(){
        cloud.balance().fail(function(erro){
            console.error('could not balance : ', error);
        })
    }, CFG.balanceEvery);
};

module.exports = cloud;
