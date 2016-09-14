const
    Q = require('q'),
    path = require('path');

process.env['DFX_LB_config_path'] = path.join(__dirname, 'config.js');

require('../../config');

const
    cloud = require('../../cloud'),
    originals = {
        dump : cloud.dump,
        removeInstance : cloud.removeInstance,
    };

cloud.U     = require('../../lib/utils/utils.js'),
//cloud.AR    = require('./lib/authRequest').getRequestInstance({});
//cloud.NGINX = require('./lib/NGINX');
//cloud.PAPI  = require('./lib/PAPI').init({ docker_daemon : CFG.docker_daemon });
//cloud.modem = require('./lib/modem');

describe('balance', function(){

    it('should resolve if there are nor overloaded nor idle servers', function(done){
        cloud.dump = function () {
            return {
                servers: [
                    {
                        name: 'Gottlieb_Daimler',
                        ip: '172.17.0.3',
                        id: '1',
                        components: {},
                        cpu: 0,
                        load: 'normal'
                    }
                ],
                cloud: {
                    tenantsMap: null,
                    master: 'Gottlieb_Daimler',
                    CPU: 0,
                    level: 'idle',
                    idles: [],
                    normals: [ '172.17.0.3' ],
                    highs: []
                }
            };
        };

        cloud.balance()
        .then(done, done)
    });

    it('should invoke `removeInstance` method with link to server if there is idle server', function(done){
        const idleServer = {};
        var invoked = false;

        cloud.mapIpToServer = {
            '172.17.0.3' : idleServer
        };

        cloud.dump = function () {
            return {
                servers: [
                    {
                        name: 'Gottlieb_Daimler',
                        ip: '172.17.0.3',
                        id: '1',
                        components: {},
                        cpu: 0,
                        load: 'normal'
                    }
                ],
                cloud: {
                    tenantsMap: null,
                    master: 'Gottlieb_Daimler',
                    CPU: 0,
                    level: 'idle',
                    idles: [ '172.17.0.3' ],
                    normals: [],
                    highs: []
                }
            };
        };

        cloud.removeInstance = function (server) {
            if (server === idleServer) invoked = true;
            else invoked = new Error('wrong link')
        };

        cloud.balance()
        .then(
            function(){
                if ( invoked instanceof Error ) return done(invoked);
                else if ( invoked === false ) done(Error('not invoked'));
                done();
            },
            done
        )
    });

    it('method `_getFreeServers` should return `normal` or `idle` servers in descending order of their cpu values', function(done){
        const
            s1 = {},
            s2 = {},
            s3 = {},
            
            ds1 = {
                    name: 'one',
                    ip: '172.17.0.1',
                    id: '1',
                    components: {},
                    cpu: 10,
                    load: 'normal'
                },
            ds2 = {
                    name: 'two',
                    ip: '172.17.0.2',
                    id: '2',
                    components: {},
                    cpu: 40,
                    load: 'normal'
                },
            ds3 = {
                    name: 'three',
                    ip: '172.17.0.3',
                    id: '3',
                    components: {},
                    cpu: 60,
                    load: 'normal'
                };

        cloud.mapIpToServer = {
            '172.17.0.1' : s1,
            '172.17.0.2' : s2,
            '172.17.0.3' : s3,
        };

        cloud.masterServer = s1;

        cloud.dump = function () {
            return {
                servers: [

                ],
                mapServerByIP : {
                    '172.17.0.1' : ds1,
                    '172.17.0.2' : ds2,
                    '172.17.0.3' : ds3,
                },
                cloud: {
                    tenantsMap: null,
                    master: 'one',
                    CPU: 0,
                    level: 'idle',
                    idles: [ '172.17.0.3' ],
                    normals: [ '172.17.0.2', '172.17.0.1' ],
                    highs: []
                }
            };
        };

        const l = cloud._getFreeServers(cloud.dump());
        if ( l.length === 3 && l[0] === ds2 && l[1] === ds1 && l[2] === ds3 ) done();
        else done(JSON.stringify(l, null, 4));
    });

    it('method `_getFreeServers` should return empty array if there are no appropriate servers ( at least 0.1 of highest allowed cpu value is free )', function(done){
        const
            s1 = {},
            s2 = {},
            s3 = {},
            
            ds1 = {
                    name: 'one',
                    ip: '172.17.0.1',
                    id: '1',
                    components: {},
                    cpu: 55,
                    load: 'normal'
                },
            ds2 = {
                    name: 'two',
                    ip: '172.17.0.2',
                    id: '2',
                    components: {},
                    cpu: 92,
                    load: 'normal'
                },
            ds3 = {
                    name: 'three',
                    ip: '172.17.0.3',
                    id: '3',
                    components: {},
                    cpu: 95,
                    load: 'normal'
                };

        cloud.mapIpToServer = {
            '172.17.0.1' : s1,
            '172.17.0.2' : s2,
            '172.17.0.3' : s3,
        };

        cloud.masterServer = s1;

        cloud.dump = function () {
            return {
                servers: [

                ],
                mapServerByIP : {
                    '172.17.0.1' : ds1,
                    '172.17.0.2' : ds2,
                    '172.17.0.3' : ds3,
                },
                cloud: {
                    tenantsMap: null,
                    master: 'one',
                    CPU: 0,
                    level: 'idle',
                    idles: [ '172.17.0.3' ],
                    normals: [ '172.17.0.2', '172.17.0.1' ],
                    highs: []
                }
            };
        };

        const l = cloud._getFreeServers(cloud.dump());
        if ( l.length === 0 ) done();
        else done(JSON.stringify(l, null, 4));
    });

    it('should …', function(done){
        var
            s1 = {
                    name: 'one',
                    ip: '172.17.0.1',
                    id: '1',
                    components: {},
                    cpu: 90,
                    load: 'high'
                },
            s2 = {
                    name: 'two',
                    ip: '172.17.0.2',
                    id: '2',
                    components: {},
                    cpu: 75,
                    load: 'normal'
                },
            s3 = {
                    name: 'three',
                    ip: '172.17.0.3',
                    id: '3',
                    components: {},
                    cpu: 50,
                    load: 'normal'
                };
            
            ds1 = {
                    name: 'one',
                    ip: '172.17.0.1',
                    id: '1',
                    components: {},
                    cpu: 90,
                    isMaster : true,
                    load: 'high'
                },
            ds2 = {
                    name: 'two',
                    ip: '172.17.0.2',
                    id: '2',
                    components: {},
                    cpu: 75,
                    isMaster : false,
                    load: 'normal'
                },
            ds3 = {
                    name: 'three',
                    ip: '172.17.0.3',
                    id: '3',
                    components: {},
                    cpu: 50,
                    isMaster : false,
                    load: 'normal'
                };

        cloud.mapIpToServer = {
            '172.17.0.1' : s1,
            '172.17.0.2' : s2,
            '172.17.0.3' : s3,
        };

        cloud.masterServer = s1;

        var dump = {
                servers: [ ds1, ds2, ds3 ],
                mapServerByIP : {
                    '172.17.0.1' : ds1,
                    '172.17.0.2' : ds2,
                    '172.17.0.3' : ds3,
                },
                cloud: {
                    tenantsMap: null,
                    master: 'one',
                    CPU: (ds1+ds2+ds3)/3,
                    level: 'normal',
                    idles: [],
                    normals: ['172.17.0.2', '172.17.0.3'],
                    highs: ['172.17.0.1']
                }
            };

        cloud.dump = function () {
            return dump;
        };

        cloud.statServer.getStat = function () {
            return Q({
                '172.17.0.1' : {
                    _tenantsWeights : {
                        't1' : 0.6, // 54%
                        't2' : 0.3, // 27%
                        't3' : 0.1, // 9%
                        '*'  : 0
                    }
                },
                '172.17.0.2' : {
                    _tenantsWeights : {
                        't4' : 1,
                    }
                },
                '172.17.0.3' : {
                    _tenantsWeights : {
                        't5' : 1,
                    }
                },
            });
        };

        cloud.tenants = {
            map : {
                dev : { '*' : '172.17.0.1' },
                dep : { '*' : '172.17.0.1' },
                dfc : { '*' : '172.17.0.1' }
            }
        }

        cloud.NGINX = {};
        cloud.NGINX.changeConfig = function ( map ) {
            console.log('[TEST_BALANCE] config changed to ', map);
            return Q.resolve();
        };

        cloud.createInstance = function ( o ) {
            console.log('[TEST_BALANCE] created new server with tenants : ', o.tenants);
            return Q.resolve();
        };

        cloud.balance().then(function(){
            console.log(JSON.stringify(dump,null, 4));
            done();
        })
        .fail(done);
    });
});
