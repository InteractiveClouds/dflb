const
    docker = require('../docker/index.js'),
    Q      = require('q');

function runInstance ( o ) {
    const opts = {
            'Image'        : o.image,
            'Cmd'          : 'invoke',
            'name'         : o.name,
            'VolumesFrom'  : ['dfx_data'],
            'ExposedPorts' : {
                '3000/tcp': {},
                '3001/tcp': {},
                '3002/tcp': {},
                '3003/tcp': {},
            },
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
                D.resolve(cfg.NetworkSettings.IPAddress);
            });
        });

        return D.promise;
    });
}

exports.runInstance = runInstance;
