// if you need to change any of these settings
// create your own config file using this settings as an example;
// ( module.exports = { tenantsMapPath : ..., ... }; )
// your custom config MUST exports object with ALL parameters from this one;
// place it to some shared volume,
// then set environment variable 'DFX_LB_config_path' to its absolute path;
// enjoy


const
    fs = require('fs'),
    pathToConfig = process.env['DFX_LB_config_path'];

global.CFG = pathToConfig && require(pathToConfig) || {

    events : null, // reserved
    tenantsMapPath : '/var/lib/dreamface/data/tenants.map',
    instanceImageName : 'dfx',
    statServer : {
        url : 'http://127.0.0.1:40009/stat/',
    },
    dfm : {
        port      : 3049,
        prototcol : 'http',
        camtime   : 5,
    },
    my : {
        port : 3050,
        protocol : 'http', // TODO use it while creating server
    },
    WAIT_FOR_DFMUP : 10000,
    WAIT_FOR_CUP   : 10000,
    loadLevels : {
        regular : {
            idle : 1,
            high : 8
        },
        master : {
            idle : -1,
            high : 4
        }
    },
    balanceEvery : 30000, // set it the same as lib/statServer SPERIOD
    docker_daemon : {
        useDefaultSettings: false,
        protocol: 'https',
        checkServerIdentity : false,
        host : '192.168.99.100',
        port : process.env.DOCKER_PORT || 2376,
        ca   : fs.readFileSync('/var/lib/dreamface/data/lbdata/docker.certs/ca.pem').toString('utf8'),
        cert : fs.readFileSync('/var/lib/dreamface/data/lbdata/docker.certs/cert.pem').toString('utf8'),
        key  : fs.readFileSync('/var/lib/dreamface/data/lbdata/docker.certs/key.pem').toString('utf8')
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
                    "host" : "192.168.0.100",
                    "port" : 27017
                },
                //"X-DREAMFACE-SERVER" : cloud.servers[0].name,
                "redis_config" : {
                    "host" : "192.168.0.100"
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
                    "host" : "192.168.0.100"
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
                            "address"        : "http://localhost:3000/",
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




kill 24663; kill 24871; kill 24874; kill 24883; kill 24979; kill 24982; kill 25040;
