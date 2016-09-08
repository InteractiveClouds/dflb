// PAPI is abbreviation for -- Provider API
// now it works only with docker,
// in future it can be enhanced with real cloud providers API
// but it is awaited to export the same interface for the providers

const
    Q = require('q'),

    INSTANCE_PREFIX = 'DFX_LB_COMPS_INSTANCE_',
    RGX_PARSE_INSTANCE_NAME  = new RegExp('^' + INSTANCE_PREFIX + '(.+)$');

var docker;

exports.init = function (settings) {
    
    docker = require('../docker/index.js').init(settings);

    delete exports.init;

    exports.createInstance = createInstance;
    exports.removeInstance = removeInstance;
    exports.listInstances  = listInstances;

    return exports;
};

function removeInstance ( id ) {
    return docker.stopContainer(id)
    .then(function(){
        return docker.removeContainer(id);
    });
}

function listInstances () {
    return docker.listContainers()
    .then(function(list){
        var res = [];
        list.forEach(function(item){
            var instanceName = (RGX_PARSE_INSTANCE_NAME.exec(
                item.Names[0].replace(/^\//, '')
            ) || [])[1];
            if ( instanceName ) res.push({
                id   : item.Id,
                ip   : item.NetworkSettings.Networks.bridge.IPAddress,
                name : instanceName
            });
        });
        return res;
    });
}

function createInstance ( o ) {
    const
        instanceName = RGX_PARSE_INSTANCE_NAME.test(o.name)
            ? o.name
            : INSTANCE_PREFIX + o.name,
        opts = {
            'Image'        : o.image,
            'Cmd'          : 'invoke',
            'name'         : instanceName,
            'VolumesFrom'  : ['dfx_data'],
            //'ExposedPorts' : {
            //    '3000/tcp': {},
            //    '3001/tcp': {},
            //    '3002/tcp': {},
            //    '3003/tcp': {},
            //},
            'Env' : [
                 'DFM_camtime=' + o.dfm.camtime,
                 'DFM_notifications_URL=' + o.dfm.notifyURL
            ]
        };

    if ( o.dfm.bindPort ) opts.PortBindings = {
        '3049/tcp': [{ 'HostPort': o.dfm.bindPort }]
    };

    return docker.createContainer(opts)
    .then(function(container){
        const D = Q.defer();

        container.start(function(error){
            if ( error ) return D.reject(error);
            container.inspect(function(error, cfg){
                if ( error ) return D.reject(error);
                D.resolve({
                    id   : cfg.Id,
                    ip   : cfg.NetworkSettings.IPAddress,
                    name : o.name
                });
            });
        });

        return D.promise;
    });
}
