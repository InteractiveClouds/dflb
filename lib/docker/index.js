const
    Docker = require('dockerode'),
    Q      = require('q'),
    out = {};

var docker;

exports.init = function(settings) {

    const opts = {};
    
    if (settings.docker_daemon.host) opts.host = settings.docker_daemon.host;
    if (settings.docker_daemon.port) opts.port = settings.docker_daemon.port;
    if (settings.docker_daemon.ca)   opts.ca   = settings.docker_daemon.ca;
    if (settings.docker_daemon.cert) opts.cert = settings.docker_daemon.cert;
    if (settings.docker_daemon.key)  opts.key  = settings.docker_daemon.key;
    
    
    if ( Object.keys(opts).length ) {
        docker = new Docker(opts);
    } else {
        throw(Error('no docker options are set'));
    }

    delete module.exports.init;
    for ( var method in out ) exports[method] = out[method];
    return exports;
};

out.run = function() {
    const
        D = Q.defer(),
        opts = Array.prototype.slice
                .call(arguments)
                .concat(function (error, data, container) {
                        return error ? D.reject(error) : D.resolve({data:data,container:container});
                    });


    docker.run.apply(docker, opts);

    return D.promise;
};

out.createContainer = function( o ) {
    var D = Q.defer();
        docker.createContainer(o, function (err, container) {
            return err ? D.reject(err)
                       : D.resolve(container);
        });
    return D.promise;
};

out.startContainer = function( id ) {
    var container = docker.getContainer(id);
    var D = Q.defer();
        container.start(function (err, res) {
            if ((!res) && (!err)) res = "Started";
            return err ? D.reject(err)
                       : D.resolve(res);
        });
    return D.promise;
};

out.removeContainer = function( id ) {
    var container = docker.getContainer(id);
    var D = Q.defer();
    container.remove(function (err, res) {
        if ((!res) && (!err)) res = "Removed";
        return err ? D.reject(err)
            : D.resolve(res);
    });
    return D.promise;
};

out.inspectContainer = function( id ) {
    var container = docker.getContainer(id);
    var D = Q.defer();
    container.inspect(function (err, res) {
        return err ? D.reject(err)
            : D.resolve(res);
    });
    return D.promise;
};

out.stopContainer = function( id ) {
    var container = docker.getContainer(id);
    var D = Q.defer();
    container.stop(function (err, res) {
        return err ? D.reject(err)
            : D.resolve(res);
    });
    return D.promise;
};

out.listContainers = function() {
    const D = Q.defer();
    docker.listContainers(function (err, containers) {
        err
            ? D.reject(err)
            : D.resolve(containers);
    });
    return D.promise;
};
