var SETTINGS   = require('./settings'),
    Docker     = require('dockerode'),
    Q          = require('q'),
    docker,
    opts = {};

if (SETTINGS.docker_daemon.host) opts.host = SETTINGS.docker_daemon.host;
if (SETTINGS.docker_daemon.port) opts.port = SETTINGS.docker_daemon.port;
if (SETTINGS.docker_daemon.ca)   opts.ca   = SETTINGS.docker_daemon.ca;
if (SETTINGS.docker_daemon.cert) opts.cert = SETTINGS.docker_daemon.cert;
if (SETTINGS.docker_daemon.key)  opts.key  = SETTINGS.docker_daemon.key;


if ( Object.keys(opts).length ) {
    console.log('Dockerization is ON with custom settings: ', {
        host : opts.host || '',
        port : opts.port || '',
        ca   : opts.ca   ? 'is set' : 'is not set',
        cert : opts.cert ? 'is set' : 'is not set',
        key  : opts.key  ? 'is set' : 'is not set'
    });
    docker = new Docker(opts);
} else if ( SETTINGS.docker_daemon.useDefaultSettings ) {
    console.log('Dockerization is ON with default settings');
    docker = new Docker();
} else {
    exports.isOFF = true;
    console.log('Dockerization is OFF.');
}

var Docker = {};

Docker.run = function() {
    const
        D = Q.defer(),
        opts = Array.prototype.slice
                .call(arguments)
                .concat(function (error, data, container) {
                        return error ? D.reject(error) : D.resolve(container);
                    });


    docker.run.apply(docker, opts);

    return D.promise;
};

Docker.createContainer = function( o ) {
    var D = Q.defer();
        docker.createContainer(o, function (err, container) {
            return err ? D.reject(err)
                       : D.resolve(container);
        });
    return D.promise;
};

Docker.startContainer = function( id ) {
    var container = docker.getContainer(id);
    var D = Q.defer();
        container.start(function (err, res) {
            if ((!res) && (!err)) res = "Started";
            return err ? D.reject(err)
                       : D.resolve(res);
        });
    return D.promise;
};

Docker.removeContainer = function( id ) {
    var container = docker.getContainer(id);
    var D = Q.defer();
    container.remove(function (err, res) {
        if ((!res) && (!err)) res = "Removed";
        return err ? D.reject(err)
            : D.resolve(res);
    });
    return D.promise;
};

Docker.inspectContainer = function( id ) {
    var container = docker.getContainer(id);
    var D = Q.defer();
    container.inspect(function (err, res) {
        return err ? D.reject(err)
            : D.resolve(res);
    });
    return D.promise;
};

Docker.stopContainer = function( id ) {
    var container = docker.getContainer(id);
    var D = Q.defer();
    container.stop(function (err, res) {
        return err ? D.reject(err)
            : D.resolve(res);
    });
    return D.promise;
};


module.exports = Docker;
